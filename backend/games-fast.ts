// TigoMeNote · games-fast (Supabase Edge Function, verify_jwt = off) — ranking ng mga laro ni Tigo
// Isang trabaho lang: i-save ang bawat laro at ibigay ang ranking (pinakamabilis na nakatakas).
// Actions (session token):
//   finish { game, mode: "solo"|"duo"|"multi", ms, score?, keys?, win, level?, partner? (username, ghost duo) } → nai-save; 60 bawat araw
//   top    { game, mode?, level?, period: "week"|"all" } → { list:[{ rank, users:[{username,display_name}], ms, score, me }], mine, total }
//   here   { game?, code?, players?, max?, off? } → tibok ng "online ako sa Tigo" (bawat ~40 s); may game + code = may bukas na room; off = umalis
//   friends {} → { list:[{ user, game, code, players, max, joinable }] } — mga FINA-FOLLOW mo na online sa Tigo ngayon (huling 90 s); may room = puwedeng Join
// Mga laro: ghost (Lights Out, oras; duo = bawat pares) · dash (Sky Dash, oras ng natapos) · siege (Gloom Siege, puntos) · sudoku (oras, bawat level)
// Ranking: "win" lang (natapos/nalutas; siege: lahat ng laro); pinakamagaling bawat tao (o pares sa ghost duo).
// Bantay: may tamang hangganan ng oras/puntos bawat laro. Tables: game_runs (sql/106, 108), game_rooms (sql/112). Files: index.ts lang.

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
const fail = (e: string, s = 400) => reply({ ok: false, error: e }, s);
const GAMES: Record<string, { minWinMs: number; maxMs: number; maxKeys: number; by: "ms" | "score"; maxScore?: number; levels?: string[] }> = {
  ghost: { minWinMs: 25_000, maxMs: 310_000, maxKeys: 4, by: "ms" },
  dash: { minWinMs: 38_000, maxMs: 240_000, maxKeys: 0, by: "ms" },
  siege: { minWinMs: 0, maxMs: 3_600_000, maxKeys: 0, by: "score", maxScore: 60_000 },
  sudoku: { minWinMs: 45_000, maxMs: 3_600_000, maxKeys: 0, by: "ms", levels: ["easy", "medium", "hard"] },
};
const PUB = "id, username, display_name, avatar_url";

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(id, username, status)").eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}

// deno-lint-ignore no-explicit-any
async function finish(p: any, me: any) {
  const g = GAMES[p.game]; if (!g) return fail("Unknown game.");
  const mode = p.mode === "duo" && p.game === "ghost" ? "duo" : p.mode === "multi" ? "multi" : "solo";
  const ms = Math.round(Number(p.ms) || 0), keys = Math.max(0, Math.min(g.maxKeys, Math.floor(Number(p.keys) || 0)));
  let score = Math.max(0, Math.floor(Number(p.score) || 0));
  const level = g.levels ? (g.levels.includes(p.level) ? p.level : g.levels[0]) : null;
  let win = !!p.win;
  if (ms <= 0 || ms > g.maxMs + 60_000) return fail("Invalid run.");
  if (g.by === "ms" && win && (ms < g.minWinMs || ms > g.maxMs)) win = false;   // imposibleng oras → hindi kasama sa ranking
  if (g.by === "score") { win = true; if (score > (g.maxScore ?? 0) || score > Math.ceil(ms / 1000) * 60) score = 0; }   // siege: hindi lalampas sa 60 puntos bawat segundo
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from("game_runs").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= 60) return reply({ ok: true, saved: false });
  let partner_id: string | null = null;
  if (mode === "duo" && p.partner) {
    const { data: u } = await db.from("users").select("id").ilike("username", String(p.partner).replace(/[%_]/g, "").slice(0, 40)).maybeSingle();
    if (u && u.id !== me.id) partner_id = u.id;
  }
  if (mode === "duo" && !partner_id) win = false;
  const { error } = await db.from("game_runs").insert({ game: p.game, mode, user_id: me.id, partner_id, ms, keys, win, score, level });
  if (error) throw error;
  return reply({ ok: true, saved: true, ranked: win });
}

// deno-lint-ignore no-explicit-any
async function top(p: any, me: any) {
  const g = GAMES[p.game]; if (!g) return fail("Unknown game.");
  let q = db.from("game_runs").select("user_id, partner_id, mode, ms, score, created_at").eq("game", p.game).eq("win", true)
    .order(g.by === "score" ? "score" : "ms", { ascending: g.by !== "score" }).limit(3000);
  // Lights Out: hiwalay ang solo at duo. Ang iba: iisang ranking (solo at multi).
  const mode = p.game === "ghost" ? (p.mode === "duo" ? "duo" : "solo") : null;
  if (mode) q = q.eq("mode", mode);
  if (g.levels) q = q.eq("level", g.levels.includes(p.level) ? p.level : g.levels[0]);
  if (p.period !== "all") q = q.gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
  const { data, error } = await q;
  if (error) throw error;
  // pinakamagaling bawat tao (o bawat pares sa Lights Out duo)
  const best = new Map<string, { ids: string[]; ms: number; score: number }>();
  for (const r of data ?? []) {
    const ids = mode === "duo" ? [r.user_id, r.partner_id].filter(Boolean).sort() as string[] : [r.user_id];
    const k = ids.join("+");
    if (!best.has(k)) best.set(k, { ids, ms: r.ms, score: r.score });
  }
  const all = [...best.values()];
  const top20 = all.slice(0, 20);
  const uids = [...new Set(top20.flatMap((x) => x.ids))];
  const { data: us } = uids.length ? await db.from("users").select(PUB).in("id", uids) : { data: [] };
  const U = new Map((us ?? []).map((u) => [u.id, u]));
  const list = top20.map((x, i) => ({ rank: i + 1, ms: x.ms, score: x.score, me: x.ids.includes(me.id), users: x.ids.map((id) => { const u = U.get(id); return u ? { username: u.username, display_name: u.display_name } : { username: "deleted" }; }) }));
  const mi = all.findIndex((x) => x.ids.includes(me.id));
  return reply({ ok: true, list, total: all.length, mine: mi >= 0 ? { rank: mi + 1, ms: all[mi].ms, score: all[mi].score } : null });
}

// ---------- sino ang naglalaro ----------
const FRESH_MS = 90_000;
// deno-lint-ignore no-explicit-any
async function here(p: any, me: any) {
  if (p.off) { await db.from("game_rooms").delete().eq("user_id", me.id); return reply({ ok: true }); }
  const game = GAMES[p.game] ? String(p.game) : null;
  const code = game && /^[A-Z0-9]{5}$/.test(String(p.code ?? "")) ? String(p.code) : null;
  const n = (v: unknown, d: number) => Math.max(1, Math.min(8, Math.floor(Number(v) || d)));
  const { error } = await db.from("game_rooms").upsert({ user_id: me.id, game: code ? game : null, code, players: n(p.players, 1), max_players: n(p.max, 4), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function friends(_p: any, me: any) {
  const { data: fol } = await db.from("follows").select("following_id").eq("follower_id", me.id).limit(2000);
  const ids = (fol ?? []).map((r) => r.following_id);
  if (!ids.length) return reply({ ok: true, list: [] });
  const { data: rooms } = await db.from("game_rooms").select("user_id, game, code, players, max_players, updated_at").in("user_id", ids)
    .gte("updated_at", new Date(Date.now() - FRESH_MS).toISOString()).order("updated_at", { ascending: false }).limit(40);
  if (!rooms || !rooms.length) return reply({ ok: true, list: [] });
  const { data: us } = await db.from("users").select(PUB + ", status").in("id", rooms.map((r) => r.user_id));
  const U = new Map((us ?? []).filter((u) => u.status === "Active").map((u) => [u.id, u]));
  const list = rooms.filter((r) => U.has(r.user_id)).map((r) => {
    const u = U.get(r.user_id)!;
    return { user: { id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url }, game: r.game, code: r.game ? r.code : null, players: r.players, max: r.max_players, joinable: !!r.game && !!r.code && r.players < r.max_players };
  });
  return reply({ ok: true, list });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "finish": return await finish(p, me);
      case "top":    return await top(p, me);
      case "here":   return await here(p, me);
      case "friends": return await friends(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("games-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
