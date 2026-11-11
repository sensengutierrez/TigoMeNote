// TigoMeNote · tigo-social (Supabase Edge Function, verify_jwt = off) — mga kaibigan, World chat at pasyal sa loob ng Tigo
// Isang trabaho lang: ang "social" na bahagi ng Tigo. (Ang DM at group chat ay messages-fast pa rin; ang Follow ay social-fast.)
// Actions (session token):
//   friends {}            → { list:[{ user, mutual, online, game, code, joinable, pet:{name,level,color,avatar} }] } — mga FINA-FOLLOW mo; online muna
//   world   { after?, place? } → { list:[{ id, user:{id,username,display_name,avatar_url}, body, at, me }], muted:[ids] } — huling 40 (o mas bago sa after)
//   say     { body, place? }   → { msg } — text lang, ≤200 titik, walang link, dumadaan sa filter (moderation.ts); 1 bawat 3 s; 300 bawat araw
//     place = "world" (lahat ng nasa Tigo) o "isle:<user id>" (chat ng isla: ang may-ari at ang mga nagfa-follow sa kanya — kung nasaan ka naglalaro)
//   threads {} → { list:[{ id, kind, title, channel, members, last, unread }] } — pribadong chat at grupo SA LOOB NG TIGO (hindi Messenger)
//   open    { id, after? } → { thread, members, msgs } · start { user_id } → { id } · group { user_ids, title? } → { id }
//   send    { id, body } → { msg } · read { id } · leave { id } · unread {} → { n }
//     Pribado at grupo: kailangang magka-follow kayo (pareho kayong nagfa-follow). Text lang, walang link, filter, 1 bawat segundo.
//   mute    { user_id, on } → hindi mo na makikita ang World chat niya
//   del     { id }        → burahin ang sarili mong mensahe (o Admin: kahit kanino)
//   visit   { user_id? }  → { user, pet:{...itsura, room}, key, online } — dapat fina-follow mo siya (o ikaw mismo). key = lihim na channel ng isla
// Tables: tigo_world (+place, sql/123), tigo_mutes, pets.isle_key (sql/117), tigo_threads, tigo_thread_members, tigo_msgs (sql/123), follows, game_rooms, pets.
// Files: tigo-social.ts + moderation.ts.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkFor, blockMessage, logBlock } from "./moderation.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400, x: Record<string, unknown> = {}) => reply({ ok: false, error: e, ...x }, s);
const PUB = "id, username, display_name, avatar_url";
const FRESH_MS = 90_000, GAP_MS = 3_000, PER_DAY = 300, KEEP_DAYS = 7;
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const levelOf = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 20)) + 1;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|me|ly|gg|app|xyz|ph|co)\b)/i;

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
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
async function friends(_p: any, me: any) {
  const { data: fol } = await db.from("follows").select("following_id").eq("follower_id", me.id).limit(500);
  const ids = (fol ?? []).map((r) => r.following_id);
  if (!ids.length) return reply({ ok: true, list: [] });
  const [{ data: us }, { data: back }, { data: rooms }, { data: pets }] = await Promise.all([
    db.from("users").select(PUB + ", status").in("id", ids),
    db.from("follows").select("follower_id").eq("following_id", me.id).in("follower_id", ids),
    db.from("game_rooms").select("user_id, game, code, players, max_players").in("user_id", ids).gte("updated_at", new Date(Date.now() - FRESH_MS).toISOString()),
    db.from("pets").select("user_id, name, color, avatar, xp").in("user_id", ids),
  ]);
  const B = new Set((back ?? []).map((r) => r.follower_id));
  const R = new Map((rooms ?? []).map((r) => [r.user_id, r]));
  const P = new Map((pets ?? []).map((r) => [r.user_id, r]));
  const list = (us ?? []).filter((u) => u.status === "Active").map((u) => {
    const r = R.get(u.id), pt = P.get(u.id);
    return {
      user: { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url },
      mutual: B.has(u.id), online: !!r, game: r ? r.game : null, code: r && r.game ? r.code : null,
      joinable: !!r && !!r.game && !!r.code && r.players < r.max_players,
      pet: pt ? { name: pt.name, level: levelOf(pt.xp), color: pt.color, avatar: pt.avatar ?? null } : null,
    };
  }).sort((a, b) => Number(b.online) - Number(a.online) || Number(b.mutual) - Number(a.mutual) || String(a.user.username).localeCompare(String(b.user.username)));
  return reply({ ok: true, list });
}

// deno-lint-ignore no-explicit-any
async function shapeMsgs(rows: any[], me: any) {
  const uids = [...new Set(rows.map((r) => r.user_id))];
  const { data: us } = uids.length ? await db.from("users").select(PUB + ", status").in("id", uids) : { data: [] };
  const U = new Map((us ?? []).filter((u) => u.status === "Active").map((u) => [u.id, u]));
  return rows.filter((r) => U.has(r.user_id)).map((r) => {
    const u = U.get(r.user_id)!;
    return { id: r.id, body: r.body, at: r.created_at, me: r.user_id === me.id, user: { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } };
  });
}
// deno-lint-ignore no-explicit-any
// "world" o "isle:<uuid>" — sa isla: ikaw ang may-ari o fina-follow mo siya
async function placeOf(p: any, me: any): Promise<string | null> {
  const v = String(p.place || "world");
  if (v === "world") return v;
  const m = /^isle:([0-9a-f-]{36})$/i.exec(v); if (!m || !isUuid(m[1])) return null;
  if (m[1] === me.id) return "isle:" + m[1].toLowerCase();
  const { data: f } = await db.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", m[1]).maybeSingle();
  return f ? "isle:" + m[1].toLowerCase() : null;
}
// deno-lint-ignore no-explicit-any
async function world(p: any, me: any) {
  const place = await placeOf(p, me); if (!place) return fail("Follow them first to chat on their island.", 403);
  const after = Math.max(0, Math.floor(Number(p.after) || 0));
  const { data: mu } = await db.from("tigo_mutes").select("muted_id").eq("user_id", me.id).limit(500);
  const muted = (mu ?? []).map((r) => r.muted_id);
  let q = db.from("tigo_world").select("id, user_id, body, created_at").eq("place", place).eq("hidden", false).order("id", { ascending: false }).limit(40);
  if (after) q = q.gt("id", after);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []).filter((r) => !muted.includes(r.user_id)).reverse();
  return reply({ ok: true, list: await shapeMsgs(rows, me), muted });
}
// deno-lint-ignore no-explicit-any
async function say(p: any, me: any) {
  const place = await placeOf(p, me); if (!place) return fail("Follow them first to chat on their island.", 403);
  const body = String(p.body ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!body) return fail("Write a message.");
  if (LINK.test(body)) return fail("Links aren't allowed in World chat.", 422);
  const v = checkFor(me, body);
  if (!v.ok) { await logBlock(db, me.id, v, "world_chat"); return fail(v.level === "block" ? blockMessage(v.category) : "Please keep World chat friendly for everyone.", 422, { blocked: true }); }
  const { data: last } = await db.from("tigo_world").select("created_at, body").eq("user_id", me.id).order("id", { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < GAP_MS) return fail("Slow down a little.", 429);
  if (last && last.body === body) return fail("You already said that.", 429);
  const { count } = await db.from("tigo_world").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= PER_DAY) return fail("That's a lot of messages today. Try again tomorrow.", 429);
  const { data: row, error } = await db.from("tigo_world").insert({ user_id: me.id, body, place }).select("id, user_id, body, created_at").single();
  if (error) throw error;
  if (row.id % 50 === 0) await db.from("tigo_world").delete().lt("created_at", new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString());   // linis ng luma
  return reply({ ok: true, msg: (await shapeMsgs([row], me))[0] });
}
// deno-lint-ignore no-explicit-any
async function mute(p: any, me: any) {
  const id = String(p.user_id || "");
  if (!isUuid(id) || id === me.id) return fail("Invalid user.");
  if (p.on === false) await db.from("tigo_mutes").delete().eq("user_id", me.id).eq("muted_id", id);
  else {
    const { error } = await db.from("tigo_mutes").upsert({ user_id: me.id, muted_id: id }, { onConflict: "user_id,muted_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  return reply({ ok: true, muted: p.on !== false });
}
// deno-lint-ignore no-explicit-any
async function del(p: any, me: any) {
  const id = Math.floor(Number(p.id) || 0);
  if (!id) return fail("Invalid message.");
  let q = db.from("tigo_world").delete().eq("id", id);
  if (me.role !== "Admin") q = q.eq("user_id", me.id);
  const { error } = await q;
  if (error) throw error;
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function visit(p: any, me: any) {
  const id = String(p.user_id || me.id);
  if (!isUuid(id)) return fail("Invalid user.");
  if (id !== me.id) {
    const { data: f } = await db.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", id).maybeSingle();
    if (!f) return fail("Follow them first to visit their island.", 403);
  }
  const [{ data: u }, { data: pt }, { data: r }] = await Promise.all([
    db.from("users").select(PUB + ", status").eq("id", id).maybeSingle(),
    db.from("pets").select("name, color, gear, outfit, avatar, xp, room, isle_key").eq("user_id", id).maybeSingle(),
    db.from("game_rooms").select("updated_at").eq("user_id", id).gte("updated_at", new Date(Date.now() - FRESH_MS).toISOString()).maybeSingle(),
  ]);
  if (!u || u.status !== "Active") return fail("User not found.", 404);
  if (!pt) return fail("They don't have a Tigo yet.", 404);
  const lvl = levelOf(pt.xp);
  return reply({
    ok: true, online: !!r, key: pt.isle_key,
    user: { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url },
    pet: { name: pt.name, color: pt.color, gear: pt.gear, outfit: pt.outfit ?? {}, avatar: pt.avatar ?? null, level: lvl, glow: lvl >= 10, room: pt.room ?? null },
  });
}

// ---------- pribadong chat at grupo (sa loob ng Tigo lang) ----------
async function mutual(a: string, b: string) {
  const { data } = await db.from("follows").select("follower_id, following_id").or(`and(follower_id.eq.${a},following_id.eq.${b}),and(follower_id.eq.${b},following_id.eq.${a})`);
  return (data ?? []).length === 2;
}
// deno-lint-ignore no-explicit-any
async function memberOf(id: string, me: any) {
  if (!isUuid(id)) return null;
  const { data } = await db.from("tigo_thread_members").select("thread_id, last_read_at, left_at, tigo_threads(*)").eq("thread_id", id).eq("user_id", me.id).maybeSingle();
  // deno-lint-ignore no-explicit-any
  return data && !data.left_at ? data as any : null;
}
async function peopleIn(ids: string[]) {
  const all = [...new Set(ids)];
  const { data } = all.length ? await db.from("tigo_thread_members").select("thread_id, user_id, left_at, users(" + PUB + ", status)").in("thread_id", all) : { data: [] };
  // deno-lint-ignore no-explicit-any
  return (data ?? []) as any[];
}
// deno-lint-ignore no-explicit-any
const pubOf = (u: any) => u ? { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } : null;
// deno-lint-ignore no-explicit-any
async function threads(_p: any, me: any) {
  const { data: mine } = await db.from("tigo_thread_members").select("thread_id, last_read_at, tigo_threads(*)").eq("user_id", me.id).is("left_at", null).limit(100);
  const rows = (mine ?? []).filter((r) => r.tigo_threads);
  const mem = await peopleIn(rows.map((r) => r.thread_id));
  const list = await Promise.all(rows.map(async (r) => {
    // deno-lint-ignore no-explicit-any
    const t = r.tigo_threads as any;
    const [{ data: last }, { count }] = await Promise.all([
      db.from("tigo_msgs").select("user_id, body, kind, created_at").eq("thread_id", t.id).eq("hidden", false).order("id", { ascending: false }).limit(1).maybeSingle(),
      db.from("tigo_msgs").select("id", { count: "exact", head: true }).eq("thread_id", t.id).neq("user_id", me.id).eq("kind", "text").gt("created_at", r.last_read_at),
    ]);
    const others = mem.filter((m) => m.thread_id === t.id && m.user_id !== me.id && !m.left_at && m.users && m.users.status === "Active").map((m) => pubOf(m.users));
    return { id: t.id, kind: t.kind, title: t.title, channel: t.channel_key, members: others, unread: count ?? 0, at: t.last_at,
      last: last ? { text: (last.user_id === me.id && last.kind === "text" ? "You: " : "") + last.body, at: last.created_at } : null };
  }));
  list.sort((a, b) => (a.at < b.at ? 1 : -1));
  return reply({ ok: true, list });
}
// deno-lint-ignore no-explicit-any
async function shapeTm(rows: any[], me: any) {
  return rows.map((m) => ({ id: m.id, user_id: m.user_id, kind: m.kind, body: m.hidden ? null : m.body, hidden: !!m.hidden, at: m.created_at, mine: m.user_id === me.id }));
}
// deno-lint-ignore no-explicit-any
async function open(p: any, me: any) {
  const m = await memberOf(String(p.id || ""), me); if (!m) return fail("Chat not found.", 404);
  const t = m.tigo_threads, after = Math.max(0, Math.floor(Number(p.after) || 0));
  let q = db.from("tigo_msgs").select("*").eq("thread_id", t.id).order("id", { ascending: false }).limit(after ? 100 : 50);
  if (after) q = q.gt("id", after);
  const [{ data: msgs }, mem] = await Promise.all([q, peopleIn([t.id])]);
  await db.from("tigo_thread_members").update({ last_read_at: new Date().toISOString() }).eq("thread_id", t.id).eq("user_id", me.id);
  return reply({ ok: true, thread: { id: t.id, kind: t.kind, title: t.title, channel: t.channel_key },
    members: mem.filter((x) => !x.left_at && x.users).map((x) => pubOf(x.users)), msgs: await shapeTm((msgs ?? []).reverse(), me) });
}
// deno-lint-ignore no-explicit-any
async function start(p: any, me: any) {
  const uid = String(p.user_id || "");
  if (!isUuid(uid) || uid === me.id) return fail("Choose someone else.");
  const { data: u } = await db.from("users").select("id, username, status").eq("id", uid).maybeSingle();
  if (!u || u.status !== "Active") return fail("User not found.", 404);
  if (!(await mutual(me.id, uid))) return fail(`Follow each other with @${u.username} to chat in Tigo.`, 403);
  const key = [me.id, uid].sort().join(":");
  const { data: ex } = await db.from("tigo_threads").select("id").eq("dm_key", key).maybeSingle();
  if (ex) { await db.from("tigo_thread_members").update({ left_at: null }).eq("thread_id", ex.id).eq("user_id", me.id); return reply({ ok: true, id: ex.id }); }
  const { data: t, error } = await db.from("tigo_threads").insert({ kind: "dm", dm_key: key, created_by: me.id }).select("id").single();
  if (error) { if (error.code === "23505") { const { data: again } = await db.from("tigo_threads").select("id").eq("dm_key", key).single(); return reply({ ok: true, id: again!.id }); } throw error; }
  await db.from("tigo_thread_members").insert([{ thread_id: t.id, user_id: me.id }, { thread_id: t.id, user_id: uid }]);
  return reply({ ok: true, id: t.id });
}
// deno-lint-ignore no-explicit-any
async function group(p: any, me: any) {
  const ids = [...new Set<string>((Array.isArray(p.user_ids) ? p.user_ids : []).map(String))].filter((x) => isUuid(x) && x !== me.id);
  if (ids.length < 2) return fail("Choose at least 2 friends for a group.");
  if (ids.length > 19) return fail("A group can have up to 20 people.");
  const title = String(p.title ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
  if (title) { const v = checkFor(me, title); if (!v.ok) return fail(v.level === "block" ? blockMessage(v.category) : "Please choose a friendlier name.", 422); }
  for (const id of ids) if (!(await mutual(me.id, id))) return fail("You can only add friends who follow you back.", 403);
  const { data: t, error } = await db.from("tigo_threads").insert({ kind: "group", title, created_by: me.id }).select("id").single();
  if (error) throw error;
  await db.from("tigo_thread_members").insert([me.id, ...ids].map((u) => ({ thread_id: t.id, user_id: u })));
  await db.from("tigo_msgs").insert({ thread_id: t.id, user_id: me.id, kind: "system", body: "@" + me.username + " made the group" + (title ? " “" + title + "”" : "") });
  return reply({ ok: true, id: t.id });
}
// deno-lint-ignore no-explicit-any
async function send(p: any, me: any) {
  const m = await memberOf(String(p.id || ""), me); if (!m) return fail("Chat not found.", 404);
  const t = m.tigo_threads;
  const body = String(p.body ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 500);
  if (!body) return fail("Write a message.");
  if (LINK.test(body)) return fail("Links aren't allowed in Tigo chat.", 422);
  const v = checkFor(me, body);
  if (!v.ok) { await logBlock(db, me.id, v, "tigo_chat"); return fail(v.level === "block" ? blockMessage(v.category) : "Please keep it friendly.", 422, { blocked: true }); }
  if (t.kind === "dm") {   // ang kausap ay dapat kaibigan pa rin
    const mem = await peopleIn([t.id]); const o = mem.find((x) => x.user_id !== me.id);
    if (o && !(await mutual(me.id, o.user_id))) return fail("You need to follow each other to chat.", 403);
  }
  const { data: last } = await db.from("tigo_msgs").select("created_at").eq("thread_id", t.id).eq("user_id", me.id).order("id", { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < 900) return fail("Slow down a little.", 429);
  const { data: row, error } = await db.from("tigo_msgs").insert({ thread_id: t.id, user_id: me.id, body }).select("*").single();
  if (error) throw error;
  const now = new Date().toISOString();
  await Promise.all([db.from("tigo_threads").update({ last_at: now }).eq("id", t.id), db.from("tigo_thread_members").update({ last_read_at: now, left_at: null }).eq("thread_id", t.id).eq("user_id", me.id)]);
  return reply({ ok: true, msg: (await shapeTm([row], me))[0] });
}
// deno-lint-ignore no-explicit-any
async function readT(p: any, me: any) {
  const m = await memberOf(String(p.id || ""), me); if (!m) return fail("Chat not found.", 404);
  await db.from("tigo_thread_members").update({ last_read_at: new Date().toISOString() }).eq("thread_id", m.thread_id).eq("user_id", me.id);
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function leave(p: any, me: any) {
  const m = await memberOf(String(p.id || ""), me); if (!m) return fail("Chat not found.", 404);
  await db.from("tigo_thread_members").update({ left_at: new Date().toISOString() }).eq("thread_id", m.thread_id).eq("user_id", me.id);
  if (m.tigo_threads.kind === "group") await db.from("tigo_msgs").insert({ thread_id: m.thread_id, user_id: me.id, kind: "system", body: "@" + me.username + " left the group" });
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function unread(_p: any, me: any) {
  const { data: mine } = await db.from("tigo_thread_members").select("thread_id, last_read_at").eq("user_id", me.id).is("left_at", null).limit(100);
  let n = 0;
  for (const r of mine ?? []) {
    const { count } = await db.from("tigo_msgs").select("id", { count: "exact", head: true }).eq("thread_id", r.thread_id).neq("user_id", me.id).eq("kind", "text").gt("created_at", r.last_read_at);
    n += count ?? 0; if (n > 99) break;
  }
  return reply({ ok: true, n });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "friends": return await friends(p, me);
      case "world":   return await world(p, me);
      case "say":     return await say(p, me);
      case "mute":    return await mute(p, me);
      case "del":     return await del(p, me);
      case "visit":   return await visit(p, me);
      case "threads": return await threads(p, me);
      case "open":    return await open(p, me);
      case "start":   return await start(p, me);
      case "group":   return await group(p, me);
      case "send":    return await send(p, me);
      case "read":    return await readT(p, me);
      case "leave":   return await leave(p, me);
      case "unread":  return await unread(p, me);
      default:        return fail("Unknown action.");
    }
  } catch (e) {
    console.error("tigo-social error", e);
    return fail("Server error. Please try again.", 500);
  }
});
