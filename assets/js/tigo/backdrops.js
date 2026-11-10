/* TigoMeNote · tigo/backdrops.js — mga lugar ni Tigo (3D) at ang bahay kubo na tinutulugan niya
   import { buildBackdrop, RADIUS, HOUSE } from "./backdrops.js"
   buildBackdrop(id) → { group, house, obstacles, night(on), update(t), dispose() }   id = island | beach | coral | snow | clouds | desert | moon
   RADIUS = hanggang saan puwedeng maglakad si Tigo. PLAT = laki ng lupa. HOUSE = kung nasaan ang bahay (r = hindi matatagos) at ang pinto (para matulog).
   obstacles = [{ x, z, r }] na iniikutan ni Tigo (lawa, taniman, poste ng ilaw).
   0.11.42–43: mas malaking isla (2.9 → 4.0 → 5.4), may upuan at karatula, mas detalyadong bahay kubo (balkonahe, bintana, paso ng bulaklak, ilaw), bakod sa gilid,
   taniman, lawa na may lily, daanang bato, at mga ilaw na bumubukas kapag gabi (parol, poste, ilaw sa bubong).
   Sariling disenyo lahat. */
import * as THREE from "../../vendor/three/three.module.min.js";

export const RADIUS = 5.4;
export const PLAT = 6.1;
const HS = 1.25, HROT = -0.6;   // laki at ikot ng bahay
export const HOUSE = { x: 3.4, z: -3.1, r: 1.2, door: { x: 3.4 + Math.sin(HROT) * 1.3, z: -3.1 + Math.cos(HROT) * 1.3 } };

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const put = (g, m, x, y, z, shadow = true) => { m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; };
// Maraming magkakaparehong piraso (bulaklak, bakod, bato) = isang InstancedMesh (isang draw call lang, magaan sa phone)
const _o = new THREE.Object3D();
function inst(g, geo, mat, items, shadow = false) {
  const m = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => { _o.position.set(it[0], it[1], it[2]); _o.rotation.set(0, it[3] || 0, 0); const sc = it[4] || [1, 1, 1]; _o.scale.set(sc[0], sc[1], sc[2]); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); });
  m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; g.add(m); return m;
}
// Liwanag sa lupa kapag gabi: malabong bilog (additive), mas magaan kaysa tunay na PointLight
let _glowTex = null;
function groundGlow(g, x, z, r, lamps, n = 0.55) {
  if (!_glowTex) {
    const c = document.createElement("canvas"); c.width = c.height = 64; const k = c.getContext("2d"), gr = k.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,205,120,1)"); gr.addColorStop(0.5, "rgba(255,190,100,.35)"); gr.addColorStop(1, "rgba(255,180,90,0)");
    k.fillStyle = gr; k.fillRect(0, 0, 64, 64); _glowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ map: _glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.025, z); m.userData.n = n; m.visible = false; g.add(m); lamps.push(m);
}
const rand = (seed) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

function platform(g, top, side, r = PLAT) {
  const a = put(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.12, 0.3, 72), M(top)), 0, -0.15, 0, false);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r - 0.6, 0.8, 72), M(side, { roughness: 1 })), 0, -0.7, 0, false);
  return a;
}
// Bahay kubo: kawayan na poste, dingding na sawali, bubong na nipa, balkonahe, bintana, paso ng bulaklak, at mga ilaw
// lit = listahan ng [material, liwanag kapag gabi]; lamps = mga liwanag sa lupa na lumilitaw lang kapag gabi
function kubo(g, lit, lamps) {
  const h = new THREE.Group(); h.position.set(HOUSE.x, 0, HOUSE.z); h.rotation.y = HROT; h.scale.setScalar(HS);
  const bamboo = M(0xc8a165, { roughness: 0.7 }), dark = M(0x8a6238, { roughness: 0.8 }), wall = M(0xe2c48f, { roughness: 0.95 }), nipa = M(0x9c7a3c, { roughness: 1 }), nipa2 = M(0x86672f, { roughness: 1 });
  const box = (w, hh, d, m, x, y, z, sh = true) => put(h, new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m), x, y, z, sh);
  const pole = (r, len, m, x, y, z) => put(h, new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), m), x, y, z);
  // mga poste (hanggang bubong) at sahig
  [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]].forEach(([x, z]) => pole(0.06, 1.34, bamboo, x, 0.67, z));
  [[-0.6, 0.86], [0.6, 0.86]].forEach(([x, z]) => pole(0.045, 1.3, bamboo, x, 0.65, z));   // poste ng balkonahe
  box(1.36, 0.08, 1.16, bamboo, 0, 0.5, 0);
  box(1.36, 0.06, 0.4, bamboo, 0, 0.5, 0.72);                                             // balkonahe
  [-1, 1].forEach((k) => { const c = box(0.03, 0.03, 0.9, dark, k * 0.6, 0.27, 0, false); c.rotation.x = k * 0.5; });   // tukod sa ilalim
  // dingding + guhit ng sawali
  box(1.2, 0.78, 1.0, wall, 0, 0.93, 0);
  for (let i = 0; i < 3; i++) box(1.22, 0.02, 1.02, bamboo, 0, 0.7 + i * 0.22, 0, false);
  // pinto (may hamba at hawakan)
  box(0.42, 0.58, 0.03, bamboo, 0, 0.83, 0.5, false);
  box(0.34, 0.52, 0.03, M(0x7a5530), 0, 0.81, 0.515, false);
  put(h, new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M(0xf2c14e, { metalness: 0.5, roughness: 0.4 })), 0.11, 0.8, 0.54, false);
  // mga bintana (nagliliwanag kapag gabi), may hamba, krus at paso ng bulaklak
  const glow = M(0xffe2a6, { emissive: 0xffa000, emissiveIntensity: 0 }); lit.push([glow, 1.6]);
  const petal = [M(0xff6f91), M(0xffd166), M(0xffffff)];
  const win = (x, y, z, ry) => {
    const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = ry; h.add(w);
    put(w, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.02), bamboo), 0, 0, 0, false);
    put(w, new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.03), glow), 0, 0, 0.005, false);
    put(w, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.04), bamboo), 0, 0, 0.008, false);
    put(w, new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.04), bamboo), 0, 0, 0.008, false);
    put(w, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.08), dark), 0, -0.18, 0.04, false);   // paso
    for (let i = 0; i < 3; i++) put(w, new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), petal[i]), -0.1 + i * 0.1, -0.13, 0.05, false);
  };
  win(0.4, 1.0, 0.505, 0); win(-0.4, 1.0, 0.505, 0); win(0.605, 0.98, 0, Math.PI / 2); win(-0.605, 0.98, 0, -Math.PI / 2);
  // rehas ng balkonahe (bukas sa gitna para sa hagdan)
  [-1, 1].forEach((k) => {
    box(0.36, 0.03, 0.03, bamboo, k * 0.42, 0.78, 0.9, false);
    for (let i = 0; i < 3; i++) pole(0.014, 0.26, bamboo, k * (0.28 + i * 0.13), 0.65, 0.9);
    box(0.03, 0.03, 0.36, bamboo, k * 0.6, 0.78, 0.72, false);
  });
  // bubong na nipa: dalawang patong + tuktok
  const roof = put(h, new THREE.Mesh(new THREE.ConeGeometry(1.18, 0.5, 4, 1), nipa2), 0, 1.52, 0.1); roof.rotation.y = Math.PI / 4; roof.scale.set(1.12, 1, 1.22);
  const roof2 = put(h, new THREE.Mesh(new THREE.ConeGeometry(0.86, 0.62, 4, 1), nipa), 0, 1.84, 0.05); roof2.rotation.y = Math.PI / 4; roof2.scale.set(1.1, 1, 1.1);
  put(h, new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), bamboo), 0, 2.17, 0.05);
  // hagdan
  for (let i = 0; i < 3; i++) box(0.4, 0.04, 0.12, bamboo, 0, 0.12 + i * 0.14, 0.98 + (2 - i) * 0.12);
  // parol sa balkonahe + tunay na ilaw kapag gabi
  const parol = M(0xfff1c4, { emissive: 0xffb347, emissiveIntensity: 0.15 }); lit.push([parol, 2.4]);
  pole(0.006, 0.16, dark, 0.34, 1.2, 0.86);
  put(h, new THREE.Mesh(new THREE.OctahedronGeometry(0.07), parol), 0.34, 1.08, 0.86, false);
  // makukulay na ilaw sa gilid ng bubong
  [0xff6f61, 0xffd166, 0x6fd3ff, 0x9be564, 0xff9ad5].forEach((c, i) => {
    const m = M(c, { emissive: c, emissiveIntensity: 0.1 }); lit.push([m, 2]);
    put(h, new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), m), -0.56 + i * 0.28, 1.3 - Math.abs(i - 2) * 0.012, 1.02, false);
  });
  g.add(h);
  return { group: h, glow };
}
// Poste ng ilaw (parol na kawayan): bukas kapag gabi
function lantern(g, x, z, lit, lamps) {
  const m = M(0xfff1c4, { emissive: 0xffb347, emissiveIntensity: 0.12 }); lit.push([m, 2.6]);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 8), M(0xb08a55)), x, 0.45, z);
  put(g, new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.16), M(0x8a6238)), x, 0.9, z);
  put(g, new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.11), m), x, 0.99, z, false);
  put(g, new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 4), M(0x8a6238)), x, 1.1, z).rotation.y = Math.PI / 4;
  groundGlow(g, x, z, 1.15, lamps);
  return { x, z, r: 0.22 };
}
// Daanang bato mula sa pinto papunta sa gitna
function path(g, col = 0xcfc8ba) {
  const R = rand(21), m = M(col, { roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const k = 0.08 + i * 0.105, st = put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.17 + R() * 0.05, 0.19, 0.03, 9), m), HOUSE.door.x * (1 - k) + 0.2 * k + (R() - 0.5) * 0.12, 0.012, HOUSE.door.z * (1 - k) + 0.5 * k + (R() - 0.5) * 0.12, false);
    st.rotation.y = R() * 3; st.scale.z = 0.8;
  }
}
// Bakod na kahoy sa gilid ng isla (bukas sa harap para kita si Tigo)
function fence(g, col = 0xf3ead7) {
  const m = M(col, { roughness: 0.9 }), r = PLAT - 0.22, n = 40, a0 = Math.PI * 0.86, a1 = Math.PI * 2.14;
  const posts = [], caps = [], rails = [];
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n), x = Math.cos(a) * r, z = Math.sin(a) * r;
    posts.push([x, 0.21, z]); caps.push([x, 0.43, z]);
    if (prev) { const len = Math.hypot(x - prev.x, z - prev.z), ry = -Math.atan2(z - prev.z, x - prev.x); [0.16, 0.31].forEach((y) => rails.push([(x + prev.x) / 2, y, (z + prev.z) / 2, ry, [len, 1, 1]])); }
    prev = { x, z };
  }
  inst(g, new THREE.CylinderGeometry(0.035, 0.04, 0.42, 6), m, posts, true);
  inst(g, new THREE.SphereGeometry(0.045, 6, 4), m, caps);
  inst(g, new THREE.BoxGeometry(1, 0.035, 0.02), m, rails);
}
// Taniman: dalawang kama ng lupa, mga punla at gulay
function garden(g, x, z, ry = 0) {
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; g.add(G);
  const soil = M(0x8a5a3c, { roughness: 1 }), edge = M(0xc8a165), leaf = M(0x4caf50), veg = [M(0xff5a4f), M(0xff9f1c), M(0xf7d94c)];
  [-0.3, 0.3].forEach((dz, r) => {
    put(G, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.42), edge), 0, 0.04, dz);
    put(G, new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.09, 0.34), soil), 0, 0.05, dz, false);
    inst(G, new THREE.ConeGeometry(0.07, 0.2, 6), leaf, [0, 1, 2, 3, 4].map((i) => [-0.4 + i * 0.2, 0.19, dz]), true);
    for (let i = r; i < 5; i += 2) put(G, new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), veg[(i + r) % 3]), -0.35 + i * 0.2, 0.14, dz + 0.07, false);
  });
  // pandilig
  put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 10), M(0x6fb7e9, { roughness: 0.5 })), 0.68, 0.07, 0.25);
  const sp = put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), M(0x6fb7e9)), 0.78, 0.1, 0.25, false); sp.rotation.z = -0.9;
  return { x, z, r: 0.78 };
}
// Lawa: tubig, mga bato sa gilid, lily at tambo
function pond(g, x, z, r = 0.9) {
  const P = new THREE.Group(); P.position.set(x, 0, z); g.add(P);
  const water = put(P, new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.88 })), 0, 0.012, 0, false);
  water.rotation.x = -Math.PI / 2; water.scale.y = 0.82;
  const R = rand(4), rock = M(0xb8b2a8, { roughness: 1 });
  inst(P, new THREE.DodecahedronGeometry(1), rock, Array.from({ length: 13 }, (_, i) => { const a = (i / 13) * Math.PI * 2, s = 0.1 + R() * 0.07; return [Math.cos(a) * r, 0.03, Math.sin(a) * r * 0.82, R() * 3, [s, s * 0.55, s]]; }), true);
  const pad = M(0x3fa34d, { roughness: 0.7 }), bloom = M(0xff9ad5, { roughness: 0.5 }), lilies = [];
  [[-0.3, 0.1], [0.25, -0.25], [0.2, 0.3]].forEach(([lx, lz], i) => {
    const l = new THREE.Group(); l.position.set(lx, 0.02, lz); P.add(l); lilies.push(l);
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14, 0.4, Math.PI * 2 - 0.8), pad); c.rotation.x = -Math.PI / 2; c.rotation.z = i * 2; l.add(c);
    if (i !== 1) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 6), bloom); f.position.y = 0.05; f.rotation.x = Math.PI; l.add(f); }
  });
  const reed = M(0x6a9a3a), tip = M(0x7a5530);
  [[-0.72, -0.4], [-0.8, -0.28], [-0.66, -0.52]].forEach(([rx, rz], i) => {
    put(P, new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5 + i * 0.08, 5), reed), rx, 0.25 + i * 0.04, rz);
    put(P, new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.08, 4, 6), tip), rx, 0.52 + i * 0.08, rz, false);
  });
  return { ob: { x, z, r: r + 0.08 }, update(t) { lilies.forEach((l, i) => { l.position.y = 0.02 + Math.sin(t * 1.3 + i * 2) * 0.006; l.rotation.y = Math.sin(t * 0.5 + i) * 0.15; }); } };
}
// Upuang kahoy (nakaharap sa lawa) at karatula
function bench(g, x, z, ry = 0) {
  const B = new THREE.Group(); B.position.set(x, 0, z); B.rotation.y = ry; g.add(B);
  const wood = M(0xb98a55, { roughness: 0.8 }), dark = M(0x7a5530);
  put(B, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.3), wood), 0, 0.26, 0);
  put(B, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.04), wood), 0, 0.46, -0.14);
  [-0.38, 0.38].forEach((lx) => put(B, new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.28), dark), lx, 0.13, 0));
  return { x, z, r: 0.5 };
}
function signpost(g, x, z) {
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.7, 6), M(0x8a6238)), x, 0.35, z);
  const b = put(g, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.04), M(0xf3ead7)), x, 0.62, z + 0.03); b.rotation.y = 0.2;
  const a = put(g, new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 3), M(0xff7a59)), x + 0.1, 0.62, z + 0.06, false); a.rotation.z = -Math.PI / 2; a.rotation.y = 0.2;
  return { x, z, r: 0.2 };
}
function bush(g, x, z, s = 1, col = 0x58b368) {
  [[0, 0, 0.26], [0.2, 0.05, 0.2], [-0.19, 0.03, 0.19]].forEach(([dx, dz, r]) => put(g, new THREE.Mesh(new THREE.SphereGeometry(r * s, 9, 6), M(col)), x + dx * s, r * s * 0.8, z + dz * s));
}
function tree(g, x, z, s = 1) {
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.6 * s, 8), M(0x8d6e4a)), x, 0.3 * s, z);
  [0.75, 1.0, 1.2].forEach((y, i) => put(g, new THREE.Mesh(new THREE.SphereGeometry((0.42 - i * 0.08) * s, 14, 10), M(0x5cb85c + i * 0x050a05)), x + (i - 1) * 0.06 * s, y * s, z));
}
function palm(g, x, z, s = 1) {
  const trunk = new THREE.Group(); trunk.position.set(x, 0, z); g.add(trunk);
  for (let i = 0; i < 6; i++) put(trunk, new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.25 * s, 8), M(0x9c7a4c)), Math.sin(i * 0.3) * 0.1 * s, (0.12 + i * 0.23) * s, 0);
  for (let i = 0; i < 6; i++) { const l = put(trunk, new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.9 * s, 4), M(0x3fa34d)), Math.sin(1.5) * 0.1 * s, 1.45 * s, 0); l.rotation.set(Math.PI / 2.6, (i / 6) * Math.PI * 2, 0); l.translateY(0.4 * s); }
}
function flowers(g, n, r, col = 0xffffff) {
  const R = rand(col === 0xffffff ? 7 : 13), petals = [], ctrs = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = 1.2 + R() * r, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < HOUSE.r) continue;
    for (let k = 0; k < 5; k++) { const b = (k / 5) * Math.PI * 2; petals.push([x + Math.cos(b) * 0.06, 0.04, z + Math.sin(b) * 0.06, 0, [1, 0.4, 0.6]]); }
    ctrs.push([x, 0.06, z]);
  }
  inst(g, new THREE.SphereGeometry(0.06, 6, 4), M(col, { roughness: 0.6 }), petals);
  inst(g, new THREE.SphereGeometry(0.03, 6, 4), M(0xffd54f), ctrs);
}

const BUILD = {
  island(g, x) {
    platform(g, 0x8fd18a, 0xc89a6b); flowers(g, 30, 3.9); flowers(g, 12, 3.6, 0xffc4dd);
    tree(g, -4.2, -2.3, 1.3); tree(g, -2.8, -4.1, 1.05); tree(g, -0.7, -5.0, 1.2); tree(g, 0.9, -4.8, 0.85); tree(g, -5.1, 0.2, 0.95); tree(g, -4.6, 3.0, 1.1); tree(g, 5.2, 1.9, 1.0);
    bush(g, -4.7, -1.2); bush(g, 5.3, -0.9, 0.9); bush(g, -1.8, -4.6, 0.8, 0x6cc47a); bush(g, 4.6, 3.0, 0.85, 0x6cc47a);
    put(g, new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), M(0xb8b2a8)), -4.9, 0.05, 1.4).scale.y = 0.6;
    fence(g); path(g);
    const pd = pond(g, -3.3, 2.4, 1.1); x.obstacles.push(pd.ob); x.ticks.push(pd.update);
    x.obstacles.push(garden(g, 4.3, 0.5, -0.35));
    x.obstacles.push(bench(g, -1.7, 3.3, 2.6)); x.obstacles.push(signpost(g, 1.2, 4.2));
  },
  beach(g) {
    platform(g, 0xf3d9a4, 0xd9b77c);
    const sea = put(g, new THREE.Mesh(new THREE.RingGeometry(PLAT, PLAT + 1.3, 72), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.8, roughness: 0.2 })), 0, -0.05, 0, false); sea.rotation.x = -Math.PI / 2;
    palm(g, -4.0, -2.1); palm(g, -2.4, -4.3, 0.8); palm(g, -5.0, 0.5, 0.9); palm(g, 4.9, 2.4, 0.85); path(g, 0xe9dcc0);
    const pole = put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), M(0xffffff)), -1.2, 0.7, 1.4);
    const top = put(g, new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.35, 10), M(0xff6f61)), -1.2, 1.4, 1.4); top.castShadow = true; pole.castShadow = true;
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.06 : 0.15; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const star = put(g, new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }), M(0xff8a65)), 1.0, 0.02, 1.9); star.rotation.x = -Math.PI / 2;
  },
  coral(g) {
    platform(g, 0xdff3f2, 0xa8d8de);
    const cols = [0xff9aa2, 0xffb7b2, 0xa0e7e5, 0xffdac1];
    const R = rand(3);
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.55 + R() * 1.05), d = 3.4 + R() * 2.0, c = new THREE.Group(); c.position.set(Math.cos(a) * d, 0, Math.sin(a) * d * 0.9); g.add(c);
      for (let k = 0; k < 4; k++) { const b = put(c, new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4 + R() * 0.4, 6, 10), M(cols[i % 4], { roughness: 0.6 })), (k - 1.5) * 0.1, 0.35, 0); b.rotation.z = (k - 1.5) * 0.35; }
    }
    [[1.2, 1.8], [1.45, 1.95], [-0.9, 2.1]].forEach(([x, z]) => put(g, new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1, iridescence: 0.8 })), x, 0.1, z));
  },
  snow(g) {
    platform(g, 0xf5f9ff, 0xb7c7d9);
    [[-4.1, -2.2], [-2.6, -4.2], [-4.9, 0.4], [-0.5, -5.1], [1.1, -4.9], [4.9, 2.3]].forEach(([x, z], i) => {
      [0.9, 0.65, 0.42].forEach((r, k) => put(g, new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, 0.7, 10), M(k ? 0x2e7d5b : 0x2e7d5b)), x, 0.45 + k * 0.4, z));
      put(g, new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 10), M(0xffffff)), x, 1.45, z);
    });
    [0.38, 0.28, 0.2].forEach((r, i) => put(g, new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), M(0xffffff, { roughness: 0.6 })), -1.0, r + [0, 0.6, 1.05][i] - (i ? 0.1 : 0), 1.7));
    put(g, new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 8), M(0xff7a1a)), -1.0, 1.25, 1.88).rotation.x = Math.PI / 2;
  },
  clouds(g) {
    const m = M(0xffffff, { roughness: 1 });
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(PLAT, PLAT - 0.3, 0.3, 64), M(0xf3f0ff)), 0, -0.15, 0, false);
    const R = rand(11);
    for (let i = 0; i < 38; i++) { const a = (i / 38) * Math.PI * 2, s = 0.45 + R() * 0.3; put(g, new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), m), Math.cos(a) * (PLAT - 0.1), -0.3 + R() * 0.2, Math.sin(a) * (PLAT - 0.1), false); }
    for (let i = 0; i < 3; i++) { const c = new THREE.Group(); c.position.set(-2 + i * 1.8, 2.6 + i * 0.3, -2.5); [[0, 0], [0.3, 0.1], [-0.3, 0.05]].forEach(([x, y]) => put(c, new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), m), x, y, 0, false)); g.add(c); c.userData.float = i; }
  },
  desert(g) {
    platform(g, 0xf0cf8f, 0xc99a5b);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8bf75)), -3.0, -0.35, -2.0, false).scale.y = 0.5;
    const pool = put(g, new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), M(0x3fb6d8, { roughness: 0.15 })), -1.0, 0.01, 1.5, false); pool.rotation.x = -Math.PI / 2;
    palm(g, -1.8, 1.2, 0.9); palm(g, -0.3, 2.2, 0.75); palm(g, -4.8, -0.3, 1); palm(g, 4.7, 2.6, 0.9); path(g, 0xe3c48a);
  },
  moon(g) {
    platform(g, 0xd9dbe2, 0x9a9caa);
    const R = rand(5);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.5 + R() * 1.2), d = 1.5 + R() * 3.6, c = put(g, new THREE.Mesh(new THREE.TorusGeometry(0.22 + R() * 0.15, 0.05, 8, 24), M(0xbfc1ca)), Math.cos(a) * d, 0.01, Math.sin(a) * d, false); c.rotation.x = Math.PI / 2; }
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6), M(0xcccccc)), -1.4, 0.5, 1.4);
    put(g, new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), M(0xff5a36, { side: THREE.DoubleSide })), -1.2, 0.85, 1.4);
    const sat = new THREE.Group(); sat.position.set(-2.2, 2.8, -2); g.add(sat); sat.userData.float = 1;
    put(sat, new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), M(0xd0d0d0, { metalness: 0.6 })), 0, 0, 0, false);
    [-1, 1].forEach((s) => put(sat, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.25), M(0x2a4b9b, { metalness: 0.4 })), s * 0.4, 0, 0, false));
  },
};
export const SKY = {
  island: "radial-gradient(120% 90% at 50% 0%, #d7f0ff 0%, #b9e1ff 45%, #fde6d2 100%)",
  beach: "linear-gradient(180deg, #8fd3ff 0%, #c9ecff 55%, #fff1d6 100%)",
  coral: "linear-gradient(180deg, #6f7dff 0%, #9aa6ff 50%, #c7cdff 100%)",
  snow: "linear-gradient(180deg, #b8d4ff 0%, #e3eeff 60%, #ffffff 100%)",
  clouds: "linear-gradient(180deg, #ffc8e1 0%, #e4d2ff 50%, #fff3fb 100%)",
  desert: "linear-gradient(180deg, #ffb26b 0%, #ffd59a 50%, #fff0d1 100%)",
  moon: "radial-gradient(120% 90% at 50% 0%, #3b3f73 0%, #1d2046 55%, #0c0d22 100%)",
};
export function buildBackdrop(id) {
  const group = new THREE.Group();
  const x = { obstacles: [], ticks: [] }, lit = [], lamps = [];
  (BUILD[id] || BUILD.island)(group, x);
  const house = kubo(group, lit, lamps);
  // dalawang poste ng ilaw sa magkabilang gilid ng daan papunta sa pinto
  const dx = 0.2 - HOUSE.door.x, dz = 0.5 - HOUSE.door.z, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
  [1, -1].forEach((k, i) => x.obstacles.push(lantern(group, HOUSE.door.x + ux * 0.75 + -uz * k * 0.62, HOUSE.door.z + uz * 0.75 + ux * k * 0.62, lit, lamps)));
  groundGlow(group, HOUSE.door.x, HOUSE.door.z, 1.5, lamps, 0.6);   // liwanag sa harap ng pinto
  const day = lit.map(([m]) => m.emissiveIntensity);
  const floats = []; group.traverse((o) => { if (o.userData && o.userData.float !== undefined) floats.push(o); });
  return {
    group, house, obstacles: x.obstacles,
    night(on) { lit.forEach(([m, n], i) => { m.emissiveIntensity = on ? n : day[i]; }); lamps.forEach((l) => { l.visible = on; l.material.opacity = on ? l.userData.n : 0; }); },
    update(t) { floats.forEach((o, i) => { o.position.y += Math.sin(t * 0.8 + i) * 0.002; o.rotation.y += 0.002; }); x.ticks.forEach((f) => f(t)); },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); if (o.isInstancedMesh) o.dispose(); }); },
  };
}
