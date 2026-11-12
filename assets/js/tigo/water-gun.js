/* TigoMeNote · tigo/water-gun.js — 💦 water gun: bumubuga ng tubig sa harap ni Tigo
   import { createWaterGun } from "./water-gun.js"
   const wg = createWaterGun({ sc, onHit(list) })   wg.fire() → false kung naghihintay pa (cooldown 1.2 s) · wg.dispose()
   Ang mga tinamaan (sc.aim): 🐶 alaga = nababasa at tumatakbo palayo · 🌱 taniman = nadidiligan (ang page ang tatawag sa server) · 👥 kaibigan = bula.
   Tilamsik: maliliit na patak (iisang InstancedMesh, magaan) na may gravity, at maliit na "splash" sa lupa. */
import * as THREE from "../../vendor/three/three.module.min.js";

const N = 90;
export function createWaterGun({ sc, onHit }) {
  const geo = new THREE.SphereGeometry(0.035, 6, 5), mat = new THREE.MeshStandardMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.75, roughness: 0.05, emissive: 0x2a7fbf, emissiveIntensity: 0.25 });
  const im = new THREE.InstancedMesh(geo, mat, N); im.frustumCulled = false; im.count = 0; sc.scene.add(im);
  const drops = [], o = new THREE.Object3D();
  let fireT = 0, cd = 0, hitDone = true;
  const off = sc.onTick((dt) => {
    cd = Math.max(0, cd - dt);
    if (fireT > 0) {
      fireT -= dt;
      const g = sc.main.group, h = g.rotation.y, k = g.scale.y || 1, fx = Math.sin(h), fz = Math.cos(h);
      for (let i = 0; i < 3 && drops.length < N; i++) {
        const sp = 5.2 + Math.random() * 0.8;
        drops.push({ x: g.position.x + fx * 0.45 * k + fz * 0.18 * k, y: g.position.y + 0.95 * k, z: g.position.z + fz * 0.45 * k - fx * 0.18 * k,
          vx: fx * sp + (Math.random() - 0.5) * 0.5, vy: 1.4 + Math.random() * 0.6, vz: fz * sp + (Math.random() - 0.5) * 0.5, life: 1.2 });
      }
      if (!hitDone && fireT < 0.55) { hitDone = true; const list = sc.aim(3.8); if (onHit) onHit(list); }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.life -= dt;
      if (d.y < 0.03 || d.life <= 0) drops.splice(i, 1);
    }
    im.count = drops.length;
    drops.forEach((d, i) => { o.position.set(d.x, d.y, d.z); const s = 0.8 + Math.min(1, d.life) * 0.4; o.scale.set(s, s * 1.4, s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
  });
  return {
    fire() { if (cd > 0 || sc.inGame() || sc.isInside()) return false; fireT = 0.9; cd = 1.2; hitDone = false; return true; },
    firing() { return fireT > 0; },
    dispose() { off(); sc.scene.remove(im); geo.dispose(); mat.dispose(); im.dispose(); },
  };
}
