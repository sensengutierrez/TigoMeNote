/* TigoMeNote · tigo/race-game.js — "Tigo Racing": 3 lap sa paikot-ikot na track laban sa 3 Tigo (computer)
   import { startRace } from "./race-game.js"
   const g = startRace(sc, { track, voice, onHud({ lap, laps, place, coins, turbo }), onEnd({ score, place, coins }) })
   g.go() · g.stop() · g.brake(true|false) · g.turbo() · g.jump()
   Track: "easy" (bilog, mabagal ang kalaban) · "classic" · "twisty" (paliko-liko, mabilis ang kalaban) · "grand" (mahabang daan, 2 ikot) — TRACKS sa ibaba.
   Kontrol: kusang umaandar; kaliwa/kanan (A D / ← → / joystick / swipe) = liko (may tulong para manatili sa daan),
   S / ↓ o ang Brake pedal = preno, Turbo pedal = bilis (may hintay bago ulit), Space = talon.
   ⚡ boost pad = bilis sandali. Coins sa daan. Coins = nakuha + bonus ayon sa puwesto (1st 15, 2nd 10, 3rd 6, 4th 3). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { createTigo } from "./pet-model.js";

const LAPS0 = 3, MAX = 7.2, TURBO_WAIT = 6;
export const TRACKS = {
  easy: { theme: "meadow", name: "Easy loop", icon: "🟢", text: "Wide, round track. Slower rivals.", w: 3.0, rival: 0.86,
    pts: [[0, -8], [6.5, -6], [8.5, 0], [6.5, 6], [0, 8], [-6.5, 6], [-8.5, 0], [-6.5, -6]] },
  classic: { theme: "forest", name: "Classic", icon: "🟡", text: "Curves and a hairpin.", w: 2.3, rival: 1,
    pts: [[0, -7.5], [6, -6.5], [8.5, -1.5], [5, 2.5], [7, 7], [1, 8.5], [-5, 6.5], [-4.5, 1.5], [-8.5, -2], [-6, -7]] },
  twisty: { theme: "desert", name: "Twisty hills", icon: "🔴", text: "Zig-zags and tight turns. Fast rivals.", w: 2.2, rival: 1.08,
    pts: [[0, -9], [5, -8], [9, -5], [6, -2], [9.5, 2], [7, 7], [2.5, 5], [0, 9.5], [-4, 7], [-8, 8], [-9.5, 3], [-5, 1], [-9, -3], [-7, -8]] },
  // Mahabang track: tuwid na mahaba, malalaking kurba, 2 ikot lang, mas maraming coins at boost
  grand: { theme: "snow", name: "Grand tour", icon: "🏁", text: "A long road with big straights and sweeping bends. 2 laps.", w: 3.2, rival: 1, laps: 2, ground: 40, k: 3, seconds: 260, boosts: [0.06, 0.2, 0.34, 0.5, 0.63, 0.78, 0.9],
    pts: [[0, -26], [14, -26], [26, -22], [30, -12], [24, -3], [12, -2], [8, 6], [16, 14], [28, 16], [30, 25], [20, 30], [6, 27], [-4, 18], [-14, 24], [-26, 28], [-31, 18], [-24, 8], [-12, 6], [-8, -4], [-18, -10], [-30, -12], [-30, -22], [-18, -27]] },
};
// Itsura ng bawat mapa: lupa, langit, kalsada, at mga palamuti sa gilid
const THEMES = {
  meadow: { ground: 0x7cc576, sky: 0xaee3ff, road: [0x5b5f6b, 0x565a66], prop: "round" },
  forest: { ground: 0x5fae62, sky: 0x9fd3f2, road: [0x4e5360, 0x494e5a], prop: "pine" },
  desert: { ground: 0xe9c88a, sky: 0xffd9a8, road: [0x7a6a5c, 0x746456], prop: "cactus" },
  snow: { ground: 0xf3f7fc, sky: 0xd5e8ff, road: [0x6b7686, 0x657080], prop: "snowpine" },
};
// Mga kahon na ❓ sa daan: kusang gagamitin ang laman pagkakuha
export const ITEMS = [["rocket", "🚀", "Rocket"], ["shield", "🛡️", "Shield"], ["magnet", "🧲", "Magnet"], ["turbo", "🔥", "Turbo ready"]];
const ORD = ["1st", "2nd", "3rd", "4th"], BONUS = [15, 10, 6, 3];

export function startRace(sc, { track = "easy", voice, onHud, onEnd, seconds = 150 } = {}) {
  const TR = TRACKS[track] || TRACKS.easy, SC = TR.k ? 1 : 1.4, W = TR.w * 1.5, PTS = TR.pts.map(([x, z]) => [x * SC, z * SC]), LAPS = TR.laps || LAPS0, K = TR.k || 1;   // 0.11.45: mas malapad na daan (×1.5) at mas maluwag na track
  seconds = TR.seconds || 210;
  const TH = THEMES[TR.theme] || THEMES.meadow;
  const oldBg = sc.scene.background, oldFog = sc.scene.fog; sc.scene.background = new THREE.Color(TH.sky); sc.scene.fog = new THREE.Fog(TH.sky, 26, 70);
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const curve = new THREE.CatmullRomCurve3(PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "catmullrom", 0.5);
  const N = 600 * K, P = [], Tn = [];
  for (let i = 0; i < N; i++) { P.push(curve.getPointAt(i / N)); Tn.push(curve.getTangentAt(i / N)); }
  const nrm = (i) => new THREE.Vector3(Tn[i].z, 0, -Tn[i].x); // pakaliwa ng daan
  const at = (t) => { const i = ((Math.round(t * N) % N) + N) % N; return i; };

  // ---------- lupa, daan, gilid ----------
  const ground = new THREE.Mesh(keep(new THREE.CircleGeometry((TR.ground || 30) * (TR.k ? 1 : 1.4) + 6, 64)), keep(new THREE.MeshStandardMaterial({ color: TH.ground, roughness: 1 })));
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
  ribbon(-W / 2, W / 2, 0.01, (i) => ((i / 12) | 0) % 2 ? TH.road[0] : TH.road[1]);
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
  // palamuti sa gilid, ayon sa mapa (round = bilog na puno · pine · cactus · snowpine)
  const trunk = keep(new THREE.MeshStandardMaterial({ color: 0x8d6e4a })), leafM = keep(new THREE.MeshStandardMaterial({ color: TH.prop === "cactus" ? 0x4f9d5b : TH.prop === "snowpine" ? 0x2e7d5b : 0x3fa34d, roughness: 0.8 })), snowM = keep(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
  const tg = keep(new THREE.CylinderGeometry(0.1, 0.13, 0.6, 8)), lg = keep(new THREE.ConeGeometry(0.6, 1.4, 10)), rg = keep(new THREE.SphereGeometry(0.62, 10, 8)), cg0 = keep(new THREE.CapsuleGeometry(0.2, 0.8, 4, 8)), ca = keep(new THREE.CapsuleGeometry(0.1, 0.3, 4, 6)), sg = keep(new THREE.ConeGeometry(0.34, 0.5, 10));
  const spots = [];
  for (let k = 0; k < 26 * K; k++) {
    const i = (k * 23) % N, side = k % 2 ? 1 : -1, n = nrm(i), off = W / 2 + 1.6 + (k % 3) * 0.9;
    const x = P[i].x + n.x * side * off, z = P[i].z + n.z * side * off;
    if (P.some((p, j) => j % 10 === 0 && Math.hypot(p.x - x, p.z - z) < W / 2 + 1)) continue;
    spots.push([x, z]);
  }
  const _o = new THREE.Object3D();
  const many = (geo, mat, y, sc0 = 1) => { const m = new THREE.InstancedMesh(geo, mat, spots.length); spots.forEach(([x, z], i) => { _o.position.set(x, y, z); _o.scale.setScalar(sc0); _o.rotation.set(0, i * 1.7, 0); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); }); m.castShadow = true; m.frustumCulled = false; world.add(m); keep(m); };
  if (TH.prop === "cactus") { many(cg0, leafM, 0.6); const m2 = new THREE.InstancedMesh(ca, leafM, spots.length); spots.forEach(([x, z], i) => { _o.position.set(x + 0.28, 0.75, z); _o.scale.setScalar(1); _o.rotation.set(0, 0, 0); _o.updateMatrix(); m2.setMatrixAt(i, _o.matrix); }); m2.castShadow = true; m2.frustumCulled = false; world.add(m2); keep(m2); }
  else if (TH.prop === "round") { many(tg, trunk, 0.3); many(rg, leafM, 1.0); }
  else { many(tg, trunk, 0.3); many(lg, leafM, 1.2); if (TH.prop === "snowpine") many(sg, snowM, 1.72); }
  // boost pads
  const boostM = keep(new THREE.MeshStandardMaterial({ color: 0x40e0ff, emissive: 0x00b8ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  const arrow = new THREE.Shape(); arrow.moveTo(-0.35, -0.3); arrow.lineTo(0, 0.05); arrow.lineTo(0.35, -0.3); arrow.lineTo(0.35, 0); arrow.lineTo(0, 0.35); arrow.lineTo(-0.35, 0); arrow.closePath();
  const ag = keep(new THREE.ShapeGeometry(arrow));
  const boosts = (TR.boosts || [0.18, 0.47, 0.76]).map((t) => {
    const i = at(t), g = new THREE.Group(); g.position.set(P[i].x, 0.04, P[i].z); g.rotation.y = Math.atan2(Tn[i].x, Tn[i].z);
    // +π/2: ang dulo ng arrow ay nakaturo sa direksyon ng takbo (dati ay pabalik)
    [0, 0.45].forEach((z) => { const m = new THREE.Mesh(ag, boostM); m.rotation.x = Math.PI / 2; m.position.z = z; g.add(m); });
    world.add(g); return { t, i };
  });
  // coins
  const coinM = keep(new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.75, roughness: 0.25, emissive: 0x5a3c00, emissiveIntensity: 0.4 }));
  const cg = keep(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20)); cg.rotateX(Math.PI / 2);
  const coins = [];
  for (let k = 0; k < 24 * K; k++) {
    const t = 0.06 + k * 0.038 / K, i = at(t), n = nrm(i), lane = [-0.26, 0, 0.26][k % 3] * W;
    const m = new THREE.Mesh(cg, coinM); m.position.set(P[i].x + n.x * lane, 0.45, P[i].z + n.z * lane); m.castShadow = true; world.add(m);
    coins.push({ m, back: 0 });
  }

  // ---------- ❓ kahon ng gamit (kusang gagamitin): 🚀 Rocket · 🛡️ Shield · 🧲 Magnet · 🔥 Turbo ready ----------
  const boxG = keep(new RoundedBoxGeometry(0.46, 0.46, 0.46, 2, 0.08)), boxM = keep(new THREE.MeshStandardMaterial({ color: 0xffb020, emissive: 0xff7a00, emissiveIntensity: 0.55, roughness: 0.3, transparent: true, opacity: 0.92 }));
  const qc = document.createElement("canvas"); qc.width = qc.height = 64; const qx = qc.getContext("2d"); qx.fillStyle = "#ffb020"; qx.fillRect(0, 0, 64, 64); qx.fillStyle = "#fff"; qx.font = "bold 50px sans-serif"; qx.textAlign = "center"; qx.textBaseline = "middle"; qx.fillText("?", 32, 35);
  const qM = keep(new THREE.MeshStandardMaterial({ map: keep(new THREE.CanvasTexture(qc)), emissive: 0xff7a00, emissiveIntensity: 0.35, roughness: 0.3 }));
  const boxes = [];
  for (let k = 0; k < 5 * K + 1; k++) {
    const t = 0.12 + k * (0.86 / (5 * K + 1)), i = at(t), n = nrm(i), lane = [0.3, -0.3, 0][k % 3] * W;
    const m = new THREE.Mesh(boxG, k % 2 ? qM : boxM); m.material = qM; m.position.set(P[i].x + n.x * lane, 0.55, P[i].z + n.z * lane); m.castShadow = true; world.add(m);
    boxes.push({ m, back: 0 });
  }
  function useItem() {
    const it = ITEMS[(Math.random() * ITEMS.length) | 0];
    if (it[0] === "rocket") { st.rocket = 2.6; st.boost = 2.6; } else if (it[0] === "shield") st.shield = 7; else if (it[0] === "magnet") st.magnet = 9; else st.turboWait = 0;
    voice && voice.sfx("power"); onHud && onHud({ toast: it[1] + " " + it[2] });
  }

  // ---------- karts ----------
  // Buggy: malalaking gulong, roll cage, bumper, upuan (0.11.45; dati maliit na kart)
  function kart(color) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const m = keep(new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 })), dark = keep(new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 })), steel = keep(new THREE.MeshStandardMaterial({ color: 0xc9ced8, roughness: 0.3, metalness: 0.7 }));
    const b = new THREE.Mesh(keep(new RoundedBoxGeometry(0.86, 0.26, 1.36, 3, 0.1)), m); b.position.y = 0.36; b.castShadow = true; body.add(b);
    const nose = new THREE.Mesh(keep(new RoundedBoxGeometry(0.62, 0.2, 0.42, 3, 0.08)), m); nose.position.set(0, 0.34, 0.74); body.add(nose);
    const bump = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8)), steel); bump.rotation.z = Math.PI / 2; bump.position.set(0, 0.3, 1.0); body.add(bump);
    const seat = new THREE.Mesh(keep(new RoundedBoxGeometry(0.5, 0.2, 0.1, 2, 0.04)), dark); seat.position.set(0, 0.56, -0.4); body.add(seat);   // mababang sandalan para kita ang sakay
    // roll cage: dalawang arko + pahalang na tubo
    const hoop = keep(new THREE.TorusGeometry(0.4, 0.03, 8, 16, Math.PI));
    [-0.42, 0.2].forEach((z) => { const h = new THREE.Mesh(hoop, steel); h.position.set(0, 0.5, z); h.castShadow = true; body.add(h); });
    [-0.28, 0.28].forEach((x) => { const t = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 6)), steel); t.rotation.x = Math.PI / 2; t.position.set(x, 0.79, -0.11); body.add(t); });
    [0xfff1a8, 0xfff1a8].forEach((c, i) => { const l = new THREE.Mesh(keep(new THREE.SphereGeometry(0.06, 8, 6)), keep(new THREE.MeshStandardMaterial({ color: c, emissive: 0xffd24d, emissiveIntensity: 0.8 }))); l.position.set(i ? 0.22 : -0.22, 0.4, 0.95); body.add(l); });
    const wg = keep(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 14)); wg.rotateZ(Math.PI / 2);
    const hub = keep(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8)); hub.rotateZ(Math.PI / 2);
    const wheels = [[-0.54, 0.5], [0.54, 0.5], [-0.54, -0.48], [0.54, -0.48]].map(([x, z]) => { const w = new THREE.Mesh(wg, dark); w.position.set(x, 0.25, z); w.castShadow = true; w.add(new THREE.Mesh(hub, steel)); body.add(w); return w; });
    world.add(g);
    return { g, body, wheels };
  }
  // Nakaupo ang sakay (Kid: pasulong ang binti; note: nasa upuan)
  function seatIn(t, k) { k.body.add(t.group); const kid = t.kind() !== "tigo"; t.sitPose(true); t.group.position.set(0, kid ? 0.28 : 0.4, kid ? -0.2 : -0.12); t.group.scale.setScalar(0.36); t.group.rotation.set(0, 0, 0); t.face(0); }
  const me = kart(0xff5a36);
  sc.beginGame({ tick, cam });
  const T = sc.main; seatIn(T, me);
  const rivals = [["amber", 0x2f6fde, "cap"], ["sky", 0x7b5cff, "crown"], ["lilac", 0x2bb3a3, "bow"]].map(([col, kc, hat], k) => {
    const kk = kart(kc), t = createTigo({ color: col, gear: hat }); seatIn(t, kk);
    return { ...kk, tigo: t, t: [0.997, 0.975, 0.975][k], lane: [-0.22, 0.22, -0.22][k] * W, lap: -1, base: (6.3 + k * 0.25) * TR.rival, ph: Math.random() * 6, hop: 0 };
  });
  // si Tigo: nasa likod ng start line
  const i0 = at(0.997);
  const st = { x: P[i0].x + nrm(i0).x * W * 0.22, z: P[i0].z + nrm(i0).z * W * 0.22, h: Math.atan2(Tn[i0].x, Tn[i0].z), v: 0, t: 0.997, lap: -1, half: true, boost: 0, hop: 0, coins: 0, brake: false, turboWait: 0, shield: 0, magnet: 0, rocket: 0 };
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
  function hud() { onHud && onHud({ lap: Math.max(1, Math.min(LAPS, st.lap + 1)), laps: LAPS, place: ORD[place() - 1], coins: st.coins, time: Math.max(0, Math.ceil(left)), turbo: 1 - st.turboWait / TURBO_WAIT, fx: (st.shield > 0 ? "🛡️" : "") + (st.magnet > 0 ? "🧲" : "") + (st.rocket > 0 ? "🚀" : "") }); }

  function tick(dt, t) {
    if (done) return;
    rivals.forEach((r) => r.tigo.update(dt, t));
    if (!running) { posKart(me, st.x, st.z, st.h, 0, dt); rivals.forEach((r) => posRival(r, 0, dt)); hud(); return; }
    left -= dt;
    const inp = sc.input ? sc.input() : { x: 0, z: 0 };
    const nr = nearest(st.x, st.z, guessI); guessI = nr.i;
    const off = nr.d > W / 2 + 0.1 && st.shield <= 0;   // 🛡️: hindi bumabagal sa damo
    const braking = st.brake || inp.z > 0.4;
    const top = (off ? 3.6 : MAX) * (st.rocket > 0 ? 1.8 : st.boost > 0 ? 1.45 : 1) * (braking ? 0.3 : 1);
    ['shield', 'magnet', 'rocket'].forEach((k) => { if (st[k] > 0) st[k] -= dt; });
    st.v += (top - st.v) * Math.min(1, dt * (st.v < top ? 1.6 : braking ? 5 : 3));
    st.h -= inp.x * dt * 2.6 * Math.min(1, 0.45 + st.v / MAX);
    // tulong sa pagliko: kapag hindi ka lumiliko, unti-unting sumusunod sa daan (mas madali sa phone)
    if (Math.abs(inp.x) < 0.15) {
      const want = Math.atan2(Tn[nr.i].x, Tn[nr.i].z); let dh = want - st.h;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      const n = nrm(nr.i), side = (st.x - P[nr.i].x) * n.x + (st.z - P[nr.i].z) * n.z; // + = nasa kaliwa ng gitna
      st.h += (dh - side * 0.12) * Math.min(1, dt * (off ? 2.6 : 1.5));
    }
    if (st.turboWait > 0) st.turboWait = Math.max(0, st.turboWait - dt);
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
      if (Math.hypot(c.m.position.x - st.x, c.m.position.z - st.z) < (st.magnet > 0 ? 3.2 : 0.7) && st.hop < 0.6) { c.m.visible = false; c.back = 8; st.coins++; voice && voice.sfx("coin"); sc.effect("sparkle", { x: c.m.position.x, y: 0.5, z: c.m.position.z }); }
    });
    // ❓ kahon
    boxes.forEach((b) => {
      if (b.back > 0) { b.back -= dt; if (b.back <= 0) b.m.visible = true; return; }
      b.m.rotation.y += dt * 1.6; b.m.position.y = 0.55 + Math.sin(t * 3 + b.m.position.x) * 0.06;
      if (Math.hypot(b.m.position.x - st.x, b.m.position.z - st.z) < 0.75) { b.m.visible = false; b.back = 10; sc.effect("sparkle", { x: b.m.position.x, y: 0.6, z: b.m.position.z }); useItem(); }
    });
    // banggaan sa ibang kart
    rivals.forEach((r) => {
      const dx = r.g.position.x - st.x, dz = r.g.position.z - st.z, d = Math.hypot(dx, dz);
      if (d < 1.05 && d > 0.001) { st.x -= (dx / d) * (1.05 - d) * 0.6; st.z -= (dz / d) * (1.05 - d) * 0.6; if (st.shield <= 0) st.v *= 0.92; }
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
    cp.set(st.x - fx * 4.8 * far, 2.7 * far, st.z - fz * 4.8 * far);
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
    T.sitPose(false); sc.scene.background = oldBg; sc.scene.fog = oldFog; sc.scene.add(T.group); sc.scene.remove(world); sc.endGame();
    rivals.forEach((r) => r.tigo.dispose()); own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; },
    jump() { if (st.hop <= 0) { st.hop = 0.7; voice && voice.sfx("jump"); } },
    brake(on) { st.brake = !!on; },
    turbo() { if (!running || done || st.turboWait > 0) return false; st.boost = 1.8; st.turboWait = TURBO_WAIT; voice && voice.sfx("power"); return true; },
    stop() { finish(); },
  };
}
