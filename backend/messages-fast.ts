// TigoMeNote · messages-fast (Supabase Edge Function, verify_jwt = off) — Tigo Messenger
// Chats (1:1 at group), messages (text, photo, location, sticker), reactions (kahit anong emoji), pin, Seen, message requests.
// Files: index.ts + moderation.ts (text filter) — parehong folder sa deploy.
// Actions (kailangan ng session token):
//   inbox, unread, open, start, group, send, upload, react, pin, read, accept, decline, unsend,
//   rename, addMembers, removeMember, leave
// Real-time: pagkatapos ng bawat pagbabago, nagpapadala ng "ping" (walang laman ng message) sa
//   Supabase Realtime channel na lihim (conversations.channel_key). Ang browser ang kukuha ng bago.
// Push: sa notify-fast (action pushRaw, service key lang), sinusunod ang Messages setting, pause at sleep.
// Patakaran: puwedeng mag-message kahit kanino, pero kung hindi ka nila fina-follow (o wala sa Family/Friends),
//   mapupunta muna sa Message requests. Teen (13–17): mutual followers at Family/Friends lang ang puwedeng mag-message.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkFor, blockMessage, logBlock, autoFlag, isTeen } from "./moderation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const BUCKET = "chat-media";
const PAGE = 40;
const MAX_GROUP = 50;
const MSG_PER_MIN = 30;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];
// Kahit anong isang emoji (pati bago, hal. 🫩 🐦‍🔥, at flags gaya ng 🇵🇭) para sa reaction
const isEmoji = (e: unknown) => typeof e === "string" && e.length <= 32 &&
  /^(?:\p{Regional_Indicator}{2}|[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f\u20e3]+)$/u.test(e) && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(e) &&
  Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(e)).length === 1;
// Putulin nang hindi nahahati ang emoji (iwas "kahon"/� sa preview)
const cut = (t: string, n: number) => { const g = Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(t), (x) => x.segment); return g.length > n ? g.slice(0, n).join("") + "…" : t; };
const PUB = "id, username, display_name, avatar_url, birthdate, status";

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
const rand = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(16).padStart(2, "0")).join("");

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
// deno-lint-ignore no-explicit-any
const pub = (u: any) => (u ? { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } : null);
// deno-lint-ignore no-explicit-any
const nameOf = (u: any) => (u ? u.display_name || "@" + u.username : "Someone");

// ---------- sino ang puwedeng mag-message ----------
async function follows(a: string, b: string) {
  const { data } = await db.from("follows").select("follower_id").eq("follower_id", a).eq("following_id", b).maybeSingle();
  return !!data;
}
async function inCircle(a: string, b: string) {
  const [x, y] = a < b ? [a, b] : [b, a];
  const { data } = await db.from("safety_links").select("id").eq("a_id", x).eq("b_id", y).eq("status", "accepted").maybeSingle();
  return !!data;
}
// Ibinabalik: { ok, request } o { ok: false, error }
// deno-lint-ignore no-explicit-any
async function canMessage(me: any, uid: string): Promise<{ ok: boolean; request?: boolean; error?: string; user?: any }> {
  const { data: u } = await db.from("users").select(PUB).eq("id", uid).maybeSingle();
  if (!u || u.status !== "Active") return { ok: false, error: "User not found." };
  const [theyFollow, iFollow, circle] = await Promise.all([follows(uid, me.id), follows(me.id, uid), inCircle(me.id, uid)]);
  if (isTeen(u.birthdate) && !circle && !(theyFollow && iFollow)) return { ok: false, error: `@${u.username} only gets messages from people they follow back.` };
  if (isTeen(me.birthdate) && !circle && !(theyFollow && iFollow)) return { ok: false, error: "Teen accounts can only message people who follow them back, or Family and Friends." };
  return { ok: true, request: !(theyFollow || circle), user: u };
}

// ---------- membership ----------
// deno-lint-ignore no-explicit-any
async function membership(convId: string, me: any) {
  if (!isUuid(convId)) return null;
  const { data } = await db.from("conversation_members").select("*, conversations(*)").eq("conversation_id", convId).eq("user_id", me.id).maybeSingle();
  // deno-lint-ignore no-explicit-any
  return data && data.status !== "left" ? data as any : null;
}
async function membersOf(convId: string) {
  const { data } = await db.from("conversation_members").select("user_id, role, status, last_read_at, muted, users(" + PUB + ")").eq("conversation_id", convId);
  // deno-lint-ignore no-explicit-any
  return (data ?? []) as any[];
}

// ---------- real-time ping at push ----------
async function ping(channel: string, event: string, payload: Record<string, unknown> = {}) {
  try {
    const r = await fetch(SUPABASE_URL + "/realtime/v1/api/broadcast", {
      method: "POST",
      headers: { "content-type": "application/json", apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
      body: JSON.stringify({ messages: [{ topic: channel, event, payload }] }),
    });
    await r.body?.cancel();
  } catch (e) { console.error("broadcast failed", String(e)); }
}
function pushRaw(to: string[], data: Record<string, unknown>) {
  if (!to.length) return Promise.resolve();
  return fetch(SUPABASE_URL + "/functions/v1/notify-fast", {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": SERVICE_KEY },
    body: JSON.stringify({ action: "pushRaw", to, category: "messages", data }),
  }).then((r) => r.body?.cancel()).catch((e) => console.error("push failed", String(e)));
}
function later(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === "function") rt.waitUntil(p);
}
async function system(convId: string, me: string, body: string) {
  await db.from("messages").insert({ conversation_id: convId, user_id: me, kind: "system", body });
  await db.from("conversations").update({ last_message_at: nowIso() }).eq("id", convId);
}

// ---------- hugis ng message para sa browser ----------
// deno-lint-ignore no-explicit-any
async function shape(rows: any[], me: any) {
  if (!rows.length) return [];
  const ids = rows.map((m) => m.id);
  const paths = rows.filter((m) => m.media_path && !m.deleted_at).map((m) => m.media_path);
  const [{ data: rx }, signed] = await Promise.all([
    db.from("message_reactions").select("message_id, user_id, emoji").in("message_id", ids),
    paths.length ? db.storage.from(BUCKET).createSignedUrls(paths, 3600) : Promise.resolve({ data: [] }),
  ]);
  const url: Record<string, string> = {};
  // deno-lint-ignore no-explicit-any
  ((signed as any).data ?? []).forEach((s: any) => { if (s.path && s.signedUrl) url[s.path] = s.signedUrl; });
  return rows.map((m) => {
    const gone = !!m.deleted_at, hidden = !!m.hidden_at && m.user_id !== me.id;
    // deno-lint-ignore no-explicit-any
    const r = (rx ?? []).filter((x: any) => x.message_id === m.id);
    return {
      id: m.id, client_id: m.client_id, user_id: m.user_id, kind: m.kind, at: m.created_at, mine: m.user_id === me.id,
      body: gone || hidden ? null : m.body, deleted: gone, hidden: !!m.hidden_at,
      photo: !gone && !hidden && m.media_path ? { url: url[m.media_path] ?? null, w: m.media_w, h: m.media_h } : null,
      loc: !gone && !hidden && m.lat != null ? { lat: m.lat, lng: m.lng } : null,
      // deno-lint-ignore no-explicit-any
      reactions: r.map((x: any) => ({ user_id: x.user_id, emoji: x.emoji })),
    };
  });
}
// deno-lint-ignore no-explicit-any
function preview(m: any, me: string) {
  if (!m) return null;
  const who = m.user_id === me ? "You: " : "";
  const text = m.deleted_at ? "Message unsent" : m.kind === "photo" ? "📷 Photo" : m.kind === "location" ? "📍 Location" : m.kind === "sticker" ? "Sticker" : (m.body ?? "");
  return { at: m.created_at, text: m.kind === "system" ? text : who + text, mine: m.user_id === me, kind: m.kind };
}

// ---------- inbox ----------
// deno-lint-ignore no-explicit-any
async function inbox(_p: any, me: any) {
  const { data: mine } = await db.from("conversation_members").select("conversation_id, status, last_read_at, muted, conversations(*)").eq("user_id", me.id).in("status", ["active", "request"]);
  // deno-lint-ignore no-explicit-any
  const rows = ((mine ?? []) as any[]).filter((r) => r.conversations).sort((a, b) => (a.conversations.last_message_at < b.conversations.last_message_at ? 1 : -1)).slice(0, 100);
  const ids = rows.map((r) => r.conversation_id);
  if (!ids.length) return reply({ ok: true, list: [] });
  const { data: mem } = await db.from("conversation_members").select("conversation_id, user_id, status, users(" + PUB + ")").in("conversation_id", ids).neq("status", "left");
  const list = await Promise.all(rows.map(async (r) => {
    const c = r.conversations;
    const [{ data: last }, { count }] = await Promise.all([
      db.from("messages").select("*").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id).neq("user_id", me.id).is("deleted_at", null).neq("kind", "system").gt("created_at", r.last_read_at),
    ]);
    // deno-lint-ignore no-explicit-any
    const others = (mem ?? []).filter((m: any) => m.conversation_id === c.id && m.user_id !== me.id).map((m: any) => pub(m.users));
    return {
      id: c.id, kind: c.kind, title: c.title, channel: c.channel_key, status: r.status, muted: r.muted,
      members: others, last: preview(last, me.id), unread: count ?? 0, at: c.last_message_at,
    };
  }));
  return reply({ ok: true, list });
}
// Para sa badge ng Messages
// deno-lint-ignore no-explicit-any
async function unread(_p: any, me: any) {
  const { data: mine } = await db.from("conversation_members").select("conversation_id, status, last_read_at").eq("user_id", me.id).in("status", ["active", "request"]);
  let total = 0, requests = 0;
  await Promise.all((mine ?? []).map(async (r) => {
    if (r.status === "request") { requests++; return; }
    const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", r.conversation_id)
      .neq("user_id", me.id).is("deleted_at", null).neq("kind", "system").gt("created_at", r.last_read_at);
    if (count) total++;
  }));
  return reply({ ok: true, unread: total, requests });
}

// ---------- isang chat ----------
// deno-lint-ignore no-explicit-any
async function open(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  const c = m.conversations;
  let q = db.from("messages").select("*").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(PAGE);
  if (p.before) q = q.lt("created_at", String(p.before));
  if (p.after) q = db.from("messages").select("*").eq("conversation_id", c.id).gt("created_at", String(p.after)).order("created_at", { ascending: false }).limit(200);
  const [{ data: rows }, members, pinned] = await Promise.all([
    q, membersOf(c.id),
    c.pinned_message_id ? db.from("messages").select("*").eq("id", c.pinned_message_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const msgs = await shape((rows ?? []).reverse(), me);
  const pin = pinned.data && !pinned.data.deleted_at ? (await shape([pinned.data], me))[0] : null;
  if (m.status === "active" && !p.before) {
    // "read" ping lang kung may bago talagang nabasa (iwas loop: open → ping → open → ping…)
    const newest = (rows ?? []).find((r) => r.user_id !== me.id);
    const fresh = !!newest && (!m.last_read_at || newest.created_at > m.last_read_at);
    await db.from("conversation_members").update({ last_read_at: nowIso() }).eq("conversation_id", c.id).eq("user_id", me.id);
    if (fresh) later(ping(c.channel_key, "read", { user_id: me.id }));
  }
  return reply({
    ok: true,
    chat: { id: c.id, kind: c.kind, title: c.title, channel: c.channel_key, status: m.status, role: m.role, muted: m.muted, created_by: c.created_by },
    members: members.filter((x) => x.status !== "left").map((x) => ({ ...pub(x.users), role: x.role, status: x.status, last_read_at: x.last_read_at })),
    messages: msgs, pinned: pin, more: (rows ?? []).length === PAGE,
  });
}

// Simulan (o buksan ulit) ang 1:1 chat
// deno-lint-ignore no-explicit-any
async function start(p: any, me: any) {
  const uid = String(p.user_id || "");
  if (!isUuid(uid) || uid === me.id) return fail("Choose someone else.");
  const key = [me.id, uid].sort().join(":");
  const { data: ex } = await db.from("conversations").select("id").eq("dm_key", key).maybeSingle();
  if (ex) {
    await db.from("conversation_members").update({ status: "active" }).eq("conversation_id", ex.id).eq("user_id", me.id).eq("status", "left");
    return reply({ ok: true, id: ex.id });
  }
  const ok = await canMessage(me, uid);
  if (!ok.ok) return fail(ok.error!, 403);
  const { data: c, error } = await db.from("conversations").insert({ kind: "dm", dm_key: key, created_by: me.id }).select("id").single();
  if (error) {
    if (error.code === "23505") { const { data: again } = await db.from("conversations").select("id").eq("dm_key", key).single(); return reply({ ok: true, id: again!.id }); }
    throw error;
  }
  await db.from("conversation_members").insert([
    { conversation_id: c.id, user_id: me.id, role: "admin", status: "active" },
    { conversation_id: c.id, user_id: uid, role: "member", status: ok.request ? "request" : "active" },
  ]);
  return reply({ ok: true, id: c.id, request: ok.request });
}

// Bagong group chat
// deno-lint-ignore no-explicit-any
async function group(p: any, me: any) {
  const ids = [...new Set<string>((Array.isArray(p.user_ids) ? p.user_ids : []).map(String))].filter((x) => isUuid(x) && x !== me.id);
  if (ids.length < 2) return fail("Choose at least 2 people for a group.");
  if (ids.length > MAX_GROUP - 1) return fail(`A group can have up to ${MAX_GROUP} people.`);
  const title = String(p.title ?? "").trim().replace(/\s+/g, " ").slice(0, 60) || null;
  if (title) { const v = checkFor(me, title); if (!v.ok && v.level === "block") return fail(blockMessage(v.category), 422); }
  const checks = await Promise.all(ids.map((id) => canMessage(me, id)));
  const bad = checks.find((x) => !x.ok);
  if (bad) return fail(bad.error!, 403);
  const { data: c, error } = await db.from("conversations").insert({ kind: "group", title, created_by: me.id }).select("id, channel_key").single();
  if (error) throw error;
  await db.from("conversation_members").insert([
    { conversation_id: c.id, user_id: me.id, role: "admin", status: "active" },
    ...ids.map((id, i) => ({ conversation_id: c.id, user_id: id, role: "member", status: checks[i].request ? "request" : "active" })),
  ]);
  await system(c.id, me.id, `${nameOf(me)} created the group`);
  return reply({ ok: true, id: c.id });
}

// ---------- pagpapadala ----------
// deno-lint-ignore no-explicit-any
async function upload(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  if (Number(p.size) > MAX_PHOTO_BYTES) return fail("The photo is too large.", 413);
  const path = `${m.conversation_id}/${me.id}-${Date.now().toString(36)}${rand()}.jpg`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("signed upload failed");
  return reply({ ok: true, path, url: data.signedUrl });
}

// deno-lint-ignore no-explicit-any
async function send(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  const c = m.conversations;
  const clientId = String(p.client_id ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || null;
  if (clientId) {
    const { data: dup } = await db.from("messages").select("*").eq("user_id", me.id).eq("client_id", clientId).maybeSingle();
    if (dup) return reply({ ok: true, message: (await shape([dup], me))[0], already: true });
  }
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= MSG_PER_MIN) return fail("Slow down a bit 🙂 Try again in a minute.", 429);

  const kind = ["photo", "location", "sticker"].includes(p.kind) ? p.kind : "text";
  const row: Record<string, unknown> = { conversation_id: c.id, user_id: me.id, client_id: clientId, kind };
  // deno-lint-ignore no-explicit-any
  let flagged: any = null;
  const body = String(p.body ?? "").trim().replace(/\n{4,}/g, "\n\n\n").slice(0, 2000);
  if (kind === "text" && !body) return fail("Write a message.");
  if (kind === "sticker") {
    // TigoMeNote stickers: id lang (ang larawan ay nasa app); walang text na kailangang i-check
    if (!/^[a-z0-9-]{2,30}$/.test(body)) return fail("Invalid sticker.");
    row.body = body;
  } else if (body) {
    const v = checkFor(me, body);
    if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "message"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
    if (!v.ok) flagged = v;
    row.body = body;
  }
  if (kind === "photo") {
    const path = String(p.path || "");
    if (!path.startsWith(`${c.id}/${me.id}-`) || path.includes("..")) return fail("Invalid file.", 403);
    const name = path.split("/").pop()!;
    const { data: listed } = await db.storage.from(BUCKET).list(c.id, { search: name, limit: 5 });
    if (!(listed ?? []).some((o) => o.name === name)) return fail("The upload hasn't finished.", 409, { retry: true });
    Object.assign(row, { media_path: path, media_w: Number(p.w) || null, media_h: Number(p.h) || null });
  }
  if (kind === "location") {
    const lat = Number(p.lat), lng = Number(p.lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail("Invalid location.");
    Object.assign(row, { lat, lng });
  }
  // Ang pag-reply sa message request = pagtanggap
  if (m.status === "request") await db.from("conversation_members").update({ status: "active" }).eq("conversation_id", c.id).eq("user_id", me.id);
  const { data: msg, error } = await db.from("messages").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") { const { data: again } = await db.from("messages").select("*").eq("user_id", me.id).eq("client_id", clientId).single(); return reply({ ok: true, message: (await shape([again], me))[0], already: true }); }
    throw error;
  }
  const now = nowIso();
  await Promise.all([
    db.from("conversations").update({ last_message_at: now }).eq("id", c.id),
    db.from("conversation_members").update({ last_read_at: now }).eq("conversation_id", c.id).eq("user_id", me.id),
  ]);
  if (flagged) await autoFlag(db, { type: "message", id: msg.id, owner: me.id }, flagged);

  // Real-time + push sa iba
  const members = await membersOf(c.id);
  const to = members.filter((x) => x.user_id !== me.id && x.status !== "left" && !x.muted).map((x) => x.user_id);
  const text = kind === "photo" ? "📷 Photo" : kind === "location" ? "📍 Shared a location" : kind === "sticker" ? "Sent a sticker" : cut(body, 140);
  later(Promise.all([
    ping(c.channel_key, "msg", { id: msg.id, user_id: me.id }),
    pushRaw(to, {
      type: "message", id: c.id, tag: "chat-" + c.id,
      title: c.kind === "group" ? (c.title || "Group chat") : nameOf(me),
      body: c.kind === "group" ? `${nameOf(me)}: ${text}` : text,
      url: "app/messages.html?c=" + c.id,
    }),
  ]));
  return reply({ ok: true, message: (await shape([msg], me))[0] });
}

// ---------- reactions, pin, read ----------
// deno-lint-ignore no-explicit-any
async function msgFor(id: string, me: any) {
  if (!isUuid(id)) return null;
  const { data: msg } = await db.from("messages").select("*").eq("id", id).maybeSingle();
  if (!msg) return null;
  const m = await membership(msg.conversation_id, me);
  return m ? { msg, m } : null;
}
// deno-lint-ignore no-explicit-any
async function react(p: any, me: any) {
  const x = await msgFor(String(p.message_id), me);
  if (!x || x.msg.deleted_at || x.msg.kind === "system") return fail("Message not found.", 404);
  if (!p.emoji) await db.from("message_reactions").delete().eq("message_id", x.msg.id).eq("user_id", me.id);
  else {
    if (!EMOJIS.includes(p.emoji) && !isEmoji(p.emoji)) return fail("Invalid reaction.");
    await db.from("message_reactions").upsert({ message_id: x.msg.id, user_id: me.id, emoji: p.emoji, created_at: nowIso() });
  }
  later(ping(x.m.conversations.channel_key, "react", { id: x.msg.id }));
  return reply({ ok: true, message: (await shape([x.msg], me))[0] });
}
// I-pin ang message (hal. location) sa itaas ng chat. Group: admin lang.
// deno-lint-ignore no-explicit-any
async function pin(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m || m.status !== "active") return fail("Chat not found.", 404);
  const c = m.conversations;
  if (c.kind === "group" && m.role !== "admin") return fail("Only group admins can pin messages.", 403);
  let mid: string | null = null;
  if (p.message_id) {
    const x = await msgFor(String(p.message_id), me);
    if (!x || x.msg.conversation_id !== c.id || x.msg.deleted_at || x.msg.kind === "system") return fail("Message not found.", 404);
    mid = x.msg.id;
  }
  await db.from("conversations").update({ pinned_message_id: mid }).eq("id", c.id);
  await system(c.id, me.id, mid ? `${nameOf(me)} pinned a message` : `${nameOf(me)} unpinned a message`);
  later(ping(c.channel_key, "pin", {}));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function read(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m || m.status !== "active") return reply({ ok: true });
  const { data: newest } = await db.from("messages").select("created_at").eq("conversation_id", m.conversation_id).neq("user_id", me.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const fresh = !!newest && (!m.last_read_at || newest.created_at > m.last_read_at);
  await db.from("conversation_members").update({ last_read_at: nowIso() }).eq("conversation_id", m.conversation_id).eq("user_id", me.id);
  if (fresh) later(ping(m.conversations.channel_key, "read", { user_id: me.id }));
  return reply({ ok: true });
}

// ---------- message requests ----------
// deno-lint-ignore no-explicit-any
async function accept(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  await db.from("conversation_members").update({ status: "active", last_read_at: nowIso() }).eq("conversation_id", m.conversation_id).eq("user_id", me.id);
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function decline(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  await db.from("conversation_members").update({ status: "left" }).eq("conversation_id", m.conversation_id).eq("user_id", me.id);
  return reply({ ok: true });
}

// I-unsend ang sariling message (mawawala ang laman at photo)
// deno-lint-ignore no-explicit-any
async function unsend(p: any, me: any) {
  const x = await msgFor(String(p.message_id), me);
  if (!x || x.msg.user_id !== me.id || x.msg.kind === "system") return fail("You can only unsend your own messages.", 403);
  if (x.msg.media_path) await db.storage.from(BUCKET).remove([x.msg.media_path]);
  await db.from("messages").update({ deleted_at: nowIso(), body: null, media_path: null, lat: null, lng: null }).eq("id", x.msg.id);
  await db.from("message_reactions").delete().eq("message_id", x.msg.id);
  if (x.m.conversations.pinned_message_id === x.msg.id) await db.from("conversations").update({ pinned_message_id: null }).eq("id", x.msg.conversation_id);
  later(ping(x.m.conversations.channel_key, "unsend", { id: x.msg.id }));
  return reply({ ok: true });
}

// ---------- group ----------
// deno-lint-ignore no-explicit-any
async function rename(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m || m.conversations.kind !== "group" || m.status !== "active") return fail("Group not found.", 404);
  const title = String(p.title ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!title) return fail("Write a group name.");
  const v = checkFor(me, title);
  if (!v.ok && v.level === "block") return fail(blockMessage(v.category), 422);
  await db.from("conversations").update({ title }).eq("id", m.conversation_id);
  await system(m.conversation_id, me.id, `${nameOf(me)} named the group "${title}"`);
  later(ping(m.conversations.channel_key, "meta", {}));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function addMembers(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m || m.conversations.kind !== "group" || m.role !== "admin") return fail("Only group admins can add people.", 403);
  const cur = await membersOf(m.conversation_id);
  const ids = [...new Set<string>((Array.isArray(p.user_ids) ? p.user_ids : []).map(String))].filter((x) => isUuid(x) && !cur.some((c) => c.user_id === x && c.status !== "left"));
  if (!ids.length) return fail("Choose someone to add.");
  if (cur.filter((c) => c.status !== "left").length + ids.length > MAX_GROUP) return fail(`A group can have up to ${MAX_GROUP} people.`);
  const checks = await Promise.all(ids.map((id) => canMessage(me, id)));
  const bad = checks.find((x) => !x.ok);
  if (bad) return fail(bad.error!, 403);
  await db.from("conversation_members").upsert(ids.map((id, i) => ({ conversation_id: m.conversation_id, user_id: id, role: "member", status: checks[i].request ? "request" : "active", joined_at: nowIso() })), { onConflict: "conversation_id,user_id" });
  await system(m.conversation_id, me.id, `${nameOf(me)} added ${checks.map((c) => nameOf(c.user)).join(", ")}`);
  later(ping(m.conversations.channel_key, "meta", {}));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function removeMember(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m || m.conversations.kind !== "group" || m.role !== "admin") return fail("Only group admins can remove people.", 403);
  const uid = String(p.user_id || "");
  if (uid === me.id) return fail("Use Leave group instead.");
  const { data: u } = await db.from("users").select(PUB).eq("id", uid).maybeSingle();
  await db.from("conversation_members").update({ status: "left" }).eq("conversation_id", m.conversation_id).eq("user_id", uid);
  await system(m.conversation_id, me.id, `${nameOf(me)} removed ${nameOf(u)}`);
  later(ping(m.conversations.channel_key, "meta", {}));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function leave(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  await db.from("conversation_members").update({ status: "left", role: "member" }).eq("conversation_id", m.conversation_id).eq("user_id", me.id);
  if (m.conversations.kind === "group") {
    const rest = (await membersOf(m.conversation_id)).filter((x) => x.status === "active");
    if (rest.length && !rest.some((x) => x.role === "admin")) await db.from("conversation_members").update({ role: "admin" }).eq("conversation_id", m.conversation_id).eq("user_id", rest[0].user_id);
    await system(m.conversation_id, me.id, `${nameOf(me)} left the group`);
    later(ping(m.conversations.channel_key, "meta", {}));
  }
  return reply({ ok: true });
}
// I-mute ang chat (walang push)
// deno-lint-ignore no-explicit-any
async function mute(p: any, me: any) {
  const m = await membership(String(p.id), me);
  if (!m) return fail("Chat not found.", 404);
  await db.from("conversation_members").update({ muted: !!p.on }).eq("conversation_id", m.conversation_id).eq("user_id", me.id);
  return reply({ ok: true, muted: !!p.on });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "inbox":        return await inbox(p, me);
      case "unread":       return await unread(p, me);
      case "open":         return await open(p, me);
      case "start":        return await start(p, me);
      case "group":        return await group(p, me);
      case "upload":       return await upload(p, me);
      case "send":         return await send(p, me);
      case "react":        return await react(p, me);
      case "pin":          return await pin(p, me);
      case "read":         return await read(p, me);
      case "accept":       return await accept(p, me);
      case "decline":      return await decline(p, me);
      case "unsend":       return await unsend(p, me);
      case "rename":       return await rename(p, me);
      case "addMembers":   return await addMembers(p, me);
      case "removeMember": return await removeMember(p, me);
      case "leave":        return await leave(p, me);
      case "mute":         return await mute(p, me);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("messages-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
