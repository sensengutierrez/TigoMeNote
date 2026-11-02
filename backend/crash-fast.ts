// TigoMeNote · crash-fast (Supabase Edge Function, verify_jwt = off) — kalusugan ng app para sa beta: crash, error, bagal, bug report, testers
// Isang trabaho lang: tanggapin ang mga log galing sa apps at ipakita sa Admin (app/admin/beta.html).
// Actions (galing sa app; session token kung naka-sign in):
//   report { app, version, report }                         → crash ng Android (app-mode.js → TMNCrash.take())
//   log    { app, version, device, items:[{ kind: "error"|"slow", page, msg, detail, ms }] }  → app-health.js (hanggang 10 bawat tawag)
//   hello  { app, version, device }                         → tester: huling gamit, ilang araw, ilang beses binuksan (naka-sign in lang)
//   bug    { app, version, device, page, text, detail, shot } → Settings → Report a bug (naka-sign in; 10 bawat araw)
// Actions (Admin lang): stats, list { kind, status, app, q }, testers, resolve { id, status }, remove { id }
// Parehong error = iisang row (fp) na dumadami ang "hits" sa loob ng 7 araw. Binubura ang lampas 30 araw.
// Tables: app_logs, app_testers (sql/103). Files: index.ts lang.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400) => reply({ ok: false, error: e }, s);
const APPS = ["web", "main", "chat", "tigo"];
const DAY = 86_400_000;
const PUB = "id, username, display_name, avatar_url";

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(id, role, status)").eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}
const s = (v: unknown, n: number) => String(v ?? "").replace(/\u0000/g, "").slice(0, n);
const app = (v: unknown) => APPS.includes(String(v)) ? String(v) : "web";
// para sa pagsasama ng parehong error: walang numero, id o query
const norm = (m: string) => m.replace(/https?:\/\/[^\s)]+/g, "<url>").replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<id>").replace(/\d+/g, "#").slice(0, 200);
const path = (p: string) => p.split(/[?#]/)[0].replace(/^.*\/(app|legal|get)\//, "$1/").slice(0, 120);

// deno-lint-ignore no-explicit-any
async function addLog(row: any, dedupe = true) {
  const fp = dedupe ? await sha256Hex([row.kind, row.app, path(row.page || ""), norm(row.message)].join("|")) : crypto.randomUUID();
  if (dedupe) {
    const { data: old } = await db.from("app_logs").select("id, hits").eq("fp", fp).eq("status", "open")
      .gte("last_at", new Date(Date.now() - 7 * DAY).toISOString()).order("last_at", { ascending: false }).limit(1).maybeSingle();
    if (old) {
      await db.from("app_logs").update({ hits: old.hits + 1, last_at: new Date().toISOString(), version: row.version, detail: row.detail, ms: row.ms ?? null, user_id: row.user_id ?? null, device: row.device }).eq("id", old.id);
      return;
    }
  }
  await db.from("app_logs").insert({ ...row, page: row.page ? path(row.page) : null, fp });
}
async function tooMany() {
  const { count } = await db.from("app_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  return (count ?? 0) >= 1500;
}

// ---------- galing sa app ----------
// deno-lint-ignore no-explicit-any
async function report(p: any, me: any) {
  const a = ["main", "chat", "tigo"].includes(p.app) ? p.app : null;
  const rep = s(p.report, 12000);
  if (!a || !rep.trim()) return fail("Nothing to report.");
  if (await tooMany()) return reply({ ok: true, skipped: true });
  const kind = /kind=webview/.test(rep) ? "WebView stopped (memory)" : /kind=crash/.test(rep) ? "App crashed" : "App closed";
  const first = (rep.match(/(?:Exception|Error)[^\n]{0,200}/) || [""])[0];
  await addLog({ kind: "crash", app: a, version: s(p.version, 20) || "?", user_id: me?.id ?? null, page: (rep.match(/page=(\S+)/) || [])[1] || null,
    message: s(kind + (first ? " · " + first : ""), 500), detail: rep, device: s(p.device, 160) || null });
  console.error("app crash", a, p.version, kind);
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function log(p: any, me: any) {
  const items = Array.isArray(p.items) ? p.items.slice(0, 10) : [];
  if (!items.length) return reply({ ok: true });
  if (await tooMany()) return reply({ ok: true, skipped: true });
  for (const it of items) {
    const kind = it?.kind === "slow" ? "slow" : "error";
    const msg = s(it?.msg, 500).trim(); if (!msg) continue;
    const ms = Number(it?.ms);
    await addLog({ kind, app: app(p.app), version: s(p.version, 20) || "?", user_id: me?.id ?? null, page: s(it?.page, 300) || null,
      message: msg, detail: s(it?.detail, 4000) || null, ms: isFinite(ms) ? Math.max(0, Math.min(600_000, Math.round(ms))) : null, device: s(p.device, 160) || null });
  }
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function hello(p: any, me: any) {
  if (!me) return reply({ ok: true });
  const a = app(p.app), today = new Date().toISOString().slice(0, 10), now = new Date().toISOString();
  const { data: t } = await db.from("app_testers").select("*").eq("user_id", me.id).eq("app", a).maybeSingle();
  const base = { version: s(p.version, 20) || "?", device: s(p.device, 160) || null, last_at: now };
  if (!t) await db.from("app_testers").insert({ user_id: me.id, app: a, ...base, last_day: today });
  else await db.from("app_testers").update({ ...base, opens: t.opens + 1, ...(t.last_day < today ? { days: t.days + 1, last_day: today } : {}) }).eq("user_id", me.id).eq("app", a);
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function bug(p: any, me: any) {
  if (!me) return fail("Please sign in again.", 401);
  const text = s(p.text, 500).trim();
  if (text.length < 5) return fail("Tell us a little more about what happened.");
  const { count } = await db.from("app_logs").select("id", { count: "exact", head: true }).eq("kind", "bug").eq("user_id", me.id).gte("created_at", new Date(Date.now() - DAY).toISOString());
  if ((count ?? 0) >= 10) return fail("You've sent 10 reports today. Thank you! Please try again tomorrow.", 429);
  const shot = typeof p.shot === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(p.shot) && p.shot.length <= 400_000 ? p.shot : null;
  await addLog({ kind: "bug", app: app(p.app), version: s(p.version, 20) || "?", user_id: me.id, page: s(p.page, 300) || null,
    message: text, detail: s(p.detail, 12000) || null, device: s(p.device, 160) || null, shot }, false);
  return reply({ ok: true });
}

// ---------- Admin ----------
async function stats() {
  const d1 = new Date(Date.now() - DAY).toISOString(), d7 = new Date(Date.now() - 7 * DAY).toISOString();
  const { data: logs } = await db.from("app_logs").select("kind, hits, status, last_at, app, version").gte("last_at", d7).limit(5000);
  const by = (k: string, since: string) => (logs ?? []).filter((l) => l.kind === k && l.last_at >= since).reduce((n, l) => n + l.hits, 0);
  const { count: openBugs } = await db.from("app_logs").select("id", { count: "exact", head: true }).eq("kind", "bug").eq("status", "open");
  const { data: ts } = await db.from("app_testers").select("user_id, app, version, last_at, days");
  const people = (since: string) => new Set((ts ?? []).filter((t) => t.last_at >= since).map((t) => t.user_id)).size;
  const versions: Record<string, number> = {};
  for (const t of ts ?? []) if (t.last_at >= d7) versions[t.app + " " + t.version] = (versions[t.app + " " + t.version] || 0) + 1;
  const { count: reports } = await db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open");
  return reply({ ok: true,
    day: { crash: by("crash", d1), error: by("error", d1), slow: by("slow", d1), bug: by("bug", d1) },
    week: { crash: by("crash", d7), error: by("error", d7), slow: by("slow", d7), bug: by("bug", d7) },
    openBugs: openBugs ?? 0, reports: reports ?? 0,
    testers: { total: new Set((ts ?? []).map((t) => t.user_id)).size, today: people(new Date(Date.now() - DAY).toISOString()), week: people(d7),
      days14: new Set((ts ?? []).filter((t) => t.days >= 14).map((t) => t.user_id)).size },
    versions });
}
// deno-lint-ignore no-explicit-any
async function list(p: any) {
  const kind = ["crash", "error", "slow", "bug"].includes(p.kind) ? p.kind : "error";
  let q = db.from("app_logs").select("id, kind, app, version, user_id, page, message, detail, ms, device, hits, status, created_at, last_at" + (kind === "bug" ? ", shot" : ""))
    .eq("kind", kind).order("last_at", { ascending: false }).limit(Math.min(200, Number(p.limit) || 100));
  if (p.status === "open" || p.status === "fixed") q = q.eq("status", p.status);
  if (APPS.includes(p.app)) q = q.eq("app", p.app);
  if (p.q) q = q.ilike("message", "%" + s(p.q, 60).replace(/[%_]/g, "") + "%");
  const { data, error } = await q;
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((l) => l.user_id).filter(Boolean))];
  const { data: us } = ids.length ? await db.from("users").select(PUB).in("id", ids) : { data: [] };
  const U = new Map((us ?? []).map((u) => [u.id, u]));
  return reply({ ok: true, list: (data ?? []).map((l) => ({ ...l, user: l.user_id ? U.get(l.user_id) ?? null : null })) });
}
async function testers() {
  const { data: ts } = await db.from("app_testers").select("*").order("last_at", { ascending: false }).limit(500);
  const ids = [...new Set((ts ?? []).map((t) => t.user_id))];
  const { data: us } = ids.length ? await db.from("users").select(PUB + ", role").in("id", ids) : { data: [] };
  const { data: logs } = ids.length ? await db.from("app_logs").select("user_id, kind, hits").in("user_id", ids).gte("last_at", new Date(Date.now() - 7 * DAY).toISOString()).limit(5000) : { data: [] };
  const U = new Map((us ?? []).map((u) => [u.id, u]));
  // deno-lint-ignore no-explicit-any
  const people = new Map<string, any>();
  for (const t of ts ?? []) {
    const p = people.get(t.user_id) || { user: U.get(t.user_id) ?? { id: t.user_id }, apps: [], last_at: t.last_at, days: 0, opens: 0, crash: 0, error: 0, slow: 0, bug: 0 };
    p.apps.push({ app: t.app, version: t.version, device: t.device, last_at: t.last_at, days: t.days, first_at: t.first_at });
    p.days = Math.max(p.days, t.days); p.opens += t.opens; if (t.last_at > p.last_at) p.last_at = t.last_at;
    people.set(t.user_id, p);
  }
  for (const l of logs ?? []) { const p = people.get(l.user_id); if (p) p[l.kind] += l.hits; }
  return reply({ ok: true, list: [...people.values()].sort((a, b) => (a.last_at < b.last_at ? 1 : -1)) });
}
// deno-lint-ignore no-explicit-any
async function resolve(p: any) {
  const st = p.status === "open" ? "open" : "fixed";
  await db.from("app_logs").update({ status: st }).eq("id", Number(p.id));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function remove(p: any) {
  await db.from("app_logs").delete().eq("id", Number(p.id));
  return reply({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (Math.random() < 0.02) await db.from("app_logs").delete().lt("last_at", new Date(Date.now() - 30 * DAY).toISOString());
    switch (p.action) {
      case "report": return await report(p, me);
      case "log":    return await log(p, me);
      case "hello":  return await hello(p, me);
      case "bug":    return await bug(p, me);
    }
    if (!me) return fail("Session expired. Please sign in again.", 401);
    if (me.role !== "Admin") return fail("Admins only.", 403);
    switch (p.action) {
      case "stats":   return await stats();
      case "list":    return await list(p);
      case "testers": return await testers();
      case "resolve": return await resolve(p);
      case "remove":  return await remove(p);
      default:        return fail("Unknown action.");
    }
  } catch (e) {
    console.error("crash-fast error", e);
    return fail("Server error.", 500);
  }
});
