/* TigoMeNote · tigo/backdrops.js — mga lugar ni Tigo (3D) at ang bahay na tinutulugan niya
   import { buildBackdrop, RADIUS, HOUSE } from "./backdrops.js"
   buildBackdrop(id) → { group, house, obstacles, night(on), update(t), setHouse(level 1–4), dispose() }   id = island | beach | coral | snow | clouds | desert | moon
   RADIUS = hanggang saan puwedeng maglakad si Tigo. PLAT = laki ng lupa. HOUSE = kung nasaan ang bahay (r = hindi matatagos) at ang pinto (para matulog).
   obstacles = [{ x, z, r }] na iniikutan ni Tigo (lawa, taniman, poste ng ilaw).
   spots = [{ kind: "bench"|"pond"|"garden"|"tree", x, z, r, seat?, id?, ready? }] → mga puwedeng gawin sa labas (isla lang); setFarm({ plots:[{seed,stage}], trees:[bool] })
   0.11.42–43: mas malaking isla (2.9 → 4.0 → 5.4), may upuan at karatula, bagong bahay na dalawang palapag (0.11.43; dati bahay kubo): bubong na tatsulok, balkonahe, veranda, bintana, paso ng bulaklak, ilaw, bakod sa gilid,
   taniman, lawa na may lily, daanang bato, at mga ilaw na bumubukas kapag gabi (parol, poste, ilaw sa bubong).
   0.11.52: 9.0 na ang isla, may paikot na kalsada (ROAD) na may guhit sa gitna, at maraming puno at halaman sa labas ng kalsada.
   Sariling disenyo lahat. */
import * as THREE from "../../vendor/three/three.module.min.js";

export const RADIUS = 9.0;   // 0.11.52: mas malaking isla (5.4 → 9.0) para may lugar sa bike, scooter at kotse
export const PLAT = 9.8;
export const ROAD = { r0: 6.9, r1: 8.2 };   // paikot na kalsada (isla lang)
const HS = 1.4, HROT = -0.6;   // laki at ikot ng bahay
export const HOUSE = { x: 3.4, z: -3.1, r: 1.36, door: { x: 3.4 + Math.sin(HROT) * 1.5, z: -3.1 + Math.cos(HROT) * 1.5 } };

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
// Bahay ni Tigo (0.11.43: bagong istilo — dalawang palapag, bubong na tatsulok, balkonahe sa harap, veranda sa itaas; dati: bahay kubo)
// lit = listahan ng [material, liwanag kapag gabi]; lamps = mga liwanag sa lupa na lumilitaw lang kapag gabi
function gable(w, h, d) {   // tatsulok na bubong: lapad w, taas h, lalim d (nakasentro)
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
}
// ---- 🎨 disenyo ng labas ng bahay (0.11.52): kulay ng dingding, bubong, gilid at pinto. Kapareho ng catalog.js (slot exterior) ----
export const EXTERIORS = {
  "ext-classic": { wall: 0xffd9c2, wall2: 0xfff1e3, roof: 0xf2685a, roofD: 0xd9503f, trim: 0xffffff, door: 0x2bb3a3 },
  "ext-mint": { wall: 0xcdf3e4, wall2: 0xf2fffa, roof: 0x2fae8f, roofD: 0x23866d, trim: 0xffffff, door: 0xff8a65 },
  "ext-sunset": { wall: 0xffc48c, wall2: 0xffe3c2, roof: 0x7b4fd6, roofD: 0x5e3bab, trim: 0xfff6e8, door: 0xe5533c },
  "ext-nipa": { wall: 0xd9b878, wall2: 0xe8cc8f, roof: 0x9c7a3c, roofD: 0x7d5f2b, trim: 0x8a6238, door: 0x6b4a2b },
  "ext-modern": { wall: 0xeef0f3, wall2: 0xffffff, roof: 0x3a3f4a, roofD: 0x2a2e36, trim: 0x9aa3b2, door: 0x1d1d22 },
  "ext-candy": { wall: 0xffc4dd, wall2: 0xfff0f7, roof: 0x5ec8f2, roofD: 0x3fa9d8, trim: 0xffffff, door: 0xffd23f },
  "ext-royal": { wall: 0xf4ead7, wall2: 0xfffaf0, roof: 0x1f3a68, roofD: 0x162a4d, trim: 0xf2c14e, door: 0x7a1f2b },
};
function kubo(g, lit, lamps) {
  const h = new THREE.Group(); h.position.set(HOUSE.x, 0, HOUSE.z); h.rotation.y = HROT; h.scale.setScalar(HS);
  const wall = M(0xffd9c2, { roughness: 0.9 }), wall2 = M(0xfff1e3, { roughness: 0.9 }), trim = M(0xffffff, { roughness: 0.6 }), roofM = M(0xf2685a, { roughness: 0.75 }), roofD = M(0xd9503f, { roughness: 0.8 });
  const stone = M(0xd9d4cc, { roughness: 1 }), doorM = M(0x2bb3a3, { roughness: 0.5 }), wood = M(0xb98a55, { roughness: 0.8 });
  const mats = { wall, wall2, trim, roof: roofM, roofD, door: doorM, stone, wood };   // pinagsasaluhan ng mga upgrade (houseExtras) at ng disenyo
  const box = (w, hh, d, m, x, y, z, sh = true) => put(h, new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m), x, y, z, sh);
  const glow = M(0xffe2a6, { emissive: 0xffa000, emissiveIntensity: 0 }); lit.push([glow, 1.7]);
  const petal = [M(0xff6f91), M(0xffd166), M(0xffffff)];
  // pundasyon at unang palapag
  box(1.6, 0.1, 1.2, stone, 0, 0.05, 0);
  box(1.5, 0.78, 1.1, wall, 0, 0.49, 0);
  box(1.56, 0.05, 1.16, trim, 0, 0.9, 0, false);                                          // guhit sa pagitan ng palapag
  // ikalawang palapag (nasa kaliwa) at veranda (kanan)
  box(0.98, 0.56, 0.96, wall2, -0.24, 1.2, -0.04);
  box(0.5, 0.04, 1.06, wood, 0.5, 0.94, 0);                                               // sahig ng veranda
  [[0.74, 0.5], [0.74, -0.5], [0.27, 0.5]].forEach(([x, z]) => box(0.035, 0.24, 0.035, trim, x, 1.06, z, false));
  box(0.5, 0.03, 0.03, trim, 0.5, 1.17, 0.5, false); box(0.03, 0.03, 1.0, trim, 0.74, 1.17, 0, false);
  for (let i = 0; i < 4; i++) box(0.02, 0.2, 0.02, trim, 0.34 + i * 0.1, 1.06, 0.5, false);
  for (let i = 0; i < 5; i++) box(0.02, 0.2, 0.02, trim, 0.74, 1.06, -0.4 + i * 0.2, false);
  // bubong: tatsulok sa itaas (harap ang mukha), may puting gilid; maliit na bubong sa pinto
  put(h, new THREE.Mesh(gable(1.2, 0.5, 1.12), roofM), -0.24, 1.48, -0.04);
  put(h, new THREE.Mesh(gable(1.04, 0.4, 0.04), wall2), -0.24, 1.48, 0.47, false);          // mukha ng tatsulok
  [-1, 1].forEach((k) => { const e = box(0.72, 0.045, 1.16, trim, -0.24 + k * 0.31, 1.725, -0.04, false); e.rotation.z = -k * 0.694; });
  put(h, new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), glow), -0.24, 1.66, 0.495, false);   // bilog na bintana sa tuktok
  box(0.16, 0.34, 0.16, stone, -0.52, 1.86, -0.3); box(0.2, 0.05, 0.2, roofD, -0.52, 2.04, -0.3, false);   // tsimenea
  put(h, new THREE.Mesh(gable(0.78, 0.26, 0.5), roofD), 0, 0.93, 0.78);
  put(h, new THREE.Mesh(gable(0.66, 0.2, 0.03), trim), 0, 0.93, 1.03, false);
  // balkonahe sa harap: sahig, 2 poste, rehas, 2 baitang
  box(1.1, 0.06, 0.42, wood, 0, 0.13, 0.76);
  [-0.34, 0.34].forEach((x) => box(0.05, 0.76, 0.05, trim, x, 0.54, 0.95));
  [-1, 1].forEach((k) => { box(0.2, 0.03, 0.03, trim, k * 0.45, 0.4, 0.95, false); for (let i = 0; i < 2; i++) box(0.02, 0.24, 0.02, trim, k * (0.4 + i * 0.1), 0.28, 0.95, false); box(0.03, 0.03, 0.4, trim, k * 0.54, 0.4, 0.76, false); });
  box(0.5, 0.05, 0.14, stone, 0, 0.08, 1.04); box(0.5, 0.04, 0.14, stone, 0, 0.03, 1.17);
  // pinto (may salamin at hawakan)
  box(0.4, 0.62, 0.03, trim, 0, 0.47, 0.555, false);
  box(0.32, 0.56, 0.03, doorM, 0, 0.45, 0.57, false);
  box(0.2, 0.16, 0.03, glow, 0, 0.6, 0.575, false);
  put(h, new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M(0xf2c14e, { metalness: 0.5, roughness: 0.4 })), 0.11, 0.42, 0.6, false);
  // mga bintana (nagliliwanag kapag gabi): hamba, krus, paso ng bulaklak
  const win = (x, y, z, ry, w = 0.3, flowers = true) => {
    const W = new THREE.Group(); W.position.set(x, y, z); W.rotation.y = ry; h.add(W);
    put(W, new THREE.Mesh(new THREE.BoxGeometry(w + 0.07, 0.31, 0.02), trim), 0, 0, 0, false);
    put(W, new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, 0.03), glow), 0, 0, 0.005, false);
    put(W, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.04), trim), 0, 0, 0.008, false);
    put(W, new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.04), trim), 0, 0, 0.008, false);
    if (!flowers) return;
    put(W, new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.06, 0.08), wood), 0, -0.19, 0.04, false);
    for (let i = 0; i < 3; i++) put(W, new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), petal[i]), -0.1 + i * 0.1, -0.14, 0.05, false);
  };
  win(0.52, 0.52, 0.555, 0); win(-0.52, 0.52, 0.555, 0);                                    // unang palapag, harap
  win(-0.24, 1.2, 0.445, 0, 0.36); win(0.755, 0.5, 0, Math.PI / 2, 0.3, false); win(-0.755, 0.5, 0, -Math.PI / 2, 0.3, false); win(-0.735, 1.2, -0.04, -Math.PI / 2, 0.3, false);
  // ilaw sa balkonahe at makukulay na ilaw sa gilid ng bubong ng pinto
  const lampM = M(0xfff1c4, { emissive: 0xffb347, emissiveIntensity: 0.15 }); lit.push([lampM, 2.4]);
  put(h, new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lampM), 0, 0.86, 0.9, false);
  [0xff6f61, 0xffd166, 0x6fd3ff, 0x9be564, 0xff9ad5].forEach((c, i) => {
    const m = M(c, { emissive: c, emissiveIntensity: 0.1 }); lit.push([m, 2]);
    put(h, new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), m), -0.3 + i * 0.15, 0.93 + (0.2 - Math.abs(i - 2) * 0.1) * 0.62, 1.05, false);
  });
  g.add(h);
  return { group: h, glow, mats };
}
// ---- Upgrade ng bahay (0.11.51): 2 Cottage · 3 Villa · 4 Mansion — dagdag na bahagi sa likod at gilid; ang buong bahay ay lumalaki
// mula sa pinto (hindi gumagalaw ang pinto, ang daan at mga parol). Ibinabalik ang update(t) para sa usok ng tsimenea at bandila.
const HOUSE0 = { x: HOUSE.x, z: HOUSE.z, r: HOUSE.r }, HK = [1, 1, 1.08, 1.16, 1.24];
function houseExtras(h, level, glow, mats) {
  const G = new THREE.Group(); h.add(G);
  const { wall, wall2, trim, stone, roof, wood } = mats, gold = M(0xf2c14e, { metalness: 0.6, roughness: 0.35 }), leaf = M(0x4caf6a);
  const box = (w, hh, d, m, x, y, z, sh = true) => put(G, new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m), x, y, z, sh);
  const pane = (x, y, z, ry, w = 0.22, hh = 0.24) => { const P = new THREE.Group(); P.position.set(x, y, z); P.rotation.y = ry; G.add(P); put(P, new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, hh + 0.06, 0.02), trim), 0, 0, 0, false); put(P, new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.03), glow), 0, 0, 0.006, false); put(P, new THREE.Mesh(new THREE.BoxGeometry(0.02, hh, 0.04), trim), 0, 0, 0.01, false); };
  const ticks = [];
  if (level >= 2) {   // Cottage: kwarto sa likod, mga halaman, mailbox, usok sa tsimenea
    box(1.42, 0.08, 0.6, stone, 0, 0.04, -0.86); box(1.32, 0.62, 0.52, wall, 0, 0.39, -0.86);
    put(G, new THREE.Mesh(gable(1.4, 0.3, 0.6), roof), 0, 0.7, -0.86);
    pane(-0.4, 0.42, -1.125, Math.PI); pane(0.4, 0.42, -1.125, Math.PI);
    [[-0.78, 0.7], [0.78, 0.7], [-0.86, 0.3], [0.86, 0.3]].forEach(([x, z], i) => { const b = put(G, new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), leaf), x, 0.11, z); b.scale.y = 0.8;
      put(G, new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M([0xff6f91, 0xffd166, 0xffffff, 0xff9ad5][i])), x + 0.05, 0.2, z + 0.06, false); });
    box(0.04, 0.34, 0.04, wood, 0.74, 0.17, 1.28); const mb = box(0.12, 0.09, 0.18, M(0xe5533c), 0.74, 0.38, 1.28); mb.rotation.y = 0.2; box(0.02, 0.06, 0.02, M(0xffd166), 0.81, 0.44, 1.25, false);
    const puffM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 1 });
    const puffs = [0, 1, 2].map(() => put(G, new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), puffM), -0.52, 2.1, -0.3, false));
    ticks.push((t) => puffs.forEach((p, i) => { const k = (t * 0.35 + i / 3) % 1; p.position.set(-0.52 + k * 0.12, 2.1 + k * 0.5, -0.3 - k * 0.05); p.scale.setScalar(0.7 + k * 1.3); }));
    puffM.opacity = 0.5;
  }
  if (level >= 3) {   // Villa: matangkad na pakpak sa kanan na may balkonahe at sariling bubong
    box(0.66, 0.1, 0.84, stone, 1.1, 0.05, -0.12); box(0.62, 1.52, 0.78, wall2, 1.1, 0.86, -0.12);
    const pr = put(G, new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.48, 4), roof), 1.1, 1.86, -0.12); pr.rotation.y = Math.PI / 4;
    pane(1.1, 0.5, 0.275, 0); pane(1.1, 1.2, 0.275, 0, 0.26, 0.3); pane(1.415, 0.9, -0.12, Math.PI / 2);
    box(0.62, 0.04, 0.26, wood, 1.1, 0.96, 0.42); box(0.62, 0.03, 0.03, trim, 1.1, 1.14, 0.54, false);
    for (let i = 0; i < 6; i++) box(0.02, 0.18, 0.02, trim, 0.82 + i * 0.11, 1.05, 0.54, false);
    box(0.06, 0.06, 0.06, gold, 1.1, 2.12, -0.12);
  }
  if (level >= 4) {   // Mansion: bilog na tore sa kaliwa na may bandila, haligi, halamang bakod, gintong palamuti
    put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 2.4, 18), wall2), -1.08, 1.2, -0.32);
    put(G, new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.78, 18), roof), -1.08, 2.79, -0.32);
    put(G, new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.03, 6, 24), gold), -1.08, 2.4, -0.32).rotation.x = Math.PI / 2;
    [0.6, 1.3, 1.9].forEach((y, i) => pane(-1.08 + Math.sin(0.5) * 0.41, y, -0.32 + Math.cos(0.5) * 0.41, 0.5, 0.18, 0.26));
    box(0.02, 0.5, 0.02, trim, -1.08, 3.4, -0.32, false); const flag = box(0.24, 0.14, 0.01, M(0xff3b5c), -0.96, 3.56, -0.32, false);
    ticks.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.25; flag.scale.x = 0.9 + Math.sin(t * 5) * 0.1; });
    [-0.34, 0.34].forEach((x) => { put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.78, 12), trim), x, 0.53, 0.95); put(G, new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), gold), x, 0.96, 0.95, false); });
    [[-0.95, 0.95], [0.95, 0.95]].forEach(([x, z]) => box(0.42, 0.22, 0.16, leaf, x, 0.11, z));
    put(G, new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), gold), -0.24, 2.0, -0.04, false);
  }
  return { group: G, update(t) { ticks.forEach((f) => f(t)); } };
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
  const m = M(col, { roughness: 0.9 }), r = PLAT - 0.22, n = 72, a0 = Math.PI * 0.86, a1 = Math.PI * 2.14;
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
// 10 taniman (2 kama × 5). setPlots([{ seed, stage }]) → stage 0 walang tanim · 1 punla · 2 lumalaki · 3 puwede nang anihin (pet-fast "farm")
export const CROPS = { carrot: 0xff8a2a, tomato: 0xe53935, corn: 0xf7d94c, strawberry: 0xe91e63, pumpkin: 0xf57c00 };
function garden(g, x, z, ry = 0) {
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; G.scale.setScalar(1.6); g.add(G);
  const soil = M(0x8a5a3c, { roughness: 1 }), edge = M(0xc8a165);
  const at = [];
  [-0.3, 0.3].forEach((dz) => {
    put(G, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.42), edge), 0, 0.04, dz);
    put(G, new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.09, 0.34), soil), 0, 0.05, dz, false);
    for (let i = 0; i < 5; i++) at.push([-0.4 + i * 0.2, dz]);
  });
  // pandilig
  put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 10), M(0x6fb7e9, { roughness: 0.5 })), 0.68, 0.07, 0.25);
  const sp = put(G, new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), M(0x6fb7e9)), 0.78, 0.1, 0.25, false); sp.rotation.z = -0.9;
  const crops = new THREE.Group(); G.add(crops);
  // Bawat tanim ay may sariling hugis (0.11.49): karot (dahong parang pako + kahel na ulo sa lupa), kamatis (tulos, palumpong, pulang bunga),
  // mais (matangkad na tangkay, mahahabang dahon, busal), strawberry (mababang dahon, pulang bunga, puting bulaklak), kalabasa (baging, malapad na dahon, kalabasang may guhit).
  const mats = {}; const mat = (c, o) => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...(o || {}) }));
  const GEO = { cone: new THREE.ConeGeometry(1, 1, 7), ball: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 7), leaf: new THREE.SphereGeometry(1, 8, 6) };
  const plants = [];
  function part(P, g, c, x, y, z, sx, sy, sz, rx = 0, rz = 0, ry = 0) { const m = new THREE.Mesh(GEO[g], mat(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); m.castShadow = true; P.add(m); return m; }
  const GREEN = 0x4caf50, DARK = 0x2e8b3d, LIGHT = 0x7ccf5a;
  const BUILD = {
    carrot(P, st) {
      const n = st === 1 ? 2 : 5, h = [0, 0.06, 0.12, 0.16][st];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; part(P, "cone", i % 2 ? GREEN : LIGHT, Math.cos(a) * 0.012, h / 2, Math.sin(a) * 0.012, 0.012, h, 0.012, Math.sin(a) * 0.5, -Math.cos(a) * 0.5); }
      if (st === 3) { part(P, "cyl", 0xff8a2a, 0, 0.012, 0, 0.028, 0.03, 0.028); part(P, "cyl", 0xe06f12, 0, 0.028, 0, 0.022, 0.004, 0.022); }
    },
    tomato(P, st) {
      const h = [0, 0.05, 0.13, 0.19][st];
      if (st > 1) part(P, "cyl", 0xb98a55, 0.03, h * 0.55, 0, 0.004, h * 1.1, 0.004);   // tulos
      part(P, "cyl", DARK, 0, h / 2, 0, 0.006, h, 0.006);
      [[0, h * 0.75, 0, 0.05], [-0.025, h * 0.5, 0.02, 0.04], [0.025, h * 0.45, -0.02, 0.038]].slice(0, st === 1 ? 1 : 3).forEach(([x, y, z, r]) => part(P, "leaf", GREEN, x, y, z, r * (st === 1 ? 0.5 : 1), r * 0.7 * (st === 1 ? 0.5 : 1), r * (st === 1 ? 0.5 : 1)));
      if (st === 3) [[0.04, 0.1, 0.03], [-0.045, 0.075, 0.02], [0.01, 0.055, 0.05]].forEach(([x, y, z]) => { part(P, "ball", 0xe53935, x, y, z, 0.022, 0.02, 0.022); part(P, "cone", DARK, x, y + 0.02, z, 0.01, 0.008, 0.01); });
    },
    corn(P, st) {
      const h = [0, 0.07, 0.2, 0.3][st];
      part(P, "cyl", LIGHT, 0, h / 2, 0, 0.008, h, 0.008);
      const n = st === 1 ? 2 : 5;
      for (let i = 0; i < n; i++) { const a = i * 2.4, y = h * (0.3 + 0.14 * i); part(P, "leaf", i % 2 ? GREEN : LIGHT, Math.cos(a) * 0.045, Math.min(h, y), Math.sin(a) * 0.045, 0.06, 0.006, 0.014, 0, 0.5, -a); }
      if (st === 3) { part(P, "ball", 0xf7d94c, 0.022, h * 0.55, 0.01, 0.018, 0.045, 0.018, 0, -0.25); part(P, "leaf", LIGHT, 0.03, h * 0.5, 0.012, 0.016, 0.04, 0.012, 0, -0.35); part(P, "cone", 0xd9c27a, 0, h + 0.02, 0, 0.012, 0.045, 0.012); }
    },
    strawberry(P, st) {
      const r = [0, 0.03, 0.05, 0.06][st], n = st === 1 ? 2 : 5;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; part(P, "leaf", i % 2 ? GREEN : DARK, Math.cos(a) * r * 0.7, 0.02 + r * 0.25, Math.sin(a) * r * 0.7, r * 0.6, r * 0.14, r * 0.45, 0, 0.25, -a); }
      if (st === 3) { [[0.05, 0.03], [-0.04, 0.045], [0.0, -0.055]].forEach(([x, z]) => { part(P, "cone", 0xe91e63, x, 0.03, z, 0.016, 0.03, 0.016, Math.PI); part(P, "cone", GREEN, x, 0.047, z, 0.014, 0.006, 0.014); }); part(P, "ball", 0xffffff, -0.01, 0.05, 0.01, 0.012, 0.004, 0.012); part(P, "ball", 0xffe066, -0.01, 0.054, 0.01, 0.005, 0.004, 0.005); }
    },
    pumpkin(P, st) {
      const n = st === 1 ? 2 : 4, r = [0, 0.03, 0.055, 0.065][st];
      for (let i = 0; i < n; i++) { const a = i * 1.7 + 0.4; part(P, "leaf", i % 2 ? GREEN : DARK, Math.cos(a) * r, 0.02 + i * 0.006, Math.sin(a) * r, r * 0.7, 0.006, r * 0.6, 0, 0.12, -a); }
      if (st > 1) part(P, "cyl", DARK, 0, 0.012, 0, 0.005, 0.02, 0.005, 0, Math.PI / 2);
      if (st === 3) { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; part(P, "ball", i % 2 ? 0xf57c00 : 0xff9526, 0.03 + Math.cos(a) * 0.022, 0.04, 0.035 + Math.sin(a) * 0.022, 0.03, 0.036, 0.03); } part(P, "cyl", 0x6b8e3a, 0.03, 0.085, 0.035, 0.006, 0.022, 0.006, 0.2); }
    },
  };
  // basang lupa (madilim na bilog) kapag nadiligan
  const wetM = new THREE.MeshStandardMaterial({ color: 0x4a2f1f, roughness: 0.35, transparent: true, opacity: 0.85 }), wetG = new THREE.CircleGeometry(0.085, 18);
  const prev = [];
  function setPlots(list) {
    crops.clear(); plants.length = 0;
    (list || []).forEach((p, i) => {
      if (!p || !p.stage || !at[i]) { prev[i] = 0; return; }
      if (p.wet) { const w = new THREE.Mesh(wetG, wetM); w.rotation.x = -Math.PI / 2; w.position.set(at[i][0], 0.096, at[i][1]); crops.add(w); }
      const st = Math.max(1, Math.min(3, p.stage)), k = typeof p.k === "number" ? p.k : st / 3;
      const P = new THREE.Group(); P.position.set(at[i][0], 0.095, at[i][1]); P.rotation.y = i * 1.3; crops.add(P);
      // lumalaki habang tumutubo (hindi lang 3 hakbang); bagong yugto = "pop" na animation
      P.userData.size = 1.45 * (st === 3 ? 1 : 0.6 + 0.4 * Math.min(1, k / (st === 1 ? 0.4 : 1)));
      P.userData.pop = prev[i] && st > prev[i] ? 0 : 1; prev[i] = st;
      P.scale.setScalar(P.userData.size * (P.userData.pop < 1 ? 0.3 : 1)); plants.push(P);
      (BUILD[p.seed] || BUILD.tomato)(P, st);
    });
  }
  let lastT = 0;
  return { ob: { x, z, r: 1.2 }, setPlots, update(t) {
    const dt = Math.min(0.05, t - lastT || 0); lastT = t;
    plants.forEach((P, i) => {
      P.rotation.z = Math.sin(t * 1.4 + i * 1.7) * 0.035; P.rotation.x = Math.cos(t * 1.1 + i) * 0.025;
      if (P.userData.pop < 1) { P.userData.pop = Math.min(1, P.userData.pop + dt * 1.6); const q = P.userData.pop, b = 1 + Math.sin(q * Math.PI) * 0.25; P.scale.setScalar(P.userData.size * (0.3 + 0.7 * q) * b); }
    });
  },
    dispose() { Object.values(mats).forEach((m) => m.dispose()); Object.values(GEO).forEach((g) => g.dispose()); wetM.dispose(); wetG.dispose(); } };
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
  // mga isda (0.11.49): koi at tilapia na lumalangoy sa ilalim ng tubig — katawan, buntot na kumakampay, palikpik; paminsan-minsan ay may tumatalon
  const fishes = [[0xff8a3d, 0xffffff, 0.55, 0.5, 0], [0xf2f2f2, 0xff5a36, 0.4, -0.62, 2], [0x8f9aa6, 0x6f7b88, 0.68, 0.38, 4], [0xffc23d, 0xff8a3d, 0.3, 0.8, 1]].map(([c1, c2, rad, sp, ph]) => {
    const F = new THREE.Group(); F.scale.y = 0.45; P.add(F);   // nasa ibabaw lang ng tubig (parang koi na kita mula sa itaas)
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M(c1, { roughness: 0.35 })); body.scale.set(0.035, 0.03, 0.095); F.add(body);
    const spot = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), M(c2, { roughness: 0.35 })); spot.scale.set(0.028, 0.026, 0.035); spot.position.set(0, 0.008, 0.02); F.add(spot);
    const tail = new THREE.Group(); tail.position.z = -0.09; F.add(tail);
    const tf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 4), M(c2, { roughness: 0.4 })); tf.rotation.x = Math.PI / 2; tf.scale.x = 0.25; tf.position.z = -0.03; tail.add(tf);
    [-1, 1].forEach((k) => { const fin = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 4), M(c2)); fin.position.set(k * 0.034, -0.004, 0.02); fin.rotation.z = k * 1.9; fin.scale.z = 0.3; F.add(fin); });
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 4), M(c1)); dorsal.position.set(0, 0.03, -0.01); dorsal.scale.x = 0.3; F.add(dorsal);
    return { F, tail, rad, sp, ph };
  });
  return { ob: { x, z, r: r + 0.08 }, update(t) {
    lilies.forEach((l, i) => { l.position.y = 0.02 + Math.sin(t * 1.3 + i * 2) * 0.006; l.rotation.y = Math.sin(t * 0.5 + i) * 0.15; });
    fishes.forEach((f, i) => {
      const a = t * f.sp + f.ph, rr = f.rad * r * (0.85 + Math.sin(t * 0.3 + i) * 0.12), jump = Math.max(0, Math.sin(t * 0.23 + i * 1.9) - 0.985) / 0.015;   // bihirang talon
      f.F.position.set(Math.cos(a) * rr, 0.022 + jump * 0.16, Math.sin(a) * rr * 0.82); f.F.scale.y = 0.45 + Math.min(1, jump * 3) * 0.55;
      f.F.rotation.y = -a + (f.sp > 0 ? 0 : Math.PI); f.F.rotation.x = -jump * 0.5; f.tail.rotation.y = Math.sin(t * 9 + i) * 0.5;
    });
  } };
}
// Upuang kahoy (nakaharap sa lawa) at karatula
function bench(g, x, z, ry = 0) {
  const B = new THREE.Group(); B.position.set(x, 0, z); B.rotation.y = ry; B.scale.setScalar(1.4); g.add(B);
  const wood = M(0xb98a55, { roughness: 0.8 }), dark = M(0x7a5530);
  put(B, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.3), wood), 0, 0.26, 0);
  put(B, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.04), wood), 0, 0.46, -0.14);
  [-0.38, 0.38].forEach((lx) => put(B, new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.28), dark), lx, 0.13, 0));
  return { x, z, r: 0.62 };
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
// Puno. Ibinabalik ang grupo ng mga bunga (nakatago hangga't walang bunga) para sa "pick" (namumunga bawat ilang oras)
const fruitM = [0xe53935, 0xff9f1c, 0xf7d94c];
function tree(g, x, z, s = 1, kind = 0) {
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.6 * s, 8), M(0x8d6e4a)), x, 0.3 * s, z);
  [0.75, 1.0, 1.2].forEach((y, i) => put(g, new THREE.Mesh(new THREE.SphereGeometry((0.42 - i * 0.08) * s, 14, 10), M(0x5cb85c + i * 0x050a05)), x + (i - 1) * 0.06 * s, y * s, z));
  const fr = new THREE.Group(); fr.visible = false; g.add(fr);
  const fm = M(fruitM[kind % 3], { roughness: 0.4, emissive: fruitM[kind % 3], emissiveIntensity: 0.2 });
  [[0.3, 0.78, 0.26], [-0.28, 0.9, 0.24], [0.05, 1.08, 0.33], [0.34, 1.02, -0.05], [-0.12, 0.72, 0.36]].forEach(([dx, dy, dz]) => put(fr, new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 10, 8), fm), x + dx * s, dy * s, z + dz * s, false));
  return { x, z, fruit: fr };
}
function palm(g, x, z, s = 1) {
  const trunk = new THREE.Group(); trunk.position.set(x, 0, z); g.add(trunk);
  for (let i = 0; i < 6; i++) put(trunk, new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.25 * s, 8), M(0x9c7a4c)), Math.sin(i * 0.3) * 0.1 * s, (0.12 + i * 0.23) * s, 0);
  for (let i = 0; i < 6; i++) { const l = put(trunk, new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.9 * s, 4), M(0x3fa34d)), Math.sin(1.5) * 0.1 * s, 1.45 * s, 0); l.rotation.set(Math.PI / 2.6, (i / 6) * Math.PI * 2, 0); l.translateY(0.4 * s); }
}
// Paikot na kalsada: aspalto, puting gilid at putol-putol na dilaw na guhit sa gitna (isang draw call bawat bahagi)
function road(g) {
  const { r0, r1 } = ROAD, asph = put(g, new THREE.Mesh(new THREE.RingGeometry(r0, r1, 120, 1), M(0x4a4f5a, { roughness: 0.95 })), 0, 0.012, 0, false); asph.rotation.x = -Math.PI / 2;
  [r0 + 0.06, r1 - 0.06].forEach((r) => { const e = put(g, new THREE.Mesh(new THREE.RingGeometry(r - 0.035, r + 0.035, 120, 1), M(0xf3f3f3, { roughness: 0.8 })), 0, 0.016, 0, false); e.rotation.x = -Math.PI / 2; });
  const mid = (r0 + r1) / 2, dashes = []; for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; dashes.push([Math.cos(a) * mid, 0.017, Math.sin(a) * mid, -a, [1, 1, 1]]); }
  inst(g, new THREE.BoxGeometry(0.06, 0.004, 0.32), M(0xffd23f, { roughness: 0.7 }), dashes);
}
// Mga puno at halaman sa labas ng kalsada (InstancedMesh: magaan kahit marami)
function outerWoods(g) {
  const R = rand(91), trunks = [], leaves = [], bushes = [];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + R() * 0.12, d = ROAD.r1 + 0.55 + R() * 0.75, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.75 + R() * 0.5;
    if (i % 3 === 2) { bushes.push([x, 0.18 * s, z, 0, [s, s * 0.75, s]]); continue; }
    trunks.push([x, 0.3 * s, z, 0, [s, s, s]]);
    [0.75, 1.0, 1.2].forEach((y, k) => { const q = (0.42 - k * 0.08) / 0.42 * s; leaves.push([x, y * s, z, 0, [q, q, q]]); });
  }
  inst(g, new THREE.CylinderGeometry(0.07, 0.1, 0.6, 7), M(0x8d6e4a), trunks, true);
  inst(g, new THREE.SphereGeometry(0.42, 12, 9), M(0x5cb85c), leaves, true);
  inst(g, new THREE.SphereGeometry(0.3, 10, 7), M(0x58b368), bushes, true);
}
function flowers(g, n, r, col = 0xffffff) {
  const R = rand(col === 0xffffff ? 7 : 13), petals = [], ctrs = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = 1.2 + R() * r, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < HOUSE.r * 1.3 || (d > ROAD.r0 - 0.1 && d < ROAD.r1 + 0.1)) continue;
    for (let k = 0; k < 5; k++) { const b = (k / 5) * Math.PI * 2; petals.push([x + Math.cos(b) * 0.06, 0.04, z + Math.sin(b) * 0.06, 0, [1, 0.4, 0.6]]); }
    ctrs.push([x, 0.06, z]);
  }
  inst(g, new THREE.SphereGeometry(0.06, 6, 4), M(col, { roughness: 0.6 }), petals);
  inst(g, new THREE.SphereGeometry(0.03, 6, 4), M(0xffd54f), ctrs);
}

const BUILD = {
  island(g, x) {
    platform(g, 0x8fd18a, 0xc89a6b); flowers(g, 60, 7.9); flowers(g, 24, 7.6, 0xffc4dd); road(g); outerWoods(g);
    const trees = [[-4.2, -2.3, 1.3], [-2.8, -4.1, 1.05], [-0.7, -5.0, 1.2], [0.9, -4.8, 0.85], [-5.1, 0.2, 0.95], [-4.6, 3.0, 1.1], [5.0, 2.6, 1.0]].map(([tx, tz, ts], i) => tree(g, tx, tz, ts, i));
    bush(g, -4.7, -1.2); bush(g, 5.3, -0.9, 0.9); bush(g, -1.8, -4.6, 0.8, 0x6cc47a); bush(g, 4.6, 3.0, 0.85, 0x6cc47a);
    put(g, new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), M(0xb8b2a8)), -4.9, 0.05, 1.4).scale.y = 0.6;
    fence(g); path(g);
    const pd = pond(g, -3.3, 2.4, 1.1); x.obstacles.push(pd.ob); x.ticks.push(pd.update);
    const gd = garden(g, 3.9, 0.9, -0.35); x.obstacles.push(gd.ob); x.ticks.push(gd.update); x.disposers.push(gd.dispose);
    const BX = -1.7, BZ = 3.5, BF = Math.atan2(-3.3 - BX, 2.4 - BZ);   // upuan: nakaharap sa lawa (para sa pangingisda)
    x.obstacles.push(bench(g, BX, BZ, BF)); x.obstacles.push(signpost(g, 1.2, 4.2));
    const seat = { x: BX, z: BZ, y: 0.4, face: BF, front: { x: BX + Math.sin(BF) * 0.7, z: BZ + Math.cos(BF) * 0.7 } };
    // mga puwedeng gawin sa labas: upo, pangingisda (mula sa upuan), taniman, pitas ng bunga
    x.spots.push({ kind: "bench", x: BX, z: BZ, r: 1.2, seat }, { kind: "pond", x: -3.3, z: 2.4, r: 2.0, seat, bob: { x: -3.0, z: 2.55 } }, { kind: "garden", x: 3.9, z: 0.9, r: 2.0 });
    trees.forEach((t, i) => x.spots.push({ kind: "tree", id: i, x: t.x, z: t.z, r: 1.15, ready: false }));
    x.setFarm = (f) => { gd.setPlots(f && f.plots); trees.forEach((t, i) => { const on = !!(f && f.trees && f.trees[i]); t.fruit.visible = on; x.spots.find((q) => q.kind === "tree" && q.id === i).ready = on; }); };
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
  HOUSE.x = HOUSE0.x; HOUSE.z = HOUSE0.z; HOUSE.r = HOUSE0.r;   // bagong lugar: magsimula sa kubo (setHouse ang magpapalaki)
  const group = new THREE.Group();
  const x = { obstacles: [], ticks: [], spots: [], disposers: [], setFarm: null }, lit = [], lamps = [];
  (BUILD[id] || BUILD.island)(group, x);
  const house = kubo(group, lit, lamps);
  let extras = null, hLevel = 1;
  function setHouse(level) {   // antas ng bahay: lumalaki mula sa pinto; ina-update ang HOUSE (banggaan at gitna)
    const L = Math.max(1, Math.min(4, Math.floor(level) || 1)); if (L === hLevel && (extras || L === 1)) return;
    const shared = new Set([house.glow, ...Object.values(house.mats)]);
    if (extras) { house.group.remove(extras.group); extras.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !shared.has(o.material)) o.material.dispose(); }); extras = null; }
    hLevel = L; if (L > 1) extras = houseExtras(house.group, L, house.glow, house.mats);
    const k = HK[L], D = HOUSE.door;
    house.group.scale.setScalar(HS * k);
    HOUSE.x = D.x + (HOUSE0.x - D.x) * k; HOUSE.z = D.z + (HOUSE0.z - D.z) * k; HOUSE.r = HOUSE0.r * k * (L >= 3 ? 1.12 : 1);
    house.group.position.set(HOUSE.x, 0, HOUSE.z);
  }
  // dalawang poste ng ilaw sa magkabilang gilid ng daan papunta sa pinto
  const dx = 0.2 - HOUSE.door.x, dz = 0.5 - HOUSE.door.z, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
  [1, -1].forEach((k, i) => x.obstacles.push(lantern(group, HOUSE.door.x + ux * 0.75 + -uz * k * 0.62, HOUSE.door.z + uz * 0.75 + ux * k * 0.62, lit, lamps)));
  groundGlow(group, HOUSE.door.x, HOUSE.door.z, 1.5, lamps, 0.6);   // liwanag sa harap ng pinto
  const day = lit.map(([m]) => m.emissiveIntensity);
  const floats = []; group.traverse((o) => { if (o.userData && o.userData.float !== undefined) floats.push(o); });
  return {
    // 🎨 palit ng disenyo ng labas ng bahay (kulay lang; pareho ang hugis)
    setLook(id) { const e = EXTERIORS[id] || EXTERIORS["ext-classic"], m = house.mats; ["wall", "wall2", "trim", "roof", "roofD", "door"].forEach((k) => m[k].color.setHex(e[k])); },
    group, house, obstacles: x.obstacles, spots: x.spots, setFarm(f) { if (x.setFarm) x.setFarm(f); }, setHouse, houseLevel: () => hLevel,
    night(on) { lit.forEach(([m, n], i) => { m.emissiveIntensity = on ? n : day[i]; }); lamps.forEach((l) => { l.visible = on; l.material.opacity = on ? l.userData.n : 0; }); },
    update(t) { floats.forEach((o, i) => { o.position.y += Math.sin(t * 0.8 + i) * 0.002; o.rotation.y += 0.002; }); x.ticks.forEach((f) => f(t)); if (extras) extras.update(t); },
    dispose() { x.disposers.forEach((d) => d()); group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); if (o.isInstancedMesh) o.dispose(); }); },
  };
}
