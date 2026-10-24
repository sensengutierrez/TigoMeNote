/* TigoMeNote · tigo/race-game.js — "Tigo Racing": 3 lap sa paikot-ikot na track laban sa 3 Tigo (computer)
   import { startRace } from "./race-game.js"
   const g = startRace(sc, { voice, onHud({ lap, laps, place, coins }), onEnd({ score, place, coins }) })   g.go() · g.stop()
   Kontrol: kusang umaandar; kaliwa/kanan (A D / ← → / joystick / swipe) = liko, S / ↓ = preno, Space = talon.
   ⚡ boost pad = bilis sandali. Coins sa daan. Coins = nakuha + bonus ayon sa puwesto (1st 15, 2nd 10, 3rd 6, 4th 3). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { createTigo } from "./pet-model.js";

const LAPS = 3, W = 2.3, MAX = 7.2;
const PTS = [[0, -7.5], [6, -6.5], [8.5, -1.5], [5, 2.5], [7, 7], [1, 8.5], [-5, 6.5], [-4.5, 1.5], [-8.5, -2], [-6, -7]];
const ORD = ["1st", "2nd", "3rd", "4th"], BONUS = [15, 10, 6, 3];

export function startRace(sc, { voice, onHud, onEnd, seconds = 150 } = {}) {
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const curve = new THREE.CatmullRomCurve3(PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "catmullrom", 0.5);
  const N = 600, P = [], Tn = [];
  for (let i = 0; i < N; i++) { P.push(curve.getPointAt(i / N)); Tn.push(curve.getTangentAt(i / N)); }
  const nrm = (i) => new THREE.Vector3(Tn[i].z, 0, -Tn[i].x); // pakaliwa ng daan
  const at = (t) => { const i = ((Math.round(t * N) % N) + N) % N; return i; };

  // ---------- lupa, daan, gilid ----------
  const ground = new THREE.Mesh(keep(new THREE.CircleGeometry(30, 64)), keep(new THREE.MeshStandardMaterial({ color: 0x7cc576, roughness: 1 })));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; world.add(ground);
  function ribbon(off0, off1, y, colorFn) {
    const pos = [], col = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const k = i % N, n = nrm(k), c = new THREE.Color(colorFn(i));
      [off0, off1].forEach((o) => { pos.push(P[k].x + n.x * o, y, P[k].z + n.z * o); col.push(c.r, c.g, c.b); });
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }))); m.receiveShadow = true; world.add(m); return m;
  }
  ribbon(-W / 2, W / 2, 0.01, (i) => ((i / 12) | 0) % 2 ? 0x5b5f6b : 0x565a66);
  ribbon(W / 2, W / 2 + 0.25, 0.02, (i) => ((i / 6) | 0) % 2 ? 0xffffff : 0xe8264f);
  ribbon(-W / 2 - 0.25, -W / 2, 0.02, (i) => ((i / 6) | 0) % 2 ? 0xffffff : 0xe8264f);
  // start/finish na checkered
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 16; const cx = cv.getContext("2d");
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { cx.fillStyle = (i + j) % 2 ? "#111" : "#fff"; cx.fillRect(i * 4, j * 4, 4, 4); }
  const tex = keep(new THREE.CanvasTexture(cv)); tex.magFilter = THREE.NearestFilter;
  const fin = new THREE.Mesh(keep(new THREE.PlaneGeometry(W, 0.5)), keep(new THREE.MeshStandardMaterial({ map: tex })));
  fin.rotation.x = -Math.PI / 2; fin.rotation.z = -Math.atan2(Tn[0].x, Tn[0].z); fin.position.set(P[0].x, 0.03, P[0].z); world.add(fin);
  // arko sa start
  const archM = keep(new THREE.MeshStandardMaterial({ color: 0xff5a36, roughness: 0.5 }));
  const n0 = nrm(0); [-1, 1].forEach((s) => { const p = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.08, 0.08, 2, 10)), archM); p.position.set(P[0].x + n0.x * s * (W / 2 + 0.4), 1, P[0].z + n0.z * s * (W / 2 + 0.4)); p.castShadow = true; world.add(p); });
  const beam = new THREE.Mesh(keep(new THREE.BoxGeometry(W + 1, 0.3, 0.12)), archM); beam.position.set(P[0].x, 2, P[0].z); beam.rotation.y = Math.atan2(Tn[0].x, Tn[0].z); world.add(beam);
  // puno sa paligid
  const trunk = keep(new THREE.MeshStandardMaterial({ color: 0x8d6e4a })), leafM = keep(new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.8 }));
  const tg = keep(new THREE.CylinderGeometry(0.1, 0.13, 0.6, 8)), lg = keep(new THREE.ConeGeometry(0.6, 1.4, 10));
  for (let k = 0; k < 26; k++) {
    const i = (k * 23) % N, side = k % 2 ? 1 : -1, n = nrm(i), off = W / 2 + 1.6 + (k % 3) * 0.9;
    const x = P[i].x + n.x * side * off, z = P[i].z + n.z * side * off;
    if (P.some((p, j) => j % 10 === 0 && Math.hypot(p.x - x, p.z - z) < W / 2 + 1)) continue;
    const a = new THREE.Mesh(tg, trunk); a.position.set(x, 0.3, z); const b = new THREE.Mesh(lg, leafM); b.position.set(x, 1.2, z); a.castShadow = b.castShadow = true; world.add(a, b);
  }
  // boost pads
  const boostM = keep(new THREE.MeshStandardMaterial({ color: 0x40e0ff, emissive: 0x00b8ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }));
  const arrow = new THREE.Shape(); arrow.moveTo(-0.35, -0.3); arrow.lineTo(0, 0.05); arrow.lineTo(0.35, -0.3); arrow.lineTo(0.35, 0); arrow.lineTo(0, 0.35); arrow.lineTo(-0.35, 0); arrow.closePath();
  const ag = keep(new THREE.ShapeGeometry(arrow));
  const boosts = [0.18, 0.47, 0.76].map((t) => {
    const i = at(t), g = new THREE.Group(); g.position.set(P[i].x, 0.04, P[i].z); g.rotation.y = Math.atan2(Tn[i].x, Tn[i].z);
    [0, 0.45].forEach((z) => { const m = new THREE.Mesh(ag, boostM); m.rotation.x = -Math.PI / 2; m.position.z = z; g.add(m); });
    world.add(g); return { t, i };
  });
  // coins
  const coinM = keep(new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.75, roughness: 0.25, emissive: 0x5a3c00, emissiveIntensity: 0.4 }));
  const cg = keep(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20)); cg.rotateX(Math.PI / 2);
  const coins = [];
  for (let k = 0; k < 24; k++) {
    const t = 0.06 + k * 0.038, i = at(t), n = nrm(i), lane = [-0.6, 0, 0.6][k % 3];
    const m = new THREE.Mesh(cg, coinM); m.position.set(P[i].x + n.x * lane, 0.45, P[i].z + n.z * lane); m.castShadow = true; world.add(m);
    coins.push({ m, back: 0 });
  }

  // ---------- karts ----------
  function kart(color) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const m = keep(new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 })), dark = keep(new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 }));
    const b = new THREE.Mesh(keep(new RoundedBoxGeometry(0.85, 0.28, 1.3, 3, 0.1)), m); b.position.y = 0.26; b.castShadow = true; body.add(b);
    const nose = new THREE.Mesh(keep(new RoundedBoxGeometry(0.6, 0.18, 0.4, 3, 0.08)), m); nose.position.set(0, 0.22, 0.7); body.add(nose);
    const wing = new THREE.Mesh(keep(new THREE.BoxGeometry(0.9, 0.05, 0.22)), dark); wing.position.set(0, 0.55, -0.62); body.add(wing);
    [-0.3, 0.3].forEach((x) => { const s = new THREE.Mesh(keep(new THREE.BoxGeometry(0.04, 0.2, 0.04)), dark); s.position.set(x, 0.45, -0.62); body.add(s); });
    const wg = keep(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 16)); wg.rotateZ(Math.PI / 2);
    const wheels = [[-0.48, 0.45], [0.48, 0.45], [-0.48, -0.45], [0.48, -0.45]].map(([x, z]) => { const w = new THREE.Mesh(wg, dark); w.position.set(x, 0.17, z); w.castShadow = true; body.add(w); return w; });
    world.add(g);
    return { g, body, wheels };
  }
  const me = kart(0xff5a36);
  sc.beginGame({ tick, cam });
  const T = sc.main; me.body.add(T.group); T.group.position.set(0, 0.28, -0.12); T.group.scale.setScalar(0.36); T.group.rotation.set(0, 0, 0); T.face(0);
  const rivals = [["amber", 0x2f6fde, "cap"], ["sky", 0x7b5cff, "crown"], ["lilac", 0x2bb3a3, "bow"]].map(([col, kc, hat], k) => {
    const kk = kart(kc), t = createTigo({ color: col, gear: hat }); kk.body.add(t.group); t.group.position.set(0, 0.28, -0.12); t.group.scale.setScalar(0.36);
    return { ...kk, tigo: t, t: [0.997, 0.975, 0.975][k], lane: [-0.55, 0.55, -0.55][k], lap: -1, base: 6.3 + k * 0.25, ph: Math.random() * 6, hop: 0 };
  });
  // si Tigo: nasa likod ng start line
  const i0 = at(0.997);
  const st = { x: P[i0].x + nrm(i0).x * 0.55, z: P[i0].z + nrm(i0).z * 0.55, h: Math.atan2(Tn[i0].x, Tn[i0].z), v: 0, t: 0.997, lap: -1, half: true, boost: 0, hop: 0, coins: 0 };
  let left = seconds, done = false, running = false, finishPlace = 0;

  function nearest(x, z, guess) {
    let best = guess, bd = 1e9;
    for (let d = -24; d <= 24; d++) { const i = (guess + d + N) % N, dd = (P[i].x - x) ** 2 + (P[i].z - z) ** 2; if (dd < bd) { bd = dd; best = i; } }
    return { i: best, d: Math.sqrt(bd) };
  }
  let guessI = i0;
  const progress = (lap, t) => lap + (t % 1);
  function place() {
    const mine = progress(st.lap, st.t);
    return 1 + rivals.filter((r) => progress(r.lap, r.t) > mine).length;
  }
  function hud() { onHud && onHud({ lap: Math.max(1, Math.min(LAPS, st.lap + 1)), laps: LAPS, place: ORD[place() - 1], coins: st.coins, time: Math.max(0, Math.ceil(left)) }); }

  function tick(dt, t) {
    if (done) return;
    rivals.forEach((r) => r.tigo.update(dt, t));
    if (!running) { posKart(me, st.x, st.z, st.h, 0, dt); rivals.forEach((r) => posRival(r, 0, dt)); hud(); return; }
    left -= dt;
    const inp = sc.input ? sc.input() : { x: 0, z: 0 };
    const nr = nearest(st.x, st.z, guessI); guessI = nr.i;
    const off = nr.d > W / 2 + 0.1;
    const top = (off ? 3.6 : MAX) * (st.boost > 0 ? 1.45 : 1) * (inp.z > 0.4 ? 0.4 : 1);
    st.v += (top - st.v) * Math.min(1, dt * (st.v < top ? 1.6 : 3));
    st.h -= inp.x * dt * 2.4 * Math.min(1, 0.35 + st.v / MAX);
    st.x += Math.sin(st.h) * st.v * dt; st.z += Math.cos(st.h) * st.v * dt;
    if (nr.d > W / 2 + 2.2) { const p = P[nr.i]; st.x += (p.x - st.x) * 0.08; st.z += (p.z - st.z) * 0.08; }
    if (st.boost > 0) st.boost -= dt;
    // lap: dumaan sa kalahati, tapos sa start
    const nt = nr.i / N;
    if (nt > 0.45 && nt < 0.55) st.half = true;
    if (st.half && st.t > 0.9 && nt < 0.1) {
      st.lap++; st.half = false;
      if (st.lap >= LAPS) { finishPlace = place(); finish(); return; }
      if (st.lap > 0) voice && voice.sfx("level");
    }
    st.t = nt;
    // boost pad
    boosts.forEach((b) => { const p = P[b.i]; if (Math.hypot(p.x - st.x, p.z - st.z) < 0.8 && st.boost < 1.2) { st.boost = 1.6; voice && voice.sfx("power"); } });
    // coins
    coins.forEach((c) => {
      if (c.back > 0) { c.back -= dt; if (c.back <= 0) c.m.visible = true; return; }
      c.m.rotation.y += dt * 3;
      if (Math.hypot(c.m.position.x - st.x, c.m.position.z - st.z) < 0.6 && st.hop < 0.6) { c.m.visible = false; c.back = 8; st.coins++; voice && voice.sfx("coin"); sc.effect("sparkle", { x: c.m.position.x, y: 0.5, z: c.m.position.z }); }
    });
    // banggaan sa ibang kart
    rivals.forEach((r) => {
      const dx = r.g.position.x - st.x, dz = r.g.position.z - st.z, d = Math.hypot(dx, dz);
      if (d < 0.85 && d > 0.001) { st.x -= (dx / d) * (0.85 - d) * 0.6; st.z -= (dz / d) * (0.85 - d) * 0.6; st.v *= 0.92; }
    });
    posKart(me, st.x, st.z, st.h, st.v, dt, inp.x);
    // computer: sumusunod sa daan, may kaunting "rubber band"
    const mine = progress(st.lap, st.t);
    rivals.forEach((r) => {
      const gap = progress(r.lap, r.t) - mine;
      const sp = (r.base + Math.sin(t * 0.7 + r.ph) * 0.4) * (gap > 0.12 ? 0.9 : gap < -0.12 ? 1.12 : 1);
      const prev = r.t; r.t = (r.t + (sp * dt) / curve.getLength()) % 1;
      if (prev > 0.9 && r.t < 0.1) r.lap++;
      posRival(r, sp, dt);
    });
    if (left <= 0) { finishPlace = place(); finish(); }
    hud();
  }
  function posKart(k, x, z, h, v, dt, steer = 0) {
    k.g.position.set(x, 0, z); k.g.rotation.y = h;
    k.body.rotation.z += ((-steer * 0.12) - k.body.rotation.z) * Math.min(1, dt * 8);
    k.wheels.forEach((w) => { w.rotation.x += v * dt * 5; });
    if (k === me) { if (st.hop > 0) { st.hop -= dt; k.body.position.y = Math.sin((1 - st.hop / 0.7) * Math.PI) * 0.6; } else k.body.position.y = 0; }
  }
  function posRival(r, sp, dt) {
    const i = at(r.t), n = nrm(i), lane = r.lane + Math.sin(r.t * 40 + r.ph) * 0.15;
    posKart(r, P[i].x + n.x * lane, P[i].z + n.z * lane, Math.atan2(Tn[i].x, Tn[i].z), sp, dt);
  }
  const cp = new THREE.Vector3(), lk = new THREE.Vector3();
  function cam(camera, dt) {
    const far = camera.aspect < 0.8 ? 1.5 : 1;
    const fx = Math.sin(st.h), fz = Math.cos(st.h);
    cp.set(st.x - fx * 4.4 * far, 2.5 * far, st.z - fz * 4.4 * far);
    camera.position.lerp(cp, Math.min(1, dt * 5));
    lk.set(st.x + fx * 2, 0.6, st.z + fz * 2); camera.lookAt(lk);
    sc.sun.position.set(st.x + 3.5, 6, st.z + 4); sc.sun.target.position.set(st.x, 0, st.z); sc.sun.target.updateMatrixWorld();
  }
  function finish() {
    if (done) return; done = true;
    const p = finishPlace || place(), win = p === 1;
    voice && voice.sfx(win ? "win" : "level");
    if (p <= 2) T.move("cheer", 2);
    const res = { score: st.coins + BONUS[p - 1], place: p, placeText: ORD[p - 1], coins: st.coins, win };
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, 1600);
  }
  function cleanup() {
    sc.scene.add(T.group); sc.scene.remove(world); sc.endGame();
    rivals.forEach((r) => r.tigo.dispose()); own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; },
    jump() { if (st.hop <= 0) { st.hop = 0.7; voice && voice.sfx("jump"); } },
    stop() { finish(); },
  };
}
