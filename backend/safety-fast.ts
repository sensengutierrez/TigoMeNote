// TigoMeNote · safety-fast (Supabase Edge Function, verify_jwt = off)
// Safety: Family/Friends circle, Locate (location 30 araw), SOS, at push notifications.
// Actions: circle, invite, respond, update, remove, pause, ping, history, clearHistory, exportHistory,
//          sos, sosUpdate, sosEnd, alerts, ack, pushKey, subscribe, unsubscribe, testPush
// Kailangan ng session token (x-session-token). Files: index.ts + webpush.ts (parehong folder sa deploy).
// Push: web push (VAPID, key ay ginagawa dito at naka-save sa app_keys). "fcm" = naka-abang para sa APK.
// Patakaran: laging invite + accept; Locate lang kung pinayagan; SOS ay nakikita ng buong circle;
//            Teen na may guardian ay hindi puwedeng mag-pause o mag-off ng sharing sa guardian (hanggang 18).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { makeVapid, sendPush, type Vapid } from "./webpush.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const SITE = "https://sensengutierrez.github.io/TigoMeNote/";
const KEEP_DAYS = 30;            // location history
const MEMBER_HISTORY_HOURS = 24; // gaano katagal na daan ng ibang member ang makikita
const MAX_LINKS = 100;
const PING_MIN_SECONDS = 45;     // pinakamadalas na pag-save ng location (hindi kasama ang SOS)

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
const PUB = "id, username, display_name, avatar_url";
// deno-lint-ignore no-explicit-any
async function usersById(ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {};
  const { data } = await db.from("users").select(PUB + ", loc_paused").in("id", [...new Set(ids)]);
  return Object.fromEntries((data ?? []).map((u) => [u.id, u]));
}
function age(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth + "T00:00:00Z"), n = new Date();
  let a = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
  return a;
}
// Mga guardian ng teen na ito (kung teen nga at may tinanggap na guardian)
// deno-lint-ignore no-explicit-any
async function guardiansOf(me: any): Promise<string[]> {
  const a = age(me.birthdate);
  if (a === null || a >= 18) return [];
  const { data } = await db.from("guardian_links").select("guardian_id").eq("teen_id", me.id).eq("status", "accepted");
  return (data ?? []).map((r) => r.guardian_id);
}
async function wardsOf(uid: string): Promise<string[]> {
  const { data } = await db.from("guardian_links").select("teen_id").eq("guardian_id", uid).eq("status", "accepted");
  return (data ?? []).map((r) => r.teen_id);
}
// deno-lint-ignore no-explicit-any
const other = (l: any, me: string) => (l.a_id === me ? l.b_id : l.a_id);
// deno-lint-ignore no-explicit-any
const iShare = (l: any, me: string) => (l.a_id === me ? l.a_shares : l.b_shares);
// deno-lint-ignore no-explicit-any
const theyShare = (l: any, me: string) => (l.a_id === me ? l.b_shares : l.a_shares);
const myCol = (l: { a_id: string }, me: string) => (l.a_id === me ? "a_shares" : "b_shares");

async function myLinks(uid: string, acceptedOnly = false) {
  let q = db.from("safety_links").select("*").or(`a_id.eq.${uid},b_id.eq.${uid}`);
  if (acceptedOnly) q = q.eq("status", "accepted");
  const { data } = await q;
  return data ?? [];
}
async function circleIds(uid: string) {
  return (await myLinks(uid, true)).map((l) => other(l, uid));
}
async function lastPoint(uid: string) {
  const { data } = await db.from("location_points").select("lat, lng, acc, created_at, source").eq("user_id", uid)
    .gte("created_at", ago(KEEP_DAYS * 86_400_000)).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ? { lat: data.lat, lng: data.lng, acc: data.acc, at: data.created_at, source: data.source } : null;
}
function okCoord(p: Record<string, unknown>) {
  const lat = Number(p.lat), lng = Number(p.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const acc = isFinite(Number(p.acc)) ? Math.min(100000, Math.max(0, Number(p.acc))) : null;
  return { lat, lng, acc };
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
// Ipadala sa lahat ng device ng mga user na ito. Hindi naghihintay nang lampas 8 s bawat isa.
async function pushTo(userIds: string[], data: Record<string, unknown>, urgency = "high") {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return 0;
  const { data: subs } = await db.from("push_subs").select("*").in("user_id", ids);
  if (!subs || !subs.length) return 0;
  const v = await getVapid();
  let sent = 0;
  await Promise.allSettled(subs.map(async (s) => {
    if (s.kind !== "webpush") return; // FCM (APK): idadagdag kapag may Firebase project na
    try {
      const st = await Promise.race([
        sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, data, v, { ttl: data.type === "sos" ? 86400 : 3600, urgency }),
        new Promise<number>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
      ]);
      if (st === 404 || st === 410) await db.from("push_subs").delete().eq("id", s.id);
      else if (st >= 400) await db.from("push_subs").update({ fail_count: (s.fail_count || 0) + 1 }).eq("id", s.id);
      else { sent++; await db.from("push_subs").update({ last_ok_at: nowIso(), fail_count: 0 }).eq("id", s.id); }
    } catch (e) { console.error("push failed", String(e)); }
  }));
  return sent;
}
// deno-lint-ignore no-explicit-any
const nameOf = (u: any) => u.display_name || "@" + u.username;

// ---------- circle ----------
// deno-lint-ignore no-explicit-any
async function circle(_p: any, me: any) {
  if (Math.random() < 0.02) { // paminsan-minsang linis ng lahat
    await db.from("location_points").delete().lt("created_at", ago(KEEP_DAYS * 86_400_000));
    await db.from("sos_alerts").delete().neq("status", "active").lt("started_at", ago(KEEP_DAYS * 86_400_000));
  }
  const links = await myLinks(me.id);
  const ids = links.map((l) => other(l, me.id));
  const [users, guardians, wards, subs] = await Promise.all([
    usersById(ids), guardiansOf(me), wardsOf(me.id),
    db.from("push_subs").select("id", { count: "exact", head: true }).eq("user_id", me.id),
  ]);
  const members: Record<string, unknown>[] = [], incoming: Record<string, unknown>[] = [], outgoing: Record<string, unknown>[] = [];
  for (const l of links) {
    const oid = other(l, me.id), u = users[oid];
    if (!u) continue;
    const item: Record<string, unknown> = {
      id: l.id, kind: l.kind, status: l.status, created_at: l.created_at,
      user: { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url },
      i_share: iShare(l, me.id), they_share: theyShare(l, me.id),
      guardian: guardians.includes(oid), ward: wards.includes(oid),
    };
    item.locked = !!item.guardian; // teen: hindi ma-off ang sharing sa guardian
    if (l.status === "pending") { (l.invited_by === me.id ? outgoing : incoming).push(item); continue; }
    item.paused = !!u.loc_paused;
    item.last = theyShare(l, me.id) && !u.loc_paused ? await lastPoint(oid) : null;
    members.push(item);
  }
  members.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "family" ? -1 : 1));
  return reply({ ok: true, me: { paused: !!me.loc_paused, push: subs.count ?? 0, supervised: guardians.length > 0, last: await lastPoint(me.id) }, members, incoming, outgoing });
}

// deno-lint-ignore no-explicit-any
async function invite(p: any, me: any) {
  const uid = String(p.user_id || "");
  const kind = p.kind === "friend" ? "friend" : "family";
  if (!uid || uid === me.id) return fail("Choose someone else.");
  const { data: u } = await db.from("users").select(PUB).eq("id", uid).eq("status", "Active").maybeSingle();
  if (!u) return fail("User not found.", 404);
  const links = await myLinks(me.id);
  if (links.length >= MAX_LINKS) return fail(`Up to ${MAX_LINKS} people in your circle.`, 429);
  const ex = links.find((l) => other(l, me.id) === uid);
  if (ex) {
    if (ex.status === "accepted") return fail("Already in your circle.", 409);
    return fail(ex.invited_by === me.id ? "Invite already sent." : "They already invited you. Accept it in Invites.", 409);
  }
  const [a, b] = me.id < uid ? [me.id, uid] : [uid, me.id];
  const share = p.share === undefined ? kind === "family" : !!p.share;
  const row = { a_id: a, b_id: b, kind, invited_by: me.id, a_shares: a === me.id ? share : false, b_shares: b === me.id ? share : false };
  const { data, error } = await db.from("safety_links").insert(row).select("*").single();
  if (error) { if (error.code === "23505") return fail("Invite already sent.", 409); throw error; }
  // Lalabas din sa Notifications ng inimbitahan (hindi lang push)
  await db.from("notifications").insert({ user_id: uid, actor_id: me.id, type: "circle_invite", data: { link: data.id, kind } });
  await pushTo([uid], { type: "invite", title: kind === "family" ? "Family invite" : "Friend invite", body: `${nameOf(me)} wants to add you to their ${kind === "family" ? "Family" : "Friends"} circle.`, url: "app/safety.html" }, "normal");
  return reply({ ok: true, id: data.id });
}

// deno-lint-ignore no-explicit-any
async function respond(p: any, me: any) {
  const { data: l } = await db.from("safety_links").select("*").eq("id", String(p.id || "")).maybeSingle();
  if (!l || (l.a_id !== me.id && l.b_id !== me.id) || l.status !== "pending" || l.invited_by === me.id) return fail("Invite not found.", 404);
  await db.from("notifications").delete().eq("type", "circle_invite").eq("data->>link", l.id);
  if (!p.accept) { await db.from("safety_links").delete().eq("id", l.id); return reply({ ok: true }); }
  const share = p.share === undefined ? l.kind === "family" : !!p.share;
  await db.from("safety_links").update({ status: "accepted", accepted_at: nowIso(), [myCol(l, me.id)]: share }).eq("id", l.id);
  await db.from("notifications").insert({ user_id: l.invited_by, actor_id: me.id, type: "circle_accept", data: { link: l.id, kind: l.kind } });
  await pushTo([l.invited_by], { type: "invite-ok", title: "Invite accepted", body: `${nameOf(me)} joined your ${l.kind === "family" ? "Family" : "Friends"} circle.`, url: "app/safety.html" }, "normal");
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function update(p: any, me: any) {
  const { data: l } = await db.from("safety_links").select("*").eq("id", String(p.id || "")).maybeSingle();
  if (!l || (l.a_id !== me.id && l.b_id !== me.id)) return fail("Not found.", 404);
  const ch: Record<string, unknown> = {};
  if (p.share !== undefined) {
    if (!p.share && (await guardiansOf(me)).includes(other(l, me.id))) return fail("Your parent can see your location until you turn 18.", 403);
    ch[myCol(l, me.id)] = !!p.share;
  }
  if (p.kind === "family" || p.kind === "friend") ch.kind = p.kind;
  if (!Object.keys(ch).length) return fail("Nothing to change.");
  await db.from("safety_links").update(ch).eq("id", l.id);
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function remove(p: any, me: any) {
  const { data: l } = await db.from("safety_links").select("*").eq("id", String(p.id || "")).maybeSingle();
  if (!l || (l.a_id !== me.id && l.b_id !== me.id)) return fail("Not found.", 404);
  if ((await guardiansOf(me)).includes(other(l, me.id))) return fail("You can't remove your parent until you turn 18.", 403);
  await db.from("safety_links").delete().eq("id", l.id);
  if (l.status === "pending") await db.from("notifications").delete().eq("type", "circle_invite").eq("data->>link", l.id);
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function pause(p: any, me: any) {
  if (p.on && (await guardiansOf(me)).length) return fail("Your parent can see your location until you turn 18.", 403);
  await db.from("users").update({ loc_paused: !!p.on }).eq("id", me.id);
  return reply({ ok: true, paused: !!p.on });
}

// ---------- location ----------
// deno-lint-ignore no-explicit-any
async function ping(p: any, me: any) {
  const c = okCoord(p);
  if (!c) return fail("Invalid location.");
  const source = ["app", "manual", "background"].includes(p.source) ? p.source : "app";
  const { data: sos } = await db.from("sos_alerts").select("id").eq("user_id", me.id).eq("status", "active").maybeSingle();
  if (me.loc_paused && !sos) return reply({ ok: true, saved: false, paused: true });
  if (!sos && source !== "manual") {
    const { data: last } = await db.from("location_points").select("created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (last && Date.now() - new Date(last.created_at).getTime() < PING_MIN_SECONDS * 1000) return reply({ ok: true, saved: false });
  }
  await db.from("location_points").insert({ user_id: me.id, ...c, source: sos ? "sos" : source });
  if (sos) await db.from("sos_alerts").update({ ...c, loc_at: nowIso() }).eq("id", sos.id);
  await db.from("location_points").delete().eq("user_id", me.id).lt("created_at", ago(KEEP_DAYS * 86_400_000));
  return reply({ ok: true, saved: true, sos: !!sos });
}

// deno-lint-ignore no-explicit-any
async function history(p: any, me: any) {
  const uid = String(p.user_id || me.id);
  let hours = Math.min(KEEP_DAYS * 24, Math.max(1, Number(p.hours) || 24));
  if (uid !== me.id) {
    const l = (await myLinks(me.id, true)).find((x) => other(x, me.id) === uid);
    if (!l || !theyShare(l, me.id)) return fail("They haven't allowed you to locate them.", 403);
    const { data: u } = await db.from("users").select("loc_paused").eq("id", uid).single();
    if (u?.loc_paused) return reply({ ok: true, points: [], paused: true });
    hours = Math.min(hours, MEMBER_HISTORY_HOURS);
  }
  const { data } = await db.from("location_points").select("lat, lng, acc, source, created_at").eq("user_id", uid)
    .gte("created_at", ago(hours * 3_600_000)).order("created_at", { ascending: true }).limit(1000);
  return reply({ ok: true, points: (data ?? []).map((r) => ({ lat: r.lat, lng: r.lng, acc: r.acc, source: r.source, at: r.created_at })) });
}

// Buong sariling history (hanggang 30 araw) para sa .zip na kopya bago burahin
// deno-lint-ignore no-explicit-any
async function exportHistory(_p: any, me: any) {
  // deno-lint-ignore no-explicit-any
  const out: any[] = [];
  let after = ago(KEEP_DAYS * 86_400_000);
  for (let i = 0; i < 30; i++) {
    const { data } = await db.from("location_points").select("lat, lng, acc, source, created_at").eq("user_id", me.id)
      .gt("created_at", after).order("created_at", { ascending: true }).limit(1000);
    if (!data || !data.length) break;
    out.push(...data);
    after = data[data.length - 1].created_at;
    if (data.length < 1000) break;
  }
  return reply({ ok: true, points: out.map((r) => ({ lat: r.lat, lng: r.lng, acc: r.acc, source: r.source, at: r.created_at })) });
}

// deno-lint-ignore no-explicit-any
async function clearHistory(_p: any, me: any) {
  await db.from("location_points").delete().eq("user_id", me.id);
  return reply({ ok: true });
}

// ---------- SOS ----------
// deno-lint-ignore no-explicit-any
async function sos(p: any, me: any) {
  const c = okCoord(p);
  const note = String(p.note ?? "").trim().slice(0, 200);
  const { data: cur } = await db.from("sos_alerts").select("*").eq("user_id", me.id).eq("status", "active").maybeSingle();
  if (cur) {
    if (c) { await db.from("sos_alerts").update({ ...c, loc_at: nowIso() }).eq("id", cur.id); await db.from("location_points").insert({ user_id: me.id, ...c, source: "sos" }); }
    return reply({ ok: true, alert: { ...cur, ...(c ?? {}) }, already: true });
  }
  const { data: a, error } = await db.from("sos_alerts").insert({ user_id: me.id, ...(c ?? {}), loc_at: c ? nowIso() : null, note: note || null }).select("*").single();
  if (error) throw error;
  if (c) await db.from("location_points").insert({ user_id: me.id, ...c, source: "sos" });
  const to = await circleIds(me.id);
  const sent = await pushTo(to, {
    type: "sos", id: a.id, from: { id: me.id, username: me.username, display_name: me.display_name },
    title: `🆘 SOS: ${nameOf(me)}`, body: (note ? note + " · " : "") + "Needs help now. Tap to see their location.",
    url: "app/safety.html?sos=" + a.id,
  });
  return reply({ ok: true, alert: a, notified: to.length, devices: sent });
}
// deno-lint-ignore no-explicit-any
async function sosUpdate(p: any, me: any) {
  const c = okCoord(p);
  if (!c) return fail("Invalid location.");
  const { data: a } = await db.from("sos_alerts").select("id").eq("user_id", me.id).eq("status", "active").maybeSingle();
  if (!a) return fail("No active SOS.", 404);
  await db.from("sos_alerts").update({ ...c, loc_at: nowIso() }).eq("id", a.id);
  await db.from("location_points").insert({ user_id: me.id, ...c, source: "sos" });
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function sosEnd(p: any, me: any) {
  const status = p.status === "cancelled" ? "cancelled" : "safe";
  const { data: a } = await db.from("sos_alerts").select("*").eq("user_id", me.id).eq("status", "active").maybeSingle();
  if (!a) return reply({ ok: true, none: true });
  await db.from("sos_alerts").update({ status, ended_at: nowIso() }).eq("id", a.id);
  await pushTo(await circleIds(me.id), {
    type: "sos-end", id: a.id, title: status === "safe" ? `✅ ${nameOf(me)} is safe` : `SOS cancelled: ${nameOf(me)}`,
    body: status === "safe" ? "The SOS has ended." : "It was sent by mistake.", url: "app/safety.html",
  });
  return reply({ ok: true });
}
// Mga active na SOS ng circle (at sarili)
// deno-lint-ignore no-explicit-any
async function alerts(_p: any, me: any) {
  const links = await myLinks(me.id, true);
  const ids = [me.id, ...links.map((l) => other(l, me.id))];
  // share = kailangan bang magpadala ng location ang device na ito (may pinayagan kang mag-Locate sa iyo)
  const share = !me.loc_paused && links.some((l) => iShare(l, me.id));
  const { data: list } = await db.from("sos_alerts").select("*").in("user_id", ids).eq("status", "active").order("started_at", { ascending: false });
  if (!list || !list.length) return reply({ ok: true, alerts: [], share });
  const { data: acks } = await db.from("sos_acks").select("*").in("alert_id", list.map((a) => a.id));
  const users = await usersById([...list.map((a) => a.user_id), ...(acks ?? []).map((k) => k.user_id)]);
  const pick = (u: Record<string, unknown>) => u ? { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } : null;
  return reply({ ok: true, share, alerts: list.map((a) => ({
    id: a.id, mine: a.user_id === me.id, user: pick(users[a.user_id]), note: a.note, started_at: a.started_at,
    loc: a.lat != null ? { lat: a.lat, lng: a.lng, acc: a.acc, at: a.loc_at } : null,
    acks: (acks ?? []).filter((k) => k.alert_id === a.id).map((k) => ({ user: pick(users[k.user_id]), at: k.acked_at })),
    acked: (acks ?? []).some((k) => k.alert_id === a.id && k.user_id === me.id),
  })) });
}
// "Nakita ko / papunta na ako"
// deno-lint-ignore no-explicit-any
async function ack(p: any, me: any) {
  const { data: a } = await db.from("sos_alerts").select("*").eq("id", String(p.id || "")).eq("status", "active").maybeSingle();
  if (!a || a.user_id === me.id || !(await circleIds(me.id)).includes(a.user_id)) return fail("SOS not found.", 404);
  await db.from("sos_acks").upsert({ alert_id: a.id, user_id: me.id });
  await pushTo([a.user_id], { type: "sos-ack", id: a.id, title: `${nameOf(me)} saw your SOS`, body: "They are responding.", url: "app/safety.html" });
  return reply({ ok: true });
}

// ---------- push subscriptions ----------
// deno-lint-ignore no-explicit-any
async function pushKey(_p: any, _me: any) {
  return reply({ ok: true, key: (await getVapid()).publicKey });
}
// deno-lint-ignore no-explicit-any
async function subscribe(p: any, me: any) {
  const kind = p.kind === "fcm" ? "fcm" : "webpush";
  const endpoint = String(p.endpoint || "");
  if (kind === "webpush" && (!/^https:\/\//.test(endpoint) || !p.p256dh || !p.auth)) return fail("Invalid subscription.");
  if (!endpoint || endpoint.length > 2000) return fail("Invalid subscription.");
  const { count } = await db.from("push_subs").select("id", { count: "exact", head: true }).eq("user_id", me.id);
  if ((count ?? 0) >= 10) { // luma muna ang tanggalin
    const { data: old } = await db.from("push_subs").select("id").eq("user_id", me.id).order("created_at", { ascending: true }).limit(1);
    if (old && old[0]) await db.from("push_subs").delete().eq("id", old[0].id);
  }
  const { error } = await db.from("push_subs").upsert({ user_id: me.id, kind, endpoint, p256dh: p.p256dh ?? null, auth: p.auth ?? null, fail_count: 0 }, { onConflict: "endpoint" });
  if (error) throw error;
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function unsubscribe(p: any, me: any) {
  await db.from("push_subs").delete().eq("user_id", me.id).eq("endpoint", String(p.endpoint || ""));
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function testPush(_p: any, me: any) {
  const sent = await pushTo([me.id], { type: "test", title: "TigoMeNote", body: "Notifications are working ✓", url: "app/safety.html" });
  return reply({ ok: true, sent });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "circle":       return await circle(p, me);
      case "invite":       return await invite(p, me);
      case "respond":      return await respond(p, me);
      case "update":       return await update(p, me);
      case "remove":       return await remove(p, me);
      case "pause":        return await pause(p, me);
      case "ping":         return await ping(p, me);
      case "history":      return await history(p, me);
      case "clearHistory": return await clearHistory(p, me);
      case "exportHistory": return await exportHistory(p, me);
      case "sos":          return await sos(p, me);
      case "sosUpdate":    return await sosUpdate(p, me);
      case "sosEnd":       return await sosEnd(p, me);
      case "alerts":       return await alerts(p, me);
      case "ack":          return await ack(p, me);
      case "pushKey":      return await pushKey(p, me);
      case "subscribe":    return await subscribe(p, me);
      case "unsubscribe":  return await unsubscribe(p, me);
      case "testPush":     return await testPush(p, me);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("safety-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
