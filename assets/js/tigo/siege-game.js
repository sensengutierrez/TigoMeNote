/* TigoMeNote · tigo/siege-game.js — "Gloom Siege": bantayan ang isla laban sa alon-alon na Gloomies (cartoon, walang dugo)
   import { startSiege } from "./siege-game.js"
   const g = startSiege(sc, { voice, seed, net, me:{name,color}, onHud(h), onButtons(b), onEnd(res) })   g.go() · g.stop() · g.splash()
   Kontrol: lakad gamit ang stick / W A S D. Kusang bumabaril ng bula 🫧 si Tigo sa pinakamalapit na Gloomy.
     💦 Splash (button o Space) = tama sa lahat ng malapit (may hintay na 7 s). ❤️ = puso na naiiwan minsan.
   Solo: tapos kapag ubos ang ❤️. Co-op (2–4, net mula sa room-lobby.js): ang host ang may hawak ng Gloomies, buhay at alon;
     babagsak kapag ubos ang buhay — tumayo sa tabi ng kasama nang 2 s para buhayin siya. Lahat bagsak = tapos.
   Events: me {x,z,h} · fire {m} · splash {x,z} · st {…} (host) · rev {to} · end (host) · bye.
   Puntos: 10 bawat Gloomy + 50 bawat natapos na alon (iisa para sa buong team). Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { createTigo } from "./pet-model.js";

const ARENA = 4.6, MAXM = 40;
const TYPES = [{ hp: 2, sp: 1.0, s: 1, col: 0x8a7fb8 }, { hp: 1, sp: 1.65, s: 0.8, col: 0x6fc3d8 }, { hp: 6, sp: 0.7, s: 1.45, col: 0x5b4f8a }];
function rng(seed) { let s = (seed >>> 0) || 3; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

export function startSiege(sc, { voice, seed = 1, net = null, me: meInfo = {}, onHud, onButtons, onEnd } = {}) {
  const multi = !!net, host = !multi || net.host;
  const R = rng(seed);
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const M = (o) => keep(new THREE.MeshStandardMaterial(o));
  const oldFog = sc.scene.fog; sc.scene.fog = new THREE.Fog(0x2a2350, 9, 20);
  const dusk = new THREE.HemisphereLight(0xffd6f0, 0x3b3170, 1.0); world.add(dusk);

  // ---------- isla ----------
  const ground = new THREE.Mesh(keep(new THREE.CylinderGeometry(ARENA + 0.4, ARENA + 0.1, 0.4, 48)), M({ color: 0x77c46b, roughness: 0.9 }));
  ground.position.y = -0.2; ground.receiveShadow = true; world.add(ground);
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(ARENA + 0.25, 0.08, 8, 64)), M({ color: 0xf2e3c6 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; world.add(ring);
  const rockM = M({ color: 0xb3a99a, roughness: 0.9 });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + R() * 0.2, r = new THREE.Mesh(keep(new THREE.DodecahedronGeometry(0.22 + R() * 0.2)), rockM); r.position.set(Math.cos(a) * (ARENA + 0.5), 0.1, Math.sin(a) * (ARENA + 0.5)); world.add(r); }
  const flower = M({ color: 0xffe066, emissive: 0x8a6d00, emissiveIntensity: 0.3 });
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = R() * ARENA * 0.95, f = new THREE.Mesh(keep(new THREE.SphereGeometry(0.04, 6, 4)), flower); f.position.set(Math.cos(a) * d, 0.03, Math.sin(a) * d); world.add(f); }

  // ---------- mga manlalaro ----------
  sc.beginGame({ tick, cam });
  const TS = 0.3, T = sc.main; T.group.scale.setScalar(TS);
  const roster = multi ? net.roster : [{ p: "me", name: meInfo.name || "You", color: meInfo.color }];
  const myId = multi ? net.me : "me";
  const players = roster.map((x, i) => {
    const mine = x.p === myId, a = (i / roster.length) * Math.PI * 2;
    let t = T; if (!mine) { t = createTigo({ color: x.color || "sky" }); t.group.scale.setScalar(TS); world.add(t.group); }
    return { id: x.p, name: x.name, mine, t, x: Math.cos(a) * 0.6, z: Math.sin(a) * 0.6, tx: 0, tz: 0, h: 0, hp: 100, down: false, fireT: 0.3, moving: false, last: performance.now() };
  });
  const me = players.find((p) => p.mine);
  players.forEach((p) => { p.tx = p.x; p.tz = p.z; });

  // ---------- Gloomies ----------
  const eyeW = M({ color: 0xffffff }), eyeK = M({ color: 0x1d1416 }), blob = keep(new THREE.SphereGeometry(0.19, 16, 12)), eg = keep(new THREE.SphereGeometry(0.05, 10, 8)), kg = keep(new THREE.SphereGeometry(0.025, 8, 6));
  const typeMats = TYPES.map((t) => M({ color: t.col, roughness: 0.6 }));
  const hitMat = M({ color: 0xffffff, emissive: 0xbfe9ff, emissiveIntensity: 0.8 });
  const mobs = new Map(); let nextId = 1;
  function makeMob(id, type, x, z) {
    const ty = TYPES[type], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const parts = [[0, 0.26, 0, 1], [-0.13, 0.17, 0.02, 0.75], [0.13, 0.17, 0.02, 0.75], [0, 0.2, -0.1, 0.8]].map(([px, py, pz, s]) => { const m = new THREE.Mesh(blob, typeMats[type]); m.position.set(px, py, pz); m.scale.setScalar(s); body.add(m); return m; });
    [-0.07, 0.07].forEach((ex) => { const w = new THREE.Mesh(eg, eyeW); w.position.set(ex, 0.29, 0.17); body.add(w); const k = new THREE.Mesh(kg, eyeK); k.position.set(ex, 0.28, 0.21); body.add(k); });
    g.scale.setScalar(ty.s * 0.95); g.position.set(x, 0, z); world.add(g);
    const m = { id, type, g, body, parts, x, z, tx: x, tz: z, hp: ty.hp, flash: 0, hitCd: 0 };
    mobs.set(id, m); return m;
  }
  function killMob(m, by) {
    mobs.delete(m.id); world.remove(m.g); sc.effect("bubbles", { x: m.x, y: 0.3, z: m.z });
    if (host) { kills++; if (R() < 0.07) spawnHeart(m.x, m.z); }
    if (by === myId) voice && voice.sfx("pop");
  }
  // puso
  const heartM = M({ color: 0xff4f7b, emissive: 0x661122, emissiveIntensity: 0.6 });
  const hearts = new Map(); let nextH = 1;
  function makeHeart(id, x, z) { const h = new THREE.Mesh(keep(new THREE.SphereGeometry(0.12, 12, 10)), heartM); h.scale.set(1, 0.85, 0.7); h.position.set(x, 0.25, z); world.add(h); hearts.set(id, { id, x, z, m: h }); }
  function spawnHeart(x, z) { makeHeart(nextH++, x, z); }
  // bula (biswal lang)
  const bubbleG = keep(new THREE.SphereGeometry(0.07, 10, 8)), bubbleM = keep(new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transmission: 0.5, transparent: true, opacity: 0.75, roughness: 0.05 }));
  const shots = [];
  function shoot(from, m) { const b = new THREE.Mesh(bubbleG, bubbleM); b.position.set(from.x, 0.3, from.z); world.add(b); shots.push({ b, m, t: 0, sx: from.x, sz: from.z }); }

  // ---------- estado ----------
  let running = false, done = false, t0 = 0, wave = 0, toSpawn = 0, spawnT = 0, breakT = 2, kills = 0, splashCd = 0, sendT = 0, reviveT = 0, lastHud = "";
  const score = () => kills * 10 + Math.max(0, wave - 1) * 50;
  function startWave() {
    wave++; const n = roster.length;
    toSpawn = Math.round((5 + wave * 3) * (1 + 0.5 * (n - 1))); spawnT = 0.5;
    if (wave > 1) voice && voice.sfx("level");
  }
  function spawnOne() {
    const a = R() * Math.PI * 2, r = ARENA + 0.3;
    const type = wave >= 3 && R() < 0.18 ? 2 : wave >= 2 && R() < 0.3 ? 1 : 0;
    makeMob(nextId++, type, Math.cos(a) * r, Math.sin(a) * r);
  }
  function hud() {
    const h = { hp: Math.max(0, Math.round(me.hp)), down: me.down, wave, score: score(), kills, left: mobs.size + toSpawn, team: multi ? players.filter((p) => !p.down).length + "/" + players.length : null, breakT: mobs.size + toSpawn === 0 && breakT > 0 ? Math.ceil(breakT) : 0, help: players.some((p) => p !== me && p.down) };
    const s = JSON.stringify(h); if (s !== lastHud) { lastHud = s; onHud && onHud(h); }
    onButtons && onButtons({ splash: !me.down && splashCd <= 0, cd: Math.max(0, Math.ceil(splashCd)) });
  }

  // ---------- galaw ----------
  function moveMe(dt) {
    if (me.down) { me.moving = false; T.walk(0); return; }
    const i = sc.input ? sc.input() : { x: 0, z: 0 }, mag = Math.min(1, Math.hypot(i.x, i.z));
    if (mag < 0.15) { me.moving = false; T.walk(0); return; }
    const sp = 2.6 * dt * mag, k = 1 / (Math.hypot(i.x, i.z) || 1);
    me.x += i.x * k * sp; me.z += i.z * k * sp;
    const d = Math.hypot(me.x, me.z); if (d > ARENA - 0.15) { me.x *= (ARENA - 0.15) / d; me.z *= (ARENA - 0.15) / d; }
    me.h = Math.atan2(i.x, i.z); me.moving = true; T.walk(mag, me.h);
  }
  function autoFire(dt) {
    if (me.down) return;
    me.fireT -= dt; if (me.fireT > 0) return;
    let best = null, bd = 3.4;
    mobs.forEach((m) => { const d = Math.hypot(m.x - me.x, m.z - me.z); if (d < bd) { bd = d; best = m; } });
    if (!best) return;
    me.fireT = 0.32; shoot(me, best);
    if (host) hitMob(best, 1, myId); else net.send("fire", { m: best.id });
  }
  function hitMob(m, dmg, by) { m.hp -= dmg; m.flash = 0.12; if (m.hp <= 0) { killMob(m, by); if (multi) net.send("kill", { m: m.id, by }); } }
  function splash() {
    if (!running || done || me.down || splashCd > 0) return;
    splashCd = 7; voice && voice.sfx("power"); sc.effect("bubbles", { x: me.x, y: 0.3, z: me.z }); sc.effect("sparkle", { x: me.x, y: 0.2, z: me.z });
    if (host) doSplash(me.x, me.z, myId); else net.send("splash", { x: +me.x.toFixed(2), z: +me.z.toFixed(2) });
  }
  function doSplash(x, z, by) { [...mobs.values()].forEach((m) => { if (Math.hypot(m.x - x, m.z - z) < 1.6) hitMob(m, 3, by); }); }

  // ---------- host: Gloomies ----------
  function hostStep(dt) {
    if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0 && mobs.size < MAXM) { spawnOne(); toSpawn--; spawnT = Math.max(0.25, 1.1 - wave * 0.08); } }
    else if (mobs.size === 0) { breakT -= dt; if (breakT <= 0) { breakT = 3; startWave(); } }
    const alive = players.filter((p) => !p.down);
    mobs.forEach((m) => {
      if (!alive.length) return;
      let tgt = alive[0], bd = 1e9; alive.forEach((p) => { const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < bd) { bd = d; tgt = p; } });
      const ty = TYPES[m.type], sp = ty.sp * (1 + wave * 0.04) * dt;
      if (bd > 0.28) { m.x += (tgt.x - m.x) / bd * sp; m.z += (tgt.z - m.z) / bd * sp; }
      m.hitCd -= dt;
      if (bd < 0.34 && m.hitCd <= 0) { m.hitCd = 0.8; hurt(tgt, m.type === 2 ? 14 : 8); }
    });
    hearts.forEach((h) => { const p = alive.find((p) => Math.hypot(p.x - h.x, p.z - h.z) < 0.35); if (p) { p.hp = Math.min(100, p.hp + 20); world.remove(h.m); hearts.delete(h.id); if (p.mine) voice && voice.sfx("eat"); } });
    if (alive.length === 0) finish();
  }
  function hurt(p, dmg) {
    if (p.down) return;
    p.hp -= dmg; if (p.mine) { voice && voice.sfx("hit"); T.wiggle && T.wiggle(); }
    if (p.hp <= 0) { p.hp = 0; p.down = true; if (p.mine) T.spin(); if (!multi) finish(); }
  }
  function state() {
    const m = []; mobs.forEach((x) => m.push([x.id, +x.x.toFixed(2), +x.z.toFixed(2), x.hp, x.type]));
    const hp = {}; players.forEach((p) => { hp[p.id] = [Math.round(p.hp), p.down ? 1 : 0]; });
    const hs = []; hearts.forEach((h) => hs.push([h.id, +h.x.toFixed(2), +h.z.toFixed(2)]));
    return { w: wave, m, hp, k: kills, ts: toSpawn, b: +breakT.toFixed(1), hs };
  }

  // ---------- network ----------
  if (net) net.on((ev, d, from) => {
    if (done) return;
    const p = players.find((x) => x.id === from);
    if (ev === "me" && p && !p.mine) { p.tx = d.x; p.tz = d.z; p.h = d.h; p.moving = !!d.mv; p.last = performance.now(); return; }
    if (ev === "fire" && p && !p.mine) { const m = mobs.get(d.m); if (m) { shoot(p, m); if (host) hitMob(m, 1, from); } return; }
    if (ev === "splash" && p && !p.mine) { sc.effect("bubbles", { x: d.x, y: 0.3, z: d.z }); if (host) doSplash(d.x, d.z, from); return; }
    if (ev === "rev" && host) { const t = players.find((x) => x.id === d.to); if (t && t.down) { t.down = false; t.hp = 50; } return; }
    if (ev === "bye" && p) { p.down = true; p.gone = true; p.hp = 0; if (!p.mine) p.t.group.visible = false; if (d.p === net.roster[0].p && !host) { if (onHud) onHud({ note: "The host left the game." }); finish(); } return; }
    if (!host) {
      if (ev === "st") {
        wave = d.w; kills = d.k; toSpawn = d.ts; breakT = d.b;
        const seen = new Set();
        d.m.forEach(([id, x, z, hp, type]) => { seen.add(id); let m = mobs.get(id); if (!m) m = makeMob(id, type, x, z); m.tx = x; m.tz = z; if (hp < m.hp) m.flash = 0.12; m.hp = hp; });
        mobs.forEach((m) => { if (!seen.has(m.id)) { mobs.delete(m.id); world.remove(m.g); sc.effect("bubbles", { x: m.x, y: 0.3, z: m.z }); } });
        players.forEach((q) => { const v = d.hp[q.id]; if (!v) return; if (q.mine && v[0] < q.hp && !q.down) { voice && voice.sfx("hit"); } q.hp = v[0]; const wasDown = q.down; q.down = !!v[1]; if (q.mine && q.down && !wasDown) T.spin(); });
        const hseen = new Set(); d.hs.forEach(([id, x, z]) => { hseen.add(id); if (!hearts.has(id)) makeHeart(id, x, z); });
        hearts.forEach((h) => { if (!hseen.has(h.id)) { world.remove(h.m); hearts.delete(h.id); } });
      }
      if (ev === "end") finish(true);
    }
  });

  // ---------- bawat frame ----------
  function tick(dt, t) {
    if (done) return;
    mobs.forEach((m) => {
      if (!host) { m.x += (m.tx - m.x) * Math.min(1, dt * 10); m.z += (m.tz - m.z) * Math.min(1, dt * 10); }
      const tg = players.find((p) => !p.down) || me;
      m.g.position.set(m.x, 0, m.z); m.g.rotation.y = Math.atan2(tg.x - m.x, tg.z - m.z);
      m.body.position.y = 0.04 + Math.sin(t * 6 + m.id) * 0.04;
      if (m.flash > 0) m.flash -= dt;
      m.parts.forEach((pp) => { pp.material = m.flash > 0 ? hitMat : typeMats[m.type]; });
    });
    hearts.forEach((h) => { h.m.rotation.y = t * 2; h.m.position.y = 0.25 + Math.sin(t * 3 + h.id) * 0.05; });
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.t += dt * 5;
      const tx = s.m.g.position.x, tz = s.m.g.position.z;
      s.b.position.set(s.sx + (tx - s.sx) * Math.min(1, s.t), 0.3 + Math.sin(Math.min(1, s.t) * Math.PI) * 0.25, s.sz + (tz - s.sz) * Math.min(1, s.t));
      if (s.t >= 1) { world.remove(s.b); shots.splice(i, 1); }
    }
    players.forEach((p) => {
      if (!p.mine) { p.x += (p.tx - p.x) * Math.min(1, dt * 10); p.z += (p.tz - p.z) * Math.min(1, dt * 10); p.t.walk(p.moving && !p.down ? 1 : 0, p.h); p.t.update(dt, t); }
      p.t.group.position.set(p.x, 0, p.z); p.t.group.rotation.x = p.down ? -1.2 : 0;
    });
    if (!running) { T.walk(0); hud(); return; }
    moveMe(dt); autoFire(dt);
    if (splashCd > 0) splashCd -= dt;
    // buhayin ang kasama: tumayo sa tabi niya nang 2 s
    const fallen = players.find((p) => p !== me && p.down && !p.gone && Math.hypot(p.x - me.x, p.z - me.z) < 0.6);
    if (fallen && !me.down) { if (!reviveT) reviveT = performance.now(); if (performance.now() - reviveT > 2000) { reviveT = 0; sc.effect("hearts", { x: fallen.x, y: 0.4, z: fallen.z }); voice && voice.sfx("pop"); if (host) { fallen.down = false; fallen.hp = 50; } else net.send("rev", { to: fallen.id }); } }
    else reviveT = 0;
    if (host) hostStep(dt);
    if (net) { sendT -= dt; if (sendT <= 0) { sendT = 0.1; net.send("me", { x: +me.x.toFixed(2), z: +me.z.toFixed(2), h: +me.h.toFixed(2), mv: me.moving ? 1 : 0 }); if (host) net.send("st", state()); } }
    hud();
  }
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function cam(camera, dt) {
    const tall = camera.aspect < 0.8, k = tall ? 1.55 : 1.05;
    const cx = me.x * 0.55, cz = me.z * 0.55;
    camPos.set(cx, 5.4 * k, cz + 4.4 * k);
    camera.position.lerp(camPos, Math.min(1, dt * 4));
    look.set(cx, 0, cz + (tall ? 0.8 : 0.2)); camera.lookAt(look);
  }
  function finish() {
    if (done) return; done = true; running = false;
    if (net && host) net.send("end", {});
    const res = { score: score(), wave, kills, ms: Math.round(performance.now() - t0), win: wave >= 5,
      label: "🌊 Wave " + wave + " · " + score() + " pts" };
    voice && voice.sfx(wave >= 5 ? "win" : "hit");
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, 900);
  }
  function cleanup() {
    sc.scene.fog = oldFog; T.group.rotation.x = 0;
    players.forEach((p) => { if (!p.mine && p.t.dispose) p.t.dispose(); });
    shots.forEach((s) => world.remove(s.b));
    sc.scene.remove(world); sc.endGame();
    own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; t0 = performance.now(); if (host) { breakT = 0; startWave(); } },
    stop() { if (net) net.send("bye", {}); finish(); },
    splash,
    _s: { me, mobs, players, hurt: (dmg) => hurt(me, dmg), get wave() { return wave; }, get kills() { return kills; } },   // para sa tests
  };
}
