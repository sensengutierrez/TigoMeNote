/* TigoMeNote · tigo/buddies.js — maliliit na alagang hayop ni Tigo (3D) na sumusunod sa kanya
   import { createBuddy } from "./buddies.js"
   const b = createBuddy("puppy")  → { group, update(dt, t, target{x,z}, sleeping), hop(), dispose() }
   id = puppy | kitty | birdie | bunbun | turtle | chick. Ang birdie ay lumilipad sa tabi ni Tigo.
   Kapag tulog si Tigo, natutulog din ang buddy sa tabi ng bahay. Sariling disenyo (simpleng hugis). */
import * as THREE from "../../vendor/three/three.module.min.js";

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
}
const S = (r) => new THREE.SphereGeometry(r, 16, 12);
function eyes(p, y, z, gap = 0.07, r = 0.028) {
  const k = M(0x1d1416, { roughness: 0.3 });
  [-gap, gap].forEach((x) => mesh(p, S(r), k, x, y, z));
}

const BUILD = {
  puppy(g) {
    const fur = M(0xd9a066), ear = M(0x8a5a33), w = M(0xfff3e0);
    mesh(g, S(0.2), fur, 0, 0.22, 0, 1, 0.85, 1.25);
    const head = new THREE.Group(); head.position.set(0, 0.42, 0.2); g.add(head);
    mesh(head, S(0.16), fur, 0, 0, 0); mesh(head, S(0.08), w, 0, -0.04, 0.12, 1, 0.8, 1); mesh(head, S(0.03), M(0x222222), 0, -0.01, 0.2);
    [-1, 1].forEach((s) => mesh(head, S(0.07), ear, s * 0.14, 0.02, -0.02, 0.6, 1.5, 0.6).rotation.z = s * 0.3);
    eyes(head, 0.04, 0.13, 0.065);
    const tail = mesh(g, new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), fur, 0, 0.32, -0.26); tail.rotation.x = -0.8; g.userData.tail = tail;
    [[-0.1, 0.12], [0.1, 0.12], [-0.1, -0.12], [0.1, -0.12]].forEach(([x, z]) => mesh(g, S(0.05), fur, x, 0.05, z));
    g.userData.head = head;
  },
  kitty(g) {
    const fur = M(0x9e9e9e), w = M(0xffffff), pink = M(0xffa1b5);
    mesh(g, S(0.18), fur, 0, 0.2, 0, 1, 0.85, 1.25);
    const head = new THREE.Group(); head.position.set(0, 0.4, 0.17); g.add(head);
    mesh(head, S(0.15), fur, 0, 0, 0); mesh(head, S(0.06), w, 0, -0.05, 0.11, 1.2, 0.7, 0.8); mesh(head, S(0.02), pink, 0, -0.02, 0.15);
    [-1, 1].forEach((s) => mesh(head, new THREE.ConeGeometry(0.06, 0.12, 4), fur, s * 0.09, 0.15, 0).rotation.z = -s * 0.25);
    eyes(head, 0.03, 0.12, 0.06);
    const tail = mesh(g, new THREE.CapsuleGeometry(0.025, 0.28, 4, 8), fur, 0, 0.35, -0.25); tail.rotation.x = -0.4; g.userData.tail = tail;
    [[-0.08, 0.1], [0.08, 0.1], [-0.08, -0.1], [0.08, -0.1]].forEach(([x, z]) => mesh(g, S(0.045), w, x, 0.04, z));
    g.userData.head = head;
  },
  birdie(g) {
    const brown = M(0x8d6e4a), cream = M(0xf3e1c2), beak = M(0xffb300);
    mesh(g, S(0.13), brown, 0, 0, 0, 1, 1, 1.2); mesh(g, S(0.09), cream, 0, -0.03, 0.06, 1, 0.9, 0.9);
    mesh(g, S(0.1), brown, 0, 0.12, 0.08); mesh(g, new THREE.ConeGeometry(0.03, 0.07, 6), beak, 0, 0.11, 0.2).rotation.x = Math.PI / 2;
    eyes(g, 0.15, 0.16, 0.05, 0.02);
    g.userData.wings = [-1, 1].map((s) => { const w = mesh(g, S(0.08), brown, s * 0.12, 0.02, 0, 0.3, 0.7, 1.2); return w; });
    mesh(g, new THREE.ConeGeometry(0.05, 0.14, 4), brown, 0, 0.02, -0.18).rotation.x = -Math.PI / 2.3;
    g.userData.fly = true;
  },
  bunbun(g) {
    const fur = M(0xfafafa), pink = M(0xffb6c8);
    mesh(g, S(0.18), fur, 0, 0.18, 0, 1, 0.95, 1.15);
    const head = new THREE.Group(); head.position.set(0, 0.36, 0.14); g.add(head);
    mesh(head, S(0.14), fur, 0, 0, 0);
    [-1, 1].forEach((s) => { const e = mesh(head, new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), fur, s * 0.06, 0.2, -0.02); e.rotation.z = -s * 0.15; mesh(e, new THREE.CapsuleGeometry(0.018, 0.12, 4, 8), pink, 0, 0, 0.02); });
    eyes(head, 0.03, 0.12, 0.06); mesh(head, S(0.02), pink, 0, -0.02, 0.14);
    mesh(g, S(0.06), fur, 0, 0.18, -0.2);
    g.userData.head = head; g.userData.hopper = true;
  },
  turtle(g) {
    const shell = M(0x4e8a3e, { roughness: 0.5 }), skin = M(0x9ccc65), lines = M(0x37622b);
    mesh(g, new THREE.SphereGeometry(0.22, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.06, 0, 1, 0.8, 1.15);
    mesh(g, new THREE.TorusGeometry(0.2, 0.02, 6, 24), lines, 0, 0.07, 0, 1, 1, 1.15).rotation.x = Math.PI / 2;
    const head = new THREE.Group(); head.position.set(0, 0.1, 0.28); g.add(head);
    mesh(head, S(0.08), skin, 0, 0, 0); eyes(head, 0.03, 0.06, 0.04, 0.015);
    [[-0.18, 0.14], [0.18, 0.14], [-0.18, -0.14], [0.18, -0.14]].forEach(([x, z]) => mesh(g, S(0.06), skin, x, 0.04, z, 1.3, 0.5, 1));
    g.userData.head = head; g.userData.slow = true;
  },
  chick(g) {
    const y = M(0xffe14d), o = M(0xff9800);
    mesh(g, S(0.14), y, 0, 0.15, 0, 1, 1.05, 1);
    mesh(g, new THREE.ConeGeometry(0.03, 0.07, 6), o, 0, 0.18, 0.15).rotation.x = Math.PI / 2;
    eyes(g, 0.22, 0.12, 0.05, 0.02);
    [-1, 1].forEach((s) => mesh(g, S(0.05), y, s * 0.13, 0.13, 0, 0.4, 0.8, 1));
    mesh(g, S(0.04), y, 0, 0.3, 0, 0.6, 1, 0.6);
    [-0.05, 0.05].forEach((x) => mesh(g, new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), o, x, 0.02, 0));
    g.userData.hopper = true;
  },
};

export function createBuddy(id) {
  if (!BUILD[id]) return null;
  const group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
  BUILD[id](inner);
  const u = inner.userData;
  const st = { hop: 0, t: Math.random() * 10, pos: new THREE.Vector3(-0.9, 0, 0.6) };
  group.position.copy(st.pos);
  return {
    id, group,
    hop() { st.hop = 0.5; },
    update(dt, t, target, sleeping) {
      // sundan si Tigo (sa likod-gilid), at tumigil kapag malapit na
      const goal = new THREE.Vector3(target.x - 0.75, 0, target.z + 0.35);
      const d = goal.clone().sub(group.position); d.y = 0;
      const dist = d.length(), speed = (u.slow ? 1.2 : 2.6) * dt;
      let moving = false;
      if (dist > 0.15) { group.position.addScaledVector(d.normalize(), Math.min(dist, speed * Math.min(2, dist))); moving = true; group.rotation.y += (Math.atan2(d.x, d.z) - group.rotation.y) * 0.15; }
      else group.rotation.y += (Math.atan2(target.x - group.position.x, target.z - group.position.z) - group.rotation.y) * 0.05;
      st.t += dt * (moving ? 10 : 2);
      let y = 0;
      if (u.fly) y = 1.25 + Math.sin(t * 2) * 0.12;
      else if (sleeping) { inner.rotation.z = 0.0; inner.scale.y = 0.85 + Math.sin(t * 1.5) * 0.02; }
      else { inner.scale.y = 1; if (moving || u.hopper) y = Math.abs(Math.sin(st.t * (u.hopper ? 0.6 : 1))) * (u.hopper ? 0.12 : 0.04) * (moving || u.hopper ? 1 : 0); }
      if (st.hop > 0) { st.hop = Math.max(0, st.hop - dt); y += Math.sin((1 - st.hop / 0.5) * Math.PI) * 0.35; }
      inner.position.y = y;
      if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(t * 22) * 0.6); });
      if (u.tail) u.tail.rotation.z = Math.sin(t * (moving ? 14 : 5)) * 0.5;
      if (u.head) u.head.rotation.x = sleeping ? 0.35 : Math.sin(t * 1.3) * 0.08;
    },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
