// TigoMeNote · moderation-fast (Supabase Edge Function, verify_jwt = off)
// Reports ng users at review ng admin. Files: index.ts + notify.ts (sinasabihan ang may-ari kapag itinago, tinanggal o binigyan ng strike).
// Actions:
//   report  (lahat ng user)  → mag-report ng post / comment / user / story
//   queue, resolve, count    → Admin lang
// Patakaran:
//   - Isang report bawat tao bawat target; hanggang 30 report bawat araw.
//   - Kusang itinatago ang post/comment/story kapag: may report na "child_safety", o 3+ magkakaibang tao ang nag-report.
//   - Ang may-ari lang ang nakakakita ng nakatagong content (may "Under review"), habang tinitingnan ng admin.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { notify } from "./notify.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const BUCKET = "post-media";
const REASONS = ["violence", "nudity", "crime", "firearms", "harassment", "hate", "child_safety", "self_harm", "spam", "other"];
const TYPES = ["post", "comment", "user", "story"];
const AUTO_HIDE_REPORTS = 3;
const REPORTS_PER_DAY = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400, x: Record<string, unknown> = {}) => reply({ ok: false, error: e, ...x }, s);
const nowIso = () => new Date().toISOString();

const enc = new TextEncoder();
async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(*)")
    .eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}
const PUB = "id, username, display_name, avatar_url";
const isUuid = (s: string) => /^[0-9a-f-]{36}$/.test(s);
const TABLE: Record<string, string> = { post: "posts", comment: "post_comments", story: "stories" };

// Sino ang may-ari ng target (null kung wala na)
async function ownerOf(type: string, id: string): Promise<string | null> {
  if (type === "user") {
    const { data } = await db.from("users").select("id").eq("id", id).maybeSingle();
    return data ? data.id : null;
  }
  const { data } = await db.from(TABLE[type]).select("user_id").eq("id", id).maybeSingle();
  return data ? data.user_id : null;
}
async function log(actor: string | null, action: string, type: string, id: string, userId: string | null, reason?: string | null, note?: string | null) {
  await db.from("moderation_log").insert({ actor_id: actor, action, target_type: type, target_id: id, user_id: userId, reason: reason ?? null, note: note ?? null });
}
// Sabihan ang may-ari ng desisyon (laging naka-on; hindi ito mapapatay sa settings)
const WHAT: Record<string, string> = { post: "post", comment: "comment", story: "status", user: "account" };
const WHY: Record<string, string> = {
  violence: "violence", nudity: "nudity", crime: "drugs or crime", firearms: "illegal firearms", harassment: "harassment",
  hate: "hate speech", child_safety: "child safety", self_harm: "self-harm", spam: "spam", other: "other", admin: "review",
};
async function tellOwner(owner: string | null, action: string, type: string, id: string, reason?: string | null) {
  if (!owner) return;
  const what = WHAT[type] ?? type, why = reason ? ` (${WHY[reason] ?? reason})` : "";
  const body: Record<string, string> = {
    auto_hide: `Your ${what} is hidden while we review reports${why}.`,
    hide: `Your ${what} was hidden because it may break our Community Guidelines${why}.`,
    delete: `Your ${what} was removed for breaking our Community Guidelines${why}. This counts as a strike.`,
    warn: `You received a warning (strike) for breaking our Community Guidelines${why}.`,
    restore: `Your ${what} is visible again after review.`,
  };
  if (!body[action]) return;
  await notify(db, { to: owner, type: "moderation", post: type === "post" && action !== "delete" ? id : null, body: body[action], data: { action, target: type, reason: reason ?? null } });
}
async function isHidden(type: string, id: string) {
  if (type === "user") return false;
  const { data } = await db.from(TABLE[type]).select("hidden_at").eq("id", id).maybeSingle();
  return !!data?.hidden_at;
}
async function setHidden(type: string, id: string, on: boolean, reason?: string) {
  if (type === "user") return;
  const ch: Record<string, unknown> = { hidden_at: on ? nowIso() : null };
  if (type === "post") ch.hidden_reason = on ? (reason ?? null) : null;
  await db.from(TABLE[type]).update(ch).eq("id", id);
}

// ---------- user ----------
// deno-lint-ignore no-explicit-any
async function report(p: any, me: any) {
  const type = String(p.target_type || ""), id = String(p.target_id || ""), reason = String(p.reason || "");
  if (!TYPES.includes(type) || !isUuid(id)) return fail("Invalid report.");
  if (!REASONS.includes(reason)) return fail("Choose a reason.");
  const owner = await ownerOf(type, id);
  if (!owner) return fail("Not found. It may have been deleted.", 404);
  if (owner === me.id) return fail("You can't report your own content.");
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= REPORTS_PER_DAY) return fail("You've sent a lot of reports today. Please try again tomorrow.", 429);
  const note = String(p.note ?? "").trim().slice(0, 500) || null;
  const { error } = await db.from("reports").insert({ reporter_id: me.id, target_type: type, target_id: id, owner_id: owner, reason, note });
  if (error) { if (error.code === "23505") return reply({ ok: true, already: true }); throw error; }
  // Kusang itago kung kailangan
  let hidden = false;
  if (type !== "user") {
    const { data: open } = await db.from("reports").select("reporter_id, reason").eq("target_type", type).eq("target_id", id).eq("status", "open").not("reporter_id", "is", null);
    const people = new Set((open ?? []).map((r) => r.reporter_id)).size;
    if (reason === "child_safety" || people >= AUTO_HIDE_REPORTS) {
      await setHidden(type, id, true, reason);
      await log(null, "auto_hide", type, id, owner, reason, `${people} report(s)`);
      await tellOwner(owner, "auto_hide", type, id, reason);
      hidden = true;
    }
  }
  return reply({ ok: true, hidden });
}

// ---------- admin ----------
// deno-lint-ignore no-explicit-any
const isAdmin = (me: any) => me.role === "Admin";

// deno-lint-ignore no-explicit-any
async function count(_p: any, me: any) {
  if (!isAdmin(me)) return fail("Admins only.", 403);
  const { count } = await db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open");
  return reply({ ok: true, open: count ?? 0 });
}

// Listahan ng mga target na may report, naka-grupo, may preview
// deno-lint-ignore no-explicit-any
async function queue(p: any, me: any) {
  if (!isAdmin(me)) return fail("Admins only.", 403);
  const status = ["open", "actioned", "dismissed"].includes(p.status) ? p.status : "open";
  const { data: rows } = await db.from("reports").select("*").eq("status", status).order("created_at", { ascending: false }).limit(500);
  const groups = new Map<string, Record<string, any>>();
  for (const r of rows ?? []) {
    const k = r.target_type + ":" + r.target_id;
    const g = groups.get(k) ?? { target_type: r.target_type, target_id: r.target_id, owner_id: r.owner_id, reports: [], reasons: {}, auto: false, latest: r.created_at };
    g.reports.push({ id: r.id, reason: r.reason, note: r.note, auto: r.auto, at: r.created_at, reporter_id: r.reporter_id });
    g.reasons[r.reason] = (g.reasons[r.reason] || 0) + 1;
    if (r.auto) g.auto = true;
    groups.set(k, g);
  }
  const list = [...groups.values()].slice(0, 100);
  const userIds = new Set<string>();
  list.forEach((g) => { if (g.owner_id) userIds.add(g.owner_id); g.reports.forEach((r: any) => r.reporter_id && userIds.add(r.reporter_id)); });
  const { data: us } = userIds.size ? await db.from("users").select(PUB + ", status, strikes, role").in("id", [...userIds]) : { data: [] };
  const byId = Object.fromEntries((us ?? []).map((u) => [u.id, u]));
  for (const g of list) {
    g.owner = byId[g.owner_id] ?? null;
    g.reports.forEach((r: any) => { r.reporter = r.reporter_id ? (byId[r.reporter_id] ? { id: byId[r.reporter_id].id, username: byId[r.reporter_id].username } : null) : null; delete r.reporter_id; });
    g.count = g.reports.length;
    g.preview = await preview(g.target_type, g.target_id);
  }
  // Pinakamarami / pinaka-seryoso muna
  const weight = (g: any) => (g.reasons.child_safety ? 1000 : 0) + g.count * 10 + (g.auto ? 1 : 0);
  list.sort((a, b) => weight(b) - weight(a) || (a.latest < b.latest ? 1 : -1));
  return reply({ ok: true, list });
}
async function signed(paths: string[]) {
  if (!paths.length) return {};
  const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  (data ?? []).forEach((s) => { if (s.path && s.signedUrl) out[s.path] = s.signedUrl; });
  return out;
}
async function preview(type: string, id: string) {
  if (type === "post") {
    const { data: post } = await db.from("posts").select("id, caption, visibility, hidden_at, hidden_reason, publish_at, deleted_at").eq("id", id).maybeSingle();
    if (!post) return { gone: true };
    const { data: media } = await db.from("post_media").select("kind, path").eq("post_id", id).order("position");
    const urls = await signed((media ?? []).map((m) => m.path));
    return { ...post, hidden: !!post.hidden_at, media: (media ?? []).map((m) => ({ kind: m.kind, url: urls[m.path] ?? null })) };
  }
  if (type === "comment") {
    const { data: c } = await db.from("post_comments").select("id, body, post_id, hidden_at, deleted_at").eq("id", id).maybeSingle();
    return c ? { ...c, hidden: !!c.hidden_at, gone: !!c.deleted_at } : { gone: true };
  }
  if (type === "story") {
    const { data: s } = await db.from("stories").select("id, kind, path, caption, hidden_at, expires_at").eq("id", id).maybeSingle();
    if (!s) return { gone: true };
    const urls = await signed([s.path]);
    return { id: s.id, kind: s.kind, caption: s.caption, hidden: !!s.hidden_at, url: urls[s.path] ?? null, expires_at: s.expires_at };
  }
  const { data: u } = await db.from("users").select(PUB + ", bio, banner_url, status, strikes").eq("id", id).maybeSingle();
  return u ?? { gone: true };
}

// Desisyon ng admin
// deno-lint-ignore no-explicit-any
async function resolve(p: any, me: any) {
  if (!isAdmin(me)) return fail("Admins only.", 403);
  const type = String(p.target_type || ""), id = String(p.target_id || ""), action = String(p.decision || "");
  if (!TYPES.includes(type) || !isUuid(id)) return fail("Invalid target.");
  const note = String(p.note ?? "").trim().slice(0, 500) || null;
  const owner = (await ownerOf(type, id)) ?? (p.owner_id ? String(p.owner_id) : null);
  const close = async (status: "actioned" | "dismissed") =>
    db.from("reports").update({ status, resolved_at: nowIso(), resolved_by: me.id }).eq("target_type", type).eq("target_id", id).eq("status", "open");
  const strike = async () => {
    if (!owner) return;
    const { data: u } = await db.from("users").select("strikes").eq("id", owner).maybeSingle();
    await db.from("users").update({ strikes: (u?.strikes ?? 0) + 1 }).eq("id", owner);
  };
  if (owner === me.id && (action === "suspend" || action === "warn")) return fail("You can't do this to your own account.");
  const wasHidden = action === "dismiss" || action === "unhide" ? await isHidden(type, id) : false;
  switch (action) {
    case "dismiss":
      await setHidden(type, id, false); await close("dismissed"); break;
    case "hide":
      await setHidden(type, id, true, p.reason ?? "admin"); await close("actioned"); break;
    case "unhide":
      await setHidden(type, id, false); break;
    case "delete":
      if (type === "post") {
        const { data: media } = await db.from("post_media").select("path").eq("post_id", id);
        const paths = (media ?? []).map((m) => m.path);
        if (paths.length) await db.storage.from(BUCKET).remove(paths);
        await db.from("posts").delete().eq("id", id);
      } else if (type === "comment") {
        await db.from("post_comments").update({ deleted_at: nowIso() }).eq("id", id);
      } else if (type === "story") {
        const { data: s } = await db.from("stories").select("path").eq("id", id).maybeSingle();
        if (s) await db.storage.from(BUCKET).remove([s.path]);
        await db.from("stories").delete().eq("id", id);
      } else return fail("Use Suspend for accounts.");
      await strike(); await close("actioned"); break;
    case "warn":
      await strike(); await close("actioned"); break;
    case "suspend": {
      if (!owner) return fail("Account not found.", 404);
      const { data: u } = await db.from("users").select("role").eq("id", owner).maybeSingle();
      if (u?.role === "Admin") return fail("Admins can't be suspended here.", 403);
      await db.from("users").update({ status: "Inactive" }).eq("id", owner);
      await db.from("sessions").update({ revoked_at: nowIso() }).eq("user_id", owner).is("revoked_at", null);
      await strike(); await close("actioned"); break;
    }
    case "unsuspend":
      if (!owner) return fail("Account not found.", 404);
      await db.from("users").update({ status: "Active" }).eq("id", owner).eq("status", "Inactive"); break;
    default:
      return fail("Unknown action.");
  }
  await log(me.id, action, type, id, owner, p.reason ?? null, note);
  if (action === "hide" || action === "delete" || action === "warn") await tellOwner(owner, action, type, id, p.reason ?? null);
  else if (wasHidden) await tellOwner(owner, "restore", type, id);
  return reply({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "report":  return await report(p, me);
      case "count":   return await count(p, me);
      case "queue":   return await queue(p, me);
      case "resolve": return await resolve(p, me);
      default:        return fail("Unknown action.");
    }
  } catch (e) {
    console.error("moderation-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
