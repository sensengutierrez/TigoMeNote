// TigoMeNote · daily-fast (Supabase Edge Function, verify_jwt = off) — Reminders at Alarms ng Daily
// Isang trabaho lang: i-save ang reminders/alarms at ipadala ang push sa phone sa tamang oras.
// Actions (session token): list, save, remove, done, snooze
// Action ng cron (bawat minuto, sql/050): due  ← key galing sa app_keys "cron_daily" (hindi service key)
// Files: index.ts + webpush.ts + push.ts (parehong folder sa deploy). VAPID: app_keys "vapid"; FCM: secret FCM_SERVICE_ACCOUNT.
// Ang Daily notes ay HINDI dumadaan dito (nasa device lang).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { type Vapid } from "./webpush.ts";
import { deliver } from "./push.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MAX_ACTIVE = 100;
const REPEATS = ["none", "daily", "weekly", "monthly"];

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
const shape = (r: any) => ({ id: r.id, kind: r.kind, title: r.title, note: r.note, due_at: r.due_at, repeat: r.repeat, done_at: r.done_at, sent_at: r.sent_at });

// Susunod na oras ng umuulit na reminder (laging lampas sa ngayon)
function nextDue(iso: string, repeat: string): string | null {
  if (repeat === "none") return null;
  const d = new Date(iso), now = Date.now();
  for (let i = 0; i < 400 && d.getTime() <= now; i++) {
    if (repeat === "daily") d.setUTCDate(d.getUTCDate() + 1);
    else if (repeat === "weekly") d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d.toISOString();
}

// deno-lint-ignore no-explicit-any
async function list(_p: any, me: any) {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await db.from("reminders").select("*").eq("user_id", me.id)
    .or(`done_at.is.null,done_at.gte.${since}`).order("due_at", { ascending: true }).limit(200);
  return reply({ ok: true, list: (data ?? []).map(shape) });
}

// deno-lint-ignore no-explicit-any
async function save(p: any, me: any) {
  const title = String(p.title ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!title) return fail("Add a title.");
  const due = new Date(String(p.due_at ?? ""));
  if (isNaN(due.getTime())) return fail("Pick a date and time.");
  if (due.getTime() > Date.now() + 2 * 365 * 86_400_000) return fail("Up to 2 years ahead.");
  const row = {
    kind: p.kind === "alarm" ? "alarm" : "reminder", title,
    note: p.note ? String(p.note).trim().slice(0, 300) || null : null,
    repeat: REPEATS.includes(p.repeat) ? p.repeat : "none",
    due_at: due.toISOString(), done_at: null, sent_at: null, updated_at: nowIso(),
  };
  if (row.repeat === "none" && due.getTime() < Date.now() - 60_000) return fail("That time has passed. Pick a later time.");
  if (row.repeat !== "none") row.due_at = due.getTime() < Date.now() ? nextDue(row.due_at, row.repeat)! : row.due_at;
  if (p.id) {
    const { data, error } = await db.from("reminders").update(row).eq("id", String(p.id)).eq("user_id", me.id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return fail("Not found.", 404);
    return reply({ ok: true, item: shape(data) });
  }
  const { count } = await db.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("done_at", null);
  if ((count ?? 0) >= MAX_ACTIVE) return fail(`Up to ${MAX_ACTIVE} active reminders.`, 429);
  const { data, error } = await db.from("reminders").insert({ ...row, user_id: me.id }).select("*").single();
  if (error) throw error;
  return reply({ ok: true, item: shape(data) });
}

// deno-lint-ignore no-explicit-any
async function remove(p: any, me: any) {
  await db.from("reminders").delete().eq("id", String(p.id || "")).eq("user_id", me.id);
  return reply({ ok: true });
}

// Tapos na: kung umuulit, lilipat sa susunod na oras
// deno-lint-ignore no-explicit-any
async function done(p: any, me: any) {
  const { data: r } = await db.from("reminders").select("*").eq("id", String(p.id || "")).eq("user_id", me.id).maybeSingle();
  if (!r) return fail("Not found.", 404);
  const nx = nextDue(r.due_at, r.repeat);
  const ch = nx ? { due_at: nx, sent_at: null, updated_at: nowIso() } : { done_at: nowIso(), updated_at: nowIso() };
  const { data } = await db.from("reminders").update(ch).eq("id", r.id).select("*").single();
  return reply({ ok: true, item: shape(data) });
}

// deno-lint-ignore no-explicit-any
async function snooze(p: any, me: any) {
  const min = Math.min(120, Math.max(1, Number(p.minutes) || 10));
  const { data } = await db.from("reminders").update({ due_at: new Date(Date.now() + min * 60_000).toISOString(), sent_at: null, done_at: null, updated_at: nowIso() })
    .eq("id", String(p.id || "")).eq("user_id", me.id).select("*").maybeSingle();
  if (!data) return fail("Not found.", 404);
  return reply({ ok: true, item: shape(data) });
}

// ---------- cron: ipadala ang mga oras na ----------
let vapid: Vapid | null = null;
// deno-lint-ignore no-explicit-any
async function due(p: any) {
  const { data: k } = await db.from("app_keys").select("value").eq("name", "cron_daily").maybeSingle();
  if (!k || !p.key || String(p.key) !== String(k.value?.k ?? "")) return fail("Not allowed.", 403);
  const until = new Date(Date.now() + 30_000).toISOString();
  const { data: rows } = await db.from("reminders").select("*").is("done_at", null).is("sent_at", null).lte("due_at", until).order("due_at").limit(300);
  if (!rows || !rows.length) return reply({ ok: true, sent: 0 });
  if (!vapid) {
    const { data: v } = await db.from("app_keys").select("value").eq("name", "vapid").maybeSingle();
    vapid = v ? (v.value as Vapid) : null;
  }
  const users = [...new Set(rows.map((r) => r.user_id))];
  const { data: subs } = await db.from("push_subs").select("*").in("user_id", users);
  let sent = 0;
  await Promise.allSettled(rows.map(async (r) => {
    const mine = (subs ?? []).filter((s) => s.user_id === r.user_id);
    const payload = {
      type: r.kind, id: r.id, title: (r.kind === "alarm" ? "⏰ " : "🔔 ") + r.title,
      body: r.note || (r.kind === "alarm" ? "Alarm" : "Reminder"), url: "app/home.html?reminder=" + r.id,
    };
    try { sent += await deliver(db, mine, payload, vapid, { cat: "daily", ttl: 1800, urgency: "high" }); }
    catch (e) { console.error("reminder push failed", String(e)); }
    // Hindi umuulit: markahan na naipadala. Umuulit: ilipat sa susunod na oras.
    const nx = nextDue(r.due_at, r.repeat);
    await db.from("reminders").update(nx ? { due_at: nx, sent_at: null } : { sent_at: nowIso() }).eq("id", r.id);
  }));
  return reply({ ok: true, due: rows.length, sent });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    if (p.action === "due") return await due(p);
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "list":   return await list(p, me);
      case "save":   return await save(p, me);
      case "remove": return await remove(p, me);
      case "done":   return await done(p, me);
      case "snooze": return await snooze(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("daily-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
