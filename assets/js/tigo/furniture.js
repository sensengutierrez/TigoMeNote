/* TigoMeNote · tigo/furniture.js — mga gamit sa loob ng bahay ni Tigo (3D, gawa sa code; sariling disenyo)
   import { FURN, buildFurniture } from "./furniture.js"
   FURN[id] = { w, d, wall?, flat?, seat? (taas ng upuan), bed? }  → sukat sa sahig (para hindi tumagos si Tigo), wall = nakasabit sa dingding
   buildFurniture(id) → { group, update(t, night), dispose() }  — nakaharap sa +z (papunta sa gitna ng kwarto)
   May galaw: umiikot ang electric fan, lumalangoy ang isda, totoong oras sa wall clock, ilaw sa gabi (lamp, star lights, TV). */
import * as THREE from "../../vendor/three/three.module.min.js";

export const FURN = {
  bed: { w: 1.2, d: 1.9, bed: true }, rug: { w: 1.6, d: 1.6, flat: true }, plant: { w: 0.5, d: 0.5 }, lamp: { w: 0.45, d: 0.45 },
  banig: { w: 1.4, d: 2.0, flat: true }, table: { w: 1.2, d: 0.8 }, chair: { w: 0.5, d: 0.5, seat: 0.45 }, sofa: { w: 1.8, d: 0.8, seat: 0.5 },
  beanbag: { w: 0.8, d: 0.8, seat: 0.4 }, bookshelf: { w: 1.0, d: 0.4 }, tv: { w: 1.2, d: 0.45 }, fan: { w: 0.5, d: 0.5 },
  desk: { w: 1.2, d: 0.6 }, toybox: { w: 0.7, d: 0.5 }, aquarium: { w: 1.0, d: 0.45 }, majlis: { w: 2.0, d: 0.8, seat: 0.18 },
  cactus: { w: 0.4, d: 0.4 }, piano: { w: 1.4, d: 0.6 }, fridge: { w: 0.7, d: 0.6 },
  painting: { w: 0.9, d: 0.1, wall: true }, clock: { w: 0.5, d: 0.1, wall: true }, shelf: { w: 0.9, d: 0.25, wall: true },
  mirror: { w: 0.6, d: 0.08, wall: true }, garland: { w: 1.6, d: 0.1, wall: true }, "banner-ph": { w: 0.9, d: 0.05, wall: true }, "banner-bh": { w: 0.9, d: 0.05, wall: true },
};

export function buildFurniture(id) {
  const group = new THREE.Group(), disp = [], anim = [];
  const M = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }); disp.push(m); return m; };
  const G = (g) => { disp.push(g); return g; };
  const add = (geo, mat, x, y, z, parent = group) => { const m = new THREE.Mesh(G(geo), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, p) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
  const cyl = (r1, r2, h, mat, x, y, z, p, seg = 16) => add(new THREE.CylinderGeometry(r1, r2, h, seg), mat, x, y, z, p);
  const ball = (r, mat, x, y, z, p) => add(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z, p);
  const legs = (w, d, h, mat, r = 0.04) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(r, r, h, mat, a * (w / 2 - 0.06), h / 2, b * (d / 2 - 0.06)));
  const wood = () => M(0xb07a4a), dark = () => M(0x6d4a2f);
  const glowLight = (color, y, dist = 4) => { const l = new THREE.PointLight(color, 0, dist, 1.6); l.position.y = y; group.add(l); return l; };

  switch (id) {
    case "bed": {
      const fr = wood(); box(1.2, 0.3, 1.9, fr, 0, 0.2, 0); box(1.2, 0.7, 0.1, fr, 0, 0.45, -0.92);
      box(1.1, 0.16, 1.8, M(0xffffff), 0, 0.42, 0.02); box(1.12, 0.06, 1.1, M(0x7cc4ff), 0, 0.51, 0.35);
      const pil = box(0.6, 0.12, 0.32, M(0xfff3e0), 0, 0.56, -0.62); pil.scale.y = 1.1; break;
    }
    case "rug": { const r = add(new THREE.CylinderGeometry(0.8, 0.8, 0.02, 40), M(0xff9ec7, { roughness: 1 }), 0, 0.011, 0); r.castShadow = false;
      const r2 = add(new THREE.CylinderGeometry(0.55, 0.55, 0.022, 40), M(0xffd166, { roughness: 1 }), 0, 0.012, 0); r2.castShadow = false; break; }
    case "banig": {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d");
      ["#d9a85b", "#b5463a", "#2f7d6d", "#e8c27a"].forEach((col, i) => { c.fillStyle = col; for (let k = i; k < 16; k += 4) { c.fillRect(0, k * 4, 64, 4); } });
      c.globalAlpha = 0.35; c.fillStyle = "#fff"; for (let k = 0; k < 64; k += 8) c.fillRect(k, 0, 3, 64);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; disp.push(tx);
      const m = box(1.4, 0.02, 2.0, M(0xffffff, { map: tx, roughness: 1 }), 0, 0.011, 0); m.castShadow = false; break;
    }
    case "plant": { cyl(0.18, 0.14, 0.32, M(0xd96c3b), 0, 0.16, 0); [0, 1, 2, 3, 4].forEach((i) => { const l = ball(0.16, M(0x3fa34d), Math.cos(i * 1.3) * 0.12, 0.5 + (i % 2) * 0.12, Math.sin(i * 1.3) * 0.12); l.scale.set(0.7, 1.4, 0.7); }); break; }
    case "cactus": { cyl(0.15, 0.12, 0.22, M(0xe0a35b), 0, 0.11, 0); const g = M(0x4caf50); const b = add(new THREE.CapsuleGeometry(0.1, 0.35, 6, 12), g, 0, 0.5, 0);
      const a = add(new THREE.CapsuleGeometry(0.05, 0.14, 6, 10), g, 0.13, 0.55, 0); a.rotation.z = -0.9; ball(0.04, M(0xff6fa8), 0, 0.78, 0); b.scale.z = 0.9; break; }
    case "lamp": {
      cyl(0.16, 0.18, 0.04, dark(), 0, 0.02, 0); cyl(0.02, 0.02, 1.3, dark(), 0, 0.67, 0);
      const shade = M(0xfff1c9, { emissive: 0xffc46b, emissiveIntensity: 0 }); cyl(0.14, 0.24, 0.28, shade, 0, 1.38, 0, group, 20);
      const l = glowLight(0xffc46b, 1.3, 4.5); anim.push((t, n) => { l.intensity = n ? 2.4 : 0.3; shade.emissiveIntensity = n ? 1.2 : 0.15; }); break;
    }
    case "table": { const w = wood(); box(1.2, 0.06, 0.8, w, 0, 0.62, 0); legs(1.2, 0.8, 0.6, w); ball(0.08, M(0xff5a36), 0.25, 0.71, 0); cyl(0.07, 0.05, 0.12, M(0xffffff), -0.2, 0.71, 0.1); break; }
    case "chair": { const w = wood(); box(0.46, 0.05, 0.46, w, 0, 0.42, 0); legs(0.46, 0.46, 0.42, w, 0.025); box(0.46, 0.5, 0.05, w, 0, 0.7, -0.21); break; }
    case "sofa": { const c = M(0xff7a59, { roughness: 0.95 }); box(1.8, 0.35, 0.8, c, 0, 0.25, 0); box(1.8, 0.5, 0.2, c, 0, 0.6, -0.3); box(0.2, 0.3, 0.8, c, -0.8, 0.55, 0); box(0.2, 0.3, 0.8, c, 0.8, 0.55, 0);
      [-0.38, 0.38].forEach((x) => box(0.72, 0.1, 0.58, M(0xffa48a), x, 0.47, 0.06)); break; }
    case "beanbag": { const b = ball(0.42, M(0x7cc4ff, { roughness: 1 }), 0, 0.3, 0); b.scale.set(1, 0.72, 1); const d = ball(0.3, M(0x9ad2ff, { roughness: 1 }), 0, 0.42, -0.18); d.scale.set(1.1, 0.8, 0.6); break; }
    case "bookshelf": { const w = wood(); box(1.0, 1.6, 0.05, w, 0, 0.8, -0.18); [-0.48, 0.48].forEach((x) => box(0.04, 1.6, 0.4, w, x, 0.8, 0));
      [0.05, 0.55, 1.05, 1.58].forEach((y) => box(1.0, 0.04, 0.4, w, 0, y, 0));
      const cols = [0xff5a36, 0x3dd6c0, 0xffc04d, 0x7cc4ff, 0xb9a2ff, 0xff9ec7];
      [0.08, 0.58, 1.08].forEach((y, r) => { for (let i = 0; i < 7; i++) { const h = 0.3 + ((i * 7 + r) % 3) * 0.06; box(0.09, h, 0.28, M(cols[(i + r) % 6]), -0.38 + i * 0.12, y + h / 2 + 0.02, 0); } }); break; }
    case "tv": { const w = dark(); box(1.2, 0.45, 0.42, w, 0, 0.23, 0); box(1.0, 0.6, 0.05, M(0x1b1b1f), 0, 0.85, -0.05);
      const scr = M(0x223355, { emissive: 0x3d7bff, emissiveIntensity: 0.6 }); box(0.92, 0.52, 0.01, scr, 0, 0.85, -0.02);
      anim.push((t) => { scr.emissive.setHSL((t * 0.05) % 1, 0.6, 0.45); }); break; }
    case "fan": { const g = M(0x7cc4ff); cyl(0.18, 0.2, 0.05, g, 0, 0.03, 0); cyl(0.025, 0.025, 0.9, M(0xdddddd), 0, 0.48, 0);
      const head = new THREE.Group(); head.position.set(0, 0.98, 0.05); group.add(head); cyl(0.07, 0.07, 0.12, g, 0, 0, -0.05, head).rotation.x = Math.PI / 2;
      const blades = new THREE.Group(); blades.position.z = 0.04; head.add(blades);
      [0, 1, 2].forEach((i) => { const b = box(0.08, 0.22, 0.01, M(0xffffff, { transparent: true, opacity: 0.85 }), 0, 0.12, 0, blades); b.position.set(Math.sin(i * 2.09) * 0.12, Math.cos(i * 2.09) * 0.12, 0); b.rotation.z = -i * 2.09; });
      const cage = add(new THREE.TorusGeometry(0.25, 0.008, 6, 32), M(0xdddddd), 0, 0, 0.05, head);
      anim.push((t) => { blades.rotation.z = t * 14; head.rotation.y = Math.sin(t * 0.6) * 0.6; }); cage.castShadow = false; break; }
    case "desk": { const w = M(0xf4e3c8); box(1.2, 0.05, 0.6, w, 0, 0.72, 0); legs(1.2, 0.6, 0.7, M(0x888888), 0.025);
      box(0.5, 0.32, 0.03, M(0x1b1b1f), 0, 0.95, -0.15); box(0.46, 0.27, 0.005, M(0x2a3a6a, { emissive: 0x3dd6c0, emissiveIntensity: 0.4 }), 0, 0.95, -0.13);
      box(0.4, 0.015, 0.14, M(0x444444), 0, 0.755, 0.1); break; }
    case "toybox": { box(0.7, 0.4, 0.5, M(0xffc04d), 0, 0.2, 0); box(0.72, 0.05, 0.52, M(0xff5a36), 0, 0.43, 0);
      ball(0.1, M(0x3dd6c0), 0.2, 0.5, 0.05); const bear = ball(0.09, M(0xb07a4a), -0.15, 0.52, 0); bear.scale.y = 1.1; break; }
    case "aquarium": { const st = dark(); box(1.0, 0.5, 0.45, st, 0, 0.25, 0);
      const glass = add(new THREE.BoxGeometry(0.96, 0.55, 0.42), new THREE.MeshPhysicalMaterial({ color: 0x9fe3ff, transmission: 0.5, transparent: true, opacity: 0.45, roughness: 0.05 }), 0, 0.78, 0); disp.push(glass.material); glass.castShadow = false;
      box(0.94, 0.06, 0.4, M(0xf3d9a4), 0, 0.53, 0);
      const fish = [0xff7a1a, 0xffd166, 0xff5aa0].map((c, i) => { const f = new THREE.Group(); group.add(f); const b = ball(0.045, M(c), 0, 0, 0, f); b.scale.set(1.4, 1, 0.6); const tl = add(new THREE.ConeGeometry(0.035, 0.06, 4), M(c), -0.07, 0, 0, f); tl.rotation.z = Math.PI / 2; return { f, k: i * 2.1 }; });
      anim.push((t) => fish.forEach((x) => { const a = t * 0.6 + x.k; x.f.position.set(Math.sin(a) * 0.35, 0.72 + Math.sin(a * 1.7) * 0.1, Math.cos(a * 1.3) * 0.1); x.f.rotation.y = Math.cos(a) > 0 ? 0 : Math.PI; })); break; }
    case "majlis": { const red = M(0xa3263b, { roughness: 1 }), gold = M(0xd9a441, { roughness: 0.6 });
      box(2.0, 0.16, 0.8, red, 0, 0.08, 0); box(2.0, 0.04, 0.82, gold, 0, 0.17, 0); [-0.65, 0, 0.65].forEach((x) => box(0.6, 0.45, 0.16, red, x, 0.4, -0.3));
      [-0.95, 0.95].forEach((x) => { const a = cyl(0.12, 0.12, 0.76, gold, x, 0.3, 0); a.rotation.x = Math.PI / 2; }); break; }
    case "piano": { const b = M(0x1b1b1f, { roughness: 0.3 }); box(1.4, 1.0, 0.45, b, 0, 0.6, -0.08); box(1.4, 0.06, 0.3, b, 0, 0.75, 0.25);
      box(1.3, 0.03, 0.18, M(0xffffff), 0, 0.79, 0.27); for (let i = 0; i < 9; i++) box(0.05, 0.02, 0.1, b, -0.56 + i * 0.14, 0.81, 0.22); legs(1.4, 0.45, 0.1, b); break; }
    case "fridge": { const w = M(0xe8f1f6, { roughness: 0.35 }); box(0.7, 1.7, 0.6, w, 0, 0.85, 0); box(0.68, 0.01, 0.01, M(0x9aa4ad), 0, 1.15, 0.305);
      [1.4, 0.7].forEach((y) => box(0.04, 0.3, 0.04, M(0x9aa4ad), 0.27, y, 0.33)); ball(0.04, M(0xff5a36), -0.15, 1.4, 0.31); ball(0.04, M(0x3dd6c0), -0.05, 1.32, 0.31); break; }
    // ---------- sa dingding (nakaharap sa +z, nakadikit sa z = 0) ----------
    case "painting": { box(0.9, 0.65, 0.04, M(0xc8a165), 0, 0, 0.02); const cv = document.createElement("canvas"); cv.width = 96; cv.height = 64; const c = cv.getContext("2d");
      const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, "#ffb26b"); g.addColorStop(1, "#ffe0f0"); c.fillStyle = g; c.fillRect(0, 0, 96, 64);
      c.fillStyle = "#ff5a36"; c.beginPath(); c.arc(64, 30, 10, 0, 7); c.fill(); c.fillStyle = "#3fa34d"; c.beginPath(); c.moveTo(0, 64); c.lineTo(30, 30); c.lineTo(55, 64); c.fill();
      c.fillStyle = "#2f7d6d"; c.beginPath(); c.moveTo(35, 64); c.lineTo(70, 36); c.lineTo(96, 64); c.fill();
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; disp.push(tx); box(0.78, 0.53, 0.01, M(0xffffff, { map: tx }), 0, 0, 0.045); break; }
    case "clock": { const face = add(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32), M(0xffffff), 0, 0, 0.03); face.rotation.x = Math.PI / 2;
      const rim = add(new THREE.TorusGeometry(0.24, 0.025, 8, 32), M(0xff5a36), 0, 0, 0.05); rim.castShadow = false;
      const hh = new THREE.Group(), mm = new THREE.Group(); hh.position.z = mm.position.z = 0.06; group.add(hh, mm);
      box(0.025, 0.12, 0.01, M(0x1b1b1f), 0, 0.05, 0, hh); box(0.018, 0.18, 0.01, M(0x1b1b1f), 0, 0.08, 0, mm);
      anim.push(() => { const d = new Date(); mm.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2; hh.rotation.z = -((d.getHours() % 12 + d.getMinutes() / 60) / 12) * Math.PI * 2; }); break; }
    case "shelf": { const w = wood(); box(0.9, 0.04, 0.25, w, 0, 0, 0.12); ball(0.07, M(0x3fa34d), -0.3, 0.08, 0.12); cyl(0.05, 0.05, 0.16, M(0xb9a2ff), 0, 0.1, 0.12); box(0.18, 0.14, 0.12, M(0xffc04d), 0.28, 0.09, 0.12); break; }
    case "mirror": { const f = add(new THREE.CircleGeometry(0.34, 32), M(0xc8a165), 0, 0, 0.01); f.scale.y = 1.35;
      const g = add(new THREE.CircleGeometry(0.3, 32), M(0xdff3ff, { metalness: 0.9, roughness: 0.05 }), 0, 0, 0.015); g.scale.y = 1.35; break; }
    case "garland": { const cols = [0xffe066, 0xff9ec7, 0x7cc4ff, 0xb8e65c]; const bulbs = [];
      for (let i = 0; i < 11; i++) { const x = -0.8 + i * 0.16, y = -Math.sin((i / 10) * Math.PI) * 0.18; const m = M(cols[i % 4], { emissive: cols[i % 4], emissiveIntensity: 0.2 }); ball(0.035, m, x, y, 0.04); bulbs.push(m); }
      const l = glowLight(0xffe0a0, -0.2, 3); anim.push((t, n) => { bulbs.forEach((m, i) => { m.emissiveIntensity = n ? 0.6 + Math.sin(t * 3 + i) * 0.5 : 0.2; }); l.intensity = n ? 0.8 : 0; }); break; }
    case "banner-ph": case "banner-bh": {
      const cv = document.createElement("canvas"); cv.width = 96; cv.height = 48; const c = cv.getContext("2d");
      if (id === "banner-ph") { c.fillStyle = "#0038a8"; c.fillRect(0, 0, 96, 24); c.fillStyle = "#ce1126"; c.fillRect(0, 24, 96, 24); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, 0); c.lineTo(42, 24); c.lineTo(0, 48); c.fill(); c.fillStyle = "#fcd116"; c.beginPath(); c.arc(14, 24, 6, 0, 7); c.fill(); }
      else { c.fillStyle = "#ce1126"; c.fillRect(0, 0, 96, 48); c.fillStyle = "#fff"; c.fillRect(0, 0, 26, 48); c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(26, i * 9.6); c.lineTo(38, i * 9.6 + 4.8); c.lineTo(26, i * 9.6 + 9.6); } c.fill(); }
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; disp.push(tx); box(0.9, 0.45, 0.02, M(0xffffff, { map: tx }), 0, 0, 0.02); break; }
    default: box(0.4, 0.4, 0.4, M(0xcccccc), 0, 0.2, 0);
  }
  return {
    group,
    update(t, night) { anim.forEach((f) => f(t, night)); },
    dispose() { disp.forEach((d) => d.dispose()); },
  };
}
