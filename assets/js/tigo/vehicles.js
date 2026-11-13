/* TigoMeNote · tigo/vehicles.js — mga sasakyan ni Tigo sa isla (sariling disenyo): 🚲 bike · 🛵 scooter · 🚗 kotse
   import { buildRide, RIDE_INFO } from "./vehicles.js"
   const v = buildRide("bike"|"scooter"|"car") → { id, group, seat:{ y, z }, r, grips, update(dt, speed), lights(on), dispose() }
     Nakaharap sa +z (gaya ni Tigo). seat = kung saan uupo si Tigo (taas at layo mula sa gitna). r = laki para sa banggaan.
     update(dt, speed) → umiikot ang gulong ayon sa bilis (m/s). */
import * as THREE from "../../vendor/three/three.module.min.js";

export const RIDE_INFO = { bike: { name: "Bike", icon: "🚲" }, scooter: { name: "Scooter", icon: "🛵" }, car: { name: "Car", icon: "🚗" } };

export function buildRide(id) {
  const group = new THREE.Group(), geos = [], mats = [], wheels = [];
  const M = (c, o) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...(o || {}) }); mats.push(m); return m; };
  const add = (geo, mat, x, y, z, p = group) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); geos.push(geo); return m; };
  const tyre = M(0x1d1d22, { roughness: 0.9 }), metal = M(0xc9cfd9, { metalness: 0.6, roughness: 0.3 }), dark = M(0x2a2a33);
  function wheel(r, w, x, y, z, spokes) {
    const W = new THREE.Group(); W.position.set(x, y, z); group.add(W); wheels.push({ g: W, r });
    add(new THREE.TorusGeometry(r, w, 8, 24), tyre, 0, 0, 0, W).rotation.y = Math.PI / 2;
    add(new THREE.CylinderGeometry(r * 0.25, r * 0.25, w * 2.2, 10), metal, 0, 0, 0, W).rotation.z = Math.PI / 2;
    if (spokes) for (let i = 0; i < 6; i++) { const s = add(new THREE.BoxGeometry(0.006, r * 1.9, 0.006), metal, 0, 0, 0, W); s.rotation.x = (i / 6) * Math.PI; }
    else add(new THREE.CylinderGeometry(r * 0.72, r * 0.72, w * 1.6, 16), metal, 0, 0, 0, W).rotation.z = Math.PI / 2;
    return W;
  }
  let seat = { y: 0.5, z: 0 }, r = 0.45, headM = null, grips = null;
  if (id === "bike") {
    const fr = M(0x2fb38a, { metalness: 0.2, roughness: 0.4 });
    wheel(0.3, 0.03, 0, 0.3, 0.52, true); wheel(0.3, 0.03, 0, 0.3, -0.52, true);
    const tube = (len, x, y, z, rx) => { const t = add(new THREE.CylinderGeometry(0.025, 0.025, len, 8), fr, x, y, z); t.rotation.x = rx; return t; };
    tube(0.62, 0, 0.55, 0.1, Math.PI / 2 - 0.25); tube(0.5, 0, 0.45, -0.2, 0.55); tube(0.5, 0, 0.44, 0.3, -0.75); tube(0.44, 0, 0.32, -0.33, Math.PI / 2 - 0.1);
    tube(0.42, 0, 0.58, 0.48, 0.25);
    tube(0.44, 0, 0.84, 0.4, -0.5);   // mataas na stem papunta sa manibela (abot ng kamay ni Tigo)
    add(new THREE.BoxGeometry(0.5, 0.025, 0.025), dark, 0, 1.02, 0.3);   // manibela
    [-0.22, 0.22].forEach((x) => add(new THREE.CylinderGeometry(0.024, 0.024, 0.1, 8), M(0xff5a36), x, 1.02, 0.3).rotation.z = Math.PI / 2);
    const s = add(new THREE.BoxGeometry(0.13, 0.04, 0.24), dark, 0, 0.72, -0.24); s.scale.x = 1.1;
    add(new THREE.BoxGeometry(0.2, 0.12, 0.14), M(0xc58f5e), 0, 0.68, 0.62);   // basket
    seat = { y: 0.74, z: -0.2 }; r = 0.5; grips = [[-0.22, 1.02, 0.3], [0.22, 1.02, 0.3]];
  } else if (id === "scooter") {
    const body = M(0xff8a3d, { metalness: 0.15, roughness: 0.35 }), cream = M(0xfff3e0, { roughness: 0.5 });
    wheel(0.19, 0.06, 0, 0.19, 0.5); wheel(0.19, 0.06, 0, 0.19, -0.5);
    add(new THREE.BoxGeometry(0.34, 0.08, 0.7), cream, 0, 0.26, 0);                       // tapakan
    const back = add(new THREE.SphereGeometry(0.28, 16, 12), body, 0, 0.42, -0.4); back.scale.set(0.85, 0.6, 1.2);
    add(new THREE.BoxGeometry(0.3, 0.07, 0.44), dark, 0, 0.6, -0.36);                      // upuan
    const front = add(new THREE.BoxGeometry(0.32, 0.62, 0.12), body, 0, 0.55, 0.4); front.rotation.x = -0.25;
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), metal, 0, 0.8, 0.38).rotation.x = -0.6;
    add(new THREE.BoxGeometry(0.5, 0.04, 0.04), dark, 0, 1.0, 0.28);
    [-0.21, 0.21].forEach((x) => add(new THREE.CylinderGeometry(0.026, 0.026, 0.1, 8), dark, x, 1.0, 0.28).rotation.z = Math.PI / 2);
    headM = M(0xfff7c2, { emissive: 0xffe08a, emissiveIntensity: 0.2 }); add(new THREE.SphereGeometry(0.065, 12, 10), headM, 0, 0.92, 0.62);
    const fender = add(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), body, 0, 0.22, 0.5); fender.scale.set(0.5, 0.7, 1);
    seat = { y: 0.64, z: -0.28 }; r = 0.55; grips = [[-0.21, 1.0, 0.28], [0.21, 1.0, 0.28]];
  } else {   // kotse: bilog na katawan, kabina na may salamin, 4 na gulong, ilaw
    const paint = M(0x3f8fd8, { metalness: 0.35, roughness: 0.3 }), glass = M(0xbfe6ff, { metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55 });
    [[-0.48, 0.62], [0.48, 0.62], [-0.48, -0.62], [0.48, -0.62]].forEach(([x, z]) => wheel(0.22, 0.08, x, 0.22, z));
    const b = add(new THREE.BoxGeometry(1.0, 0.36, 1.85), paint, 0, 0.42, 0); b.scale.set(1, 1, 1);
    const nose = add(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 14), paint, 0, 0.42, 0.92); nose.rotation.z = Math.PI / 2; nose.scale.set(1, 1, 0.9);
    const tail = add(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 14), paint, 0, 0.42, -0.92); tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1, 0.9);
    // convertible (walang bubong): salamin sa harap lang, para kasya si Tigo kahit malaki
    const ws = add(new THREE.BoxGeometry(0.86, 0.3, 0.03), glass, 0, 0.74, 0.34); ws.rotation.x = -0.35;
    add(new THREE.BoxGeometry(0.9, 0.04, 0.05), paint, 0, 0.89, 0.29).rotation.x = -0.35;
    const seatM = M(0xfff3e0, { roughness: 0.8 }); [-0.2, 0.2].forEach((x) => { add(new THREE.BoxGeometry(0.34, 0.08, 0.36), seatM, x, 0.62, -0.2); add(new THREE.BoxGeometry(0.34, 0.34, 0.08), seatM, x, 0.8, -0.4); });
    add(new THREE.BoxGeometry(0.86, 0.12, 0.4), seatM, 0, 0.62, -0.72);   // likod na upuan
    headM = M(0xfff7c2, { emissive: 0xffe08a, emissiveIntensity: 0.25 });
    [-0.32, 0.32].forEach((x) => { add(new THREE.SphereGeometry(0.08, 12, 10), headM, x, 0.47, 1.1); add(new THREE.BoxGeometry(0.14, 0.06, 0.03), M(0xff3b30, { emissive: 0xff3b30, emissiveIntensity: 0.4 }), x, 0.48, -1.1); });
    add(new THREE.BoxGeometry(0.5, 0.06, 0.03), metal, 0, 0.3, 1.12); add(new THREE.BoxGeometry(0.5, 0.06, 0.03), metal, 0, 0.3, -1.12);
    const st = add(new THREE.TorusGeometry(0.11, 0.018, 6, 18), dark, -0.2, 0.86, 0.1); st.rotation.x = -0.9;
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), dark, -0.2, 0.74, 0.2).rotation.x = -0.9;
    seat = { y: 0.66, z: -0.2, x: -0.2 }; r = 0.95; grips = [[-0.3, 0.87, 0.09], [-0.1, 0.87, 0.09]];
  }
  return {
    id, group, seat, r, grips,   // grips = [x,y,z] ng hawakan (kaliwa, kanan) — dito itinututok ang kamay ni Tigo
    update(dt, speed) { wheels.forEach((w) => { w.g.rotation.x += (speed * dt) / w.r; }); },
    lights(on) { if (headM) headM.emissiveIntensity = on ? 1.4 : 0.25; },
    dispose() { geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); },
  };
}
