/* TigoMeNote · tigo/human-model.js — "Kid": avatar na parang tao (ulo, katawan, braso, binti), kapalit ng note na Tigo kung pipiliin
   import { createKid, KID } from "./human-model.js"      (ginagamit ng pet-model.js createTigo kapag avatar.kind === "kid")
   const k = createKid({ avatar: { skin, hair, hairColor, top, topColor, bottom, bottomColor, shoes } }, group)
   Pareho ang API ng Tigo (pet-model.js): update, setMood, sleep, jump, eat, spin, wiggle, lookAt, wear, setGlow, walk, face, move, sitPose(on), dispose
     + setLook(avatar) → palitan ang buhok / damit / kulay nang hindi ginagawa ulit ang buong katawan
   KID = mga pagpipilian (para sa avatar-ui.js): SKIN, HAIR, HAIRC, TOP, BOTTOM, CLOTH, EYES, EYEC, PRESETS
   0.11.52: anime na estilo — buhok (anime, twintails, hime, wolf, ahoge), damit (sailor, gakuran, yukata, hero), palda na pleated,
            malalaking makinang na mata (eyes: "anime") na may kulay (eyeColor). talk(sec) = gumagalaw ang bibig habang nagsasalita.
   Kasinlaki ni Tigo (~1.75 ang taas) para tugma sa camera, bahay, at mga laro. Sariling disenyo (gawa sa code), walang kinopyang character. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { buildWear } from "./outfit.js";

export const KID = {
  SKIN: { s1: "#ffe0c4", s2: "#f6c9a0", s3: "#e0a878", s4: "#c68656", s5: "#8f5a36", s6: "#5c3a24" },
  HAIR: ["short", "bob", "long", "pony", "spiky", "buns", "curly", "anime", "twintails", "hime", "wolf", "ahoge", "none"],
  HAIRC: { black: "#26211f", brown: "#5b3a22", chestnut: "#8a4b2a", blonde: "#f0c75e", red: "#c8452c", pink: "#ff8fc0", blue: "#4a8fe8", purple: "#8f6ff0", white: "#f1efe9" },
  TOP: ["tee", "stripe", "hoodie", "jacket", "overall", "dress", "sailor", "gakuran", "yukata", "hero"],
  BOTTOM: ["pants", "shorts", "skirt", "pleated"],
  EYES: ["round", "anime"],
  EYEC: { brown: "#6b3e1f", blue: "#2f7de1", green: "#2fae6a", purple: "#8a4fe0", red: "#d43a3a", gold: "#e0a420", pink: "#ff6fae" },
  CLOTH: { red: "#ef4b4b", orange: "#ff8a3d", yellow: "#ffd23f", green: "#4fb86a", mint: "#3dd6c0", sky: "#7cc4ff", blue: "#3f6fe0", purple: "#8f74f0", pink: "#ff8fc0", white: "#f7f5f0", gray: "#8b90a0", black: "#2a2a30", brown: "#8a5a3a" },
  PRESETS: [
    { id: "explorer", name: "Explorer", icon: "🧭", skin: "s2", hair: "short", hairColor: "brown", top: "jacket", topColor: "green", bottom: "pants", bottomColor: "brown", shoes: "black" },
    { id: "sunny", name: "Sunny", icon: "🌞", skin: "s3", hair: "pony", hairColor: "black", top: "tee", topColor: "yellow", bottom: "shorts", bottomColor: "sky", shoes: "white" },
    { id: "pastel", name: "Pastel", icon: "🍬", skin: "s1", hair: "buns", hairColor: "pink", top: "dress", topColor: "mint", bottom: "skirt", bottomColor: "mint", shoes: "pink" },
    { id: "sporty", name: "Sporty", icon: "⚽", skin: "s4", hair: "spiky", hairColor: "black", top: "stripe", topColor: "red", bottom: "shorts", bottomColor: "black", shoes: "white" },
    { id: "cozy", name: "Cozy", icon: "🧶", skin: "s2", hair: "bob", hairColor: "chestnut", top: "hoodie", topColor: "purple", bottom: "pants", bottomColor: "gray", shoes: "white" },
    { id: "night", name: "Night", icon: "🌙", skin: "s5", hair: "curly", hairColor: "black", top: "hoodie", topColor: "black", bottom: "pants", bottomColor: "blue", shoes: "red" },
    { id: "garden", name: "Garden", icon: "🌱", skin: "s3", hair: "long", hairColor: "brown", top: "overall", topColor: "blue", bottom: "pants", bottomColor: "blue", shoes: "brown" },
    { id: "ocean", name: "Ocean", icon: "🌊", skin: "s6", hair: "short", hairColor: "blue", top: "tee", topColor: "sky", bottom: "skirt", bottomColor: "white", shoes: "blue" },
    { id: "academy", name: "Academy", icon: "🎒", skin: "s1", hair: "twintails", hairColor: "pink", top: "sailor", topColor: "white", bottom: "pleated", bottomColor: "blue", shoes: "black", eyes: "anime", eyeColor: "purple" },
    { id: "rival", name: "Rival", icon: "⚡", skin: "s2", hair: "anime", hairColor: "blonde", top: "gakuran", topColor: "black", bottom: "pants", bottomColor: "black", shoes: "black", eyes: "anime", eyeColor: "blue" },
    { id: "festival", name: "Festival", icon: "🏮", skin: "s3", hair: "hime", hairColor: "black", top: "yukata", topColor: "red", bottom: "pants", bottomColor: "red", shoes: "brown", eyes: "anime", eyeColor: "brown" },
    { id: "hero", name: "Hero", icon: "🦸", skin: "s4", hair: "wolf", hairColor: "red", top: "hero", topColor: "blue", bottom: "pants", bottomColor: "blue", shoes: "red", eyes: "anime", eyeColor: "gold" },
  ],
};
const DEF = KID.PRESETS[0], INK = 0x2b1d1a;
const pick = (map, k, d) => map[k] || map[d];

export function createKid(opts = {}, group = new THREE.Group()) {
  const rig = new THREE.Group(), body = new THREE.Group();   // rig = tumatalon; body = humihinga (0.9 ang laki para kasintaas ni Tigo)
  group.add(rig); rig.add(body); body.scale.setScalar(0.9);
  const disposables = [];
  const mat = (o) => { const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6 }, o)); disposables.push(m); return m; };
  const geo = (g) => { disposables.push(g); return g; };
  const mesh = (g, m, x, y, z, parent = body, shadow = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; parent.add(o); return o; };

  // ---------- mga kulay (pinapalitan ng setLook) ----------
  const skin = mat({ roughness: 0.55 }), hairM = mat({ roughness: 0.75 }), topM = mat({}), botM = mat({}), shoeM = mat({ roughness: 0.5 }), trim = mat({ color: 0xffffff });

  // ---------- binti at sapatos (umiikot mula sa balakang) ----------
  const legs = [-0.17, 0.17].map((x) => {
    const pv = new THREE.Group(); pv.position.set(x, 0.62, 0); body.add(pv);
    const up = mesh(geo(new THREE.CapsuleGeometry(0.125, 0.12, 6, 12)), botM, 0, -0.14, 0, pv);      // hita (shorts: ito lang ang may kulay)
    const low = mesh(geo(new THREE.CapsuleGeometry(0.115, 0.14, 6, 12)), botM, 0, -0.38, 0, pv);     // binti
    const shoe = mesh(geo(new THREE.SphereGeometry(0.15, 16, 12)), shoeM, 0, -0.56, 0.05, pv); shoe.scale.set(1, 0.6, 1.45);
    return { pv, up, low, shoe };
  });
  // ---------- katawan ----------
  const torso = mesh(geo(new RoundedBoxGeometry(0.66, 0.62, 0.42, 5, 0.14)), topM, 0, 0.93, 0);
  const extra = new THREE.Group(); body.add(extra);        // palda, hood, guhit, bib (ayon sa damit)
  // ---------- braso (umiikot mula sa balikat) ----------
  const limbs = [], sleeves = [];
  [[-0.42, 1.14, -1], [0.42, 1.14, 1]].forEach(([x, y, s]) => {
    const pv = new THREE.Group(); pv.position.set(x, y, 0); pv.rotation.z = s * 0.28; body.add(pv);
    const sl = mesh(geo(new THREE.CapsuleGeometry(0.095, 0.1, 6, 12)), topM, 0, -0.1, 0, pv);        // manggas (maikli)
    const arm = mesh(geo(new THREE.CapsuleGeometry(0.082, 0.2, 6, 12)), skin, 0, -0.27, 0, pv);
    mesh(geo(new THREE.SphereGeometry(0.1, 14, 10)), skin, 0, -0.46, 0, pv);
    limbs.push(pv); sleeves.push({ sl, arm });
  });
  // ---------- ulo at mukha ----------
  const head = new THREE.Group(); head.position.set(0, 1.6, 0); body.add(head);
  const skull = mesh(geo(new THREE.SphereGeometry(0.4, 28, 20)), skin, 0, 0, 0, head); skull.scale.set(1.06, 0.96, 1);
  [-0.41, 0.41].forEach((x) => mesh(geo(new THREE.SphereGeometry(0.075, 10, 8)), skin, x, -0.03, 0, head, false));   // tenga
  const hair = new THREE.Group(); head.add(hair);
  // mukha: pareho ang sukat ng kay Tigo (para tugma ang salamin atbp.), pinaliit sa 0.62
  const face = new THREE.Group(); face.position.set(0, -0.03, 0.385); face.scale.setScalar(0.62); head.add(face);
  const eyeMat = mat({ color: INK, roughness: 0.25, metalness: 0.1 }), shine = mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  const irisM = mat({ color: 0x6b3e1f, roughness: 0.3, emissive: 0x000000 });
  const eyes = [-0.27, 0.27].map((x) => {
    const e = new THREE.Group(); e.position.set(x, 0.08, 0);
    const ball = new THREE.Mesh(geo(new THREE.SphereGeometry(0.105, 20, 14)), eyeMat); ball.scale.z = 0.55;
    const s1 = new THREE.Mesh(geo(new THREE.SphereGeometry(0.035, 10, 8)), shine); s1.position.set(0.035, 0.045, 0.05);
    // anime: mas malaki at matangkad na mata, may kulay na iris sa ibaba, dalawang kislap
    const iris = new THREE.Mesh(geo(new THREE.SphereGeometry(0.085, 18, 12)), irisM); iris.scale.set(1, 1.15, 0.4); iris.position.set(0, -0.035, 0.035); iris.visible = false;
    const s2 = new THREE.Mesh(geo(new THREE.SphereGeometry(0.018, 8, 6)), shine); s2.position.set(-0.035, -0.06, 0.07); s2.visible = false;
    e.add(ball, s1, iris, s2); e.userData = { ball, s1, iris, s2 }; face.add(e); return e;
  });
  function setEyes(kind, col) {
    const an = kind === "anime"; irisM.color.set(col); irisM.emissive.set(col); irisM.emissiveIntensity = an ? 0.25 : 0;
    eyes.forEach((e) => { const u = e.userData; u.ball.scale.set(an ? 1.12 : 1, an ? 1.55 : 1, 0.55); u.iris.visible = u.s2.visible = an; u.s1.position.set(an ? 0.04 : 0.035, an ? 0.08 : 0.045, an ? 0.07 : 0.05); u.s1.scale.setScalar(an ? 1.25 : 1); e.position.y = an ? 0.1 : 0.08; });
  }
  const lidCurve = (x) => new THREE.QuadraticBezierCurve3(new THREE.Vector3(x - 0.1, 0.08, 0.02), new THREE.Vector3(x, 0.0, 0.05), new THREE.Vector3(x + 0.1, 0.08, 0.02));
  const lids = [-0.27, 0.27].map((x) => { const m = new THREE.Mesh(geo(new THREE.TubeGeometry(lidCurve(x), 12, 0.022, 8)), eyeMat); m.visible = false; face.add(m); return m; });
  const cheekMat = mat({ color: 0xff6b8a, transparent: true, opacity: 0.5, roughness: 0.9 });
  [-0.42, 0.42].forEach((x) => { const c = new THREE.Mesh(geo(new THREE.CircleGeometry(0.085, 18)), cheekMat); c.position.set(x, -0.08, -0.04); c.scale.y = 0.6; face.add(c); });
  const mouths = {};
  const mkMouth = (name, pts) => { const curve = new THREE.QuadraticBezierCurve3(...pts.map((p) => new THREE.Vector3(p[0], p[1], 0.03))); const m = new THREE.Mesh(geo(new THREE.TubeGeometry(curve, 16, 0.024, 8)), eyeMat); m.visible = false; face.add(m); mouths[name] = m; };
  mkMouth("happy", [[-0.13, -0.12], [0, -0.26], [0.13, -0.12]]); mkMouth("ok", [[-0.1, -0.16], [0, -0.21], [0.1, -0.16]]);
  mkMouth("sad", [[-0.12, -0.22], [0, -0.12], [0.12, -0.22]]); mkMouth("flat", [[-0.08, -0.18], [0, -0.18], [0.08, -0.18]]);
  const open = new THREE.Mesh(geo(new THREE.SphereGeometry(0.08, 14, 10)), mat({ color: 0x5a1a1a, roughness: 0.7 })); open.scale.set(1, 0.8, 0.4); open.position.set(0, -0.18, 0.02); open.visible = false; face.add(open);

  // ---------- buhok ----------
  const temp = [];   // geometry ng buhok at dagdag sa damit (itinatapon kapag pinalitan)
  const tg = (g) => { temp.push(g); return g; };
  function buildHair(id) {
    hair.clear();
    if (id === "none") return;
    const h = (g, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(tg(g), hairM); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; hair.add(o); return o; };
    const cap = () => { const c = h(new THREE.SphereGeometry(0.435, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), 0, 0.03, -0.02, 1.07, 1, 1.04); c.rotation.x = -0.42; return c; };   // nakatagilid paatras para kita ang mukha
    const fringe = () => { [-0.2, 0, 0.2].forEach((x, i) => h(new THREE.SphereGeometry(0.15, 12, 8), x, 0.3 - Math.abs(x) * 0.3, 0.27, 1.1, 0.5, 0.6).rotation.z = (i - 1) * -0.3); };
    if (id === "curly") { [[0, 0.34, 0], [-0.26, 0.26, 0.1], [0.26, 0.26, 0.1], [-0.36, 0.08, -0.05], [0.36, 0.08, -0.05], [0, 0.3, -0.26], [-0.24, 0.14, -0.3], [0.24, 0.14, -0.3], [0, 0.3, 0.24], [-0.38, -0.12, -0.02], [0.38, -0.12, -0.02]].forEach(([x, y, z]) => h(new THREE.SphereGeometry(0.2, 12, 9), x, y, z)); return; }
    cap(); fringe();
    if (id === "bob") { [-1, 1].forEach((s) => h(new THREE.SphereGeometry(0.2, 12, 9), s * 0.36, -0.12, -0.02, 0.7, 1.5, 1.1)); h(new THREE.SphereGeometry(0.34, 14, 10), 0, -0.1, -0.2, 1.15, 1.05, 0.7); }
    if (id === "long") { [-1, 1].forEach((s) => h(new THREE.CapsuleGeometry(0.12, 0.5, 6, 10), s * 0.36, -0.3, -0.04)); h(new RoundedBoxGeometry(0.7, 0.85, 0.2, 3, 0.09), 0, -0.3, -0.28); }
    if (id === "pony") { h(new THREE.SphereGeometry(0.13, 12, 9), 0, 0.18, -0.42); h(new THREE.CapsuleGeometry(0.1, 0.34, 6, 10), 0, -0.08, -0.5).rotation.x = 0.35; }
    if (id === "spiky") for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, s = h(new THREE.ConeGeometry(0.11, 0.3, 7), Math.sin(a) * 0.2, 0.4, Math.cos(a) * 0.2 - 0.03); s.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); }
    if (id === "buns") [-1, 1].forEach((s) => h(new THREE.SphereGeometry(0.15, 12, 9), s * 0.3, 0.4, -0.05));
    // ---- anime na estilo (sariling disenyo) ----
    if (id === "anime") {   // malalaking tulis na nakasuklay paitaas at paatras, may bangs na tusok sa noo
      [[0, 0.5, -0.05, -0.6, 0], [-0.24, 0.42, -0.1, -0.5, 0.6], [0.24, 0.42, -0.1, -0.5, -0.6], [-0.14, 0.36, -0.36, -1.2, 0.3], [0.14, 0.36, -0.36, -1.2, -0.3], [0, 0.22, -0.46, -1.7, 0], [-0.38, 0.12, -0.2, -0.9, 1.1], [0.38, 0.12, -0.2, -0.9, -1.1]]
        .forEach(([x, y, z, rx, rz]) => { const c = h(new THREE.ConeGeometry(0.13, 0.42, 7), x, y, z); c.rotation.set(rx, 0, rz); });
      [[-0.16, 0.2, 0.33, 0.5], [0.02, 0.18, 0.37, 0], [0.18, 0.22, 0.33, -0.5]].forEach(([x, y, z, rz]) => { const c = h(new THREE.ConeGeometry(0.07, 0.24, 6), x, y, z); c.rotation.set(Math.PI - 0.3, 0, rz); });
    }
    if (id === "twintails") { [-1, 1].forEach((s) => { h(new THREE.SphereGeometry(0.08, 10, 8), s * 0.36, 0.26, -0.12); const t = h(new THREE.CapsuleGeometry(0.11, 0.62, 6, 10), s * 0.5, -0.12, -0.18); t.rotation.z = s * 0.25; const tip = h(new THREE.ConeGeometry(0.1, 0.2, 8), s * 0.58, -0.56, -0.18); tip.rotation.set(Math.PI, 0, -s * 0.25); }); }
    if (id === "hime") { h(new RoundedBoxGeometry(0.8, 1.0, 0.22, 3, 0.09), 0, -0.36, -0.28); [-1, 1].forEach((s) => h(new RoundedBoxGeometry(0.13, 0.62, 0.16, 2, 0.05), s * 0.37, -0.26, 0.08)); h(new RoundedBoxGeometry(0.66, 0.12, 0.2, 2, 0.05), 0, 0.27, 0.3); }   // tuwid na bangs at hiwa sa gilid
    if (id === "wolf") { for (let i = 0; i < 9; i++) { const a = -1.3 + (i / 8) * 2.6, c = h(new THREE.ConeGeometry(0.12, 0.36, 6), Math.sin(a) * 0.36, -0.08 - Math.abs(Math.sin(a)) * 0.04, Math.cos(a) * -0.3 - 0.06); c.rotation.set(Math.PI - 0.5 * Math.cos(a), 0, -Math.sin(a) * 0.6); } }
    if (id === "ahoge") { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.42, 0), new THREE.Vector3(0.05, 0.6, 0.02), new THREE.Vector3(0.14, 0.66, 0.06), new THREE.Vector3(0.17, 0.58, 0.08)]); h(new THREE.TubeGeometry(curve, 12, 0.025, 6), 0, 0, 0); }
  }
  // ---------- damit ----------
  function buildClothes(a) {
    extra.clear();
    const top = KID.TOP.includes(a.top) ? a.top : "tee", bottom0 = top === "dress" ? "skirt" : KID.BOTTOM.includes(a.bottom) ? a.bottom : "pants", bottom = bottom0 === "pleated" ? "skirt" : bottom0;
    const x = (g, m, px, py, pz, sh = false) => { const o = new THREE.Mesh(tg(g), m); o.position.set(px, py, pz); o.castShadow = sh; extra.add(o); return o; };
    const long = top === "hoodie" || top === "jacket" || top === "gakuran" || top === "yukata" || top === "hero";
    sleeves.forEach((s) => { s.arm.material = long ? topM : skin; });
    legs.forEach((l) => { l.up.material = bottom === "skirt" ? skin : botM; l.low.material = bottom === "pants" ? botM : skin; });
    if (bottom === "skirt") x(new THREE.CylinderGeometry(0.3, top === "dress" ? 0.52 : 0.45, top === "dress" ? 0.42 : 0.3, 20, 1, true), top === "dress" ? topM : botM, 0, top === "dress" ? 0.5 : 0.53, 0, true).material.side = THREE.DoubleSide;
    else x(new RoundedBoxGeometry(0.62, 0.2, 0.4, 3, 0.08), botM, 0, 0.63, 0);   // balakang
    if (top === "stripe") [1.02, 0.86].forEach((y) => x(new RoundedBoxGeometry(0.672, 0.07, 0.432, 2, 0.03), trim, 0, y, 0));
    if (top === "hoodie") { x(new THREE.SphereGeometry(0.24, 14, 10), topM, 0, 1.24, -0.2, true).scale.set(1.25, 0.85, 0.8); x(new RoundedBoxGeometry(0.34, 0.16, 0.03, 2, 0.02), trim, 0, 0.8, 0.215).material = topM; [-0.07, 0.07].forEach((sx) => x(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), trim, sx, 1.08, 0.22)); }
    if (top === "jacket") { x(new RoundedBoxGeometry(0.2, 0.56, 0.03, 2, 0.02), trim, 0, 0.94, 0.2); [-0.14, 0.14].forEach((sx, i) => { const c = x(new THREE.BoxGeometry(0.12, 0.18, 0.03), topM, sx, 1.16, 0.215); c.rotation.z = i ? -0.5 : 0.5; }); }
    if (top === "overall") { torso.material = trim; x(new RoundedBoxGeometry(0.42, 0.34, 0.04, 2, 0.03), topM, 0, 0.88, 0.2); [-0.15, 0.15].forEach((sx) => x(new THREE.BoxGeometry(0.07, 0.36, 0.44), topM, sx, 1.08, 0)); x(new RoundedBoxGeometry(0.67, 0.2, 0.43, 3, 0.08), topM, 0, 0.68, 0); }
    else torso.material = topM;
    if (top === "dress") x(new RoundedBoxGeometry(0.26, 0.05, 0.03, 2, 0.02), trim, 0, 1.2, 0.2);   // kuwelyo
    if (bottom0 === "pleated") for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, f = x(new THREE.BoxGeometry(0.02, 0.28, 0.012), trim, Math.sin(a) * 0.4, 0.53, Math.cos(a) * 0.4); f.rotation.y = a; f.rotation.x = -0.25 * Math.cos(a); f.material = botM; f.scale.x = 1.4; }   // tupi ng palda
    const navy = trim.clone(); navy.color.set(0x24305e); temp.push(navy); const red = trim.clone(); red.color.set(0xe23b4b); temp.push(red); const gold = trim.clone(); gold.color.set(0xf2c14e); gold.metalness = 0.6; gold.roughness = 0.3; temp.push(gold);
    if (top === "sailor") {   // kuwelyong pang-marino sa likod at harap, may laso
      x(new RoundedBoxGeometry(0.62, 0.34, 0.03, 2, 0.02), navy, 0, 1.08, -0.22); [-1, 1].forEach((s) => { const c = x(new THREE.BoxGeometry(0.2, 0.3, 0.03), navy, s * 0.13, 1.08, 0.205); c.rotation.z = s * 0.45; });
      [-1, 1].forEach((s) => { const b = x(new THREE.ConeGeometry(0.06, 0.12, 4), red, s * 0.06, 0.96, 0.23); b.rotation.z = s * Math.PI / 2; }); x(new THREE.SphereGeometry(0.03, 8, 6), red, 0, 0.96, 0.235); }
    if (top === "gakuran") { x(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 16), topM, 0, 1.24, 0); [1.12, 1.0, 0.88, 0.76].forEach((y) => x(new THREE.SphereGeometry(0.025, 8, 6), gold, 0, y, 0.215)); }   // mataas na kuwelyo at gintong butones
    if (top === "yukata") { [-1, 1].forEach((s) => { const l = x(new THREE.BoxGeometry(0.08, 0.5, 0.02), trim, s * 0.07, 1.02, 0.215); l.rotation.z = s * 0.45; }); x(new RoundedBoxGeometry(0.69, 0.14, 0.45, 3, 0.06), navy, 0, 0.78, 0); x(new RoundedBoxGeometry(0.18, 0.12, 0.06, 2, 0.03), navy, 0.12, 0.78, -0.24); }   // tawid sa dibdib at malapad na obi
    if (top === "hero") { x(new RoundedBoxGeometry(0.69, 0.1, 0.45, 3, 0.05), gold, 0, 0.72, 0); const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a2 = (i / 10) * Math.PI * 2 + Math.PI / 2, r2 = i % 2 ? 0.04 : 0.1; i ? st.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2) : st.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2); } x(new THREE.ExtrudeGeometry(st, { depth: 0.02, bevelEnabled: false }), gold, 0, 1.0, 0.21); }   // sinturon at sariling simbolo
  }
  let look = {};
  function setLook(a) {
    a = Object.assign({}, DEF, a || {});
    const changed = (k) => a[k] !== look[k];
    skin.color.set(pick(KID.SKIN, a.skin, "s2")); hairM.color.set(pick(KID.HAIRC, a.hairColor, "brown")); setEyes(a.eyes === "anime" ? "anime" : "round", pick(KID.EYEC, a.eyeColor, "brown"));
    topM.color.set(pick(KID.CLOTH, a.topColor, "green")); botM.color.set(pick(KID.CLOTH, a.bottomColor, "blue")); shoeM.color.set(pick(KID.CLOTH, a.shoes, "white"));
    trim.color.set(a.topColor === "white" ? 0xdfe3ee : 0xffffff);
    if (changed("hair") || changed("top") || changed("bottom")) {
      temp.forEach((g) => g.dispose()); temp.length = 0;
      buildHair(KID.HAIR.includes(a.hair) ? a.hair : "short"); buildClothes(a);
    }
    look = a;
  }

  // ---------- mga isinusuot (outfit.js): sumbrero, salamin, sa katawan, hawak ----------
  const anchors = { hat: new THREE.Group(), face: new THREE.Group(), body: new THREE.Group(), hand: new THREE.Group() };
  anchors.hat.position.set(0, 0.34, 0); anchors.hat.scale.setScalar(0.78); head.add(anchors.hat);   // mas malaki (0.66 → 0.78) para halata ang suot
  face.add(anchors.face);
  anchors.body.position.set(0, 0.86, 0.225); anchors.body.scale.setScalar(0.58); body.add(anchors.body);
  anchors.hand.position.set(0, -0.46, 0.02); anchors.hand.scale.setScalar(1); limbs[1].add(anchors.hand); anchors.hand.rotation.order = "ZYX";
  // Headphones na kasya sa ulo ng Kid: makapal na banda sa ibabaw ng buhok, malalaking tasa na may unan at makintab na takip
  const phones = new THREE.Group();
  {
    const band = mat({ color: 0x2a2a30, roughness: 0.35, metalness: 0.5 }), cup = mat({ color: 0xff5a36, roughness: 0.25, metalness: 0.3 }), pad = mat({ color: 0x1b1b20, roughness: 0.9 }), chrome = mat({ color: 0xe6e9f0, roughness: 0.15, metalness: 0.9 });
    const arc = new THREE.Mesh(geo(new THREE.TorusGeometry(0.5, 0.04, 10, 28, Math.PI)), band); arc.castShadow = true; phones.add(arc);
    const top = new THREE.Mesh(geo(new THREE.TorusGeometry(0.5, 0.055, 10, 14, Math.PI * 0.4)), pad); top.rotation.z = Math.PI * 0.3; phones.add(top);
    [-1, 1].forEach((k) => {
      const c = new THREE.Group(); c.position.set(k * 0.47, -0.04, 0); c.rotation.z = Math.PI / 2; phones.add(c);
      const shell = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.15, 0.17, 0.11, 22)), cup); shell.castShadow = true; c.add(shell);
      const cushion = new THREE.Mesh(geo(new THREE.TorusGeometry(0.14, 0.045, 10, 22)), pad); cushion.rotation.x = Math.PI / 2; cushion.position.y = k * 0.05; c.add(cushion);
      const capM = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 18)), chrome); capM.position.y = -k * 0.062; c.add(capM);
      const arm = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8)), chrome); arm.position.set(k * 0.49, 0.07, 0); phones.add(arm);
    });
    phones.position.y = 0.02;
  }
  const worn = {};
  function wear(slot, id) {
    if (!anchors[slot]) return;
    anchors[slot].clear(); worn[slot] = id || null;
    if (slot === "hat") { head.remove(phones); }
    if (!id) return;
    if (id === "headphones") { head.add(phones); return; }   // sariling sukat para sa ulo ng Kid (kita ang banda at mga tasa)
    const w = opts.gearGroup && opts.gearGroup(id) || buildWear(id); if (!w) return;
    const g = w.group || w;
    g.traverse((o) => { if (o.geometry) disposables.push(o.geometry); if (o.material) disposables.push(o.material); });
    anchors[slot === "hat" ? "hat" : (w.anchor || slot)].add(g);
  }
  function setGlow(on) { [skin, topM].forEach((m) => { m.emissive = new THREE.Color(on ? 0xffb300 : 0x000000); m.emissiveIntensity = on ? 0.25 : 0; }); }

  // ---------- Zzz ----------
  const zzz = new THREE.Group(); zzz.position.set(0.55, 1.95, 0); zzz.visible = false; group.add(zzz);
  const zMat = mat({ color: 0xffffff, emissive: 0x9bb6ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
  [0, 1, 2].forEach((i) => { const z = new THREE.Mesh(geo(new THREE.TorusGeometry(0.06 + i * 0.02, 0.012, 6, 4)), zMat); z.position.set(i * 0.12, i * 0.22, 0); zzz.add(z); });

  // ---------- estado at galaw ----------
  const st = { talk: 0, sit: false, move: null, moveT: 0, walk: 0, walkT: 0, heading: null, mood: "happy", asleep: false, blinkT: 2 + Math.random() * 3, blink: 0, jump: 0, eat: 0, spin: 0, wiggle: 0, look: new THREE.Vector2(), lookNow: new THREE.Vector2(), phase: Math.random() * 10 };
  function paintFace() {
    const sleepy = st.asleep || st.mood === "sleepy", closed = st.asleep || st.blink > 0 || (st.mood === "happy" && st.eat > 0);
    eyes.forEach((e) => { e.visible = !closed; e.scale.y = sleepy && !st.asleep ? 0.55 : 1; });
    lids.forEach((l) => { l.visible = closed; });
    Object.values(mouths).forEach((m) => { m.visible = false; });
    open.visible = (st.eat > 0 && Math.sin(st.eat * 30) > 0) || (st.talk > 0 && !st.asleep && Math.sin(st.talk * 24) > -0.2);
    if (!open.visible) (mouths[st.asleep ? "flat" : st.mood === "sad" || st.mood === "sick" ? "sad" : st.mood === "ok" ? "ok" : st.mood === "sleepy" ? "flat" : "happy"]).visible = true;
    zzz.visible = st.asleep;
  }
  function update(dt, t) {
    dt = Math.min(dt, 0.05);
    const slow = st.asleep ? 0.45 : st.mood === "sad" || st.mood === "sick" ? 0.7 : 1;
    const br = Math.sin((t + st.phase) * 2.2 * slow), S = 0.9;
    body.scale.set(S * (1 + br * 0.01), S * (1 - br * 0.012), S * (1 + br * 0.01));
    st.blinkT -= dt; if (st.blinkT <= 0) { st.blink = 0.13; st.blinkT = 2.5 + Math.random() * 3.5; }
    if (st.blink > 0) st.blink = Math.max(0, st.blink - dt);
    let y = 0;
    if (st.jump > 0) { st.jump = Math.max(0, st.jump - dt); const k = 1 - st.jump / 0.7; y = Math.sin(k * Math.PI) * 0.75; }
    if (st.wiggle > 0) { st.wiggle = Math.max(0, st.wiggle - dt); body.rotation.z = Math.sin(st.wiggle * 28) * 0.12 * (st.wiggle / 0.8); } else body.rotation.z *= 0.85;
    if (st.eat > 0) st.eat = Math.max(0, st.eat - dt);
    if (st.talk > 0) { st.talk = Math.max(0, st.talk - dt); open.scale.set(1, 0.5 + Math.abs(Math.sin(st.talk * 18)) * 0.5, 0.4); }
    let mv = null;
    if (st.move) { st.moveT -= dt; if (st.moveT <= 0) st.move = null; else mv = st.move; }
    const beat = t * 7.5;
    if (mv === "dance") { y += Math.abs(Math.sin(beat)) * 0.16; body.rotation.z = Math.sin(beat) * 0.16; }
    if (mv === "cheer") y += Math.max(0, Math.sin(t * 9)) * 0.3;
    if (mv === "budots") { y += Math.abs(Math.sin(t * 9)) * 0.1; body.rotation.z = Math.sin(t * 4.5) * 0.22; }
    if (mv === "robot") { const q = Math.floor(t * 4); y += (q % 2) * 0.05; body.rotation.z = [0, 0.1, 0, -0.1][q % 4]; }
    rig.position.y = y;
    // lakad: salitan ang binti at braso
    const walking = st.walk > 0.05 && y < 0.05;
    st.walkT += dt * (6 + st.walk * 8) * (st.walk > 0.05 ? 1 : 0);
    const sw = walking ? Math.sin(st.walkT) * (0.55 + st.walk * 0.3) : 0;
    legs.forEach((l, i) => { l.pv.rotation.x = (i ? -sw : sw) + (y > 0.05 ? (i ? 0.35 : -0.25) : 0); l.pv.rotation.z = 0; });
    if (st.sit) { legs.forEach((l) => { l.pv.rotation.x = -1.42; l.pv.rotation.z = 0; }); }   // nakaupo: pasulong ang mga binti
    if (walking) { body.position.y = Math.abs(Math.sin(st.walkT)) * 0.05; body.rotation.y = Math.sin(st.walkT) * 0.07; } else { body.position.y *= 0.8; body.rotation.y *= 0.8; }
    if (st.spin > 0) { st.spin = Math.max(0, st.spin - dt); group.rotation.y = (st.heading || 0) + (1 - st.spin / 0.9) * Math.PI * 2; }
    else if (st.heading !== null) { let d = st.heading - group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); group.rotation.y += d * Math.min(1, dt * 10); }
    else group.rotation.y += (st.look.x * 0.35 - group.rotation.y) * 0.08;
    st.lookNow.lerp(st.look, 0.1);
    head.rotation.y = st.lookNow.x * 0.35; head.rotation.x = -st.lookNow.y * 0.2 + (st.asleep ? 0.3 : 0);
    // braso
    const happy = st.mood === "happy" && !st.asleep && !walking;
    limbs[0].rotation.z = -0.28 + (happy ? Math.sin(t * 3) * 0.1 : 0); limbs[0].rotation.x = -sw * 0.9;
    limbs[1].rotation.z = worn.hand ? 0.2 : 0.28 - (st.jump > 0 ? 1.6 : happy ? Math.sin(t * 3 + 1) * 0.1 : 0);
    limbs[1].rotation.x = worn.hand ? -0.7 + sw * 0.2 : sw * 0.9;
    if (st.jump > 0 && !worn.hand) limbs[0].rotation.z = -0.28 - 1.6;
    if (st.sit && !mv) { limbs[0].rotation.x = limbs[1].rotation.x = -0.75; if (!worn.hand) { limbs[0].rotation.z = -0.12; limbs[1].rotation.z = 0.12; } }   // kamay sa tuhod / manibela
    if (mv === "dance") { limbs[0].rotation.z = -1.5 + Math.sin(beat) * 0.9; limbs[1].rotation.z = 1.5 + Math.sin(beat) * 0.9; limbs[0].rotation.x = limbs[1].rotation.x = 0; legs.forEach((l, i) => { l.pv.rotation.z = Math.max(0, Math.sin(beat + i * Math.PI)) * (i ? 0.35 : -0.35); }); }
    else if (mv === "budots") { const b = t * 9; limbs[0].rotation.z = -1 + Math.sin(b) * 1.1; limbs[1].rotation.z = 1 + Math.sin(b + Math.PI) * 1.1; limbs[0].rotation.x = Math.sin(b * 0.5) * 0.9; limbs[1].rotation.x = -Math.sin(b * 0.5) * 0.9; body.rotation.y = Math.sin(t * 4.5) * 0.35; legs.forEach((l, i) => { l.pv.rotation.x = Math.max(0, Math.sin(b + i * Math.PI)) * -0.5; }); }
    else if (mv === "robot") { const q = Math.floor(t * 4) % 8; limbs[0].rotation.z = [-1.57, -1.57, -0.3, -2.7, -1.57, -0.3, -1.57, -2.7][q]; limbs[1].rotation.z = [1.57, 0.3, 1.57, 2.7, 0.3, 1.57, 2.7, 1.57][q]; limbs[0].rotation.x = [0, -1.2, 0, 0, -1.2, 0, 0, 0][q]; limbs[1].rotation.x = [0, 0, -1.2, 0, 0, -1.2, 0, 0][q]; body.rotation.y = [0, 0.45, 0, -0.45, 0, 0.45, 0, -0.45][q]; legs.forEach((l, i) => { l.pv.rotation.x = q % 2 === i ? -0.4 : 0; }); }
    else if (mv === "piano") { const q = t * 9; limbs[0].rotation.x = -1.25 + Math.max(0, Math.sin(q)) * 0.25; limbs[1].rotation.x = -1.25 + Math.max(0, Math.sin(q + 2)) * 0.25; limbs[0].rotation.z = -0.1 + Math.sin(t * 1.3) * 0.12; limbs[1].rotation.z = 0.1 + Math.sin(t * 1.1) * 0.12; head.rotation.z = Math.sin(t * 2) * 0.12; }
    else if (mv === "highfive") { limbs[1].rotation.z = 2.7; limbs[1].rotation.x = -0.3; }
    else if (mv === "cheer") { limbs[0].rotation.z = -2.6 + Math.sin(t * 9) * 0.2; limbs[1].rotation.z = 2.6 - Math.sin(t * 9) * 0.2; }
    if (worn.hand) { anchors.hand.rotation.set(-limbs[1].rotation.x, 0, -limbs[1].rotation.z); anchors.hand.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); }); }
    anchors.body.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); });
    // 🚲 nagmamaneho (0.11.52): kamay sa manibela, paa sa pedal (bike: pumapadyak) o sa tapakan, humihilig kapag lumiliko
    if (st.ride) {
      const R = st.ride; R.ph += dt * (1 + R.v * 3.2);
      if (R.kind === "bike") legs.forEach((l, i) => { l.pv.rotation.x = -1.05 + Math.sin(R.ph + i * Math.PI) * (R.v > 0.2 ? 0.5 : 0.1); l.pv.rotation.z = 0; });
      else legs.forEach((l, i) => { l.pv.rotation.x = R.kind === "car" ? -1.42 : -1.2; l.pv.rotation.z = (i ? 1 : -1) * (R.kind === "scooter" ? 0.12 : 0); });
      limbs.forEach((L, i) => { L.rotation.x = R.kind === "car" ? -1.1 : R.kind === "bike" ? -1.15 : -1.3; L.rotation.z = (i ? 1 : -1) * 0.06; });
      body.rotation.x = R.kind === "bike" ? 0.28 : R.kind === "scooter" ? 0.1 : 0.04; body.rotation.z = -R.steer * 0.22;
      head.rotation.z = R.steer * 0.1;
    }
    body.rotation.x += ((mv === "bow" ? 0.55 : st.mood === "sad" || st.mood === "sick" || st.asleep ? 0.1 : 0) - body.rotation.x) * (mv === "bow" ? 0.15 : 0.05);
    if (zzz.visible) zzz.children.forEach((z, i) => { z.position.y = ((t * 0.4 + i * 0.33) % 1) * 0.7; z.material.opacity = 1 - ((t * 0.4 + i * 0.33) % 1); });
    paintFace();
  }
  setLook(opts.avatar); paintFace();
  return {
    group, update, setLook, kind: "kid",
    setMood(m) { st.mood = m; }, sleep(on) { st.asleep = !!on; },
    talk(sec) { st.talk = Math.max(0, Math.min(8, Number(sec) || 1.5)); }, talking() { return st.talk > 0; },
    jump() { if (st.jump < 0.15) st.jump = 0.7; }, height() { return rig.position.y; }, jumping() { return st.jump > 0; }, eat() { st.eat = 1.2; st.wiggle = 0.6; }, spin() { st.spin = 0.9; }, wiggle() { st.wiggle = 0.8; },
    lookAt(x, y) { st.look.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); },
    setColor() {}, setGear(id) { wear("hat", id === "none" ? null : id); }, wear, setGlow, worn,
    walk(speed, heading) { st.walk = Math.max(0, Math.min(1, speed || 0)); if (heading !== undefined) st.heading = heading; },
    face(heading) { st.heading = heading; },
    move(kind, sec) { st.move = kind || null; st.moveT = sec || 2; },
    moving() { return st.move; }, sitPose(on) { st.sit = !!on; },
    ridePose(kind, v = 0, steer = 0) { if (!kind) { st.ride = null; body.rotation.z = 0; head.rotation.z = 0; return; } st.ride = Object.assign(st.ride && st.ride.kind === kind ? st.ride : { ph: 0 }, { kind, v, steer }); },
    dispose() { disposables.forEach((d) => d.dispose && d.dispose()); temp.forEach((g) => g.dispose()); },
  };
}
