// TigoMeNote · crash-fast (Supabase Edge Function, verify_jwt = off) — crash report ng Android apps
// Isang trabaho lang: i-save ang dahilan ng force close (galing sa app-mode.js → TMNCrash.take()) sa table na app_crashes.
// Action: report { app: main|chat|tigo, version, report }  · session token kung naka-sign in (hindi required)
// Limit: 12,000 characters bawat report, 300 bawat oras sa lahat; binubura ang lampas 30 araw.
// Files: index.ts lang.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function userId(token: string): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("user_id, expires_at, revoked_at").eq("token_hash", await sha256Hex(token)).maybeSingle();
  return data && !data.revoked_at && new Date(data.expires_at) > new Date() ? data.user_id : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ ok: false, error: "POST only." }, 405);
  try {
    const p = await req.json().catch(() => ({}));
    if (p.action !== "report") return reply({ ok: false, error: "Unknown action." }, 400);
    const app = ["main", "chat", "tigo"].includes(p.app) ? p.app : null;
    const report = String(p.report ?? "").slice(0, 12000);
    if (!app || !report.trim()) return reply({ ok: false, error: "Nothing to report." }, 400);
    const { count } = await db.from("app_crashes").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
    if ((count ?? 0) >= 300) return reply({ ok: true, skipped: true });
    const kind = /kind=webview/.test(report) ? "webview" : /kind=crash/.test(report) ? "crash" : "other";
    const uid = await userId(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    await db.from("app_crashes").insert({ user_id: uid, app, version: String(p.version ?? "?").slice(0, 20), kind, report });
    console.error("app crash", app, p.version, kind, report.slice(0, 800));
    if (Math.random() < 0.05) await db.from("app_crashes").delete().lt("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
    return reply({ ok: true });
  } catch (e) {
    console.error("crash-fast error", e);
    return reply({ ok: false, error: "Server error." }, 500);
  }
});
