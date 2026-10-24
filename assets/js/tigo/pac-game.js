/* TigoMeNote · tigo/pac-game.js — "Pac-Tigo": kainin lahat ng tuldok sa maze, iwasan ang mga "Gloomy" (maliliit na ulap ng lungkot)
   import { startPac } from "./pac-game.js"
   const g = startPac(sc, { voice, onHud({ dots, lives, coins }), onEnd({ score, win, dots, eaten }) })   g.go() pagkatapos ng 3-2-1 · g.stop()
   Kontrol: W A S D / arrows / joystick / swipe (pipili ng direksyon sa maze). Mangga 🥭 = matatakot ang Gloomies (6 s), puwede silang habulin.
   Coins = tuldok ÷ 4 + 2 bawat Gloomy + 8 kapag naubos lahat (ang server ang may limit). Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../../vendor/three/RoundedBoxGeometry.js";

const MAP = [
  "###############",
  "#o.....#.....o#",
  "#.##.#.#.#.##.#",
  "#....#...#....#",
  "##.#.##.##.#.##",
  "#..#...G...#..#",
  "#.##.#G#G#.##.#",
  "#....#...#....#",
  "#.##...P...##.#",
  "#...#.###.#...#",
  "#.#.........#.#",
  "#o..##.#.##..o#",
  "###############",
];
const RS = MAP.length, CS = MAP[0].length, C = 0.5;
const X = (c) => (c - (CS - 1) / 2) * C, Z = (r) => (r - (RS - 1) / 2) * C;
const wall = (r, c) => r < 0 || c < 0 || r >= RS || c >= CS || MAP[r][c] === "#";
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function startPac(sc, { voice, onHud, onEnd, seconds = 120 } = {}) {
  const world = new THREE.Group(); sc.scene.add(world);
  const own = [];
  const keep = (x) => { own.push(x); return x; };
  // sahig at pader
  const floor = new THREE.Mesh(keep(new THREE.BoxGeometry(CS * C + 0.3, 0.2, RS * C + 0.3)), keep(new THREE.MeshStandardMaterial({ color: 0x2b2f6b, roughness: 0.9 })));
  floor.position.y = -0.1; floor.receiveShadow = true; world.add(floor);
  const walls = []; for (let r = 0; r < RS; r++) for (let c = 0; c < CS; c++) if (MAP[r][c] === "#") walls.push([r, c]);
  const wm = new THREE.InstancedMesh(keep(new RoundedBoxGeometry(C * 0.96, 0.36, C * 0.96, 3, 0.08)), keep(new THREE.MeshStandardMaterial({ color: 0x8f7dff, roughness: 0.45, emissive: 0x2a1f7a, emissiveIntensity: 0.35 })), walls.length);
  const m4 = new THREE.Matrix4();
  walls.forEach(([r, c], i) => { m4.makeTranslation(X(c), 0.18, Z(r)); wm.setMatrixAt(i, m4); });
  wm.castShadow = wm.receiveShadow = true; world.add(wm);
  // tuldok at mangga
  const dotCells = [], mangoes = [];
  for (let r = 0; r < RS; r++) for (let c = 0; c < CS; c++) { if (MAP[r][c] === ".") dotCells.push([r, c]); }
  const dm = new THREE.InstancedMesh(keep(new THREE.SphereGeometry(0.055, 10, 8)), keep(new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffa000, emissiveIntensity: 0.5 })), dotCells.length);
  const dotAt = new Map();
  dotCells.forEach(([r, c], i) => { m4.makeTranslation(X(c), 0.16, Z(r)); dm.setMatrixAt(i, m4); dotAt.set(r * 100 + c, i); });
  world.add(dm);
  const mangoMat = keep(new THREE.MeshStandardMaterial({ color: 0xffa62b, roughness: 0.4, emissive: 0x7a3a00, emissiveIntensity: 0.4 })), leaf = keep(new THREE.MeshStandardMaterial({ color: 0x4caf50 }));
  const mGeo = keep(new THREE.SphereGeometry(0.12, 16, 12)), lGeo = keep(new THREE.SphereGeometry(0.05, 8, 6));
  for (let r = 0; r < RS; r++) for (let c = 0; c < CS; c++) if (MAP[r][c] === "o") {
    const g = new THREE.Group(); g.position.set(X(c), 0.2, Z(r));
    const b = new THREE.Mesh(mGeo, mangoMat); b.scale.set(0.85, 1, 0.8); b.castShadow = true; g.add(b);
    const l = new THREE.Mesh(lGeo, leaf); l.scale.set(1.4, 0.4, 0.7); l.position.set(0.04, 0.12, 0); g.add(l);
    world.add(g); mangoes.push({ r, c, g });
  }
  let dotsLeft = dotCells.length + mangoes.length;

  // ---------- si Tigo ----------
  const start = (() => { for (let r = 0; r < RS; r++) { const c = MAP[r].indexOf("P"); if (c >= 0) return [r, c]; } })();
  const me = { r: start[0], c: start[1], d: [0, 0], want: [0, 0], prog: 0 };
  sc.beginGame({ tick, cam });
  const T = sc.main; T.group.scale.setScalar(0.3);

  // ---------- Gloomies ----------
  const home = []; for (let r = 0; r < RS; r++) for (let c = 0; c < CS; c++) if (MAP[r][c] === "G") home.push([r, c]);
  const gloomCols = [0x8a7fb8, 0x6f9fd8, 0x9aa3ad];
  const scaredMat = keep(new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x0d47a1, emissiveIntensity: 0.5, roughness: 0.4 }));
  const eyeW = keep(new THREE.MeshStandardMaterial({ color: 0xffffff })), eyeK = keep(new THREE.MeshStandardMaterial({ color: 0x1d1416 }));
  const gb = keep(new THREE.SphereGeometry(0.19, 18, 14)), gp = keep(new THREE.SphereGeometry(0.08, 10, 8)), ge = keep(new THREE.SphereGeometry(0.05, 10, 8)), gk = keep(new THREE.SphereGeometry(0.025, 8, 6));
  const ghosts = home.map(([r, c], i) => {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const mat = keep(new THREE.MeshStandardMaterial({ color: gloomCols[i % 3], roughness: 0.6 }));
    const parts = [[0, 0.26, 0, 1], [-0.13, 0.17, 0.02, 0.75], [0.13, 0.17, 0.02, 0.75], [0, 0.2, -0.1, 0.8]].map(([x, y, z, s]) => { const m = new THREE.Mesh(gb, mat); m.position.set(x, y, z); m.scale.setScalar(s); m.castShadow = true; body.add(m); return m; });
    [-1, 0, 1].forEach((k) => { const m = new THREE.Mesh(gp, mat); m.position.set(k * 0.11, 0.07, 0.06); body.add(m); parts.push(m); });
    [-0.07, 0.07].forEach((x) => { const w = new THREE.Mesh(ge, eyeW); w.position.set(x, 0.29, 0.17); body.add(w); const k = new THREE.Mesh(gk, eyeK); k.position.set(x, 0.28, 0.21); body.add(k); });
    world.add(g);
    return { g, body, mat, parts, r, c, hr: r, hc: c, d: [0, 0], prog: 0, wait: 1.5 + i * 3, scaredT: 0, out: 0, kind: i };
  });

  let lives = 3, score = { dots: 0, eaten: 0 }, left = seconds, freeze = 0, done = false, powerT = 0;
  const coins = () => Math.floor(score.dots / 4) + score.eaten * 2;
  const hud = () => onHud && onHud({ dots: dotsLeft, lives, coins: coins(), time: Math.max(0, Math.ceil(left)), power: powerT > 0 });

  function place(e, obj) {
    const x = X(e.c) + e.d[1] * e.prog * C, z = Z(e.r) + e.d[0] * e.prog * C;
    obj.position.x = x; obj.position.z = z; return { x, z };
  }
  function wantDir() {
    const i = sc.input ? sc.input() : { x: 0, z: 0 };
    if (Math.abs(i.x) < 0.3 && Math.abs(i.z) < 0.3) return null;
    return Math.abs(i.x) > Math.abs(i.z) ? [0, Math.sign(i.x)] : [Math.sign(i.z), 0];
  }
  function eat(r, c) {
    const k = r * 100 + c;
    if (dotAt.has(k)) {
      const i = dotAt.get(k); dotAt.delete(k); m4.makeScale(0, 0, 0); dm.setMatrixAt(i, m4); dm.instanceMatrix.needsUpdate = true;
      dotsLeft--; score.dots++; if (score.dots % 2) voice && voice.sfx("eat");
    }
    const m = mangoes.find((x) => x.r === r && x.c === c && x.g.visible);
    if (m) { m.g.visible = false; dotsLeft--; score.dots += 2; powerT = 6; ghosts.forEach((g) => { if (g.out) g.scaredT = 6; }); voice && voice.sfx("power"); sc.effect("sparkle", { x: X(c), y: 0.3, z: Z(r) }); }
    if (dotsLeft <= 0) finish(true);
  }
  function stepMe(dt) {
    const w = wantDir(); if (w) me.want = w;
    if (me.d[0] || me.d[1]) {
      // pabalik agad kapag kabaligtaran ang pinili
      if (me.want[0] === -me.d[0] && me.want[1] === -me.d[1] && me.prog > 0) { me.r += me.d[0]; me.c += me.d[1]; me.d = me.want; me.prog = 1 - me.prog; }
      me.prog += 3.6 * dt;
      while (me.prog >= 1) {
        me.r += me.d[0]; me.c += me.d[1]; me.prog -= 1; eat(me.r, me.c);
        if ((me.want[0] || me.want[1]) && !wall(me.r + me.want[0], me.c + me.want[1])) me.d = me.want;
        else if (wall(me.r + me.d[0], me.c + me.d[1])) { me.d = [0, 0]; me.prog = 0; break; }
      }
    } else if ((me.want[0] || me.want[1]) && !wall(me.r + me.want[0], me.c + me.want[1])) me.d = me.want;
    place(me, T.group);
    const moving = !!(me.d[0] || me.d[1]);
    T.walk(moving ? 1 : 0, moving ? Math.atan2(me.d[1], me.d[0]) : undefined);
  }
  function chooseGhost(g) {
    const opts = DIRS.filter(([dr, dc]) => !wall(g.r + dr, g.c + dc) && !(dr === -g.d[0] && dc === -g.d[1]));
    const all = opts.length ? opts : DIRS.filter(([dr, dc]) => !wall(g.r + dr, g.c + dc));
    if (!all.length) return [0, 0];
    let tr = me.r, tc = me.c;
    if (g.kind === 1) { tr += me.d[0] * 3; tc += me.d[1] * 3; }
    const rand = g.kind === 2 ? 0.5 : 0.2;
    if (Math.random() < rand && !g.scaredT) return all[(Math.random() * all.length) | 0];
    const dist = ([dr, dc]) => Math.hypot(g.r + dr - tr, g.c + dc - tc);
    return all.slice().sort((a, b) => (g.scaredT ? dist(b) - dist(a) : dist(a) - dist(b)))[0];
  }
  function stepGhost(g, dt, t) {
    if (g.wait > 0) { g.wait -= dt; g.body.position.y = Math.abs(Math.sin(t * 4 + g.kind)) * 0.06; place(g, g.g); return; }
    if (!g.out) { g.out = 1; g.d = chooseGhost(g); }
    if (g.scaredT > 0) g.scaredT = Math.max(0, g.scaredT - dt);
    const sp = g.scaredT ? 1.7 : 2.5 + Math.min(0.8, (seconds - left) / 90);
    g.prog += sp * dt;
    while (g.prog >= 1) { g.r += g.d[0]; g.c += g.d[1]; g.prog -= 1; g.d = chooseGhost(g); if (!g.d[0] && !g.d[1]) { g.prog = 0; break; } }
    if (!g.d[0] && !g.d[1]) g.d = chooseGhost(g);
    place(g, g.g);
    g.g.rotation.y = Math.atan2(g.d[1], g.d[0]);
    g.body.position.y = 0.04 + Math.sin(t * 5 + g.kind) * 0.04;
    const flash = g.scaredT > 0 && (g.scaredT > 1.5 || Math.sin(t * 20) > 0);
    g.parts.forEach((p) => { p.material = flash ? scaredMat : g.mat; });
  }
  function caught() {
    lives--; voice && voice.sfx("hit"); T.spin(); freeze = 1.4;
    if (lives <= 0) { setTimeout(() => finish(false), 900); return; }
    setTimeout(() => {
      me.r = start[0]; me.c = start[1]; me.d = [0, 0]; me.want = [0, 0]; me.prog = 0;
      ghosts.forEach((g, i) => { g.r = g.hr; g.c = g.hc; g.d = [0, 0]; g.prog = 0; g.out = 0; g.wait = 1 + i * 1.5; g.scaredT = 0; });
    }, 900);
  }
  let running = false;
  function tick(dt, t) {
    if (done) return;
    if (!running) { T.walk(0); return; }
    if (freeze > 0) { freeze -= dt; T.walk(0); hud(); return; }
    left -= dt; if (powerT > 0) powerT = Math.max(0, powerT - dt);
    stepMe(dt);
    ghosts.forEach((g) => stepGhost(g, dt, t));
    mangoes.forEach((m, i) => { m.g.rotation.y = t * 2 + i; m.g.position.y = 0.2 + Math.sin(t * 3 + i) * 0.04; });
    for (const g of ghosts) {
      if (!g.out) continue;
      if (Math.hypot(g.g.position.x - T.group.position.x, g.g.position.z - T.group.position.z) < C * 0.7) {
        if (g.scaredT > 0) {
          score.eaten++; voice && voice.sfx("pop"); sc.effect("stars", { x: g.g.position.x, y: 0.4, z: g.g.position.z });
          g.r = g.hr; g.c = g.hc; g.d = [0, 0]; g.prog = 0; g.out = 0; g.wait = 3; g.scaredT = 0;
        } else { caught(); break; }
      }
    }
    if (left <= 0) finish(dotsLeft <= 0);
    hud();
  }
  const camPos = new THREE.Vector3();
  function cam(camera, dt) {
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(4.3 / half, 4.6 / (half * camera.aspect)) * (camera.aspect < 0.8 ? 1.12 : 1);
    camPos.set(0, d * 0.9, d * 0.42);
    camera.position.lerp(camPos, Math.min(1, dt * 4)); camera.lookAt(0, 0, camera.aspect < 0.8 ? 1.3 : 0.15); // patayo: itaas ang maze para hindi matakpan ng joystick
  }
  function finish(win) {
    if (done) return; done = true;
    if (win) { voice && voice.sfx("win"); T.move("cheer", 2); sc.effect("stars"); }
    const res = { score: coins() + (win ? 8 : 0), win, dots: score.dots, eaten: score.eaten };
    setTimeout(() => { cleanup(); onEnd && onEnd(res); }, win ? 1400 : 600);
  }
  function cleanup() {
    sc.scene.remove(world); sc.endGame();
    own.forEach((x) => x.dispose && x.dispose()); ghosts.forEach((g) => g.mat.dispose()); wm.dispose(); dm.dispose();
  }
  hud();
  return { go() { running = true; }, stop() { finish(false); } };
}
