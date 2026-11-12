// TigoMeNote · pet-fast (Supabase Edge Function, verify_jwt = off) — si "Tigo", ang virtual pet ng bawat user
// Isang trabaho lang: alagaan si Tigo (stats na bumababa habang lumilipas ang oras) at ang "Gather" ng magkakalapit na kaibigan.
// Actions (session token): get, act { do: feed|play|clean|pet|sleep|wake|daily }, style { name, color },
//                          wear { outfit }, buy { id }, game { kind: coins|pac|race|ghost, score, ms },
//                          nearby { on, lat, lng }, gather { user_id }, visits,
//                          room { room: { wall, floor, items: [{ id, x, z, r }] } } → ayos ng loob ng bahay (gamit na pag-aari lang)
//                          house {} → i-upgrade ang bahay sa susunod na antas (Cottage 800 · Villa 2,500 · Mansion 7,000 coins); mas malaki ang kwarto
//                          farm { do: water, plot? | all } → 💧 2x bilis ng tubo nang 2 oras (hindi namamatay kahit hindi diligan)
//                          0.11.52: room { room: { …, bed: { blanket, pillow }, up: { wall, floor, items } } } (up = 2nd floor, Villa/Mansion lang; may balkonahe)
//                          grant { username?, coins } → Admin lang: magbigay ng coins (sa sarili kapag walang username), 1–1,000,000 bawat bigay
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
  "water-gun": ["hand", 80, 1], icecream: ["hand", 25, 1], balloon: ["hand", 25, 1], "flag-ph": ["hand", 20, 1], "flag-bh": ["hand", 20, 1], umbrella: ["hand", 60, 2], guitar: ["hand", 120, 4], wand: ["hand", 150, 5],
  puppy: ["buddy", 100, 2], kitty: ["buddy", 100, 2], birdie: ["buddy", 80, 1], bunbun: ["buddy", 120, 3], turtle: ["buddy", 150, 4], chick: ["buddy", 60, 1],
  // Bahay (room): gamit, dingding, sahig
  bed: ["furn", 0, 1], rug: ["furn", 0, 1], plant: ["furn", 0, 1], lamp: ["furn", 0, 1], chair: ["furn", 25, 1], table: ["furn", 40, 1], banig: ["furn", 30, 1],
  cactus: ["furn", 30, 1], toybox: ["furn", 40, 1], beanbag: ["furn", 50, 2], fan: ["furn", 60, 2], bookshelf: ["furn", 70, 2], sofa: ["furn", 90, 2],
  "pet-cushion": ["furn", 30, 1], "dog-bed": ["furn", 60, 1], "cat-bed": ["furn", 60, 1], "bird-nest": ["furn", 60, 1],
  "gaming-chair": ["furn", 120, 2], bike: ["ride", 150, 1], scooter: ["ride", 450, 2], car: ["ride", 1500, 3],
  desk: ["furn", 80, 3], majlis: ["furn", 100, 3], fridge: ["furn", 110, 3], tv: ["furn", 120, 3], aquarium: ["furn", 150, 4], piano: ["furn", 200, 5],
  painting: ["furn", 40, 1], clock: ["furn", 35, 1], shelf: ["furn", 30, 1], "banner-ph": ["furn", 20, 1], "banner-bh": ["furn", 20, 1], mirror: ["furn", 60, 2], garland: ["furn", 80, 2],
  "blanket-check": ["blanket", 0, 1], "blanket-stars": ["blanket", 60, 1], "blanket-hearts": ["blanket", 60, 1], "blanket-clouds": ["blanket", 60, 1], "blanket-rainbow": ["blanket", 80, 2], "blanket-inabel": ["blanket", 90, 2], "blanket-quilt": ["blanket", 100, 3],
  "pillow-white": ["pillow", 0, 1], "pillow-heart": ["pillow", 40, 1], "pillow-star": ["pillow", 40, 1], "pillow-cloud": ["pillow", 50, 2], "pillow-hotdog": ["pillow", 50, 2], "pillow-cat": ["pillow", 60, 3],
  "wall-cream": ["wall", 0, 1], "wall-sky": ["wall", 30, 1], "wall-mint": ["wall", 30, 1], "wall-blush": ["wall", 30, 1], "wall-lilac": ["wall", 40, 2],
  "wall-sawali": ["wall", 60, 2], "wall-stripes": ["wall", 60, 2], "wall-wood": ["wall", 70, 3], "wall-stars": ["wall", 80, 3],
  "floor-planks": ["floor", 0, 1], "floor-tiles": ["floor", 40, 1], "floor-carpet": ["floor", 50, 2], "floor-bamboo": ["floor", 60, 2], "floor-grass": ["floor", 70, 3], "floor-marble": ["floor", 90, 4],
  island: ["backdrop", 0, 1], beach: ["backdrop", 80, 2], coral: ["backdrop", 120, 3], snow: ["backdrop", 120, 3], clouds: ["backdrop", 150, 4], desert: ["backdrop", 150, 4], moon: ["backdrop", 250, 6],
};
const SLOTS = ["hat", "face", "body", "hand", "buddy", "backdrop"];
// Coins bawat bagong level (+ dagdag sa Lv8 at Lv9). Lv10 = golden glow.
const levelCoins = (l: number) => 20 + (l === 8 ? 100 : l === 9 ? 150 : 0);
const GAME = { perDay: 10, maxCoins: 30, minGapMs: 20_000, kinds: ["coins", "pac", "race", "ghost", "dash", "siege", "sudoku", "duel"] }; // bawat laro: 10 beses bawat araw
// Bawat oras: gaano bumababa (gising / tulog). 0.11.45 (ayon kay Bench): bumababa ULIT nang dahan-dahan ang gutom, saya (laro) at linis (ligo);
// ang energy ay hindi na bumababa nang kusa (tulog = bumabalik). Mga 33 oras bago maubos ang gutom mula sa puno. Walang bawas kapag naglaro.
const RATE = { hunger: [3, 1.5], joy: [2, 1], energy: [0, -14], clean: [2, 1] };

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
  if (p.asleep && p.energy < 100 && out.energy >= 100) out.asleep = false;   // puno na dati pa = tulog hanggang gisingin
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
    coins: p.coins ?? 0, owned: p.owned ?? [], outfit: p.outfit ?? {}, glow: lvl >= 10, room: p.room ?? null, avatar: p.avatar ?? null,
    house: p.house ?? 1, housePrices: HOUSE_PRICE,
    farm: { ...farmOf(p), seeds: SEEDS, treeMs: TREE_MS, treeCoins: TREE_COINS, waterMs: WATER_MS, plots_n: PLOTS, trees_n: TREES, now: Date.now() },
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
      pet.hunger = clamp(pet.hunger + 25);
      if (count(pet, "feed", 12)) pet.xp += 3;
      break;
    case "play":
      if (pet.asleep) return fail("Shh… Tigo is sleeping.", 409);
      pet.joy = clamp(pet.joy + 18);
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
const ROOM_COPIES = 4;
// Bahay: [presyo para makarating sa antas na ito]; kalahating lapad/lalim ng kwarto bawat antas (kapareho ng tigo/room.js ROOM_SIZES)
const HOUSE_PRICE = [0, 0, 800, 2500, 7000], ROOM_HALF: [number, number][] = [[3, 2.5], [3, 2.5], [3.5, 2.8], [4, 3.1], [4.6, 3.5]];
const roomMax = (lvl: number) => 30 + 10 * Math.max(1, Math.min(4, lvl));
// deno-lint-ignore no-explicit-any
async function house(_p: any, me: any) {
  const pet = decay(await load(me.id)), cur = Math.max(1, Math.min(4, pet.house ?? 1));
  if (cur >= 4) return fail("Your house is already a Mansion! 🏰", 409);
  const price = HOUSE_PRICE[cur + 1];
  if ((pet.coins ?? 0) < price) return fail(`You need 🪙 ${price} to upgrade.`, 402);
  // isang update lang; kung may nagbago sa pagitan (coins o antas), ulitin
  const { data, error } = await db.from("pets").update({ coins: pet.coins - price, house: cur + 1, updated_at: nowIso() })
    .eq("user_id", me.id).eq("house", pet.house ?? 1).eq("coins", pet.coins).select("*").maybeSingle();
  if (error) throw error;
  if (!data) return fail("Something changed. Please try again.", 409);
  return reply({ ok: true, pet: shape(decay(data)), house: cur + 1 });
}
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
  const hl = Math.max(1, Math.min(4, pet.house ?? 1)), [ROOM_W, ROOM_D] = ROOM_HALF[hl], ROOM_MAX = roomMax(hl);
  const n = (v: unknown, lim: number) => { const x = Number(v); return Number.isFinite(x) ? Math.round(Math.max(-lim, Math.min(lim, x)) * 100) / 100 : 0; };
  // isang palapag: dingding, sahig at gamit (pag-aari lang, hanggang ROOM_MAX, 4 bawat isa). balc = may balkonahe (2F): hanggang +1.7 sa harap
  // deno-lint-ignore no-explicit-any
  const floorOf = (q: any, balc: boolean): { bad?: string; v?: Record<string, unknown> } => {
    const w = pick(q && q.wall, "wall", "wall-cream"), f = pick(q && q.floor, "floor", "floor-planks");
    if (w.bad) return { bad: w.bad }; if (f.bad) return { bad: f.bad };
    const list = Array.isArray(q && q.items) ? q.items : [];
    if (list.length > ROOM_MAX) return { bad: `Up to ${ROOM_MAX} things on each floor. Upgrade the house for more room!` };
    const per: Record<string, number> = {}, items: Record<string, unknown>[] = [];
    for (const it of list) {
      const k = pick(it && it.id, "furn", "");
      if (k.bad) return { bad: k.bad };
      per[k.id!] = (per[k.id!] || 0) + 1;
      if (per[k.id!] > ROOM_COPIES) return { bad: `Up to ${ROOM_COPIES} of each item.` };
      items.push({ id: k.id, x: n(it.x, ROOM_W), z: Math.max(-ROOM_D, n(it.z, ROOM_D + (balc ? 1.7 : 0))), r: n(it.r, 7) });
    }
    return { v: { wall: w.id, floor: f.id, items } };
  };
  const one = floorOf(r, false); if (one.bad) return fail(one.bad, 403);
  const out: Record<string, unknown> = { ...one.v };
  if (hl >= 3 && r.up && typeof r.up === "object") { const two = floorOf(r.up, true); if (two.bad) return fail(two.bad, 403); out.up = two.v; }
  else if (hl >= 3 && pet.room && pet.room.up) out.up = pet.room.up;
  if (r.bed && typeof r.bed === "object") {
    const b = pick(r.bed.blanket, "blanket", "blanket-check"), pl = pick(r.bed.pillow, "pillow", "pillow-white");
    if (b.bad) return fail(b.bad, 403); if (pl.bad) return fail(pl.bad, 403);
    out.bed = { blanket: b.id, pillow: pl.id };
  } else if (pet.room && pet.room.bed) out.bed = pet.room.bed;
  const { data, error } = await db.from("pets").update({ room: out, updated_at: nowIso() }).eq("user_id", me.id).select("*").single();
  if (error) throw error;
  return reply({ ok: true, pet: shape(decay(data)) });
}

// Admin: magbigay ng coins (sa sarili o sa ibang user). Isang update na may check sa dating coins (walang nawawala kapag sabay).
// deno-lint-ignore no-explicit-any
async function grant(p: any, me: any) {
  if (me.role !== "Admin") return fail("Admins only.", 403);
  const coins = Math.floor(Number(p.coins) || 0);
  if (coins < 1 || coins > 1_000_000) return fail("Give 1 to 1,000,000 coins.");
  let uid = me.id, uname = me.username;
  const un = String(p.username ?? "").replace(/^@/, "").trim();
  if (un) {
    const { data: u } = await db.from("users").select("id, username").ilike("username", un.replace(/[%_\\]/g, "").slice(0, 40)).maybeSingle();
    if (!u) return fail("No user with that username.", 404);
    uid = u.id; uname = u.username;
  }
  for (let i = 0; i < 3; i++) {
    const pet = decay(await load(uid)), now = pet.coins ?? 0;
    const { data, error } = await db.from("pets").update({ coins: now + coins, updated_at: nowIso() }).eq("user_id", uid).eq("coins", now).select("*").maybeSingle();
    if (error) throw error;
    if (data) { console.log("pet-fast grant", me.id, "→", uid, coins); return reply({ ok: true, username: uname, coins: data.coins, pet: uid === me.id ? shape(decay(data)) : null }); }
  }
  return fail("Something changed. Please try again.", 409);
}

// Mga laro (Coin Rush, Pac-Tigo, Racing): may limit bawat araw at bawat laro (hindi puwedeng dayain ang dami)
// deno-lint-ignore no-explicit-any
async function game(p: any, me: any) {
  const pet = decay(await load(me.id));
  if (pet.asleep) return fail("Shh… Tigo is sleeping.", 409);
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
  pet.joy = clamp(pet.joy + 10);   // walang bawas sa energy/gutom
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

// ---------- sa labas: taniman, bunga ng puno, pangingisda (pets.farm, sql/114) ----------
// farm = { plots: { "0": { s: seed, t: ISO ng pagtanim } }, trees: { "0": ISO ng huling pitas }, fish: { d: "YYYY-MM-DD", n, t: ms ng huling huli } }
// Buto: [presyo, minuto bago anihin, coins kapag inani]. Ang oras ay sa server lang binibilang.
const SEEDS: Record<string, [number, number, number]> = { carrot: [5, 20, 8], tomato: [10, 60, 18], corn: [20, 180, 42], strawberry: [35, 480, 85], pumpkin: [60, 960, 150] };
const PLOTS = 10, TREES = 7, TREE_MS = 4 * 3600_000, TREE_COINS = 8, FISH_GAP = 12_000, FISH_DAY = 40, WATER_MS = 2 * 3600_000;
const CATCH: [string, string, string, number, number][] = [["boot", "🥾", "Old boot", 0, 4], ["small", "🐟", "Small fish", 3, 52], ["tilapia", "🐠", "Tilapia", 6, 26], ["bangus", "🐡", "Bangus", 10, 12], ["gold", "✨🐟", "Golden fish", 20, 6]];
// deno-lint-ignore no-explicit-any
const farmOf = (pet: any) => { const f = pet.farm && typeof pet.farm === "object" ? pet.farm : {}; return { plots: f.plots ?? {}, trees: f.trees ?? {}, fish: f.fish ?? {} }; };
// tubo = oras mula sa pagtanim + dagdag mula sa dilig (habang nadiligan, doble ang bilis: hanggang 2 oras na dagdag bawat dilig)
const wetBonus = (pl: { t: string; w?: number }) => pl.w && pl.w >= new Date(pl.t).getTime() ? Math.min(WATER_MS, Date.now() - pl.w) : 0;
const grown = (pl: { s: string; t: string; w?: number }) => !!SEEDS[pl.s] && Date.now() - new Date(pl.t).getTime() + wetBonus(pl) >= SEEDS[pl.s][1] * 60_000;
// deno-lint-ignore no-explicit-any
async function farm(p: any, me: any) {
  const pet = decay(await load(me.id)), f = farmOf(pet), before = levelOf(pet.xp);
  // deno-lint-ignore no-explicit-any
  const out: any = {};
  let coins = pet.coins ?? 0, xp = pet.xp;
  const idx = (v: unknown, n: number) => { const i = Math.floor(Number(v)); return Number.isFinite(i) && i >= 0 && i < n ? i : -1; };
  if (p.do === "plant") {
    const i = idx(p.plot, PLOTS), sd = SEEDS[String(p.seed)];
    if (i < 0 || !sd) return fail("Unknown seed or plot.");
    if (f.plots[i]) return fail("Something is already growing there.", 409);
    if (coins < sd[0]) return fail("Not enough coins for that seed.", 402);
    coins -= sd[0]; f.plots[i] = { s: String(p.seed), t: nowIso() };
  } else if (p.do === "harvest") {
    const list = p.all ? Object.keys(f.plots) : [String(idx(p.plot, PLOTS))];
    let got = 0, n = 0;
    for (const k of list) { const pl = f.plots[k]; if (pl && grown(pl)) { got += SEEDS[pl.s][2]; n++; delete f.plots[k]; } }
    if (!n) return fail("Nothing is ready to harvest yet.", 409);
    coins += got; xp += n * 2; out.got = got; out.n = n;
  } else if (p.do === "water") {
    const list = p.all ? Object.keys(f.plots) : [String(idx(p.plot, PLOTS))];
    let n = 0;
    for (const k of list) {
      const pl = f.plots[k]; if (!pl || grown(pl)) continue;
      if (pl.w && Date.now() - pl.w < WATER_MS) continue;   // basa pa
      if (pl.w && pl.w >= new Date(pl.t).getTime()) pl.t = new Date(new Date(pl.t).getTime() - WATER_MS).toISOString();   // naipon na ang buong dagdag ng dating dilig
      pl.w = Date.now(); n++;
    }
    if (!n) return fail("Nothing needs water right now. 💧", 409);
    xp += 1; out.n = n;
  } else if (p.do === "pick") {
    const list = p.all ? Array.from({ length: TREES }, (_, i) => i) : [idx(p.tree, TREES)];
    let n = 0;
    for (const i of list) { if (i < 0) continue; const last = f.trees[i] ? new Date(f.trees[i]).getTime() : 0; if (Date.now() - last >= TREE_MS) { f.trees[i] = nowIso(); n++; } }
    if (!n) return fail("No fruit yet. Trees grow fruit every 4 hours.", 409);
    coins += n * TREE_COINS; xp += n; out.got = n * TREE_COINS; out.n = n;
  } else if (p.do === "fish") {
    const day = nowIso().slice(0, 10), fs = f.fish.d === day ? f.fish : { d: day, n: 0, t: 0 };
    if (Date.now() - (fs.t || 0) < FISH_GAP) return fail("The fish need a moment. Try again.", 429);
    if (fs.n >= FISH_DAY) return fail("The pond is quiet for today. Come back tomorrow!", 429);
    let r = Math.random() * 100, c = CATCH[1];
    for (const k of CATCH) { if (r < k[4]) { c = k; break; } r -= k[4]; }
    f.fish = { d: day, n: fs.n + 1, t: Date.now() };
    coins += c[3]; xp += c[3] ? 1 : 0; out.catch = { id: c[0], icon: c[1], name: c[2], coins: c[3] }; out.left = FISH_DAY - fs.n - 1;
  } else return fail("Unknown action.");
  const { data, error } = await db.from("pets").update({ farm: f, coins, xp, hunger: pet.hunger, joy: pet.joy, energy: pet.energy, clean: pet.clean, asleep: pet.asleep, stats_at: nowIso(), updated_at: nowIso() }).eq("user_id", me.id).select("*").single();
  if (error) throw error;
  return reply({ ok: true, pet: shape(data), levelUp: levelOf(xp) > before, ...out });
}

// Avatar: "tigo" (ang note) o "kid" (parang tao). Mga pagpipilian: maiikling salita lang (ang itsura ay nasa tigo/human-model.js).
const AV_KEYS = ["kind", "skin", "hair", "hairColor", "top", "topColor", "bottom", "bottomColor", "shoes", "preset", "eyes", "eyeColor"];
// deno-lint-ignore no-explicit-any
async function avatar(p: any, me: any) {
  const a = p.avatar && typeof p.avatar === "object" ? p.avatar : null;
  if (!a) return fail("Missing avatar.");
  const out: Record<string, string> = {};
  for (const k of AV_KEYS) {
    if (a[k] === undefined || a[k] === null || a[k] === "") continue;
    const v = String(a[k]);
    if (!/^[a-z0-9-]{1,16}$/.test(v)) return fail("Unknown avatar option.");
    out[k] = v;
  }
  if (out.kind !== "kid") out.kind = "tigo";
  await load(me.id);
  const { data, error } = await db.from("pets").update({ avatar: out, updated_at: nowIso() }).eq("user_id", me.id).select("*").single();
  if (error) throw error;
  return reply({ ok: true, pet: shape(decay(data)) });
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
      pet: { name: r.name, color: r.color, gear: r.gear, outfit: r.outfit ?? {}, avatar: r.avatar ?? null, glow: levelOf(r.xp) >= 10, level: levelOf(r.xp), mood: moodOf(d) },
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
    ? await Promise.all([db.from("users").select("id, username, display_name, avatar_url").in("id", ids), db.from("pets").select("user_id, name, color, gear, outfit, avatar, xp").in("user_id", ids)])
    : [{ data: [] }, { data: [] }];
  return reply({ ok: true, list: (data ?? []).map((m) => {
    const o = m.a_id === me.id ? m.b_id : m.a_id, pt = (pets ?? []).find((x) => x.user_id === o);
    return { at: m.created_at, day: m.day, by_me: m.by_id === me.id, user: (users ?? []).find((u) => u.id === o) ?? null,
      pet: pt ? { name: pt.name, color: pt.color, gear: pt.gear, outfit: pt.outfit ?? {}, avatar: pt.avatar ?? null, level: levelOf(pt.xp) } : null };
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
      case "avatar": return await avatar(p, me);
      case "farm":   return await farm(p, me);
      case "house":  return await house(p, me);
      case "grant":  return await grant(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("pet-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
