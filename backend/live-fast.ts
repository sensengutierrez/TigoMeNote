// TigoMeNote · live-fast (Supabase Edge Function, verify_jwt = off) — 🔴 Live sa Explore (phone o computer)
// Ang video ay dumadaan sa Cloudflare Realtime (SFU): isang upload lang ang nagla-live, at ang Cloudflare ang nagpapadala sa lahat ng nanonood.
// Ang server na ito ay para lang sa: pahintulot, paggawa ng Cloudflare session/tracks, listahan ng live, at chat (may moderation).
// Actions (kailangan ng session token):
//   status                                   → { ready, can_live, ice }       (naka-setup ba ang Cloudflare; puwede bang mag-live ang user)
//   start  { title, source, sdp, tracks:[{mid,name}] } → { live, sdp }        (nagla-live: offer → answer ng Cloudflare)
//   beat   { id, viewers }                   → { ok }                         (bawat 20 s habang live)
//   end    { id }                            → { ok }
//   list                                     → { lives:[...] }                (live ngayon: sarili + mga fina-follow)
//   watch  { id }                            → { live, session, sdp, ice }    (nanonood: Cloudflare offer → sasagutin ng browser)
//   answer { session, sdp }                  → { ok }                         (sagot ng nanonood)
//   say    { id, text }                      → { msg }                        (chat; dumadaan sa moderation; ipinapasa sa lahat sa Realtime)
// Patakaran: 18+ lang ang puwedeng mag-live (teen ay puwedeng manood). Nakikita ng mga fina-follow ka (at ng sarili).
//   Isang live bawat user; ang live na walang "beat" nang 60 s ay tapos na. Hanggang 6 na live bawat oras.
// Secrets: CF_REALTIME_APP_ID + CF_REALTIME_APP_TOKEN (Cloudflare dashboard → Realtime → SFU app). Kapag wala: ready = false.
// Tables: lives, live_chat (sql/138). Push sa followers: notify-fast pushRaw (category updates).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkFor, blockMessage, logBlock, isTeen } from "./moderation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const APP_ID = Deno.env.get("CF_REALTIME_APP_ID") || "";
const APP_TOKEN = Deno.env.get("CF_REALTIME_APP_TOKEN") || "";
const CF = `https://rtc.live.cloudflare.com/v1/apps/${APP_ID}`;
const STALE_S = 60, RATE_N = 6;

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
const isUuid = (s: unknown) => /^[0-9a-f-]{36}$/.test(String(s || ""));
const secret = (n = 18) => [...crypto.getRandomValues(new Uint8Array(n))].map((x) => x.toString(16).padStart(2, "0")).join("");
// deno-lint-ignore no-explicit-any
const later = (pr: Promise<any>) => { try { (globalThis as any).EdgeRuntime?.waitUntil(pr); } catch { /* */ } };

const enc = new TextEncoder();
async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(*)").eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}
// deno-lint-ignore no-explicit-any
const pub = (u: any) => (u ? { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } : null);
// deno-lint-ignore no-explicit-any
const nameOf = (u: any) => (u ? u.display_name || "@" + u.username : "Someone");
const ICE = [{ urls: "stun:stun.cloudflare.com:3478" }];

// ---------- Cloudflare Realtime ----------
// deno-lint-ignore no-explicit-any
async function cf(method: string, path: string, body?: unknown): Promise<any> {
  const r = await fetch(CF + path, {
    method, headers: { Authorization: "Bearer " + APP_TOKEN, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.errorCode) { console.error("cf", path.replace(/sessions\/[^/]+/, "sessions/…"), r.status, j.errorCode, j.errorDescription); throw new Error("cf"); }
  return j;
}

async function broadcast(topic: string, event: string, payload: Record<string, unknown>) {
  try {
    const r = await fetch(SUPABASE_URL + "/realtime/v1/api/broadcast", {
      method: "POST", headers: { "content-type": "application/json", apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
    await r.body?.cancel();
  } catch (e) { console.error("broadcast", String(e)); }
}
function pushRaw(to: string[], data: Record<string, unknown>) {
  return fetch(SUPABASE_URL + "/functions/v1/notify-fast", {
    method: "POST", headers: { "content-type": "application/json", "x-internal-key": SERVICE_KEY },
    body: JSON.stringify({ action: "pushRaw", to, category: "updates", data }),
  }).then((r) => r.body?.cancel()).catch((e) => console.error("push", String(e)));
}
async function follows(a: string, b: string) {
  const { data } = await db.from("follows").select("follower_id").eq("follower_id", a).eq("following_id", b).maybeSingle();
  return !!data;
}
// Tapusin ang mga live na nawala (walang beat)
async function expire() {
  await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("status", "live").lt("heartbeat_at", new Date(Date.now() - STALE_S * 1000).toISOString());
}
// deno-lint-ignore no-explicit-any
async function liveFor(id: string, me: any) {
  if (!isUuid(id)) return null;
  const { data: l } = await db.from("lives").select("*, users!lives_user_id_fkey(id, username, display_name, avatar_url)").eq("id", id).maybeSingle();
  if (!l || l.status !== "live" || new Date(l.heartbeat_at).getTime() < Date.now() - STALE_S * 1000) return null;
  if (l.user_id !== me.id && !(await follows(me.id, l.user_id))) return null;
  return l;
}
// deno-lint-ignore no-explicit-any
const view = (l: any) => ({ id: l.id, title: l.title, source: l.source, viewers: l.viewers, started_at: l.started_at, user: pub(l.users), mine: false });

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function status(me: any) {
  return reply({ ok: true, ready: !!(APP_ID && APP_TOKEN), can_live: !isTeen(me.birthdate), ice: ICE });
}

// deno-lint-ignore no-explicit-any
async function start(p: any, me: any) {
  if (!APP_ID || !APP_TOKEN) return fail("Live isn't set up yet. Please try again later.", 503);
  if (isTeen(me.birthdate)) return fail("Going live is for 18+ accounts. You can still watch lives.", 403);
  const title = String(p.title ?? "").trim().slice(0, 80);
  if (title) {
    const v = checkFor(me, title);
    if (!v.ok && v.level === "block") { later(logBlock(db, me.id, v, "live title")); return fail(blockMessage(v.category)); }
  }
  const sdp = String(p.sdp ?? "");
  // deno-lint-ignore no-explicit-any
  const tracks = (Array.isArray(p.tracks) ? p.tracks : []).slice(0, 2).map((t: any) => ({ mid: String(t.mid ?? ""), name: String(t.name ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 32) }));
  if (!sdp.startsWith("v=0") || sdp.length > 20000 || !tracks.length || tracks.some((t: { mid: string; name: string }) => !t.mid || !t.name)) return fail("Couldn't start the live.");
  const { count } = await db.from("lives").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("started_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= RATE_N) return fail("You've started a lot of lives. Please wait a bit.", 429);
  await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("user_id", me.id).eq("status", "live");

  let session: string, answer: string;
  try {
    session = (await cf("POST", "/sessions/new")).sessionId;
    const r = await cf("POST", `/sessions/${session}/tracks/new`, {
      sessionDescription: { type: "offer", sdp },
      tracks: tracks.map((t: { mid: string; name: string }) => ({ location: "local", mid: t.mid, trackName: t.name })),
    });
    answer = r.sessionDescription?.sdp;
    if (!answer) throw new Error("no answer");
  } catch { return fail("Couldn't reach the live server. Please try again.", 502); }

  const source = p.source === "screen" ? "screen" : "camera";
  const { data: l, error } = await db.from("lives").insert({
    user_id: me.id, title, source, cf_session: session, tracks: tracks.map((t: { name: string }) => t.name), channel: "tmn-live-" + secret(12),
  }).select("*").single();
  if (error) { console.error("insert live", error.message); return fail("Couldn't start the live."); }
  // sabihan ang followers (sinusunod ang notification settings nila)
  later((async () => {
    const { data: f } = await db.from("follows").select("follower_id").eq("following_id", me.id).limit(500);
    const to = (f ?? []).map((x: { follower_id: string }) => x.follower_id);
    if (to.length) await pushRaw(to, { type: "live", id: l.id, tag: "live-" + me.id, title: `🔴 ${nameOf(me)} is live`, body: title || "Tap to watch", url: `app/explore.html?live=${l.id}` });
  })());
  return reply({ ok: true, live: { ...view({ ...l, users: me }), mine: true, channel: l.channel }, sdp: answer });
}

// deno-lint-ignore no-explicit-any
async function beat(p: any, me: any) {
  if (!isUuid(p.id)) return fail("Live not found.", 404);
  const n = Math.max(0, Math.min(100000, Math.floor(Number(p.viewers) || 0)));
  const { data: l } = await db.from("lives").select("id, status, peak").eq("id", p.id).eq("user_id", me.id).maybeSingle();
  if (!l || l.status !== "live") return fail("This live has ended.", 410);
  await db.from("lives").update({ heartbeat_at: nowIso(), viewers: n, peak: Math.max(n, l.peak ?? 0) }).eq("id", p.id);
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function end(p: any, me: any) {
  if (!isUuid(p.id)) return fail("Live not found.", 404);
  const { data: l } = await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("id", p.id).eq("user_id", me.id).eq("status", "live").select("channel").maybeSingle();
  if (l) await broadcast(l.channel, "end", {});
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function list(me: any) {
  await expire();
  const { data: f } = await db.from("follows").select("following_id").eq("follower_id", me.id).limit(2000);
  const ids = [me.id, ...(f ?? []).map((x: { following_id: string }) => x.following_id)];
  const { data } = await db.from("lives").select("id, user_id, title, source, viewers, started_at, users!lives_user_id_fkey(id, username, display_name, avatar_url)")
    .eq("status", "live").in("user_id", ids).order("started_at", { ascending: false }).limit(30);
  // deno-lint-ignore no-explicit-any
  return reply({ ok: true, ready: !!(APP_ID && APP_TOKEN), lives: (data ?? []).map((l: any) => ({ ...view(l), mine: l.user_id === me.id })) });
}

// deno-lint-ignore no-explicit-any
async function watch(p: any, me: any) {
  if (!APP_ID || !APP_TOKEN) return fail("Live isn't set up yet.", 503);
  const l = await liveFor(String(p.id ?? ""), me);
  if (!l) return fail("This live has ended.", 410);
  if (l.user_id === me.id) return fail("This is your own live.");
  try {
    const session = (await cf("POST", "/sessions/new")).sessionId;
    const r = await cf("POST", `/sessions/${session}/tracks/new`, {
      tracks: (l.tracks as string[]).map((name) => ({ location: "remote", sessionId: l.cf_session, trackName: name })),
    });
    if (!r.sessionDescription?.sdp) throw new Error("no offer");
    return reply({ ok: true, live: { ...view(l), channel: l.channel }, session, sdp: r.sessionDescription.sdp, ice: ICE });
  } catch { return fail("Couldn't connect to the live. Please try again.", 502); }
}

// deno-lint-ignore no-explicit-any
async function answer(p: any) {
  const session = String(p.session ?? ""), sdp = String(p.sdp ?? "");
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(session) || !sdp.startsWith("v=0") || sdp.length > 20000) return fail("Couldn't connect to the live.");
  try { await cf("PUT", `/sessions/${session}/renegotiate`, { sessionDescription: { type: "answer", sdp } }); }
  catch { return fail("Couldn't connect to the live. Please try again.", 502); }
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function say(p: any, me: any) {
  const text = String(p.text ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!text) return fail("Type a message.");
  const l = await liveFor(String(p.id ?? ""), me);
  if (!l) return fail("This live has ended.", 410);
  const { count } = await db.from("live_chat").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", new Date(Date.now() - 30 * 1000).toISOString());
  if ((count ?? 0) >= 10) return fail("Slow down a little 🙂", 429);
  const v = checkFor(me, text);
  if (!v.ok && v.level === "block") { later(logBlock(db, me.id, v, "live chat")); return fail(blockMessage(v.category)); }
  const { data: m, error } = await db.from("live_chat").insert({ live_id: l.id, user_id: me.id, body: text }).select("id, created_at").single();
  if (error) return fail("Couldn't send.");
  const msg = { id: m.id, text, at: m.created_at, user: pub(me) };
  await broadcast(l.channel, "chat", msg);
  return reply({ ok: true, msg });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "status": return await status(me);
      case "start":  return await start(p, me);
      case "beat":   return await beat(p, me);
      case "end":    return await end(p, me);
      case "list":   return await list(me);
      case "watch":  return await watch(p, me);
      case "answer": return await answer(p);
      case "say":    return await say(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("live-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
