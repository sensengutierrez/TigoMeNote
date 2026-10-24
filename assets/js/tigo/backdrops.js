/* TigoMeNote · tigo/backdrops.js — mga lugar ni Tigo (3D) at ang bahay kubo na tinutulugan niya
   import { buildBackdrop, RADIUS, HOUSE } from "./backdrops.js"
   buildBackdrop(id) → { group, update(t) }   id = island | beach | coral | snow | clouds | desert | moon
   RADIUS = hanggang saan puwedeng maglakad si Tigo. HOUSE = kung nasaan ang pinto ng bahay (para matulog).
   Sariling disenyo lahat. */
import * as THREE from "../../vendor/three/three.module.min.js";

export const RADIUS = 2.9;
export const HOUSE = { x: 1.9, z: -1.7, door: { x: 1.65, z: -1.05 } };

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const put = (g, m, x, y, z, shadow = true) => { m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; };
const rand = (seed) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

function platform(g, top, side, r = 3.3) {
  const a = put(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.12, 0.3, 72), M(top)), 0, -0.15, 0, false);
  put(g, new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r - 0.6, 0.8, 72), M(side, { roughness: 1 })), 0, -0.7, 0, false);
  return a;
}
// Bahay kubo: kawayan na poste, dingding na sawali, bubong na nipa
function kubo(g) {
  const h = new THREE.Group(); h.position.set(HOUSE.x, 0, HOUSE.z); h.rotation.y = -0.6;
  const bamboo = M(0xc8a165, { roughness: 0.7 }), wall = M(0xe2c48f, { roughness: 0.95 }), nipa = M(0x9c7a3c, { roughness: 1 });
  [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]].forEach(([x, z]) => put(h, new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), bamboo), x, 0.25, z));
  put(h, new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.1), bamboo), 0, 0.5, 0);
  put(h, new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 1.0), wall), 0, 0.92, 0);
  // pinto at bintana (nagliliwanag kapag gabi)
  const glow = M(0xffd27a, { emissive: 0xffa000, emissiveIntensity: 0.0 });
  put(h, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.02), M(0x7a5530)), 0, 0.8, 0.51, false);
  put(h, new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.02), glow), 0.4, 1.0, 0.51, false);
  const roof = put(h, new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.75, 4, 1), nipa), 0, 1.62, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 1.05);
  // hagdan
  for (let i = 0; i < 3; i++) put(h, new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.12), bamboo), 0, 0.12 + i * 0.14, 0.62 + (2 - i) * 0.12);
  g.add(h);
  return { group: h, glow };
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
  const R = rand(7), petal = M(col, { roughness: 0.6 }), ctr = M(0xffd54f);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = 1.2 + R() * r, f = new THREE.Group(); f.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d);
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), petal); p.scale.set(1, 0.4, 0.6); const b = (k / 5) * Math.PI * 2; p.position.set(Math.cos(b) * 0.06, 0.02, Math.sin(b) * 0.06); f.add(p); }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), ctr); c.position.y = 0.04; f.add(c); g.add(f);
  }
}

const BUILD = {
  island(g) { platform(g, 0x8fd18a, 0xc89a6b); flowers(g, 12, 1.8); tree(g, -2.3, -1.4, 1.1); tree(g, -1.6, -2.3, 0.85); put(g, new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), M(0xb8b2a8)), -2.4, 0.05, 0.6).scale.y = 0.6; },
  beach(g) {
    platform(g, 0xf3d9a4, 0xd9b77c);
    const sea = put(g, new THREE.Mesh(new THREE.RingGeometry(3.3, 4.4, 72), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.8, roughness: 0.2 })), 0, -0.05, 0, false); sea.rotation.x = -Math.PI / 2;
    palm(g, -2.2, -1.2); palm(g, -1.4, -2.3, 0.8);
    const pole = put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), M(0xffffff)), -1.2, 0.7, 1.4);
    const top = put(g, new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.35, 10), M(0xff6f61)), -1.2, 1.4, 1.4); top.castShadow = true; pole.castShadow = true;
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.06 : 0.15; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const star = put(g, new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }), M(0xff8a65)), 1.0, 0.02, 1.9); star.rotation.x = -Math.PI / 2;
  },
  coral(g) {
    platform(g, 0xdff3f2, 0xa8d8de);
    const cols = [0xff9aa2, 0xffb7b2, 0xa0e7e5, 0xffdac1];
    const R = rand(3);
    for (let i = 0; i < 7; i++) {
      const a = R() * Math.PI * 2, d = 2.1 + R() * 0.8, c = new THREE.Group(); c.position.set(Math.cos(a) * d, 0, Math.sin(a) * d * 0.9); g.add(c);
      for (let k = 0; k < 4; k++) { const b = put(c, new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4 + R() * 0.4, 6, 10), M(cols[i % 4], { roughness: 0.6 })), (k - 1.5) * 0.1, 0.35, 0); b.rotation.z = (k - 1.5) * 0.35; }
    }
    [[1.2, 1.8], [1.45, 1.95], [-0.9, 2.1]].forEach(([x, z]) => put(g, new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1, iridescence: 0.8 })), x, 0.1, z));
  },
  snow(g) {
    platform(g, 0xf5f9ff, 0xb7c7d9);
    [[-2.3, -1.3], [-1.6, -2.3], [-2.6, 0.2]].forEach(([x, z], i) => {
      [0.9, 0.65, 0.42].forEach((r, k) => put(g, new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, 0.7, 10), M(k ? 0x2e7d5b : 0x2e7d5b)), x, 0.45 + k * 0.4, z));
      put(g, new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 10), M(0xffffff)), x, 1.45, z);
    });
    [0.38, 0.28, 0.2].forEach((r, i) => put(g, new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), M(0xffffff, { roughness: 0.6 })), -1.0, r + [0, 0.6, 1.05][i] - (i ? 0.1 : 0), 1.7));
    put(g, new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 8), M(0xff7a1a)), -1.0, 1.25, 1.88).rotation.x = Math.PI / 2;
  },
  clouds(g) {
    const m = M(0xffffff, { roughness: 1 });
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.0, 0.3, 64), M(0xf3f0ff)), 0, -0.15, 0, false);
    const R = rand(11);
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, s = 0.45 + R() * 0.3; put(g, new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), m), Math.cos(a) * 3.2, -0.3 + R() * 0.2, Math.sin(a) * 3.2, false); }
    for (let i = 0; i < 3; i++) { const c = new THREE.Group(); c.position.set(-2 + i * 1.8, 2.6 + i * 0.3, -2.5); [[0, 0], [0.3, 0.1], [-0.3, 0.05]].forEach(([x, y]) => put(c, new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), m), x, y, 0, false)); g.add(c); c.userData.float = i; }
  },
  desert(g) {
    platform(g, 0xf0cf8f, 0xc99a5b);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8bf75)), -2.2, -0.35, -1.6, false).scale.y = 0.5;
    const pool = put(g, new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), M(0x3fb6d8, { roughness: 0.15 })), -1.0, 0.01, 1.5, false); pool.rotation.x = -Math.PI / 2;
    palm(g, -1.8, 1.2, 0.9); palm(g, -0.3, 2.2, 0.75);
  },
  moon(g) {
    platform(g, 0xd9dbe2, 0x9a9caa);
    const R = rand(5);
    for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = 1.3 + R() * 1.5, c = put(g, new THREE.Mesh(new THREE.TorusGeometry(0.22 + R() * 0.15, 0.05, 8, 24), M(0xbfc1ca)), Math.cos(a) * d, 0.01, Math.sin(a) * d, false); c.rotation.x = Math.PI / 2; }
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
  (BUILD[id] || BUILD.island)(group);
  const house = kubo(group);
  const floats = []; group.traverse((o) => { if (o.userData && o.userData.float !== undefined) floats.push(o); });
  return {
    group, house,
    night(on) { house.glow.emissiveIntensity = on ? 1.6 : 0; },
    update(t) { floats.forEach((o, i) => { o.position.y += Math.sin(t * 0.8 + i) * 0.002; o.rotation.y += 0.002; }); },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
