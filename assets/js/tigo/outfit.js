/* TigoMeNote · tigo/outfit.js — mga isinusuot ni Tigo sa 3D (sumbrero, salamin, damit, hawak)
   import { buildWear } from "./outfit.js"
   buildWear(id) → { group, anchor }   anchor = "hat" | "face" | "body" | "back" | "hand"
   Sukat ng katawan ni Tigo (pet-model.js): lapad 1.32, taas 1.5 (y 0.2–1.7), kapal 0.82 (z ±0.41).
   Ang posisyon dito ay relative sa anchor ng model. Sariling disenyo lahat. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
// May galaw ang ilang gamit: group.userData.tick(t, walk) → tinatawag ng pet-model bawat frame (wagayway ng flag, ugoy ng cape, atbp.)

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const add = (g, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh); return mesh; };
const sphere = (r, s = 20) => new THREE.SphereGeometry(r, s, Math.round(s * 0.7));
const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 8);

function glasses(g, lens, frame, shape) {
  const fm = M(frame, { roughness: 0.3 }), lm = new THREE.MeshPhysicalMaterial({ color: lens, transparent: true, opacity: 0.7, roughness: 0.1, clearcoat: 1 });
  [-0.27, 0.27].forEach((x) => {
    let rim, glass;
    if (shape === "heart" || shape === "star") {
      const s = new THREE.Shape();
      if (shape === "heart") { s.moveTo(0, -0.12); s.bezierCurveTo(-0.2, 0, -0.12, 0.16, 0, 0.06); s.bezierCurveTo(0.12, 0.16, 0.2, 0, 0, -0.12); }
      else { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.07 : 0.16; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } }
      glass = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), shape === "heart" ? M(0xff3d7f, { emissive: 0x3a0012 }) : M(0xffd23f, { emissive: 0x3a2a00 }));
      add(g, glass, x, 0.08, 0.04);
      return;
    }
    rim = new THREE.Mesh(new THREE.TorusGeometry(shape === "round" ? 0.15 : 0.16, 0.022, 10, 28), fm);
    if (shape !== "round") rim.scale.set(1.15, 0.8, 1);
    add(g, rim, x, 0.08, 0.06);
    glass = new THREE.Mesh(new THREE.CircleGeometry(shape === "round" ? 0.14 : 0.15, 24), lm);
    if (shape !== "round") glass.scale.set(1.15, 0.8, 1);
    add(g, glass, x, 0.08, 0.055);
  });
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), fm), 0, 0.1, 0.06).rotation.z = Math.PI / 2;
}

const BUILD = {
  // ---------- hats (anchor: tuktok ng ulo, y = 0) ----------
  beanie(g) {
    const m = M(0xff6f61, { roughness: 0.9 });
    const dome = add(g, new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m), 0, -0.2, 0); dome.scale.set(1.1, 0.75, 0.75);
    const band = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 10, 32), M(0xf2f2f2, { roughness: 0.9 })), 0, -0.2, 0); band.rotation.x = Math.PI / 2; band.scale.set(1.12, 0.72, 1);
    add(g, new THREE.Mesh(sphere(0.13), M(0xffffff, { roughness: 1 })), 0, 0.3, 0);
  },
  party(g) {
    const cone = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.6, 24), M(0x7c5cff)), 0.1, 0.25, 0); cone.rotation.z = -0.2;
    for (let i = 0; i < 4; i++) add(g, new THREE.Mesh(sphere(0.035, 8), M([0xffd23f, 0x3dd6c0, 0xff5a8a, 0xffffff][i])), 0.1 + Math.sin(i) * 0.12, 0.05 + i * 0.12, 0.17 - i * 0.03);
    add(g, new THREE.Mesh(sphere(0.07), M(0xffd23f)), 0.2, 0.56, 0);
  },
  bunny(g) {
    const m = M(0xffffff, { roughness: 0.8 }), inner = M(0xffa3c4);
    [-0.25, 0.25].forEach((x, i) => {
      const e = add(g, new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 6, 12), m), x, 0.32, 0); e.rotation.z = i ? -0.2 : 0.2;
      const n = add(g, new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 6, 10), inner), x, 0.32, 0.06); n.rotation.z = e.rotation.z;
    });
  },
  sampaguita(g) {
    const leaf = M(0x4caf50), petal = M(0xffffff, { roughness: 0.6 }), ctr = M(0xffd54f);
    const ring = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 40), leaf), 0, -0.05, 0); ring.rotation.x = Math.PI / 2; ring.scale.set(1.1, 0.72, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, f = new THREE.Group(); f.position.set(Math.cos(a) * 0.6, -0.02, Math.sin(a) * 0.4);
      for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(sphere(0.05, 8), petal); p.scale.set(1, 0.4, 0.6); const b = (k / 5) * Math.PI * 2; p.position.set(Math.cos(b) * 0.05, 0.03, Math.sin(b) * 0.05); f.add(p); }
      f.add(new THREE.Mesh(sphere(0.025, 8), ctr)); g.add(f);
    }
  },
  salakot(g) {
    const m = M(0xc9a26b, { roughness: 0.95 });
    add(g, new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 32, 1, true), m), 0, 0.08, 0).material.side = THREE.DoubleSide;
    add(g, new THREE.Mesh(sphere(0.06), M(0x8d6e4a)), 0, 0.3, 0);
    for (let i = 0; i < 6; i++) { const l = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.25 + i * 0.12, 0.008, 4, 40), M(0x8d6e4a)), 0, 0.22 - i * 0.05, 0); l.rotation.x = Math.PI / 2; }
  },
  chef(g) {
    const m = M(0xffffff, { roughness: 0.85 });
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.3, 28), m), 0, 0.05, 0);
    [[-0.2, 0.35, 0], [0.2, 0.35, 0], [0, 0.42, 0.1], [0, 0.4, -0.12]].forEach(([x, y, z]) => add(g, new THREE.Mesh(sphere(0.26), m), x, y, z));
  },
  halo(g) {
    const h = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 12, 40), M(0xffe27a, { emissive: 0xffc400, emissiveIntensity: 0.9, metalness: 0.3 })), 0, 0.45, 0);
    h.rotation.x = Math.PI / 2; h.castShadow = false;
  },
  // ---------- face (anchor: gitna ng mata, z = harap) ----------
  shades(g) { glasses(g, 0x111827, 0x111111, "wide"); },
  round(g) { glasses(g, 0xdbeafe, 0x6b4f2a, "round"); },
  hearts(g) { glasses(g, 0, 0, "heart"); },
  stars(g) { glasses(g, 0, 0, "star"); },
  goggles(g) {
    const strap = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 8, 40, Math.PI), M(0x333333)), 0, 0.08, -0.32); strap.rotation.set(Math.PI / 2, 0, Math.PI);
    strap.scale.set(1, 1.05, 1);
    [-0.27, 0.27].forEach((x) => {
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 24), M(0x2b2b2b)), x, 0.08, 0.06).rotation.x = Math.PI / 2;
      add(g, new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), new THREE.MeshPhysicalMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.75, clearcoat: 1, roughness: 0.05 })), x, 0.08, 0.115);
    });
  },
  mustache(g) {
    const m = M(0x3b2a20, { roughness: 0.8 });
    [-1, 1].forEach((s) => { const c = add(g, new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 6, 10), m), s * 0.11, -0.14, 0.05); c.rotation.z = s * 1.2; });
  },
  mask(g) {
    const s = new THREE.Shape(); s.moveTo(-0.5, 0.05); s.quadraticCurveTo(-0.45, 0.22, -0.1, 0.16); s.lineTo(0, 0.1); s.lineTo(0.1, 0.16); s.quadraticCurveTo(0.45, 0.22, 0.5, 0.05); s.quadraticCurveTo(0.42, -0.12, 0.1, -0.04); s.lineTo(0, -0.08); s.lineTo(-0.1, -0.04); s.quadraticCurveTo(-0.42, -0.12, -0.5, 0.05);
    [-0.27, 0.27].forEach((x) => { const h = new THREE.Path(); h.absellipse(x, 0.06, 0.1, 0.07, 0, Math.PI * 2, true); s.holes.push(h); });
    add(g, new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 }), M(0xe8264f, { roughness: 0.35 })), 0, 0.02, 0.02);
  },
  // ---------- body (anchor: harap ng dibdib, y = 0 ay leeg) ----------
  scarf(g) {
    const m = M(0x2f9e8f, { roughness: 0.9 });
    const r = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.1, 12, 36), m), 0, 0, -0.41); r.rotation.x = Math.PI / 2; r.scale.set(1.18, 0.8, 1);
    const tail = add(g, new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.06), m), 0.3, -0.25, 0.05); tail.rotation.z = 0.15;
    for (let i = 0; i < 3; i++) add(g, new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.065), M(0xffffff)), 0.3 + i * 0.01, -0.12 - i * 0.12, 0.05).rotation.z = 0.15;
  },
  bowtie(g) {
    const m = M(0x2d4ea8, { roughness: 0.4 });
    add(g, new THREE.Mesh(sphere(0.05), m), 0, -0.2, 0.05);
    [-1, 1].forEach((s) => { const w = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), m), s * 0.11, -0.2, 0.03); w.rotation.z = -s * Math.PI / 2; });
  },
  // Hoodie: tela na bumabalot sa ibabang katawan (may rib sa laylayan), hood sa likod, tali at kangaroo pocket
  hoodie(g) {
    const m = M(0xff8a3d, { roughness: 0.92 }), dark = M(0xe0661f, { roughness: 0.95 }), cord = M(0xffffff, { roughness: 0.6 });
    // katawan ni Tigo: lapad 1.32, kapal 0.82 → bahagyang mas malaki para "nakasuot"
    // mula laylayan (-0.56) hanggang balikat (0.3) — sa ilalim ng bibig
    add(g, new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.86, 0.9, 5, 0.3), m), 0, -0.13, -0.41);
    add(g, new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.1, 0.92, 3, 0.05), dark), 0, -0.53, -0.41); // rib sa laylayan
    const hood = add(g, new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m), 0, 0.3, -0.87); hood.rotation.x = -1.3; hood.scale.set(1.2, 1, 0.5);
    const neck = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 10, 36), dark), 0, 0.3, -0.41); neck.rotation.x = Math.PI / 2; neck.scale.set(1.13, 0.74, 1);
    const zip = add(g, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.012), dark), 0, 0.02, 0.05);
    [-0.12, 0.12].forEach((x) => { add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.24, 6), cord), x, 0.17, 0.055); add(g, new THREE.Mesh(sphere(0.024, 8), cord), x, 0.04, 0.055); });
    const pk = add(g, new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.24, 0.05, 2, 0.03), dark), 0, -0.3, 0.05);
    zip.castShadow = false;
    return pk;
  },
  // Cape: telang umuugoy kapag naglalakad
  cape(g) {
    const geo = new THREE.PlaneGeometry(1.3, 1.1, 10, 10), pos = geo.attributes.position, base = Float32Array.from(pos.array);
    for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; base[i * 3] = x * (1 + (0.55 - y) * 0.2); }
    pos.array.set(base);
    const c = add(g, new THREE.Mesh(geo, M(0xd62839, { side: THREE.DoubleSide, roughness: 0.65 })), 0, -0.05, -0.88);
    add(g, new THREE.Mesh(sphere(0.07), M(0xffd23f, { metalness: 0.7, roughness: 0.25 })), 0, 0.42, 0.04);
    const tie = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 36, Math.PI), M(0xffd23f, { metalness: 0.6 })), 0, 0.46, -0.41); tie.rotation.x = Math.PI / 2; tie.scale.set(1.1, 0.74, 1);
    g.userData.tick = (t, walk) => {
      const a = pos.array, k = 0.05 + walk * 0.18;
      for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], d = (0.55 - y); a[i * 3 + 2] = -d * d * (0.12 + walk * 0.35) + Math.sin(t * 4 + x * 3 + y * 2) * k * d * 0.4; }
      pos.needsUpdate = true; geo.computeVertexNormals();
    };
  },
  // Backpack: bag sa likod na may flap, bulsa, zipper at strap sa balikat na nakadikit sa katawan
  backpack(g) {
    const m = M(0xffb020, { roughness: 0.75 }), dark = M(0xd98a10, { roughness: 0.8 }), strapM = M(0x7a4f1d, { roughness: 0.6 }), metal = M(0xcfd4da, { metalness: 0.8, roughness: 0.3 });
    // bag (likod: z ng katawan = -0.82 mula sa anchor)
    add(g, new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.92, 0.34, 4, 0.12), m), 0, -0.12, -1.0);
    add(g, new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.3, 0.38, 3, 0.1), dark), 0, 0.22, -1.0); // flap
    add(g, new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.34, 0.12, 3, 0.06), dark), 0, -0.32, -1.2); // bulsa sa harap ng bag
    add(g, new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.015, 0.02), metal), 0, -0.2, -1.265); // zipper
    add(g, new THREE.Mesh(sphere(0.03, 8), metal), 0.2, -0.2, -1.27);
    // hawakan sa itaas
    const h = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 16, Math.PI), strapM), 0, 0.37, -0.98); h.rotation.y = Math.PI / 2;
    // strap: mula sa itaas ng bag → paikot sa gilid ng balikat → pababa sa harap (nakadikit sa katawan, hindi lumalampas sa paa)
    [-1, 1].forEach((sd) => {
      // itaas: likod ng bag → ibabaw ng balikat (lampas sa braso) → harap, nakadikit sa katawan
      const up = [[sd * 0.3, 0.32, -0.86], [sd * 0.58, 0.5, -0.78], [sd * 0.71, 0.53, -0.41], [sd * 0.63, 0.5, -0.04], [sd * 0.46, 0.34, 0.035], [sd * 0.4, 0.1, 0.04], [sd * 0.4, -0.06, 0.04]];
      // ibaba: buckle → gilid (ilalim ng braso) → ilalim ng bag
      const lo = [[sd * 0.4, -0.06, 0.04], [sd * 0.53, -0.16, 0.0], [sd * 0.66, -0.22, -0.12], [sd * 0.71, -0.26, -0.41], [sd * 0.62, -0.32, -0.74], [sd * 0.34, -0.4, -0.86]];
      add(g, new THREE.Mesh(tube(up, 0.032), strapM), 0, 0, 0);
      add(g, new THREE.Mesh(tube(lo, 0.024), strapM), 0, 0, 0);
      add(g, new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.04, 2, 0.015), metal), sd * 0.4, -0.06, 0.06); // buckle
    });
  },
  lei(g) {
    const cols = [0xff4f8b, 0xffd23f, 0xff7a59, 0xffffff];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; add(g, new THREE.Mesh(sphere(0.07, 10), M(cols[i % 4], { roughness: 0.6 })), Math.cos(a) * 0.68, -0.05 + Math.max(0, Math.sin(a)) * -0.08, -0.41 + Math.sin(a) * 0.47); }
  },
  medal(g) {
    const r = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 30, Math.PI), M(0x2f6fde)), 0, 0, 0.02); r.rotation.z = Math.PI;
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24), M(0xf4c342, { metalness: 0.8, roughness: 0.2 })), 0, -0.45, 0.06).rotation.x = Math.PI / 2;
  },
  // ---------- hand (anchor: dulo ng kanang kamay) ----------
  icecream(g) {
    add(g, new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 16), M(0xd99a55)), 0, 0.05, 0).rotation.x = Math.PI;
    add(g, new THREE.Mesh(sphere(0.12), M(0xff9ec7)), 0, 0.24, 0); add(g, new THREE.Mesh(sphere(0.1), M(0xfff1c1)), 0, 0.36, 0);
  },
  balloon(g) {
    const fl = new THREE.Group(); g.add(fl);
    add(fl, new THREE.Mesh(tube([[0, 0, 0], [0.05, 0.4, 0], [-0.03, 0.8, 0], [0, 1.08, 0]], 0.006), M(0xffffff)), 0, 0, 0);
    const b = add(fl, new THREE.Mesh(sphere(0.24, 28), new THREE.MeshPhysicalMaterial({ color: 0xff3d5a, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1 })), 0, 1.32, 0); b.scale.y = 1.15;
    add(fl, new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 8), M(0xff3d5a)), 0, 1.06, 0).rotation.x = Math.PI;
    g.userData.tick = (t, walk) => { fl.rotation.z = Math.sin(t * 1.6) * 0.08 + walk * 0.15; fl.rotation.x = Math.sin(t * 1.1) * 0.05 + walk * 0.25; };
  },
  "flag-ph"(g) { flag(g, "ph"); },
  "flag-bh"(g) { flag(g, "bh"); },
  // Payong: tangkay na dumadaan sa kamao, J na hawakan sa ibaba, 8 tela na may tadyang (ribs)
  umbrella(g) {
    const shaft = M(0x3a3a40, { metalness: 0.5, roughness: 0.35 });
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8), shaft), 0, 0.5, 0);
    const hk = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 16, Math.PI), M(0x6b3e1f)), 0.07, -0.13, 0); hk.rotation.z = Math.PI;
    const can = new THREE.Group(); can.position.y = 1.12; g.add(can);
    const cols = [0x5ec8f2, 0xffffff];
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.78, 6, 6, (i / 8) * Math.PI * 2, Math.PI / 4, 0, Math.PI / 2.6), M(cols[i % 2], { side: THREE.DoubleSide, roughness: 0.6 }));
      seg.scale.y = 0.55; seg.castShadow = true; can.add(seg);
    }
    add(can, new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), shaft), 0, 0.46, 0);
    g.userData.tick = (t, walk) => { can.rotation.z = Math.sin(t * 2.2) * 0.04 * (1 + walk * 2); };
  },
  guitar(g) {
    const wood = M(0xc8833f, { roughness: 0.5 });
    const b1 = add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24), wood), 0, -0.05, 0.1); b1.rotation.x = Math.PI / 2;
    const b2 = add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 24), wood), 0, 0.2, 0.1); b2.rotation.x = Math.PI / 2;
    add(g, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), M(0x5b3a1e)), 0, 0.55, 0.12);
    add(g, new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), M(0x222222)), 0, 0.02, 0.145);
    g.rotation.z = 0.6;
  },
  wand(g) {
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.6, 8), M(0x6b46c1)), 0, 0.3, 0);
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.06 : 0.14; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    add(g, new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 }), M(0xffd23f, { emissive: 0x806000, emissiveIntensity: 0.8 })), 0, 0.68, -0.02);
  },
};
// Flag: poste na dumadaan sa kamao + telang wumawagayway
function flag(g, kind) {
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.15, 8), M(0xdddddd, { metalness: 0.6, roughness: 0.3 })), 0, 0.42, 0);
  add(g, new THREE.Mesh(sphere(0.035, 10), M(0xf4c342, { metalness: 0.8, roughness: 0.2 })), 0, 1.01, 0);
  const cv = document.createElement("canvas"); cv.width = 96; cv.height = 64; const x = cv.getContext("2d");
  if (kind === "ph") {
    x.fillStyle = "#0038a8"; x.fillRect(0, 0, 96, 32); x.fillStyle = "#ce1126"; x.fillRect(0, 32, 96, 32);
    x.fillStyle = "#fff"; x.beginPath(); x.moveTo(0, 0); x.lineTo(46, 32); x.lineTo(0, 64); x.fill();
    x.fillStyle = "#fcd116"; x.beginPath(); x.arc(15, 32, 6, 0, Math.PI * 2); x.fill();
  } else {
    x.fillStyle = "#ce1126"; x.fillRect(0, 0, 96, 64); x.fillStyle = "#fff"; x.beginPath(); x.moveTo(0, 0); x.lineTo(28, 0);
    for (let i = 0; i < 5; i++) { x.lineTo(40, 6.4 + i * 12.8); x.lineTo(28, 12.8 + i * 12.8); } x.lineTo(0, 64); x.fill();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(0.52, 0.34, 12, 6), pos = geo.attributes.position, base = Float32Array.from(pos.array);
  const cloth = add(g, new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.85 })), 0.27, 0.8, 0);
  cloth.castShadow = true;
  g.userData.tick = (t, walk) => {
    const a = pos.array, sp = 5 + walk * 6;
    for (let i = 0; i < pos.count; i++) { const x = base[i * 3] + 0.26; a[i * 3 + 2] = Math.sin(t * sp - x * 9) * 0.045 * x * 3; a[i * 3 + 1] = base[i * 3 + 1] - x * x * 0.12; }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
}

const ANCHOR = { hat: "hat", face: "face", body: "body", hand: "hand" };
const SLOT_OF = {
  beanie: "hat", party: "hat", bunny: "hat", sampaguita: "hat", salakot: "hat", chef: "hat", halo: "hat",
  shades: "face", round: "face", hearts: "face", stars: "face", goggles: "face", mustache: "face", mask: "face",
  scarf: "body", bowtie: "body", hoodie: "body", cape: "body", backpack: "body", lei: "body", medal: "body",
  icecream: "hand", balloon: "hand", "flag-ph": "hand", "flag-bh": "hand", umbrella: "hand", guitar: "hand", wand: "hand",
};
export function buildWear(id) {
  if (!BUILD[id]) return null;
  const group = new THREE.Group();
  BUILD[id](group);
  return { group, anchor: ANCHOR[SLOT_OF[id]] || "hat" };
}
export const hasWear = (id) => !!BUILD[id];
