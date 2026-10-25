/* TigoMeNote · tigo/room.js — loob ng bahay kubo ni Tigo (3D): dingding, sahig, bintana, pinto at mga gamit na naiaayos
   import { buildRoom, ROOM, WALLS, FLOORS } from "./room.js"
   const room = buildRoom()
     room.group · room.setStyle(wallId, floorId) · room.setItems([{ id, x, z, r }]) · room.list() → [{ id, x, z, r }]
     room.add(id) → entry · room.remove(e) · room.move(e, x, z) · room.rotate(e) · room.select(e|null)
     room.pick(raycaster) → entry|null · room.floorPoint(raycaster) → { x, z }|null
     room.collide(x, z) → [x, z]  (para hindi tumagos si Tigo sa dingding at gamit) · room.bedSpot() → { x, z, y, face }|null
     room.seatNear(x, z) → pinakamalapit na upuan (chair, sofa, bean bag, majlis) para sa 🪑 Sit
     room.update(t, night, camera) → bumababa ang dingding na nakaharang sa camera (parang dollhouse)
   Pinto: nasa harap (z = +ROOM.d/2), gitna. Gamit sa dingding (wall) = kusang dumidikit sa pinakamalapit na dingding. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { FURN, buildFurniture } from "./furniture.js";

export const ROOM = { w: 6, d: 5, h: 2.4, door: { x: 0, z: 2.1 } };
const HW = ROOM.w / 2, HD = ROOM.d / 2;
// Dingding at sahig (id → kulay + disenyo). Kapareho ng catalog.js (wall-*, floor-*)
export const WALLS = {
  "wall-cream": ["#f6ecd9"], "wall-sky": ["#cfe8ff"], "wall-mint": ["#cdf3e9"], "wall-blush": ["#ffd9e4"], "wall-lilac": ["#e5dcff"],
  "wall-sawali": ["#e2c48f", "weave"], "wall-stripes": ["#fff4e0", "stripes", "#ffc9a8"], "wall-stars": ["#26306b", "stars"], "wall-wood": ["#c99b6d", "planksV"],
};
export const FLOORS = {
  "floor-planks": ["#c58f5e", "planks"], "floor-tiles": ["#f3f3f3", "checker", "#9ad2ff"], "floor-carpet": ["#b9a2ff", "carpet"],
  "floor-bamboo": ["#d8b878", "bamboo"], "floor-marble": ["#f4f1ee", "marble"], "floor-grass": ["#8fd18a", "carpet"],
};

function pattern(kind, base, alt) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c = cv.getContext("2d");
  c.fillStyle = base; c.fillRect(0, 0, 128, 128);
  const shade = (a) => `rgba(0,0,0,${a})`;
  if (kind === "weave") { for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) { c.fillStyle = ((x + y) / 16) % 2 ? shade(0.1) : "rgba(255,255,255,.15)"; c.fillRect(x, y, 16, 8); c.fillStyle = ((x + y) / 16) % 2 ? "rgba(255,255,255,.15)" : shade(0.1); c.fillRect(x, y + 8, 16, 8); } }
  else if (kind === "stripes") { c.fillStyle = alt; for (let x = 0; x < 128; x += 32) c.fillRect(x, 0, 14, 128); }
  else if (kind === "stars") { c.fillStyle = "#ffe066"; for (let i = 0; i < 26; i++) { const x = (i * 53) % 128, y = (i * 37) % 128; c.beginPath(); c.arc(x, y, i % 3 ? 1.5 : 3, 0, 7); c.fill(); } }
  else if (kind === "planksV" || kind === "planks") { for (let i = 0; i < 8; i++) { c.fillStyle = shade(0.04 + (i % 3) * 0.03); kind === "planks" ? c.fillRect(0, i * 16, 128, 15) : c.fillRect(i * 16, 0, 15, 128); }
    c.fillStyle = shade(0.25); for (let i = 0; i < 8; i++) kind === "planks" ? c.fillRect(0, i * 16 + 15, 128, 1) : c.fillRect(i * 16 + 15, 0, 1, 128);
    if (kind === "planks") for (let i = 0; i < 8; i++) c.fillRect(((i * 47) % 128), i * 16, 1, 15); }
  else if (kind === "checker") { c.fillStyle = alt; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) c.fillRect(x * 32, y * 32, 32, 32); c.fillStyle = shade(0.08); for (let i = 0; i <= 4; i++) { c.fillRect(i * 32, 0, 1, 128); c.fillRect(0, i * 32, 128, 1); } }
  else if (kind === "carpet") { for (let i = 0; i < 900; i++) { c.fillStyle = Math.random() < 0.5 ? shade(0.05) : "rgba(255,255,255,.06)"; c.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } }
  else if (kind === "bamboo") { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? shade(0.06) : "rgba(255,255,255,.08)"; c.fillRect(i * 8, 0, 8, 128); } c.fillStyle = shade(0.18); for (let i = 0; i < 16; i++) c.fillRect(i * 8, (i * 29) % 128, 8, 2); }
  else if (kind === "marble") { c.strokeStyle = "rgba(120,120,140,.25)"; c.lineWidth = 1.2; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(0, i * 20); for (let x = 0; x <= 128; x += 16) c.lineTo(x, i * 20 + Math.sin(x * 0.1 + i) * 8); c.stroke(); } }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx;
}

export function buildRoom() {
  const group = new THREE.Group(), disp = [];
  const K = (o) => { disp.push(o); return o; };
  const wallMat = K(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
  const floorMat = K(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
  const trim = K(new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.7 }));
  const mesh = (geo, mat, x, y, z, parent = group) => { const m = new THREE.Mesh(K(geo), mat); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; parent.add(m); return m; };

  // sahig + base
  const floor = mesh(new THREE.BoxGeometry(ROOM.w + 0.3, 0.2, ROOM.d + 0.3), floorMat, 0, -0.1, 0); floor.castShadow = false;
  mesh(new THREE.BoxGeometry(ROOM.w + 0.5, 0.5, ROOM.d + 0.5), K(new THREE.MeshStandardMaterial({ color: 0x8d6e4a, roughness: 1 })), 0, -0.45, 0).castShadow = false;

  // dingding: bawat isa ay grupo (para mababa kapag nakaharang sa camera)
  const T = 0.14, H = ROOM.h;
  function wall(name, nx, nz, len, holes) {
    const g = new THREE.Group(); g.userData = { name, nx, nz }; group.add(g);
    // hinahati ang dingding kapag may pinto/bintana (holes = [[gitna, lapad, baba, taas]])
    const parts = [[-len / 2, len / 2]];
    (holes || []).forEach(([c, w]) => { const p = parts.pop(); parts.push([p[0], c - w / 2], [c + w / 2, p[1]]); });
    parts.forEach(([a, b]) => mesh(new THREE.BoxGeometry(b - a, H, T), wallMat, (a + b) / 2, H / 2, 0, g));
    (holes || []).forEach(([c, w, lo, hi]) => {
      if (lo > 0) mesh(new THREE.BoxGeometry(w, lo, T), wallMat, c, lo / 2, 0, g);
      mesh(new THREE.BoxGeometry(w, H - hi, T), wallMat, c, hi + (H - hi) / 2, 0, g);
      // frame
      mesh(new THREE.BoxGeometry(w + 0.12, 0.08, T + 0.04), trim, c, hi + 0.04, 0, g);
      if (lo > 0) mesh(new THREE.BoxGeometry(w + 0.12, 0.06, T + 0.08), trim, c, lo - 0.03, 0.02, g);
      [-1, 1].forEach((s) => mesh(new THREE.BoxGeometry(0.06, hi - lo, T + 0.04), trim, c + s * (w / 2 + 0.03), lo + (hi - lo) / 2, 0, g));
    });
    mesh(new THREE.BoxGeometry(len, 0.1, T + 0.04), trim, 0, 0.05, 0, g); // baseboard
    g.position.set(-nx * (nx ? HW : 0), 0, -nz * (nz ? HD : 0));
    g.rotation.y = Math.atan2(nx, nz);
    return g;
  }
  const walls = [
    wall("back", 0, 1, ROOM.w + T, [[1.1, 1.2, 0.9, 1.9]]),
    wall("left", 1, 0, ROOM.d + T),
    wall("right", -1, 0, ROOM.d + T, [[-0.6, 1.0, 0.95, 1.85]]),
    wall("front", 0, -1, ROOM.w + T, [[0, 1.0, 0, 1.75]]),
  ];
  // salamin ng bintana (langit sa labas)
  const glassMat = K(new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55 }));
  const glass1 = mesh(new THREE.PlaneGeometry(1.2, 1.0), glassMat, 1.1, 1.4, -0.03, walls[0]); glass1.castShadow = false;
  const glass2 = mesh(new THREE.PlaneGeometry(1.0, 0.9), glassMat, -0.6, 1.4, -0.03, walls[2]); glass2.castShadow = false;
  // doormat sa may pinto
  const mat = mesh(new THREE.BoxGeometry(0.9, 0.02, 0.5), K(new THREE.MeshStandardMaterial({ color: 0x2f7d6d, roughness: 1 })), 0, 0.01, HD - 0.4); mat.castShadow = false;
  // ilaw sa kisame
  const bulb = new THREE.PointLight(0xffd8a0, 0.6, 12, 1.4); bulb.position.set(0, H + 0.2, 0); group.add(bulb);

  // ---------- estilo ----------
  let style = { wall: "wall-cream", floor: "floor-planks" };
  function setStyle(w, f) {
    const W = WALLS[w] ? w : "wall-cream", F = FLOORS[f] ? f : "floor-planks"; style = { wall: W, floor: F };
    const [wc, wp, wa] = WALLS[W], [fc, fp, fa] = FLOORS[F];
    if (wallMat.map) wallMat.map.dispose(); if (floorMat.map) floorMat.map.dispose();
    wallMat.map = wp ? pattern(wp, wc, wa) : null; wallMat.color.set(wp ? "#ffffff" : wc); if (wallMat.map) wallMat.map.repeat.set(2, 1.2);
    floorMat.map = fp ? pattern(fp, fc, fa) : null; floorMat.color.set(fp ? "#ffffff" : fc); if (floorMat.map) floorMat.map.repeat.set(3, 2.5);
    wallMat.needsUpdate = floorMat.needsUpdate = true;
  }

  // ---------- gamit ----------
  const entries = [];
  const ring = new THREE.Mesh(K(new THREE.RingGeometry(0.55, 0.64, 40)), K(new THREE.MeshBasicMaterial({ color: 0xff5a36, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false })));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 5; ring.visible = false; group.add(ring);
  let selected = null;
  const clamp = (v, a) => Math.max(-a, Math.min(a, v));
  function place(e) {
    const f = FURN[e.id] || { w: 0.5, d: 0.5 };
    if (f.wall) {
      // dumikit sa pinakamalapit na dingding (hindi sa pinto)
      const dx = [e.x + HW, HW - e.x], dz = [e.z + HD, HD - e.z], m = Math.min(dx[0], dx[1], dz[0]);
      let x = e.x, z = e.z, rot = 0;
      if (m === dz[0]) { z = -HD + T / 2; x = clamp(x, HW - f.w / 2 - 0.1); rot = 0; }
      else if (m === dx[0]) { x = -HW + T / 2; z = clamp(z, HD - f.w / 2 - 0.1); rot = Math.PI / 2; }
      else { x = HW - T / 2; z = clamp(z, HD - f.w / 2 - 0.1); rot = -Math.PI / 2; }
      e.x = round(x); e.z = round(z); e.r = round(rot);
      e.holder.position.set(e.x, 1.5, e.z); e.holder.rotation.y = rot;
      e.wallName = m === dz[0] ? "back" : m === dx[0] ? "left" : "right";
    } else {
      const c = Math.abs(Math.cos(e.r)), s = Math.abs(Math.sin(e.r)), ex = (f.w * c + f.d * s) / 2, ez = (f.w * s + f.d * c) / 2;
      e.x = round(clamp(e.x, HW - T / 2 - ex)); e.z = round(clamp(e.z, HD - T / 2 - ez));
      e.holder.position.set(e.x, 0, e.z); e.holder.rotation.y = e.r;
    }
    if (selected === e) moveRing();
  }
  const round = (v) => Math.round(v * 100) / 100;
  function make(it) {
    if (!FURN[it.id]) return null;
    const holder = new THREE.Group(), obj = buildFurniture(it.id); holder.add(obj.group); group.add(holder);
    const e = { id: it.id, x: Number(it.x) || 0, z: Number(it.z) || 0, r: Number(it.r) || 0, holder, obj };
    holder.traverse((o) => { o.userData.entry = e; });
    entries.push(e); place(e); return e;
  }
  function removeEntry(e) {
    const i = entries.indexOf(e); if (i < 0) return;
    entries.splice(i, 1); group.remove(e.holder); e.obj.dispose(); if (selected === e) select(null);
  }
  function setItems(list) { entries.slice().forEach(removeEntry); (list || []).forEach(make); }
  function add(id) {
    const f = FURN[id]; if (!f) return null;
    // hanap ng bakanteng puwesto malapit sa gitna
    let best = { x: 0, z: 0 }, bestD = -1;
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * (ROOM.w - 1.5), z = (Math.random() - 0.5) * (ROOM.d - 1.8);
      const d = entries.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.z - z)), 9);
      if (d > bestD) { bestD = d; best = { x, z }; }
    }
    if (f.wall) best = { x: best.x, z: -HD };
    return make({ id, x: best.x, z: best.z, r: 0 });
  }
  function moveRing() {
    const e = selected, f = FURN[e.id];
    if (f.wall) { const n = e.wallName === "back" ? [0, 0.5] : e.wallName === "left" ? [0.5, 0] : [-0.5, 0]; ring.position.set(e.x + n[0], 0.03, e.z + n[1]); }
    else ring.position.set(e.x, 0.03, e.z);
    ring.scale.setScalar(Math.max(0.6, Math.max(f.w, f.d) * 0.75));
  }
  function select(e) { selected = e; ring.visible = !!e; if (e) moveRing(); }

  // ---------- banggaan ni Tigo ----------
  function collide(x, z, r = 0.32) {
    x = clamp(x, HW - T / 2 - r); z = clamp(z, HD - T / 2 - r);
    for (const e of entries) {
      const f = FURN[e.id]; if (!f || f.flat || f.wall) continue;
      // ilipat sa local na sukat ng gamit, i-clamp, itulak palabas
      const dx = x - e.x, dz = z - e.z, c = Math.cos(-e.r), s = Math.sin(-e.r);
      const lx = dx * c + dz * s, lz = -dx * s + dz * c;
      const hx = f.w / 2, hz = f.d / 2, px = clamp(lx, hx), pz = clamp(lz, hz);
      let ox = lx - px, oz = lz - pz, d = Math.hypot(ox, oz);
      if (d >= r) continue;
      if (d < 1e-4) { // nasa loob mismo: itulak sa pinakamalapit na gilid
        const ax = hx - Math.abs(lx), az = hz - Math.abs(lz);
        if (ax < az) { ox = Math.sign(lx) || 1; oz = 0; } else { oz = Math.sign(lz) || 1; ox = 0; }
        const nlx = ax < az ? Math.sign(lx || 1) * (hx + r) : lx, nlz = ax < az ? lz : Math.sign(lz || 1) * (hz + r);
        x = e.x + nlx * c - nlz * s; z = e.z + nlx * s + nlz * c; continue;
      }
      const k = r / d, nlx = px + ox * k, nlz = pz + oz * k;
      x = e.x + nlx * c - nlz * s; z = e.z + nlx * s + nlz * c;
    }
    return [x, z];
  }
  // Pinakamalapit na upuan (chair, sofa, bean bag, majlis): { x, z, y, face, front{x,z} } o null
  function seatNear(x, z, max = 2.2) {
    let best = null, bd = max;
    for (const e of entries) {
      const f = FURN[e.id]; if (!f || !f.seat) continue;
      const d = Math.hypot(e.x - x, e.z - z); if (d >= bd) continue;
      const back = e.id === "sofa" || e.id === "majlis" ? 0.12 : 0; // umupo nang medyo nasa likod (may sandalan)
      bd = d; best = { x: e.x - Math.sin(e.r) * back, z: e.z - Math.cos(e.r) * back, y: f.seat, face: e.r,
        front: { x: e.x + Math.sin(e.r) * (f.d / 2 + 0.35), z: e.z + Math.cos(e.r) * (f.d / 2 + 0.35) } };
    }
    return best;
  }
  function bedSpot() {
    const b = entries.find((e) => FURN[e.id] && FURN[e.id].bed); if (!b) return null;
    // x/z = paanan ng kama (doon ang "paa" ni Tigo; ang ulo ay papunta sa unan)
    return { x: b.x + Math.sin(b.r) * 0.72, z: b.z + Math.cos(b.r) * 0.72, y: 0.52, face: b.r, beside: { x: b.x + Math.cos(b.r) * 0.95, z: b.z - Math.sin(b.r) * 0.95 } };
  }

  // ---------- pindot / hila ----------
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function pick(ray) {
    const hits = ray.intersectObjects(entries.map((e) => e.holder), true);
    return hits.length ? hits[0].object.userData.entry || null : null;
  }
  function floorPoint(ray) { return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null; }

  // ---------- bawat frame ----------
  const camDir = new THREE.Vector3();
  function update(t, night, camera) {
    entries.forEach((e) => e.obj.update(t, night));
    bulb.intensity = night ? 3.2 : 0.6;
    glassMat.color.set(night ? 0x1d2150 : 0xbfe6ff);
    if (camera) {
      // dingding na nasa pagitan ng camera at kwarto → bumababa (makikita ang loob)
      camera.getWorldPosition(camDir);
      walls.forEach((g) => {
        const { nx, nz } = g.userData, out = nx ? (-nx * camDir.x > HW - 0.2) : (-nz * camDir.z > HD - 0.2);
        const target = out ? 0.12 : 1; g.scale.y += (target - g.scale.y) * 0.2;
        g.visible = g.scale.y > 0.02;
      });
      entries.forEach((e) => { if (e.wallName) e.holder.visible = (walls.find((g) => g.userData.name === e.wallName) || { scale: { y: 1 } }).scale.y > 0.6; });
    }
    if (ring.visible) ring.material.opacity = 0.6 + Math.sin(t * 5) * 0.3;
  }

  return {
    group, setStyle, setItems, add, remove: removeEntry, select, pick, floorPoint, collide, bedSpot, seatNear, update,
    style() { return { ...style }; },
    list() { return entries.map((e) => ({ id: e.id, x: e.x, z: e.z, r: e.r })); },
    move(e, x, z) { e.x = x; e.z = z; place(e); },
    rotate(e) { e.r = round(((e.r || 0) + Math.PI / 4) % (Math.PI * 2)); place(e); },
    selected() { return selected; },
    dispose() { entries.slice().forEach(removeEntry); disp.forEach((d) => { if (d.map) d.map.dispose(); d.dispose(); }); },
  };
}
