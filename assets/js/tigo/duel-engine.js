/* TigoMeNote · tigo/duel-engine.js — 💎 Gem Duel: ang lohika ng match-3 (walang drawing; pare-pareho ang resulta sa dalawang phone dahil sa seed)
   import { createBoard, N, COLORS } from "./duel-engine.js"
   const b = createBoard(seed)
     b.col[i] (0–5 kulay, -1 wala) · b.sp[i] (0 wala · 1 guhit pahalang · 2 guhit patayo · 3 bomba · 4 bahaghari) · i = r * N + c (r 0 = itaas)
     b.canSwap(a, z) → true kung may mabubuo (o may espesyal na kasama)
     b.swap(a, z) → { ok, steps: [{ clear:[i], made:[{i,c,s}], drop:{ to:from }, spawn:[i], score, gems, snap }], score, gems, extra }  (extra = may bagong espesyal → +1 galaw)
     b.blast(i) → parehong anyo (💥 booster: 3×3 sa paligid ng i; hindi galaw)
     b.snapshot() / b.restore(s) · b.clone() (para sa bot) · b.bestMove(level) → [a, z] (bot)
   Puntos: 10 bawat hiyas × (1 + 0.5 bawat sunod-sunod na bagsak). Espesyal: 4 sa hanay = guhit · L/T = bomba (3×3) · 5 sa hanay = bahaghari (lahat ng isang kulay).
   Kapag walang posibleng galaw: kusang binabalasa (gamit din ang seed). */
export const N = 8, COLORS = 6;
const SP = { NONE: 0, LH: 1, LV: 2, BOMB: 3, RAIN: 4 };
export { SP };

function rng(seed) { let s = (seed >>> 0) || 1234567; return { next() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; }, get s() { return s; }, set s(v) { s = v >>> 0; } }; }
const rc = (i) => [(i / N) | 0, i % N];
const adj = (a, z) => { const [r1, c1] = rc(a), [r2, c2] = rc(z); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; };

export function createBoard(seed) {
  const R = rng(seed);
  let col = new Int8Array(N * N), sp = new Int8Array(N * N);
  const rnd = () => R.next() % COLORS;
  // ---------- simula: walang tatluhan agad, at may galaw ----------
  function fresh() {
    for (let i = 0; i < N * N; i++) {
      const [r, c] = rc(i); let k;
      do { k = rnd(); } while ((c >= 2 && col[i - 1] === k && col[i - 2] === k) || (r >= 2 && col[i - N] === k && col[i - 2 * N] === k));
      col[i] = k; sp[i] = 0;
    }
  }
  fresh(); let guard = 0; while (!hasMove() && guard++ < 50) fresh();

  // ---------- paghahanap ng tatluhan ----------
  function runs() {
    const out = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N;) { const i = r * N + c, k = col[i]; let e = c + 1; while (e < N && k >= 0 && sp[i] !== SP.RAIN && col[r * N + e] === k && sp[r * N + e] !== SP.RAIN) e++; if (k >= 0 && e - c >= 3) out.push({ h: true, cells: Array.from({ length: e - c }, (_, j) => r * N + c + j), k }); c = e; }
    for (let c = 0; c < N; c++) for (let r = 0; r < N;) { const i = r * N + c, k = col[i]; let e = r + 1; while (e < N && k >= 0 && sp[i] !== SP.RAIN && col[e * N + c] === k && sp[e * N + c] !== SP.RAIN) e++; if (k >= 0 && e - r >= 3) out.push({ h: false, cells: Array.from({ length: e - r }, (_, j) => (r + j) * N + c), k }); r = e; }
    return out;
  }
  function wouldMatch(a, z) {
    if (sp[a] === SP.RAIN || sp[z] === SP.RAIN) return true;
    if (sp[a] && sp[z]) return true;
    swapRaw(a, z); const ok = runs().length > 0; swapRaw(a, z); return ok;
  }
  function swapRaw(a, z) { let t = col[a]; col[a] = col[z]; col[z] = t; t = sp[a]; sp[a] = sp[z]; sp[z] = t; }
  function hasMove() {
    for (let i = 0; i < N * N; i++) { const [r, c] = rc(i); if (c < N - 1 && wouldMatch(i, i + 1)) return true; if (r < N - 1 && wouldMatch(i, i + N)) return true; }
    return false;
  }
  function shuffle() {   // balasa (pareho sa dalawang phone): Fisher–Yates gamit ang seed hanggang may galaw at walang tatluhan
    for (let t = 0; t < 60; t++) {
      for (let i = N * N - 1; i > 0; i--) { const j = R.next() % (i + 1); swapRaw(i, j); }
      if (!runs().length && hasMove()) return true;
    }
    fresh(); return true;
  }

  // ---------- pagsabog ng espesyal (kasama ang mga nadamay na espesyal) ----------
  function area(i, s, kOverride) {
    const [r, c] = rc(i), out = [];
    if (s === SP.LH) for (let x = 0; x < N; x++) out.push(r * N + x);
    else if (s === SP.LV) for (let y = 0; y < N; y++) out.push(y * N + c);
    else if (s === SP.BOMB) for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) { if (y >= 0 && y < N && x >= 0 && x < N) out.push(y * N + x); }
    else if (s === SP.RAIN) { const k = kOverride !== undefined ? kOverride : mostColor(); for (let j = 0; j < N * N; j++) if (col[j] === k) out.push(j); out.push(i); }
    return out;
  }
  function mostColor() { const cnt = new Array(COLORS).fill(0); for (let j = 0; j < N * N; j++) if (col[j] >= 0) cnt[col[j]]++; let b = 0; for (let k = 1; k < COLORS; k++) if (cnt[k] > cnt[b]) b = k; return b; }
  function expand(set, keep) {   // idagdag ang epekto ng bawat espesyal na nasa set (sunod-sunod)
    const q = [...set]; const done = new Set();
    while (q.length) { const i = q.pop(); if (done.has(i) || keep.has(i)) continue; done.add(i); if (sp[i]) for (const j of area(i, sp[i])) if (!set.has(j)) { set.add(j); q.push(j); } }
    return set;
  }

  // ---------- isang hakbang: tanggal, gawa ng espesyal, bagsak, bagong hiyas ----------
  function settle(clear, made, cascade) {
    const keep = new Set(made.map((m) => m.i)); expand(clear, keep);
    made.forEach((m) => clear.delete(m.i));
    const list = [...clear].filter((i) => col[i] >= 0 || sp[i]);
    let gems = 0; list.forEach((i) => { if (col[i] >= 0) gems++; col[i] = -1; sp[i] = 0; });
    made.forEach((m) => { col[m.i] = m.c; sp[m.i] = m.s; });
    const score = Math.round(list.length * 10 * (1 + cascade * 0.5));
    // bagsak: bawat kolum, mula sa ibaba
    const drop = {}, spawn = [];
    for (let c = 0; c < N; c++) {
      let w = N - 1;
      for (let r = N - 1; r >= 0; r--) { const i = r * N + c; if (col[i] >= 0 || sp[i]) { const t = w * N + c; if (t !== i) { col[t] = col[i]; sp[t] = sp[i]; col[i] = -1; sp[i] = 0; drop[t] = i; } w--; } }
      for (let r = w, n = 1; r >= 0; r--, n++) { const i = r * N + c; col[i] = rnd(); sp[i] = 0; spawn.push(i); drop[i] = -n * N + c; }   // galing sa itaas ng board
    }
    return { clear: list, made, drop, spawn, score, gems, snap: { col: Array.from(col), sp: Array.from(sp) } };   // snap = ayos pagkatapos ng hakbang (para sa animation)
  }
  function makeFromRuns(rs, pivot) {
    const clear = new Set(), made = [], cellRuns = new Map();
    rs.forEach((run) => run.cells.forEach((i) => { clear.add(i); cellRuns.set(i, (cellRuns.get(i) || 0) + 1); }));
    rs.forEach((run) => {
      const at = run.cells.includes(pivot[0]) ? pivot[0] : run.cells.includes(pivot[1]) ? pivot[1] : run.cells[(run.cells.length / 2) | 0];
      if (made.some((m) => run.cells.includes(m.i))) return;
      const cross = run.cells.find((i) => cellRuns.get(i) > 1);
      if (run.cells.length >= 5) made.push({ i: at, c: -1, s: SP.RAIN });
      else if (cross !== undefined) made.push({ i: cross, c: run.k, s: SP.BOMB });
      else if (run.cells.length === 4) made.push({ i: at, c: run.k, s: run.h ? SP.LH : SP.LV });
    });
    made.forEach((m) => { if (m.s === SP.RAIN) m.c = -1; });
    return { clear, made };
  }
  function cascadeFrom(first, pivot) {
    const steps = [first]; let cascade = 1, guard = 0;
    while (guard++ < 40) { const rs = runs(); if (!rs.length) break; const { clear, made } = makeFromRuns(rs, pivot || [-1, -1]); steps.push(settle(clear, made, cascade++)); pivot = null; }
    if (!hasMove()) { shuffle(); steps.push({ shuffle: true, snap: snapshot() }); }
    const score = steps.reduce((s, x) => s + (x.score || 0), 0), gems = steps.reduce((s, x) => s + (x.gems || 0), 0), extra = steps.some((x) => x.made && x.made.length);
    return { ok: true, steps, score, gems, extra };
  }

  function swap(a, z) {
    if (!adj(a, z) || col[a] < -1 || col[z] < -1) return { ok: false };
    // bahaghari + hiyas: lahat ng kulay na iyon · dalawang espesyal: parehong sasabog
    if (sp[a] === SP.RAIN || sp[z] === SP.RAIN) {
      const ra = sp[a] === SP.RAIN ? a : z, other = ra === a ? z : a, set = new Set();
      if (sp[other] === SP.RAIN) for (let j = 0; j < N * N; j++) set.add(j);
      else { const k = col[other]; area(ra, SP.RAIN, k).forEach((j) => set.add(j)); if (sp[other]) set.add(other); }
      set.add(ra); sp[ra] = 0;
      return cascadeFrom(settle(set, [], 0), null);
    }
    if (sp[a] && sp[z]) { const set = new Set([...area(a, sp[a]), ...area(z, sp[z]), a, z]); return cascadeFrom(settle(set, [], 0), null); }
    swapRaw(a, z);
    const rs = runs(); if (!rs.length) { swapRaw(a, z); return { ok: false }; }
    const { clear, made } = makeFromRuns(rs, [z, a]);
    return cascadeFrom(settle(clear, made, 0), null);
  }
  function blast(i) {
    const [r, c] = rc(i), set = new Set();
    for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (y >= 0 && y < N && x >= 0 && x < N) set.add(y * N + x);
    return cascadeFrom(settle(set, [], 0), null);
  }
  function snapshot() { return { col: Array.from(col), sp: Array.from(sp), s: R.s }; }
  function restore(o) { col = Int8Array.from(o.col); sp = Int8Array.from(o.sp); R.s = o.s; api.col = col; api.sp = sp; }
  // ---------- bot: sinusubukan ang bawat galaw sa kopya ----------
  function bestMove(level = "normal") {
    const opts = [], snap = snapshot();
    for (let i = 0; i < N * N; i++) for (const z of [i + 1, i + N]) {
      if ((z === i + 1 && i % N === N - 1) || z >= N * N || !wouldMatch(i, z)) continue;
      const r = swap(i, z); restore(snap); if (r.ok) opts.push({ a: i, z, v: r.score + (r.extra ? 40 : 0) });
    }
    if (!opts.length) return null;
    opts.sort((x, y) => y.v - x.v);
    const pick = level === "easy" ? opts[Math.floor(Math.random() * Math.min(opts.length, 6))] : level === "hard" ? opts[0] : opts[Math.random() < 0.65 ? 0 : Math.floor(Math.random() * Math.min(opts.length, 3))];
    return [pick.a, pick.z];
  }
  const api = { col, sp, canSwap: (a, z) => adj(a, z) && wouldMatch(a, z), swap, blast, snapshot, restore, bestMove, hasMove, adj };
  return api;
}
