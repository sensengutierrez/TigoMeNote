/* TigoMeNote · tigo/pet-scene.js — 3D na mundo ni Tigo (three.js, WebGL)
   import { createScene } from "./pet-scene.js"
   const sc = createScene(canvas, { pet, reduced, backdrop })
     sc.main                     → ang sariling Tigo (pet-model.js)
     sc.setInput(fn)             → fn() = { x, z } (-1..1) galing sa controls.js; nilalakad si Tigo
     sc.jump()                   → talon
     sc.setBackdrop(id)          → palit ng lugar (backdrops.js); ibinabalik ang CSS na langit (SKY)
     sc.setBuddy(id|null)        → alagang hayop na sumusunod (buddies.js)
     sc.night(on, animate)       → gabi: papasok si Tigo sa bahay at matutulog sa kama
     sc.enterRoom() / sc.leaveRoom() / sc.inRoom() → loob ng bahay (room.js); sc.room() = ang kwarto (para sa room-ui.js)
     sc.setRoom({ wall, floor, items }) → ayos ng kwarto (galing sa server)
     sc.rig                      → camera (camera-rig.js): next() view, zoomStep(), yaw()
     sc.setLook(fn)              → fn() = { x, y } (opsyonal na joystick ng camera; ang swipe ay nasa camera-rig.js)
     sc.setRun(fn)               → fn() = true kapag tumatakbo (🏃 Run) · sc.stop() = hinto agad, haharap sa camera
     sc.ray(x, y) → Raycaster    · sc.setClaim(fn) → kung may ibang gagamit ng hila sa screen (paglipat ng gamit)
     opts.onDoor(state)          → "near" (malapit sa pinto sa labas) | "room" (nasa loob) | null
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
import { createCameraRig } from "./camera-rig.js";
import { createSky, skyColors } from "./sky-dome.js";
import { buildRoom, ROOM } from "./room.js";

export function createScene(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const camBase = { y: 2.7, z: 8.2 };
  let look2 = () => null, claim = () => false;
  const rig = createCameraRig({ camera, el: opts.el || canvas, blocked: () => !!game, claim: (e) => claim(e), stick: () => look2() });
  const sky = createSky(scene);

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
    place.night(isNight); place.group.visible = !inRoom && !game;
    sky.set(skyColors(SKY[placeId]), isNight);
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
      if (inRoom) return; // naghihintay sa labas
      const gx = me.x + f.side * 1.25, gz = me.z - 0.25 - f.row * 0.7;
      const far = Math.hypot(gx - f.x, gz - f.z) > 0.5;
      steer(f, far ? gx : f.x, far ? gz : f.z, dt, 2.2, headTo(f, me));
    });
  }

  // ---------- sabay na galaw (kasama ang kaibigan) ----------
  let show = null; // { kind, t, dur, ... }
  const DUR = { dance: 4.6, highfive: 2.6, chase: 6.5, spin: 3.6, bow: 2.2 };
  function together(kind) {
    if (!friends.length || inRoom || !DUR[kind]) return 0;
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
  let input = () => ({ x: 0, z: 0 }), running = () => false;
  let auto = null; // { x, z, done } — kusang lakad (papunta sa bahay)
  let isNight = false, inside = false; // inside = tulog sa kama (hindi gumagalaw)
  let inRoom = false, room = null, roomData = null, doorState = null;
  function collide(x, z) {
    if (inRoom) return room.collide(x, z);
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
    } else if (!isNight) {
      // direksyon ayon sa camera: taas ng joystick = palayo sa camera
      const i = input(), y = rig.yaw(), c = Math.cos(y), s_ = Math.sin(y);
      ix = i.x * c + i.z * s_; iz = -i.x * s_ + i.z * c;
    }
    const speed = 2.1 * (!sg && !auto && running() ? 1.75 : 1);
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
    doorCheck(ix, iz);
  }
  function walkTo(x, z, done) { auto = { x, z, done }; }

  // ---------- pinto: pasok / labas ng bahay ----------
  function setDoor(st) { if (st !== doorState) { doorState = st; if (opts.onDoor) opts.onDoor(st); } }
  function doorCheck(ix, iz) {
    if (auto || show || game) return;
    if (inRoom) {
      setDoor("room");
      // lumakad palabas sa pinto (harap ng kwarto)
      if (!isNight && Math.abs(me.x - ROOM.door.x) < 0.5 && me.z > ROOM.d / 2 - 0.6 && iz > 0.5) leaveRoom();
      return;
    }
    const d = Math.hypot(me.x - HOUSE.door.x, me.z - HOUSE.door.z);
    setDoor(d < 0.75 ? "near" : null);
    // lumakad papunta sa pinto = pasok
    if (d < 0.32 && !isNight) { const hx = HOUSE.x - me.x, hz = HOUSE.z - me.z, hl = Math.hypot(hx, hz) || 1; if ((ix * hx + iz * hz) / hl > 0.5) enterRoom(); }
  }
  function ensureRoom() {
    if (!room) { room = buildRoom(); room.group.visible = false; scene.add(room.group); }
    const r = roomData || {};
    room.setStyle(r.wall, r.floor);
    room.setItems(r.items && r.items.length ? r.items : [{ id: "bed", x: -1.9, z: -1.4, r: 0 }, { id: "rug", x: 0.3, z: 0.2, r: 0 }, { id: "plant", x: 2.4, z: -1.9, r: 0 }, { id: "lamp", x: -0.7, z: -1.9, r: 0 }]);
    return room;
  }
  function enterRoom(instant) {
    if (inRoom || game) return;
    if (!instant && !auto && Math.hypot(me.x - HOUSE.door.x, me.z - HOUSE.door.z) > 0.4) { walkTo(HOUSE.door.x, HOUSE.door.z, () => enterRoom(true)); return; }
    if (!room) ensureRoom();
    inRoom = true; auto = null; show = null;
    if (place) place.group.visible = false;
    friends.forEach((f) => { f.t.group.visible = false; });
    room.group.visible = true;
    me.x = ROOM.door.x; me.z = ROOM.door.z - 0.1; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z); main.face(Math.PI);
    if (buddy) buddy.group.position.set(me.x + 0.6, 0, me.z);
    if (!isNight) walkTo(ROOM.door.x, ROOM.door.z - 0.9, () => { main.face(0); });
    setDoor("room");
    if (opts.onRoom) opts.onRoom(true);
  }
  function leaveRoom(instant) {
    if (!inRoom) return;
    inRoom = false; inside = false; auto = null;
    room.group.visible = false; room.select(null);
    if (place) place.group.visible = true;
    friends.forEach((f) => { f.t.group.visible = true; });
    standUp();
    me.x = HOUSE.door.x; me.z = HOUSE.door.z + 0.15; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z);
    if (buddy) buddy.group.position.set(me.x + 0.5, 0, me.z + 0.3);
    if (!instant) walkTo(HOUSE.door.x - 0.3, HOUSE.door.z + 0.95, () => { main.face(0); main.jump(); });
    setDoor(null);
    if (opts.onRoom) opts.onRoom(false);
  }
  // higa sa kama / bangon
  function lieDown() {
    const b = room && room.bedSpot();
    inside = true; me.vx = me.vz = 0; main.walk(0);
    main.group.rotation.order = "YXZ";
    if (b) { me.x = b.x; me.z = b.z; main.group.position.set(b.x, b.y, b.z); main.face(b.face); main.group.rotation.y = b.face; }
    else { main.face(0); main.group.position.y = 0.12; }
    main.group.rotation.x = -1.45; main.group.scale.setScalar(0.78); // nakahiga, ulo sa unan (medyo maliit para kasya sa kama)
  }
  function standUp() {
    if (main.group.rotation.x === 0 && main.group.position.y === 0) return;
    main.group.rotation.x = 0; main.group.rotation.z = 0; main.group.position.y = 0; main.group.scale.setScalar(1);
    const b = room && room.bedSpot(); if (b && inRoom) { me.x = b.beside.x; me.z = b.beside.z; main.group.position.set(me.x, 0, me.z); }
  }

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
    sky.set(skyColors(SKY[placeId]), on);
    if (game) return;
    if (on && !inside) {
      // papasok sa bahay → lalakad sa kama → hihiga
      const toBed = () => {
        const b = room.bedSpot();
        if (!animate || !b) { lieDown(); return; }
        walkTo(b.beside.x, b.beside.z, lieDown);
      };
      if (inRoom) toBed();
      else if (!animate) { enterRoom(true); lieDown(); }
      else walkTo(HOUSE.door.x, HOUSE.door.z, () => { enterRoom(true); toBed(); });
    } else if (!on && inside) {
      inside = false; standUp(); main.jump();
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
      // ang puso ay nakatayo na (lobes sa itaas, tulis sa ibaba); huwag baligtarin
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
    if (inRoom) leaveRoom(true);
    if (inside) { inside = false; standUp(); }
    game = g; show = null; auto = null; main.walk(0); main.move(null); setDoor(null);
    [place && place.group, buddy && buddy.group, zzz, sky.group].concat(friends.map((f) => f.t.group)).forEach((o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } });
    main.group.visible = true;
  }
  function endGame() {
    game = null; hidden.forEach((o) => { o.visible = true; }); hidden.length = 0;
    scene.add(main.group); main.group.scale.setScalar(1); main.group.rotation.set(0, 0, 0);
    me.x = 0; me.z = 0.4; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z); main.walk(0); main.face(0);
    main.group.visible = true; zzz.visible = false;
    if (place) place.group.visible = !inRoom;
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
    if (buddy) buddy.update(dt, t, inside && !inRoom ? { x: HOUSE.door.x + 0.3, z: HOUSE.door.z + 0.6 } : me, false);
    if (place) place.update(t);
    sky.update(t);
    if (inRoom) room.update(t, isNight, camera);
    ticks.forEach((fn) => fn(dt, t));
    zzz.children.forEach((z, i) => { const k = (t * 0.4 + i * 0.33) % 1; z.position.set(k * 0.3, k * 0.8, 0); z.material.opacity = 1 - k; });
    updateFx(dt);
    // camera (camera-rig.js): sumusunod kay Tigo; ikot/zoom gamit ang joystick, mouse o pinch
    // layo ayon sa hugis ng screen: patayo (phone) = mas malayo para kasya ang isla (o ang kwarto)
    const half = inRoom ? 3.6 : 3.3, cz = Math.min(15, Math.max(camBase.z, half / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)));
    look.set(me.x, inside ? 0.6 : 0.95, me.z);
    rig.update(dt, look, Math.hypot(camBase.y * (cz / camBase.z), cz));
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
    beginGame, endGame, sun, camera, rig, inGame() { return !!game; },
    enterRoom() { if (!isNight) enterRoom(); }, leaveRoom() { if (!inside) leaveRoom(); }, inRoom() { return inRoom; },
    room() { return inRoom ? room : null; },
    setRoom(d) { roomData = d || null; if (room) ensureRoom(); },
    setLook(fn) { look2 = fn || (() => null); },
    setRun(fn) { running = fn || (() => false); },
    stop() {
      if (game || inside) return;
      auto = null; me.vx = me.vz = 0; main.walk(0); main.face(rig.yaw());
      if (show) { [main].concat(friends.map((f) => f.t)).forEach((p) => { p.move(null); p.walk(0); }); show = null; }
    },
    setClaim(fn) { claim = fn || (() => false); },
    ray(x, y) { const r = new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(x, y), camera); return r; },
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
      rig.dispose(); sky.dispose(); if (room) room.dispose();
      disp.forEach((d) => d.dispose()); zGeo.dispose(); zMat.dispose(); renderer.dispose();
    },
  };
}
