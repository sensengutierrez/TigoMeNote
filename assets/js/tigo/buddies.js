/* TigoMeNote · tigo/buddies.js — maliliit na alagang hayop ni Tigo (3D) na sumusunod sa kanya
   import { createBuddy } from "./buddies.js"
   const b = createBuddy("puppy")  → { group, update(dt, t, target{x,z}, sleeping), hop(), dispose() }
   id = puppy | kitty | birdie | bunbun | turtle | chick. Ang birdie ay lumilipad sa tabi ni Tigo.
   Kapag tulog si Tigo, natutulog din ang buddy sa tabi ng bahay. Sariling disenyo: may nguso, paang gumagalaw, kwelyo, balbas (pusa). */
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

// 4 paa na may pivot sa balakang → umuugoy kapag naglalakad (g.userData.legs)
function legs(g, fur, paw, at, r, h) {
  g.userData.legs = at.map(([x, z]) => {
    const pv = new THREE.Group(); pv.position.set(x, h, z); g.add(pv);
    mesh(pv, new THREE.CapsuleGeometry(r, h - r * 2.2, 4, 10), fur, 0, -h / 2 + r * 0.4, 0);
    mesh(pv, S(r * 1.15), paw, 0, -h + r * 0.9, 0.012, 1, 0.7, 1.25);
    return pv;
  });
}
// kwelyo + gintong tag
function collar(g, y, z, color) {
  const c = mesh(g, new THREE.TorusGeometry(0.1, 0.018, 8, 24), M(color, { roughness: 0.4 }), 0, y, z, 1.05, 1, 1); c.rotation.x = Math.PI / 2 - 0.5;
  mesh(g, new THREE.CylinderGeometry(0.025, 0.025, 0.008, 14), M(0xf4c342, { metalness: 0.8, roughness: 0.25 }), 0, y - 0.07, z + 0.085).rotation.x = Math.PI / 2 - 0.2;
}

const BUILD = {
  // Aso: may nguso, nakalaylay na tainga, 4 na paang gumagalaw, kwelyo at tag
  puppy(g) {
    const fur = M(0xd9a066, { roughness: 0.85 }), ear = M(0x8a5a33, { roughness: 0.9 }), w = M(0xfff3e0, { roughness: 0.85 }), nose = M(0x1d1416, { roughness: 0.25 });
    mesh(g, new THREE.CapsuleGeometry(0.15, 0.22, 8, 16), fur, 0, 0.27, -0.01, 1, 1, 1).rotation.x = Math.PI / 2;
    mesh(g, S(0.12), w, 0, 0.24, 0.1, 0.9, 0.8, 0.8); // dibdib
    legs(g, fur, w, [[-0.09, 0.13], [0.09, 0.13], [-0.09, -0.15], [0.09, -0.15]], 0.045, 0.2);
    const head = new THREE.Group(); head.position.set(0, 0.47, 0.2); g.add(head);
    mesh(head, S(0.15), fur, 0, 0, 0, 1, 0.95, 1);
    mesh(head, new THREE.CapsuleGeometry(0.07, 0.06, 6, 12), w, 0, -0.05, 0.13, 1.1, 1, 1).rotation.x = Math.PI / 2; // nguso
    mesh(head, S(0.035), nose, 0, -0.02, 0.22, 1.2, 0.9, 1);
    mesh(head, new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI), nose, 0, -0.08, 0.19).rotation.z = Math.PI; // bibig
    head.userData.ears = [-1, 1].map((sd) => { const e = mesh(head, S(0.07), ear, sd * 0.13, 0.02, -0.01, 0.45, 1.25, 0.8); e.rotation.z = sd * 0.35; return e; });
    eyes(head, 0.04, 0.125, 0.065, 0.026);
    collar(g, 0.37, 0.15, 0xe53950);
    const tail = mesh(g, new THREE.CapsuleGeometry(0.028, 0.14, 4, 8), fur, 0, 0.36, -0.25); tail.rotation.x = -0.9; g.userData.tail = tail;
    g.userData.head = head;
  },
  // Pusa: may balbas, matulis na tainga na may pink sa loob, mahabang buntot na kurbado
  kitty(g) {
    const fur = M(0x9e9e9e, { roughness: 0.85 }), stripe = M(0x7a7a7a, { roughness: 0.85 }), w = M(0xffffff, { roughness: 0.85 }), pink = M(0xffa1b5);
    mesh(g, new THREE.CapsuleGeometry(0.13, 0.2, 8, 16), fur, 0, 0.25, 0, 1, 1, 1).rotation.x = Math.PI / 2;
    [-0.06, 0.04, 0.14].forEach((z) => mesh(g, new THREE.TorusGeometry(0.128, 0.012, 4, 20, Math.PI), stripe, 0, 0.25, z).rotation.y = Math.PI / 2);
    legs(g, fur, w, [[-0.075, 0.12], [0.075, 0.12], [-0.075, -0.13], [0.075, -0.13]], 0.038, 0.19);
    const head = new THREE.Group(); head.position.set(0, 0.44, 0.18); g.add(head);
    mesh(head, S(0.14), fur, 0, 0, 0, 1.08, 0.95, 1);
    mesh(head, S(0.06), w, 0, -0.05, 0.1, 1.3, 0.75, 0.8); mesh(head, S(0.018), pink, 0, -0.02, 0.14);
    [-1, 1].forEach((sd) => {
      const e = mesh(head, new THREE.ConeGeometry(0.055, 0.11, 4), fur, sd * 0.085, 0.14, 0); e.rotation.z = -sd * 0.25;
      mesh(e, new THREE.ConeGeometry(0.03, 0.07, 4), pink, 0, -0.01, 0.022);
      [-0.012, 0.012].forEach((dy) => { const wh = mesh(head, new THREE.CylinderGeometry(0.0025, 0.0025, 0.14, 4), w, sd * 0.09, -0.04 + dy, 0.12); wh.rotation.z = Math.PI / 2 + sd * dy * 8; });
    });
    eyes(head, 0.03, 0.12, 0.058, 0.024);
    collar(g, 0.35, 0.13, 0x3d7ae5);
    const tail = mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0, 0.08, -0.08], [0, 0.22, -0.1], [0.04, 0.3, -0.04]].map((v) => new THREE.Vector3(...v))), 16, 0.022, 6), fur, 0, 0.27, -0.22);
    g.userData.tail = tail;
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
    mesh(g, S(0.065), fur, 0, 0.2, -0.2); // buntot na bilog
    [-1, 1].forEach((sd) => { mesh(g, S(0.07), fur, sd * 0.1, 0.07, -0.06, 0.8, 0.6, 1.5); mesh(g, S(0.04), fur, sd * 0.07, 0.04, 0.13, 1, 0.8, 1.3); }); // malalaking paa sa likod, maliliit sa harap
    [-1, 1].forEach((sd) => mesh(head, S(0.035), M(0xffe0ea), sd * 0.035, -0.05, 0.11));
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
      if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = sleeping ? 0 : moving ? Math.sin(st.t + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55 : 0; });
      if (u.head && u.head.userData.ears) u.head.userData.ears.forEach((e, i) => { e.rotation.x = moving ? Math.sin(st.t * 1.0 + i) * 0.25 : 0; });
      if (u.head) u.head.rotation.x = sleeping ? 0.35 : Math.sin(t * 1.3) * 0.08;
    },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
