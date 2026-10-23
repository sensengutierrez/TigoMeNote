// TigoMeNote · auth-fast (Supabase Edge Function, verify_jwt = off)
// Actions: register, login, verifyEmail, resendCode, checkSession, logout
// Secrets: AUTH_PEPPER (required), SMTP_USER + SMTP_PASS (Gmail + App Password, required para sa email)
// Optional: SMTP_HOST (default smtp.gmail.com), MAIL_FROM_NAME (default TigoMeNote), REQUIRE_APPROVAL = "true"
// SUPABASE_URL at SUPABASE_SERVICE_ROLE_KEY ay automatic sa Supabase.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.15";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const PEPPER = Deno.env.get("AUTH_PEPPER") ?? "";
const REQUIRE_APPROVAL = (Deno.env.get("REQUIRE_APPROVAL") ?? "").toLowerCase() === "true";
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = (Deno.env.get("SMTP_PASS") ?? "").replace(/\s+/g, ""); // tinatanggal ang spaces ng Gmail app password
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const FROM_NAME = Deno.env.get("MAIL_FROM_NAME") ?? "TigoMeNote";

const ITERATIONS = 120_000;
const SESSION_HOURS = 24;
const MAX_FAILS = 5;
const LOCK_MINUTES = 30;
const REG_PER_IP_PER_HOUR = 5;
const LOGIN_FAILS_PER_IP_10MIN = 30;
const CODE_MINUTES = 15;          // buhay ng code
const CODE_TRIES = 5;             // maling hula bawat code
const RESEND_COOLDOWN_S = 60;     // hintay bago mag-resend
const CODES_PER_HOUR = 5;         // max codes bawat user bawat oras
const VERIFY_FAILS_PER_IP_10MIN = 30;
const UNVERIFIED_TTL_HOURS = 24;  // binubura ang hindi na-verify na account pagkatapos nito

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

function maskEmail(e: string) {
  const [name, domain] = String(e).split("@");
  if (!domain) return "";
  const shown = name.length <= 2 ? name[0] : name.slice(0, 2);
  return shown + "•".repeat(Math.max(2, Math.min(6, name.length - shown.length))) + "@" + domain;
}

function publicUser(u: Record<string, unknown>) {
  return {
    id: u.id, username: u.username, display_name: u.display_name,
    role: u.role, status: u.status, bio: u.bio, avatar_url: u.avatar_url,
    email: u.email, email_verified: !!u.email_verified_at,
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
  const staleUnverified = new Date(Date.now() - UNVERIFIED_TTL_HOURS * 3_600_000).toISOString();
  await db.from("sessions").delete().lt("expires_at", now);
  await db.from("write_action_dedup").delete().lt("created_at", old);
  await db.from("email_codes").delete().lt("expires_at", old);
  await db.from("users").delete().eq("status", "Unverified").lt("created_at", staleUnverified);
}

// ---------- email ----------
const mailer = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({ host: SMTP_HOST, port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  : null;

function codeEmailHtml(name: string, code: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:Inter,Arial,sans-serif;color:#121212">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:440px;background:#ffffff;border:1px solid #e7e6e3;border-radius:18px" cellpadding="0" cellspacing="0">
  <tr><td style="padding:28px 28px 8px"><div style="font-weight:800;font-size:18px">Tigo<span style="color:#ff5a36">Me</span>Note</div></td></tr>
  <tr><td style="padding:8px 28px 0;font-size:15px;line-height:1.5">Hi ${esc(name)}, ito ang code para ma-verify ang email mo:</td></tr>
  <tr><td style="padding:18px 28px"><div style="font-size:34px;font-weight:800;letter-spacing:10px;background:#f3f3f1;border-radius:12px;padding:16px 0;text-align:center">${code}</div></td></tr>
  <tr><td style="padding:0 28px 28px;font-size:13px;color:#55545a;line-height:1.5">Mag-e-expire ito sa ${CODE_MINUTES} minuto. Kung hindi ikaw ang gumawa ng account, i-ignore lang ang email na ito.</td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendCode(user: Record<string, any>) {
  if (!mailer) throw new Error("SMTP not configured");
  // patayin ang mga lumang code
  await db.from("email_codes").update({ used_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("purpose", "verify").is("used_at", null);
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  const code = String(n).padStart(6, "0");
  const { error } = await db.from("email_codes").insert({
    user_id: user.id, purpose: "verify",
    code_hash: await sha256Hex(code + ":" + user.id + ":" + PEPPER),
    expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
  });
  if (error) throw error;
  await mailer.sendMail({
    from: `"${FROM_NAME}" <${SMTP_USER}>`,
    to: user.email,
    subject: `${code} ang TigoMeNote code mo`,
    text: `Hi ${user.display_name}, ang verification code mo ay ${code}. Mag-e-expire ito sa ${CODE_MINUTES} minuto.`,
    html: codeEmailHtml(user.display_name, code),
  });
}

async function lastCode(userId: string) {
  const { data } = await db.from("email_codes").select("*")
    .eq("user_id", userId).eq("purpose", "verify")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

async function codesLastHour(userId: string) {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from("email_codes").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("purpose", "verify").gte("created_at", since);
  return count ?? 0;
}

// Status pagka-verify: Admin = Active agad; iba = Pending kung REQUIRE_APPROVAL
const statusAfterVerify = (u: Record<string, any>) =>
  u.role === "Admin" || !REQUIRE_APPROVAL ? "Active" : "Pending";

const needsVerify = (u: Record<string, any>, sent: boolean, extra: Record<string, unknown> = {}) =>
  reply({ ok: true, verify: true, username: u.username, email_masked: maskEmail(u.email), sent, resend_in: RESEND_COOLDOWN_S, ...extra });

// ---------- actions ----------
async function register(p: Record<string, string>, req: Request) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const display = String(p.display_name ?? "").trim().replace(/\s+/g, " ");
  const email = String(p.email ?? "").trim().toLowerCase();
  const password = String(p.password ?? "");

  if (display.length < 1 || display.length > 40)
    return fail("Display name: 1–40 characters.");
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return fail("Ilagay ang tamang email address.");
  if (!/^[a-z0-9_.]{3,24}$/.test(username))
    return fail("Username: 3–24 letters, numbers, _ or . lang.");
  if (password.length < 8 || password.length > 72)
    return fail("Password: 8–72 characters.");
  if (!mailer) return fail("Hindi pa naka-setup ang email ng server (SMTP).", 500);

  const ipKey = "reg:" + clientIp(req);
  if (await countRecent(ipKey, 60) >= REG_PER_IP_PER_HOUR)
    return fail("Masyadong maraming sign-up. Subukan ulit mamaya.", 429);

  // Unang account (hindi kasama ang hindi pa verified na lumang tangka) = Admin
  const { count: existing } = await db.from("users").select("id", { count: "exact", head: true }).neq("status", "Unverified");
  const first = (existing ?? 0) === 0;

  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const row = {
    username, display_name: display, email,
    password_salt: salt, password_hash: await hashPassword(password, salt),
    role: first ? "Admin" : "User",
    status: "Unverified",
  };
  const { data: user, error } = await db.from("users").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") {
      return /email/i.test(error.message)
        ? fail("May account na ang email na yan. Mag-sign in na lang.", 409, { field: "email" })
        : fail("May gumagamit na ng username na yan.", 409, { field: "username" });
    }
    throw error;
  }
  await mark(ipKey, "register", user.id);

  try {
    await sendCode(user);
    return needsVerify(user, true);
  } catch (e) {
    console.error("sendCode failed", e);
    return needsVerify(user, false, { warning: "Hindi naipadala ang email. Pindutin ang Resend code." , resend_in: 0 });
  }
}

async function login(p: Record<string, string>, req: Request) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const password = String(p.password ?? "");
  if (!username || !password) return fail("Ilagay ang username at password.");

  const ipKey = "loginfail:" + clientIp(req);
  if (await countRecent(ipKey, 10) >= LOGIN_FAILS_PER_IP_10MIN)
    return fail("Masyadong maraming maling login. Subukan ulit pagkalipas ng 10 minuto.", 429);

  // Pwedeng username o email
  const col = username.includes("@") ? "email" : "username";
  const { data: user } = await db.from("users").select("*").eq(col, username).maybeSingle();
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

  if (user.failed_attempts) await db.from("users").update({ failed_attempts: 0, locked_until: null }).eq("id", user.id);

  if (user.status === "Unverified") {
    // Tama ang password pero hindi pa verified: magpadala ng bagong code kung pwede na
    const last = await lastCode(user.id);
    const age = last ? (Date.now() - new Date(last.created_at).getTime()) / 1000 : Infinity;
    let sent = false;
    if (age >= RESEND_COOLDOWN_S && await codesLastHour(user.id) < CODES_PER_HOUR) {
      try { await sendCode(user); sent = true; } catch (e) { console.error("sendCode failed", e); }
    }
    return needsVerify(user, sent, { resend_in: sent ? RESEND_COOLDOWN_S : Math.max(0, Math.ceil(RESEND_COOLDOWN_S - age)) });
  }
  if (user.status === "Pending") return fail("Hinihintay pa ang approval ng admin.", 403);
  if (user.status === "Inactive") return fail("Naka-disable ang account na ito.", 403);

  await db.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  const s = await createSession(user.id, req);
  return reply({ ok: true, ...s, user: publicUser(user) });
}

async function verifyEmail(p: Record<string, string>, req: Request) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const code = String(p.code ?? "").replace(/\D/g, "");
  if (!username || code.length !== 6) return fail("Ilagay ang 6-digit code.");

  const ipKey = "verifyfail:" + clientIp(req);
  if (await countRecent(ipKey, 10) >= VERIFY_FAILS_PER_IP_10MIN)
    return fail("Masyadong maraming maling code. Subukan ulit pagkalipas ng 10 minuto.", 429);

  const { data: user } = await db.from("users").select("*").eq("username", username).maybeSingle();
  if (!user) { await mark(ipKey, "verify_fail"); return fail("Hindi makita ang account.", 404); }
  if (user.status !== "Unverified") return fail("Verified na ang account na ito. Mag-sign in na lang.", 409, { already: true });

  const last = await lastCode(user.id);
  if (!last || last.used_at) return fail("Walang active na code. Pindutin ang Resend code.", 410, { expired: true });
  if (new Date(last.expires_at) <= new Date()) return fail("Expired na ang code. Pindutin ang Resend code.", 410, { expired: true });
  if (last.attempts >= CODE_TRIES) return fail("Sobra na ang maling hula. Pindutin ang Resend code.", 410, { expired: true });

  const good = safeEqual(await sha256Hex(code + ":" + user.id + ":" + PEPPER), last.code_hash);
  if (!good) {
    const attempts = last.attempts + 1;
    await db.from("email_codes").update({ attempts }).eq("id", last.id);
    await mark(ipKey, "verify_fail", user.id);
    const left = CODE_TRIES - attempts;
    return left > 0
      ? fail("Mali ang code.", 401, { tries_left: left })
      : fail("Sobra na ang maling hula. Pindutin ang Resend code.", 410, { expired: true });
  }

  const now = new Date().toISOString();
  const status = statusAfterVerify(user);
  await db.from("email_codes").update({ used_at: now }).eq("id", last.id);
  const { data: updated, error } = await db.from("users")
    .update({ email_verified_at: now, status, last_login_at: status === "Active" ? now : null, updated_at: now })
    .eq("id", user.id).select("*").single();
  if (error) throw error;

  if (status !== "Active")
    return reply({ ok: true, pending: true, message: "Verified na ang email! Hintayin ang approval ng admin." });

  const s = await createSession(user.id, req);
  return reply({ ok: true, ...s, user: publicUser(updated) });
}

async function resendCode(p: Record<string, string>) {
  const username = String(p.username ?? "").trim().toLowerCase();
  const { data: user } = await db.from("users").select("*").eq("username", username).maybeSingle();
  // Pareho ang sagot kahit wala ang account, para hindi mahulaan ang mga username
  if (!user || user.status !== "Unverified") return reply({ ok: true, sent: false, resend_in: RESEND_COOLDOWN_S });

  const last = await lastCode(user.id);
  const age = last ? (Date.now() - new Date(last.created_at).getTime()) / 1000 : Infinity;
  if (age < RESEND_COOLDOWN_S) {
    const wait = Math.ceil(RESEND_COOLDOWN_S - age);
    return fail(`Hintayin ang ${wait} segundo bago mag-resend.`, 429, { resend_in: wait });
  }
  if (await codesLastHour(user.id) >= CODES_PER_HOUR)
    return fail("Sobra na ang codes ngayong oras. Subukan ulit mamaya.", 429, { resend_in: 600 });

  try {
    await sendCode(user);
  } catch (e) {
    console.error("sendCode failed", e);
    return fail("Hindi naipadala ang email. Subukan ulit.", 502, { resend_in: 0 });
  }
  return reply({ ok: true, sent: true, email_masked: maskEmail(user.email), resend_in: RESEND_COOLDOWN_S });
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
    const post = req.method === "POST";

    housekeeping().catch(() => {});

    switch (p.action) {
      case "register":     return post ? await register(p, req) : fail("POST lang.", 405);
      case "login":        return post ? await login(p, req) : fail("POST lang.", 405);
      case "verifyEmail":  return post ? await verifyEmail(p, req) : fail("POST lang.", 405);
      case "resendCode":   return post ? await resendCode(p) : fail("POST lang.", 405);
      case "checkSession": return await checkSession(token);
      case "logout":       return await logout(token);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("auth-fast error", e);
    return fail("Server error. Subukan ulit.", 500);
  }
});
