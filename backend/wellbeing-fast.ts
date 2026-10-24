// TigoMeNote · wellbeing-fast (Supabase Edge Function, verify_jwt = off)
// Age limit (13+), Teen (13–17), parental supervision, sleep timer, give a break, daily limit.
// Actions: status, setBirthdate, tick, save, guardianInvite, guardianRespond, guardianRemove
// Kailangan ng session token (x-session-token).
// Patakaran:
//   - Birthdate: isang beses lang mase-set ng user; < 13 = bawal.
//   - Teen na may tinanggap na guardian: ang guardian ang nagse-set ng sleep, break, daily limit at private account.
//   - Walang lihim: nakikita ng teen kung sino ang guardian niya.
//   - Pagdating ng 18, wala nang epekto ang supervision.
//   - Ang SOS at Family ay hindi kailanman bina-block (sa client: safety page ay exempt).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const MIN_AGE = 13;
const ADULT = 18;
const MAX_GUARDIANS = 2;
const DEFAULTS = { sleep_on: false, sleep_start: "22:00", sleep_end: "06:00", break_on: true, break_min: 60, daily_limit_min: null, tz: "Asia/Bahrain" };
const TEEN_DEFAULTS = { ...DEFAULTS, sleep_on: true };

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

export function ageOf(birth: string | null, now = new Date()): number | null {
  if (!birth) return null;
  const b = new Date(birth + "T00:00:00Z");
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a;
}
function validTz(tz: unknown) {
  try { new Intl.DateTimeFormat("en", { timeZone: String(tz) }); return String(tz); } catch { return null; }
}
// Petsa at oras ngayon sa timezone ng user
export function localNow(tz: string, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return { day, hm };
}
// Nasa sleep time ba? (kaya rin ang lampas hatinggabi, hal. 22:00–06:00)
export function inSleep(hm: string, start: string, end: string) {
  if (start === end) return false;
  return start < end ? hm >= start && hm < end : hm >= start || hm < end;
}

// deno-lint-ignore no-explicit-any
async function settingsOf(u: any) {
  const { data } = await db.from("wellbeing").select("*").eq("user_id", u.id).maybeSingle();
  if (data) return data;
  const a = ageOf(u.birthdate);
  return { user_id: u.id, ...(a !== null && a < ADULT ? TEEN_DEFAULTS : DEFAULTS) };
}
// deno-lint-ignore no-explicit-any
async function guardians(u: any, acceptedOnly = true) {
  let q = db.from("guardian_links").select("*").eq("teen_id", u.id);
  if (acceptedOnly) q = q.eq("status", "accepted");
  const { data } = await q;
  return data ?? [];
}
// deno-lint-ignore no-explicit-any
async function isSupervised(u: any) {
  const a = ageOf(u.birthdate);
  return a !== null && a < ADULT && (await guardians(u)).length > 0;
}
// deno-lint-ignore no-explicit-any
async function stateOf(u: any, s: any) {
  const { day, hm } = localNow(s.tz || DEFAULTS.tz);
  const { data: use } = await db.from("usage_days").select("seconds").eq("user_id", u.id).eq("day", day).maybeSingle();
  const used = use?.seconds ?? 0;
  const limit = s.daily_limit_min ? s.daily_limit_min * 60 : null;
  return {
    day, time: hm, used_seconds: used,
    sleep: !!s.sleep_on && inSleep(hm, s.sleep_start, s.sleep_end),
    limit_reached: limit !== null && used >= limit,
    seconds_left: limit !== null ? Math.max(0, limit - used) : null,
  };
}
// deno-lint-ignore no-explicit-any
const pubUser = (u: any) => u ? { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } : null;

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function status(_p: any, me: any) {
  const a = ageOf(me.birthdate);
  const s = await settingsOf(me);
  const gl = await guardians(me, false);
  const { data: wl } = await db.from("guardian_links").select("*").eq("guardian_id", me.id);
  const ids = [...gl.map((g) => g.guardian_id), ...(wl ?? []).map((w) => w.teen_id)];
  const { data: us } = ids.length ? await db.from("users").select(PUB + ", birthdate, private_account").in("id", ids) : { data: [] };
  const byId = Object.fromEntries((us ?? []).map((u) => [u.id, u]));
  const supervised = a !== null && a < ADULT && gl.some((g) => g.status === "accepted");
  const wards: Record<string, unknown>[] = [];
  for (const w of wl ?? []) {
    const t = byId[w.teen_id]; if (!t) continue;
    const item: Record<string, unknown> = { id: w.id, status: w.status, user: pubUser(t), age: ageOf(t.birthdate) };
    if (w.status === "accepted") {
      const ts = await settingsOf(t);
      item.settings = ts; item.state = await stateOf(t, ts); item.private_account = !!t.private_account;
    }
    wards.push(item);
  }
  return reply({
    ok: true,
    me: { birthdate: me.birthdate ?? null, age: a, teen: a !== null && a < ADULT, needs_birthdate: !me.birthdate, private_account: !!me.private_account, supervised },
    settings: s, state: await stateOf(me, s),
    guardians: gl.map((g) => ({ id: g.id, status: g.status, user: pubUser(byId[g.guardian_id]) })),
    wards, min_age: MIN_AGE,
  });
}

// deno-lint-ignore no-explicit-any
async function setBirthdate(p: any, me: any) {
  if (me.birthdate) return fail("Your birthdate is already set. Ask an admin to change it.", 409);
  const b = String(p.birthdate || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b) || isNaN(new Date(b + "T00:00:00Z").getTime())) return fail("Enter a valid date.");
  if (new Date(b + "T00:00:00Z") > new Date()) return fail("Enter a valid date.");
  const a = ageOf(b)!;
  if (a > 120) return fail("Enter a valid date.");
  if (a < MIN_AGE) return fail(`TigoMeNote is for ages ${MIN_AGE} and up.`, 403, { too_young: true });
  const teen = a < ADULT;
  const ch: Record<string, unknown> = { birthdate: b, updated_at: nowIso() };
  if (teen) ch.private_account = true;
  await db.from("users").update(ch).eq("id", me.id);
  if (teen) await db.from("wellbeing").upsert({ user_id: me.id, ...TEEN_DEFAULTS, tz: validTz(p.tz) ?? DEFAULTS.tz, updated_by: me.id }, { onConflict: "user_id", ignoreDuplicates: true });
  return reply({ ok: true, age: a, teen });
}

// Bilang ng oras habang bukas ang app (bawat ~60 s)
// deno-lint-ignore no-explicit-any
async function tick(p: any, me: any) {
  const s = await settingsOf(me);
  const tz = validTz(p.tz);
  if (tz && tz !== s.tz && !(await isSupervised(me))) {
    await db.from("wellbeing").upsert({ ...stripMeta(s), user_id: me.id, tz, updated_at: nowIso() }, { onConflict: "user_id" });
    s.tz = tz;
  }
  const sec = Math.max(0, Math.min(120, Math.round(Number(p.seconds) || 0)));
  if (sec) {
    const { day } = localNow(s.tz || DEFAULTS.tz);
    const { error } = await db.rpc("add_usage", { p_user: me.id, p_day: day, p_sec: sec });
    if (error) throw error;
  }
  const a = ageOf(me.birthdate);
  return reply({ ok: true, settings: s, state: await stateOf(me, s), supervised: await isSupervised(me), needs_birthdate: !me.birthdate, teen: a !== null && a < ADULT });
}
// deno-lint-ignore no-explicit-any
function stripMeta(s: any) {
  const { sleep_on, sleep_start, sleep_end, break_on, break_min, daily_limit_min, tz } = s;
  return { sleep_on, sleep_start, sleep_end, break_on, break_min, daily_limit_min, tz };
}

// I-save ang settings (sarili, o ng teen na binabantayan mo)
// deno-lint-ignore no-explicit-any
async function save(p: any, me: any) {
  // deno-lint-ignore no-explicit-any
  let target: any = me;
  if (p.user_id && p.user_id !== me.id) {
    const { data: gl } = await db.from("guardian_links").select("*").eq("guardian_id", me.id).eq("teen_id", String(p.user_id)).eq("status", "accepted").maybeSingle();
    if (!gl) return fail("You don't supervise this account.", 403);
    const { data: t } = await db.from("users").select("*").eq("id", gl.teen_id).single();
    if ((ageOf(t.birthdate) ?? ADULT) >= ADULT) return fail("This account is 18 or older now.", 403);
    target = t;
  } else if (await isSupervised(me)) {
    return fail("Your parent manages these settings.", 403);
  }
  const cur = stripMeta(await settingsOf(target));
  const hm = (v: unknown) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) ? String(v) : null;
  const next = { ...cur };
  if (p.sleep_on !== undefined) next.sleep_on = !!p.sleep_on;
  if (p.sleep_start !== undefined) { const v = hm(p.sleep_start); if (!v) return fail("Invalid time."); next.sleep_start = v; }
  if (p.sleep_end !== undefined) { const v = hm(p.sleep_end); if (!v) return fail("Invalid time."); next.sleep_end = v; }
  if (p.break_on !== undefined) next.break_on = !!p.break_on;
  if (p.break_min !== undefined) { const v = Math.round(Number(p.break_min)); if (!(v >= 10 && v <= 240)) return fail("Break: 10–240 minutes."); next.break_min = v; }
  if (p.daily_limit_min !== undefined) {
    if (p.daily_limit_min === null || p.daily_limit_min === "" || p.daily_limit_min === 0) next.daily_limit_min = null;
    else { const v = Math.round(Number(p.daily_limit_min)); if (!(v >= 15 && v <= 1440)) return fail("Daily limit: 15 minutes to 24 hours."); next.daily_limit_min = v; }
  }
  if (p.tz !== undefined) { const v = validTz(p.tz); if (!v) return fail("Invalid time zone."); next.tz = v; }
  await db.from("wellbeing").upsert({ user_id: target.id, ...next, updated_by: me.id, updated_at: nowIso() }, { onConflict: "user_id" });
  if (p.private_account !== undefined) {
    const teen = (ageOf(target.birthdate) ?? ADULT) < ADULT;
    if (!p.private_account && teen && target.id === me.id) return fail("Teen accounts stay private.", 403);
    await db.from("users").update({ private_account: !!p.private_account }).eq("id", target.id);
  }
  return reply({ ok: true, settings: next });
}

// Magulang → mag-imbita ng teen
// deno-lint-ignore no-explicit-any
async function guardianInvite(p: any, me: any) {
  const a = ageOf(me.birthdate);
  if (a === null) return fail("Add your birthdate first.", 400, { needs_birthdate: true });
  if (a < ADULT) return fail("Only adults (18+) can supervise.", 403);
  let q = db.from("users").select("*").eq("status", "Active");
  q = p.user_id ? q.eq("id", String(p.user_id)) : q.ilike("username", String(p.username || "").replace(/^@/, "").replace(/[%_]/g, ""));
  const { data: t } = await q.maybeSingle();
  if (!t || t.id === me.id) return fail("User not found.", 404);
  const ta = ageOf(t.birthdate);
  if (ta === null) return fail("They need to add their birthdate first.", 400);
  if (ta >= ADULT) return fail("Supervision is only for teens (13–17).", 400);
  const gl = await guardians(t, false);
  if (gl.some((g) => g.guardian_id === me.id)) return fail("Invite already sent.", 409);
  if (gl.length >= MAX_GUARDIANS) return fail(`A teen can have up to ${MAX_GUARDIANS} parents/guardians.`, 409);
  const { error } = await db.from("guardian_links").insert({ guardian_id: me.id, teen_id: t.id });
  if (error) { if (error.code === "23505") return fail("Invite already sent.", 409); throw error; }
  return reply({ ok: true });
}

// Teen → tanggapin o tanggihan
// deno-lint-ignore no-explicit-any
async function guardianRespond(p: any, me: any) {
  const { data: g } = await db.from("guardian_links").select("*").eq("id", String(p.id || "")).eq("teen_id", me.id).eq("status", "pending").maybeSingle();
  if (!g) return fail("Invite not found.", 404);
  if (!p.accept) { await db.from("guardian_links").delete().eq("id", g.id); return reply({ ok: true }); }
  await db.from("guardian_links").update({ status: "accepted", accepted_at: nowIso() }).eq("id", g.id);
  // Gawing Family sa Safety, at naka-on ang location sharing ng teen sa guardian
  const [a, b] = me.id < g.guardian_id ? [me.id, g.guardian_id] : [g.guardian_id, me.id];
  const teenCol = a === me.id ? "a_shares" : "b_shares";
  const guardCol = teenCol === "a_shares" ? "b_shares" : "a_shares";
  const { data: l } = await db.from("safety_links").select("*").eq("a_id", a).eq("b_id", b).maybeSingle();
  if (l) await db.from("safety_links").update({ kind: "family", status: "accepted", accepted_at: l.accepted_at ?? nowIso(), [teenCol]: true }).eq("id", l.id);
  else await db.from("safety_links").insert({ a_id: a, b_id: b, kind: "family", status: "accepted", invited_by: g.guardian_id, accepted_at: nowIso(), [teenCol]: true, [guardCol]: true });
  await db.from("users").update({ loc_paused: false, private_account: true }).eq("id", me.id);
  return reply({ ok: true });
}

// Alisin ang supervision: guardian anumang oras; ang teen ay pagdating lang ng 18 (o kung pending pa)
// deno-lint-ignore no-explicit-any
async function guardianRemove(p: any, me: any) {
  const { data: g } = await db.from("guardian_links").select("*").eq("id", String(p.id || "")).maybeSingle();
  if (!g || (g.guardian_id !== me.id && g.teen_id !== me.id)) return fail("Not found.", 404);
  if (g.teen_id === me.id && g.status === "accepted" && (ageOf(me.birthdate) ?? ADULT) < ADULT) return fail("You can't remove your parent until you turn 18.", 403);
  await db.from("guardian_links").delete().eq("id", g.id);
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
      case "status":          return await status(p, me);
      case "setBirthdate":    return await setBirthdate(p, me);
      case "tick":            return await tick(p, me);
      case "save":            return await save(p, me);
      case "guardianInvite":  return await guardianInvite(p, me);
      case "guardianRespond": return await guardianRespond(p, me);
      case "guardianRemove":  return await guardianRemove(p, me);
      default:                return fail("Unknown action.");
    }
  } catch (e) {
    console.error("wellbeing-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
