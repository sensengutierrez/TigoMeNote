/* TigoMeNote · tigo/coin-game.js — "Coin Rush": takbo si Tigo at kunin ang mga coin bago maubos ang oras
   import { startCoinGame } from "./coin-game.js"
   const g = startCoinGame(sc, { seconds: 30, onScore(n, left), onEnd(n) })   sc = galing sa createScene()
   g.stop()  → itigil nang maaga (tatawagin pa rin ang onEnd)
   Mga coin: sa lupa (lakaran lang) at nakalutang (kailangang tumalon gamit ang Space / jump button).
   Gold = 1, ang bihirang star coin = 3. Ang tunay na reward ay sinusuri sa server (pet-fast "game"). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RADIUS, HOUSE } from "./backdrops.js";

export function startCoinGame(sc, { seconds = 30, onScore, onEnd } = {}) {
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.75, roughness: 0.25, emissive: 0x5a3c00, emissiveIntensity: 0.4 });
  const star = new THREE.MeshStandardMaterial({ color: 0x9be7ff, metalness: 0.5, roughness: 0.2, emissive: 0x1a5f99, emissiveIntensity: 0.7 });
  const geo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 24); geo.rotateX(Math.PI / 2);
  const coins = [];
  let score = 0, left = seconds, done = false, spawnT = 0;

  function freeSpot() {
    for (let k = 0; k < 20; k++) {
      const a = Math.random() * Math.PI * 2, d = 0.4 + Math.random() * (RADIUS - 0.6);
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < 1.0) continue;
      const me = sc.mainState(); if (Math.hypot(x - me.x, z - me.z) < 0.8) continue;
      return [x, z];
    }
    return [0, 1.5];
  }
  function spawn() {
    if (coins.length >= 7) return;
    const [x, z] = freeSpot(), high = Math.random() < 0.3, special = Math.random() < 0.12;
    const m = new THREE.Mesh(geo, special ? star : gold); m.castShadow = true;
    const y = high ? 1.55 : 0.45; m.position.set(x, y, z); m.scale.setScalar(0.01);
    sc.scene.add(m); coins.push({ m, y, val: special ? 3 : 1, life: 9 + Math.random() * 4, born: 0 });
  }
  for (let i = 0; i < 5; i++) spawn();

  const off = sc.onTick((dt, t) => {
    if (done) return;
    left -= dt; spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 0.9; }
    const me = sc.mainState();
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]; c.born += dt; c.life -= dt;
      c.m.rotation.y += dt * 3; c.m.position.y = c.y + Math.sin(t * 3 + i) * 0.06;
      c.m.scale.setScalar(Math.min(1, c.born * 4) * Math.min(1, Math.max(0.01, c.life)));
      const near = Math.hypot(c.m.position.x - me.x, c.m.position.z - me.z) < 0.55;
      const reach = Math.abs(c.m.position.y - (me.y + 0.7)) < 0.75;
      if (near && reach) {
        score += c.val; sc.effect(c.val > 1 ? "stars" : "sparkle", { x: c.m.position.x, y: c.m.position.y, z: c.m.position.z });
        sc.scene.remove(c.m); coins.splice(i, 1); onScore && onScore(score, Math.max(0, Math.ceil(left)));
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
      } else if (c.life <= 0) { sc.scene.remove(c.m); coins.splice(i, 1); }
    }
    if (left <= 0) finish();
    else onScore && onScore(score, Math.ceil(left));
  });
  function finish() {
    if (done) return; done = true; off();
    coins.forEach((c) => sc.scene.remove(c.m)); coins.length = 0;
    geo.dispose(); gold.dispose(); star.dispose();
    onEnd && onEnd(score);
  }
  return { stop: finish, get score() { return score; } };
}
