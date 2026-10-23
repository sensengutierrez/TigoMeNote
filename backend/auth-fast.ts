// TigoMeNote · auth-fast (Supabase Edge Function, verify_jwt = off)
// Actions: register, login, checkSession, logout
// Secrets na kailangan: AUTH_PEPPER (required). Optional: REQUIRE_APPROVAL = "true"
// SUPABASE_URL at SUPABASE_SERVICE_ROLE_KEY ay automatic sa Supabase.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const PEPPER = Deno.env.get("AUTH_PEPPER") ?? "";
const REQUIRE_APPROVAL = (Deno.env.get("REQUIRE_APPROVAL") ?? "").toLowerCase() === "true";

const ITERATIONS = 120_000;
const SESSION_HOURS = 24;
const MAX_FAILS = 5;
const LOCK_MINUTES = 30;
const REG_PER_IP_PER_HOUR = 5;
const LOGIN_FAILS_PER_IP_10MIN = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

// ---------- helpers ----------
function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  reply({ ok: false, error, ...extra }, status);

const enc = new TextEncoder();
const toB64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

function randomB64Url(bytes = 32) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return toB64(a).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(s: string) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

async function hashPassword(password: string, saltB64: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password + PEPPER), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2$${ITERATIONS}$${toB64(bits)}`;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
}

function publicUser(u: Record<string, unknown>) {
  return {
    id: u.id, username: u.username, display_name: u.display_name,
    role: u.role, status: u.status, bio: u.bio, avatar_url: u.avatar_url,
    created_at: u.created_at,
  };
}

async function countRecent(key: string, minutes: number) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { count } = await db.from("write_action_dedup")
    .select("id", { count: "exact", head: true })
    .eq("dedup_key", key).gte("created_at", since);
  return count ?? 0;
}
const mark = (key: string, action: string, user_id: string | null = null) =>
  db.from("write_action_dedup").insert({ dedup_key: key, action, user_id });

async function createSession(userId: string, req: Request) {
  const token = randomB64Url(32);
  const expires = new Date(Date.now() + SESSION_HOURS * 3_600_000).toISOString();
  const { error } = await db.from("sessions").insert({
    token_hash: await sha256Hex(token),
    user_id: userId,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200),
    expires_at: expires,
  });
  if (error) throw error;
  return { token, expires_at: expires };
}

async function housekeeping() {
  if (Math.random() > 0.02) return;
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 2 * 86_400_000).toISOString();
  await db.from("sessions").delete().lt("expires_at", now);
  await db.from("write_action_dedup").delete().lt("created_at", old);
}

// ---------- actions ----------
async function register(p: Record<string, string>, req: Request) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const display = String(p.display_name ?? "").trim().replace(/\s+/g, " ");
  const password = String(p.password ?? "");

  if (!/^[a-z0-9_.]{3,24}$/.test(username))
    return fail("Username: 3–24 letters, numbers, _ or . lang.");
  if (display.length < 1 || display.length > 40)
    return fail("Display name: 1–40 characters.");
  if (password.length < 8 || password.length > 72)
    return fail("Password: 8–72 characters.");

  const ipKey = "reg:" + clientIp(req);
  if (await countRecent(ipKey, 60) >= REG_PER_IP_PER_HOUR)
    return fail("Masyadong maraming sign-up. Subukan ulit mamaya.", 429);

  const { count: existing } = await db.from("users").select("id", { count: "exact", head: true });
  const first = (existing ?? 0) === 0;

  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const row = {
    username, display_name: display,
    password_salt: salt, password_hash: await hashPassword(password, salt),
    role: first ? "Admin" : "User",
    status: first || !REQUIRE_APPROVAL ? "Active" : "Pending",
  };
  const { data: user, error } = await db.from("users").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") return fail("May gumagamit na ng username na yan.", 409);
    throw error;
  }
  await mark(ipKey, "register", user.id);

  if (user.status !== "Active")
    return reply({ ok: true, pending: true, message: "Account ginawa na. Hintayin ang approval ng admin." });

  const s = await createSession(user.id, req);
  await db.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  return reply({ ok: true, ...s, user: publicUser(user) });
}

async function login(p: Record<string, string>, req: Request) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const password = String(p.password ?? "");
  if (!username || !password) return fail("Ilagay ang username at password.");

  const ipKey = "loginfail:" + clientIp(req);
  if (await countRecent(ipKey, 10) >= LOGIN_FAILS_PER_IP_10MIN)
    return fail("Masyadong maraming maling login. Subukan ulit pagkalipas ng 10 minuto.", 429);

  const { data: user } = await db.from("users").select("*").eq("username", username).maybeSingle();
  const GENERIC = "Mali ang username o password.";

  if (!user) {
    await hashPassword(password, "AAAAAAAAAAAAAAAAAAAAAA=="); // pantay ang oras
    await mark(ipKey, "login_fail");
    return fail(GENERIC, 401);
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60_000);
    return fail(`Naka-lock ang account. Subukan ulit pagkalipas ng ${mins} minuto.`, 423);
  }

  const ok = safeEqual(await hashPassword(password, user.password_salt), user.password_hash);
  if (!ok) {
    const fails = (user.failed_attempts ?? 0) + 1;
    const lock = fails >= MAX_FAILS;
    await db.from("users").update({
      failed_attempts: lock ? 0 : fails,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
    }).eq("id", user.id);
    await mark(ipKey, "login_fail");
    return lock
      ? fail(`5 beses nang mali. Naka-lock ng ${LOCK_MINUTES} minuto.`, 423)
      : fail(GENERIC, 401, { tries_left: MAX_FAILS - fails });
  }

  if (user.status === "Pending") return fail("Hinihintay pa ang approval ng admin.", 403);
  if (user.status === "Inactive") return fail("Naka-disable ang account na ito.", 403);

  await db.from("users").update({
    failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString(),
  }).eq("id", user.id);

  const s = await createSession(user.id, req);
  return reply({ ok: true, ...s, user: publicUser(user) });
}

async function findSession(token: string) {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions")
    .select("id, expires_at, revoked_at, users(*)")
    .eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  if (!u || u.status !== "Active") return null;
  return { session: data, user: u };
}

async function checkSession(token: string) {
  const s = await findSession(token);
  if (!s) return fail("Session expired. Mag-login ulit.", 401);
  return reply({ ok: true, user: publicUser(s.user), expires_at: s.session.expires_at });
}

async function logout(token: string) {
  if (token) {
    await db.from("sessions").update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", await sha256Hex(token));
  }
  return reply({ ok: true });
}

// ---------- entry ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!PEPPER) return fail("Server not configured (AUTH_PEPPER).", 500);

  try {
    let p: Record<string, string> = {};
    if (req.method === "POST") {
      p = await req.json().catch(() => ({}));
    } else {
      p = Object.fromEntries(new URL(req.url).searchParams);
    }
    const token = String(p.token ?? req.headers.get("x-session-token") ?? "");

    housekeeping().catch(() => {});

    switch (p.action) {
      case "register":     return req.method === "POST" ? await register(p, req) : fail("POST lang.", 405);
      case "login":        return req.method === "POST" ? await login(p, req) : fail("POST lang.", 405);
      case "checkSession": return await checkSession(token);
      case "logout":       return await logout(token);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("auth-fast error", e);
    return fail("Server error. Subukan ulit.", 500);
  }
});
