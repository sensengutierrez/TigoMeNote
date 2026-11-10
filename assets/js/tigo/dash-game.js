/* TigoMeNote · tigo/dash-game.js — "Sky Dash": karera ni Tigo sa track sa langit (3 lane)
   import { startDash } from "./dash-game.js"
   const g = startDash(sc, { voice, seed, net, me:{name,color}, onHud(h), onEnd(res) })   g.go() · g.stop() · g.jump()
   Kontrol: kaliwa/kanan = palit ng lane (stick, swipe, A/D, ←/→) · Jump (button o Space) para sa harang.
     🪙 coins · ⚡ boost pad · 🟥 kahon = iwasan · 🚧 harang = talunin · Slipstream: sumunod sa likod ng kalaban sa parehong lane = mas mabilis.
   Solo: 3 bot. Multi (2–4, net galing sa room-lobby.js): bawat isa ay nagpapadala ng sariling puwesto (event "me"), at "fin" sa dulo.
   Pare-pareho ang track ng lahat (seed). Resulta: { score: coins + bonus, win, place, ms, coins }. Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { createTigo } from "./pet-model.js";

const LEN = 420, LANE = 0.9, BASE = 7.5, BOOST = 11, START = 14;
function rng(seed) { let s = (seed >>> 0) || 7; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const BOT_COLORS = ["mint", "lilac", "amber", "sky", "pink", "lime"];

// track: listahan ng bagay ayon sa layo (d) — pare-pareho sa lahat dahil iisang seed
export function buildCourse(seed) {
  const R = rng(seed), items = [];
  for (let d = START; d < LEN - 12; d += 7 + R() * 4) {
    const k = R(), lanes = [0, 1, 2].sort(() => R() - 0.5);
    if (k < 0.32) items.push({ t: "crate", d, lane: lanes[0] }), R() < 0.45 && items.push({ t: "crate", d, lane: lanes[1] });
    else if (k < 0.58) items.push({ t: "bar", d, lane: lanes[0] }), items.push({ t: "bar", d, lane: lanes[1] }), R() < 0.35 && items.push({ t: "bar", d, lane: lanes[2] });
    else if (k < 0.72) items.push({ t: "boost", d, lane: lanes[0] });
    // coins sa isang lane na walang harang
    const free = [0, 1, 2].filter((l) => !items.some((it) => it.d === d && it.lane === l && it.t !== "boost"));
    const cl = free[(R() * free.length) | 0];
    if (cl !== undefined) for (let i = 1; i <= 5; i++) items.push({ t: "coin", d: d + 1.2 + i * 0.9, lane: cl });
  }
  return items;
}

export function startDash(sc, { voice, seed = 1, net = null, me: meInfo = {}, onHud, onEnd } = {}) {
  const multi = !!net;
  const course = buildCourse(seed);
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const M = (o) => keep(new THREE.MeshStandardMaterial(o));
  const oldFog = sc.scene.fog; sc.scene.fog = new THREE.Fog(0xbfe6ff, 18, 46);
  const fill = new THREE.HemisphereLight(0xffffff, 0x88aacc, 0.9); world.add(fill);

  // ---------- track ----------
  const deck = new THREE.Mesh(keep(new THREE.BoxGeometry(LANE * 3 + 0.5, 0.3, LEN + 30)), M({ color: 0x2bb3c0, roughness: 0.55 }));
  deck.position.set(0, -0.15, -LEN / 2 + 5); deck.receiveShadow = true; world.add(deck);
  const stripeM = M({ color: 0xe9fbff, emissive: 0x9fe8ff, emissiveIntensity: 0.3 });
  [-0.5, 0.5].forEach((k) => { const s = new THREE.Mesh(keep(new THREE.BoxGeometry(0.04, 0.02, LEN + 30)), stripeM); s.position.set(k * LANE, 0.01, -LEN / 2 + 5); world.add(s); });
  const railM = M({ color: 0x5b6b7c, roughness: 0.6, metalness: 0.3 });
  [-1, 1].forEach((k) => { const r = new THREE.Mesh(keep(new THREE.BoxGeometry(0.12, 0.3, LEN + 30)), railM); r.position.set(k * (LANE * 1.5 + 0.3), 0.15, -LEN / 2 + 5); world.add(r); });
  // mga pundasyon at lumulutang na isla (palamuti)
  const R2 = rng(seed + 99), stoneM = M({ color: 0xc9c3b5, roughness: 0.9 }), grassM = M({ color: 0x6cc16a, roughness: 0.8 });
  for (let d = 0; d < LEN + 20; d += 14) {
    const p = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.35, 0.5, 6, 8)), stoneM); p.position.set(0, -3.3, -d); world.add(p);
    for (const side of [-1, 1]) {
      if (R2() < 0.5) continue;
      const w = 1.5 + R2() * 2.5, isl = new THREE.Group();
      const rock = new THREE.Mesh(keep(new THREE.ConeGeometry(w * 0.6, w * 1.2, 7)), stoneM); rock.rotation.x = Math.PI; rock.position.y = -w * 0.6; isl.add(rock);
      const top = new THREE.Mesh(keep(new THREE.CylinderGeometry(w * 0.62, w * 0.6, 0.25, 7)), grassM); isl.add(top);
      isl.position.set(side * (5 + R2() * 6), -1 + R2() * 4, -d - R2() * 10); world.add(isl);
    }
  }
  // finish
  const arch = new THREE.Group(); arch.position.z = -LEN;
  const archM = M({ color: 0xffffff, emissive: 0xffd34d, emissiveIntensity: 0.5 });
  [-1, 1].forEach((k) => { const post = new THREE.Mesh(keep(new THREE.BoxGeometry(0.2, 2, 0.2)), archM); post.position.set(k * (LANE * 1.5 + 0.3), 1, 0); arch.add(post); });
  const beam = new THREE.Mesh(keep(new THREE.BoxGeometry(LANE * 3 + 1, 0.35, 0.2)), M({ color: 0x111111 })); beam.position.y = 2; arch.add(beam);
  const chk = new THREE.Mesh(keep(new THREE.PlaneGeometry(LANE * 3 + 0.4, 0.3)), M({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 })); chk.rotation.x = -Math.PI / 2; chk.position.y = 0.02; arch.add(chk);
  world.add(arch);

  // ---------- mga bagay ----------
  const crateG = keep(new RoundedBoxGeometry(0.7, 0.62, 0.7, 2, 0.06)), crateM = M({ color: 0xe0563e, roughness: 0.5 });
  const barG = keep(new THREE.BoxGeometry(0.78, 0.12, 0.12)), barM = M({ color: 0xffd34d, emissive: 0x6b4d00, emissiveIntensity: 0.3 }), legG = keep(new THREE.BoxGeometry(0.06, 0.24, 0.06)), legM = M({ color: 0x333333 });
  const padG = keep(new THREE.PlaneGeometry(0.7, 1.1)), padM = M({ color: 0x7af7ff, emissive: 0x29d9ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.85 });
  const coins = course.filter((x) => x.t === "coin");
  const cm = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 18)), M({ color: 0xffcc33, emissive: 0xffa000, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }), coins.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v1 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0, 0, 0);
  const coinRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  coins.forEach((c, i) => { c.i = i; c.got = false; m4.compose(v1.set((c.lane - 1) * LANE, 0.42, -c.d), coinRot, one); cm.setMatrixAt(i, m4); });
  world.add(cm); own.push(cm);
  course.forEach((it) => {
    const x = (it.lane - 1) * LANE;
    if (it.t === "crate") { const m = new THREE.Mesh(crateG, crateM); m.position.set(x, 0.31, -it.d); m.castShadow = true; world.add(m); }
    if (it.t === "bar") { const g = new THREE.Group(); g.position.set(x, 0, -it.d); const b = new THREE.Mesh(barG, barM); b.position.y = 0.24; g.add(b); [-0.34, 0.34].forEach((k) => { const l = new THREE.Mesh(legG, legM); l.position.set(k, 0.12, 0); g.add(l); }); world.add(g); }
    if (it.t === "boost") { const p = new THREE.Mesh(padG, padM); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.012, -it.d); world.add(p); }
  });
  const solids = course.filter((x) => x.t === "crate" || x.t === "bar" || x.t === "boost");

  // ---------- mga runner ----------
  sc.beginGame({ tick, cam });
  const TS = 0.32;
  const T = sc.main; T.group.scale.setScalar(TS);
  const trailG = keep(new THREE.PlaneGeometry(0.55, 6));
  function runner(t, opts) {
    const tr = new THREE.Mesh(trailG, keep(new THREE.MeshBasicMaterial({ color: 0xff3048, transparent: true, opacity: 0.12, depthWrite: false })));
    tr.rotation.x = -Math.PI / 2; tr.position.y = 0.03; world.add(tr);
    return Object.assign({ t, tr, d: 0, lane: 1, x: 0, y: 0, vy: 0, speed: 0, stumble: 0, boost: 0, slip: 0, coins: 0, done: false, finT: 0, hit: new Set() }, opts);
  }
  const startLanes = [1, 0, 2, 1];
  const meR = runner(T, { name: meInfo.name || "You", mine: true });
  const runners = [meR];
  if (!multi) {
    const R3 = rng(seed + 7);
    for (let i = 0; i < 3; i++) {
      const t = createTigo({ color: BOT_COLORS[i] }); t.group.scale.setScalar(TS); world.add(t.group);
      runners.push(runner(t, { name: ["Mochi", "Pip", "Nori"][i], bot: true, skill: 0.75 + R3() * 0.2, pace: 0.93 + R3() * 0.07, look: 0 }));
    }
  } else {
    (net.roster || []).filter((x) => x.p !== net.me).forEach((x) => {
      const t = createTigo({ color: x.color || "sky" }); t.group.scale.setScalar(TS); world.add(t.group);
      runners.push(runner(t, { name: x.name, pid: x.p, remote: true, last: 0, gone: false }));
    });
  }
  runners.forEach((r, i) => { r.lane = startLanes[i % 4]; r.x = (r.lane - 1) * LANE; r.d = -i * 0.35; });
  const others = () => runners.filter((r) => r !== meR);

  let running = false, done = false, t0 = 0, sendT = 0, lastLaneIn = 0, endTimer = null;
  function place(r) { return runners.filter((o) => o !== r && (o.done ? (!r.done || o.finT < r.finT) : (!r.done && o.d > r.d))).length + 1; }
  const ord = (n) => n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");
  function hud() {
    onHud && onHud({ pct: Math.max(0, Math.min(100, Math.round((meR.d / LEN) * 100))), place: ord(place(meR)), of: runners.length, coins: meR.coins, boost: meR.boost > 0, slip: meR.slip > 0.6 });
  }

  // ---------- galaw ----------
  function lane(r, dir) { const n = Math.max(0, Math.min(2, r.lane + dir)); if (n !== r.lane) { r.lane = n; if (r.mine) voice && voice.sfx("pop"); } }
  function jump(r) { if (r.y <= 0.001 && r.stumble <= 0) { r.vy = 4.3; if (r.mine) voice && voice.sfx("jump"); } }
  function step(r, dt) {
    if (r.done) { r.speed = Math.max(0, r.speed - dt * 8); r.d += r.speed * dt * 0.3; return; }
    // slipstream: may nauuna sa parehong lane na 1.2–7 ang layo
    const ahead = runners.some((o) => o !== r && Math.abs(o.x - r.x) < LANE * 0.5 && o.d - r.d > 1.2 && o.d - r.d < 7);
    r.slip = ahead ? r.slip + dt : Math.max(0, r.slip - dt * 2);
    let target = (r.bot ? BASE * r.pace : BASE) + (r.slip > 0.6 ? 1.6 : 0);
    if (r.boost > 0) { r.boost -= dt; target = BOOST; }
    if (r.stumble > 0) { r.stumble -= dt; target = 2.5; }
    r.speed += (target - r.speed) * Math.min(1, dt * (r.speed < target ? 1.6 : 4));
    r.d += r.speed * dt;
    r.vy -= 12 * dt; r.y = Math.max(0, r.y + r.vy * dt); if (r.y === 0) r.vy = Math.max(0, r.vy);
    r.x += ((r.lane - 1) * LANE - r.x) * Math.min(1, dt * 12);
    // banggaan
    for (const it of solids) {
      if (Math.abs(it.d - r.d) > 0.4 || it.lane !== r.lane || r.hit.has(it)) continue;
      if (it.t === "boost") { if (r.y < 0.1) { r.hit.add(it); r.boost = 1.5; if (r.mine) { voice && voice.sfx("power"); } } continue; }
      const h = it.t === "crate" ? 0.62 : 0.3;
      if (r.y < h) { r.hit.add(it); r.stumble = 0.8; r.speed = Math.min(r.speed, 3); if (r.mine) { voice && voice.sfx("hit"); r.t.spin(); } }
    }
    if (r.mine) for (const c of coins) {
      if (c.got || c.lane !== r.lane || Math.abs(c.d - r.d) > 0.45 || r.y > 0.9) continue;
      c.got = true; r.coins++; m4.compose(v1.set(0, -9, 0), q, zero); cm.setMatrixAt(c.i, m4); cm.instanceMatrix.needsUpdate = true; voice && voice.sfx("coin");
    }
    if (r.d >= LEN) { r.done = true; r.finT = performance.now() - t0; if (r.mine) finishMe(); }
  }
  function botBrain(r, dt) {
    r.look -= dt; if (r.look > 0) return; r.look = 0.12;
    const near = solids.filter((it) => it.d - r.d > 0 && it.d - r.d < 4.5 && it.t !== "boost");
    const blocked = (l) => near.some((it) => it.lane === l && it.t === "crate" && it.d - r.d < 3.5);
    if (blocked(r.lane) && Math.random() < r.skill) { const opts = [r.lane - 1, r.lane + 1].filter((l) => l >= 0 && l <= 2 && !blocked(l)); if (opts.length) lane(r, opts[(Math.random() * opts.length) | 0] - r.lane); }
    const bar = near.find((it) => it.lane === r.lane && it.t === "bar" && it.d - r.d < 1.3);
    if (bar && Math.random() < r.skill + 0.1) jump(r);
    // minsan susunod sa likod ng iba (slipstream)
    if (Math.random() < 0.03) { const lead = runners.find((o) => o !== r && o.d > r.d && o.d - r.d < 6); if (lead && !blocked(lead.lane)) lane(r, Math.sign(lead.lane - r.lane)); }
  }
  function input() {
    const i = sc.input ? sc.input() : { x: 0, z: 0 };
    const s = i.x > 0.5 ? 1 : i.x < -0.5 ? -1 : 0;
    if (s && s !== lastLaneIn) lane(meR, s);
    lastLaneIn = s;
    if (i.z < -0.75 && Math.abs(i.x) < 0.4) jump(meR);   // swipe pataas = talon
  }

  // ---------- network ----------
  if (net) net.on((ev, d, from) => {
    const r = runners.find((x) => x.pid === from); if (!r) return;
    if (ev === "me") { r.d = Math.max(r.d, d.d); r.lane = d.l; r.y = d.y; r.speed = d.s; r.last = performance.now(); }
    if (ev === "fin" && !r.done) { r.done = true; r.finT = d.t; r.d = LEN; checkAllDone(); }
    if (ev === "bye") { r.gone = true; r.done = true; r.finT = 1e9; r.t.group.visible = false; r.tr.visible = false; checkAllDone(); }
  });

  // ---------- bawat frame ----------
  function tick(dt, t) {
    if (done) return;
    if (!running) { runners.forEach((r) => { r.t.walk(0); paint(r, t, 0); }); hud(); return; }
    input();
    for (const r of runners) {
      if (r.remote) { if (!r.done) r.d += r.speed * dt * 0.98; r.x += ((r.lane - 1) * LANE - r.x) * Math.min(1, dt * 12); }
      else { if (r.bot) botBrain(r, dt); step(r, dt); }
      paint(r, t, dt);
    }
    if (net) { sendT -= dt; if (sendT <= 0) { sendT = 0.1; net.send("me", { d: +meR.d.toFixed(2), l: meR.lane, y: +meR.y.toFixed(2), s: +meR.speed.toFixed(2) }); } }
    hud();
  }
  function paint(r, t, dt) {
    r.t.group.position.set(r.x, r.y, -r.d); r.t.group.rotation.y = Math.PI;
    r.t.walk(r.done ? 0.2 : Math.min(1, r.speed / 6), Math.PI); if (!r.mine) r.t.update(dt, t);
    r.tr.position.set(r.x, 0.03, -r.d + 3.2); r.tr.material.opacity = r.slip > 0.6 && r === meR ? 0.05 : runners.some((o) => o !== r && o.mine && Math.abs(o.x - r.x) < LANE * 0.5 && r.d - o.d > 1.2 && r.d - o.d < 7) ? 0.42 : 0.1;
  }
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function cam(camera, dt) {
    const tall = camera.aspect < 0.8;
    camPos.set(meR.x * 0.6, tall ? 2.3 : 1.7, -meR.d + (tall ? 4.4 : 3.3));
    camera.position.lerp(camPos, Math.min(1, dt * 6));
    look.set(meR.x * 0.4, 0.45, -meR.d - 4); camera.lookAt(look);
    const fov = 36 + (meR.boost > 0 ? 8 : meR.slip > 0.6 ? 4 : 0);
    if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  }
  function finishMe() {
    voice && voice.sfx(place(meR) === 1 ? "win" : "level"); sc.effect("stars", { x: meR.x, y: 0.6, z: -meR.d });
    if (net) net.send("fin", { t: Math.round(meR.finT) });
    // hintayin ang iba (bots: mabilis tapusin; tao: hanggang 15 s)
    if (!net) others().forEach((b) => { if (!b.done) { b.done = true; b.finT = meR.finT + ((LEN - b.d) / (BASE * b.pace)) * 1000 + 300; } });
    endTimer = setTimeout(endRace, net ? 15000 : 1800);
    checkAllDone();
  }
  function checkAllDone() { if (meR.done && runners.every((r) => r.done)) { clearTimeout(endTimer); endTimer = setTimeout(endRace, 1200); } }
  function endRace() {
    if (done) return; done = true; running = false;
    const pl = place(meR), ms = Math.round(meR.finT || performance.now() - t0), fin = meR.done;
    const standings = runners.slice().sort((a, b) => (a.done ? a.finT : 1e12 - a.d) - (b.done ? b.finT : 1e12 - b.d)).map((r) => ({ name: r.mine ? (meInfo.name || "You") : r.name, me: !!r.mine, t: r.done && r.finT < 1e8 ? r.finT : null }));
    const res = { score: meR.coins + (fin ? [12, 8, 5, 3][pl - 1] || 2 : 0), win: fin && pl === 1, place: pl, ms, coins: meR.coins, finished: fin, standings,
      label: fin ? (pl === 1 ? "🏆 1st! " : ord(pl) + " · ") + Math.floor(ms / 60000) + ":" + String(Math.floor(ms / 1000) % 60).padStart(2, "0") : "🏁 " + Math.round(meR.d / LEN * 100) + "%" };
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, 600);
  }
  function cleanup() {
    sc.scene.fog = oldFog;
    others().forEach((r) => r.t.dispose && r.t.dispose());
    sc.scene.remove(world); sc.endGame();
    own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; t0 = performance.now(); },
    stop() { if (net) net.send("bye", {}); meR.done = false; endRace(); },
    jump() { if (running) jump(meR); },
    _s: { me: meR, runners, course, LEN },   // para sa tests
  };
}
