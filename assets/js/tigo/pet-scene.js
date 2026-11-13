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
     sc.setRoom({ wall, floor, items, bed:{blanket,pillow}, up:{ wall, floor, items } }) → ayos ng kwarto (galing sa server; up = 2nd floor)
     0.11.52: sc.floor() → 1|2 · sc.climb() → akyat/baba sa hagdan (Villa/Mansion) · sc.roomFull() → buong ayos (para i-save) · sc.setBedding({ blanket, pillow })
              sc.aim(range) → mga tinamaan sa harap ni Tigo (water gun): [{ kind: "buddy"|"garden"|"friend", x, z }] · sc.splashBuddy() · opts.onFloor(f)
     sc.rig                      → camera (camera-rig.js): next() view, zoomStep(), yaw()
     sc.setLook(fn)              → fn() = { x, y } (opsyonal na joystick ng camera; ang swipe ay nasa camera-rig.js)
     sc.setRun(fn)               → fn() = true kapag tumatakbo (🏃 Run) · sc.stop() = hinto agad, haharap sa camera
     sc.sit() / sc.standUp() / sc.pose() → "stand" | "sit" | "bed"  (sa bahay: upo sa pinakamalapit na upuan o sa sahig)
     sc.setSize(k)               → laki ni Tigo (0.5–1.3), pang-display lang · opts.onPose(pose) kapag nagbago
     sc.ray(x, y) → Raycaster    · sc.setClaim(fn) → kung may ibang gagamit ng hila sa screen (paglipat ng gamit)
     opts.onDoor(state)          → "near" (malapit sa pinto sa labas) | "room" (nasa loob) | null
     sc.add(opts) / remove(t)    → bisita (Tigo ng kaibigan); sumusunod siya kay Tigo habang naglalakad
     sc.puppet(opts) → { t, set({x,z,ry,room,pose}), screen(), remove() } → Tigo ng ibang tao na galaw ay galing sa network · sc.netState()
     sc.buddyMode("follow"|"stay"|"free") / sc.buddyMode() · sc.pickBuddy(x, y) · sc.buddyScreen() · sc.ball(on) / sc.ballActive() (⚽ na nananatili)
     sc.dance("dance"|"budots"|"robot") → sec  → solo na sayaw (💃 Groove · 🕺 Budots · 🤖 Robot); sasabay ang bisita
     sc.together(kind) → sec     → sabay na galaw: "dance" | "highfive" | "chase" (habulan) | "spin" (ikot) | "bow"
     sc.hasFriends()
     sc.beginGame({ tick(dt,t), cam(camera,dt) }) / sc.endGame()  → ibang mundo para sa laro (Pac-Tigo, Racing)
     sc.headScreen()             → { x, y } (px sa canvas) ng ulo ni Tigo, para sa speech bubble
     sc.bathe(done) · sc.cookAt(done) · sc.eatAtTable(done) · sc.atTable() · sc.atDesk() · sc.busy()  (0.11.54: banyo, kusina, kain sa mesa, laro sa PC)
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
import { buildRoom, ROOM, hasStairs } from "./room.js";
import { sleepBlanket, DEF_BED } from "./bedding.js";
import { buildRide } from "./vehicles.js";
const RIDE_SPEED = { bike: 2.3, scooter: 3.0, car: 3.7 };   // 0.11.52: mas mabilis (dati 1.7/2.2/2.8)
const RIDE_KS = { bike: 1.0, scooter: 1.0, car: 1.15 };   // 0.11.54: mas maliit (dati 1.3); ang kamay ay itinututok sa manibela (grips)

export function createScene(canvas, opts = {}) {
  // Magaan na 3D (walang anino at antialias, 1x) kapag nag-crash ang app sa nakaraang 7 araw (app-mode.js → tmnLite3d)
  let lite = false; try { lite = Date.now() - Number(localStorage.getItem("tmnLite3d") || 0) < 7 * 86_400_000; } catch (e) {}
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio || 1, window.TMN_IN_APP ? 1.5 : 2)); // APK: mas magaan sa memory
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); }); // huwag mag-crash; kusang babalik ang three.js
  renderer.shadowMap.enabled = !lite; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); sun.shadow.radius = 4; sun.shadow.bias = -0.0005;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff9a6b, 1.2); rim.position.set(-4, 3, -4); scene.add(rim);

  // ---------- lugar (backdrop) ----------
  let place = null, placeId = "", farm = null, fishing = false, biteT = 0, houseLv = 1, extId = "ext-classic";
  function setBackdrop(id) {
    if (id === placeId && place) return SKY[placeId];
    if (place) { scene.remove(place.group); place.dispose(); }
    placeId = SKY[id] ? id : "island"; place = buildBackdrop(placeId); scene.add(place.group); place.setHouse(houseLv); place.setLook(extId);
    place.night(isNight); place.group.visible = !inRoom && !game; place.setFarm(farm);
    sky.set(skyColors(SKY[placeId]), isNight);
    return SKY[placeId];
  }

  // ---------- mga Tigo ----------
  const pets = [];
  const main = createTigo(opts.pet || {}); scene.add(main.group); pets.push(main);
  let sizeK = Math.max(0.5, Math.min(1.3, Number(opts.size) || 1)), pose = "stand", seat = null;
  main.group.scale.setScalar(sizeK);
  function setPose(p) { if (p !== pose) { pose = p; if (opts.onPose) opts.onPose(p); } }
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
  // ---- puppet: Tigo ng ibang tao na ang galaw ay galing sa network (pasyal sa isla) ----
  const puppets = [];
  function puppet(o) {
    const t = createTigo(o || {}); t.group.scale.setScalar(0.92); scene.add(t.group); pets.push(t);
    const q = { t, x: 0.9, z: 1.2, tx: 0.9, tz: 1.2, ry: 0, room: false, pose: "stand", got: false };
    t.group.position.set(q.x, 0, q.z); puppets.push(q);
    return {
      t,
      set(d) {   // { x, z, ry, room, pose }
        if (!Number.isFinite(d.x) || !Number.isFinite(d.z)) return;
        q.tx = Math.max(-12, Math.min(12, d.x)); q.tz = Math.max(-12, Math.min(12, d.z)); q.ry = Number(d.ry) || 0; q.room = !!d.room;
        const ps = d.pose === "sit" ? "sit" : "stand";
        if (ps !== q.pose) { q.pose = ps; if (t.sitPose) t.sitPose(ps === "sit"); }
        if (!q.got || Math.hypot(q.tx - q.x, q.tz - q.z) > 4) { q.x = q.tx; q.z = q.tz; q.got = true; }
      },
      screen() { const v = new THREE.Vector3(q.x, 1.25, q.z).project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, on: t.group.visible && v.z < 1 }; },
      remove() {
        const i = puppets.indexOf(q); if (i < 0) return;
        puppets.splice(i, 1); const k = pets.indexOf(t); if (k > 0) pets.splice(k, 1); scene.remove(t.group); t.dispose();
      },
    };
  }
  function movePuppets(dt) {
    puppets.forEach((q) => {
      q.t.group.visible = q.room === inRoom && !(inside && !inRoom);
      const dx = q.tx - q.x, dz = q.tz - q.z, d = Math.hypot(dx, dz);
      if (d > 0.04 && q.pose === "stand") { const st = Math.min(d, dt * 3.2); q.x += dx / d * st; q.z += dz / d * st; q.t.walk(Math.min(1, d / 0.5), Math.atan2(dx, dz)); }
      else { q.t.walk(0); q.t.face(q.ry); }
      q.t.group.position.x = q.x; q.t.group.position.z = q.z;
    });
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

  // ---------- 💃 sayaw (solo, kahit walang kaibigan; sasabay ang bisita at buddy) ----------
  const DANCES = { dance: 5, budots: 5, robot: 5 };
  let danceT = 0, confT = 0;
  function dance(kind) {
    if (game || inside || show || !DANCES[kind]) return 0;
    if (pose !== "stand") standUp();
    auto = null; me.vx = me.vz = 0; main.walk(0); main.face(rig.yaw());
    const sec = DANCES[kind];
    main.move(kind, sec); friends.forEach((f) => f.t.move(kind, sec)); if (buddy) buddy.hop();
    danceT = sec; confT = 0.4; return sec;
  }
  function updateDance(dt) {
    if (danceT <= 0) return;
    const i = input(); // naglakad = tigil sayaw
    if (Math.hypot(i.x || 0, i.z || 0) > 0.2) { danceT = 0; main.move(null); friends.forEach((f) => f.t.move(null)); return; }
    danceT -= dt; confT -= dt;
    if (confT <= 0) { confT = 0.45; effect(Math.random() < 0.7 ? "confetti" : "sparkle"); }
    if (buddy && Math.random() < dt * 1.2) buddy.hop();
  }

  // ---------- buddy ----------
  let buddy = null;
  function setBuddy(id) {
    if (buddy && buddy.id === id) return;
    if (buddy) { scene.remove(buddy.group); buddy.dispose(); buddy = null; }
    if (!id) return;
    buddy = createBuddy(id); if (!buddy) return;
    buddy.group.position.set(me.x - 0.8, 0, me.z + 0.3); scene.add(buddy.group); buddy.hop(); bud.mode = "follow";
  }
  // Ang alaga: 🐾 Come (sumusunod) · ✋ Stay (naghihintay; humihiga pagkalipas ng ilang saglit) · 🌿 Free (naglalakad-lakad nang mag-isa)
  // Hindi na naiipit sa gamit: bawat galaw ay dumadaan sa collide(); kapag walang usad, ibang direksyon ang pipiliin.
  const bud = { mode: "follow", stay: null, goal: null, gT: 0, last: null, stuckT: 0, idleT: 0 };
  const PET_KIND = { puppy: "dog", kitty: "cat", birdie: "bird", chick: "bird", bunbun: "any", turtle: "any" };
  function petBed() { return inRoom && room && room.petBed && buddy ? room.petBed(PET_KIND[buddy.id] || "any") : null; }
  function budTarget(dt, bedB) {
    const off = (x, z) => ({ x: x + 0.75, z: z - 0.35 });   // buddy.update ay naglalagay ng (-0.75, +0.35) sa target
    // 0.11.52: may sariling tulugan sa bahay → doon matutulog (kapag tulog si Tigo, o naka-Stay nang matagal)
    const pb = petBed();
    if (pb && (bedB || (bud.mode === "stay" && bud.idleT > 12))) { if (bud.mode === "stay") bud.idleT += dt; return { t: off(pb.x, pb.z), sleep: true, y: pb.y, bed: true }; }
    if (bedB) {   // sa sahig sa tabi ng kama, palayo sa puwestong babangunan ni Tigo
      const sx = Math.cos(bedB.face), sz = -Math.sin(bedB.face), fx = Math.sin(bedB.face), fz = Math.cos(bedB.face);
      return { t: { x: bedB.beside.x + sx * 0.2 + fx * 1.25 + 0.75, z: bedB.beside.z + sz * 0.2 + fz * 1.25 - 0.35 }, sleep: true };
    }
    if (inside && !inRoom) return { t: { x: HOUSE.door.x + 0.3, z: HOUSE.door.z + 0.6 }, sleep: false };
    if (bud.flee && bud.flee.t > 0) { bud.flee.t -= dt; return { t: off(bud.flee.x, bud.flee.z), sleep: false }; }   // nabasa ng water gun: tumatakbo palayo
    if (toy && bud.mode !== "stay") return { t: off(toy.x, toy.z), sleep: false };   // hinahabol ang bola
    if (bud.mode === "stay" && bud.stay) { bud.idleT += dt; return { t: off(bud.stay.x, bud.stay.z), sleep: bud.idleT > 12 }; }
    if (bud.mode === "free") {
      bud.gT -= dt;
      if (!bud.goal || bud.gT <= 0) {
        const lim = inRoom ? 2.2 : 6.2;
        for (let i = 0; i < 8; i++) {
          const x = (Math.random() * 2 - 1) * lim, z = (Math.random() * 2 - 1) * lim * (inRoom ? 0.8 : 1), c = collide(x, z);
          if (Math.hypot(c[0] - x, c[1] - z) < 0.01) { bud.goal = { x, z }; break; }
        }
        bud.gT = 3 + Math.random() * 4;
      }
      const g = bud.goal || me, b = buddy.group.position;
      if (Math.hypot(g.x - b.x, g.z - b.z) < 0.3) { bud.idleT += dt; if (bud.idleT > 2.5 + Math.random()) { bud.idleT = 0; bud.gT = 0; } } else bud.idleT = 0;
      return { t: off(g.x, g.z), sleep: false };
    }
    return { t: me, sleep: false };
  }
  function budStep(dt, t, bedB) {
    if (!buddy) return;
    const q = budTarget(dt, bedB), b = buddy.group.position, bx = b.x, bz = b.z;
    buddy.update(dt, t, q.t, q.sleep, q.y || 0);
    if (!buddy.flies && !q.bed) { const c = collide(b.x, b.z); b.x = c[0]; b.z = c[1]; }   // hindi tumatagos sa gamit, dingding, bahay o lawa
    // naiipit: kung halos walang usad pero malayo pa ang pupuntahan → ibang daan (o ibang puntahan kung malaya)
    const moved = Math.hypot(b.x - bx, b.z - bz), want = Math.hypot(q.t.x - 0.75 - b.x, q.t.z + 0.35 - b.z);
    if (want > 0.6 && moved < dt * 0.25) { bud.stuckT += dt; if (bud.stuckT > 1.2) { bud.stuckT = 0; if (bud.mode === "free") bud.gT = 0; else { const a = Math.random() * 6.28; b.x += Math.cos(a) * 0.25; b.z += Math.sin(a) * 0.25; const c = collide(b.x, b.z); b.x = c[0]; b.z = c[1]; } } }
    else bud.stuckT = 0;
  }
  function buddyMode(m) {
    if (!buddy || !m) return bud.mode;
    bud.mode = m; bud.idleT = 0; bud.goal = null; bud.gT = 0; buddy.hop();
    if (m === "stay") bud.stay = { x: buddy.group.position.x, z: buddy.group.position.z };
    return m;
  }

  // ---------- ⚽ bola: nananatili hanggang "Done"; sinisipa ni Tigo kapag nabangga, hinahabol ng alaga ----------
  let toy = null;
  const toyGeo = new THREE.SphereGeometry(0.15, 20, 14), toyMat = new THREE.MeshStandardMaterial({ color: 0xff5a36, roughness: 0.45 }), toyBand = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 }), toyBandGeo = new THREE.TorusGeometry(0.152, 0.025, 8, 24);
  function ballOn() {
    if (toy) return;
    const g = new THREE.Group(), m = new THREE.Mesh(toyGeo, toyMat); m.castShadow = true; g.add(m);
    const b1 = new THREE.Mesh(toyBandGeo, toyBand), b2 = new THREE.Mesh(toyBandGeo, toyBand); b2.rotation.y = Math.PI / 2; g.add(b1, b2);
    const h = main.group.rotation.y || 0, [x, z] = collide(me.x + Math.sin(h) * 0.9, me.z + Math.cos(h) * 0.9);
    toy = { g, x, z, y: 1.2, vx: 0, vz: 0, vy: 0, cd: 0 }; g.position.set(x, 1.2, z); scene.add(g);
  }
  function ballOff() { if (!toy) return; scene.remove(toy.g); toy = null; }
  function tickToy(dt) {
    if (!toy) return;
    const R = 0.15; toy.cd = Math.max(0, toy.cd - dt);
    toy.vy -= 9.8 * dt; toy.y += toy.vy * dt;
    if (toy.y < R) { toy.y = R; toy.vy = Math.abs(toy.vy) > 0.6 ? -toy.vy * 0.55 : 0; toy.vx *= 0.96; toy.vz *= 0.96; }
    const fr = toy.y <= R + 0.01 ? Math.max(0, 1 - dt * 1.1) : 1; toy.vx *= fr; toy.vz *= fr;
    const nx = toy.x + toy.vx * dt, nz = toy.z + toy.vz * dt, [cx, cz] = collide(nx, nz);
    if (Math.abs(cx - nx) > 1e-4) toy.vx = -toy.vx * 0.7; if (Math.abs(cz - nz) > 1e-4) toy.vz = -toy.vz * 0.7;   // tumatalbog sa dingding at gamit
    toy.x = cx; toy.z = cz;
    // sipa ni Tigo
    const dx = toy.x - me.x, dz = toy.z - me.z, d = Math.hypot(dx, dz), sp = Math.hypot(me.vx || 0, me.vz || 0);
    if (d < 0.42 && toy.y < 0.6 && toy.cd <= 0 && pose === "stand" && !inside) { const k = 2.4 + sp * 1.4; toy.vx = (dx / (d || 1)) * k; toy.vz = (dz / (d || 1)) * k; toy.vy = 2.2 + sp * 0.4; toy.cd = 0.35; if (opts.onKick) opts.onKick(); }
    // sundot ng alaga (ibinabalik kay Tigo)
    if (buddy && !buddy.flies) { const p = buddy.group.position, ex = toy.x - p.x, ez = toy.z - p.z, e = Math.hypot(ex, ez);
      if (e < 0.32 && toy.y < 0.45 && toy.cd <= 0) { const tx = me.x - toy.x, tz = me.z - toy.z, td = Math.hypot(tx, tz) || 1; toy.vx = (tx / td) * 2.2; toy.vz = (tz / td) * 2.2; toy.vy = 1.4; toy.cd = 0.5; buddy.hop(); } }
    const v = Math.hypot(toy.vx, toy.vz); toy.g.position.set(toy.x, toy.y, toy.z);
    if (v > 0.01) { const ax = new THREE.Vector3(toy.vz, 0, -toy.vx).normalize(); toy.g.rotateOnWorldAxis(ax, (v * dt) / R); }
  }

  // ---------- galaw ----------
  let input = () => ({ x: 0, z: 0 }), running = () => false;
  let auto = null; // { x, z, done } — kusang lakad (papunta sa bahay)
  let isNight = false, inside = false; // inside = tulog sa kama (hindi gumagalaw)
  let inRoom = false, room = null, roomData = null, doorState = null, floorN = 1, stair = null;
  const rooms = [null, null, null];   // [_, 1st floor, 2nd floor]
  const DEF1 = [{ id: "bed", x: -1.9, z: -1.4, r: 0 }, { id: "rug", x: 0.3, z: 0.2, r: 0 }, { id: "plant", x: 2.4, z: -1.9, r: 0 }, { id: "lamp", x: -0.7, z: -1.9, r: 0 }];
  const DEF2 = [{ id: "rug", x: 0.6, z: 0.3, r: 0 }, { id: "plant", x: 1.2, z: 3.9, r: 0 }, { id: "chair", x: -1.0, z: 3.8, r: 0 }];
  function collide(x, z) {
    if (inRoom) return room.collide(x, z);
    // bawal lumabas sa isla at bawal tumagos sa bahay
    const d = Math.hypot(x, z); if (d > RADIUS) { x *= RADIUS / d; z *= RADIUS / d; }
    const hx = x - HOUSE.x, hz = z - HOUSE.z, hd = Math.hypot(hx, hz);
    if (hd < HOUSE.r && !auto) { x = HOUSE.x + (hx / (hd || 1)) * HOUSE.r; z = HOUSE.z + (hz / (hd || 1)) * HOUSE.r; }
    // lawa, taniman, poste ng ilaw: iniikutan (hindi kapag kusang lakad papunta sa pinto)
    if (!auto && place) for (const o of place.obstacles) { const ox = x - o.x, oz = z - o.z, od = Math.hypot(ox, oz); if (od < o.r) { x = o.x + (ox / (od || 1)) * o.r; z = o.z + (oz / (od || 1)) * o.r; } }
    return [x, z];
  }
  function moveMain(dt, sg) {
    if (task) { taskStep(dt); return; }
    if (rise) { riseStep(dt); return; }
    if (stair) { stairStep(dt); return; }
    if (inside) return;
    if (pose === "sit") { // nakaupo: tatayo kapag ginalaw ang joystick
      const i = input(); if (Math.hypot(i.x, i.z) > 0.35 && !isNight) standUp(); else { main.walk(0); return; }
    }
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
      // naharangan (hal. nasa likod ng sofa ang daan): kung walang usad nang 0.9 s, ituloy na ang gagawin (uupo/hihiga rin naman sa mismong puwesto)
      if (auto.best === undefined || d < auto.best - 0.04) { auto.best = d; auto.stuck = 0; } else auto.stuck = (auto.stuck || 0) + dt;
      if (d < 0.08 || (inRoom && auto.stuck > 0.9)) { const cb = auto.done; auto = null; cb && cb(); return; }
      ix = dx / d; iz = dz / d; if (d < 0.4) { ix *= d / 0.4 + 0.3; iz *= d / 0.4 + 0.3; }
    } else if (!isNight) {
      // direksyon ayon sa camera: taas ng joystick = palayo sa camera
      const i = input(), y = rig.yaw(), c = Math.cos(y), s_ = Math.sin(y);
      ix = i.x * c + i.z * s_; iz = -i.x * s_ + i.z * c;
    }
    const speed = 2.1 * (riding ? RIDE_SPEED[riding.id] || 1.6 : !sg && !auto && running() ? 1.75 : 1);
    const acc = riding ? 3.2 : 10;   // sasakyan: may bigat (dahan-dahang bumibilis at humihinto)
    me.vx += (ix * speed - me.vx) * Math.min(1, dt * acc); me.vz += (iz * speed - me.vz) * Math.min(1, dt * acc);
    const v = Math.hypot(me.vx, me.vz);
    if (riding) { rideStep(dt, v); doorCheck(ix, iz); return; }
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

  // ---------- 🛁 paligo · 🍳 luto · 🍽️ kain sa mesa · 🎮 laro sa PC (0.11.54) ----------
  // task = { t, dur, step(t), end() } — habang may task, hindi gumagalaw si Tigo (tapos kusa pagkalipas ng dur segundo)
  let task = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function taskStep(dt) { task.t += dt; task.step(task.t, dt); if (task.t >= task.dur) { const q = task; task = null; q.end(); } }
  function startTask(o) { task = Object.assign({ t: 0 }, o); }
  function nearThing(kind) { const r = inRoom && room.near ? room.near(me.x, me.z) : null; return r && r.kind === kind ? r : null; }
  // 🛁 papasok sa shower (nakatayo, may patak ng tubig) o sa bathtub/jacuzzi (nakaupo sa tubig, may bula); done() pagkatapos
  function bathe(done) {
    const r = nearThing("bath"); if (!r || pose !== "stand" || task || (auto && auto.task)) return false;
    const [sx, sz] = room.collide(r.stand.x, r.stand.z);
    walkTo(sx, sz, () => {
      const kid = main.kind() !== "tigo", tub = r.tier > 1, g = r.group;
      const back = () => { g.userData.washing = false; main.sitPose(false); main.hold(null); main.group.rotation.x = 0; main.group.position.set(r.stand.x, 0, r.stand.z); me.x = r.stand.x; me.z = r.stand.z; main.face(r.face + Math.PI); main.wiggle(); effect("sparkle"); };
      main.face(r.face + Math.PI); g.userData.washing = true; me.x = r.x; me.z = r.z;   // papasok
      startTask({ dur: 4.2,
        step(t) {
          const k = Math.min(1, t / 0.5);
          if (tub) { main.sitPose(true); main.group.position.set(r.x, (kid ? -0.2 : 0.12) * sizeK * k, r.z); main.group.rotation.y = r.r; main.face(r.r); }
          else { main.group.position.set(r.x, 0.06, r.z); main.group.rotation.y = r.r + Math.sin(t * 2) * 0.6; main.face(main.group.rotation.y); }
          if (t > 0.6 && Math.floor(t * 2.5) !== Math.floor((t - 0.016) * 2.5)) { if (tub) effect("bubbles"); else main.wiggle(); }
          if (kid && !tub) { const h = main.group.rotation.y, c = Math.cos(h), s_ = Math.sin(h), y = (1.85 + Math.sin(t * 9) * 0.06) * sizeK; main.hold([V(r.x + c * 0.18, y, r.z - s_ * 0.18), V(r.x - c * 0.18, y, r.z + s_ * 0.18)]); }   // kuskos sa ulo
        },
        end() { back(); done && done(); } });
    });
    auto.task = true; return true;
  }
  // 🍳 lulutuin sa kalan: tatayo sa harap, apoy + kawali + usok, kamay sa kawali; pagkatapos: kain
  function cookAt(done) {
    const r = nearThing("cook"); if (!r || pose !== "stand" || task || (auto && auto.task)) return false;
    const [sx, sz] = room.collide(r.stand.x, r.stand.z);
    walkTo(sx, sz, () => {
      const g = r.group; g.userData.cooking = true; main.face(r.face); main.group.rotation.y = r.face;
      startTask({ dur: 3.6,
        step(t) {
          main.group.rotation.y = r.face; main.face(r.face);
          const pan = V(0, 0, 0); g.children.forEach((c) => { if (c.isGroup && c.visible && c.children.length > 6) c.getWorldPosition(pan); });
          if (pan.lengthSq() === 0) g.getWorldPosition(pan).setY(r.top + 0.1);
          const st = Math.sin(t * 7) * 0.05; main.hold([V(pan.x - 0.12, pan.y + 0.12 + st, pan.z), V(pan.x + 0.18, pan.y + 0.1 - st, pan.z)]);   // hinahalo
        },
        end() { g.userData.cooking = false; main.hold(null); effect("food"); setTimeout(() => main.eat(), 400); done && done(); } });
    });
    auto.task = true; return true;
  }
  // nakaupo at may mesa/desk sa harap?
  function facingTable(ids) {
    if (!inRoom || pose !== "sit" || !room.tableNear) return null;
    const q = room.tableNear(me.x, me.z, ids); if (!q) return null;
    const a = Math.atan2(q.x - me.x, q.z - me.z) - main.group.rotation.y; return Math.cos(a) > 0.3 ? q : null;
  }
  // 🍽️ kain sa mesa: plato sa harap ni Tigo, kutsara papunta sa bibig (3 subo)
  let plate = null;
  function makePlate() {
    plate = new THREE.Group(); scene.add(plate);
    const pm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), fm = [0xfff3e0, 0xff7a59, 0x7bc043].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    const pg = new THREE.CylinderGeometry(0.17, 0.12, 0.03, 24), fg = new THREE.SphereGeometry(0.055, 10, 8); disp.push(pm, pg, fg, ...fm);
    plate.add(new THREE.Mesh(pg, pm)); [[0, 0.04, 0], [0.07, 0.035, 0.04], [-0.06, 0.035, 0.05]].forEach(([x, y, z], i) => { const m = new THREE.Mesh(fg, fm[i]); m.position.set(x, y, z); m.scale.y = i ? 0.6 : 0.9; plate.add(m); });
  }
  function eatAtTable(done) {
    const q = facingTable(["table"]); if (!q || task) return false;
    const h = main.group.rotation.y, d = Math.max(0.3, Math.hypot(q.x - me.x, q.z - me.z) - 0.25), px = me.x + Math.sin(h) * Math.min(d, 0.55), pz = me.z + Math.cos(h) * Math.min(d, 0.55);
    if (!plate) makePlate(); plate.position.set(px, q.top + 0.08, pz); plate.visible = true; plate.children.forEach((c) => { c.visible = true; });
    startTask({ dur: 4.0,
      step(t) {
        const k = (t % 1.3) / 1.3, up = k > 0.35 && k < 0.75, y = main.group.position.y + (up ? 1.45 : 0.95) * sizeK;   // subo: kamay papunta sa bibig
        const mx = me.x + Math.sin(h) * 0.22, mz = me.z + Math.cos(h) * 0.22, c = Math.cos(h), s_ = Math.sin(h);
        main.hold([up ? V(mx + c * 0.05, y, mz - s_ * 0.05) : V(px + c * 0.1, q.top + 0.12, pz - s_ * 0.1), V(px - c * 0.16, q.top + 0.1, pz + s_ * 0.16)]);
        const bite = Math.floor((t - 0.6) / 1.3); if (bite >= 0 && bite !== task.bite) { task.bite = bite; main.eat(); }
        if (Math.floor(t / 1.3) >= 1) plate.children[1 + Math.min(2, Math.floor(t / 1.3) - 1)].visible = false;   // nauubos ang pagkain
      },
      end() { main.hold(null); plate.visible = false; effect("hearts"); done && done(); } });
    return true;
  }

  // ---------- pinto: pasok / labas ng bahay ----------
  function setDoor(st) { if (st !== doorState) { doorState = st; if (opts.onDoor) opts.onDoor(st); } }
  function doorCheck(ix, iz) {
    if (auto || show || game) return;
    if (inRoom) {
      setDoor("room");
      // lumakad palabas sa pinto (harap ng kwarto)
      if (floorN === 1 && !isNight && Math.abs(me.x - ROOM.door.x) < 0.5 && me.z > ROOM.d / 2 - 0.6 && iz > 0.5) leaveRoom();
      // lakad papunta sa hagdan = akyat (1F: papunta sa likod) / baba (2F: papunta sa butas)
      const sn = !isNight && room.stairsNear ? room.stairsNear(me.x, me.z) : null;
      if (sn === "up" && iz < -0.6 && Math.abs(me.x - room.stairs.base.x) < 0.45) climb();
      if (sn === "down" && ix < -0.6) climb();
      return;
    }
    const d = Math.hypot(me.x - HOUSE.door.x, me.z - HOUSE.door.z);
    setDoor(d < 0.75 ? "near" : null);
    // lumakad papunta sa pinto = pasok
    if (d < 0.32 && !isNight) { const hx = HOUSE.x - me.x, hz = HOUSE.z - me.z, hl = Math.hypot(hx, hz) || 1; if ((ix * hx + iz * hz) / hl > 0.5) enterRoom(); }
  }
  // gawin ang kwarto ng isang palapag (kung wala pa) at punuin galing sa roomData; fill = palitan ang laman (bagong data galing sa server)
  function ensureRoom(f = floorN, fill = false) {
    if (f === 2 && !hasStairs(houseLv)) f = 1;
    let R = rooms[f];
    if (!R) { R = rooms[f] = buildRoom(houseLv, { floor: f }); R.group.visible = false; scene.add(R.group); fill = true; }
    if (fill) {
      const d = roomData || {}, r = f === 2 ? d.up || {} : d;
      R.setBedding(d.bed || null); R.setStyle(r.wall, r.floor);
      R.setItems(f === 2 ? (Array.isArray(r.items) ? r.items : DEF2) : r.items && r.items.length ? r.items : DEF1);
    }
    if (f === floorN) room = R;
    return R;
  }
  // ---------- 🪜 hagdan: akyat / baba (Villa at Mansion) ----------
  function goFloor(f, at) {
    if (!inRoom || f === floorN) return;
    const R = ensureRoom(f); if (room) { room.group.visible = false; room.select(null); }
    floorN = f; room = R; R.group.visible = true; blanketOff();
    const q = at || (f === 2 ? R.stairs.top : R.stairs.base); me.x = q.x; me.z = q.z; me.vx = me.vz = 0; main.group.position.set(me.x, q.y || 0, me.z);
    if (buddy) buddy.group.position.set(me.x + 0.5, 0, me.z + 0.4);
    if (opts.onFloor) opts.onFloor(f);
  }
  function climb() {
    if (!inRoom || stair || rise || pose !== "stand" || !room.stairs) return false;
    const R = room, up = floorN === 1, q = up ? R.stairs.base : R.stairs.top, topZ = -ROOM.d / 2 + 0.45, H = ROOM.h - 0.1;
    const go = () => {
      if (up) stair = { t: 0, T: 1.2, a: { x: q.x, y: 0, z: q.z }, b: { x: q.x, y: H, z: topZ }, face: Math.PI, then: () => goFloor(2) };
      else { goFloor(1, { x: R.stairs.base.x, y: H, z: topZ }); stair = { t: 0, T: 1.2, a: { x: R.stairs.base.x, y: H, z: topZ }, b: { x: R.stairs.base.x, y: 0, z: R.stairs.base.z }, face: 0, then: null }; }
      auto = null; main.face(stair.face); main.group.rotation.y = stair.face;
    };
    if (Math.hypot(me.x - q.x, me.z - q.z) > 0.3) walkTo(q.x, q.z, go); else go();
    return true;
  }
  function stairStep(dt) {
    const S = stair; S.t += dt; const k = Math.min(1, S.t / S.T);
    me.x = S.a.x + (S.b.x - S.a.x) * k; me.z = S.a.z + (S.b.z - S.a.z) * k;
    main.group.position.set(me.x, S.a.y + (S.b.y - S.a.y) * k, me.z); main.walk(0.7, S.face);
    if (buddy) { const bp = buddy.group.position; bp.x += (me.x - 0.5 - bp.x) * 0.1; bp.z += (me.z + 0.4 - bp.z) * 0.1; }
    if (k >= 1) { stair = null; main.group.position.y = 0; main.walk(0); const fn = S.then; if (fn) fn(); main.face(floorN === 2 ? Math.PI / 2 : 0); }
  }
  function enterRoom(instant) {
    ballOff(); if (riding) dismount();
    if (inRoom || game) return;
    if (!instant && !auto && Math.hypot(me.x - HOUSE.door.x, me.z - HOUSE.door.z) > 0.4) { walkTo(HOUSE.door.x, HOUSE.door.z, () => enterRoom(true)); return; }
    if (rooms[2]) rooms[2].group.visible = false;
    floorN = 1; ensureRoom(1);
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
    ballOff(); blanketOff(); rise = null; stair = null;
    if (!inRoom) return;
    inRoom = false; inside = false; auto = null;
    room.group.visible = false; room.select(null);
    if (floorN !== 1) { floorN = 1; room = rooms[1]; if (opts.onFloor) opts.onFloor(1); }
    if (place) place.group.visible = true;
    friends.forEach((f) => { f.t.group.visible = true; });
    standUp();
    me.x = HOUSE.door.x; me.z = HOUSE.door.z + 0.15; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z);
    if (buddy) buddy.group.position.set(me.x + 0.5, 0, me.z + 0.3);
    if (!instant) walkTo(HOUSE.door.x - 0.3, HOUSE.door.z + 0.95, () => { main.face(0); main.jump(); });
    setDoor(null);
    if (opts.onRoom) opts.onRoom(false);
  }
  // ---------- sa labas: mga puwedeng gawin (upuan, lawa, taniman, puno) ----------
  function spotNear() {
    if (inRoom || inside || game || show || !place || !place.spots) return null;
    let best = null, bd = 1e9;
    for (const q of place.spots) { const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < q.r && d - (q.kind === "tree" ? 0.6 : 0) < bd && (q.kind !== "tree" || q.ready)) { bd = d - (q.kind === "tree" ? 0.6 : 0); best = q; } }
    return best;
  }
  // pamingwit: tungkod, pisi at palutang sa lawa (lumalabas habang nangingisda)
  const rod = new THREE.Group(); rod.visible = false; scene.add(rod);
  const rodM = new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: 0.7 }), lineM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }), bobM = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 1, 6), rodM), line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 4), lineM), bob = new THREE.Group();
  bob.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), bobM)); const bobTop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff })); bobTop.position.y = 0.04; bob.add(bobTop);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ripple.rotation.x = -Math.PI / 2;
  rod.add(pole, line, bob, ripple);
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function stick(m, a, b) { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = a.distanceTo(b); m.quaternion.setFromUnitVectors(_up, _b.copy(b).sub(a).normalize()); }
  let bobAt = null;
  function setFishing(on, spot) { fishing = !!on; rod.visible = fishing; biteT = 0; if (on && spot) bobAt = spot.bob; }
  function tickRod(t) {
    if (!fishing || !bobAt) return;
    const h = main.group.rotation.y, k = sizeK, hand = _a.set(me.x + Math.sin(h) * 0.25 * k + Math.cos(h) * 0.3 * k, main.group.position.y + 0.95 * k, me.z + Math.cos(h) * 0.25 * k - Math.sin(h) * 0.3 * k);
    const tip = new THREE.Vector3(hand.x + (bobAt.x - hand.x) * 0.45, hand.y + 0.75, hand.z + (bobAt.z - hand.z) * 0.45);
    const dip = biteT > 0 ? -0.07 - Math.abs(Math.sin(t * 22)) * 0.05 : Math.sin(t * 2) * 0.012;
    bob.position.set(bobAt.x, 0.05 + dip, bobAt.z);
    stick(pole, hand.clone(), tip); stick(line, tip, bob.position.clone());
    ripple.position.set(bobAt.x, 0.02, bobAt.z); const rp = (t * (biteT > 0 ? 2.2 : 0.5)) % 1; ripple.scale.setScalar(1 + rp * 2.2); ripple.material.opacity = (1 - rp) * (biteT > 0 ? 0.9 : 0.35);
  }
  // higa sa kama / bangon
  function lieDown() {
    const b = room && room.bedSpot();
    inside = true; me.vx = me.vz = 0; main.walk(0);
    main.group.rotation.order = "YXZ";
    if (b) { me.x = b.x; me.z = b.z; main.group.position.set(b.x, b.y, b.z); main.face(b.face); main.group.rotation.y = b.face; }
    else { main.face(0); main.group.position.y = 0.12; }
    main.group.rotation.x = -1.45; main.group.scale.setScalar(0.78 * sizeK); // nakahiga (medyo maliit para kasya sa kama)
    // Ulo sa UNAN: ang haba ng katawan ay depende sa laki (level) at sa avatar, kaya iniaatras ang paa hanggang umabot ang ulo sa unan
    if (b) { const len = 1.72 * 0.78 * sizeK, off = Math.min(0.72, -0.6 + len * 0.9), bx = b.x - Math.sin(b.face) * (0.72 - off), bz = b.z - Math.cos(b.face) * (0.72 - off); me.x = bx; me.z = bz; main.group.position.set(bx, b.y, bz); }
    seat = null; setPose("bed");
    blanketOn(b);
  }
  // ---------- kumot: tinatakpan si Tigo hanggang dibdib habang tulog; tinitiklop papunta sa paanan kapag bumangon ----------
  let blanket = null, blanketKey = "";
  function blanketOn(b) {
    if (!b || !b.c || !inRoom) return;
    const id = ((roomData || {}).bed || {}).blanket || DEF_BED.blanket, key = id + "|" + sizeK;
    if (blanket && blanketKey !== key) { scene.remove(blanket.group); blanket.dispose(); blanket = null; }
    if (!blanket) { blanket = sleepBlanket(id, sizeK); blanketKey = key; scene.add(blanket.group); }
    const dx = Math.sin(b.face), dz = Math.cos(b.face);
    blanket.group.position.set(b.c.x - dx * 0.5, 0.5, b.c.z - dz * 0.5);   // mula sa ilalim ng unan (dibdib) hanggang paanan
    blanket.group.rotation.set(0, b.face, 0); blanket.group.scale.set(1, 1, 1); blanket.group.visible = true;   // 0.11.52: dati nasa loob ng komento ang linyang ito (kaya hindi lumilitaw ang kumot)
    if (room) room.cover(false);
  }
  function blanketOff() { if (blanket) blanket.group.visible = false; rooms.forEach((R) => { if (R) R.cover(true); }); }
  // ---------- bangon na parang tao: tiklop ng kumot → upo sa gilid ng kama → tayo sa tabi ----------
  let rise = null;
  const ease = (x) => x * x * (3 - 2 * x), lerpA = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k; };
  function riseStart(b) {
    const kid = main.kind() !== "tigo", sx = Math.cos(b.face), sz = -Math.sin(b.face), out = Math.atan2(sx, sz);
    rise = { t: 0, kid, b,
      A: { x: main.group.position.x, y: main.group.position.y, z: main.group.position.z, rx: main.group.rotation.x, ry: main.group.rotation.y, s: main.group.scale.x },
      B: { x: b.c.x + sx * 0.42, y: 0.46 - (kid ? 0.47 : 0.12) * sizeK, z: b.c.z + sz * 0.42, rx: kid ? 0 : -0.22, ry: out, s: sizeK },
      C: { x: b.beside.x, y: 0, z: b.beside.z, rx: 0, ry: out, s: sizeK }, sat: false, stood: false };
    me.vx = me.vz = 0; auto = null;
  }
  function riseStep(dt) {
    const R = rise, T = 1.25; R.t += dt; const k = Math.min(1, R.t / T);
    if (blanket && blanket.group.visible) { const f = Math.min(1, R.t / 0.45); blanket.group.scale.z = 1 - 0.55 * ease(f); }
    let P, Q, q;
    if (k < 0.55) { P = R.A; Q = R.B; q = ease(Math.max(0, (k - 0.12) / 0.43)); if (!R.sat && k > 0.3) { R.sat = true; main.sitPose(true); } }
    else { P = R.B; Q = R.C; q = ease((k - 0.55) / 0.45); if (!R.stood && k > 0.62) { R.stood = true; main.sitPose(false); } }
    const hop = k > 0.55 ? Math.sin(q * Math.PI) * 0.12 : 0;
    main.group.position.set(P.x + (Q.x - P.x) * q, P.y + (Q.y - P.y) * q + hop, P.z + (Q.z - P.z) * q);
    main.group.rotation.x = P.rx + (Q.rx - P.rx) * q; main.group.rotation.y = lerpA(P.ry, Q.ry, q); main.face(main.group.rotation.y);
    main.group.scale.setScalar(P.s + (Q.s - P.s) * q);
    if (k >= 1) {
      rise = null; me.x = R.C.x; me.z = R.C.z; main.group.position.set(me.x, 0, me.z); main.group.rotation.x = 0; main.group.scale.setScalar(sizeK);
      main.sitPose(false); setPose("stand"); main.jump();
      setTimeout(() => { if (pose !== "bed" && blanket) blanketOff(); }, 700);
    }
  }
  // upo: sa pinakamalapit na upuan (lalakad muna doon) o sa sahig
  // target = upuan sa labas (bench) kung meron; kung wala: pinakamalapit na upuan sa bahay, o sa sahig
  function sit(target) {
    if (inside || game || show || pose !== "stand" || riding || rise) return false;
    const s = target || (inRoom && room.seatNear(me.x, me.z));
    const sitAt = (st) => {
      auto = null; me.vx = me.vz = 0; main.walk(0); main.group.rotation.order = "YXZ";
      seat = st;
      const kid = main.kind() !== "tigo"; main.sitPose(true);   // Kid: tunay na upo (pasulong ang binti, tuwid ang likod); note: bahagyang nakasandal
      if (st) { me.x = st.x; me.z = st.z; main.group.position.set(st.x, st.y - (kid ? 0.47 : 0.12) * sizeK, st.z); main.face(st.face); main.group.rotation.y = st.face; main.group.rotation.x = kid ? 0 : -0.22; }
      else {
        const tv = inRoom && room.tvNear ? room.tvNear(me.x, me.z) : null, fy = tv ? Math.atan2(tv.x - me.x, tv.z - me.z) : rig.yaw();   // may TV sa malapit → humarap doon (nanonood)
        main.group.position.y = (kid ? -0.47 : -0.14) * sizeK; main.face(fy); if (tv) main.group.rotation.y = fy; main.group.rotation.x = kid ? 0 : -0.3;
      }
      setPose("sit");
    };
    if (s) walkTo(s.front.x, s.front.z, () => sitAt(s)); else sitAt(null);
    return true;
  }
  function standUp() {
    const was = pose; seat = seat || null;
    if (was === "bed" && inRoom && !opts.reduced && !rise) { const b = room && room.bedSpot(); if (b && b.c) { riseStart(b); return; } }   // dahan-dahang bangon
    if (was === "bed") blanketOff();
    main.sitPose(false);
    if (main.group.rotation.x !== 0 || main.group.position.y !== 0) {
      main.group.rotation.x = 0; main.group.rotation.z = 0; main.group.position.y = 0; main.group.scale.setScalar(sizeK);
      const b = room && room.bedSpot();
      if (was === "sit" && seat) { if (seat.front) { me.x = seat.front.x; me.z = seat.front.z; } main.group.position.set(me.x, 0, me.z); }
      else if (b && inRoom && was === "bed") { me.x = b.beside.x; me.z = b.beside.z; main.group.position.set(me.x, 0, me.z); }
    }
    seat = null; setFishing(false); setPose("stand");
  }

  // ---------- 🚲 sasakyan: nakaparada sa tabi ng bahay; "Ride" → sakay (mas mabilis), "Get off" → baba ----------
  const rides = new Map(); let riding = null, ridesKey = "";
  // puwesto ng paradahan: paikot sa harap ng bahay (kanan at kaliwa ng daan), hindi tumatama sa bahay, puno, lawa o ibang sasakyan
  function parkSpot(rr, taken) {
    const D = HOUSE.door, a0 = Math.atan2(D.x - HOUSE.x, D.z - HOUSE.z);
    for (const dist of [1.7, 2.4, 3.1, 3.8, 4.5]) for (const da of [0.75, -0.75, 1.15, -1.15, 1.5, -1.5, 0.45, -0.45, 1.9, -1.9, 0.2, -0.2]) {
      const a = a0 + da, x = D.x + Math.sin(a) * dist, z = D.z + Math.cos(a) * dist, [cx, cz] = collide(x, z);
      if (Math.hypot(cx - x, cz - z) > 0.02 || Math.hypot(x, z) > RADIUS - 0.6 - rr) continue;
      if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < HOUSE.r + rr + 0.1) continue;
      if (taken.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + rr + 0.35)) continue;
      if (place && place.spots && place.spots.some((q) => Math.hypot(q.x - x, q.z - z) < (q.kind === "tree" ? 0.8 : q.r) + rr * 0.6)) continue;   // hindi sa taniman, lawa, upuan o puno
      return { x, z, h: a0 + (da > 0 ? 1.4 : -1.4) };
    }
    return { x: D.x + Math.sin(a0) * 1.5, z: D.z + Math.cos(a0) * 1.5, h: a0 };
  }
  function setRides(ids) {
    const want = (ids || []).filter((x) => RIDE_SPEED[x]), key = want.join(",");
    if (key === ridesKey) return; ridesKey = key;
    [...rides.keys()].forEach((id) => { if (!want.includes(id)) { const q = rides.get(id); if (riding === q) dismount(); scene.remove(q.v.group); q.v.dispose(); rides.delete(id); } });
    want.forEach((id) => { if (rides.has(id)) return; const v = buildRide(id), K = RIDE_KS[id] || 1; v.K = K; v.group.scale.setScalar(K); v.r *= K; const sp = parkSpot(v.r, [...rides.values()].map((q) => ({ x: q.x, z: q.z, r: q.v.r }))); v.group.position.set(sp.x, 0, sp.z); v.group.rotation.y = sp.h; scene.add(v.group); rides.set(id, { id, v, x: sp.x, z: sp.z, h: sp.h }); });
  }
  function nearRide() {
    if (riding || inRoom || inside || game) return null;
    let best = null, bd = 1e9; rides.forEach((q) => { const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < q.v.r + 0.75 && d < bd) { bd = d; best = q; } }); return best;
  }
  function mount(id) {
    const q = rides.get(id); if (!q || riding || inRoom || game || pose !== "stand") return false;
    auto = null; riding = q; me.x = q.x; me.z = q.z; me.vx = me.vz = 0; main.walk(0); main.sitPose(true); main.group.rotation.x = 0; if (main.ridePose) main.ridePose(q.id, 0, 0);
    if (opts.onRide) opts.onRide(q.id); return true;
  }
  function dismount() {
    const q = riding; if (!q) return false; riding = null;
    main.sitPose(false); if (main.ridePose) main.ridePose(null); main.group.position.y = 0; main.group.rotation.x = 0;
    const sx = Math.cos(q.h), sz = -Math.sin(q.h); [me.x, me.z] = collide(q.x - sx * (q.v.r + 0.25), q.z - sz * (q.v.r + 0.25));
    main.group.position.set(me.x, 0, me.z); main.jump(); q.v.lights(false);
    if (opts.onRide) opts.onRide(null); return true;
  }
  function rideStep(dt, v) {
    const q = riding;
    const h0 = q.h;
    if (v > 0.05) { [me.x, me.z] = collide(me.x + me.vx * dt, me.z + me.vz * dt); q.h = lerpA(q.h, Math.atan2(me.vx, me.vz), Math.min(1, dt * 4)); }
    let turn = Math.atan2(Math.sin(q.h - h0), Math.cos(q.h - h0)) / Math.max(dt, 1e-3); turn = Math.max(-1, Math.min(1, turn / 2.5));
    q.x = me.x; q.z = me.z; q.v.group.position.set(q.x, 0, q.z); q.v.group.rotation.y = q.h; q.v.group.rotation.z = -turn * (q.id === "car" ? 0.02 : 0.12) * Math.min(1, v / 2); q.v.update(dt, v / q.v.K); q.v.lights(isNight);
    // nakaupo mismo sa upuan (balakang sa upuan), hawak ang manibela; pumapadyak sa bike; humihilig kapag lumiliko
    const kid = main.kind() !== "tigo", c = Math.cos(q.h), s_ = Math.sin(q.h), K = q.v.K, lx = (q.v.seat.x || 0) * K, lz = q.v.seat.z * K;
    main.walk(0); main.face(q.h); main.group.rotation.y = q.h;
    q.v.group.updateMatrixWorld(true); const grips = (q.v.grips || []).map((g) => new THREE.Vector3(g[0], g[1], g[2]).applyMatrix4(q.v.group.matrixWorld));
    if (main.ridePose) main.ridePose(q.id, v, turn, grips);
    main.group.position.set(q.x + c * lx + s_ * lz, q.v.seat.y * K - (kid ? 0.45 : 0.1) * sizeK, q.z - s_ * lx + c * lz);
  }
  // ---------- 💧 pagdidilig: pandilig sa kamay + tilamsik ng tubig sa taniman ----------
  const can = new THREE.Group(); can.visible = false; scene.add(can);
  { const cm = new THREE.MeshStandardMaterial({ color: 0x5fb3e8, metalness: 0.3, roughness: 0.4 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 14), cm); can.add(b);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.024, 0.28, 8), cm); sp.position.set(0, 0.04, 0.17); sp.rotation.x = 1.0; can.add(sp);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.03, 10), cm); rose.position.set(0, 0.13, 0.29); rose.rotation.x = 1.0; can.add(rose);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 6, 14, Math.PI), cm); hd.position.set(0, 0.1, -0.04); hd.rotation.y = Math.PI / 2; can.add(hd); }
  const drops = [], dropGeo = new THREE.SphereGeometry(0.025, 6, 5), dropMat = new THREE.MeshStandardMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.8, roughness: 0.1 });
  let waterT = 0, waterAt = null;
  function water() {
    const q = place && place.spots && place.spots.find((x) => x.kind === "garden"); if (!q || inRoom || game) return false;
    if (riding) dismount();
    const go = () => { waterT = 2.6; waterAt = q; main.face(Math.atan2(q.x - me.x, q.z - me.z)); main.group.rotation.y = Math.atan2(q.x - me.x, q.z - me.z); };
    if (Math.hypot(q.x - me.x, q.z - me.z) > 1.7) walkTo(q.x + (me.x - q.x) * 0.5, q.z + (me.z - q.z) * 0.5, go); else go();
    return true;
  }
  function waterTick(dt) {
    if (waterT > 0) {
      waterT -= dt; const h = main.group.rotation.y, f = { x: Math.sin(h), z: Math.cos(h) }, tilt = Math.min(1, (2.6 - waterT) * 3) * Math.min(1, waterT * 3);
      can.visible = true; can.position.set(me.x + f.x * 0.32 + f.z * 0.12, 0.55 * sizeK, me.z + f.z * 0.32 - f.x * 0.12); can.rotation.set(0, h, 0); can.rotateX(0.75 * tilt);
      if (tilt > 0.6) for (let i = 0; i < 2; i++) {
        const m = new THREE.Mesh(dropGeo, dropMat), sp = can.localToWorld(new THREE.Vector3(0, 0.13, 0.3)); m.position.copy(sp); scene.add(m);
        drops.push({ m, vx: f.x * (0.9 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.4, vy: -0.2 + Math.random() * 0.3, vz: f.z * (0.9 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.4 });
      }
      if (waterT <= 0) { can.visible = false; if (opts.onWatered) opts.onWatered(); }
    }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.vy -= 9.8 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
      if (d.m.position.y < 0.08) { scene.remove(d.m); drops.splice(i, 1); } }
  }
  // ---------- antas ng bahay: lumalaki ang bahay sa labas at ang kwarto sa loob ----------
  function setHouse(level) {
    const L = Math.max(1, Math.min(4, Math.floor(level) || 1)); if (L === houseLv) return houseLv;
    houseLv = L; if (place) place.setHouse(L);
    if (rooms[1] || rooms[2]) {
      const was = inRoom; blanketOff(); stair = null;
      [1, 2].forEach((f) => { if (rooms[f]) { scene.remove(rooms[f].group); rooms[f].dispose(); rooms[f] = null; } });
      if (floorN === 2 && !hasStairs(L)) { floorN = 1; if (opts.onFloor) opts.onFloor(1); }
      room = null; ensureRoom(floorN, true); room.group.visible = was;
      if (was) { [me.x, me.z] = room.collide(me.x, me.z); main.group.position.set(me.x, main.group.position.y, me.z); }
    }
    // mga nakaparadang sasakyan: ilipat sa bagong puwesto (lumaki ang bahay)
    const taken = []; rides.forEach((q) => { if (q === riding) { taken.push({ x: q.x, z: q.z, r: q.v.r }); return; } const sp = parkSpot(q.v.r, taken); q.x = sp.x; q.z = sp.z; q.h = sp.h; taken.push({ x: q.x, z: q.z, r: q.v.r }); q.v.group.position.set(q.x, 0, q.z); q.v.group.rotation.y = q.h; });
    return houseLv;
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
    if (on && riding) dismount();
    if (on && pose === "sit") standUp(); // tatayo muna bago pumunta sa kama
    if (on && !inside) {
      // papasok sa bahay → lalakad sa kama → hihiga
      const toBed = () => {
        if (!room.bedSpot() && hasStairs(houseLv)) { const o = floorN === 2 ? 1 : 2, R = ensureRoom(o); if (R.bedSpot()) goFloor(o, o === 2 ? R.stairs.top : R.stairs.base); }
        const b = room.bedSpot();
        if (!animate || !b) { lieDown(); return; }
        walkTo(b.beside.x, b.beside.z, lieDown);
      };
      if (inRoom) toBed();
      else if (!animate) { enterRoom(true); lieDown(); }
      else walkTo(HOUSE.door.x, HOUSE.door.z, () => { enterRoom(true); toBed(); });
    } else if (!on && inside) {
      inside = false; standUp(); if (!rise) main.jump();
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
    ballOff(); if (riding) dismount();
    if (inRoom) leaveRoom(true);
    if (inside) inside = false;
    if (pose !== "stand") standUp();
    game = g; show = null; auto = null; main.walk(0); main.move(null); setDoor(null);
    [place && place.group, buddy && buddy.group, zzz, sky.group].concat(friends.map((f) => f.t.group), puppets.map((q) => q.t.group)).forEach((o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } });
    main.group.visible = true;
  }
  function endGame() {
    game = null; hidden.forEach((o) => { o.visible = true; }); hidden.length = 0;
    scene.add(main.group); main.group.scale.setScalar(sizeK); main.group.rotation.set(0, 0, 0); setPose("stand");
    me.x = 0; me.z = 0.4; me.vx = me.vz = 0; main.group.position.set(me.x, 0, me.z); main.walk(0); main.face(0);
    main.group.visible = true; zzz.visible = false;
    if (place) place.group.visible = !inRoom;
    sun.position.set(3.5, 6, 4); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  }
  scene.add(sun.target);
  const headV = new THREE.Vector3();
  function loop() {
    if (!alive) return;
    // 2D na laro sa ibabaw (💎 Gem Duel, 🧩 Sudoku): huwag mag-render ng 3D (mas mabilis at mas tipid sa phone)
    if (opts.el && (opts.el.classList.contains("dueling") || opts.el.classList.contains("game-sudoku"))) { clock.getDelta(); raf = requestAnimationFrame(loop); return; }
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (game) {
      game.tick(dt, t); main.update(dt, t); ticks.forEach((fn) => fn(dt, t)); updateFx(dt);
      game.cam(camera, dt); renderer.render(scene, camera); raf = requestAnimationFrame(loop); return;
    }
    moveMain(dt, updateShow(dt, t));
    updateDance(dt);
    moveFriends(dt);
    movePuppets(dt);
    pets.forEach((p) => p.update(opts.reduced ? dt * 0.4 : dt, t));
    const bedB = inRoom && pose === "bed" && room ? room.bedSpot() : null;
    rooms.forEach((R) => { if (R && R !== room) R.group.visible = false; });   // tulog si Tigo sa kama → ang alaga ay humihiga sa sahig sa tabi ng kama
    budStep(dt, t, bedB); tickToy(dt);
    rides.forEach((q) => { q.v.group.visible = !inRoom && !game && placeId !== ""; });
    waterTick(dt);
    if (place) place.update(t);
    tickRod(t);
    sky.update(t);
    if (inRoom) room.update(t, isNight, camera);
    ticks.forEach((fn) => fn(dt, t));
    zzz.children.forEach((z, i) => { const k = (t * 0.4 + i * 0.33) % 1; z.position.set(k * 0.3, k * 0.8, 0); z.material.opacity = 1 - k; });
    updateFx(dt);
    // araw (at anino) ay sumusunod kay Tigo: mas malaki na ang isla (0.11.52)
    sun.position.set(me.x + 3.5, 6, me.z + 4); sun.target.position.set(me.x, 0, me.z);
    // camera (camera-rig.js): sumusunod kay Tigo; ikot/zoom gamit ang joystick, mouse o pinch
    // layo ayon sa hugis ng screen: patayo (phone) = mas malayo para kasya ang isla (o ang kwarto)
    const half = inRoom ? Math.max(3.6, ROOM.w / 2 + 0.6) : 4.6, cz = Math.min(15, Math.max(camBase.z, half / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)));
    look.set(me.x, inside ? 0.6 : 0.95, me.z);
    rig.update(dt, look, Math.hypot(camBase.y * (cz / camBase.z), cz));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  setBackdrop(opts.backdrop || "island");
  resize(); loop();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  // Tigil ang 3D kapag nakatago ang app o bukas ang "Install new version" (para may memory ang download at hindi mag-crash)
  function vis() { if (document.hidden || document.documentElement.classList.contains("upd-open")) cancelAnimationFrame(raf); else { clock.getDelta(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } }
  document.addEventListener("visibilitychange", vis);
  document.addEventListener("tmn:upd", vis);

  return {
    main, add, remove, puppet, effect, buddyMode, setHouse, houseLevel() { return houseLv; }, setRides, ride(id) { return id ? mount(id) : dismount(); }, riding() { return riding ? riding.id : null; },
    water, watering() { return waterT > 0; }, rising() { return !!rise; }, blanketShown() { return !!(blanket && blanket.group.visible); },
    _blanket() { if (!blanket) return null; const b = new THREE.Box3().setFromObject(blanket.group), m = new THREE.Box3().setFromObject(main.group); return { b: [b.min.toArray(), b.max.toArray()], m: [m.min.toArray(), m.max.toArray()], bed: room && room.bedSpot() }; },
    rideSpot(id) { const q = rides.get(id); return q ? { x: q.x, z: q.z } : null; }, hasBuddy() { return !!buddy; },
    ball(on) { if (on) ballOn(); else ballOff(); return !!toy; }, ballActive() { return !!toy; },
    pickBuddy(x, y) { if (!buddy) return false; const r = new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(x, y), camera); return r.intersectObject(buddy.group, true).length > 0; },
    buddyScreen() { if (!buddy) return null; const v = buddy.group.position.clone(); v.y += 0.5; v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; }, night, renderer, scene, setBackdrop, setBuddy,
    together, hasFriends() { return friends.length > 0; }, isShowing() { return !!show; },
    beginGame, endGame, sun, camera, rig, inGame() { return !!game; },
    enterRoom() { if (!isNight) enterRoom(); }, leaveRoom() { if (!inside) leaveRoom(); }, inRoom() { return inRoom; },
    room() { return inRoom ? room : null; },
    bathe, cookAt, eatAtTable, busy() { return !!task || !!(auto && auto.task); },
    atTable() { return !!facingTable(["table"]); }, atDesk() { return !!facingTable(["desk"]); },   // nakaupo sa harap ng mesa / computer
    atPiano() { if (!inRoom || pose !== "sit" || !room.pianoNear) return false; const p = room.pianoNear(me.x, me.z); if (!p) return false; const a = Math.atan2(p.x - me.x, p.z - me.z) - main.group.rotation.y; return Math.cos(a) > 0.3; },   // tumutugtog
    watching() { if (!inRoom || pose !== "sit" || !room.tvNear) return false; const tv = room.tvNear(me.x, me.z); if (!tv) return false; const a = Math.atan2(tv.x - me.x, tv.z - me.z) - main.group.rotation.y; return Math.cos(a) > 0.2; },   // nakaupo at nakaharap sa TV
    setExterior(id) { extId = id || "ext-classic"; if (place && place.setLook) place.setLook(extId); return extId; },
    setRoom(d) { roomData = d || null; [1, 2].forEach((f) => { if (rooms[f]) ensureRoom(f, true); }); },
    floor() { return inRoom ? floorN : 0; }, setRoomExtra(o) { roomData = Object.assign({}, roomData || {}, o || {}); return roomData; }, climb, climbing() { return !!stair; },
    setBedding(b) { roomData = Object.assign({}, roomData || {}, { bed: b ? { blanket: b.blanket, pillow: b.pillow } : null }); rooms.forEach((R) => { if (R) R.setBedding(roomData.bed); }); if (blanket && pose === "bed") { blanketKey = ""; blanketOn(room.bedSpot()); } },
    // buong ayos ng bahay (1F + 2F + kumot/unan) para i-save; ina-update din ang roomData (para hindi bumalik sa luma kapag lumipat ng palapag)
    roomFull() {
      const d = roomData || {}, snap = (f) => { const R = rooms[f], r = f === 2 ? d.up || {} : d; if (!R) return { wall: r.wall || "wall-cream", floor: r.floor || "floor-planks", items: Array.isArray(r.items) ? r.items : f === 2 ? DEF2 : DEF1 }; const st = R.style(); return { wall: st.wall, floor: st.floor, items: R.list() }; };
      const out = Object.assign(snap(1), { bed: d.bed || null, ride: d.ride || null, ext: d.ext || null }); if (hasStairs(houseLv)) out.up = snap(2);
      roomData = out; return out;
    },
    aim(range = 3.6) {   // water gun: ano ang nasa harap (±35°) ni Tigo
      const h = main.group.rotation.y, fx = Math.sin(h), fz = Math.cos(h), out = [];
      const test = (kind, x, z, extra) => { const dx = x - me.x, dz = z - me.z, d = Math.hypot(dx, dz); if (d > 0.2 && d < range && (dx * fx + dz * fz) / d > 0.8) out.push(Object.assign({ kind, x, z, d }, extra || {})); };
      if (buddy) test("buddy", buddy.group.position.x, buddy.group.position.z);
      if (!inRoom && place && place.spots) place.spots.forEach((q) => { if (q.kind === "garden") test("garden", q.x, q.z); });
      puppets.forEach((q) => { if (q.t.group.visible) test("friend", q.x, q.z, { t: q.t }); });
      friends.forEach((f) => test("friend", f.x, f.z, { t: f.t }));
      return out.sort((a, b) => a.d - b.d);
    },
    splashBuddy() { if (!buddy) return false; const b = buddy.group.position, dx = b.x - me.x, dz = b.z - me.z, d = Math.hypot(dx, dz) || 1; const [x, z] = collide(b.x + (dx / d) * 2.2, b.z + (dz / d) * 2.2); bud.flee = { x, z, t: 1.6 }; buddy.hop(); return true; },
    buddyId() { return buddy ? buddy.id : null; }, buddyPos() { return buddy ? { x: buddy.group.position.x, y: buddy.group.position.y, z: buddy.group.position.z } : null; }, petBed, buddyNear(r = 4) { return !!buddy && Math.hypot(buddy.group.position.x - me.x, buddy.group.position.z - me.z) < r; },
    setLook(fn) { look2 = fn || (() => null); },
    setRun(fn) { running = fn || (() => false); },
    sit() { return sit(); }, pose() { return pose; },
    // sa labas: sc.spot() → { kind, id } ng pinakamalapit na puwedeng gawin · sc.sitBench() · sc.fish(true) (uupo sa upuan at maghahagis) · sc.bite(on) · sc.setFarm(f)
    spot() {
      if (riding) return { kind: "dismount", id: riding.id };
      if (inRoom && room && pose === "stand" && !show && !stair) { const sn = room.stairsNear && room.stairsNear(me.x, me.z); if (sn) return { kind: sn === "up" ? "upstairs" : "downstairs" }; }
      if (task) return null;
      if (inRoom && room && room.near && pose === "stand" && !show) { const r = room.near(me.x, me.z); return r ? { kind: r.kind, id: r.id, tier: r.tier } : null; }
      const q = spotNear(); if (q) return { kind: q.kind, id: q.id };   // taniman, lawa, upuan, puno muna; saka ang nakaparadang sasakyan
      const rd = pose === "stand" && !show ? nearRide() : null; return rd ? { kind: "ride", id: rd.id } : null;
    },
    feedFish() { const r = inRoom && room.near ? room.near(me.x, me.z) : null; if (!r || r.kind !== "aquarium" || !r.feed) return false; main.face(r.face); main.group.rotation.y = r.face; return r.feed(); },
    lookMirror() {   // lalakad sa harap ng salamin, haharap dito, at ang camera ay nasa likod ni Tigo (kita ang sarili)
      const r = inRoom && room.near ? room.near(me.x, me.z) : null; if (!r || r.kind !== "mirror") return false;
      const [sx, sz] = room.collide(r.stand.x, r.stand.z);
      walkTo(sx, sz, () => { main.face(r.face); main.group.rotation.y = r.face; rig.peek(r.face + Math.PI + 0.6); if (main.wiggle) main.wiggle(); });   // sa likod at gilid: kita si Tigo at ang repleksyon niya
      return true;
    },
    sitBench() { const q = place && place.spots && place.spots.find((x) => x.kind === "bench"); return q ? sit(q.seat) : false; },
    fish(on) {
      if (!on) { setFishing(false); return true; }
      const q = place && place.spots && place.spots.find((x) => x.kind === "pond"); if (!q) return false;
      if (pose === "sit" && seat === q.seat) { setFishing(true, q); return true; }
      if (pose === "sit") standUp();
      if (!sit(q.seat)) return false;
      const wait = setInterval(() => { if (pose === "sit") { clearInterval(wait); setFishing(true, q); } else if (!auto) clearInterval(wait); }, 150);
      return true;
    },
    fishing() { return fishing; }, bite(on) { biteT = on ? 1 : 0; },
    walking() { return !!auto; },
    setFarm(f) { farm = f || null; if (place) place.setFarm(farm); },
    dance, dancing() { return danceT > 0; },
    standUp() { if (pose === "sit") standUp(); },
    setSize(k) {
      sizeK = Math.max(0.5, Math.min(1.3, Number(k) || 1));
      if (!game) main.group.scale.setScalar(sizeK * (pose === "bed" ? 0.78 : 1));
      return sizeK;
    },
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
    // 📸 litrato: i-render ngayon (≥1080px ang lapad) at ibalik ang kopya (2D canvas) — walang preserveDrawingBuffer
    snapshot(minW = 1080) {
      const pr = renderer.getPixelRatio(), w = canvas.clientWidth || canvas.width;
      const want = Math.min(3, Math.max(pr, minW / Math.max(1, w)));
      if (want !== pr) renderer.setPixelRatio(want); // mas malinaw na litrato kahit maliit ang screen
      renderer.render(scene, camera);
      const out = document.createElement("canvas"); out.width = canvas.width; out.height = canvas.height; out.getContext("2d").drawImage(canvas, 0, 0);
      if (want !== pr) { renderer.setPixelRatio(pr); renderer.render(scene, camera); }
      return out;
    },
    setInput(fn) { input = fn || (() => ({ x: 0, z: 0 })); },
    input() { return input(); },
    jump() { if (!inside) { main.jump(); if (buddy) buddy.hop(); } },
    mainState() { return { x: me.x, z: me.z, y: main.height() }; },
    netState() { return { x: Math.round(me.x * 100) / 100, z: Math.round(me.z * 100) / 100, ry: Math.round((main.group.rotation.y || 0) * 100) / 100, room: inRoom, pose: pose === "sit" ? "sit" : "stand", in: inside && !inRoom }; },
    _warp(x, z) { if (!game && pose === "stand") { auto = null; [x, z] = collide(x, z); me.x = x; me.z = z; main.group.position.set(x, 0, z); } },   // para sa tests
    onTick(fn) { ticks.add(fn); return () => ticks.delete(fn); },
    isInside() { return inside; },
    pick(x, y) {
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x, y), camera);
      return ray.intersectObject(main.group, true).length > 0;
    },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("visibilitychange", vis); document.removeEventListener("tmn:upd", vis);
      pets.forEach((p) => p.dispose()); if (buddy) buddy.dispose(); if (place) place.dispose();
      rig.dispose(); sky.dispose(); rooms.forEach((R) => { if (R) R.dispose(); }); if (blanket) blanket.dispose();
      disp.forEach((d) => d.dispose()); zGeo.dispose(); zMat.dispose(); renderer.dispose();
    },
  };
}
