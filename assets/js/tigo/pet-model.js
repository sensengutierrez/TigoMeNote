/* TigoMeNote · tigo/pet-model.js — si "Tigo" sa 3D (three.js): isang note na may mukha, gaya ng stickers
   import { createTigo, COLORS } from "./pet-model.js"
   const t = createTigo({ color: "coral", gear: "cap", name })
     t.group                  → idagdag sa scene
     t.update(dt, time)       → tawagin bawat frame (hinga, kurap, galaw)
     t.setMood("happy"|"ok"|"sad"|"sleepy"|"sick")   t.sleep(true|false)
     t.jump() · t.eat() · t.spin() · t.wiggle() · t.lookAt(x, y)  (x,y = -1..1)
     t.setColor(id) · t.setGear(id) · t.wear(slot, id) · t.setGlow(on) · t.dispose()
     t.move("dance"|"budots"|"robot"|"highfive"|"cheer"|"bow", sec) → sayaw/galaw (solo o kasama ang kaibigan)
     t.walk(speed 0..1, heading rad)  → lakad (gumagalaw ang paa at kamay); heading = saan nakaharap
   Mga isusuot (wear): outfit.js. Ang hat na sprout/bow/cap/headphones/crown ay nandito (setGear).
   Sariling disenyo (gawa sa code), walang kinopyang character. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { buildWear } from "./outfit.js";

export const COLORS = {
  coral: ["#ff7a59", "#e85d3c"], amber: ["#ffc04d", "#e9a21f"], mint: ["#3dd6c0", "#14b8a6"], sky: ["#7cc4ff", "#4a9fe8"],
  pink: ["#ff9ec7", "#f06aa7"], lilac: ["#b9a2ff", "#8f74f0"], lime: ["#b8e65c", "#8cc832"], ink: ["#3a3a40", "#1e1e22"]
};
export const GEAR = ["none", "sprout", "bow", "cap", "headphones", "crown"];
const INK = 0x2b1d1a;

export function createTigo(opts = {}) {
  const group = new THREE.Group();          // posisyon sa mundo
  const rig = new THREE.Group();            // tumatalon (kasama ang paa)
  const body = new THREE.Group();           // humihinga
  group.add(rig); rig.add(body);
  const disposables = [];
  const mat = (o) => { const m = new THREE.MeshStandardMaterial(o); disposables.push(m); return m; };
  const geo = (g) => { disposables.push(g); return g; };

  // ---------- katawan (note) ----------
  const skin = new THREE.MeshPhysicalMaterial({ roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.4, sheenRoughness: 0.6 });
  const fold = mat({ roughness: 0.5 });
  disposables.push(skin);
  const torso = new THREE.Mesh(geo(new RoundedBoxGeometry(1.32, 1.5, 0.82, 6, 0.3)), skin);
  torso.position.y = 0.95; torso.castShadow = true; torso.receiveShadow = true;
  body.add(torso);
  // nakatiklop na kanto (gaya ng logo/stickers)
  const cornerShape = new THREE.Shape(); cornerShape.moveTo(0, 0); cornerShape.lineTo(0, 0.4); cornerShape.lineTo(0.4, 0); cornerShape.closePath();
  const corner = new THREE.Mesh(geo(new THREE.ExtrudeGeometry(cornerShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 })), fold);
  corner.position.set(0.24, 1.28, 0.34); corner.castShadow = true;
  body.add(corner);
  // puting linya sa ibaba (parang sulat sa note)
  const line = new THREE.Mesh(geo(new RoundedBoxGeometry(0.62, 0.07, 0.04, 2, 0.03)), mat({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.6 }));
  line.position.set(-0.18, 0.5, 0.42); body.add(line);

  // ---------- mukha ----------
  const face = new THREE.Group(); face.position.set(0, 1.08, 0.42); body.add(face);
  const eyeMat = mat({ color: INK, roughness: 0.25, metalness: 0.1 });
  const shine = mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  const eyes = [-0.27, 0.27].map((x) => {
    const e = new THREE.Group(); e.position.set(x, 0.08, 0);
    const ball = new THREE.Mesh(geo(new THREE.SphereGeometry(0.105, 24, 16)), eyeMat); ball.scale.z = 0.55;
    const s1 = new THREE.Mesh(geo(new THREE.SphereGeometry(0.035, 12, 8)), shine); s1.position.set(0.035, 0.045, 0.05);
    const s2 = new THREE.Mesh(geo(new THREE.SphereGeometry(0.016, 8, 6)), shine); s2.position.set(-0.03, -0.035, 0.05);
    e.add(ball, s1, s2); face.add(e); return e;
  });
  // nakapikit na mata (para sa tulog / tawa)
  const lidCurve = (x) => new THREE.QuadraticBezierCurve3(new THREE.Vector3(x - 0.1, 0.08, 0.02), new THREE.Vector3(x, 0.0, 0.05), new THREE.Vector3(x + 0.1, 0.08, 0.02));
  const lids = [-0.27, 0.27].map((x) => { const m = new THREE.Mesh(geo(new THREE.TubeGeometry(lidCurve(x), 12, 0.022, 8)), eyeMat); m.visible = false; face.add(m); return m; });
  const cheekMat = mat({ color: 0xff6b8a, transparent: true, opacity: 0.55, roughness: 0.9 });
  [-0.45, 0.45].forEach((x) => { const c = new THREE.Mesh(geo(new THREE.CircleGeometry(0.085, 20)), cheekMat); c.position.set(x, -0.08, 0.012); c.scale.y = 0.6; face.add(c); });
  // bibig: iba-iba ayon sa mood
  const mouths = {};
  const mkMouth = (name, pts) => {
    const curve = new THREE.QuadraticBezierCurve3(...pts.map((p) => new THREE.Vector3(p[0], p[1], 0.03)));
    const m = new THREE.Mesh(geo(new THREE.TubeGeometry(curve, 16, 0.024, 8)), eyeMat); m.visible = false; face.add(m); mouths[name] = m;
  };
  mkMouth("happy", [[-0.13, -0.12], [0, -0.26], [0.13, -0.12]]);
  mkMouth("ok", [[-0.1, -0.16], [0, -0.21], [0.1, -0.16]]);
  mkMouth("sad", [[-0.12, -0.22], [0, -0.12], [0.12, -0.22]]);
  mkMouth("flat", [[-0.08, -0.18], [0, -0.18], [0.08, -0.18]]);
  const open = new THREE.Mesh(geo(new THREE.SphereGeometry(0.08, 16, 12)), mat({ color: 0x5a1a1a, roughness: 0.7 }));
  open.scale.set(1, 0.8, 0.4); open.position.set(0, -0.18, 0.02); open.visible = false; face.add(open);

  // ---------- kamay at paa ----------
  // braso: umiikot mula sa balikat (pivot); may kamao sa dulo. Ang hawak (hand anchor) ay nasa kamao ng kanang braso.
  const limbs = [], fists = [];
  [[-0.68, 1.08, -1], [0.68, 1.08, 1]].forEach(([x, y, s]) => {
    const pv = new THREE.Group(); pv.position.set(x, y, 0.05); pv.rotation.z = s * 0.5; body.add(pv);
    const a = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.085, 0.2, 6, 12)), skin); a.position.y = -0.17; a.castShadow = true; pv.add(a);
    const fist = new THREE.Mesh(geo(new THREE.SphereGeometry(0.105, 16, 12)), skin); fist.position.y = -0.36; fist.scale.set(1, 0.92, 1); fist.castShadow = true; pv.add(fist);
    limbs.push(pv); fists.push(fist);
  });
  const feet = [-0.32, 0.32].map((x) => {
    const f = new THREE.Mesh(geo(new THREE.SphereGeometry(0.17, 18, 12)), fold);
    f.scale.set(1, 0.55, 1.25); f.position.set(x, 0.1, 0.12); f.castShadow = true; rig.add(f); return f;
  });

  // ---------- gamit (unlock ayon sa level) ----------
  const gear = new THREE.Group(); gear.position.y = 1.72; body.add(gear);
  function setGear(id) {
    gear.clear();
    if (id === "sprout") {
      const stem = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8)), mat({ color: 0x4caf50 })); stem.position.y = 0.1;
      const leafG = geo(new THREE.SphereGeometry(0.11, 12, 8));
      const l1 = new THREE.Mesh(leafG, mat({ color: 0x66bb6a, roughness: 0.6 })); l1.scale.set(1, 0.35, 0.6); l1.position.set(-0.1, 0.22, 0); l1.rotation.z = 0.5;
      const l2 = l1.clone(); l2.position.x = 0.1; l2.rotation.z = -0.5;
      gear.add(stem, l1, l2);
    } else if (id === "bow") {
      const m = mat({ color: 0xff4f8b, roughness: 0.45 });
      const k = new THREE.Mesh(geo(new THREE.SphereGeometry(0.06, 12, 8)), m); k.position.set(-0.4, 0.02, 0.2);
      const w1 = new THREE.Mesh(geo(new THREE.ConeGeometry(0.11, 0.2, 12)), m); w1.rotation.z = Math.PI / 2; w1.position.set(-0.51, 0.02, 0.2);
      const w2 = w1.clone(); w2.rotation.z = -Math.PI / 2; w2.position.x = -0.29;
      gear.add(k, w1, w2);
    } else if (id === "cap") {
      const m = mat({ color: 0x2f6fde, roughness: 0.5 });
      const dome = new THREE.Mesh(geo(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), m); dome.scale.set(1.25, 0.6, 1); dome.position.y = -0.05;
      const brim = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 24, 1, false, -Math.PI / 2, Math.PI)), m); brim.position.set(0, -0.04, 0.3); brim.scale.z = 0.8;
      const btn = new THREE.Mesh(geo(new THREE.SphereGeometry(0.05, 10, 8)), mat({ color: 0xff5a36 })); btn.position.y = 0.21;
      dome.castShadow = true; gear.add(dome, brim, btn);
    } else if (id === "headphones") {
      const m = mat({ color: 0x222228, roughness: 0.35, metalness: 0.3 });
      const band = new THREE.Mesh(geo(new THREE.TorusGeometry(0.62, 0.04, 10, 32, Math.PI)), m); band.position.y = -0.55;
      const c1 = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20)), mat({ color: 0xff5a36, roughness: 0.4 })); c1.rotation.z = Math.PI / 2; c1.position.set(-0.68, -0.6, 0);
      const c2 = c1.clone(); c2.position.x = 0.68;
      gear.add(band, c1, c2);
    } else if (id === "crown") {
      const m = mat({ color: 0xf4c342, metalness: 0.7, roughness: 0.25 });
      const ring = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.3, 0.32, 0.14, 20, 1, true)), m); ring.position.y = 0.06;
      gear.add(ring);
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(geo(new THREE.ConeGeometry(0.06, 0.16, 8)), m), a = (i / 5) * Math.PI * 2;
        sp.position.set(Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3); gear.add(sp);
      }
      const gem = new THREE.Mesh(geo(new THREE.OctahedronGeometry(0.05)), mat({ color: 0xff3b6b, emissive: 0x551122, roughness: 0.2 })); gem.position.set(0, 0.07, 0.32); gear.add(gem);
    }
  }

  // ---------- mga isinusuot (outfit.js) ----------
  const LEGACY = ["sprout", "bow", "cap", "headphones", "crown"];
  const anchors = {
    hat: new THREE.Group(), face: new THREE.Group(), body: new THREE.Group(), hand: new THREE.Group(),
  };
  anchors.hat.position.y = 1.72; body.add(anchors.hat);
  face.add(anchors.face);
  anchors.body.position.set(0, 0.72, 0.41); body.add(anchors.body);
  // hawak: nasa kamao ng kanang braso; ang gamit ay laging patayo (kinokontra ang ikot ng braso)
  anchors.hand.position.set(0, -0.36, 0.02); limbs[1].add(anchors.hand);
  anchors.hand.rotation.order = "ZYX"; // kabaligtaran ng ikot ng braso (XYZ) → laging patayo ang hawak
  const worn = {};
  function wear(slot, id) {
    if (slot === "hat") {
      anchors.hat.clear();
      if (LEGACY.includes(id)) { setGear(id); worn.hat = id; return; }
      setGear("none");
    } else if (anchors[slot]) anchors[slot].clear(); else return;
    worn[slot] = id || null;
    if (!id) return;
    const w = buildWear(id); if (!w) return;
    w.group.traverse((o) => { if (o.geometry) disposables.push(o.geometry); if (o.material) disposables.push(o.material); });
    anchors[slot === "hat" ? "hat" : w.anchor].add(w.group);
  }
  function setGlow(on) { skin.emissive = new THREE.Color(on ? 0xffb300 : 0x000000); skin.emissiveIntensity = on ? 0.35 : 0; }

  // ---------- Zzz (tulog) ----------
  const zzz = new THREE.Group(); zzz.position.set(0.6, 1.9, 0); zzz.visible = false; group.add(zzz);
  const zMat = mat({ color: 0xffffff, emissive: 0x9bb6ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
  [0, 1, 2].forEach((i) => { const z = new THREE.Mesh(geo(new THREE.TorusGeometry(0.06 + i * 0.02, 0.012, 6, 4)), zMat); z.position.set(i * 0.12, i * 0.22, 0); zzz.add(z); });

  // ---------- estado at galaw ----------
  const st = { move: null, moveT: 0, walk: 0, walkT: 0, heading: null, mood: "happy", asleep: false, blinkT: 2 + Math.random() * 3, blink: 0, jump: 0, eat: 0, spin: 0, wiggle: 0, look: new THREE.Vector2(), lookNow: new THREE.Vector2(), phase: Math.random() * 10 };
  function setColor(id) {
    const c = COLORS[id] || COLORS.coral;
    skin.color.set(c[0]); skin.sheenColor = new THREE.Color(c[0]).offsetHSL(0, 0, 0.15); fold.color.set(c[1]);
  }
  function paintFace() {
    const sleepy = st.asleep || st.mood === "sleepy";
    const closed = st.asleep || st.blink > 0 || (st.mood === "happy" && st.eat > 0);
    eyes.forEach((e) => { e.visible = !closed; e.scale.y = sleepy && !st.asleep ? 0.55 : 1; });
    lids.forEach((l) => { l.visible = closed; });
    Object.values(mouths).forEach((m) => { m.visible = false; });
    open.visible = st.eat > 0 && Math.sin(st.eat * 30) > 0;
    if (!open.visible) (mouths[st.asleep ? "flat" : st.mood === "sad" || st.mood === "sick" ? "sad" : st.mood === "ok" ? "ok" : st.mood === "sleepy" ? "flat" : "happy"]).visible = true;
    zzz.visible = st.asleep;
  }
  function update(dt, t) {
    dt = Math.min(dt, 0.05);
    const slow = st.asleep ? 0.45 : st.mood === "sad" || st.mood === "sick" ? 0.7 : 1;
    // hinga
    const br = Math.sin((t + st.phase) * 2.2 * slow);
    body.scale.set(1 + br * 0.015, 1 - br * 0.02, 1 + br * 0.015);
    // kurap
    st.blinkT -= dt;
    if (st.blinkT <= 0) { st.blink = 0.13; st.blinkT = 2.5 + Math.random() * 3.5; }
    if (st.blink > 0) st.blink = Math.max(0, st.blink - dt);
    // talon
    let y = 0;
    if (st.jump > 0) { st.jump = Math.max(0, st.jump - dt); const k = 1 - st.jump / 0.7; y = Math.sin(k * Math.PI) * 0.75; body.scale.y *= 1 + Math.sin(k * Math.PI) * 0.06; }
    if (st.wiggle > 0) { st.wiggle = Math.max(0, st.wiggle - dt); body.rotation.z = Math.sin(st.wiggle * 28) * 0.12 * (st.wiggle / 0.8); } else body.rotation.z *= 0.85;
    if (st.eat > 0) st.eat = Math.max(0, st.eat - dt);
    // sayaw at iba pang galaw (kasama ang kaibigan)
    let mv = null;
    if (st.move) { st.moveT -= dt; if (st.moveT <= 0) st.move = null; else mv = st.move; }
    const beat = t * 7.5;
    if (mv === "dance") { y += Math.abs(Math.sin(beat)) * 0.16; body.rotation.z = Math.sin(beat) * 0.2; }
    if (mv === "cheer") y += Math.max(0, Math.sin(t * 9)) * 0.3;
    if (mv === "budots") { y += Math.abs(Math.sin(t * 9)) * 0.1; body.rotation.z = Math.sin(t * 4.5) * 0.26; }
    if (mv === "robot") { const q = Math.floor(t * 4); y += (q % 2) * 0.05; body.rotation.z = [0, 0.12, 0, -0.12][q % 4]; }
    rig.position.y = y;
    // lakad: salitan ang paa (taas + abante), kumekembot nang kaunti ang katawan
    st.walkT += dt * (6 + st.walk * 8) * (st.walk > 0.05 ? 1 : 0);
    feet.forEach((f, i) => {
      const ph = st.walkT + i * Math.PI, w = st.walk > 0.05 && y < 0.05 ? 1 : 0;
      f.position.y = 0.1 + Math.max(0, Math.sin(ph)) * 0.16 * w;
      f.position.z = 0.12 + Math.cos(ph) * 0.18 * w;
      f.rotation.x = -Math.sin(ph) * 0.4 * w;
    });
    if (st.walk > 0.05 && y < 0.05) { body.position.y = Math.abs(Math.sin(st.walkT)) * 0.06; body.rotation.y = Math.sin(st.walkT) * 0.06; }
    else { body.position.y *= 0.8; body.rotation.y *= 0.8; }
    // ikot / harap
    if (st.spin > 0) { st.spin = Math.max(0, st.spin - dt); group.rotation.y = (st.heading || 0) + (1 - st.spin / 0.9) * Math.PI * 2; }
    else if (st.heading !== null) {
      let d = st.heading - group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); group.rotation.y += d * Math.min(1, dt * 10);
    } else group.rotation.y += (st.look.x * 0.35 - group.rotation.y) * 0.08;
    // tingin
    st.lookNow.lerp(st.look, 0.1);
    face.position.x = st.lookNow.x * 0.07; face.position.y = 1.08 + st.lookNow.y * 0.05;
    // kamay (kaway kapag masaya)
    const swing = st.walk > 0.05 ? Math.sin(st.walkT) * 0.5 : 0;
    limbs[0].rotation.z = -0.5 + (st.mood === "happy" && !st.asleep && !swing ? Math.sin(t * 3) * 0.15 : 0);
    limbs[0].rotation.x = swing;
    limbs[1].rotation.z = worn.hand ? 0.32 + (st.jump > 0 ? 0.5 : 0) : 0.5 - (st.jump > 0 ? 0.9 : st.mood === "happy" && !st.asleep ? Math.sin(t * 3 + 1) * 0.15 : 0);
    limbs[1].rotation.x = worn.hand ? -0.55 - swing * 0.25 : -swing; // hawak: braso pasulong, parang totoong may hawak
    if (mv === "dance") {
      limbs[0].rotation.z = -1.3 + Math.sin(beat) * 0.9; limbs[1].rotation.z = 1.3 + Math.sin(beat) * 0.9; limbs[0].rotation.x = limbs[1].rotation.x = 0;
      feet.forEach((f, i) => { f.position.y = 0.1 + Math.max(0, Math.sin(beat + i * Math.PI)) * 0.12; });
    } else if (mv === "budots") {
      // Budots: lupaypay na kamay na kumakaway-kaway, tuhod na bumabagsak-bagsak, kembot
      const b = t * 9;
      limbs[0].rotation.z = -0.9 + Math.sin(b) * 1.1; limbs[1].rotation.z = 0.9 + Math.sin(b + Math.PI) * 1.1;
      limbs[0].rotation.x = Math.sin(b * 0.5) * 0.9; limbs[1].rotation.x = -Math.sin(b * 0.5) * 0.9;
      body.rotation.y = Math.sin(t * 4.5) * 0.35;
      feet.forEach((f, i) => { f.position.y = 0.1 + Math.max(0, Math.sin(b + i * Math.PI)) * 0.1; f.rotation.y = Math.sin(t * 4.5) * 0.4; });
    } else if (mv === "robot") {
      // Robot: putol-putol na galaw, parang makina
      const q = Math.floor(t * 4) % 8;
      limbs[0].rotation.z = [-1.57, -1.57, -0.3, -2.7, -1.57, -0.3, -1.57, -2.7][q]; limbs[1].rotation.z = [1.57, 0.3, 1.57, 2.7, 0.3, 1.57, 2.7, 1.57][q];
      limbs[0].rotation.x = [0, -1.2, 0, 0, -1.2, 0, 0, 0][q]; limbs[1].rotation.x = [0, 0, -1.2, 0, 0, -1.2, 0, 0][q];
      body.rotation.y = [0, 0.45, 0, -0.45, 0, 0.45, 0, -0.45][q];
      feet.forEach((f, i) => { f.position.y = 0.1 + (q % 2 === i ? 0.08 : 0); });
    } else if (mv === "highfive") { limbs[1].rotation.z = 2.7; limbs[1].rotation.x = -0.3; }
    else if (mv === "cheer") { limbs[0].rotation.z = -2.6 + Math.sin(t * 9) * 0.2; limbs[1].rotation.z = 2.6 - Math.sin(t * 9) * 0.2; }
    // ang hawak ay laging patayo at gumagalaw kasama ng kamay (wagayway ng flag, lobo, atbp.)
    if (worn.hand) {
      anchors.hand.rotation.set(-limbs[1].rotation.x, 0, -limbs[1].rotation.z);
      anchors.hand.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); });
    }
    anchors.body.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); });
    // malungkot = medyo nakayuko
    body.rotation.x += ((mv === "bow" ? 0.55 : st.mood === "sad" || st.mood === "sick" || st.asleep ? 0.12 : 0) - body.rotation.x) * (mv === "bow" ? 0.15 : 0.05);
    // Zzz
    if (zzz.visible) zzz.children.forEach((z, i) => { z.position.y = ((t * 0.4 + i * 0.33) % 1) * 0.7; z.material.opacity = 1 - ((t * 0.4 + i * 0.33) % 1); });
    paintFace();
  }
  setColor(opts.color || "coral"); setGear(opts.gear || "none"); paintFace();
  return {
    group, update,
    setMood(m) { st.mood = m; }, sleep(on) { st.asleep = !!on; },
    jump() { if (st.jump < 0.15) st.jump = 0.7; }, height() { return rig.position.y; }, jumping() { return st.jump > 0; }, eat() { st.eat = 1.2; st.wiggle = 0.6; }, spin() { st.spin = 0.9; }, wiggle() { st.wiggle = 0.8; },
    lookAt(x, y) { st.look.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); },
    setColor, setGear, wear, setGlow, worn,
    walk(speed, heading) { st.walk = Math.max(0, Math.min(1, speed || 0)); if (heading !== undefined) st.heading = heading; },
    face(heading) { st.heading = heading; },
    move(kind, sec) { st.move = kind || null; st.moveT = sec || 2; },
    moving() { return st.move; },
    dispose() { disposables.forEach((d) => d.dispose && d.dispose()); },
  };
}
