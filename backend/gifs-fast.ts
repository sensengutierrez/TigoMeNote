// TigoMeNote · gifs-fast (Supabase Edge Function, verify_jwt = off) — GIFs at stickers mula sa KLIPY
// Isang trabaho lang: hanapin ang GIF/sticker sa KLIPY para sa chat, nang hindi nakikita ng browser ang API key.
// Actions (kailangan ng session token): trending, search  ·  data: { type: "gifs"|"stickers", q, page }
// Secret: KLIPY_API_KEY (Supabase → Edge Functions → Secrets). Kung wala pa: { ok: false, setup: true }.
// Kaligtasan: teen (13–17) = rating "g"; iba = "pg-13". Hindi ipinapadala sa KLIPY ang user id (hash lang).
// Bilis: WebP at maliliit na bersyon muna; 5 minutong cache.
// Ibinabalik: { items: [{ id, title, preview: {url,w,h}, full: {url,w,h} }], more }  (KLIPY lang na link)

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const KEY = Deno.env.get("KLIPY_API_KEY") ?? "";
const BASE = "https://api.klipy.com/api/v1/";
const PER_PAGE = 24;
const TRENDING_TTL = 5 * 60_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400, x: Record<string, unknown> = {}) => reply({ ok: false, error: e, ...x }, s);

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

// Teen ba (13–17)? Kapareho ng isTeen sa moderation.ts (kinopya para isang file lang ang function)
function isTeen(birth: string | null | undefined, now = new Date()): boolean {
  if (!birth) return false;
  const b = new Date(birth + "T00:00:00Z");
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a >= 13 && a < 18;
}

// KLIPY lang na link (iwas ibang site sa chat)
const okUrl = (u: unknown) => typeof u === "string" && u.length < 600 && /^https:\/\/([a-z0-9-]+\.)*klipy\.com\//i.test(u);

// Pinakamaliit na bersyon para sa listahan, at katamtamang laki para sa chat
// deno-lint-ignore no-explicit-any
function pick(file: any, sizes: string[], formats: string[]) {
  for (const s of sizes) for (const f of formats) {
    const x = file?.[s]?.[f];
    if (x && okUrl(x.url)) return { url: x.url as string, w: Number(x.width) || null, h: Number(x.height) || null };
  }
  return null;
}
// deno-lint-ignore no-explicit-any
function shape(list: any[]) {
  return list.map((it) => {
    const file = it?.file ?? it?.files;
    if (!file || it?.type === "ad") return null; // ads at walang file: hindi ipinapakita
    // WebP muna (mas maliit at mas mabilis kaysa GIF)
    const preview = pick(file, ["sm", "xs", "md"], ["webp", "jpg", "gif"]);
    const full = pick(file, ["sm", "md", "hd"], ["webp", "gif"]);
    if (!preview || !full) return null;
    return { id: String(it.slug ?? it.id ?? ""), title: String(it.title ?? "").slice(0, 80), preview, full };
  }).filter(Boolean);
}

const cache = new Map<string, { at: number; body: Record<string, unknown> }>();

// deno-lint-ignore no-explicit-any
async function list(p: any, me: any, kind: "trending" | "search") {
  if (!KEY) return fail("GIFs aren't set up yet.", 503, { setup: true });
  const type = p.type === "stickers" ? "stickers" : "gifs";
  const q = String(p.q ?? "").trim().slice(0, 60);
  if (kind === "search" && !q) return fail("Type something to search.");
  const page = Math.min(20, Math.max(1, Number(p.page) || 1));
  const rating = isTeen(me.birthdate) ? "g" : "pg-13";
  const locale = /^[a-z]{2}_[A-Z]{2}$/.test(String(p.locale || "")) ? String(p.locale) : "en_US";
  const ck = [kind, type, q.toLowerCase(), page, rating, locale].join("|");
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TRENDING_TTL) return reply(hit.body);

  const qs = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE), rating, locale, customer_id: (await sha256Hex("tmn:" + me.id)).slice(0, 32) });
  if (kind === "search") qs.set("q", q);
  let r: Response;
  try {
    r = await fetch(`${BASE}${encodeURIComponent(KEY)}/${type}/${kind}?${qs}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  } catch (_e) { return fail("GIFs are slow right now. Please try again.", 504); }
  if (r.status === 401 || r.status === 403) { await r.body?.cancel(); console.error("klipy auth", r.status); return fail("GIFs aren't set up yet.", 503, { setup: true }); }
  if (r.status === 429) { await r.body?.cancel(); return fail("Too many GIF searches. Try again in a minute.", 429); }
  if (!r.ok) { await r.body?.cancel(); return fail("Couldn't load GIFs.", 502); }
  const j = await r.json().catch(() => null);
  const d = j?.data ?? {};
  const raw = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : [];
  const body = { ok: true, items: shape(raw), more: !!d.has_next, page };
  if (cache.size > 300) cache.clear();
  cache.set(ck, { at: Date.now(), body });
  return reply(body);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "trending": return await list(p, me, "trending");
      case "search":   return await list(p, me, "search");
      default:         return fail("Unknown action.");
    }
  } catch (e) {
    console.error("gifs-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
