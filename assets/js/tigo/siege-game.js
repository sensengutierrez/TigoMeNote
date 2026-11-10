/* TigoMeNote · tigo/siege-game.js — "Gloom Siege": bantayan ang isla laban sa alon-alon na Gloomies (cartoon, walang dugo)
   import { startSiege } from "./siege-game.js"
   const g = startSiege(sc, { voice, seed, net, me:{name,color,av}, onHud(h), onButtons(b), onEnd(res) })   g.go() · g.stop() · g.splash() · g.look(dx,dy) · g.zoom(k)
   View: nasa LIKOD ni Tigo ang camera (third person). Hilahin ang screen = ikot / tingala; pinch o wheel = lapit-layo. Ang lakad ay ayon sa camera.
   Kontrol: lakad gamit ang stick / W A S D. Kusang bumabaril ng bula 🫧 si Tigo sa pinakamalapit na Gloomy (may dilaw na bilog ang tina-target).
     💦 Splash (button o Space) = tama sa lahat ng malapit (may hintay na 7 s).
   Mga napupulot (iba-iba, binabago ang kakayahan ni Tigo): ❤️ buhay +25 · ⚡ Rapid (mabilis na putok, 10 s) · 🔱 Triple (3 sabay, 10 s) ·
     💥 Big (malakas na bula, 10 s) · 🛡️ Shield (hindi tinatamaan, 6 s) · ❄️ Freeze (bumabagal ang lahat ng Gloomy, 5 s).
   Bawat alon ay ibang lugar (THEMES: Meadow → Beach → Snow → Dusk → Ember → ulit): kulay ng lupa, langit, at mga palamuti.
   Solo: tapos kapag ubos ang ❤️. Co-op (2–4, net mula sa room-lobby.js): ang host ang may hawak ng Gloomies, buhay, alon at mga napupulot;
     babagsak kapag ubos ang buhay — tumayo sa tabi ng kasama nang 2 s para buhayin siya. Lahat bagsak = tapos.
   Events: me {x,z,h} · fire {m:[ids]} · splash {x,z} · st {…} (host) · rev {to} · end (host) · bye.
   Puntos: 10 bawat Gloomy + 50 bawat natapos na alon (iisa para sa buong team). Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { createTigo } from "./pet-model.js";

const ARENA = 7.5, MAXM = 40, RANGE = 4.6;
export const THEMES = [
  { name: "Meadow", icon: "🌼", ground: 0x7ccf6f, ring: 0xf2e3c6, sky: 0x9fd8ff, light: [0xffffff, 0x8fbf7a], prop: "tree" },
  { name: "Beach", icon: "🏖️", ground: 0xf0d9a0, ring: 0x6fd3ff, sky: 0x7fd0ff, light: [0xfff3d6, 0xe8c98a], prop: "palm" },
  { name: "Snow", icon: "❄️", ground: 0xf2f7ff, ring: 0xb7c7d9, sky: 0xcfe3ff, light: [0xffffff, 0xb9c9e6], prop: "pine" },
  { name: "Dusk", icon: "🌆", ground: 0x8e79c9, ring: 0xf2c6e3, sky: 0x3a2d6b, light: [0xffd6f0, 0x3b3170], prop: "crystal" },
  { name: "Ember", icon: "🌋", ground: 0x6b4a40, ring: 0xff8a3d, sky: 0x2b1620, light: [0xffc9a6, 0x4a2a22], prop: "rock" },
];
// Mga napupulot: [susi, icon, pangalan, tagal ng epekto (s)]
export const DROPS = [["heart", "❤️", "+25", 0], ["rapid", "⚡", "Rapid", 10], ["triple", "🔱", "Triple", 10], ["big", "💥", "Big", 10], ["shield", "🛡️", "Shield", 6], ["freeze", "❄️", "Freeze", 5]];
const TYPES = [{ hp: 2, sp: 1.0, s: 1, col: 0x8a7fb8 }, { hp: 1, sp: 1.65, s: 0.8, col: 0x6fc3d8 }, { hp: 6, sp: 0.7, s: 1.45, col: 0x5b4f8a }];
function rng(seed) { let s = (seed >>> 0) || 3; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

export function startSiege(sc, { voice, seed = 1, net = null, me: meInfo = {}, onHud, onButtons, onEnd } = {}) {
  const multi = !!net, host = !multi || net.host;
  const R = rng(seed);
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const M = (o) => keep(new THREE.MeshStandardMaterial(o));
  const oldFog = sc.scene.fog, oldBg = sc.scene.background; sc.scene.fog = new THREE.Fog(0x9fd8ff, 10, 26); sc.scene.background = new THREE.Color(0x9fd8ff);
  const dusk = new THREE.HemisphereLight(0xffffff, 0x8fbf7a, 1.0); world.add(dusk);

  // ---------- isla (nag-iiba ang itsura bawat alon) ----------
  const groundM = M({ color: 0x7ccf6f, roughness: 0.9 }), ringM = M({ color: 0xf2e3c6 });
  const ground = new THREE.Mesh(keep(new THREE.CylinderGeometry(ARENA + 0.4, ARENA + 0.1, 0.4, 56)), groundM);
  ground.position.y = -0.2; ground.receiveShadow = true; world.add(ground);
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(ARENA + 0.25, 0.08, 8, 72)), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; world.add(ring);
  let props = null, theme = null;
  const _o = new THREE.Object3D();
  function instProps(g, geo, mat, list) {
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => { _o.position.set(it[0], it[1], it[2]); _o.rotation.set(0, it[3] || 0, 0); _o.scale.setScalar(it[4] || 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); });
    m.frustumCulled = false; m.castShadow = true; g.add(m);
  }
  function setTheme(w) {
    const th = THEMES[(Math.max(1, w) - 1) % THEMES.length]; if (th === theme) return; theme = th;
    groundM.color.set(th.ground); ringM.color.set(th.ring);
    sc.scene.background.set(th.sky); sc.scene.fog.color.set(th.sky);
    dusk.color.set(th.light[0]); dusk.groundColor.set(th.light[1]);
    if (props) { world.remove(props); props.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); if (o.isInstancedMesh) o.dispose(); }); }
    props = new THREE.Group(); world.add(props);
    // palamuti: sa gilid (bilog) at kalat sa loob; pare-pareho sa lahat ng kasali (seed + bilang ng alon)
    const P = rng(seed + w * 977), spots = [];
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + P() * 0.2; spots.push([Math.cos(a) * (ARENA + 0.7 + P() * 0.5), 0, Math.sin(a) * (ARENA + 0.7 + P() * 0.5), P() * 6, 0.9 + P() * 0.7]); }
    for (let i = 0; i < 12; i++) { const a = P() * Math.PI * 2, d = 2 + P() * (ARENA - 2.6); spots.push([Math.cos(a) * d, 0, Math.sin(a) * d, P() * 6, 0.5 + P() * 0.4]); }
    const mm = (o) => new THREE.MeshStandardMaterial(o), up = (l, y, k = 1) => l.map((q) => [q[0], y * q[4], q[2], q[3], q[4] * k]);
    if (th.prop === "tree") { instProps(props, new THREE.CylinderGeometry(0.07, 0.1, 0.6, 6), mm({ color: 0x8d6e4a }), up(spots, 0.3)); instProps(props, new THREE.SphereGeometry(0.42, 9, 7), mm({ color: 0x4caf50, roughness: 0.9 }), up(spots, 0.85)); }
    else if (th.prop === "palm") { instProps(props, new THREE.CylinderGeometry(0.06, 0.09, 1.1, 6), mm({ color: 0x9c7a4c }), up(spots, 0.55)); instProps(props, new THREE.ConeGeometry(0.55, 0.3, 6), mm({ color: 0x3fa34d }), up(spots, 1.2)); }
    else if (th.prop === "pine") { instProps(props, new THREE.ConeGeometry(0.4, 1.1, 7), mm({ color: 0x2e7d5b }), up(spots, 0.6)); instProps(props, new THREE.ConeGeometry(0.2, 0.3, 7), mm({ color: 0xffffff }), up(spots, 1.2)); }
    else if (th.prop === "crystal") { instProps(props, new THREE.OctahedronGeometry(0.34), mm({ color: 0xc9a6ff, emissive: 0x7a4fd6, emissiveIntensity: 0.7, roughness: 0.3 }), up(spots, 0.4)); }
    else { instProps(props, new THREE.DodecahedronGeometry(0.36), mm({ color: 0x4a3a36, roughness: 1 }), up(spots, 0.25)); instProps(props, new THREE.SphereGeometry(0.12, 6, 5), mm({ color: 0xff8a3d, emissive: 0xff5a1a, emissiveIntensity: 1.2 }), up(spots, 0.55)); }
  }
  setTheme(1);

  // ---------- mga manlalaro ----------
  sc.beginGame({ tick, cam });
  const TS = 0.3, T = sc.main; T.group.scale.setScalar(TS);
  const roster = multi ? net.roster : [{ p: "me", name: meInfo.name || "You", color: meInfo.color }];
  const myId = multi ? net.me : "me";
  const players = roster.map((x, i) => {
    const mine = x.p === myId, a = (i / roster.length) * Math.PI * 2;
    let t = T; if (!mine) { t = createTigo({ color: x.color || "sky", avatar: x.av }); t.group.scale.setScalar(TS); world.add(t.group); }
    return { id: x.p, name: x.name, mine, t, x: Math.cos(a) * 0.6, z: Math.sin(a) * 0.6, tx: 0, tz: 0, h: 0, hp: 100, down: false, fireT: 0.3, moving: false, last: performance.now(), buff: null, buffT: 0, shield: 0 };
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
    if (host) { kills++; if (R() < 0.15) spawnDrop(m.x, m.z); }
    if (by === myId) voice && voice.sfx("pop");
  }
  // mga napupulot (iba-ibang hugis at kulay)
  const dropMat = { heart: [0xff4f7b, 0x661122], rapid: [0xffd23f, 0x8a6400], triple: [0x58d68d, 0x1e6b3c], big: [0xff8a3d, 0x8a3a00], shield: [0x5aa9ff, 0x153e7a], freeze: [0xdff6ff, 0x4fb3d9] };
  const dropGeo = { heart: keep(new THREE.SphereGeometry(0.13, 12, 10)), rapid: keep(new THREE.OctahedronGeometry(0.15)), triple: keep(new THREE.SphereGeometry(0.075, 10, 8)), big: keep(new THREE.SphereGeometry(0.17, 14, 10)), shield: keep(new THREE.IcosahedronGeometry(0.15)), freeze: keep(new THREE.DodecahedronGeometry(0.14)) };
  const dropM = {}; Object.keys(dropMat).forEach((k) => { dropM[k] = M({ color: dropMat[k][0], emissive: dropMat[k][1], emissiveIntensity: 0.7, roughness: 0.35 }); });
  const haloG = keep(new THREE.RingGeometry(0.2, 0.27, 20));
  const hearts = new Map(); let nextH = 1;   // lahat ng napupulot (hindi lang puso)
  function makeHeart(id, x, z, k = "heart") {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    if (k === "triple") [[-0.1, 0], [0.1, 0], [0, 0.13]].forEach(([dx, dy]) => { const m = new THREE.Mesh(dropGeo.triple, dropM.triple); m.position.set(dx, dy, 0); b.add(m); });
    else { const m = new THREE.Mesh(dropGeo[k], dropM[k]); if (k === "heart") m.scale.set(1, 0.85, 0.7); if (k === "rapid") m.scale.set(0.6, 1.3, 0.6); b.add(m); }
    const halo = new THREE.Mesh(haloG, keep(new THREE.MeshBasicMaterial({ color: dropMat[k][0], transparent: true, opacity: 0.55, side: THREE.DoubleSide }))); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; g.add(halo);
    g.position.set(x, 0, z); world.add(g); hearts.set(id, { id, x, z, k, m: g, b });
  }
  function spawnDrop(x, z) { const r = R(); makeHeart(nextH++, x, z, r < 0.26 ? "heart" : DROPS[1 + ((R() * 5) | 0)][0]); }
  function give(p, k) {   // host: ibigay ang epekto
    if (k === "heart") p.hp = Math.min(100, p.hp + 25);
    else if (k === "shield") p.shield = 6;
    else if (k === "freeze") freezeT = 5;
    else { p.buff = k; p.buffT = 10; }
  }
  // bula (biswal lang)
  const bubbleG = keep(new THREE.SphereGeometry(0.07, 10, 8)), bubbleM = keep(new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transmission: 0.5, transparent: true, opacity: 0.75, roughness: 0.05 }));
  const shots = [];
  function shoot(from, m, big) { const b = new THREE.Mesh(bubbleG, bubbleM); b.position.set(from.x, 0.3, from.z); if (big) b.scale.setScalar(2.1); world.add(b); shots.push({ b, m, t: 0, sx: from.x, sz: from.z }); }
  // bilog sa tina-target (aim)
  const aim = new THREE.Mesh(keep(new THREE.RingGeometry(0.26, 0.32, 24)), keep(new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }))); aim.rotation.x = -Math.PI / 2; aim.visible = false; world.add(aim);

  // ---------- estado ----------
  let running = false, done = false, t0 = 0, wave = 0, toSpawn = 0, spawnT = 0, breakT = 2, kills = 0, splashCd = 0, sendT = 0, reviveT = 0, lastHud = "", freezeT = 0, bannerW = 0;
  const view = { yaw: Math.PI, pitch: 0.42, dist: 3.6 };   // camera sa likod ni Tigo
  const score = () => kills * 10 + Math.max(0, wave - 1) * 50;
  function startWave() {
    wave++; const n = roster.length;
    toSpawn = Math.round((5 + wave * 3) * (1 + 0.5 * (n - 1))); spawnT = 0.5;
    if (wave > 1) voice && voice.sfx("level");
    setTheme(wave);
  }
  function spawnOne() {
    const a = R() * Math.PI * 2, r = ARENA + 0.3;
    const type = wave >= 3 && R() < 0.18 ? 2 : wave >= 2 && R() < 0.3 ? 1 : 0;
    makeMob(nextId++, type, Math.cos(a) * r, Math.sin(a) * r);
  }
  function hud() {
    if (wave !== bannerW && wave > 0) { bannerW = wave; setTheme(wave); onHud && onHud({ banner: "Wave " + wave, sub: theme.icon + " " + theme.name }); }
    const h = { buff: me.buff && me.buffT > 0 ? [me.buff, Math.ceil(me.buffT)] : null, shield: me.shield > 0 ? Math.ceil(me.shield) : 0, freeze: freezeT > 0 ? Math.ceil(freezeT) : 0, hp: Math.max(0, Math.round(me.hp)), down: me.down, wave, score: score(), kills, left: mobs.size + toSpawn, team: multi ? players.filter((p) => !p.down).length + "/" + players.length : null, breakT: mobs.size + toSpawn === 0 && breakT > 0 ? Math.ceil(breakT) : 0, help: players.some((p) => p !== me && p.down) };
    const s = JSON.stringify(h); if (s !== lastHud) { lastHud = s; onHud && onHud(h); }
    onButtons && onButtons({ splash: !me.down && splashCd <= 0, cd: Math.max(0, Math.ceil(splashCd)) });
  }

  // ---------- galaw ----------
  function moveMe(dt) {
    if (me.down) { me.moving = false; T.walk(0); return; }
    const i = sc.input ? sc.input() : { x: 0, z: 0 }, mag = Math.min(1, Math.hypot(i.x, i.z));
    if (mag < 0.15) { me.moving = false; T.walk(0); return; }
    // ayon sa camera: taas ng stick = palayo sa camera (pasulong)
    const fx = Math.sin(view.yaw), fz = Math.cos(view.yaw), rx = -fz, rz = fx;
    let mx = rx * i.x - fx * i.z, mz = rz * i.x - fz * i.z; const k = 1 / (Math.hypot(mx, mz) || 1); mx *= k; mz *= k;
    const sp = 3.2 * dt * mag;
    me.x += mx * sp; me.z += mz * sp;
    const d = Math.hypot(me.x, me.z); if (d > ARENA - 0.15) { me.x *= (ARENA - 0.15) / d; me.z *= (ARENA - 0.15) / d; }
    me.h = Math.atan2(mx, mz); me.moving = true; T.walk(mag, me.h);
  }
  let target = null;
  function autoFire(dt) {
    target = null;
    if (me.down) return;
    const near = []; mobs.forEach((m) => { const d = Math.hypot(m.x - me.x, m.z - me.z); if (d < RANGE) near.push([d, m]); });
    near.sort((a, b) => a[0] - b[0]);
    if (!near.length) return;
    target = near[0][1];
    if (!me.moving) { me.h = Math.atan2(target.x - me.x, target.z - me.z); T.face(me.h); }
    me.fireT -= dt; if (me.fireT > 0) return;
    const b = me.buffT > 0 ? me.buff : null;
    me.fireT = b === "rapid" ? 0.13 : 0.32;
    const tg = near.slice(0, b === "triple" ? 3 : 1).map((x) => x[1]);
    tg.forEach((m) => shoot(me, m, b === "big"));
    if (host) tg.forEach((m) => hitMob(m, b === "big" ? 3 : 1, myId)); else net.send("fire", { m: tg.map((m) => m.id) });
  }
  function hitMob(m, dmg, by) { m.hp -= dmg; m.flash = 0.12; if (m.hp <= 0) { killMob(m, by); if (multi) net.send("kill", { m: m.id, by }); } }
  function splash() {
    if (!running || done || me.down || splashCd > 0) return;
    splashCd = 7; voice && voice.sfx("power"); sc.effect("bubbles", { x: me.x, y: 0.3, z: me.z }); sc.effect("sparkle", { x: me.x, y: 0.2, z: me.z });
    if (host) doSplash(me.x, me.z, myId); else net.send("splash", { x: +me.x.toFixed(2), z: +me.z.toFixed(2) });
  }
  function doSplash(x, z, by) { [...mobs.values()].forEach((m) => { if (Math.hypot(m.x - x, m.z - z) < 2.3) hitMob(m, 3, by); }); }

  // ---------- host: Gloomies ----------
  function hostStep(dt) {
    if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0 && mobs.size < MAXM) { spawnOne(); toSpawn--; spawnT = Math.max(0.25, 1.1 - wave * 0.08); } }
    else if (mobs.size === 0) { breakT -= dt; if (breakT <= 0) { breakT = 3; startWave(); } }
    const alive = players.filter((p) => !p.down);
    mobs.forEach((m) => {
      if (!alive.length) return;
      let tgt = alive[0], bd = 1e9; alive.forEach((p) => { const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < bd) { bd = d; tgt = p; } });
      const ty = TYPES[m.type], sp = ty.sp * 1.3 * (1 + wave * 0.04) * (freezeT > 0 ? 0.3 : 1) * dt;
      if (bd > 0.28) { m.x += (tgt.x - m.x) / bd * sp; m.z += (tgt.z - m.z) / bd * sp; }
      m.hitCd -= dt;
      if (bd < 0.34 && m.hitCd <= 0) { m.hitCd = 0.8; hurt(tgt, m.type === 2 ? 14 : 8); }
    });
    if (freezeT > 0) freezeT -= dt;
    players.forEach((p) => { if (p.buffT > 0) { p.buffT -= dt; if (p.buffT <= 0) p.buff = null; } if (p.shield > 0) p.shield -= dt; });
    hearts.forEach((h) => { const p = alive.find((p) => Math.hypot(p.x - h.x, p.z - h.z) < 0.42); if (p) { give(p, h.k); world.remove(h.m); hearts.delete(h.id); if (p.mine) got(h.k); else if (multi) net.send("got", { to: p.id, k: h.k }); } });
    if (alive.length === 0) finish();
  }
  function got(k) { const d = DROPS.find((x) => x[0] === k); voice && voice.sfx(k === "heart" ? "eat" : "power"); sc.effect("sparkle", { x: me.x, y: 0.4, z: me.z }); onHud && onHud({ toast: d[1] + " " + d[2] }); }
  function hurt(p, dmg) {
    if (p.down || p.shield > 0) return;
    p.hp -= dmg; if (p.mine) { voice && voice.sfx("hit"); T.wiggle && T.wiggle(); }
    if (p.hp <= 0) { p.hp = 0; p.down = true; if (p.mine) T.spin(); if (!multi) finish(); }
  }
  function state() {
    const m = []; mobs.forEach((x) => m.push([x.id, +x.x.toFixed(2), +x.z.toFixed(2), x.hp, x.type]));
    const hp = {}; players.forEach((p) => { hp[p.id] = [Math.round(p.hp), p.down ? 1 : 0, p.buffT > 0 ? p.buff : 0, +Math.max(0, p.buffT).toFixed(1), +Math.max(0, p.shield).toFixed(1)]; });
    const hs = []; hearts.forEach((h) => hs.push([h.id, +h.x.toFixed(2), +h.z.toFixed(2), h.k]));
    return { w: wave, m, hp, k: kills, ts: toSpawn, b: +breakT.toFixed(1), hs, fz: +Math.max(0, freezeT).toFixed(1) };
  }

  // ---------- network ----------
  if (net) net.on((ev, d, from) => {
    if (done) return;
    const p = players.find((x) => x.id === from);
    if (ev === "me" && p && !p.mine) { p.tx = d.x; p.tz = d.z; p.h = d.h; p.moving = !!d.mv; p.last = performance.now(); return; }
    if (ev === "fire" && p && !p.mine) { const big = p.buffT > 0 && p.buff === "big"; (Array.isArray(d.m) ? d.m : [d.m]).slice(0, p.buffT > 0 && p.buff === "triple" ? 3 : 1).forEach((id) => { const m = mobs.get(id); if (m) { shoot(p, m, big); if (host) hitMob(m, big ? 3 : 1, from); } }); return; }
    if (ev === "got" && d.to === myId) { got(d.k); return; }
    if (ev === "splash" && p && !p.mine) { sc.effect("bubbles", { x: d.x, y: 0.3, z: d.z }); if (host) doSplash(d.x, d.z, from); return; }
    if (ev === "rev" && host) { const t = players.find((x) => x.id === d.to); if (t && t.down) { t.down = false; t.hp = 50; } return; }
    if (ev === "bye" && p) { p.down = true; p.gone = true; p.hp = 0; if (!p.mine) p.t.group.visible = false; if (d.p === net.roster[0].p && !host) { if (onHud) onHud({ note: "The host left the game." }); finish(); } return; }
    if (!host) {
      if (ev === "st") {
        wave = d.w; kills = d.k; toSpawn = d.ts; breakT = d.b; freezeT = d.fz || 0;
        const seen = new Set();
        d.m.forEach(([id, x, z, hp, type]) => { seen.add(id); let m = mobs.get(id); if (!m) m = makeMob(id, type, x, z); m.tx = x; m.tz = z; if (hp < m.hp) m.flash = 0.12; m.hp = hp; });
        mobs.forEach((m) => { if (!seen.has(m.id)) { mobs.delete(m.id); world.remove(m.g); sc.effect("bubbles", { x: m.x, y: 0.3, z: m.z }); } });
        players.forEach((q) => { const v = d.hp[q.id]; if (!v) return; if (q.mine && v[0] < q.hp && !q.down) { voice && voice.sfx("hit"); } q.hp = v[0]; q.buff = v[2] || null; q.buffT = v[3] || 0; q.shield = v[4] || 0; const wasDown = q.down; q.down = !!v[1]; if (q.mine && q.down && !wasDown) T.spin(); });
        const hseen = new Set(); d.hs.forEach(([id, x, z, k]) => { hseen.add(id); if (!hearts.has(id)) makeHeart(id, x, z, k || "heart"); });
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
      m.body.scale.setScalar(freezeT > 0 ? 0.9 : 1);
      m.parts.forEach((pp) => { pp.material = m.flash > 0 ? hitMat : typeMats[m.type]; });
    });
    hearts.forEach((h) => { h.b.rotation.y = t * 2; h.b.position.y = 0.3 + Math.sin(t * 3 + h.id) * 0.05; });
    aim.visible = !!target && running; if (target) { aim.position.set(target.x, 0.03, target.z); aim.scale.setScalar(TYPES[target.type].s * (1 + Math.sin(t * 8) * 0.08)); }
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
  // Camera sa likod ni Tigo. view.yaw = saan nakatingin (pahalang), view.pitch = taas, view.dist = layo. Hila sa screen = look().
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function cam(camera, dt) {
    const tall = camera.aspect < 0.8, dist = view.dist * (tall ? 1.3 : 1);
    const fx = Math.sin(view.yaw), fz = Math.cos(view.yaw), cp = Math.cos(view.pitch);
    camPos.set(me.x - fx * dist * cp, 0.35 + Math.sin(view.pitch) * dist, me.z - fz * dist * cp);
    camera.position.lerp(camPos, Math.min(1, dt * 8));
    look.set(me.x + fx * 0.9, 0.42, me.z + fz * 0.9); camera.lookAt(look);
  }
  function lookBy(dx, dy) { view.yaw -= dx * 0.0062; view.pitch = Math.max(0.12, Math.min(1.35, view.pitch + dy * 0.0045)); }
  function zoomBy(k) { view.dist = Math.max(2, Math.min(8, view.dist / k)); }
  function finish() {
    if (done) return; done = true; running = false;
    if (net && host) net.send("end", {});
    const res = { score: score(), wave, kills, ms: Math.round(performance.now() - t0), win: wave >= 5,
      label: "🌊 Wave " + wave + " · " + score() + " pts" };
    voice && voice.sfx(wave >= 5 ? "win" : "hit");
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, 900);
  }
  function cleanup() {
    sc.scene.fog = oldFog; sc.scene.background = oldBg; T.group.rotation.x = 0;
    if (props) props.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); if (o.isInstancedMesh) o.dispose(); });
    players.forEach((p) => { if (!p.mine && p.t.dispose) p.t.dispose(); });
    shots.forEach((s) => world.remove(s.b));
    sc.scene.remove(world); sc.endGame();
    own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; t0 = performance.now(); if (host) { breakT = 0; startWave(); } },
    stop() { if (net) net.send("bye", {}); finish(); },
    splash, look: lookBy, zoom: zoomBy,
    _s: { me, mobs, players, hurt: (dmg) => hurt(me, dmg), get wave() { return wave; }, get kills() { return kills; }, view, hearts, drop: (k, x, z) => makeHeart(nextH++, x, z, k), get theme() { return theme; }, nextWave() { [...mobs.values()].forEach((m) => { mobs.delete(m.id); world.remove(m.g); }); toSpawn = 0; breakT = 0; }, get target() { return target; } },   // para sa tests
  };
}
