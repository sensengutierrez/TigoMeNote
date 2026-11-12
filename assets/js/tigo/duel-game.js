/* TigoMeNote · tigo/duel-game.js — 💎 Gem Duel: 1 vs 1 na match-3 sa iisang board (2D canvas, sa ibabaw ng stage ni Tigo)
   import { startDuel } from "./duel-game.js"
   const g = startDuel(stage, { voice, seed, net, me:{name,color}, opp:{ name, bot, level }, ranked, onEnd(res) })   g.stop() = suko (talo)
   Laro: 5 round; bawat turn = 2 galaw (⏱ 25 s). Swipe (o pindot-pindot) ng magkatabing hiyas para makabuo ng 3+. Espesyal = +1 galaw.
     Puno ang 💥 Blast (20 hiyas na natanggal mo) → pindutin, tapos pindutin ang hiyas: 3×3 na sabog (hindi galaw).
     Pinakamataas na puntos pagkatapos ng 5 round ang panalo.
   Online (net mula sa duel-menu.js): parehong seed → parehong board. Ang may turn lang ang nagpapadala ng galaw: mv {n,a,z} · bo {n,i} · pass {n};
     ang kabila ay naglalapat nang sunod-sunod (n). hb bawat 3 s; walang balita nang 45 s habang turn nila, o "bye" = panalo ka.
   Resulta: { win, draw, score, opp, ms, label, forfeit, noshow } → onResult(res) pagkalabas ng end screen (para sa ranking), onEnd(res) pagka-Continue. Sariling disenyo ng hiyas (gawa sa code). */
import { createBoard, N, SP } from "./duel-engine.js";

const ROUNDS = 5, MOVES = 2, TURN_S = 25, BOOST = 20;
const GEM = [["#ff4d6d", "#ffb3c1"], ["#ff9f1c", "#ffd29a"], ["#ffd23f", "#fff2a8"], ["#38c172", "#a7f0c2"], ["#3fa9f5", "#b8e2ff"], ["#9b5de5", "#dcc6ff"]];
const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s) : String(s));

function shape(c, k, r) {   // bawat kulay ay may sariling hugis (para madaling makilala kahit color-blind)
  c.beginPath();
  if (k === 0) { c.moveTo(0, r * 0.75); c.bezierCurveTo(-r * 1.25, -r * 0.1, -r * 0.55, -r * 1.05, 0, -r * 0.4); c.bezierCurveTo(r * 0.55, -r * 1.05, r * 1.25, -r * 0.1, 0, r * 0.75); }   // puso
  else if (k === 1) { const q = r * 0.78; c.roundRect ? c.roundRect(-q, -q, q * 2, q * 2, r * 0.28) : c.rect(-q, -q, q * 2, q * 2); }                        // kahon
  else if (k === 2) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? r * 0.45 : r; i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d); } }   // bituin
  else if (k === 3) { c.moveTo(0, -r); c.lineTo(r * 0.85, 0); c.lineTo(0, r); c.lineTo(-r * 0.85, 0); }                                                    // diyamante
  else if (k === 4) { c.moveTo(0, -r); c.bezierCurveTo(r * 0.2, -r * 0.5, r * 0.85, 0, r * 0.75, r * 0.35); c.arc(0, r * 0.3, r * 0.75, 0.05, Math.PI - 0.05); c.bezierCurveTo(-r * 0.85, 0, -r * 0.2, -r * 0.5, 0, -r); }   // patak
  else { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; i ? c.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92) : c.moveTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); } }   // heksagon
  c.closePath();
}
function drawGem(c, k, s, x, y, size, a = 1, sc = 1, t = 0) {
  if (k < 0 && s !== SP.RAIN) return;
  const r = size * 0.4 * sc; if (r <= 0.5) return;
  c.save(); c.globalAlpha = a; c.translate(x, y);
  if (s === SP.RAIN) {   // bahaghari: umiikot na makulay na bola
    c.rotate(t * 2); const g = c.createConicGradient ? c.createConicGradient(0, 0, 0) : null;
    if (g) { GEM.forEach((q, i) => g.addColorStop(i / 6, q[0])); g.addColorStop(1, GEM[0][0]); c.fillStyle = g; } else c.fillStyle = "#fff";
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(0, 0, r * 0.35, 0, 7); c.fill(); c.restore(); return;
  }
  const [base, lite] = GEM[k];
  if (s === SP.BOMB) { c.shadowColor = base; c.shadowBlur = size * 0.35; }
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1); g.addColorStop(0, lite); g.addColorStop(0.55, base); g.addColorStop(1, base);
  c.fillStyle = g; shape(c, k, r); c.fill(); c.shadowBlur = 0;
  c.lineWidth = Math.max(1, size * 0.04); c.strokeStyle = "rgba(0,0,0,.25)"; c.stroke();
  c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.38, r * 0.22, r * 0.12, -0.5, 0, 7); c.fill();
  if (s === SP.LH || s === SP.LV) { c.fillStyle = "rgba(255,255,255,.9)"; for (const d of [-0.3, 0.3]) s === SP.LH ? c.fillRect(-r, d * r - r * 0.07, r * 2, r * 0.14) : c.fillRect(d * r - r * 0.07, -r, r * 0.14, r * 2); }
  if (s === SP.BOMB) { c.strokeStyle = "#fff"; c.lineWidth = size * 0.06; c.beginPath(); c.arc(0, 0, r * 0.55, 0, 7); c.stroke(); c.fillStyle = "#2a2240"; c.beginPath(); c.arc(0, 0, r * 0.32, 0, 7); c.fill(); }
  c.restore();
}

export function startDuel(stage, { voice, seed = 1, net = null, me = {}, opp = {}, ranked = false, onResult, onEnd } = {}) {
  const board = createBoard(seed), online = !!net, meIdx = online && !net.host ? 1 : 0, oppIdx = 1 - meIdx;
  const P = [0, 1].map((i) => i === meIdx ? { name: me.name || "you", color: me.color || "coral", you: true } : { name: opp.name || "Bot", bot: !!opp.bot, level: opp.level || "normal" });
  const S = { turn: 0, left: MOVES, score: [0, 0], boost: [0, 0], busy: false, over: false, started: false, armed: false, sel: -1, n: 0, timeT: TURN_S, hintT: 0, hint: null, extraNote: 0, lastHeard: Date.now() };
  const t0 = performance.now(), log = [];   // log = mga nailapat na galaw (para sa tests)
  const sfx = (k) => { if (voice) voice.sfx(k); };
  // ---------- DOM ----------
  const box = document.createElement("div"); box.className = "dl"; box.setAttribute("role", "application"); box.setAttribute("aria-label", "Gem Duel");
  const card = (i) => '<div class="dl-p" data-p="' + i + '"><span class="dl-av ' + esc(P[i].color || "sky") + '">' + (P[i].bot ? "🤖" : P[i].you ? "😊" : "🧑") + '</span><span class="dl-pn"><b translate="no">' + (P[i].you ? "You" : "@" + esc(P[i].name)) + '</b><i class="dl-boost"><b></b></i></span><b class="dl-sc">0</b></div>';
  box.innerHTML = '<div class="dl-top">' + card(0) + '<div class="dl-mid"><b class="dl-round"></b><span class="dl-moves"></span><i class="dl-timer"><b></b></i></div>' + card(1) + "</div>" +
    '<div class="dl-wrap"><canvas class="dl-board" aria-label="Board"></canvas><div class="dl-banner" aria-live="polite"></div></div>' +
    '<div class="dl-bar"><button type="button" class="dl-blast" disabled>💥<small>Blast</small><i><b></b></i></button><span class="dl-tip faint small">Swipe two gems next to each other. Make 3 or more!</span></div>';
  stage.append(box); stage.classList.add("dueling");
  const cv = box.querySelector("canvas"), ctx = cv.getContext("2d"), banner = box.querySelector(".dl-banner"), blastB = box.querySelector(".dl-blast");
  let px = 300, cell = 36, DPR = 1, sprites = {};
  // hiyas na naka-cache bilang maliit na larawan (mabilis i-drawImage; ang bahaghari lang ang iginuguhit bawat frame dahil umiikot)
  function sprite(k, s) {
    const key = k + "_" + s; let c = sprites[key]; if (c) return c;
    const S2 = Math.ceil(cell * 1.6 * DPR); c = document.createElement("canvas"); c.width = c.height = S2;
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0); drawGem(g, k, s, S2 / 2 / DPR, S2 / 2 / DPR, cell, 1, 1, 0); sprites[key] = c; return c;
  }
  function gem(k, s, x, y, a = 1, sc = 1) {
    if (k < 0 && s !== SP.RAIN) return; if (a <= 0.01 || sc <= 0.01) return;
    if (s === SP.RAIN) { drawGem(ctx, k, s, x, y, cell, a, sc, tt); return; }
    const c = sprite(k, s), w = (c.width / DPR) * sc; ctx.globalAlpha = a; ctx.drawImage(c, x - w / 2, y - w / 2, w, w); ctx.globalAlpha = 1;
  }
  function fit() {
    const w = box.querySelector(".dl-wrap"), r = w.getBoundingClientRect(), side = Math.max(160, Math.floor(Math.min(r.width, r.height) - 4)), dpr = Math.min(2, window.devicePixelRatio || 1);
    DPR = dpr; sprites = {};
    px = side; cell = side / N; cv.style.width = cv.style.height = side + "px"; cv.width = cv.height = Math.round(side * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = window.ResizeObserver ? new ResizeObserver(fit) : null; if (ro) ro.observe(box.querySelector(".dl-wrap")); fit();
  function say(txt, ms = 1400) { banner.textContent = txt; banner.classList.remove("on"); void banner.offsetWidth; banner.classList.add("on"); clearTimeout(say.t); say.t = setTimeout(() => banner.classList.remove("on"), ms); }
  function hud() {
    const mover = S.turn % 2;
    box.querySelector(".dl-round").textContent = S.over ? "Final" : "Round " + Math.min(ROUNDS, Math.floor(S.turn / 2) + 1) + " / " + ROUNDS;
    box.querySelector(".dl-moves").innerHTML = S.over ? "" : Array.from({ length: Math.max(MOVES, S.left) }, (_, i) => '<i class="' + (i < S.left ? "on" : "") + '"></i>').join("");
    [0, 1].forEach((i) => { const el = box.querySelector('[data-p="' + i + '"]'); el.classList.toggle("act", !S.over && mover === i); el.querySelector(".dl-sc").textContent = S.score[i].toLocaleString(); el.querySelector(".dl-boost b").style.width = Math.round((S.boost[i] / BOOST) * 100) + "%"; el.classList.toggle("full", S.boost[i] >= BOOST); });
    const mine = !S.over && mover === meIdx && S.started; blastB.disabled = !mine || S.boost[meIdx] < BOOST || S.busy; blastB.classList.toggle("armed", S.armed);
    blastB.querySelector("i b").style.width = Math.round((S.boost[meIdx] / BOOST) * 100) + "%";
    box.classList.toggle("mine", mine);
  }

  // ---------- animation ----------
  let view = board.snapshot(), anim = null, parts = [], pops = [], raf = 0, last = performance.now(), tt = 0, lastDraw = 0;
  const queue = [];   // mga gagawin pagkatapos ng animation
  const XY = (i) => [(i % N + 0.5) * cell, (((i / N) | 0) + 0.5) * cell];
  function play(kind, a, z, res, done) {
    const pre = view;   // ayos bago ang galaw (nakikita)
    anim = { kind, a, z, res, step: -1, t: 0, phase: kind === "mv" ? "swap" : kind === "bad" ? "bad" : "pop", pre, done };
    if (kind === "bo") { anim.step = 0; anim.phase = "pop"; burst(res.steps[0]); }
  }
  function burst(st) {
    if (!st || st.shuffle) return;
    const cur = anim.cur || view;
    st.clear.forEach((i) => { const k = cur.col[i], [x, y] = XY(i); for (let j = 0; j < 5; j++) { const a = Math.random() * 6.28, sp = (0.6 + Math.random()) * cell * 3; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - cell, life: 0.5, c: k >= 0 ? GEM[k][0] : "#fff" }); } });
    if (st.clear.length) { let sx = 0, sy = 0; st.clear.forEach((i) => { const [x, y] = XY(i); sx += x; sy += y; }); pops.push({ x: sx / st.clear.length, y: sy / st.clear.length, txt: "+" + st.score, life: 0.9 }); }
    if (st.made && st.made.length) sfx("power"); else sfx(st.clear.length > 4 ? "coin" : "pop");
  }
  function tickAnim(dt) {
    if (!anim) return;
    const A = anim; A.t += dt;
    if (A.phase === "swap" || A.phase === "bad") {
      if (A.t >= 0.16) {
        if (A.phase === "bad") { if (!A.back) { A.back = true; A.t = 0; return; } anim = null; A.done && A.done(); return; }
        A.phase = "pop"; A.t = 0; A.step = 0; A.cur = swappedView(A.pre, A.a, A.z); burst(A.res.steps[0]);
      }
      return;
    }
    const st = A.res.steps[A.step];
    if (st.shuffle) { if (A.t > 0.5) { view = st.snap; next(); } else if (A.t < dt * 1.5) say("🔀 Shuffle!", 900); return; }
    if (A.phase === "pop" && A.t >= 0.17) { A.phase = "fall"; A.t = 0; }
    else if (A.phase === "fall" && A.t >= 0.24) { view = st.snap; next(); }
    function next() { A.step++; A.t = 0; A.cur = view; if (A.step >= A.res.steps.length) { anim = null; A.done && A.done(); } else { A.phase = "pop"; burst(A.res.steps[A.step]); } }
  }
  function swappedView(v, a, z) { const col = v.col.slice(), sp = v.sp.slice(); [col[a], col[z]] = [col[z], col[a]]; [sp[a], sp[z]] = [sp[z], sp[a]]; return { col, sp }; }
  function draw(dt) {
    ctx.clearRect(0, 0, px, px);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { ctx.fillStyle = (r + c) % 2 ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.13)"; ctx.fillRect(c * cell, r * cell, cell, cell); }
    const A = anim;
    if (A && (A.phase === "swap" || A.phase === "bad")) {
      const v = A.pre, k = Math.min(1, A.t / 0.16), q = A.back ? 1 - k : k, [ax, ay] = XY(A.a), [zx, zy] = XY(A.z);
      for (let i = 0; i < N * N; i++) if (i !== A.a && i !== A.z) { const [x, y] = XY(i); gem(v.col[i], v.sp[i], x, y, 1, 1); }
      gem(v.col[A.a], v.sp[A.a], ax + (zx - ax) * q, ay + (zy - ay) * q, 1, 1.05); gem(v.col[A.z], v.sp[A.z], zx + (ax - zx) * q, zy + (ay - zy) * q, 1, 1);
    } else if (A && A.step >= 0 && A.res.steps[A.step] && !A.res.steps[A.step].shuffle) {
      const st = A.res.steps[A.step], cur = A.cur || view;
      if (A.phase === "pop") {
        const k = Math.min(1, A.t / 0.17), gone = new Set(st.clear);
        for (let i = 0; i < N * N; i++) { const [x, y] = XY(i); if (gone.has(i)) gem(cur.col[i], cur.sp[i], x, y, 1 - k, 1 + k * 0.4); else gem(cur.col[i], cur.sp[i], x, y, 1, 1); }
        st.made.forEach((m) => { const [x, y] = XY(m.i); gem(m.c, m.s, x, y, k, 0.6 + k * 0.4); });
      } else {
        const k = Math.min(1, A.t / 0.24), e = k * k * (3 - 2 * k), nv = st.snap;
        for (let i = 0; i < N * N; i++) { const [x, y] = XY(i), src = st.drop[i]; let yy = y; if (src !== undefined) { const sr = Math.floor(src / N); yy = (sr + 0.5) * cell + (y - (sr + 0.5) * cell) * e; } gem(nv.col[i], nv.sp[i], x, yy, 1, 1); }
      }
    } else {
      const v = A && A.cur ? A.cur : view;
      for (let i = 0; i < N * N; i++) {
        const [x, y] = XY(i); let ox = 0, sc = 1;
        if (S.hint && (i === S.hint[0] || i === S.hint[1])) { ox = Math.sin(tt * 14) * cell * 0.06; sc = 1.06; }
        gem(v.col[i], v.sp[i], x + ox, y, 1, i === S.sel ? 1.15 : sc);
      }
      if (S.sel >= 0) { const [x, y] = XY(S.sel); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(x - cell / 2 + 2, y - cell / 2 + 2, cell - 4, cell - 4); }
    }
    // tilamsik at puntos
    parts = parts.filter((p) => (p.life -= dt) > 0); parts.forEach((p) => { p.vy += cell * 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, cell * 0.07, 0, 7); ctx.fill(); });
    pops = pops.filter((p) => (p.life -= dt) > 0); ctx.textAlign = "center"; ctx.font = "800 " + Math.round(cell * 0.45) + "px system-ui, sans-serif";
    pops.forEach((p) => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.strokeText(p.txt, p.x, p.y - (0.9 - p.life) * cell); ctx.fillStyle = "#fff"; ctx.fillText(p.txt, p.x, p.y - (0.9 - p.life) * cell); });
    ctx.globalAlpha = 1;
  }
  function loop(now) {
    if (S.ended) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    tt += dt; tickAnim(dt);
    // iguhit lang kapag may gumagalaw (tipid sa baterya); kung wala, ~4 beses bawat segundo
    if (anim || parts.length || pops.length || S.hint || S.sel >= 0 || S.armed || (view.sp && view.sp.indexOf(SP.RAIN) >= 0) || now - lastDraw > 250) { draw(dt); lastDraw = now; }
    if (!anim && !S.busy && queue.length) queue.shift()();
    tickTurn(dt);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  // ---------- galaw ----------
  const mover = () => S.turn % 2;
  function apply(act) {   // pare-pareho sa dalawang phone
    if (S.over) return;
    S.n++; S.busy = true; S.hint = null; S.sel = -1; S.armed = false;
    const who = mover(); log.push([S.n, who, act.k, act.a, act.z, act.i]);
    if (act.k === "pass") { S.busy = false; nextTurn(true); return; }
    let res;
    if (act.k === "bo") { if (S.boost[who] < BOOST) { S.busy = false; return; } S.boost[who] = 0; view = board.snapshot(); res = board.blast(act.i); play("bo", act.i, act.i, res, () => after(who, res, false)); sfx("hit"); return; }
    const pre = board.snapshot(); res = board.swap(act.a, act.z);
    if (!res.ok) { play("bad", act.a, act.z, null, () => { S.busy = false; }); sfx("tick"); S.n--; return; }
    view = { col: pre.col, sp: pre.sp }; play("mv", act.a, act.z, res, () => after(who, res, true));
  }
  function after(who, res, isMove) {
    view = board.snapshot();
    S.score[who] += res.score; S.boost[who] = Math.min(BOOST, S.boost[who] + res.gems);
    if (isMove) { S.left--; if (res.extra) { S.left++; say("✨ Extra move!", 900); sfx("level"); } }
    if (S.boost[who] >= BOOST && who === meIdx && !S.toldBoost) { S.toldBoost = true; say("💥 Blast is ready!", 1200); }
    if (S.boost[who] < BOOST) S.toldBoost = false;
    S.busy = false; hud();
    if (S.left <= 0) setTimeout(() => nextTurn(false), 350); else if (who !== meIdx && P[who].bot) botSoon();
  }
  function nextTurn(passed) {
    if (S.over) return;
    if (passed && mover() === meIdx) say("⏱ Time's up!", 1000);
    S.turn++; S.left = MOVES; S.timeT = TURN_S; S.hintT = 0;
    if (S.turn >= ROUNDS * 2) { finish(); return; }
    hud();
    const m = mover();
    if (m === meIdx) { say(S.turn >= ROUNDS * 2 - 2 ? "🔥 Last turn — your move!" : "Your turn!", 1100); sfx("go"); }
    else { say(P[m].bot ? "🤖 Bot's turn…" : "@" + P[m].name + "'s turn", 1100); if (P[m].bot) botSoon(); }
  }
  function botSoon() {
    clearTimeout(botSoon.t);
    botSoon.t = setTimeout(() => {
      if (S.over || mover() === meIdx) return;
      if (S.boost[mover()] >= BOOST && Math.random() < 0.7) { const i = (2 + ((Math.random() * 4) | 0)) * N + 2 + ((Math.random() * 4) | 0); queue.push(() => apply({ k: "bo", i })); return; }
      const mv = board.bestMove(P[mover()].level); view = board.snapshot();
      queue.push(() => (mv ? apply({ k: "mv", a: mv[0], z: mv[1] }) : apply({ k: "pass" })));
    }, 700 + Math.random() * 600);
  }
  function mine(act) {   // galaw ko: ilapat at ipadala
    if (S.over || !S.started || S.busy || anim || mover() !== meIdx || (S.left <= 0 && act.k !== "bo")) return;
    if (act.k === "mv" && !board.canSwap(act.a, act.z)) { apply(act); return; }   // hindi puwede: babalik (hindi ipinapadala)
    if (online) net.send(act.k, Object.assign({ n: S.n }, act));
    apply(act);
  }
  // ---------- oras ng turn ----------
  function tickTurn(dt) {
    if (S.over || !S.started) return;
    if (!S.busy && !anim) S.timeT -= dt;
    box.querySelector(".dl-timer b").style.width = Math.max(0, (S.timeT / TURN_S) * 100) + "%";
    box.querySelector(".dl-timer").classList.toggle("low", S.timeT < 6);
    if (mover() === meIdx) {
      if (S.timeT <= 0 && !S.busy && !anim) { if (online) net.send("pass", { n: S.n, k: "pass" }); apply({ k: "pass" }); }
      S.hintT += dt; if (S.hintT > 7 && !S.hint && !S.busy && !anim) { S.hint = board.bestMove("easy"); view = board.snapshot(); }
    } else if (online && Date.now() - S.lastHeard > 45000) forfeit("opponent");
  }
  // ---------- pindot / swipe ----------
  let down = null;
  const cellAt = (e) => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (x < 0 || y < 0 || x >= r.width || y >= r.height) return -1; return Math.floor((y / r.height) * N) * N + Math.floor((x / r.width) * N); };
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault(); const i = cellAt(e); if (i < 0 || mover() !== meIdx || S.busy || anim) return;
    if (S.armed) { mine({ k: "bo", i }); return; }
    if (S.sel >= 0 && S.sel !== i && board.adj(S.sel, i)) { const a = S.sel; S.sel = -1; mine({ k: "mv", a, z: i }); return; }
    down = { i, x: e.clientX, y: e.clientY, id: e.pointerId }; S.sel = i; S.hintT = 0; S.hint = null;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener("pointermove", (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, th = (cv.getBoundingClientRect().width / N) * 0.35;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    const r = (down.i / N) | 0, c = down.i % N, z = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? (c < N - 1 ? down.i + 1 : -1) : (c > 0 ? down.i - 1 : -1)) : (dy > 0 ? (r < N - 1 ? down.i + N : -1) : (r > 0 ? down.i - N : -1));
    const a = down.i; down = null; S.sel = -1; if (z >= 0) mine({ k: "mv", a, z });
  });
  const up = (e) => { if (down && e.pointerId === down.id) down = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  blastB.addEventListener("click", () => { if (blastB.disabled) return; S.armed = !S.armed; S.sel = -1; say(S.armed ? "💥 Tap a gem to blast!" : "Blast cancelled", 1100); hud(); });
  box.addEventListener("contextmenu", (e) => e.preventDefault());
  // huwag ipasa sa stage (camera ng 3D / controls): kinukuha nila ang pointer kaya hindi gumagana ang swipe at mga button
  ["pointerdown", "pointermove", "pointerup", "touchstart", "touchmove", "wheel"].forEach((n) => box.addEventListener(n, (e) => e.stopPropagation(), { passive: true }));

  // ---------- online ----------
  const pend = new Map();
  function heard(ev, d) {
    S.lastHeard = Date.now();
    if (ev === "bye") { forfeit("opponent"); return; }
    if (ev === "rdy" && !S.started) { if (!d.re) net.send("rdy", { re: true }); begin(); return; }
    if ((ev === "mv" || ev === "bo" || ev === "pass") && typeof d.n === "number") { pend.set(d.n, { k: ev, a: d.a | 0, z: d.z | 0, i: d.i | 0 }); drain(); }
  }
  function drain() { while (pend.has(S.n) && mover() === oppIdx) { const act = pend.get(S.n); pend.delete(S.n); queue.push(() => apply(act)); if (act.k !== "pass") break; } if (pend.size) setTimeout(drain, 150); }
  let hbT = 0;
  if (online) {
    net.on((ev, d, from) => { if (from && from !== net.me) heard(ev, d || {}); });
    hbT = setInterval(() => { try { net.send("hb", {}); } catch (e) {} if (!S.started) net.send("rdy", {}); }, 3000);
    net.send("rdy", {});
    say("Waiting for @" + P[oppIdx].name + "…", 30000);
    setTimeout(() => { if (!S.started && !S.over) forfeit("noshow"); }, 30000);
  }
  function begin() {
    if (S.started || S.over) return; S.started = true; S.timeT = TURN_S; hud();
    say(mover() === meIdx ? "⚔️ Duel! You go first" : "⚔️ Duel! @" + P[mover()].name + " goes first", 1500); sfx("go");
    if (P[mover()].bot) botSoon();
  }
  // ---------- tapos ----------
  function finish(extra) {
    if (S.over) return; S.over = true; hud(); clearInterval(hbT); clearTimeout(botSoon.t);
    const my = S.score[meIdx], op = S.score[oppIdx], ff = extra && extra.forfeit, win = ff === "opponent" || ff === "noshow" ? true : ff === "me" ? false : my > op, draw = !ff && my === op;
    if (online && ff !== "opponent" && ff !== "noshow") try { net.send(ff === "me" ? "bye" : "end", { s: my }); } catch (e) {}
    const res = { win: win && !draw, draw, score: my, opp: op, ms: Math.round(performance.now() - t0), forfeit: ff || null, noshow: ff === "noshow",
      label: draw ? "🤝 Draw!" : win ? "🏆 You win!" : "💔 You lose" };
    const ov = document.createElement("div"); ov.className = "dl-end";
    ov.innerHTML = "<b>" + (ff === "opponent" ? "🏆 They left — you win!" : ff === "noshow" ? "😴 Nobody came — you win" : res.label) + '</b><div class="dl-end-s"><span>You<b>' + my.toLocaleString() + "</b></span><span>" + (P[oppIdx].bot ? "🤖 Bot" : "@" + esc(P[oppIdx].name)) + "<b>" + op.toLocaleString() + "</b></span></div>" +
      (ranked ? '<small class="dl-tro">🏆 Ranking…</small>' : "") + '<button type="button" class="btn btn-primary" data-ok>Continue</button>';
    box.append(ov); sfx(win && !draw ? "win" : "tick");
    let sent = false; const go = () => { if (sent) return; sent = true; end(res); };
    ov.querySelector("[data-ok]").onclick = go; setTimeout(go, ranked ? 12000 : 9000);
    if (onResult) try { onResult(res); } catch (e) {}
  }
  function forfeit(who) { S.endWhy = who; finish({ forfeit: who }); }
  function end(res) { if (S.ended) return; S.ended = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); clearInterval(hbT); clearTimeout(botSoon.t); box.remove(); stage.classList.remove("dueling"); if (onEnd) onEnd(res); }
  const api = {
    setTrophies(txt) { const t = box.querySelector(".dl-tro"); if (t) t.textContent = txt; },
    stop() { if (!S.over) finish({ forfeit: "me" }); end({ win: false, draw: false, score: S.score[meIdx], opp: S.score[oppIdx], ms: Math.round(performance.now() - t0), forfeit: "me", label: "🏳️ You left" }); },
    go() {}, state: () => ({ turn: S.turn, left: S.left, score: S.score.slice(), boost: S.boost.slice(), mine: mover() === meIdx && S.left > 0, started: S.started, over: S.over, busy: S.busy || !!anim }),
    _board: board, _log: log, _end: () => S.endWhy || null, _dbg: () => ({ n: S.n, pend: [...pend.keys()], tt: Math.round(tt * 10) / 10, ended: !!S.ended, turn: S.turn, left: S.left, q: queue.length, busy: S.busy, anim: !!anim }), _move: (a, z) => mine({ k: "mv", a, z }), _blast: (i) => mine({ k: "bo", i }), _fill: (k) => { S.boost[meIdx] = k; hud(); },   // para sa tests
  };
  hud();
  if (!online) setTimeout(begin, 600);
  return api;
}
