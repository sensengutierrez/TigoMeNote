// TigoMeNote · calls-fast (Supabase Edge Function, verify_jwt = off) — 📞 tawag sa Messages (voice at video, 1-on-1)
// Ang audio/video ay diretso sa pagitan ng dalawang phone (WebRTC). Ang server ay para lang sa:
//   pahintulot (magkaibigan lang), pag-ring (Realtime + push), lihim na signal channel, at "Missed call"/"Voice call · 3:12" sa chat.
// Actions (kailangan ng session token):
//   key                       → { ring_key, ice } (sariling ring channel; ICE servers para sa WebRTC)
//   ring   { conversation_id, video } → { call, ice }   (caller)
//   get    { id }             → { call }                (dalawang kasali lang)
//   answer { id }             → { call, ice }           (callee; ringing → active)
//   decline{ id }             → callee: declined
//   end    { id, secs }       → sinuman: ringing → missed (kung caller) · active → ended
// Patakaran: 1-on-1 (dm) lang; magkaibigan lang ang puwedeng tumawag: nagfa-follow sa isa't isa, o Family/Friends (safety_links).
//   Busy kapag may ibang tawag ang tatawagan. Hanggang 12 tawag bawat 10 minuto. Ang ringing na lampas 50 s = missed.
// ICE: STUN (Google at Cloudflare). TURN kung may secrets: CF_TURN_KEY_ID + CF_TURN_KEY_TOKEN (Cloudflare) o TURN_URLS + TURN_USER + TURN_PASS.
// Tables: call_keys, calls (sql/132). Push: notify-fast pushRaw (category messages; sinusunod ang settings at sleep).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const RING_S = 50;
const RATE_N = 12, RATE_MIN = 10;

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

// ---------- ICE servers ----------
const STUN = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }, { urls: "stun:stun.cloudflare.com:3478" }];
let turnCache = { at: 0, list: [] as unknown[] };
async function iceServers() {
  const id = Deno.env.get("CF_TURN_KEY_ID"), tok = Deno.env.get("CF_TURN_KEY_TOKEN");
  if (id && tok) {
    if (Date.now() - turnCache.at < 30 * 60 * 1000 && turnCache.list.length) return [...STUN, ...turnCache.list];
    try {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate-ice-servers`, {
        method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify({ ttl: 7200 }),
      });
      const j = await r.json();
      const list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
      if (r.ok && list.length) { turnCache = { at: Date.now(), list }; return [...STUN, ...list]; }
    } catch (e) { console.error("turn", String(e)); }
  }
  const urls = (Deno.env.get("TURN_URLS") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (urls.length) return [...STUN, { urls, username: Deno.env.get("TURN_USER") || "", credential: Deno.env.get("TURN_PASS") || "" }];
  return STUN;
}

// ---------- tulong ----------
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
    body: JSON.stringify({ action: "pushRaw", to, category: "messages", data }),
  }).then((r) => r.body?.cancel()).catch((e) => console.error("push", String(e)));
}
async function ringKey(uid: string) {
  const { data } = await db.from("call_keys").select("ring_key").eq("user_id", uid).maybeSingle();
  if (data) return data.ring_key as string;
  const k = secret(16);
  const { error } = await db.from("call_keys").insert({ user_id: uid, ring_key: k });
  if (error) { const { data: again } = await db.from("call_keys").select("ring_key").eq("user_id", uid).single(); return again!.ring_key as string; }
  return k;
}
async function follows(a: string, b: string) {
  const { data } = await db.from("follows").select("follower_id").eq("follower_id", a).eq("following_id", b).maybeSingle();
  return !!data;
}
async function inCircle(a: string, b: string) {
  const [x, y] = a < b ? [a, b] : [b, a];
  const { data } = await db.from("safety_links").select("id").eq("a_id", x).eq("b_id", y).eq("status", "accepted").maybeSingle();
  return !!data;
}
async function friends(a: string, b: string) {
  const [x, y, c] = await Promise.all([follows(a, b), follows(b, a), inCircle(a, b)]);
  return c || (x && y);
}
// Ang ringing na lumampas sa oras = missed (kung naiwan dahil nawala ang caller)
async function expire() {
  const cut = new Date(Date.now() - RING_S * 1000).toISOString();
  await db.from("calls").update({ status: "missed", ended_at: nowIso() }).eq("status", "ringing").lt("created_at", cut);
  // aktibong tawag na 6 na oras na = tapos na (hal. parehong nawala)
  await db.from("calls").update({ status: "ended", ended_at: nowIso() }).eq("status", "active").lt("answered_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString());
}
// deno-lint-ignore no-explicit-any
async function shape(c: any, me: any) {
  const other = c.caller_id === me.id ? c.callee_id : c.caller_id;
  const { data: u } = await db.from("users").select("id, username, display_name, avatar_url").eq("id", other).maybeSingle();
  return { id: c.id, conversation_id: c.conversation_id, video: c.video, status: c.status, mine: c.caller_id === me.id, signal: c.signal_key,
    with: pub(u), at: c.created_at, answered_at: c.answered_at, ended_at: c.ended_at };
}
// deno-lint-ignore no-explicit-any
async function chatNote(c: any, text: string) {
  const { data: conv } = await db.from("conversations").select("channel_key").eq("id", c.conversation_id).maybeSingle();
  await db.from("messages").insert({ conversation_id: c.conversation_id, user_id: c.caller_id, kind: "system", body: text });
  await db.from("conversations").update({ last_message_at: nowIso() }).eq("id", c.conversation_id);
  if (conv) await broadcast(conv.channel_key, "msg", { system: true });
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
// deno-lint-ignore no-explicit-any
async function load(id: unknown, me: any) {
  if (!isUuid(id)) return null;
  const { data } = await db.from("calls").select("*").eq("id", String(id)).maybeSingle();
  return data && (data.caller_id === me.id || data.callee_id === me.id) ? data : null;
}

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function key(_p: any, me: any) {
  return reply({ ok: true, ring_key: await ringKey(me.id), ice: await iceServers() });
}
// deno-lint-ignore no-explicit-any
async function ring(p: any, me: any) {
  const convId = String(p.conversation_id || "");
  if (!isUuid(convId)) return fail("Chat not found.", 404);
  const { data: mem } = await db.from("conversation_members").select("status, conversations(id, kind)").eq("conversation_id", convId).eq("user_id", me.id).maybeSingle();
  // deno-lint-ignore no-explicit-any
  const conv = (mem as any)?.conversations;
  if (!mem || mem.status === "left" || !conv) return fail("Chat not found.", 404);
  if (conv.kind !== "dm") return fail("Calls are for 1-on-1 chats for now.", 400);
  const { data: others } = await db.from("conversation_members").select("user_id, status, users(id, username, display_name, avatar_url, status)").eq("conversation_id", convId).neq("user_id", me.id);
  // deno-lint-ignore no-explicit-any
  const o = (others ?? [])[0] as any;
  if (!o || !o.users || o.users.status !== "Active" || o.status === "left") return fail("This person can't be called.", 404);
  if (mem.status === "request" || o.status === "request") return fail("Accept the chat first, then you can call.", 403);
  if (!(await friends(me.id, o.user_id))) return fail(`You can call friends only — follow each other with @${o.users.username}, or add them to Family & Friends.`, 403, { reason: "friends" });
  const since = new Date(Date.now() - RATE_MIN * 60 * 1000).toISOString();
  const { count } = await db.from("calls").select("id", { count: "exact", head: true }).eq("caller_id", me.id).gt("created_at", since);
  if ((count ?? 0) >= RATE_N) return fail("Too many calls. Please wait a few minutes.", 429);
  await expire();
  const { data: busy } = await db.from("calls").select("id, caller_id, callee_id").in("status", ["ringing", "active"])
    .or(`caller_id.eq.${o.user_id},callee_id.eq.${o.user_id},caller_id.eq.${me.id},callee_id.eq.${me.id}`).limit(5);
  const video = !!p.video;
  if ((busy ?? []).some((b) => b.caller_id === o.user_id || b.callee_id === o.user_id)) {
    const { data: c } = await db.from("calls").insert({ conversation_id: convId, caller_id: me.id, callee_id: o.user_id, video, status: "busy", signal_key: secret(), ended_at: nowIso() }).select("*").single();
    later(chatNote(c, `📞 Missed ${video ? "video" : "voice"} call`));
    return fail(`${nameOf(o.users)} is on another call.`, 409, { busy: true });
  }
  // sariling lumang tawag (hal. nag-refresh): tapusin muna
  for (const b of busy ?? []) await db.from("calls").update({ status: "ended", ended_at: nowIso() }).eq("id", b.id);
  const { data: c, error } = await db.from("calls").insert({ conversation_id: convId, caller_id: me.id, callee_id: o.user_id, video, signal_key: secret(24) }).select("*").single();
  if (error) throw error;
  const rk = await ringKey(o.user_id);
  const from = pub(me);
  later(Promise.all([
    broadcast("tmn-ring-" + rk, "ring", { id: c.id, video, from, conversation_id: convId }),
    pushRaw([o.user_id], { type: "call", id: c.id, tag: "call-" + c.id, title: `${video ? "🎥" : "📞"} ${nameOf(me)}`, body: `Incoming ${video ? "video" : "voice"} call · Tap to answer`,
      url: `app/messages.html?c=${convId}&call=${c.id}` }),
  ]));
  return reply({ ok: true, call: await shape(c, me), ice: await iceServers() });
}
// deno-lint-ignore no-explicit-any
async function get(p: any, me: any) {
  await expire();
  const c = await load(p.id, me);
  if (!c) return fail("Call not found.", 404);
  return reply({ ok: true, call: await shape(c, me) });
}
// deno-lint-ignore no-explicit-any
async function answer(p: any, me: any) {
  await expire();
  const c = await load(p.id, me);
  if (!c || c.callee_id !== me.id) return fail("Call not found.", 404);
  if (c.status !== "ringing") return fail(c.status === "active" ? "This call was answered on another device." : "The call has ended.", 409, { status: c.status });
  const { data: u } = await db.from("calls").update({ status: "active", answered_at: nowIso() }).eq("id", c.id).eq("status", "ringing").select("*").maybeSingle();
  if (!u) return fail("The call has ended.", 409);
  const rk = await ringKey(me.id);
  later(broadcast("tmn-ring-" + rk, "taken", { id: c.id }));   // ibang device mo: tumigil sa pag-ring
  return reply({ ok: true, call: await shape(u, me), ice: await iceServers() });
}
// deno-lint-ignore no-explicit-any
async function decline(p: any, me: any) {
  const c = await load(p.id, me);
  if (!c || c.callee_id !== me.id) return fail("Call not found.", 404);
  if (c.status === "ringing") {
    await db.from("calls").update({ status: "declined", ended_at: nowIso() }).eq("id", c.id);
    later(Promise.all([broadcast("tmn-call-" + c.signal_key, "end", { by: me.id, why: "declined" }), broadcast("tmn-ring-" + (await ringKey(me.id)), "taken", { id: c.id }),
      chatNote(c, `📞 Missed ${c.video ? "video" : "voice"} call`)]));
  }
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function end(p: any, me: any) {
  const c = await load(p.id, me);
  if (!c) return fail("Call not found.", 404);
  if (c.status === "ringing") {
    await db.from("calls").update({ status: "missed", ended_at: nowIso() }).eq("id", c.id);
    later(Promise.all([broadcast("tmn-ring-" + (await ringKey(c.callee_id)), "cancel", { id: c.id }), broadcast("tmn-call-" + c.signal_key, "end", { by: me.id, why: "cancel" }),
      chatNote(c, `📞 Missed ${c.video ? "video" : "voice"} call`)]));
  } else if (c.status === "active") {
    await db.from("calls").update({ status: "ended", ended_at: nowIso() }).eq("id", c.id);
    const secs = Math.max(0, Math.round((Date.now() - new Date(c.answered_at).getTime()) / 1000));
    later(Promise.all([broadcast("tmn-call-" + c.signal_key, "end", { by: me.id, why: "hangup" }), chatNote(c, `${c.video ? "🎥 Video" : "📞 Voice"} call · ${mmss(secs)}`)]));
  }
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
      case "key":     return await key(p, me);
      case "ring":    return await ring(p, me);
      case "get":     return await get(p, me);
      case "answer":  return await answer(p, me);
      case "decline": return await decline(p, me);
      case "end":     return await end(p, me);
      default:        return fail("Unknown action.");
    }
  } catch (e) {
    console.error("calls-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
