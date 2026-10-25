// TigoMeNote · pet-fast (Supabase Edge Function, verify_jwt = off) — si "Tigo", ang virtual pet ng bawat user
// Isang trabaho lang: alagaan si Tigo (stats na bumababa habang lumilipas ang oras) at ang "Gather" ng magkakalapit na kaibigan.
// Actions (session token): get, act { do: feed|play|clean|pet|sleep|wake|daily }, style { name, color },
//                          wear { outfit }, buy { id }, game { kind: coins|pac|race, score, ms },
//                          nearby { on, lat, lng }, gather { user_id }, visits,
//                          room { room: { wall, floor, items: [{ id, x, z, r }] } } → ayos ng loob ng bahay (gamit na pag-aari lang)
// Kaligtasan: ang "nearby" ay para lang sa magkaibigan (mutual follow o Family/Friends circle), kapag NAKA-ON sa dalawa,
//             distansya lang ang ibinabalik (hindi ang lokasyon), at nawawala pagkalipas ng 20 minuto.
// Files: index.ts + webpush.ts + push.ts (para sa push ng "bumisita ang Tigo ni …").

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { type Vapid } from "./webpush.ts";
import { deliver } from "./push.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const COLORS = ["coral", "amber", "mint", "sky", "pink", "lilac", "lime", "ink"];
const GEAR: Record<string, number> = { none: 1, sprout: 2, bow: 3, cap: 4, headphones: 5, crown: 7 }; // level na kailangan
const NEAR_MINUTES = 20, NEAR_METERS = 200; // dapat talagang magkalapit (≈ isang block)
// Closet/shop — kapareho ng assets/js/tigo/catalog.js (dito ang tunay na check). id: [slot, presyo, level]
const ITEMS: Record<string, [string, number, number]> = {
  sprout: ["hat", 0, 2], bow: ["hat", 0, 3], cap: ["hat", 0, 4], headphones: ["hat", 0, 5], crown: ["hat", 0, 7],
  beanie: ["hat", 40, 1], party: ["hat", 30, 1], bunny: ["hat", 60, 2], sampaguita: ["hat", 80, 3], salakot: ["hat", 90, 4], chef: ["hat", 70, 3], halo: ["hat", 150, 6],
  shades: ["face", 40, 1], round: ["face", 30, 1], hearts: ["face", 60, 2], stars: ["face", 60, 2], goggles: ["face", 80, 3], mustache: ["face", 50, 2], mask: ["face", 90, 4],
  scarf: ["body", 40, 1], bowtie: ["body", 30, 1], hoodie: ["body", 90, 2], cape: ["body", 120, 4], backpack: ["body", 70, 3], lei: ["body", 60, 2], medal: ["body", 200, 6],
  icecream: ["hand", 25, 1], balloon: ["hand", 25, 1], "flag-ph": ["hand", 20, 1], "flag-bh": ["hand", 20, 1], umbrella: ["hand", 60, 2], guitar: ["hand", 120, 4], wand: ["hand", 150, 5],
  puppy: ["buddy", 100, 2], kitty: ["buddy", 100, 2], birdie: ["buddy", 80, 1], bunbun: ["buddy", 120, 3], turtle: ["buddy", 150, 4], chick: ["buddy", 60, 1],
  // Bahay (room): gamit, dingding, sahig
  bed: ["furn", 0, 1], rug: ["furn", 0, 1], plant: ["furn", 0, 1], lamp: ["furn", 0, 1], chair: ["furn", 25, 1], table: ["furn", 40, 1], banig: ["furn", 30, 1],
  cactus: ["furn", 30, 1], toybox: ["furn", 40, 1], beanbag: ["furn", 50, 2], fan: ["furn", 60, 2], bookshelf: ["furn", 70, 2], sofa: ["furn", 90, 2],
  desk: ["furn", 80, 3], majlis: ["furn", 100, 3], fridge: ["furn", 110, 3], tv: ["furn", 120, 3], aquarium: ["furn", 150, 4], piano: ["furn", 200, 5],
  painting: ["furn", 40, 1], clock: ["furn", 35, 1], shelf: ["furn", 30, 1], "banner-ph": ["furn", 20, 1], "banner-bh": ["furn", 20, 1], mirror: ["furn", 60, 2], garland: ["furn", 80, 2],
  "wall-cream": ["wall", 0, 1], "wall-sky": ["wall", 30, 1], "wall-mint": ["wall", 30, 1], "wall-blush": ["wall", 30, 1], "wall-lilac": ["wall", 40, 2],
  "wall-sawali": ["wall", 60, 2], "wall-stripes": ["wall", 60, 2], "wall-wood": ["wall", 70, 3], "wall-stars": ["wall", 80, 3],
  "floor-planks": ["floor", 0, 1], "floor-tiles": ["floor", 40, 1], "floor-carpet": ["floor", 50, 2], "floor-bamboo": ["floor", 60, 2], "floor-grass": ["floor", 70, 3], "floor-marble": ["floor", 90, 4],
  island: ["backdrop", 0, 1], beach: ["backdrop", 80, 2], coral: ["backdrop", 120, 3], snow: ["backdrop", 120, 3], clouds: ["backdrop", 150, 4], desert: ["backdrop", 150, 4], moon: ["backdrop", 250, 6],
};
const SLOTS = ["hat", "face", "body", "hand", "buddy", "backdrop"];
// Coins bawat bagong level (+ dagdag sa Lv8 at Lv9). Lv10 = golden glow.
const levelCoins = (l: number) => 20 + (l === 8 ? 100 : l === 9 ? 150 : 0);
const GAME = { perDay: 10, maxCoins: 30, minGapMs: 20_000, kinds: ["coins", "pac", "race"] }; // bawat laro: 10 beses bawat araw
// Bawat oras: gaano bumababa (gising / tulog)
const RATE = { hunger: [6, 3], joy: [4, 2], energy: [5, -14], clean: [3, 1] };

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
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const today = () => new Date().toISOString().slice(0, 10);

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

export const levelOf = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 20)) + 1;
const xpFor = (lvl: number) => 20 * (lvl - 1) * (lvl - 1);

// I-update ang stats ayon sa lumipas na oras (hindi namamatay si Tigo; nalulungkot lang)
// deno-lint-ignore no-explicit-any
function decay(p: any, at = Date.now()) {
  const hrs = Math.max(0, Math.min(24 * 14, (at - new Date(p.stats_at).getTime()) / 3_600_000));
  const k = p.asleep ? 1 : 0;
  const out = { ...p };
  for (const s of ["hunger", "joy", "energy", "clean"] as const) out[s] = clamp(p[s] - RATE[s][k] * hrs);
  // gising kusa kapag puno na ang energy
  if (p.asleep && out.energy >= 100) out.asleep = false;
  out.stats_at = new Date(at).toISOString();
  return out;
}
// deno-lint-ignore no-explicit-any
function moodOf(p: any) {
  if (p.asleep) return "sleepy";
  if (p.clean < 15 || p.hunger < 10) return "sick";
  if (p.energy < 20) return "sleepy";
  const avg = (p.hunger + p.joy + p.energy + p.clean) / 4;
  return avg < 35 ? "sad" : avg < 65 ? "ok" : "happy";
}
// deno-lint-ignore no-explicit-any
function has(p: any, id: string) {
  const it = ITEMS[id];
  return !!it && levelOf(p.xp) >= it[2] && (it[1] === 0 || (p.owned ?? []).includes(id));
}
// deno-lint-ignore no-explicit-any
function shape(p: any) {
  const lvl = levelOf(p.xp);
  return {
    coins: p.coins ?? 0, owned: p.owned ?? [], outfit: p.outfit ?? {}, glow: lvl >= 10, room: p.room ?? null,
    name: p.name, color: p.color, gear: p.gear, hunger: p.hunger, joy: p.joy, energy: p.energy, clean: p.clean,
    xp: p.xp, level: lvl, next: xpFor(lvl + 1), prev: xpFor(lvl), asleep: p.asleep, mood: moodOf(p),
    stats_at: p.stats_at, born_at: p.born_at, near_on: !!p.near_on && !!p.near_at && Date.now() - new Date(p.near_at).getTime() < NEAR_MINUTES * 60_000,
    gear_unlocked: Object.keys(GEAR).filter((g) => GEAR[g] <= lvl), rates: RATE,
  };
}
// deno-lint-ignore no-explicit-any
async function load(uid: string): Promise<any> {
  const { data } = await db.from("pets").select("*").eq("user_id", uid).maybeSingle();
  if (data) return data;
  const { data: made } = await db.from("pets").upsert({ user_id: uid }, { onConflict: "user_id", ignoreDuplicates: true }).select("*").maybeSingle();
  return made ?? (await db.from("pets").select("*").eq("user_id", uid).single()).data;
}
// deno-lint-ignore no-explicit-any
async function store(p: any) {
  // bagong level → coins (isang beses lang bawat level)
  const lvl = levelOf(p.xp);
  if (lvl > (p.rewarded_level ?? 1)) {
    for (let l = (p.rewarded_level ?? 1) + 1; l <= lvl; l++) p.coins = (p.coins ?? 0) + levelCoins(l);
    p.rewarded_level = lvl;
  }
  const { user_id, name, color, gear, hunger, joy, energy, clean, xp, asleep, stats_at, counters, coins, owned, outfit, rewarded_level } = p;
  const { data, error } = await db.from("pets").update({ name, color, gear, hunger, joy, energy, clean, xp, asleep, stats_at, counters, coins, owned, outfit, rewarded_level, updated_at: nowIso() })
    .eq("user_id", user_id).select("*").single();
  if (error) throw error;
  return data;
}
// Bilang bawat araw (para hindi ma-spam ang XP)
// deno-lint-ignore no-explicit-any
function count(p: any, key: string, max: number) {
  const c = p.counters && p.counters.day === today() ? { ...p.counters } : { day: today() };
  c[key] = (c[key] || 0) + 1;
  p.counters = c;
  return c[key] <= max;
}

// deno-lint-ignore no-explicit-any
async function get(_p: any, me: any) {
  const pet = decay(await load(me.id));
  return reply({ ok: true, pet: shape(await store(pet)) });
}

// deno-lint-ignore no-explicit-any
async function act(p: any, me: any) {
  const pet = decay(await load(me.id));
  const before = levelOf(pet.xp);
  let msg = "";
  switch (p.do) {
    case "feed":
      if (pet.asleep) return fail("Shh… Tigo is sleeping.", 409);
      if (pet.hunger >= 98) { msg = "full"; break; }
      pet.hunger = clamp(pet.hunger + 25); pet.clean = clamp(pet.clean - 4);
      if (count(pet, "feed", 12)) pet.xp += 3;
      break;
    case "play":
      if (pet.asleep) return fail("Shh… Tigo is sleeping.", 409);
      if (pet.energy < 12) return fail("Tigo is too tired to play. Let Tigo sleep.", 409);
      pet.joy = clamp(pet.joy + 18); pet.energy = clamp(pet.energy - 10); pet.hunger = clamp(pet.hunger - 4);
      if (count(pet, "play", 15)) pet.xp += 5;
      break;
    case "clean":
      if (pet.clean >= 98) { msg = "clean"; break; }
      pet.clean = 100; pet.joy = clamp(pet.joy + 4);
      if (count(pet, "clean", 6)) pet.xp += 3;
      break;
    case "pet":
      pet.joy = clamp(pet.joy + 3);
      if (count(pet, "pet", 20)) pet.xp += 1;
      break;
    case "sleep": pet.asleep = true; break;
    case "wake": pet.asleep = false; break;
    case "daily": // galing sa Daily (note, to-do, mood): pinapasaya si Tigo
      pet.joy = clamp(pet.joy + 6);
      if (count(pet, "daily", 6)) pet.xp += 8;
      break;
    default: return fail("Unknown action.");
  }
  const saved = shape(await store(pet));
  return reply({ ok: true, pet: saved, levelUp: saved.level > before ? saved.level : null, msg });
}

// Closet: isuot ang mga item (dapat pag-aari o libre na sa level mo)
// deno-lint-ignore no-explicit-any
async function wear(p: any, me: any) {
  const pet = decay(await load(me.id));
  const o = p.outfit && typeof p.outfit === "object" ? p.outfit : {};
  const next: Record<string, string> = {};
  for (const slot of SLOTS) {
    const id = o[slot];
    if (id === undefined || id === null || id === "" || id === "none") continue;
    const it = ITEMS[String(id)];
    if (!it || it[0] !== slot) return fail("Unknown item.");
    if (!has(pet, String(id))) return fail(levelOf(pet.xp) < it[2] ? `Unlocks at level ${it[2]}.` : "Buy this item first.", 403);
    next[slot] = String(id);
  }
  pet.outfit = next;
  pet.gear = next.hat && ["sprout", "bow", "cap", "headphones", "crown"].includes(next.hat) ? next.hat : "none";
  return reply({ ok: true, pet: shape(await store(pet)) });
}

// Shop: bumili gamit ang coins
// deno-lint-ignore no-explicit-any
async function buy(p: any, me: any) {
  const id = String(p.id || ""), it = ITEMS[id];
  if (!it) return fail("Unknown item.");
  const pet = decay(await load(me.id));
  if (levelOf(pet.xp) < it[2]) return fail(`Unlocks at level ${it[2]}.`, 403);
  if (has(pet, id)) return reply({ ok: true, pet: shape(await store(pet)), already: true });
  if ((pet.coins ?? 0) < it[1]) return fail("Not enough coins. Play Coin Rush to earn more!", 402);
  pet.coins -= it[1]; pet.owned = [...(pet.owned ?? []), id];
  return reply({ ok: true, pet: shape(await store(pet)) });
}

// Bahay: i-save ang ayos ng kwarto. Gamit na pag-aari lang (o libre sa level), hanggang 40, nasa loob ng kwarto.
const ROOM_W = 3, ROOM_D = 2.5, ROOM_MAX = 40, ROOM_COPIES = 4;
// deno-lint-ignore no-explicit-any
async function room(p: any, me: any) {
  const r = p.room && typeof p.room === "object" ? p.room : null;
  if (!r) return fail("Missing room.");
  const pet = decay(await load(me.id));
  const pick = (id: unknown, slot: string, def: string): { id?: string; bad?: string } => {
    const k = String(id ?? def);
    if (!ITEMS[k] || ITEMS[k][0] !== slot) return { bad: "Unknown item." };
    if (!has(pet, k)) return { bad: levelOf(pet.xp) < ITEMS[k][2] ? `Unlocks at level ${ITEMS[k][2]}.` : "Buy this item first." };
    return { id: k };
  };
  const w = pick(r.wall, "wall", "wall-cream"), f = pick(r.floor, "floor", "floor-planks");
  if (w.bad) return fail(w.bad, 403); if (f.bad) return fail(f.bad, 403);
  const list = Array.isArray(r.items) ? r.items : [];
  if (list.length > ROOM_MAX) return fail(`Up to ${ROOM_MAX} things in the house.`);
  const per: Record<string, number> = {};
  const items = [];
  const n = (v: unknown, lim: number) => { const x = Number(v); return Number.isFinite(x) ? Math.round(Math.max(-lim, Math.min(lim, x)) * 100) / 100 : 0; };
  for (const it of list) {
    const k = pick(it && it.id, "furn", "");
    if (k.bad) return fail(k.bad, 403);
    per[k.id!] = (per[k.id!] || 0) + 1;
    if (per[k.id!] > ROOM_COPIES) return fail(`Up to ${ROOM_COPIES} of each item.`);
    items.push({ id: k.id, x: n(it.x, ROOM_W), z: n(it.z, ROOM_D), r: n(it.r, 7) });
  }
  const { data, error } = await db.from("pets").update({ room: { wall: w.id, floor: f.id, items }, updated_at: nowIso() }).eq("user_id", me.id).select("*").single();
  if (error) throw error;
  return reply({ ok: true, pet: shape(decay(data)) });
}

// Mga laro (Coin Rush, Pac-Tigo, Racing): may limit bawat araw at bawat laro (hindi puwedeng dayain ang dami)
// deno-lint-ignore no-explicit-any
async function game(p: any, me: any) {
  const pet = decay(await load(me.id));
  if (pet.asleep) return fail("Shh… Tigo is sleeping.", 409);
  if (pet.energy < 12) return fail("Tigo is too tired to play. Let Tigo sleep.", 409);
  const c = pet.counters && pet.counters.day === today() ? pet.counters : {};
  if (c.lastGame && Date.now() - c.lastGame < GAME.minGapMs) return fail("Wait a moment before the next run.", 429);
  const score = Math.max(0, Math.floor(Number(p.score) || 0)), ms = Math.max(0, Number(p.ms) || 0);
  const fair = Math.min(score, GAME.maxCoins, Math.ceil((ms / 1000) * 1.6));
  const kind = GAME.kinds.includes(p.kind) ? p.kind : "coins";
  const okRun = count(pet, kind === "coins" ? "game" : "game_" + kind, GAME.perDay);
  pet.counters.lastGame = Date.now();
  const before = levelOf(pet.xp);
  const won = okRun ? fair : 0;
  pet.coins = (pet.coins ?? 0) + won;
  pet.joy = clamp(pet.joy + 10); pet.energy = clamp(pet.energy - 8); pet.hunger = clamp(pet.hunger - 5);
  if (okRun && score > 0) pet.xp += 4;
  const saved = shape(await store(pet));
  return reply({ ok: true, pet: saved, coins: won, capped: !okRun, levelUp: saved.level > before ? saved.level : null });
}

// deno-lint-ignore no-explicit-any
async function style(p: any, me: any) {
  const pet = decay(await load(me.id));
  if (p.name !== undefined) {
    const n = String(p.name).replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
    if (!n) return fail("Give your Tigo a name.");
    pet.name = n;
  }
  if (p.color !== undefined) { if (!COLORS.includes(p.color)) return fail("Unknown color."); pet.color = p.color; }
  if (p.gear !== undefined) {
    if (!(p.gear in GEAR)) return fail("Unknown item.");
    if (GEAR[p.gear] > levelOf(pet.xp)) return fail(`Unlocks at level ${GEAR[p.gear]}.`, 403);
    pet.gear = p.gear; pet.outfit = { ...(pet.outfit ?? {}), hat: p.gear === "none" ? undefined : p.gear };
  }
  return reply({ ok: true, pet: shape(await store(pet)) });
}

// ---------- magkakalapit na kaibigan ----------
function meters(a: number, b: number, c: number, d: number) {
  const r = Math.PI / 180, x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(x)));
}
// Mga kaibigan: mutual follow o tinanggap na Family/Friends
async function friendIds(uid: string): Promise<string[]> {
  const [{ data: a }, { data: b }, { data: c }] = await Promise.all([
    db.from("follows").select("following_id").eq("follower_id", uid),
    db.from("follows").select("follower_id").eq("following_id", uid),
    db.from("safety_links").select("a_id, b_id").or(`a_id.eq.${uid},b_id.eq.${uid}`).eq("status", "accepted"),
  ]);
  const fol = new Set((b ?? []).map((r) => r.follower_id));
  const out = new Set((a ?? []).map((r) => r.following_id).filter((id) => fol.has(id)));
  (c ?? []).forEach((l) => out.add(l.a_id === uid ? l.b_id : l.a_id));
  out.delete(uid);
  return [...out];
}
// deno-lint-ignore no-explicit-any
async function nearList(me: any, pet: any) {
  if (!pet.near_on || pet.near_lat == null) return [];
  const ids = await friendIds(me.id);
  if (!ids.length) return [];
  const since = new Date(Date.now() - NEAR_MINUTES * 60_000).toISOString();
  const { data: rows } = await db.from("pets").select("*").in("user_id", ids).eq("near_on", true).gte("near_at", since);
  const close = (rows ?? []).map((r) => ({ r, m: meters(pet.near_lat, pet.near_lng, r.near_lat, r.near_lng) })).filter((x) => x.m <= NEAR_METERS);
  if (!close.length) return [];
  const uids = close.map((x) => x.r.user_id);
  const [{ data: users }, { data: met }] = await Promise.all([
    db.from("users").select("id, username, display_name, avatar_url").in("id", uids),
    db.from("pet_meets").select("a_id, b_id").eq("day", today()).or(`a_id.eq.${me.id},b_id.eq.${me.id}`),
  ]);
  const metSet = new Set((met ?? []).map((m) => (m.a_id === me.id ? m.b_id : m.a_id)));
  return close.sort((a, b) => a.m - b.m).map(({ r, m }) => {
    const d = decay(r);
    return {
      user: (users ?? []).find((u) => u.id === r.user_id) ?? null,
      pet: { name: r.name, color: r.color, gear: r.gear, outfit: r.outfit ?? {}, glow: levelOf(r.xp) >= 10, level: levelOf(r.xp), mood: moodOf(d) },
      dist: m < 40 ? "right here" : m < 100 ? "very close" : "nearby", met_today: metSet.has(r.user_id),
    };
  });
}
// deno-lint-ignore no-explicit-any
async function nearby(p: any, me: any) {
  const pet = await load(me.id);
  if (p.on === false) {
    await db.from("pets").update({ near_on: false, near_lat: null, near_lng: null, near_at: null }).eq("user_id", me.id);
    return reply({ ok: true, on: false, list: [] });
  }
  const lat = Number(p.lat), lng = Number(p.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail("Invalid location.");
  // ~10 m na katumpakan (para tama ang "magkalapit"); hindi ibinabalik kanino man, nabubura pagkalipas ng 20 min
  const acc = Number(p.acc);
  if (Number.isFinite(acc) && acc > 150) return fail("Your GPS is not accurate yet. Go outside or turn on precise location.", 422, { acc });
  const ch = { near_on: true, near_lat: Math.round(lat * 10000) / 10000, near_lng: Math.round(lng * 10000) / 10000, near_at: nowIso() };
  await db.from("pets").update(ch).eq("user_id", me.id);
  return reply({ ok: true, on: true, list: await nearList(me, { ...pet, ...ch }) });
}

let vapid: Vapid | null = null;
async function pushTo(uid: string, data: Record<string, unknown>) {
  if (!vapid) { const { data: v } = await db.from("app_keys").select("value").eq("name", "vapid").maybeSingle(); vapid = v ? (v.value as Vapid) : null; }
  const { data: subs } = await db.from("push_subs").select("*").eq("user_id", uid);
  if (subs && subs.length) await deliver(db, subs, data, vapid, { cat: "tigo", ttl: 3600, urgency: "normal" });
}

// "Gather": magkasama ang dalawang Tigo; parehong sasaya (isang beses bawat araw bawat magkaibigan)
// deno-lint-ignore no-explicit-any
async function gather(p: any, me: any) {
  const uid = String(p.user_id || "");
  const pet = await load(me.id);
  const list = await nearList(me, pet);
  const hit = list.find((x) => x.user && x.user.id === uid);
  if (!hit) return fail("Your friend isn't nearby anymore.", 404);
  const [a, b] = me.id < uid ? [me.id, uid] : [uid, me.id];
  const { data: made } = await db.from("pet_meets").insert({ a_id: a, b_id: b, by_id: me.id, day: today() }).select("id").maybeSingle();
  let mine = decay(pet);
  if (made) {
    mine.joy = clamp(mine.joy + 15); mine.xp += 15;
    const other = decay(await load(uid)); other.joy = clamp(other.joy + 15); other.xp += 15;
    await store(other);
    later(pushTo(uid, { type: "tigo", title: "🐣 " + (me.display_name || "@" + me.username) + "'s Tigo came to play!", body: "Your Tigo met " + mine.name + " nearby. +15 joy", url: "app/tigo.html" }));
  }
  mine = await store(mine);
  return reply({ ok: true, pet: shape(mine), friend: hit, first: !!made });
}

// Sino ang nakasama ng Tigo mo (huling 7 araw)
// deno-lint-ignore no-explicit-any
async function visits(_p: any, me: any) {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await db.from("pet_meets").select("*").or(`a_id.eq.${me.id},b_id.eq.${me.id}`).gte("day", since).order("created_at", { ascending: false }).limit(30);
  const ids = [...new Set((data ?? []).map((m) => (m.a_id === me.id ? m.b_id : m.a_id)))];
  const [{ data: users }, { data: pets }] = ids.length
    ? await Promise.all([db.from("users").select("id, username, display_name, avatar_url").in("id", ids), db.from("pets").select("user_id, name, color, gear, outfit, xp").in("user_id", ids)])
    : [{ data: [] }, { data: [] }];
  return reply({ ok: true, list: (data ?? []).map((m) => {
    const o = m.a_id === me.id ? m.b_id : m.a_id, pt = (pets ?? []).find((x) => x.user_id === o);
    return { at: m.created_at, day: m.day, by_me: m.by_id === me.id, user: (users ?? []).find((u) => u.id === o) ?? null,
      pet: pt ? { name: pt.name, color: pt.color, gear: pt.gear, outfit: pt.outfit ?? {}, level: levelOf(pt.xp) } : null };
  }) });
}

function later(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === "function") rt.waitUntil(p); else p.catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "get":    return await get(p, me);
      case "act":    return await act(p, me);
      case "style":  return await style(p, me);
      case "wear":   return await wear(p, me);
      case "buy":    return await buy(p, me);
      case "game":   return await game(p, me);
      case "nearby": return await nearby(p, me);
      case "gather": return await gather(p, me);
      case "visits": return await visits(p, me);
      case "room":   return await room(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("pet-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
