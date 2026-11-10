/* TigoMeNote · tigo/ghost-game.js — "Lights Out": tumakas sa madilim na paaralan bago ka mahuli ng "the Hush"
   import { startGhost, MAP_INFO } from "./ghost-game.js"
   const g = startGhost(sc, { voice, mode: "solo"|"duo", role: "host"|"guest", seed, net, me:{name,color}, partner:{name,color},
                              onHud(h), onButtons(b), onEnd({ score, win, keys, ms, label }) })
     g.go() pagkatapos ng 3-2-1 · g.stop() · g.hide() · g.flash()
   Laro: kunin ang lahat ng 🔑 (solo 3, duo 4), saka pumunta sa EXIT. Ang multo ay gumagala; kapag nakita ka, hahabulin ka.
     🚪 Hide sa tabi ng locker (hanggang 8 s) · 🔦 Flash (3 beses) = matitigilan ang multo nang 2.5 s · 5 minuto lang.
     Solo: 2 buhay. Duo: kapag nahuli, babagsak ka — tumayo sa tabi ng kasama nang 2 s para buhayin siya. Pareho = talo.
   Duo (online): ang host ang may hawak ng multo at ng mga susi; bawat isa ay nagpapadala ng sariling puwesto (10 beses bawat segundo)
     sa net.send(event, data) / net.on(fn(event, data)) (TMN_RT broadcast). Mga event: me, st, take, flash, down, rev, end, bye.
   Sariling disenyo ang lahat (paaralan, multo, susi). Walang kinopyang character. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";
import { createTigo } from "./pet-model.js";

// # pader · . sahig · L locker (taguan) · D mesa · k puwesto ng susi · P ikaw · p kasama · G multo · E labasan
const MAP = [
  "###################",
  "#P...L#k..D.#L...k#",
  "#.p...............#",
  "#.D...#.L...#...D.#",
  "###.###.##.##.##.##",
  "#................L#",
  "#L.......G........E",
  "#.................#",
  "###.###.##.##.##.##",
  "#k...L#..D..#L...k#",
  "#.................#",
  "#.D...#L..k.#..D..#",
  "###################",
];
const RS = MAP.length, CS = MAP[0].length, C = 0.6;
const X = (c) => (c - (CS - 1) / 2) * C, Z = (r) => (r - (RS - 1) / 2) * C;
const cellAt = (x, z) => [Math.round(z / C + (RS - 1) / 2), Math.round(x / C + (CS - 1) / 2)];
const ch = (r, c) => (r < 0 || c < 0 || r >= RS || c >= CS ? "#" : MAP[r][c]);
const solid = (r, c) => { const k = ch(r, c); return k === "#" || k === "D"; };
const find = (k) => { const out = []; MAP.forEach((row, r) => [...row].forEach((x, c) => { if (x === k) out.push([r, c]); })); return out; };
export const MAP_INFO = { rows: RS, cols: CS, map: MAP };

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
// pinakamaikling daan (BFS) sa grid → susunod na cell papunta sa target
function nextStep(from, to) {
  if (from[0] === to[0] && from[1] === to[1]) return to;
  const seen = new Map(), q = [from], key = (p) => p[0] * 100 + p[1];
  seen.set(key(from), null);
  while (q.length) {
    const p = q.shift();
    if (p[0] === to[0] && p[1] === to[1]) {
      let cur = p, prev = seen.get(key(cur));
      while (prev && !(prev[0] === from[0] && prev[1] === from[1])) { cur = prev; prev = seen.get(key(cur)); }
      return cur;
    }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [p[0] + dr, p[1] + dc];
      if (solid(n[0], n[1]) || ch(n[0], n[1]) === "E" && !(n[0] === to[0] && n[1] === to[1]) || seen.has(key(n))) continue;
      seen.set(key(n), p); q.push(n);
    }
  }
  return from;
}
// nakikita ba ang (bx,bz) mula sa (ax,az)? (pader lang ang humaharang; ang mesa ay hindi)
function sees(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (C * 0.25));
  for (let i = 1; i < n; i++) { const [r, c] = cellAt(ax + (bx - ax) * i / n, az + (bz - az) * i / n); if (ch(r, c) === "#") return false; }
  return true;
}

export function startGhost(sc, { voice, mode = "solo", role = "host", seed = 1, net = null, me: meInfo = {}, partner: pInfo = null, onHud, onButtons, onEnd } = {}) {
  const duo = mode === "duo" && !!net, host = !duo || role === "host";
  const R = rng(seed);
  const world = new THREE.Group(); sc.scene.add(world);
  const own = []; const keep = (x) => { own.push(x); return x; };
  const M = (o) => keep(new THREE.MeshStandardMaterial(o));

  // ---------- dilim ----------
  const saved = [];
  sc.scene.traverse((o) => { if (o.isLight && !world.children.includes(o)) { saved.push([o, o.intensity]); o.intensity *= 0.06; } });
  const oldFog = sc.scene.fog; sc.scene.fog = new THREE.Fog(0x070912, 4.5, 12);
  const amb = new THREE.AmbientLight(0x6273a8, 1.15); world.add(amb);
  const moon = new THREE.DirectionalLight(0x8ea2e6, 0.7); moon.position.set(-3, 6, 2); world.add(moon);

  // ---------- paaralan ----------
  const floor = new THREE.Mesh(keep(new THREE.BoxGeometry(CS * C, 0.2, RS * C)), M({ color: 0x262c3d, roughness: 0.9 }));
  floor.position.y = -0.1; floor.receiveShadow = true; world.add(floor);
  const tiles = new THREE.GridHelper(Math.max(CS, RS) * C, Math.max(CS, RS), 0x2a3042, 0x2a3042); tiles.position.y = 0.002; tiles.material.transparent = true; tiles.material.opacity = 0.5; world.add(tiles); own.push(tiles.geometry, tiles.material);
  const walls = find("#"), m4 = new THREE.Matrix4();
  const wm = new THREE.InstancedMesh(keep(new RoundedBoxGeometry(C, 0.72, C, 2, 0.04)), M({ color: 0x4a5573, roughness: 0.75 }), walls.length);
  walls.forEach(([r, c], i) => { m4.makeTranslation(X(c), 0.36, Z(r)); wm.setMatrixAt(i, m4); });
  world.add(wm); own.push(wm);
  const desks = find("D"), dm = new THREE.InstancedMesh(keep(new RoundedBoxGeometry(C * 0.8, 0.32, C * 0.55, 2, 0.03)), M({ color: 0x6b4c34, roughness: 0.7 }), desks.length);
  desks.forEach(([r, c], i) => { m4.makeTranslation(X(c), 0.16, Z(r)); dm.setMatrixAt(i, m4); });
  world.add(dm); own.push(dm);
  // locker: nakadikit sa pinakamalapit na pader
  const lockers = find("L").map(([r, c]) => {
    const g = new THREE.Group(); g.position.set(X(c), 0, Z(r));
    const side = [[-1, 0], [1, 0], [0, -1], [0, 1]].find(([dr, dc]) => ch(r + dr, c + dc) === "#") || [-1, 0];
    const box = new THREE.Mesh(keep(new RoundedBoxGeometry(C * 0.7, 0.8, C * 0.32, 2, 0.03)), M({ color: 0x3c6e91, roughness: 0.5, metalness: 0.3 }));
    box.position.set(side[1] * C * 0.3, 0.4, side[0] * C * 0.3); box.rotation.y = side[0] ? 0 : Math.PI / 2; g.add(box);
    for (let i = 0; i < 3; i++) { const sl = new THREE.Mesh(keep(new THREE.BoxGeometry(C * 0.4, 0.015, 0.01)), M({ color: 0x14212c })); sl.position.set(0, 0.55 + i * 0.05, C * 0.165); box.add(sl); }
    world.add(g);
    return { r, c, g, box };
  });
  // labasan
  const exitCell = find("E")[0];
  const door = new THREE.Group(); door.position.set(X(exitCell[1]), 0, Z(exitCell[0])); world.add(door);
  const leaf = new THREE.Mesh(keep(new THREE.BoxGeometry(0.08, 0.85, C * 0.85)), M({ color: 0x5a3e2a, roughness: 0.6 })); leaf.position.y = 0.43; door.add(leaf);
  const signMat = M({ color: 0xff3344, emissive: 0xff2233, emissiveIntensity: 1.6 });
  const sign = new THREE.Mesh(keep(new THREE.BoxGeometry(0.06, 0.1, 0.3)), signMat); sign.position.set(-0.06, 0.95, 0); door.add(sign);
  const signLight = new THREE.PointLight(0xff3344, 0.8, 1.6); signLight.position.set(-0.3, 0.9, 0); door.add(signLight);

  // ---------- mga susi ----------
  const spots = find("k").sort(() => R() - 0.5), need = duo ? 4 : 3;
  const keyMat = M({ color: 0xffcc33, emissive: 0xffa800, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 });
  const keys = spots.slice(0, need).map(([r, c], i) => {
    const g = new THREE.Group(); g.position.set(X(c), 0.32, Z(r));
    const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.06, 0.018, 8, 18)), keyMat); ring.position.x = -0.09; g.add(ring);
    const bar = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8)), keyMat); bar.rotation.z = Math.PI / 2; bar.position.x = 0.03; g.add(bar);
    [0.07, 0.1].forEach((x) => { const t = new THREE.Mesh(keep(new THREE.BoxGeometry(0.018, 0.04, 0.014)), keyMat); t.position.set(x, -0.025, 0); g.add(t); });
    const glow = new THREE.PointLight(0xffc04d, 0.7, 1.1); g.add(glow);
    world.add(g);
    return { i, r, c, g, taken: false };
  });

  // ---------- mga manlalaro ----------
  const TS = 0.3;
  sc.beginGame({ tick, cam });
  const T = sc.main; T.group.scale.setScalar(TS);
  const startP = find("P")[0], startQ = find("p")[0];
  const mine = host ? startP : startQ, theirs = host ? startQ : startP;
  const me = { x: X(mine[1]), z: Z(mine[0]), h: 0, hid: false, hidT: 0, down: false, lives: duo ? 1 : 2, moving: false };
  const lamp = new THREE.PointLight(0xffe2b0, 5, 4.2, 1.3); world.add(lamp);   // sumusunod kay Tigo (hindi anak ng Tigo para hindi lumiit)
  T.group.position.set(me.x, 0, me.z); lamp.position.set(me.x, 0.85, me.z + 0.3);
  let mate = null;
  if (duo) {
    const t2 = createTigo({ color: (pInfo && pInfo.color) || "sky" }); t2.group.scale.setScalar(TS); world.add(t2.group);
    const l2 = new THREE.PointLight(0xffe2b0, 3.5, 3.4, 1.3); world.add(l2);
    mate = { t: t2, l: l2, x: X(theirs[1]), z: Z(theirs[0]), tx: X(theirs[1]), tz: Z(theirs[0]), h: 0, hid: false, down: false, moving: false, seen: 0 };
    t2.group.position.set(mate.x, 0, mate.z);
  }

  // ---------- si "the Hush" (sariling disenyo: maskarang porselana at balabal na usok) ----------
  const hush = new THREE.Group(), hb = new THREE.Group(); hush.add(hb);
  const cloakM = M({ color: 0x1c1633, roughness: 1, emissive: 0x150b33, emissiveIntensity: 0.6, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
  const c1 = new THREE.Mesh(keep(new THREE.ConeGeometry(0.2, 0.62, 20, 1, true)), cloakM); c1.position.y = 0.36; hb.add(c1);
  const c2 = new THREE.Mesh(keep(new THREE.ConeGeometry(0.26, 0.42, 9, 1, true)), cloakM); c2.position.y = 0.18; c2.rotation.y = 0.4; hb.add(c2);
  const hood = new THREE.Mesh(keep(new THREE.SphereGeometry(0.13, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62)), cloakM); hood.position.y = 0.66; hb.add(hood);
  const mask = new THREE.Mesh(keep(new THREE.SphereGeometry(0.1, 20, 16)), M({ color: 0xeae6f2, roughness: 0.35 })); mask.scale.set(0.82, 1, 0.45); mask.position.set(0, 0.63, 0.085); hb.add(mask);
  const eyeM = M({ color: 0x9ffff0, emissive: 0x3dffe0, emissiveIntensity: 4 });
  [-0.034, 0.034].forEach((x) => { const e = new THREE.Mesh(keep(new THREE.SphereGeometry(0.017, 10, 8)), eyeM); e.scale.set(1, 0.6, 0.6); e.position.set(x, 0.65, 0.13); hb.add(e); });
  const sleeves = [-1, 1].map((k) => { const s = new THREE.Mesh(keep(new THREE.ConeGeometry(0.045, 0.32, 8, 1, true)), cloakM); s.position.set(k * 0.17, 0.4, 0.04); s.rotation.z = k * 0.5; hb.add(s); return s; });
  const aura = new THREE.PointLight(0x3dffe0, 2, 2.2, 1.6); aura.position.y = 0.6; hush.add(aura);
  const gStart = find("G")[0];
  const ghost = { x: X(gStart[1]), z: Z(gStart[0]), state: "wait", wait: 4, stun: 0, target: null, lastSeen: null, searchT: 0, path: 0, h: 0 };
  hush.position.set(ghost.x, 0, ghost.z); world.add(hush);
  const hushScale = 1.25; hush.scale.setScalar(hushScale);

  // ---------- estado ----------
  let running = false, done = false, t0 = 0, left = 300, flashes = 3, freeze = 0, reviveT = 0, sendT = 0, beat = 0, lastHud = "";
  const taken = () => keys.filter((k) => k.taken).length;
  const nearLocker = () => lockers.find((l) => Math.hypot(X(l.c) - me.x, Z(l.r) - me.z) < C * 0.75);
  const ent = (who) => who === "me" ? me : mate;

  function hud() {
    const h = { keys: taken(), need, time: Math.max(0, Math.ceil(left)), flashes, lives: me.lives, hidden: me.hid ? Math.max(0, Math.ceil(8 - me.hidT)) : 0,
      down: me.down, mateDown: !!(mate && mate.down), duo, exitOpen: taken() >= need, chase: ghost.state === "chase" };
    const s = JSON.stringify(h); if (s !== lastHud) { lastHud = s; onHud && onHud(h); }
    onButtons && onButtons({ hide: !me.down && (me.hid || !!nearLocker()), hidden: me.hid, flash: !me.down && !me.hid && flashes > 0 });
  }

  // ---------- galaw ----------
  function free(x, z) {
    const r = 0.17;
    for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) { const [cr, cc] = cellAt(x + ox, z + oz); if (solid(cr, cc) || (ch(cr, cc) === "E" && taken() < need)) return false; }
    return true;
  }
  function moveMe(dt) {
    if (me.hid || me.down) { T.walk(0); me.moving = false; return; }
    const i = sc.input ? sc.input() : { x: 0, z: 0 };
    const mag = Math.min(1, Math.hypot(i.x, i.z));
    if (mag < 0.15) { T.walk(0); me.moving = false; return; }
    const sp = 2.4 * C * dt * mag, dx = i.x / (Math.hypot(i.x, i.z) || 1) * sp, dz = i.z / (Math.hypot(i.x, i.z) || 1) * sp;
    if (free(me.x + dx, me.z)) me.x += dx;
    if (free(me.x, me.z + dz)) me.z += dz;
    me.h = Math.atan2(dx, dz); me.moving = true;
    T.walk(mag, me.h);
  }
  function pickKeys(x, z, who) {
    keys.forEach((k) => {
      if (k.taken || Math.hypot(k.g.position.x - x, k.g.position.z - z) > C * 0.55) return;
      if (host) takeKey(k.i, who);
      else if (who === "me" && !k.asked) { k.asked = true; net.send("take", { k: k.i, x: +x.toFixed(3), z: +z.toFixed(3) }); setTimeout(() => { k.asked = false; }, 1500); }
    });
  }
  function takeKey(i, who) {
    const k = keys[i]; if (!k || k.taken) return;
    k.taken = true; k.g.visible = false; voice && voice.sfx("coin"); sc.effect("sparkle", { x: k.g.position.x, y: 0.3, z: k.g.position.z });
    if (taken() >= need) { signMat.color.set(0x33ff88); signMat.emissive.set(0x22ff77); signLight.color.set(0x33ff88); leaf.position.z = C * 0.42; leaf.rotation.y = 1.2; voice && voice.sfx("level"); }
    if (host && duo) net.send("st", state());
  }

  // ---------- multo (host lang) ----------
  function targets() {
    const list = [];
    if (!me.hid && !me.down) list.push({ who: "me", x: me.x, z: me.z });
    if (mate && !mate.hid && !mate.down) list.push({ who: "mate", x: mate.x, z: mate.z });
    return list;
  }
  function stepGhost(dt) {
    if (ghost.state === "wait") { ghost.wait -= dt; if (ghost.wait <= 0) ghost.state = "wander"; return; }
    if (ghost.stun > 0) { ghost.stun -= dt; return; }
    const gc = cellAt(ghost.x, ghost.z);
    // makikita ba ang isa sa mga manlalaro?
    let seen = null, best = 1e9;
    for (const p of targets()) {
      const d = Math.hypot(p.x - ghost.x, p.z - ghost.z);
      if ((d < 6 * C && sees(ghost.x, ghost.z, p.x, p.z)) || d < 1.6 * C) { if (d < best) { best = d; seen = p; } }
    }
    if (seen) { if (ghost.state !== "chase") voice && voice.sfx("power"); ghost.state = "chase"; ghost.lastSeen = cellAt(seen.x, seen.z); ghost.searchT = 4; }
    else if (ghost.state === "chase") ghost.state = "search";
    if (ghost.state === "search") { ghost.searchT -= dt; if (ghost.searchT <= 0) { ghost.state = "wander"; ghost.target = null; } }
    let goal = ghost.state === "wander" ? ghost.target : ghost.lastSeen;
    if (ghost.state === "wander" && (!goal || (gc[0] === goal[0] && gc[1] === goal[1]))) {
      const floors = []; MAP.forEach((row, r) => [...row].forEach((x, c) => { if (x !== "#" && x !== "D" && x !== "E") floors.push([r, c]); }));
      goal = ghost.target = floors[(R() * floors.length) | 0];
    }
    if (!goal) return;
    const nx = nextStep(gc, goal), tx = X(nx[1]), tz = Z(nx[0]);
    const sp = (ghost.state === "chase" ? 2.1 + 0.12 * taken() : ghost.state === "search" ? 1.8 : 1.35) * C * dt;
    const dx = tx - ghost.x, dz = tz - ghost.z, d = Math.hypot(dx, dz);
    if (d > 0.001) { const k = Math.min(1, sp / d); ghost.x += dx * k; ghost.z += dz * k; ghost.h = Math.atan2(dx, dz); }
    if (ghost.state === "search" && d < 0.05 && nx[0] === goal[0] && nx[1] === goal[1]) ghost.searchT = Math.min(ghost.searchT, 1);
    // nahuli?
    for (const p of [{ who: "me", e: me }, mate ? { who: "mate", e: mate } : null]) {
      if (!p || p.e.down) continue;
      const hiddenOk = p.e.hid && Math.hypot(p.e.x - ghost.x, p.e.z - ghost.z) > C * 0.3;
      if (hiddenOk) continue;
      if (Math.hypot(p.e.x - ghost.x, p.e.z - ghost.z) < C * 0.5) { caught(p.who); break; }
    }
  }
  function caught(who) {
    const e = ent(who); if (!e || e.down) return;
    if (duo) {
      e.down = true; e.hid = false;
      if (who === "me") { voice && voice.sfx("hit"); T.spin(); }
      net.send("down", { who: who === "me" ? "host" : "guest" });
      if (me.down && mate.down) return finish(false);
    } else {
      me.lives--; voice && voice.sfx("hit"); T.spin(); freeze = 1.4;
      if (me.lives <= 0) { setTimeout(() => finish(false), 900); return; }
      setTimeout(() => { me.x = X(startP[1]); me.z = Z(startP[0]); me.hid = false; }, 900);
    }
    // aalis ang multo sandali para may pagkakataon
    ghost.state = "wait"; ghost.wait = 3; ghost.x = X(gStart[1]); ghost.z = Z(gStart[0]);
  }
  function state() { return { g: [+ghost.x.toFixed(3), +ghost.z.toFixed(3), +ghost.h.toFixed(2), ghost.stun > 0 ? 1 : 0, ghost.state === "chase" ? 1 : 0], k: keys.map((k) => (k.taken ? 1 : 0)), left: Math.round(left), d: [me.down ? 1 : 0, mate && mate.down ? 1 : 0] }; }

  // ---------- network ----------
  if (net) net.on((ev, d) => {
    if (done) return;
    if (ev === "me" && mate) { mate.tx = d.x; mate.tz = d.z; mate.h = d.h; mate.hid = !!d.hid; mate.moving = !!d.m; mate.seen = performance.now(); return; }
    if (ev === "bye") { onHud && onHud({ note: "Your partner left the game." }); if (mate) { mate.down = true; mate.t.group.visible = false; } if (me.down) finish(false); return; }
    if (host) {
      if (ev === "take") {   // ang puwesto sa "take" mismo (baka mauna ito sa "me"), pero hindi malayo sa huling alam na puwesto
        const k = keys[d.k], x = Number(d.x), z = Number(d.z);
        if (k && !k.taken && mate && Math.hypot(k.g.position.x - x, k.g.position.z - z) < C * 0.8 && Math.hypot(x - mate.tx, z - mate.tz) < C * 3) { mate.tx = x; mate.tz = z; takeKey(d.k, "mate"); }
      }
      if (ev === "flash" && mate) doFlash(mate.tx, mate.tz);
      if (ev === "rev" && d.who === "host" && me.down) { me.down = false; voice && voice.sfx("pop"); }
      if (ev === "rev" && d.who === "guest" && mate) mate.down = false;
      if (ev === "win") finish(true);
    } else {
      if (ev === "st") {
        ghost.x = d.g[0]; ghost.z = d.g[1]; ghost.h = d.g[2]; ghost.stun = d.g[3] ? 0.2 : 0; ghost.state = d.g[4] ? "chase" : "wander";
        d.k.forEach((v, i) => { if (v && !keys[i].taken) takeKey(i, "x"); });
        left = d.left; me.down = !!d.d[1]; if (mate) mate.down = !!d.d[0];
      }
      if (ev === "down" && d.who === "guest" && !me.down) { me.down = true; me.hid = false; voice && voice.sfx("hit"); T.spin(); }
      if (ev === "end") finish(!!d.win, true);
    }
  });

  function doFlash(x, z) {
    sc.effect("sparkle", { x, y: 0.5, z });
    if (Math.hypot(ghost.x - x, ghost.z - z) < 4 * C && sees(x, z, ghost.x, ghost.z)) { ghost.stun = 2.5; voice && voice.sfx("pop"); if (ghost.state === "chase") ghost.state = "search"; }
  }
  function hide() {
    if (!running || done || me.down) return;
    if (me.hid) { me.hid = false; T.group.visible = true; return; }
    const l = nearLocker(); if (!l) return;
    me.hid = true; me.hidT = 0; me.x = X(l.c); me.z = Z(l.r); T.group.visible = false; voice && voice.sfx("pop");
    l.box.position.y = 0.38; setTimeout(() => { l.box.position.y = 0.4; }, 160);
  }
  function flash() {
    if (!running || done || me.down || me.hid || flashes <= 0) return;
    flashes--; lamp.intensity = 16; setTimeout(() => { lamp.intensity = 5; }, 220); voice && voice.sfx("power");
    if (host) doFlash(me.x, me.z); else { sc.effect("sparkle", { x: me.x, y: 0.5, z: me.z }); net.send("flash", {}); }
  }

  // ---------- bawat frame ----------
  function tick(dt, t) {
    if (done) return;
    // animasyon ng susi at multo (kahit hindi pa nagsisimula)
    keys.forEach((k, i) => { if (!k.taken) { k.g.rotation.y = t * 2 + i; k.g.position.y = 0.32 + Math.sin(t * 3 + i) * 0.04; } });
    hb.position.y = 0.06 + Math.sin(t * 2.2) * 0.05; c2.rotation.y = 0.4 + Math.sin(t * 1.3) * 0.25; sleeves.forEach((s, k) => { s.rotation.x = Math.sin(t * 2 + k) * 0.25; });
    cloakM.opacity = ghost.stun > 0 ? 0.45 + Math.sin(t * 30) * 0.2 : 0.94; aura.intensity = ghost.state === "chase" ? 3.2 : 2;
    if (!running) { T.walk(0); hud(); return; }
    if (freeze > 0) { freeze -= dt; T.walk(0); hud(); return; }
    left -= host ? dt : 0;
    moveMe(dt);
    if (me.hid) { me.hidT += dt; if (me.hidT >= 8) { me.hid = false; T.group.visible = true; } }
    T.group.position.set(me.x, 0, me.z); lamp.position.set(me.x, 0.85, me.z + 0.3);
    if (!me.down) pickKeys(me.x, me.z, "me");
    T.group.rotation.x = me.down ? -1.2 : 0;
    // kasama
    if (mate) {
      mate.x += (mate.tx - mate.x) * Math.min(1, dt * 10); mate.z += (mate.tz - mate.z) * Math.min(1, dt * 10);
      mate.t.group.position.set(mate.x, 0, mate.z); mate.l.position.set(mate.x, 0.8, mate.z + 0.25); mate.t.group.visible = !mate.hid; mate.t.group.rotation.x = mate.down ? -1.2 : 0;
      mate.t.walk(mate.moving && !mate.down ? 1 : 0, mate.h); mate.t.update(dt, t);
      // buhayin ang kasama: tumayo sa tabi niya nang 2 s
      if (mate.down && !me.down && Math.hypot(mate.x - me.x, mate.z - me.z) < C * 0.9) {
        if (!reviveT) reviveT = performance.now();   // totoong 2 segundo (hindi bumabagal sa mabagal na phone)
        if (performance.now() - reviveT >= 2000) { reviveT = 0; mate.down = false; voice && voice.sfx("pop"); sc.effect("hearts", { x: mate.x, y: 0.4, z: mate.z }); net.send("rev", { who: host ? "guest" : "host" }); }
      } else reviveT = 0;
      if (host && performance.now() - mate.seen > 15000 && mate.seen) { onHud && onHud({ note: "Lost connection with your partner." }); mate.seen = 0; }
    }
    if (host) stepGhost(dt);
    hush.position.set(ghost.x, 0, ghost.z); hush.rotation.y = ghost.h;
    // labasan
    if (taken() >= need && !me.down && Math.hypot(me.x - X(exitCell[1]), me.z - Z(exitCell[0])) < C * 0.7) { if (host) finish(true); else net.send("win", {}); }
    // tibok ng puso kapag malapit ang multo
    const near = Math.hypot(ghost.x - me.x, ghost.z - me.z);
    beat -= dt; if (near < 3 * C && beat <= 0) { voice && voice.sfx("tick"); beat = 0.35 + near / C * 0.18; }
    // padala bawat 0.1 s
    sendT -= dt;
    if (net && sendT <= 0) { sendT = 0.1; net.send("me", { x: +me.x.toFixed(3), z: +me.z.toFixed(3), h: +me.h.toFixed(2), hid: me.hid ? 1 : 0, m: me.moving ? 1 : 0 }); if (host) net.send("st", state()); }
    if (host && left <= 0) finish(false);
    hud();
  }
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function cam(camera, dt) {
    const tall = camera.aspect < 0.8, k = tall ? 1.45 : 1.05;
    camPos.set(me.x, 5.2 * k, me.z + 3.9 * k);
    camera.position.lerp(camPos, Math.min(1, dt * 5));
    look.set(me.x, 0, me.z + (tall ? 0.9 : 0.2));
    camera.lookAt(look);
  }
  function finish(win, fromNet) {
    if (done) return; done = true; running = false;
    if (net && host && !fromNet) net.send("end", { win: win ? 1 : 0 });
    const ms = Math.round(performance.now() - t0), k = taken();
    if (win) { voice && voice.sfx("win"); T.group.visible = true; T.move("cheer", 2); sc.effect("stars"); }
    const score = k * 3 + (win ? 10 + Math.max(0, Math.round((300000 - ms) / 30000)) : 0);
    const res = { score, win, keys: k, need, ms, label: win ? "🎉 Escaped! " + Math.floor(ms / 60000) + ":" + String(Math.floor(ms / 1000) % 60).padStart(2, "0") : "👻 Caught! 🔑 " + k + "/" + need };
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, win ? 1500 : 900);
  }
  function cleanup() {
    saved.forEach(([o, v]) => { o.intensity = v; }); sc.scene.fog = oldFog;
    T.group.visible = true; T.group.rotation.x = 0;
    if (mate) { mate.t.dispose && mate.t.dispose(); }
    sc.scene.remove(world); sc.endGame();
    own.forEach((x) => x.dispose && x.dispose());
  }
  hud();
  return {
    go() { running = true; t0 = performance.now(); },
    stop() { if (net) net.send("bye", {}); finish(false, true); },
    hide, flash,
    _s: { me, keys, ghost, need, exit: [X(exitCell[1]), Z(exitCell[0])], lockers: lockers.map((l) => [X(l.c), Z(l.r)]), mate: () => mate },   // para sa tests
  };
}
