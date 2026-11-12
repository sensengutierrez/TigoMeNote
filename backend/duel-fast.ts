// TigoMeNote · duel-fast (Supabase Edge Function, verify_jwt = off) — 💎 Gem Duel: hanap ng kalaban, resulta at ranking (trophies)
// Isang trabaho lang: ang ranked na laban (matchmaking + trophies + tiers bawat season). Ang laro mismo ay nasa phone (tigo/duel-*.js).
// Actions (session token):
//   find {}    → { match:{ id, seed, code, role:"a"|"b", opp:{ username, trophies } } } o { waiting:true } (tawagin bawat ~2 s; ang "a" ang nauuna)
//   cancel {}  → umalis sa pila
//   bot {}     → { match:{ id, seed, bot:true, opp:{ name, level }, ranked } } (walang kalaban na tao: laban sa bot; hanggang 20 ranked bawat araw)
//   result { match, score, opp, win, draw, forfeit?, noshow? } → { delta, trophies, tier, settled }
//   me {}      → { season, trophies, tier, wins, losses, draws, streak, best, rank }
//   top { scope: "world"|"friends" } → { season, list:[{ rank, user, trophies, tier, wins, losses, me }], mine }
// Trophies: panalo +30 (+2 bawat sunod na panalo, hanggang +6) · talo −20 · tabla 0 · bot: +20 / −12. Hindi bababa sa 0.
// Tiers: Bronze 0 · Silver 300 · Gold 800 · Platinum 1500 · Diamond 2500 · Master 4000. Season = bawat buwan (UTC); bagong season = kalahati ng dati.
// Laban ng tao: ang bawat isa ay nagpapadala ng resulta. Magkasundo = ilalapat. Kung isa lang ang nagpadala: "talo ako" = agad; "panalo ako" = pagkalipas ng 60 s
//   (umalis ang kalaban). Hindi magkasundo = walang pagbabago. Tables: duel_ranks, duel_queue, duel_matches (sql/127).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400) => reply({ ok: false, error: e }, s);
const PUB = "id, username, display_name, avatar_url";
const TIERS: [number, string, string][] = [[4000, "Master", "👑"], [2500, "Diamond", "💎"], [1500, "Platinum", "🔷"], [800, "Gold", "🥇"], [300, "Silver", "🥈"], [0, "Bronze", "🥉"]];
const tierOf = (t: number) => { const x = TIERS.find((q) => t >= q[0])!; return { name: x[1], icon: x[2], min: x[0] }; };
const season = (d = new Date()) => d.toISOString().slice(0, 7);
const prevSeason = () => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return season(d); };
const BOTS = ["Mango Bot", "Ube Bot", "Calamansi Bot", "Pandan Bot", "Dates Bot", "Karak Bot", "Sampaguita Bot", "Bibingka Bot"];
const MAX_SCORE = 40_000, BOT_DAY = 20, STALE_MS = 60_000, QUEUE_MS = 15_000;

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(id, username, display_name, status)").eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}

// ---------- ranking row ng season (gumagawa kapag wala pa: kalahati ng nakaraang season) ----------
// deno-lint-ignore no-explicit-any
async function rankRow(uid: string): Promise<any> {
  const s = season();
  const { data } = await db.from("duel_ranks").select("*").eq("user_id", uid).eq("season", s).maybeSingle();
  if (data) return data;
  const { data: old } = await db.from("duel_ranks").select("trophies").eq("user_id", uid).eq("season", prevSeason()).maybeSingle();
  const start = old ? Math.floor(old.trophies / 2) : 0;
  await db.from("duel_ranks").upsert({ user_id: uid, season: s, trophies: start, best: start }, { onConflict: "user_id,season", ignoreDuplicates: true });
  return (await db.from("duel_ranks").select("*").eq("user_id", uid).eq("season", s).single()).data;
}
// deno-lint-ignore no-explicit-any
const pubRank = (r: any) => ({ season: r.season, trophies: r.trophies, tier: tierOf(r.trophies), wins: r.wins, losses: r.losses, draws: r.draws, streak: r.streak, best: r.best });

// ilapat ang resulta sa isang player (out = "win" | "loss" | "draw"); bot = mas maliit ang galaw
async function bump(uid: string, out: "win" | "loss" | "draw", bot: boolean) {
  for (let i = 0; i < 3; i++) {
    const r = await rankRow(uid);
    const delta = out === "draw" ? 0 : out === "win" ? (bot ? 20 : 30 + Math.min(3, Math.max(0, r.streak)) * 2) : -(bot ? 12 : 20);
    const t = Math.max(0, r.trophies + delta);
    const ch = { trophies: t, best: Math.max(r.best, t), wins: r.wins + (out === "win" ? 1 : 0), losses: r.losses + (out === "loss" ? 1 : 0), draws: r.draws + (out === "draw" ? 1 : 0),
      streak: out === "win" ? Math.max(0, r.streak) + 1 : out === "loss" ? 0 : r.streak, updated_at: new Date().toISOString() };
    const { data } = await db.from("duel_ranks").update(ch).eq("user_id", uid).eq("season", r.season).eq("trophies", r.trophies).eq("wins", r.wins).eq("losses", r.losses).select("*").maybeSingle();
    if (data) return { delta: data.trophies - r.trophies, row: data };
  }
  throw new Error("rank busy");
}

// ---------- pila (matchmaking) ----------
// deno-lint-ignore no-explicit-any
async function find(_p: any, me: any) {
  const since = new Date(Date.now() - 40_000).toISOString();
  // may nakahanap na sa akin (ako ang "a")?
  const { data: mine } = await db.from("duel_matches").select("*").eq("a_id", me.id).not("b_id", "is", null).eq("settled", false).is("a_rep", null).gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (mine) {
    await db.from("duel_queue").delete().eq("user_id", me.id);
    const [{ data: u }, r] = await Promise.all([db.from("users").select("username").eq("id", mine.b_id).maybeSingle(), rankRow(mine.b_id)]);
    return reply({ ok: true, match: { id: mine.id, seed: mine.seed, code: mine.code, role: "a", opp: { username: u?.username ?? "player", trophies: r.trophies } } });
  }
  const my = await rankRow(me.id);
  const { data: wait } = await db.from("duel_queue").select("user_id, trophies").neq("user_id", me.id).gte("created_at", new Date(Date.now() - QUEUE_MS).toISOString()).order("created_at").limit(20);
  const list = (wait ?? []).sort((x, y) => Math.abs(x.trophies - my.trophies) - Math.abs(y.trophies - my.trophies));
  for (const w of list) {
    const { data: got } = await db.from("duel_queue").delete().eq("user_id", w.user_id).select("user_id").maybeSingle();   // kunin siya (isa lang ang makakakuha)
    if (!got) continue;
    const seed = Math.floor(Math.random() * 2_000_000_000) + 1, code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const { data: m, error } = await db.from("duel_matches").insert({ a_id: w.user_id, b_id: me.id, seed, code }).select("*").single();
    if (error) throw error;
    await db.from("duel_queue").delete().eq("user_id", me.id);
    const { data: u } = await db.from("users").select("username").eq("id", w.user_id).maybeSingle();
    return reply({ ok: true, match: { id: m.id, seed, code, role: "b", opp: { username: u?.username ?? "player", trophies: w.trophies } } });
  }
  await db.from("duel_queue").upsert({ user_id: me.id, trophies: my.trophies, created_at: new Date().toISOString() }, { onConflict: "user_id" });
  return reply({ ok: true, waiting: true });
}
// deno-lint-ignore no-explicit-any
async function cancel(_p: any, me: any) { await db.from("duel_queue").delete().eq("user_id", me.id); return reply({ ok: true }); }
// deno-lint-ignore no-explicit-any
async function bot(_p: any, me: any) {
  await db.from("duel_queue").delete().eq("user_id", me.id);
  const r = await rankRow(me.id), day = new Date().toISOString().slice(0, 10), n = r.bot_day === day ? r.bot_n : 0, ranked = n < BOT_DAY;
  if (ranked) await db.from("duel_ranks").update({ bot_day: day, bot_n: n + 1 }).eq("user_id", me.id).eq("season", r.season);
  const seed = Math.floor(Math.random() * 2_000_000_000) + 1;
  const { data: m, error } = await db.from("duel_matches").insert({ a_id: me.id, b_id: null, bot: true, seed, code: ranked ? "bot" : "bot-x" }).select("id").single();
  if (error) throw error;
  const level = r.trophies < 500 ? "easy" : r.trophies < 1500 ? "normal" : "hard";
  return reply({ ok: true, match: { id: m.id, seed, bot: true, ranked, opp: { name: BOTS[Math.floor(Math.random() * BOTS.length)], level } } });
}

// ---------- resulta ----------
// deno-lint-ignore no-explicit-any
const outOf = (rep: any): "win" | "loss" | "draw" => rep.forfeit === "me" ? "loss" : rep.draw ? "draw" : rep.win ? "win" : "loss";
// deno-lint-ignore no-explicit-any
async function settle(m: any): Promise<Record<string, number> | null> {
  const { data: claimed } = await db.from("duel_matches").update({ settled: true }).eq("id", m.id).eq("settled", false).select("id").maybeSingle();
  if (!claimed) return null;   // iba na ang naglapat
  const a = m.a_rep, b = m.b_rep, out: Record<string, number> = {};
  const go = async (uid: string, o: "win" | "loss" | "draw") => { out[uid] = (await bump(uid, o, false)).delta; };
  if (a?.noshow || b?.noshow) return out;   // hindi nakarating ang isa: walang bilang
  if (a && b) {
    const oa = outOf(a), ob = outOf(b);
    const agree = (oa === "draw" && ob === "draw") || (oa === "win" && ob === "loss") || (oa === "loss" && ob === "win");
    if (!agree) return out;
    await go(m.a_id, oa); await go(m.b_id, ob); return out;
  }
  const one = a || b, uid = a ? m.a_id : m.b_id, other = a ? m.b_id : m.a_id, o = outOf(one);
  await go(uid, o); if (other) await go(other, o === "win" ? "loss" : o === "loss" ? "win" : "draw");
  return out;
}
// mga laban na isa lang ang nag-report at lumipas na ang 60 s
async function settleStale(uid: string) {
  const old = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await db.from("duel_matches").select("*").eq("settled", false).eq("bot", false).or(`a_id.eq.${uid},b_id.eq.${uid}`).lte("created_at", old).limit(10);
  for (const m of data ?? []) {
    if (!m.a_rep && !m.b_rep) { if (Date.now() - new Date(m.created_at).getTime() > 30 * 60_000) await db.from("duel_matches").update({ settled: true }).eq("id", m.id); continue; }
    const at = new Date((m.a_rep || m.b_rep).at || m.created_at).getTime();
    if (Date.now() - at > STALE_MS) await settle(m);
  }
}
// deno-lint-ignore no-explicit-any
async function result(p: any, me: any) {
  const id = Math.floor(Number(p.match) || 0); if (!id) return fail("Missing match.");
  const { data: m } = await db.from("duel_matches").select("*").eq("id", id).maybeSingle();
  if (!m || (m.a_id !== me.id && m.b_id !== me.id)) return fail("Unknown match.", 404);
  const score = Math.max(0, Math.floor(Number(p.score) || 0)), opp = Math.max(0, Math.floor(Number(p.opp) || 0));
  const rep = { score, opp, win: !!p.win, draw: !!p.draw, forfeit: p.forfeit === "me" ? "me" : p.forfeit === "opponent" ? "opponent" : null, noshow: !!p.noshow, at: new Date().toISOString() };
  if (score > MAX_SCORE || opp > MAX_SCORE) { rep.win = false; rep.draw = false; rep.forfeit = "me"; }   // imposibleng puntos
  if (rep.win && !rep.forfeit && score <= opp) rep.win = false;   // ang panalo ay dapat mas mataas ang puntos
  if (m.settled) { const r = await rankRow(me.id); return reply({ ok: true, settled: true, delta: 0, ...pubRank(r) }); }
  if (m.bot) {
    const { data: claimed } = await db.from("duel_matches").update({ settled: true, a_rep: rep }).eq("id", m.id).eq("settled", false).select("id").maybeSingle();
    if (!claimed) { const r = await rankRow(me.id); return reply({ ok: true, settled: true, delta: 0, ...pubRank(r) }); }
    // ranked lang kung kasama sa 20 bawat araw (bot()); ang code "bot" = ranked, "bot-x" = hindi
    if (m.code !== "bot") { const r = await rankRow(me.id); return reply({ ok: true, settled: true, delta: 0, unranked: true, ...pubRank(r) }); }
    const o = outOf(rep), { delta, row } = await bump(me.id, o, true);
    return reply({ ok: true, settled: true, delta, ...pubRank(row) });
  }
  const col = m.a_id === me.id ? "a_rep" : "b_rep";
  const { data: m2 } = await db.from("duel_matches").update({ [col]: rep }).eq("id", m.id).select("*").single();
  let delta = 0, settled = false;
  if ((m2.a_rep && m2.b_rep) || outOf(rep) === "loss" || rep.noshow) { const out = await settle(m2); settled = true; if (out) delta = out[me.id] ?? 0; }
  const r = await rankRow(me.id);
  return reply({ ok: true, settled, delta, ...pubRank(r) });
}
// deno-lint-ignore no-explicit-any
async function meInfo(_p: any, me: any) {
  await settleStale(me.id);
  const r = await rankRow(me.id);
  const { count } = await db.from("duel_ranks").select("user_id", { count: "exact", head: true }).eq("season", r.season).gt("trophies", r.trophies);
  return reply({ ok: true, ...pubRank(r), rank: (count ?? 0) + 1 });
}
// deno-lint-ignore no-explicit-any
async function top(p: any, me: any) {
  const s = season();
  let ids: string[] | null = null;
  if (p.scope === "friends") {
    const [{ data: a }, { data: b }] = await Promise.all([db.from("follows").select("following_id").eq("follower_id", me.id).limit(3000), db.from("follows").select("follower_id").eq("following_id", me.id).limit(3000)]);
    const fol = new Set((b ?? []).map((r) => r.follower_id)); ids = [...(a ?? []).map((r) => r.following_id).filter((x) => fol.has(x)), me.id];
  }
  let q = db.from("duel_ranks").select("user_id, trophies, wins, losses").eq("season", s).order("trophies", { ascending: false }).order("wins", { ascending: false }).limit(50);
  if (ids) q = q.in("user_id", ids);
  const { data, error } = await q; if (error) throw error;
  const rows = (data ?? []).filter((r) => r.wins + r.losses > 0 || r.user_id === me.id);
  const { data: us } = rows.length ? await db.from("users").select(PUB + ", status").in("id", rows.map((r) => r.user_id)) : { data: [] };
  const U = new Map((us ?? []).filter((u) => u.status === "Active").map((u) => [u.id, u]));
  const list = rows.filter((r) => U.has(r.user_id)).map((r, i) => { const u = U.get(r.user_id)!; return { rank: i + 1, me: r.user_id === me.id, trophies: r.trophies, tier: tierOf(r.trophies), wins: r.wins, losses: r.losses, user: { username: u.username, display_name: u.display_name, avatar_url: u.avatar_url } }; });
  const mr = await rankRow(me.id);
  return reply({ ok: true, season: s, list, mine: pubRank(mr) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "find":   return await find(p, me);
      case "cancel": return await cancel(p, me);
      case "bot":    return await bot(p, me);
      case "result": return await result(p, me);
      case "me":     return await meInfo(p, me);
      case "top":    return await top(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("duel-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
