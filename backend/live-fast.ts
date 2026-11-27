// TigoMeNote · live-fast (Supabase Edge Function, verify_jwt = off) — 🔴 Live sa Explore
// Ang video ay nasa YouTube / Twitch / Facebook / TikTok (libre — sila ang nagpapadala ng video). Dito: link, listahan, chat at ❤️.
// 0.11.62: tinanggal ang sariling camera live (Cloudflare Realtime) — walang bayad, link na lang.
// Actions (kailangan ng session token):
//   status                    → { can_live }                   (puwede bang mag-live ang user)
//   start  { title, link }    → { live }                       (ibahagi ang live mo; tinatanggap lang ang kilalang link)
//   end    { id }             → { ok }                         (may-ari lang)
//   list                      → { lives:[...] }                (live ngayon: sarili + mga fina-follow)
//   watch  { id }             → { live }                       (para sa player; pati sa may-ari para makita ang chat)
//   say    { id, text }       → { msg }                        (chat; dumadaan sa moderation; ipinapasa sa lahat sa Realtime)
// Patakaran: 18+ lang ang puwedeng mag-live (teen ay puwedeng manood). Nakikita ng mga fina-follow ka (at ng sarili).
//   Isang live bawat user; tapos pagkalipas ng 6 na oras o kapag pinindot ng may-ari ang End. Hanggang 6 na live bawat oras.
// Tables: lives, live_chat (sql/138, 140). Push sa followers: notify-fast pushRaw (category updates).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkFor, blockMessage, logBlock, isTeen } from "./moderation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const RATE_N = 6, LINK_H = 6;

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
// Tapusin ang mga live na lumampas sa oras (at ang lumang camera live, kung may naiwan)
async function expire() {
  await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("status", "live").eq("platform", "cf");
  await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("status", "live").lt("started_at", new Date(Date.now() - LINK_H * 3600 * 1000).toISOString());
}
const gone = (l: { platform: string; started_at: string }) => l.platform === "cf" || new Date(l.started_at).getTime() < Date.now() - LINK_H * 3600 * 1000;

// ---------- link ng live sa ibang platform → platform + embed (tanggap lang ang kilalang anyo; walang ibang site) ----------
function parseLink(raw: string): { platform: string; embed: string; link: string } | null {
  let u: URL;
  try { u = new URL(raw.trim().startsWith("http") ? raw.trim() : "https://" + raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, ""), path = u.pathname;
  let m: RegExpMatchArray | null;
  const yt = (id: string | null) => (id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { platform: "youtube", embed: id, link: "https://www.youtube.com/watch?v=" + id } : null);
  if (h === "youtu.be") return yt(path.slice(1, 12));
  if (h === "youtube.com" || h === "music.youtube.com") {
    if (path === "/watch") return yt(u.searchParams.get("v"));
    if ((m = path.match(/^\/(?:live|shorts|embed)\/([A-Za-z0-9_-]{11})/))) return yt(m[1]);
    return null;
  }
  if (h === "twitch.tv" && (m = path.match(/^\/([A-Za-z0-9_]{3,25})\/?$/)) && !/^(videos|directory|p|settings|subscriptions|inventory|wallet|search)$/i.test(m[1]))
    return { platform: "twitch", embed: m[1].toLowerCase(), link: "https://www.twitch.tv/" + m[1].toLowerCase() };
  if (h === "facebook.com" || h === "fb.watch" || h === "fb.com") {
    const clean = (h === "fb.watch" ? "https://fb.watch" : "https://www.facebook.com") + path.replace(/[^A-Za-z0-9_./-]/g, "") + (u.searchParams.get("v") ? "?v=" + u.searchParams.get("v")!.replace(/\D/g, "") : "");
    if (h === "fb.watch" ? path.length > 3 : /\/(videos|watch|live)\b/.test(path) || u.searchParams.get("v")) return { platform: "facebook", embed: clean, link: clean };
    return null;
  }
  if (h === "tiktok.com" && (m = path.match(/^\/@([A-Za-z0-9_.]{2,24})(?:\/live)?\/?$/))) return { platform: "tiktok", embed: m[1], link: "https://www.tiktok.com/@" + m[1] + "/live" };
  if ((h === "vm.tiktok.com" || h === "vt.tiktok.com") && /^\/[A-Za-z0-9]{5,16}\/?$/.test(path)) return { platform: "tiktok", embed: "", link: "https://" + h + path };
  return null;
}
// deno-lint-ignore no-explicit-any
async function liveFor(id: string, me: any) {
  if (!isUuid(id)) return null;
  const { data: l } = await db.from("lives").select("*, users!lives_user_id_fkey(id, username, display_name, avatar_url)").eq("id", id).maybeSingle();
  if (!l || l.status !== "live" || gone(l)) return null;
  if (l.user_id !== me.id && !(await follows(me.id, l.user_id))) return null;
  return l;
}
// deno-lint-ignore no-explicit-any
const view = (l: any) => ({ id: l.id, title: l.title, source: l.source, viewers: l.viewers, started_at: l.started_at, user: pub(l.users), mine: false,
  platform: l.platform || "cf", link: l.link || null, embed: l.embed || null });

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function status(me: any) {
  return reply({ ok: true, links: true, can_live: !isTeen(me.birthdate) });
}

// deno-lint-ignore no-explicit-any
async function start(p: any, me: any) {
  if (isTeen(me.birthdate)) return fail("Going live is for 18+ accounts. You can still watch lives.", 403);
  const title = String(p.title ?? "").trim().slice(0, 80);
  if (title) {
    const v = checkFor(me, title);
    if (!v.ok && v.level === "block") { later(logBlock(db, me.id, v, "live title")); return fail(blockMessage(v.category)); }
  }
  return startLink(p, me, title);
}
// sabihan ang followers (sinusunod ang notification settings nila)
// deno-lint-ignore no-explicit-any
function tellFollowers(me: any, id: string, title: string, where = "") {
  later((async () => {
    const { data: f } = await db.from("follows").select("follower_id").eq("following_id", me.id).limit(500);
    const to = (f ?? []).map((x: { follower_id: string }) => x.follower_id);
    if (to.length) await pushRaw(to, { type: "live", id, tag: "live-" + me.id, title: `🔴 ${nameOf(me)} is live${where}`, body: title || "Tap to watch", url: `app/explore.html?live=${id}` });
  })());
}
const PLAT: Record<string, string> = { youtube: "YouTube", twitch: "Twitch", facebook: "Facebook", tiktok: "TikTok" };
// Live sa ibang platform: link lang ang itatabi (walang Cloudflare, walang bayad)
// deno-lint-ignore no-explicit-any
async function startLink(p: any, me: any, title: string) {
  const L = parseLink(String(p.link ?? "").slice(0, 400));
  if (!L) return fail("Paste the link of your live on YouTube, Twitch, Facebook or TikTok.");
  const { count } = await db.from("lives").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("started_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= RATE_N) return fail("You've started a lot of lives. Please wait a bit.", 429);
  await db.from("lives").update({ status: "ended", ended_at: nowIso() }).eq("user_id", me.id).eq("status", "live");
  const { data: l, error } = await db.from("lives").insert({
    user_id: me.id, title, source: "camera", platform: L.platform, link: L.link, embed: L.embed, channel: "tmn-live-" + secret(12),
  }).select("*").single();
  if (error) { console.error("insert live link", error.message); return fail("Couldn't share the live."); }
  tellFollowers(me, l.id, title, " on " + PLAT[L.platform]);
  return reply({ ok: true, live: { ...view({ ...l, users: me }), mine: true, channel: l.channel } });
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
  const { data } = await db.from("lives").select("id, user_id, title, source, viewers, started_at, platform, link, embed, users!lives_user_id_fkey(id, username, display_name, avatar_url)")
    .eq("status", "live").in("user_id", ids).order("started_at", { ascending: false }).limit(30);
  // deno-lint-ignore no-explicit-any
  return reply({ ok: true, links: true, lives: (data ?? []).map((l: any) => ({ ...view(l), mine: l.user_id === me.id })) });
}

// deno-lint-ignore no-explicit-any
async function watch(p: any, me: any) {
  const l = await liveFor(String(p.id ?? ""), me);
  if (!l) return fail("This live has ended.", 410);
  return reply({ ok: true, live: { ...view(l), mine: l.user_id === me.id, channel: l.channel } });   // player ng platform; chat at ❤️ sa atin
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
      case "end":    return await end(p, me);
      case "list":   return await list(me);
      case "watch":  return await watch(p, me);
      case "say":    return await say(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("live-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
