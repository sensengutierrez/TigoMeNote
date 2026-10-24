/* TigoMeNote · tigo/pet-scene.js — 3D na mundo ni Tigo (three.js, WebGL)
   import { createScene } from "./pet-scene.js"
   const sc = createScene(canvas, { pet, reduced, backdrop })
     sc.main                     → ang sariling Tigo (pet-model.js)
     sc.setInput(fn)             → fn() = { x, z } (-1..1) galing sa controls.js; nilalakad si Tigo
     sc.jump()                   → talon
     sc.setBackdrop(id)          → palit ng lugar (backdrops.js); ibinabalik ang CSS na langit (SKY)
     sc.setBuddy(id|null)        → alagang hayop na sumusunod (buddies.js)
     sc.night(on, animate)       → gabi: lalakad si Tigo papasok sa bahay kubo at matutulog
     sc.add(opts) / remove(t)    → bisita (Tigo ng kaibigan); sumusunod siya kay Tigo habang naglalakad
     sc.together(kind) → sec     → sabay na galaw: "dance" | "highfive" | "chase" (habulan) | "spin" (ikot) | "bow"
     sc.hasFriends()
     sc.beginGame({ tick(dt,t), cam(camera,dt) }) / sc.endGame()  → ibang mundo para sa laro (Pac-Tigo, Racing)
     sc.headScreen()             → { x, y } (px sa canvas) ng ulo ni Tigo, para sa speech bubble
     sc.effect(kind, at)         → "hearts" | "food" | "bubbles" | "stars" | "ball" | "sparkle"
     sc.onTick(fn) → off()       → para sa laro (coin-game.js); sc.mainState() → { x, y, z }
     sc.pick(x, y) · sc.dispose()
   Kapag walang WebGL: nag-e-error (ang page ang may 2D fallback). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { createTigo } from "./pet-model.js";
import { buildBackdrop, RADIUS, HOUSE, SKY } from "./backdrops.js";
import { createBuddy } from "./buddies.js";

export function createScene(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const camBase = { y: 2.7, z: 8.2 };

  // ---------- ilaw ----------
  const hemi = new THREE.HemisphereLight(0xfff4e8, 0x6b8f71, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3.5, 6, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -4.2, right: 4.2, top: 4.2, bottom: -4.2 }); sun.shadow.radius = 4; sun.shadow.bias = -0.0005;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff9a6b, 1.2); rim.position.set(-4, 3, -4); scene.add(rim);

  // ---------- lugar (backdrop) ----------
  let place = null, placeId = "";
  function setBackdrop(id) {
    if (id === placeId && place) return SKY[placeId];
    if (place) { scene.remove(place.group); place.dispose(); }
    placeId = SKY[id] ? id : "island"; place = buildBackdrop(placeId); scene.add(place.group);
    place.night(isNight);
    return SKY[placeId];
  }

  // ---------- mga Tigo ----------
  const pets = [];
  const main = createTigo(opts.pet || {}); scene.add(main.group); pets.push(main);
  const me = { x: 0, z: 0.4, vx: 0, vz: 0, idle: 0 };
  main.group.position.set(me.x, 0, me.z);
  // bisita: may sariling posisyon; kusang sumusunod sa tabi ni Tigo (salitan kaliwa/kanan)
  const friends = [];
  function add(o) {
    const t = createTigo(o || {});
    const n = friends.length, side = n % 2 ? -1 : 1;
    const f = { t, side, row: Math.floor(n / 2), x: me.x + side * 1.3, z: me.z - 0.3, vx: 0, vz: 0, goal: null };
    t.group.position.set(f.x, 0, f.z); t.group.scale.setScalar(0.82); t.face(side * -0.5);
    scene.add(t.group); pets.push(t); friends.push(f); t.jump();
    return t;
  }
  function remove(t) {
    const i = pets.indexOf(t); if (i <= 0) return;
    pets.splice(i, 1); friends.splice(friends.findIndex((f) => f.t === t), 1); scene.remove(t.group); t.dispose();
  }
  // lakad ng bisita papunta sa (gx, gz)
  function steer(f, gx, gz, dt, speed = 2.1, faceTo) {
    const dx = gx - f.x, dz = gz - f.z, d = Math.hypot(dx, dz);
    const k = d < 0.06 ? 0 : Math.min(1, d / 0.35);
    f.vx += ((d ? dx / d : 0) * speed * k - f.vx) * Math.min(1, dt * 10); f.vz += ((d ? dz / d : 0) * speed * k - f.vz) * Math.min(1, dt * 10);
    const v = Math.hypot(f.vx, f.vz);
    if (v > 0.05) { [f.x, f.z] = collide(f.x + f.vx * dt, f.z + f.vz * dt); f.t.walk(Math.min(1, v / speed), Math.atan2(f.vx, f.vz)); }
    else { f.t.walk(0); if (faceTo !== undefined) f.t.face(faceTo); }
    f.t.group.position.x = f.x; f.t.group.position.z = f.z;
  }
  const headTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  function moveFriends(dt) {
    friends.forEach((f, i) => {
      if (show) return; // kontrolado ng together()
      if (inside) { steer(f, HOUSE.door.x + f.side * 0.9, HOUSE.door.z + 1.0, dt, 1.6, 0); return; }
      const gx = me.x + f.side * 1.25, gz = me.z - 0.25 - f.row * 0.7;
      const far = Math.hypot(gx - f.x, gz - f.z) > 0.5;
      steer(f, far ? gx : f.x, far ? gz : f.z, dt, 2.2, headTo(f, me));
    });
  }

  // ---------- sabay na galaw (kasama ang kaibigan) ----------
  let show = null; // { kind, t, dur, ... }
  const DUR = { dance: 4.6, highfive: 2.6, chase: 6.5, spin: 3.6, bow: 2.2 };
  function together(kind) {
    if (!friends.length || inside || !DUR[kind]) return 0;
    auto = null;
    show = { kind, t: 0, dur: DUR[kind], cx: me.x, cz: me.z, fired: {} };
    if (kind === "spin" || kind === "chase") { // gitna ng isla para may lugar
      const d = Math.hypot(me.x, me.z), lim = kind === "chase" ? 0.4 : RADIUS - 1.4;
      if (d > lim) { show.cx = (me.x / d) * lim; show.cz = (me.z / d) * lim; }
    }
    return show.dur;
  }
  function once(key, fn) { if (!show.fired[key]) { show.fired[key] = true; fn(); } }
  function updateShow(dt, t) {
    if (!show) return null;
    show.t += dt;
    const k = show.kind, T = show.t, all = [main].concat(friends.map((f) => f.t));
    let goal = null; // saan pupunta si Tigo
    if (k === "dance" || k === "bow") {
      // magkatabi, nakaharap sa camera, sabay na sumayaw / yumuko
      goal = { x: show.cx, z: show.cz, face: 0 };
      friends.forEach((f, i) => steer(f, show.cx + (i % 2 ? -1 : 1) * (1.3 + Math.floor(i / 2) * 1.0), show.cz - 0.1, dt, 2.4, 0));
      if (T > 0.9) once("go", () => all.forEach((p) => p.move(k, show.dur - 1.0)));
      if (k === "dance" && T > 0.9) { show.fx = (show.fx || 0) - dt; if (show.fx <= 0) { show.fx = 0.35; effect("confetti"); } }
      if (k === "bow" && T > 1.4) once("h", () => effect("hearts"));
    } else if (k === "highfive") {
      // magkaharap, taas kamay, palakpak!
      const f = friends[0];
      goal = { x: show.cx, z: show.cz, face: Math.PI / 2 };
      steer(f, show.cx + 1.1, show.cz, dt, 2.4, -Math.PI / 2);
      friends.slice(1).forEach((g, i) => steer(g, show.cx + 0.5, show.cz - 1 - i * 0.7, dt, 2.2, headTo(g, me)));
      if (T > 0.8) once("up", () => { main.move("highfive", 1.4); f.t.move("highfive", 1.4); });
      if (T > 1.15) once("clap", () => { main.jump(); f.t.jump(); effect("stars", { x: show.cx + 0.55, y: 1.6, z: show.cz }); if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {} });
    } else if (k === "chase") {
      // habulan: tumatakbo ang kaibigan paikot, hinahabol ni Tigo
      const R = 1.7, a = T * 1.5;
      friends.forEach((f, i) => { const b = a + Math.PI * 0.7 + i * 0.9; steer(f, show.cx + Math.cos(b) * R, show.cz + Math.sin(b) * R, dt, 2.6); });
      const f = friends[0]; goal = { x: f.x, z: f.z, run: true };
      if (Math.hypot(f.x - me.x, f.z - me.z) < 0.7 && T > 1.5 && (!show.tag || T - show.tag > 1.5)) { show.tag = T; f.t.jump(); effect("hearts", f.t.group); }
    } else if (k === "spin") {
      // ikot: magkahawak-kamay na umiikot sa gitna
      const n = friends.length + 1, R = 0.75 + n * 0.08, a = T < 0.7 ? 0 : (T - 0.7) * 3.2;
      const pos = (i) => ({ x: show.cx + Math.cos(a + (i / n) * Math.PI * 2) * R, z: show.cz + Math.sin(a + (i / n) * Math.PI * 2) * R });
      const p0 = pos(0); goal = { x: p0.x, z: p0.z, snap: T > 0.7, face: headTo(p0, { x: show.cx, z: show.cz }) };
      friends.forEach((f, i) => { const q = pos(i + 1); if (T > 0.7) { f.x += (q.x - f.x) * 0.25; f.z += (q.z - f.z) * 0.25; f.t.group.position.x = f.x; f.t.group.position.z = f.z; f.t.walk(0.6, headTo(f, { x: show.cx, z: show.cz })); } else steer(f, q.x, q.z, dt, 2.4); });
      if (T > show.dur - 0.5) once("end", () => { all.forEach((p) => { p.walk(0); p.jump(); }); effect("stars"); });
    }
    if (T >= show.dur) { all.forEach((p) => { p.move(null); p.walk(0); }); main.face(0); show = null; }
    return goal;
  }

  // ---------- buddy ----------
  let buddy = null;
  function setBuddy(id) {
    if (buddy && buddy.id === id) return;
    if (buddy) { scene.remove(buddy.group); buddy.dispose(); buddy = null; }
    if (!id) return;
    buddy = createBuddy(id); if (!buddy) return;
    buddy.group.position.set(me.x - 0.8, 0, me.z + 0.3); scene.add(buddy.group); buddy.hop();
  }

  // ---------- galaw ----------
  let input = () => ({ x: 0, z: 0 });
  let auto = null; // { x, z, done } — kusang lakad (papunta sa bahay)
  let isNight = false, inside = false;
  function collide(x, z) {
    // bawal lumabas sa isla at bawal tumagos sa bahay
    const d = Math.hypot(x, z); if (d > RADIUS) { x *= RADIUS / d; z *= RADIUS / d; }
    const hx = x - HOUSE.x, hz = z - HOUSE.z, hd = Math.hypot(hx, hz);
    if (hd < 0.95 && !auto) { x = HOUSE.x + (hx / (hd || 1)) * 0.95; z = HOUSE.z + (hz / (hd || 1)) * 0.95; }
    return [x, z];
  }
  function moveMain(dt, sg) {
    if (inside) return;
    let ix = 0, iz = 0;
    if (sg && sg.snap) { // ikot: sundan mismo ang bilog
      me.x += (sg.x - me.x) * 0.25; me.z += (sg.z - me.z) * 0.25; me.vx = me.vz = 0;
      main.walk(0.6, sg.face); main.group.position.x = me.x; main.group.position.z = me.z; return;
    }
    if (sg) {
      const dx = sg.x - me.x, dz = sg.z - me.z, d = Math.hypot(dx, dz);
      if (d > 0.06) { const k = sg.run ? 1 : Math.min(1, d / 0.35); ix = (dx / d) * k; iz = (dz / d) * k; }
      else if (sg.face !== undefined) main.face(sg.face);
    } else if (auto) {
      const dx = auto.x - me.x, dz = auto.z - me.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { const cb = auto.done; auto = null; cb && cb(); return; }
      ix = dx / d; iz = dz / d; if (d < 0.4) { ix *= d / 0.4 + 0.3; iz *= d / 0.4 + 0.3; }
    } else if (!isNight) { const i = input(); ix = i.x; iz = i.z; }
    const speed = 2.1;
    me.vx += (ix * speed - me.vx) * Math.min(1, dt * 10); me.vz += (iz * speed - me.vz) * Math.min(1, dt * 10);
    const v = Math.hypot(me.vx, me.vz);
    if (v > 0.05) {
      [me.x, me.z] = collide(me.x + me.vx * dt, me.z + me.vz * dt);
      main.walk(Math.min(1, v / speed), Math.atan2(me.vx, me.vz)); me.idle = 0;
    } else {
      main.walk(0); me.idle += dt;
      if (me.idle > 4 && me.idle < 4.1) main.face(0); // humarap ulit sa camera
    }
    main.group.position.x = me.x; main.group.position.z = me.z;
  }
  function walkTo(x, z, done) { auto = { x, z, done }; }

  // ---------- gabi: pasok sa bahay kubo ----------
  const zzz = new THREE.Group(); zzz.visible = false; scene.add(zzz);
  const zMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9bb6ff, emissiveIntensity: 0.8, transparent: true });
  const zGeo = new THREE.TorusGeometry(0.09, 0.016, 6, 4);
  [0, 1, 2].forEach((i) => { const z = new THREE.Mesh(zGeo, zMat); z.scale.setScalar(1 + i * 0.3); zzz.add(z); });
  function night(on, animate = true) {
    on = !!on; isNight = on;
    hemi.intensity = on ? 0.35 : 1.1; sun.intensity = on ? 0.5 : 2.2; sun.color.set(on ? 0x9bb6ff : 0xffffff);
    rim.color.set(on ? 0x6b7bff : 0xff9a6b);
    if (place) place.night(on);
    if (on && !inside) {
      const go = () => { inside = true; main.group.visible = false; zzz.visible = true; zzz.position.set(HOUSE.x, 2.05, HOUSE.z); };
      if (!animate) { me.x = HOUSE.door.x; me.z = HOUSE.door.z; go(); } else walkTo(HOUSE.door.x, HOUSE.door.z, go);
    } else if (!on && inside) {
      inside = false; main.group.visible = true; zzz.visible = false;
      me.x = HOUSE.door.x; me.z = HOUSE.door.z + 0.1; main.group.position.set(me.x, 0, me.z);
      walkTo(HOUSE.door.x - 0.4, HOUSE.door.z + 0.9, () => { main.face(0); main.jump(); });
    }
  }

  // ---------- effects ----------
  const fx = [];
  const disp = [];
  const MS = (o) => { const m = new THREE.MeshStandardMaterial(o); disp.push(m); return m; };
  const fxMats = {
    hearts: MS({ color: 0xff4f7b, emissive: 0x551122, roughness: 0.4 }),
    food: MS({ color: 0xffb74d, roughness: 0.6 }),
    bubbles: new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transmission: 0.6, transparent: true, opacity: 0.55, roughness: 0.05 }),
    stars: MS({ color: 0xffe066, emissive: 0x665500, roughness: 0.3 }),
    sparkle: MS({ color: 0xfff3b0, emissive: 0xffc83d, emissiveIntensity: 0.9 }),
    confetti: MS({ color: 0xffffff, roughness: 0.5 }),
    ball: MS({ color: 0xff5a36, roughness: 0.4 }),
  };
  disp.push(fxMats.bubbles);
  function heartGeo() {
    const s = new THREE.Shape(); s.moveTo(0, 0.06); s.bezierCurveTo(0, 0.1, -0.08, 0.12, -0.1, 0.06); s.bezierCurveTo(-0.12, 0, -0.04, -0.06, 0, -0.1); s.bezierCurveTo(0.04, -0.06, 0.12, 0, 0.1, 0.06); s.bezierCurveTo(0.08, 0.12, 0, 0.1, 0, 0.06);
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  }
  const geos = { hearts: heartGeo(), food: new THREE.SphereGeometry(0.12, 14, 10), bubbles: new THREE.SphereGeometry(0.1, 16, 12), stars: new THREE.OctahedronGeometry(0.09), sparkle: new THREE.OctahedronGeometry(0.05), confetti: new THREE.BoxGeometry(0.07, 0.07, 0.015), ball: new THREE.SphereGeometry(0.16, 20, 14) };
  Object.values(geos).forEach((g) => disp.push(g));
  function effect(kind, at) {
    if (!geos[kind]) return;
    const base = at && at.isObject3D ? at.position : at && at.x !== undefined ? at : main.group.position;
    const free = at && at.y !== undefined && !at.isObject3D; // effect sa mismong lugar (hal. coin)
    const n = kind === "ball" ? 1 : kind === "food" ? 3 : kind === "sparkle" ? 6 : kind === "confetti" ? 10 : 8;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geos[kind], kind === "confetti" ? fxMats.confetti.clone() : fxMats[kind]); m.castShadow = kind === "ball" || kind === "food";
      if (kind === "confetti") m.material.color.setHSL(Math.random(), 0.85, 0.6);
      const a = Math.random() * Math.PI * 2;
      if (free) m.position.set(base.x, base.y, base.z);
      else m.position.set(base.x + (kind === "food" ? (i - 1) * 0.25 : Math.cos(a) * 0.5), kind === "food" ? 2.6 + i * 0.3 : 1 + Math.random() * 0.8, base.z + 0.6 + Math.sin(a) * 0.3);
      if (kind === "hearts") m.rotation.z = Math.PI;
      scene.add(m);
      const v = free ? new THREE.Vector3(Math.cos(a) * 1.4, 1 + Math.random(), Math.sin(a) * 1.4) : new THREE.Vector3((Math.random() - 0.5) * 0.6, kind === "food" ? -2.2 : 0.8 + Math.random() * 0.6, 0);
      fx.push({ m, kind, life: kind === "ball" ? 2.4 : kind === "sparkle" ? 0.5 : 1.6 + Math.random() * 0.6, v, t0: 0, target: main.group.position });
    }
  }
  function updateFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.life -= dt; f.t0 += dt;
      if (f.kind === "ball") {
        f.m.position.x = Math.sin(f.t0 * 2.2) * 1.2 + f.target.x; f.m.position.z = f.target.z + 0.9;
        f.m.position.y = 0.16 + Math.abs(Math.sin(f.t0 * 5)) * 0.9 * Math.max(0.2, f.life / 2.4); f.m.rotation.x += dt * 8;
      } else if (f.kind === "food") {
        f.m.position.y = Math.max(1.05, f.m.position.y + f.v.y * dt); f.m.position.x += (f.target.x - f.m.position.x) * 0.1; f.m.position.z += (f.target.z + 0.45 - f.m.position.z) * 0.1;
        f.m.scale.setScalar(Math.max(0.01, Math.min(1, f.life)));
      } else {
        f.m.position.addScaledVector(f.v, dt);
        if (f.kind === "hearts") f.m.rotation.y = Math.sin(f.t0 * 3) * 0.4; else if (f.kind === "confetti") { f.m.rotation.x += dt * 9; f.m.rotation.z += dt * 6; f.v.y -= dt * 1.2; } else f.m.rotation.y += dt * 3;
        f.m.scale.setScalar(Math.max(0.01, Math.min(1, f.life * (f.kind === "sparkle" ? 2 : 1))) * (f.kind === "hearts" ? 1.7 : 1));
      }
      if (f.life <= 0) { scene.remove(f.m); if (f.kind === "confetti") f.m.material.dispose(); fx.splice(i, 1); }
    }
  }

  // ---------- loop ----------
  const ticks = new Set();
  const clock = new THREE.Clock();
  const look = new THREE.Vector3(0, 0.95, 0);
  let raf = 0, alive = true, portrait = false;
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    portrait = w / h < 0.8; // phone (patayo): medyo malayo para kasya ang isla
    camera.updateProjectionMatrix();
  }
  // ---------- laro na may sariling mundo ----------
  let game = null;
  const hidden = [];
  function beginGame(g) {
    game = g; show = null; auto = null; main.walk(0); main.move(null);
    [place && place.group, buddy && buddy.group, zzz].concat(friends.map((f) => f.t.group)).forEach((o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } });
    main.group.visible = true;
  }
  function endGame() {
    game = null; hidden.forEach((o) => { o.visible = true; }); hidden.length = 0;
    scene.add(main.group); main.group.scale.setScalar(1); main.group.rotation.set(0, 0, 0);
    me.x = 0; me.z = 0.4; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z); main.walk(0); main.face(0);
    main.group.visible = !inside; zzz.visible = inside;
    sun.position.set(3.5, 6, 4); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  }
  scene.add(sun.target);
  const headV = new THREE.Vector3();
  function loop() {
    if (!alive) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (game) {
      game.tick(dt, t); main.update(dt, t); ticks.forEach((fn) => fn(dt, t)); updateFx(dt);
      game.cam(camera, dt); renderer.render(scene, camera); raf = requestAnimationFrame(loop); return;
    }
    moveMain(dt, updateShow(dt, t));
    moveFriends(dt);
    pets.forEach((p) => p.update(opts.reduced ? dt * 0.4 : dt, t));
    if (buddy) buddy.update(dt, t, inside ? { x: HOUSE.door.x + 0.3, z: HOUSE.door.z + 0.6 } : me, inside);
    if (place) place.update(t);
    ticks.forEach((fn) => fn(dt, t));
    zzz.children.forEach((z, i) => { const k = (t * 0.4 + i * 0.33) % 1; z.position.set(k * 0.3, k * 0.8, 0); z.material.opacity = 1 - k; });
    updateFx(dt);
    // camera: sumusunod kay Tigo (malumanay)
    // layo ng camera ayon sa hugis ng screen: patayo (phone) = mas malayo para kasya ang isla
    const fx_ = me.x * 0.55, fz = me.z * 0.45, cz = Math.min(14, Math.max(camBase.z, 3.3 / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)));
    look.x += (fx_ - look.x) * 0.06; look.z += (fz - look.z) * 0.06;
    camera.position.set(look.x, camBase.y * (cz / camBase.z), look.z + cz);
    camera.lookAt(look.x, 0.95, look.z);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  setBackdrop(opts.backdrop || "island");
  resize(); loop();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  function vis() { if (document.hidden) cancelAnimationFrame(raf); else { clock.getDelta(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } }
  document.addEventListener("visibilitychange", vis);

  return {
    main, add, remove, effect, night, renderer, scene, setBackdrop, setBuddy,
    together, hasFriends() { return friends.length > 0; }, isShowing() { return !!show; },
    beginGame, endGame, sun, camera, inGame() { return !!game; },
    headScreen() {
      if (inside || !main.group.visible) return null;
      main.group.getWorldPosition(headV); const s = main.group.getWorldScale(new THREE.Vector3()).y;
      headV.y += (2.05 + main.height()) * s; headV.project(camera);
      if (headV.z > 1) return null;
      return { x: (headV.x * 0.5 + 0.5) * canvas.clientWidth, y: (-headV.y * 0.5 + 0.5) * canvas.clientHeight };
    },
    setInput(fn) { input = fn || (() => ({ x: 0, z: 0 })); },
    input() { return input(); },
    jump() { if (!inside) { main.jump(); if (buddy) buddy.hop(); } },
    mainState() { return { x: me.x, z: me.z, y: main.height() }; },
    onTick(fn) { ticks.add(fn); return () => ticks.delete(fn); },
    isInside() { return inside; },
    pick(x, y) {
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x, y), camera);
      return ray.intersectObject(main.group, true).length > 0;
    },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("visibilitychange", vis);
      pets.forEach((p) => p.dispose()); if (buddy) buddy.dispose(); if (place) place.dispose();
      disp.forEach((d) => d.dispose()); zGeo.dispose(); zMat.dispose(); renderer.dispose();
    },
  };
}
