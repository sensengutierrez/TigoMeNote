/* TigoMeNote · tigo/bedding.js — kumot at unan ni Tigo (iba't ibang disenyo; sariling gawa sa code)
   import { BLANKETS, PILLOWS, blanketTexture, buildPillow, sleepBlanket } from "./bedding.js"
   BLANKETS / PILLOWS: { id: { name, icon } } — kapareho ng catalog.js (slot blanket / pillow) at ITEMS sa backend/pet-fast.ts
   blanketTexture(id) → CanvasTexture (para sa takip ng kama at sa kumot habang tulog)
   buildPillow(id, M) → THREE.Group (nakasentro sa unan ng kama; M = gumagawa ng material na itatapon kasama ng kama)
   sleepBlanket(id, sizeK) → { group, mesh, dispose() } — kumot na may umbok (katawan) na tumatakip kay Tigo hanggang dibdib;
     ang pinanggalingan (0,0,0) ay nasa may dibdib, papunta sa +z ang paanan (para matiklop papunta sa paanan kapag bumangon). */
import * as THREE from "../../vendor/three/three.module.min.js";

export const BLANKETS = {
  "blanket-check": { name: "Green check", icon: "🟩" }, "blanket-stars": { name: "Starry night", icon: "🌙" }, "blanket-hearts": { name: "Hearts", icon: "💗" },
  "blanket-rainbow": { name: "Rainbow", icon: "🌈" }, "blanket-clouds": { name: "Clouds", icon: "☁️" }, "blanket-inabel": { name: "Inabel weave", icon: "🧶" }, "blanket-quilt": { name: "Patch quilt", icon: "🧩" },
};
export const PILLOWS = {
  "pillow-white": { name: "Soft pillow", icon: "⬜" }, "pillow-heart": { name: "Heart pillow", icon: "❤️" }, "pillow-star": { name: "Star pillow", icon: "⭐" },
  "pillow-cloud": { name: "Cloud pillow", icon: "☁️" }, "pillow-hotdog": { name: "Hotdog unan", icon: "🌭" }, "pillow-cat": { name: "Kitty pillow", icon: "🐱" },
};
export const DEF_BED = { blanket: "blanket-check", pillow: "pillow-white" };

// ---------- disenyo ng tela (128×128, umuulit) ----------
function paint(id, c) {
  const W = 128, fill = (col) => { c.fillStyle = col; c.fillRect(0, 0, W, W); };
  const star = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, k = i % 2 ? r * 0.45 : r; i ? c.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k) : c.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } c.fill(); };
  const heart = (x, y, s, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * 0.3); c.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.35); c.bezierCurveTo(x - s, y + s * 0.8, x, y + s, x, y + s * 1.25); c.bezierCurveTo(x, y + s, x + s, y + s * 0.8, x + s, y + s * 0.35); c.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3); c.fill(); };
  const cloud = (x, y, s, col) => { c.fillStyle = col; [[0, 0, 1], [-0.8, 0.25, 0.7], [0.8, 0.25, 0.75], [0, 0.4, 0.8]].forEach(([dx, dy, k]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, s * k, 0, 7); c.fill(); }); };
  switch (id) {
    case "blanket-stars": fill("#26306b"); for (let i = 0; i < 9; i++) star((i * 47) % 128, (i * 31 + 9) % 128, i % 3 ? 4 : 7, "#ffe066"); c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(92, 40, 11, 0, 7); c.fill(); c.fillStyle = "#26306b"; c.beginPath(); c.arc(98, 36, 10, 0, 7); c.fill(); break;
    case "blanket-hearts": fill("#ffc4dd"); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) heart(16 + x * 32 + (y % 2) * 16, 8 + y * 32, 7, y % 2 ? "#ff4f8b" : "#ffffff"); break;
    case "blanket-rainbow": ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa", "#f783ac", "#ffffff"].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 16, W, 16); }); break;
    case "blanket-clouds": fill("#a5d8ff"); [[24, 26], [88, 18], [56, 70], [110, 92], [14, 104]].forEach(([x, y]) => cloud(x, y, 9, "#ffffff")); break;
    case "blanket-inabel": fill("#f4ead7"); ["#c0392b", "#1f3a68", "#c0392b"].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, 10 + i * 6, W, 3); c.fillRect(0, 74 + i * 6, W, 3); });
      c.fillStyle = "#1f3a68"; for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 54); c.lineTo(x + 8, 44); c.lineTo(x + 16, 54); c.lineTo(x + 8, 64); c.fill(); } break;   // habing Ilokano (sariling guhit)
    case "blanket-quilt": { const cols = ["#ff8fab", "#ffd166", "#8ce99a", "#74c0fc", "#b197fc", "#ffa94d"]; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = cols[(x + y * 2) % 6]; c.fillRect(x * 32, y * 32, 32, 32); }
      c.strokeStyle = "rgba(255,255,255,.8)"; c.setLineDash([4, 3]); c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, W); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); } break; }
    default: fill("#6fbf73"); c.fillStyle = "rgba(255,255,255,.18)"; for (let i = 0; i < 128; i += 32) { c.fillRect(i, 0, 12, 128); c.fillRect(0, i, 128, 12); }
      c.fillStyle = "rgba(0,0,0,.08)"; for (let i = 16; i < 128; i += 32) { c.fillRect(i, 0, 3, 128); c.fillRect(0, i, 128, 3); }
  }
}
export function blanketTexture(id, hem = false) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c = cv.getContext("2d");
  paint(BLANKETS[id] ? id : DEF_BED.blanket, c);
  if (hem) { c.fillStyle = "#fff6e6"; c.fillRect(0, 0, 128, 14); }   // puting tupi sa may dibdib
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx;
}

// ---------- unan (nakasentro sa unan ng kama: y 0.56) ----------
export function buildPillow(id, M) {
  const g = new THREE.Group(), add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const ext = (sh, d) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }); geo.center(); return geo; };
  switch (PILLOWS[id] ? id : DEF_BED.pillow) {
    case "pillow-heart": { const s = new THREE.Shape(); s.moveTo(0, -0.14); s.bezierCurveTo(-0.26, 0.02, -0.16, 0.2, 0, 0.08); s.bezierCurveTo(0.16, 0.2, 0.26, 0.02, 0, -0.14);
      const m = add(ext(s, 0.06), M(0xff4f7b, { roughness: 0.8 }), 0, 0.6, -0.62); m.rotation.x = -Math.PI / 2 + 0.25; m.scale.set(1.25, 1.25, 1); break; }
    case "pillow-star": { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.09 : 0.2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const m = add(ext(s, 0.06), M(0xffd23f, { roughness: 0.8 }), 0, 0.6, -0.62); m.rotation.x = -Math.PI / 2 + 0.25; m.scale.set(1.2, 1.2, 1); break; }
    case "pillow-cloud": { const m = M(0xf4fbff, { roughness: 0.95 }); [[-0.18, 0, 0.13], [0, 0.03, 0.16], [0.18, 0, 0.13], [0.06, -0.02, 0.12], [-0.08, -0.02, 0.12]].forEach(([x, y, r]) => { const b = add(new THREE.SphereGeometry(r, 14, 10), m, x, 0.58 + y, -0.62); b.scale.y = 0.6; }); break; }
    case "pillow-hotdog": { const b = add(new THREE.CapsuleGeometry(0.1, 0.62, 8, 16), M(0xffa94d, { roughness: 0.85 }), 0, 0.6, -0.64); b.rotation.z = Math.PI / 2;
      [-0.2, 0, 0.2].forEach((x) => { const r = add(new THREE.TorusGeometry(0.102, 0.012, 6, 20), M(0xfff3e0), x, 0.6, -0.64); r.rotation.y = Math.PI / 2; }); break; }
    case "pillow-cat": { const m = M(0xffe0b2, { roughness: 0.9 }); const b = add(new THREE.BoxGeometry(0.6, 0.13, 0.32), m, 0, 0.57, -0.62); b.scale.y = 1.1;
      [-0.2, 0.2].forEach((x) => { const e = add(new THREE.ConeGeometry(0.07, 0.12, 4), m, x, 0.66, -0.74); e.rotation.x = -0.3; });
      const ink = M(0x3a2a20); [-0.1, 0.1].forEach((x) => add(new THREE.SphereGeometry(0.018, 8, 6), ink, x, 0.645, -0.52)); add(new THREE.SphereGeometry(0.014, 8, 6), M(0xff8fab), 0, 0.637, -0.5); break; }
    default: { const p = add(new THREE.BoxGeometry(0.6, 0.12, 0.32), M(0xfff3e0), 0, 0.56, -0.62); p.scale.y = 1.1; }
  }
  return g;
}

// ---------- kumot habang tulog ----------
export function sleepBlanket(id, sizeK = 1) {
  const tx = blanketTexture(id, true);
  const geo = new THREE.PlaneGeometry(1.22, 1.5, 24, 24); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {   // umbok sa gitna (katawan), mas mataas sa paanan (paa); nakalaylay sa gilid hanggang kutson
    const x = p.getX(i), z = p.getZ(i), zf = (z + 0.75) / 1.5;
    const bump = Math.exp(-((x / 0.38) ** 2)) * (0.36 * sizeK + 0.04 * Math.cos(z * 4) + 0.34 * sizeK * Math.exp(-(((zf - 0.86) / 0.1) ** 2))) * Math.min(1, zf * 6 + 0.3) * Math.min(1, (1 - zf) * 7 + 0.35);
    p.setY(i, 0.03 + bump - Math.max(0, Math.abs(x) - 0.5) * 1.2);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.95, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.position.z = 0.75;
  const group = new THREE.Group(); group.add(mesh);
  return { group, mesh, dispose() { geo.dispose(); mat.dispose(); tx.dispose(); } };
}
