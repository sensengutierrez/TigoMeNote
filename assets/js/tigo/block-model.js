/* TigoMeNote · tigo/block-model.js — "Block": avatar na parang laruang kahon (kuwadradong ulo, katawan, braso at binti). Sariling disenyo.
   import { createBlock, BLOCK } from "./block-model.js"      (ginagamit ng pet-model.js createTigo kapag avatar.kind === "block")
   const b = createBlock({ avatar: { skin, body, face, hair, hairColor, top, topColor, bottom, bottomColor, shoes } }, group)
   Pareho ang API ng Kid (human-model.js): update, setLook, setMood, sleep, talk, jump, eat, spin, wiggle, lookAt, wear, setGlow, walk, face,
     move, sitPose, ridePose(kind, v, steer, grips), hold(pts), dispose. Pareho rin ang balakang (y 0.62) at balikat kaya tugma sa upuan, kama at sasakyan.
   BLOCK = mga pagpipilian (para sa avatar-ui.js): SKIN, BODY, FACE, HAIR, HAIRC, TOP, BOTTOM, CLOTH, PRESETS
   Ang mukha ay iginuguhit sa maliit na canvas (nagbabago ayon sa mood, kurap, nagsasalita/kumakain). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { buildWear } from "./outfit.js";
import { KID } from "./human-model.js";

export const BLOCK = {
  SKIN: { sun: "#f4c542", peach: "#ffd8b8", tan: "#e3a777", cocoa: "#9a6440", deep: "#5e3b26", mint: "#7fe0c4", sky: "#8cc8ff", lilac: "#c6a8ff", gray: "#b8bcc8" },
  BODY: ["classic", "slim", "chunky", "mini"],
  FACE: ["smile", "grin", "cool", "wink", "cute", "brave", "sleepy", "wow"],
  HAIR: ["none", "short", "spiky", "bob", "long", "bun", "mohawk", "cap"],
  HAIRC: KID.HAIRC,
  TOP: ["tee", "stripe", "hoodie", "jacket", "suit", "jersey", "armor"],
  BOTTOM: ["pants", "shorts", "jeans", "skirt"],
  CLOTH: KID.CLOTH,
  PRESETS: [
    { id: "builder", name: "Builder", icon: "🧱", skin: "sun", body: "classic", face: "smile", hair: "none", top: "tee", topColor: "blue", bottom: "pants", bottomColor: "green", shoes: "black" },
    { id: "cool", name: "Cool", icon: "😎", skin: "tan", body: "slim", face: "cool", hair: "spiky", hairColor: "black", top: "jacket", topColor: "black", bottom: "jeans", bottomColor: "blue", shoes: "white" },
    { id: "sweet", name: "Sweet", icon: "🍓", skin: "peach", body: "classic", face: "cute", hair: "bun", hairColor: "pink", top: "hoodie", topColor: "pink", bottom: "skirt", bottomColor: "white", shoes: "pink" },
    { id: "champ", name: "Champ", icon: "🏆", skin: "cocoa", body: "chunky", face: "grin", hair: "short", hairColor: "black", top: "jersey", topColor: "red", bottom: "shorts", bottomColor: "white", shoes: "red" },
    { id: "boss", name: "Boss", icon: "💼", skin: "peach", body: "slim", face: "brave", hair: "short", hairColor: "brown", top: "suit", topColor: "gray", bottom: "pants", bottomColor: "black", shoes: "black" },
    { id: "knight", name: "Knight", icon: "🛡️", skin: "deep", body: "chunky", face: "brave", hair: "mohawk", hairColor: "red", top: "armor", topColor: "gray", bottom: "pants", bottomColor: "gray", shoes: "brown" },
    { id: "alien", name: "Sprout", icon: "👽", skin: "mint", body: "mini", face: "wow", hair: "none", top: "stripe", topColor: "purple", bottom: "shorts", bottomColor: "purple", shoes: "white" },
    { id: "skater", name: "Skater", icon: "🛹", skin: "tan", body: "classic", face: "wink", hair: "cap", hairColor: "orange", top: "tee", topColor: "yellow", bottom: "shorts", bottomColor: "black", shoes: "orange" },
  ],
};
const DEF = BLOCK.PRESETS[0];
const pick = (map, k, d) => map[k] || map[d];
// sukat ng katawan: [lapad ng katawan, lapad ng braso/binti, taas ng binti]
const BODY_DIM = { classic: [0.76, 0.26, 1], slim: [0.62, 0.21, 1.06], chunky: [0.9, 0.3, 0.94], mini: [0.7, 0.25, 0.82] };

export function createBlock(opts = {}, group = new THREE.Group()) {
  const rig = new THREE.Group(), body = new THREE.Group();
  group.add(rig); rig.add(body); body.scale.setScalar(0.9);
  const disposables = [], temp = [];
  const mat = (o) => { const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.55 }, o)); disposables.push(m); return m; };
  const tg = (g) => { temp.push(g); return g; };
  const mesh = (g, m, x, y, z, parent = body) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const skin = mat({}), hairM = mat({ roughness: 0.7 }), topM = mat({}), botM = mat({}), shoeM = mat({ roughness: 0.45 }), trim = mat({ color: 0xffffff }), dark = mat({ color: 0x2a2a33 });

  // ---------- mga bahagi (ginagawa ulit kapag nagbago ang BODY) ----------
  const torsoG = new THREE.Group(), extra = new THREE.Group(); body.add(torsoG, extra);
  const legs = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(s * 0.17, 0.62, 0); body.add(pv); return { pv, s, parts: new THREE.Group() }; });
  legs.forEach((l) => l.pv.add(l.parts));
  const limbs = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(s * 0.42, 1.14, 0); pv.rotation.z = s * 0.12; body.add(pv); return pv; });
  const armParts = limbs.map((pv) => { const g = new THREE.Group(); pv.add(g); return g; });
  const head = new THREE.Group(); head.position.set(0, 1.56, 0); body.add(head);
  mesh(new RoundedBoxGeometry(0.62, 0.58, 0.58, 4, 0.1), skin, 0, 0, 0, head);
  const drop = (g) => { g.children.slice().forEach((o) => { if (o.geometry) o.geometry.dispose(); g.remove(o); }); };   // tanggal + tapon ng geometry
  const hair = new THREE.Group(); head.add(hair);

  // ---------- mukha (canvas) ----------
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const cx = cv.getContext("2d"), faceTex = new THREE.CanvasTexture(cv); faceTex.colorSpace = THREE.SRGBColorSpace; disposables.push(faceTex);
  const faceM = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true }); disposables.push(faceM);
  const faceP = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), faceM); faceP.position.set(0, -0.01, 0.292); head.add(faceP); disposables.push(faceP.geometry);
  const face = new THREE.Group(); face.position.set(0, -0.02, 0.3); face.scale.setScalar(0.62); head.add(face);   // para sa salamin (outfit)
  let faceKey = "";
  function drawFace(style, mood, closed, open) {
    const key = [style, mood, closed, open].join("|"); if (key === faceKey) return; faceKey = key;
    const c = cx; c.clearRect(0, 0, 128, 128); c.fillStyle = c.strokeStyle = "#231a17"; c.lineCap = "round"; c.lineJoin = "round";
    const sad = mood === "sad" || mood === "sick", sleepy = mood === "sleepy" || style === "sleepy";
    // mga mata
    const eye = (x, kind) => {
      if (closed || kind === "line") { c.lineWidth = 6; c.beginPath(); c.arc(x, 50, 9, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); return; }
      if (kind === "wink") { c.lineWidth = 6; c.beginPath(); c.moveTo(x - 10, 50); c.lineTo(x + 2, 46); c.lineTo(x - 10, 42); c.stroke(); return; }
      if (kind === "shade") return;
      const big = kind === "cute" || kind === "wow";
      c.beginPath(); c.ellipse(x, 48, big ? 10 : 7, big ? 13 : (sleepy ? 5 : 10), 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(x + 3, big ? 43 : 45, big ? 4 : 2.6, 0, Math.PI * 2); c.fill(); c.fillStyle = "#231a17";
    };
    const eyeKind = style === "cute" || style === "wow" ? style : style === "sleepy" ? "line" : "dot";
    if (style === "cool" && !closed) { c.fillStyle = "#15151c"; c.fillRect(24, 38, 34, 20); c.fillRect(70, 38, 34, 20); c.fillRect(56, 42, 16, 5); c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(30, 42, 10, 4); c.fillRect(76, 42, 10, 4); c.fillStyle = "#231a17"; }
    else { eye(42, eyeKind); eye(86, style === "wink" && !closed ? "wink" : eyeKind); }
    if (style === "brave") { c.lineWidth = 5; c.beginPath(); c.moveTo(30, 32); c.lineTo(52, 36); c.moveTo(98, 32); c.lineTo(76, 36); c.stroke(); }
    if (style === "cute" || style === "wow") { c.fillStyle = "rgba(255,110,140,.45)"; c.beginPath(); c.ellipse(28, 70, 9, 5, 0, 0, Math.PI * 2); c.ellipse(100, 70, 9, 5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#231a17"; }
    // bibig
    c.lineWidth = 6;
    if (open) { c.fillStyle = "#5a1a1a"; c.beginPath(); c.ellipse(64, 86, 11, 9, 0, 0, Math.PI * 2); c.fill(); return faceTex.needsUpdate = true; }
    c.beginPath();
    if (sad) c.arc(64, 98, 14, Math.PI * 1.15, Math.PI * 1.85);
    else if (style === "grin") { c.fillStyle = "#fff"; c.moveTo(42, 78); c.quadraticCurveTo(64, 104, 86, 78); c.closePath(); c.fill(); c.stroke(); return faceTex.needsUpdate = true; }
    else if (style === "wow") { c.arc(64, 86, 8, 0, Math.PI * 2); }
    else if (sleepy || mood === "ok") { c.moveTo(54, 86); c.lineTo(74, 86); }
    else if (style === "cool") { c.moveTo(50, 84); c.quadraticCurveTo(66, 92, 80, 80); }
    else c.arc(64, 74, 16, Math.PI * 0.2, Math.PI * 0.8);
    c.stroke(); faceTex.needsUpdate = true;
  }

  // ---------- katawan ayon sa BODY ----------
  function buildBody(type) {
    const [tw, lw, lh] = BODY_DIM[type] || BODY_DIM.classic;
    [torsoG, ...legs.map((l) => l.parts), ...armParts].forEach(drop);
    // binti: mula balakang (y 0.62) pababa; sapatos sa dulo
    legs.forEach((l) => {
      l.pv.position.x = l.s * (tw / 2 - lw / 2 - 0.02);
      const leg = mesh(new THREE.BoxGeometry(lw, 0.5 * lh, lw * 1.1), botM, 0, -0.25 * lh, 0, l.parts); leg.userData.leg = true;
      const low = mesh(new THREE.BoxGeometry(lw * 0.98, 0.06, lw * 1.08), botM, 0, -0.5 * lh + 0.08, 0, l.parts); low.userData.low = true;
      mesh(new THREE.BoxGeometry(lw * 1.04, 0.1, lw * 1.45), shoeM, 0, -0.56 * lh - 0.02, 0.05, l.parts);
      l.lh = lh;
    });
    mesh(new THREE.BoxGeometry(tw, 0.6, 0.38), topM, 0, 0.93, 0, torsoG).userData.torso = true;
    mesh(new THREE.BoxGeometry(tw * 0.98, 0.14, 0.37), botM, 0, 0.66, 0, torsoG);   // balakang
    mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), skin, 0, 1.25, 0, torsoG);           // leeg
    limbs.forEach((pv, i) => {
      pv.position.x = (i ? 1 : -1) * (tw / 2 + lw / 2 + 0.01);
      const g = armParts[i];
      mesh(new THREE.BoxGeometry(lw, 0.3, lw * 1.08), topM, 0, -0.1, 0, g).userData.sleeve = true;
      mesh(new THREE.BoxGeometry(lw * 0.96, 0.24, lw * 1.04), skin, 0, -0.36, 0, g).userData.fore = true;
    });
    // mas mababa ang binti (mini) = bumababa ang buong katawan para nakatapak pa rin
    rig.userData.drop = 0.62 * (1 - lh) * 0.9;
  }
  // ---------- buhok (kahon-kahon) ----------
  function buildHair(id) {
    drop(hair);
    const h = (w, hh, d, x, y, z, rz = 0) => { const o = mesh(new THREE.BoxGeometry(w, hh, d), hairM, x, y, z, hair); o.rotation.z = rz; return o; };
    if (id === "none") return;
    if (id === "cap") { h(0.66, 0.16, 0.64, 0, 0.3, -0.01).material = topM; const b = h(0.5, 0.04, 0.26, 0, 0.24, 0.4); b.material = topM; h(0.66, 0.2, 0.1, 0, 0.12, -0.3); return; }
    h(0.66, 0.14, 0.64, 0, 0.31, -0.01);           // ibabaw
    h(0.66, 0.34, 0.12, 0, 0.12, -0.3);            // likod
    if (id === "short") { h(0.66, 0.1, 0.1, 0, 0.22, 0.28); [-1, 1].forEach((s) => h(0.06, 0.2, 0.5, s * 0.33, 0.16, -0.03)); }
    if (id === "spiky") for (let i = 0; i < 5; i++) { const s = mesh(new THREE.ConeGeometry(0.1, 0.26, 4), hairM, -0.24 + i * 0.12, 0.46, 0.05 - (i % 2) * 0.12, hair); s.rotation.y = Math.PI / 4; }
    if (id === "bob") { [-1, 1].forEach((s) => h(0.1, 0.5, 0.56, s * 0.34, -0.02, -0.03)); h(0.66, 0.12, 0.1, 0, 0.22, 0.28); h(0.68, 0.5, 0.12, 0, -0.04, -0.31); }
    if (id === "long") { [-1, 1].forEach((s) => h(0.1, 0.7, 0.5, s * 0.34, -0.12, -0.05)); h(0.68, 0.86, 0.12, 0, -0.2, -0.31); h(0.66, 0.1, 0.1, 0, 0.22, 0.28); }
    if (id === "bun") { h(0.66, 0.1, 0.1, 0, 0.22, 0.28); h(0.26, 0.22, 0.26, 0, 0.48, -0.08); }
    if (id === "mohawk") { for (let i = 0; i < 4; i++) h(0.12, 0.2 + (i === 1 || i === 2 ? 0.06 : 0), 0.14, 0, 0.44, 0.2 - i * 0.15); }
  }
  // ---------- damit ----------
  function buildClothes(a) {
    drop(extra); [...legs.map((l) => l.parts), ...armParts].forEach((g) => g.children.slice().forEach((o) => { if (o.userData.cloth) { g.remove(o); o.geometry.dispose(); } }));
    const [tw, lw] = BODY_DIM[a.body] || BODY_DIM.classic, top = BLOCK.TOP.includes(a.top) ? a.top : "tee", bottom = BLOCK.BOTTOM.includes(a.bottom) ? a.bottom : "pants";
    const x = (w, hh, d, m, px, py, pz) => mesh(new THREE.BoxGeometry(w, hh, d), m, px, py, pz, extra);
    const longSleeve = top === "hoodie" || top === "jacket" || top === "suit" || top === "armor";
    armParts.forEach((g) => g.children.forEach((o) => { if (o.userData.fore) o.material = longSleeve ? topM : skin; }));
    legs.forEach((l) => l.parts.children.forEach((o) => { if (o.userData.leg) o.material = bottom === "shorts" || bottom === "skirt" ? skin : botM; if (o.userData.low) o.material = bottom === "pants" || bottom === "jeans" ? botM : skin; }));
    if (bottom === "shorts") legs.forEach((l) => { mesh(new THREE.BoxGeometry(lw * 1.04, 0.2, lw * 1.14), botM, 0, -0.1, 0, l.parts).userData.cloth = true; });
    if (bottom === "jeans") legs.forEach((l) => { mesh(new THREE.BoxGeometry(lw * 1.02, 0.03, lw * 1.12), dark, 0, -0.04, 0, l.parts).userData.cloth = true; });
    if (bottom === "skirt") { const s = new THREE.Mesh(tg(new THREE.CylinderGeometry(tw * 0.55, tw * 0.75, 0.3, 4, 1)), botM); s.rotation.y = Math.PI / 4; s.position.set(0, 0.53, 0); s.castShadow = true; extra.add(s); }
    if (top === "stripe") [1.08, 0.94, 0.8].forEach((y) => x(tw + 0.01, 0.05, 0.39, trim, 0, y, 0));
    if (top === "hoodie") { x(tw * 0.8, 0.26, 0.14, topM, 0, 1.2, -0.24); x(tw * 0.5, 0.14, 0.02, trim, 0, 0.82, 0.2).material = topM; [-0.07, 0.07].forEach((sx) => x(0.02, 0.16, 0.02, trim, sx, 1.08, 0.2)); }
    if (top === "jacket") { x(0.2, 0.56, 0.02, trim, 0, 0.94, 0.195); x(0.04, 0.56, 0.03, dark, 0, 0.94, 0.2); }
    if (top === "suit") { x(0.22, 0.24, 0.02, trim, 0, 1.08, 0.195); const tie = x(0.07, 0.3, 0.02, mat({ color: 0xe23b4b }), 0, 0.98, 0.205); tie.material.color.set(0xe23b4b); [0.98, 0.86, 0.74].forEach((y) => x(0.04, 0.04, 0.02, dark, -0.16, y, 0.2)); }
    if (top === "jersey") { const t = new THREE.Mesh(tg(new THREE.PlaneGeometry(0.32, 0.32)), jerseyMat()); t.position.set(0, 0.95, 0.195); extra.add(t); [-1, 1].forEach((s) => x(0.04, 0.6, 0.39, trim, s * (tw / 2 - 0.02), 0.93, 0)); }
    if (top === "armor") { const g = mat({ color: 0xf2c14e, metalness: 0.6, roughness: 0.3 }); x(tw + 0.04, 0.12, 0.42, g, 0, 1.18, 0); x(0.3, 0.3, 0.02, g, 0, 0.95, 0.2); armParts.forEach((ap) => { mesh(new THREE.BoxGeometry(lw * 1.3, 0.12, lw * 1.3), g, 0, 0, 0, ap).userData.cloth = true; }); }
  }
  let jerseyM = null;
  function jerseyMat() {
    if (jerseyM) return jerseyM;
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("7", 32, 34);
    const t = new THREE.CanvasTexture(c); disposables.push(t); jerseyM = new THREE.MeshBasicMaterial({ map: t, transparent: true }); disposables.push(jerseyM); return jerseyM;
  }
  let look = {};
  function setLook(a) {
    a = Object.assign({}, DEF, a || {});
    skin.color.set(pick(BLOCK.SKIN, a.skin, "sun")); hairM.color.set(pick(BLOCK.HAIRC, a.hairColor, "brown"));
    topM.color.set(pick(BLOCK.CLOTH, a.topColor, "blue")); botM.color.set(pick(BLOCK.CLOTH, a.bottomColor, "green")); shoeM.color.set(pick(BLOCK.CLOTH, a.shoes, "black"));
    trim.color.set(a.topColor === "white" ? 0xdfe3ee : 0xffffff);
    if (a.body !== look.body) { buildBody(BLOCK.BODY.includes(a.body) ? a.body : "classic"); look = {}; }
    if (a.hair !== look.hair) buildHair(BLOCK.HAIR.includes(a.hair) ? a.hair : "none");
    if (a.top !== look.top || a.bottom !== look.bottom || a.body !== look.body) buildClothes(a);
    look = a; faceKey = "";
  }

  // ---------- mga isinusuot (outfit.js) ----------
  const anchors = { hat: new THREE.Group(), face: new THREE.Group(), body: new THREE.Group(), hand: new THREE.Group() };
  anchors.hat.position.set(0, 0.3, 0); anchors.hat.scale.setScalar(0.8); head.add(anchors.hat);
  face.add(anchors.face);
  anchors.body.position.set(0, 0.86, 0.2); anchors.body.scale.setScalar(0.58); body.add(anchors.body);
  anchors.hand.position.set(0, -0.5, 0.02); limbs[1].add(anchors.hand); anchors.hand.rotation.order = "ZYX";
  const worn = {};
  function wear(slot, id) {
    if (!anchors[slot]) return;
    anchors[slot].clear(); worn[slot] = id || null;
    if (!id) return;
    const w = opts.gearGroup && opts.gearGroup(id) || buildWear(id); if (!w) return;
    const g = w.group || w;
    g.traverse((o) => { if (o.geometry) disposables.push(o.geometry); if (o.material) disposables.push(o.material); });
    anchors[slot === "hat" ? "hat" : (w.anchor || slot)].add(g);
  }
  function setGlow(on) { [skin, topM].forEach((m) => { m.emissive = new THREE.Color(on ? 0xffb300 : 0x000000); m.emissiveIntensity = on ? 0.25 : 0; }); }

  // ---------- Zzz ----------
  const zzz = new THREE.Group(); zzz.position.set(0.55, 1.95, 0); zzz.visible = false; group.add(zzz);
  const zMat = mat({ color: 0xffffff, emissive: 0x9bb6ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
  [0, 1, 2].forEach((i) => { const g = new THREE.TorusGeometry(0.06 + i * 0.02, 0.012, 6, 4); disposables.push(g); const z = new THREE.Mesh(g, zMat); z.position.set(i * 0.12, i * 0.22, 0); zzz.add(z); });

  // ---------- estado at galaw (kapareho ng Kid) ----------
  const st = { talk: 0, sit: false, move: null, moveT: 0, walk: 0, walkT: 0, heading: null, mood: "happy", asleep: false, blinkT: 2 + Math.random() * 3, blink: 0, jump: 0, eat: 0, spin: 0, wiggle: 0, look: new THREE.Vector2(), lookNow: new THREE.Vector2(), phase: Math.random() * 10, hold: null, ride: null };
  const _w = new THREE.Vector3();
  function reach(pts) {
    body.updateWorldMatrix(true, false);
    const loc = pts.map((p) => body.worldToLocal(_w.copy(p)).clone());
    limbs.forEach((L) => {
      const side = Math.sign(L.position.x), p = loc.slice().sort((a, b) => (side * b.x) - (side * a.x))[0];
      const d = p.clone().sub(L.position).normalize();
      L.rotation.x = Math.atan2(-d.z, -d.y); L.rotation.z = Math.asin(Math.max(-1, Math.min(1, d.x)));
    });
  }
  function update(dt, t) {
    dt = Math.min(dt, 0.05);
    const slow = st.asleep ? 0.45 : st.mood === "sad" || st.mood === "sick" ? 0.7 : 1;
    const br = Math.sin((t + st.phase) * 2.2 * slow), S = 0.9;
    body.scale.set(S, S * (1 - br * 0.008), S);
    st.blinkT -= dt; if (st.blinkT <= 0) { st.blink = 0.13; st.blinkT = 2.5 + Math.random() * 3.5; }
    if (st.blink > 0) st.blink = Math.max(0, st.blink - dt);
    let y = -(rig.userData.drop || 0);
    if (st.jump > 0) { st.jump = Math.max(0, st.jump - dt); const k = 1 - st.jump / 0.7; y += Math.sin(k * Math.PI) * 0.75; }
    if (st.wiggle > 0) { st.wiggle = Math.max(0, st.wiggle - dt); body.rotation.z = Math.sin(st.wiggle * 28) * 0.12 * (st.wiggle / 0.8); } else body.rotation.z *= 0.85;
    if (st.eat > 0) st.eat = Math.max(0, st.eat - dt);
    if (st.talk > 0) st.talk = Math.max(0, st.talk - dt);
    let mv = null;
    if (st.move) { st.moveT -= dt; if (st.moveT <= 0) st.move = null; else mv = st.move; }
    const beat = t * 7.5;
    if (mv === "dance") { y += Math.abs(Math.sin(beat)) * 0.16; body.rotation.z = Math.sin(beat) * 0.16; }
    if (mv === "cheer") y += Math.max(0, Math.sin(t * 9)) * 0.3;
    if (mv === "budots") { y += Math.abs(Math.sin(t * 9)) * 0.1; body.rotation.z = Math.sin(t * 4.5) * 0.22; }
    if (mv === "robot") { const q = Math.floor(t * 4); y += (q % 2) * 0.05; body.rotation.z = [0, 0.1, 0, -0.1][q % 4]; }
    rig.position.y = y;
    const air = y + (rig.userData.drop || 0);
    const walking = st.walk > 0.05 && air < 0.05;
    st.walkT += dt * (6 + st.walk * 8) * (st.walk > 0.05 ? 1 : 0);
    const sw = walking ? Math.sin(st.walkT) * (0.55 + st.walk * 0.3) : 0;
    legs.forEach((l, i) => { l.pv.rotation.x = (i ? -sw : sw) + (air > 0.05 ? (i ? 0.35 : -0.25) : 0); l.pv.rotation.z = 0; });
    if (st.sit) legs.forEach((l) => { l.pv.rotation.x = -1.5; });
    if (walking) { body.position.y = Math.abs(Math.sin(st.walkT)) * 0.04; } else body.position.y *= 0.8;
    if (st.spin > 0) { st.spin = Math.max(0, st.spin - dt); group.rotation.y = (st.heading || 0) + (1 - st.spin / 0.9) * Math.PI * 2; }
    else if (st.heading !== null) { let d = st.heading - group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); group.rotation.y += d * Math.min(1, dt * 10); }
    else group.rotation.y += (st.look.x * 0.35 - group.rotation.y) * 0.08;
    st.lookNow.lerp(st.look, 0.1);
    head.rotation.y = st.lookNow.x * 0.35; head.rotation.x = -st.lookNow.y * 0.2 + (st.asleep ? 0.3 : 0);
    const happy = st.mood === "happy" && !st.asleep && !walking;
    limbs[0].rotation.z = -0.12 + (happy ? Math.sin(t * 3) * 0.06 : 0); limbs[0].rotation.x = -sw * 0.9;
    limbs[1].rotation.z = worn.hand ? 0.1 : 0.12 - (st.jump > 0 ? 1.6 : happy ? Math.sin(t * 3 + 1) * 0.06 : 0);
    limbs[1].rotation.x = worn.hand ? -0.7 + sw * 0.2 : sw * 0.9;
    if (st.jump > 0 && !worn.hand) limbs[0].rotation.z = -0.12 - 1.6;
    if (st.sit && !mv) { limbs[0].rotation.x = limbs[1].rotation.x = -0.75; limbs[0].rotation.z = -0.05; limbs[1].rotation.z = 0.05; }
    if (mv === "dance") { limbs[0].rotation.z = -1.5 + Math.sin(beat) * 0.9; limbs[1].rotation.z = 1.5 + Math.sin(beat) * 0.9; limbs[0].rotation.x = limbs[1].rotation.x = 0; }
    else if (mv === "budots") { const b = t * 9; limbs[0].rotation.z = -1 + Math.sin(b) * 1.1; limbs[1].rotation.z = 1 + Math.sin(b + Math.PI) * 1.1; limbs[0].rotation.x = Math.sin(b * 0.5) * 0.9; limbs[1].rotation.x = -Math.sin(b * 0.5) * 0.9; }
    else if (mv === "robot") { const q = Math.floor(t * 4) % 8; limbs[0].rotation.z = [-1.57, -1.57, -0.3, -2.7, -1.57, -0.3, -1.57, -2.7][q]; limbs[1].rotation.z = [1.57, 0.3, 1.57, 2.7, 0.3, 1.57, 2.7, 1.57][q]; limbs[0].rotation.x = [0, -1.2, 0, 0, -1.2, 0, 0, 0][q]; limbs[1].rotation.x = [0, 0, -1.2, 0, 0, -1.2, 0, 0][q]; }
    else if (mv === "piano" || mv === "type") { const q = t * (mv === "type" ? 14 : 9); limbs[0].rotation.x = -1.25 + Math.max(0, Math.sin(q)) * 0.25; limbs[1].rotation.x = -1.25 + Math.max(0, Math.sin(q + 2)) * 0.25; limbs[0].rotation.z = -0.05; limbs[1].rotation.z = 0.05; head.rotation.z = Math.sin(t * 2) * 0.1; }
    else if (mv === "highfive") { limbs[1].rotation.z = 2.7; limbs[1].rotation.x = -0.3; }
    else if (mv === "cheer") { limbs[0].rotation.z = -2.6 + Math.sin(t * 9) * 0.2; limbs[1].rotation.z = 2.6 - Math.sin(t * 9) * 0.2; }
    if (st.ride) {
      const R = st.ride; R.ph += dt * (1 + R.v * 3.2);
      if (R.kind === "bike") legs.forEach((l, i) => { l.pv.rotation.x = -1.05 + Math.sin(R.ph + i * Math.PI) * (R.v > 0.2 ? 0.5 : 0.1); });
      else legs.forEach((l) => { l.pv.rotation.x = R.kind === "car" ? -1.45 : -1.2; });
      body.rotation.x = R.kind === "bike" ? 0.22 : R.kind === "scooter" ? 0.12 : 0.04; body.rotation.z = -R.steer * 0.22; head.rotation.z = R.steer * 0.1;
      if (R.grips && R.grips.length === 2) reach(R.grips);
    }
    if (st.hold && !st.ride && !mv) reach(st.hold);
    if (worn.hand) { anchors.hand.rotation.set(-limbs[1].rotation.x, 0, -limbs[1].rotation.z); anchors.hand.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); }); }
    anchors.body.children.forEach((c) => { if (c.userData.tick) c.userData.tick(t, st.walk); });
    if (!st.ride) body.rotation.x += ((mv === "bow" ? 0.55 : st.mood === "sad" || st.mood === "sick" || st.asleep ? 0.1 : 0) - body.rotation.x) * (mv === "bow" ? 0.15 : 0.05);
    if (zzz.visible) zzz.children.forEach((z, i) => { z.position.y = ((t * 0.4 + i * 0.33) % 1) * 0.7; z.material.opacity = 1 - ((t * 0.4 + i * 0.33) % 1); });
    paintFace();
  }
  function paintFace() {
    const closed = st.asleep || st.blink > 0 || (st.mood === "happy" && st.eat > 0);
    const open = (st.eat > 0 && Math.sin(st.eat * 30) > 0) || (st.talk > 0 && !st.asleep && Math.sin(st.talk * 24) > -0.2);
    drawFace(look.face || "smile", st.asleep ? "sleepy" : st.mood, closed, open);
    zzz.visible = st.asleep;
  }
  setLook(opts.avatar); paintFace();
  return {
    group, update, setLook, kind: "block",
    setMood(m) { st.mood = m; }, sleep(on) { st.asleep = !!on; },
    talk(sec) { st.talk = Math.max(0, Math.min(8, Number(sec) || 1.5)); }, talking() { return st.talk > 0; },
    jump() { if (st.jump < 0.15) st.jump = 0.7; }, height() { return Math.max(0, rig.position.y + (rig.userData.drop || 0)); }, jumping() { return st.jump > 0; }, eat() { st.eat = 1.2; st.wiggle = 0.6; }, spin() { st.spin = 0.9; }, wiggle() { st.wiggle = 0.8; },
    lookAt(x, y) { st.look.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); },
    setColor() {}, setGear(id) { wear("hat", id === "none" ? null : id); }, wear, setGlow, worn,
    walk(speed, heading) { st.walk = Math.max(0, Math.min(1, speed || 0)); if (heading !== undefined) st.heading = heading; },
    face(heading) { st.heading = heading; },
    move(kind, sec) { st.move = kind || null; st.moveT = sec || 2; },
    moving() { return st.move; }, sitPose(on) { st.sit = !!on; },
    ridePose(kind, v = 0, steer = 0, grips = null) { if (!kind) { st.ride = null; body.rotation.z = 0; head.rotation.z = 0; return; } st.ride = Object.assign(st.ride && st.ride.kind === kind ? st.ride : { ph: 0 }, { kind, v, steer, grips }); },
    hold(pts) { st.hold = pts && pts.length === 2 ? pts : null; },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); disposables.forEach((d) => d.dispose && d.dispose()); temp.forEach((g) => g.dispose()); },
  };
}
