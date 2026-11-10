/* TigoMeNote · tigo/sudoku-game.js — Sudoku (2D, sa ibabaw ng stage ni Tigo)
   import { startSudoku, makePuzzle } from "./sudoku-game.js"
   const g = startSudoku(stage, { voice, seed, level: "easy"|"medium"|"hard", net, me, onEnd(res) })   g.stop()
   Pindot ang kahon → pindot ang numero. ✏️ Notes = maliliit na numero. ⌫ = bura. 💡 Hint (solo lang, 3, +30 s).
   Mali = pula at bilang ng mali; 3 mali = tapos. Pare-pareho ang puzzle ng lahat (seed) at iisa lang ang sagot.
   Versus (2–4, net mula sa room-lobby.js): makikita ang progress ng iba; ang unang makatapos ang panalo. Events: pr {pct, x}, fin {t}, out, bye.
   Resulta: { win, ms, level, mistakes, score }. */
const LV = { easy: 40, medium: 49, hard: 55 };
function rng(seed) { let s = (seed >>> 0) || 11; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const ok = (b, i, n) => { const r = (i / 9) | 0, c = i % 9, br = r - (r % 3), bc = c - (c % 3);
  for (let k = 0; k < 9; k++) { if (b[r * 9 + k] === n || b[k * 9 + c] === n || b[(br + ((k / 3) | 0)) * 9 + bc + (k % 3)] === n) return false; } return true; };
function fill(b, R) {
  const i = b.indexOf(0); if (i < 0) return true;
  const ns = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => R() - 0.5);
  for (const n of ns) if (ok(b, i, n)) { b[i] = n; if (fill(b, R)) return true; b[i] = 0; }
  return false;
}
function count(b, lim) {   // ilan ang sagot (hanggang lim)
  let best = -1, opts = null;
  for (let i = 0; i < 81; i++) if (!b[i]) { const o = []; for (let n = 1; n <= 9; n++) if (ok(b, i, n)) o.push(n); if (!o.length) return 0; if (!opts || o.length < opts.length) { best = i; opts = o; if (o.length === 1) break; } }
  if (best < 0) return 1;
  let total = 0;
  for (const n of opts) { b[best] = n; total += count(b, lim - total); b[best] = 0; if (total >= lim) break; }
  return total;
}
export function makePuzzle(seed, level) {
  const R = rng(seed), sol = new Array(81).fill(0); fill(sol, R);
  const puz = sol.slice(), order = [...Array(81).keys()].sort(() => R() - 0.5), target = LV[level] || LV.easy;
  let removed = 0;
  for (const i of order) {
    if (removed >= target) break;
    const v = puz[i]; puz[i] = 0;
    if (count(puz.slice(), 2) !== 1) puz[i] = v; else removed++;
  }
  return { puz, sol };
}

export function startSudoku(stage, { voice, seed = 1, level = "easy", net = null, me: meInfo = {}, onEnd } = {}) {
  const multi = !!net, { puz, sol } = makePuzzle(seed, level);
  const val = puz.slice(), notes = Array.from({ length: 81 }, () => new Set()), given = puz.map((v) => v > 0);
  let sel = val.indexOf(0), noteMode = false, mistakes = 0, hints = multi ? 0 : 3, penalty = 0, done = false, t0 = performance.now(), tickT = null;
  const need = puz.filter((v) => !v).length;
  const rivals = multi ? (net.roster || []).filter((x) => x.p !== net.me).map((x) => ({ p: x.p, name: x.name, pct: 0, fin: null, out: false })) : [];
  const box = document.createElement("div"); box.className = "sdk"; stage.append(box);
  box.innerHTML =
    '<div class="sdk-top"><span class="sdk-lv">' + level[0].toUpperCase() + level.slice(1) + '</span><span class="sdk-time" translate="no">0:00</span><span class="sdk-mis">❌ 0/3</span></div>' +
    (multi ? '<div class="sdk-riv"></div>' : "") +
    '<div class="sdk-main"><div class="sdk-grid" role="grid" aria-label="Sudoku"></div>' +
    '<div class="sdk-side"><div class="sdk-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button type="button" data-n="' + n + '">' + n + "<small></small></button>").join("") + "</div>" +
    '<div class="sdk-tools"><button type="button" data-t="note">✏️<small>Notes</small></button><button type="button" data-t="erase">⌫<small>Erase</small></button>' +
    (multi ? "" : '<button type="button" data-t="hint">💡<small>Hint <b class="sdk-h">3</b></small></button>') + "</div></div></div>";
  const grid = box.querySelector(".sdk-grid");
  grid.innerHTML = Array.from({ length: 81 }, (_, i) => '<button type="button" class="sdk-c' + (given[i] ? " g" : "") + '" data-i="' + i + '" role="gridcell"></button>').join("");
  const cells = [...grid.children];
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const correct = () => val.reduce((n, v, i) => n + (!given[i] && v === sol[i] ? 1 : 0), 0);

  function paint() {
    const r = (sel / 9) | 0, c = sel % 9, sv = val[sel];
    cells.forEach((el, i) => {
      const ir = (i / 9) | 0, ic = i % 9, v = val[i];
      el.classList.toggle("sel", i === sel);
      el.classList.toggle("rel", i !== sel && (ir === r || ic === c || ((ir / 3) | 0) === ((r / 3) | 0) && ((ic / 3) | 0) === ((c / 3) | 0)));
      el.classList.toggle("same", !!sv && v === sv && i !== sel);
      el.classList.toggle("bad", !!v && !given[i] && v !== sol[i]);
      el.innerHTML = v ? String(v) : notes[i].size ? '<span class="sdk-n">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => "<i>" + (notes[i].has(n) ? n : "") + "</i>").join("") + "</span>" : "";
    });
    box.querySelectorAll("[data-n]").forEach((b) => { const n = +b.dataset.n, left = 9 - val.filter((v, i) => v === n && v === sol[i]).length; b.classList.toggle("full", left <= 0); b.querySelector("small").textContent = left > 0 ? left : ""; });
    box.querySelector('[data-t="note"]').classList.toggle("on", noteMode);
    box.querySelector(".sdk-mis").textContent = "❌ " + mistakes + "/3";
    const h = box.querySelector(".sdk-h"); if (h) h.textContent = hints;
    if (multi) box.querySelector(".sdk-riv").innerHTML = '<span class="sdk-rv me"><b>You</b><i style="width:' + Math.round(correct() / need * 100) + '%"></i></span>' +
      rivals.map((x) => '<span class="sdk-rv' + (x.out ? " out" : "") + '"><b>@' + (window.TMN_UI ? TMN_UI.esc(x.name) : x.name) + (x.fin ? " ✅" : x.out ? " ❌" : "") + '</b><i style="width:' + x.pct + '%"></i></span>').join("");
  }
  function put(n) {
    if (done || given[sel]) return;
    if (noteMode && !val[sel]) { notes[sel].has(n) ? notes[sel].delete(n) : notes[sel].add(n); paint(); return; }
    if (val[sel] === sol[sel]) return;
    val[sel] = n; notes[sel].clear();
    if (n !== sol[sel]) { mistakes++; voice && voice.sfx("hit"); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {} }
    else {
      voice && voice.sfx("pop");
      // alisin ang notes na hindi na puwede
      const r = (sel / 9) | 0, c = sel % 9;
      for (let i = 0; i < 81; i++) { const ir = (i / 9) | 0, ic = i % 9; if (ir === r || ic === c || (((ir / 3) | 0) === ((r / 3) | 0) && ((ic / 3) | 0) === ((c / 3) | 0))) notes[i].delete(n); }
    }
    paint(); progress();
    if (mistakes >= 3) return end(false, "out");
    if (correct() === need) end(true);
  }
  function progress() { if (net) net.send("pr", { pct: Math.round(correct() / need * 100), x: mistakes }); }
  box.addEventListener("click", (e) => {
    const c = e.target.closest("[data-i]"); if (c) { sel = +c.dataset.i; paint(); return; }
    const n = e.target.closest("[data-n]"); if (n) { put(+n.dataset.n); return; }
    const t = e.target.closest("[data-t]"); if (!t || done) return;
    if (t.dataset.t === "note") { noteMode = !noteMode; paint(); }
    if (t.dataset.t === "erase" && !given[sel] && val[sel] !== sol[sel]) { val[sel] = 0; notes[sel].clear(); paint(); }
    if (t.dataset.t === "hint" && hints > 0) {
      let i = sel; if (given[i] || val[i] === sol[i]) i = val.findIndex((v, k) => !given[k] && v !== sol[k]);
      if (i < 0) return; hints--; penalty += 30000; sel = i; val[i] = sol[i]; notes[i].clear(); voice && voice.sfx("power"); paint(); progress();
      if (correct() === need) end(true);
    }
  });
  const keys = (e) => {
    if (done) return;
    if (/^[1-9]$/.test(e.key)) { put(+e.key); return; }
    const mv = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (mv) { e.preventDefault(); sel = Math.max(0, Math.min(80, sel + mv)); paint(); }
    if (e.key === "Backspace" || e.key === "Delete") { if (!given[sel] && val[sel] !== sol[sel]) { val[sel] = 0; paint(); } }
    if (e.key === "n" || e.key === "N") { noteMode = !noteMode; paint(); }
  };
  window.addEventListener("keydown", keys);
  tickT = setInterval(() => { box.querySelector(".sdk-time").textContent = fmt(performance.now() - t0 + penalty); }, 500);

  if (net) net.on((ev, d, from) => {
    const r = rivals.find((x) => x.p === from); if (!r) return;
    if (ev === "pr") { r.pct = d.pct; }
    if (ev === "fin") { r.fin = d.t; r.pct = 100; if (!done && window.TMN_UI) TMN_UI.toast("@" + r.name + " finished!"); }
    if (ev === "out" || ev === "bye") r.out = true;
    paint(); maybeAllDone();
  });
  let myRes = null;
  function maybeAllDone() { if (myRes && rivals.every((x) => x.fin || x.out)) finalize(); }
  function end(win, why) {
    if (done) return; done = true; clearInterval(tickT);
    const ms = Math.round(performance.now() - t0 + penalty);
    const beaten = rivals.filter((x) => x.fin && x.fin < ms).length;
    myRes = { win: win && (!multi || beaten === 0), solved: win, ms, level, mistakes, place: win ? beaten + 1 : null,
      score: win ? { easy: 10, medium: 16, hard: 24 }[level] - mistakes * 2 + (multi && beaten === 0 ? 6 : 0) : 0 };
    if (net) net.send(win ? "fin" : "out", { t: ms });
    voice && voice.sfx(win ? "win" : "hit");
    box.classList.add(win ? "won" : "lost");
    const msg = document.createElement("div"); msg.className = "sdk-msg";
    msg.innerHTML = win ? "<b>🎉 Solved!</b><span>" + fmt(ms) + (multi ? (beaten === 0 ? " · 1st place!" : " · #" + (beaten + 1)) : "") + "</span>" : "<b>❌ 3 mistakes</b><span>Try again!</span>";
    box.append(msg);
    if (multi && rivals.some((x) => !x.fin && !x.out)) { msg.insertAdjacentHTML("beforeend", "<small>Waiting for the others…</small>"); setTimeout(finalize, 20000); }
    else setTimeout(finalize, 1800);
  }
  let finalized = false;
  function finalize() {
    if (finalized) return; finalized = true;
    const r = Object.assign({}, myRes, { label: myRes.solved ? "🧩 " + fmt(myRes.ms) : "🧩 " + correct() + "/" + need });
    cleanup(); onEnd && onEnd(r);
  }
  function cleanup() { clearInterval(tickT); window.removeEventListener("keydown", keys); box.remove(); }
  paint();
  return {
    stop() { if (net) net.send("bye", {}); if (!done) { done = true; myRes = { win: false, solved: false, ms: Math.round(performance.now() - t0), level, mistakes, score: 0 }; } finalize(); },
    _s: { sol, val, given, put: (i, n) => { sel = i; put(n); } },   // para sa tests
  };
}
