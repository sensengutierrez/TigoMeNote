// TigoMeNote · notify-fast (Supabase Edge Function, verify_jwt = off)
// Notifications (activity) ng user at ang settings nito. Files: index.ts + webpush.ts + push.ts (parehong folder sa deploy).
// Actions (kailangan ng session token):
//   list, count, seen, prefs, setPrefs
// Action na pang-server lang (x-internal-key = service role key, galing sa notify.ts):
//   push     → ipadala sa phone ang isang notification, kung pinapayagan ng settings (pause, sleep mode, kategorya)
//   pushRaw  → push na hindi naka-save sa listahan (hal. bagong message galing messages-fast), sinusunod din ang settings
// Ang mga notification ay ginagawa ng posts-fast, social-fast at moderation-fast gamit ang notify.ts.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { makeVapid, type Vapid } from "./webpush.ts";
import { deliver, type Cat } from "./push.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY, { auth: { persistSession: false } });

const SITE = "https://tigomenote.com/";
const BUCKET = "post-media";
const LIST_LIMIT = 150;
const KEEP_DAYS = 90;
const RECAP_DAYS = 7;
const CATS = ["likes", "comments", "reposts", "follows", "updates", "messages"] as const;
const CATEGORY: Record<string, string | null> = {
  like: "likes", comment: "comments", repost: "reposts",
  follow: "follows", follow_request: "follows", follow_accept: "follows",
  milestone: "updates", recap: "updates", moderation: null,
};
const DEFAULT_PREFS = { paused_until: null, sleep_mute: true, likes: "push", comments: "push", reposts: "push", follows: "push", updates: "push", messages: "push" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400) => reply({ ok: false, error: e }, s);
const nowIso = () => new Date().toISOString();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

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
async function prefsOf(userId: string) {
  const { data } = await db.from("notif_prefs").select("*").eq("user_id", userId).maybeSingle();
  return { ...DEFAULT_PREFS, ...(data ?? {}) };
}

// ---------- push ----------
let vapid: Vapid | null = null;
async function getVapid(): Promise<Vapid> {
  if (vapid) return vapid;
  const { data } = await db.from("app_keys").select("value").eq("name", "vapid").maybeSingle();
  if (data) return (vapid = data.value as Vapid);
  const v = await makeVapid(SITE);
  await db.from("app_keys").upsert({ name: "vapid", value: v }, { onConflict: "name", ignoreDuplicates: true });
  const { data: again } = await db.from("app_keys").select("value").eq("name", "vapid").single();
  return (vapid = again!.value as Vapid);
}
// Web push at FCM (Android app) — push.ts ang pumipili ng device (messages → Chat app, iba → TigoMeNote app, wala → web)
async function pushTo(userId: string, data: Record<string, unknown>, cat: Cat = "social") {
  const { data: subs } = await db.from("push_subs").select("*").eq("user_id", userId);
  if (!subs || !subs.length) return 0;
  const v = subs.some((s) => s.kind === "webpush") ? await getVapid() : null;
  return deliver(db, subs, data, v, { cat, ttl: 6 * 3600, urgency: cat === "messages" ? "high" : "normal" });
}
// Oras ngayon sa timezone ng user ("HH:MM")
function hhmm(tz: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  } catch { return new Date().toISOString().slice(11, 16); }
}
function inWindow(now: string, start: string, end: string) {
  return start <= end ? now >= start && now < end : now >= start || now < end;
}
// deno-lint-ignore no-explicit-any
const nameOf = (u: any) => (u ? u.display_name || "@" + u.username : "TigoMeNote");
// deno-lint-ignore no-explicit-any
function pushText(n: any, actor: any): string {
  const who = nameOf(actor);
  switch (n.type) {
    case "like": return `${who} reacted ${n.emoji || "❤️"} to your post`;
    case "comment": return `${who} commented: ${n.body ?? ""}`;
    case "repost": return `${who} reposted your post`;
    case "follow": return `${who} started following you`;
    case "follow_request": return `${who} wants to follow you`;
    case "follow_accept": return `${who} accepted your follow request`;
    default: return n.body ?? "You have a new notification.";
  }
}
// Puwede bang i-push ngayon sa user na ito? (kategorya, pause, sleep mode)
async function allowed(userId: string, cat: string | null) {
  const pr = await prefsOf(userId);
  if (cat && pr[cat as keyof typeof pr] !== "push") return false;
  if (pr.paused_until && new Date(pr.paused_until) > new Date()) return false;
  if (pr.sleep_mute) {
    const { data: wb } = await db.from("wellbeing").select("sleep_on, sleep_start, sleep_end, tz").eq("user_id", userId).maybeSingle();
    if (wb?.sleep_on && inWindow(hhmm(wb.tz), wb.sleep_start, wb.sleep_end)) return false;
  }
  return true;
}
// Push na hindi naka-save sa Notifications (hal. messages). p.to = mga user id, p.category, p.data
// deno-lint-ignore no-explicit-any
async function pushRaw(p: any) {
  const to = (Array.isArray(p.to) ? p.to : []).map(String).slice(0, 100);
  const cat = CATS.includes(p.category) ? String(p.category) : null;
  let sent = 0;
  for (const uid of to) if (await allowed(uid, cat)) sent += await pushTo(uid, { ...(p.data ?? {}) }, cat === "messages" ? "messages" : "social");
  return reply({ ok: true, sent });
}
// deno-lint-ignore no-explicit-any
async function push(p: any) {
  const { data: n } = await db.from("notifications").select("*").eq("id", String(p.id || "")).maybeSingle();
  if (!n) return reply({ ok: true, sent: 0, skip: "gone" });
  const pr = await prefsOf(n.user_id);
  const cat = CATEGORY[n.type];
  if (cat && pr[cat as keyof typeof pr] !== "push") return reply({ ok: true, sent: 0, skip: "setting" });
  if (n.type !== "moderation") {
    if (pr.paused_until && new Date(pr.paused_until) > new Date()) return reply({ ok: true, sent: 0, skip: "paused" });
    if (pr.sleep_mute) {
      const { data: wb } = await db.from("wellbeing").select("sleep_on, sleep_start, sleep_end, tz").eq("user_id", n.user_id).maybeSingle();
      if (wb?.sleep_on && inWindow(hhmm(wb.tz), wb.sleep_start, wb.sleep_end)) return reply({ ok: true, sent: 0, skip: "sleep" });
    }
  }
  const { data: actor } = n.actor_id ? await db.from("users").select("username, display_name").eq("id", n.actor_id).maybeSingle() : { data: null };
  const sent = await pushTo(n.user_id, {
    type: "notif", id: n.id, title: "TigoMeNote", body: pushText(n, actor),
    url: n.post_id && n.type !== "moderation" ? `app/explore.html?post=${n.post_id}` : "app/notifications.html",
  });
  return reply({ ok: true, sent });
}

// ---------- list ----------
// Lingguhang buod: isang beses bawat 7 araw, kapag may nangyari
// deno-lint-ignore no-explicit-any
async function maybeRecap(me: any) {
  if (new Date(me.created_at) > new Date(Date.now() - RECAP_DAYS * 86_400_000)) return;
  const since = ago(RECAP_DAYS * 86_400_000);
  const { count: had } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("type", "recap").gte("created_at", since);
  if (had) return;
  const [r, c, f, p] = await Promise.all([
    db.from("post_reactions").select("post_id, posts!inner(user_id)", { count: "exact", head: true }).eq("posts.user_id", me.id).neq("user_id", me.id).gte("created_at", since),
    db.from("post_comments").select("id, posts!inner(user_id)", { count: "exact", head: true }).eq("posts.user_id", me.id).neq("user_id", me.id).is("deleted_at", null).gte("created_at", since),
    db.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", me.id).gte("created_at", since),
    db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("deleted_at", null).gte("publish_at", since).lte("publish_at", nowIso()),
  ]);
  const d = { reactions: r.count ?? 0, comments: c.count ?? 0, followers: f.count ?? 0, posts: p.count ?? 0 };
  if (!d.reactions && !d.comments && !d.followers && !d.posts) return;
  await db.from("notifications").insert({
    user_id: me.id, type: "recap", data: d,
    body: `Your week: ${d.posts} posts, ${d.reactions} reactions, ${d.comments} comments, ${d.followers} new followers.`,
  });
}

// deno-lint-ignore no-explicit-any
async function list(_p: any, me: any) {
  if (Math.random() < 0.05) await db.from("notifications").delete().eq("user_id", me.id).lt("created_at", ago(KEEP_DAYS * 86_400_000));
  await maybeRecap(me).catch((e) => console.error("recap failed", String(e)));
  const { data: rows } = await db.from("notifications").select("*").eq("user_id", me.id).order("created_at", { ascending: false }).limit(LIST_LIMIT);
  const items = rows ?? [];
  const actorIds = [...new Set(items.map((n) => n.actor_id).filter(Boolean))] as string[];
  const postIds = [...new Set(items.map((n) => n.post_id).filter(Boolean))] as string[];
  const [{ data: us }, { data: media }, { data: fol }, { data: reqs }] = await Promise.all([
    actorIds.length ? db.from("users").select("id, username, display_name, avatar_url").in("id", actorIds) : Promise.resolve({ data: [] }),
    postIds.length ? db.from("post_media").select("post_id, kind, path, position").in("post_id", postIds).order("position") : Promise.resolve({ data: [] }),
    actorIds.length ? db.from("follows").select("following_id").eq("follower_id", me.id).in("following_id", actorIds) : Promise.resolve({ data: [] }),
    db.from("follow_requests").select("follower_id").eq("following_id", me.id),
  ]);
  // Unang media ng bawat post (thumbnail)
  // deno-lint-ignore no-explicit-any
  const first: Record<string, any> = {};
  // deno-lint-ignore no-explicit-any
  (media ?? []).forEach((m: any) => { if (!first[m.post_id]) first[m.post_id] = m; });
  const paths = Object.values(first).map((m) => m.path);
  const url: Record<string, string> = {};
  if (paths.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, 3600);
    (data ?? []).forEach((s) => { if (s.path && s.signedUrl) url[s.path] = s.signedUrl; });
  }
  // deno-lint-ignore no-explicit-any
  const byId = Object.fromEntries((us ?? []).map((u: any) => [u.id, u]));
  // deno-lint-ignore no-explicit-any
  const following = new Set((fol ?? []).map((r: any) => r.following_id));
  // deno-lint-ignore no-explicit-any
  const pending = new Set((reqs ?? []).map((r: any) => r.follower_id));
  const out = items.map((n) => ({
    id: n.id, type: n.type, at: n.created_at, unread: !n.read_at, emoji: n.emoji, body: n.body, data: n.data,
    post_id: n.post_id, comment_id: n.comment_id,
    actor: n.actor_id ? byId[n.actor_id] ?? null : null,
    thumb: n.post_id && first[n.post_id] ? { kind: first[n.post_id].kind, url: url[first[n.post_id].path] ?? null } : null,
    following: n.actor_id ? following.has(n.actor_id) : false,
    pending: n.type === "follow_request" ? pending.has(n.actor_id) : undefined,
  }));
  return reply({ ok: true, list: out });
}
// deno-lint-ignore no-explicit-any
async function count(_p: any, me: any) {
  const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("read_at", null);
  return reply({ ok: true, unread: count ?? 0 });
}
// deno-lint-ignore no-explicit-any
async function seen(_p: any, me: any) {
  await db.from("notifications").update({ read_at: nowIso() }).eq("user_id", me.id).is("read_at", null);
  return reply({ ok: true });
}

// ---------- settings ----------
// deno-lint-ignore no-explicit-any
async function prefs(_p: any, me: any) {
  const { data: wb } = await db.from("wellbeing").select("sleep_on, sleep_start, sleep_end").eq("user_id", me.id).maybeSingle();
  return reply({ ok: true, prefs: await prefsOf(me.id), sleep: wb ?? { sleep_on: false, sleep_start: "22:00", sleep_end: "06:00" } });
}
// deno-lint-ignore no-explicit-any
async function setPrefs(p: any, me: any) {
  const ch: Record<string, unknown> = {};
  for (const k of CATS) {
    if (p[k] === undefined) continue;
    if (!["off", "app", "push"].includes(p[k])) return fail("Invalid setting.");
    ch[k] = p[k];
  }
  if (p.sleep_mute !== undefined) ch.sleep_mute = !!p.sleep_mute;
  if (p.pause_minutes !== undefined) {
    const m = Number(p.pause_minutes);
    if (!isFinite(m) || m < 0 || m > 7 * 1440) return fail("Invalid pause time.");
    ch.paused_until = m ? new Date(Date.now() + m * 60_000).toISOString() : null;
  }
  const { data, error } = await db.from("notif_prefs").upsert({ user_id: me.id, ...ch, updated_at: nowIso() }, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return reply({ ok: true, prefs: { ...DEFAULT_PREFS, ...data } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    if (p.action === "push" || p.action === "pushRaw") {
      if (!SERVICE_KEY || req.headers.get("x-internal-key") !== SERVICE_KEY) return fail("Not allowed.", 403);
      return p.action === "push" ? await push(p) : await pushRaw(p);
    }
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "list":     return await list(p, me);
      case "count":    return await count(p, me);
      case "seen":     return await seen(p, me);
      case "prefs":    return await prefs(p, me);
      case "setPrefs": return await setPrefs(p, me);
      default:         return fail("Unknown action.");
    }
  } catch (e) {
    console.error("notify-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
