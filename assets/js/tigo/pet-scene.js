/* TigoMeNote · tigo/pet-scene.js — 3D na "isla" kung saan nakatira si Tigo (three.js, WebGL)
   import { createScene } from "./pet-scene.js"
   const sc = createScene(canvas, { reduced })   → { main, add(opts) → tigo, remove(tigo), effect(kind, at), night(on), dispose() }
   main = ang sariling Tigo. add() = bisita (Tigo ng kaibigan) sa tabi.
   Mga effect: "hearts", "food", "bubbles", "stars", "ball".  Kapag walang WebGL: nag-e-error (ang page ang may fallback). */
import * as THREE from "../../vendor/three/three.module.min.js";
import { createTigo } from "./pet-model.js";

export function createScene(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 2.3, 7.2); camera.lookAt(0, 0.95, 0);

  // ---------- ilaw ----------
  const hemi = new THREE.HemisphereLight(0xfff4e8, 0x6b8f71, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3.5, 6, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -4; sun.shadow.radius = 4; sun.shadow.bias = -0.0005;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff9a6b, 1.2); rim.position.set(-4, 3, -4); scene.add(rim);

  // ---------- isla ----------
  const dispose = [];
  const M = (o) => { const m = new THREE.MeshStandardMaterial(o); dispose.push(m); return m; };
  const G = (g) => { dispose.push(g); return g; };
  const island = new THREE.Group(); scene.add(island);
  const grass = new THREE.Mesh(G(new THREE.CylinderGeometry(2.6, 2.75, 0.28, 64)), M({ color: 0x8fd18a, roughness: 0.9 }));
  grass.position.y = -0.14; grass.receiveShadow = true; island.add(grass);
  const soil = new THREE.Mesh(G(new THREE.CylinderGeometry(2.75, 2.1, 0.7, 64)), M({ color: 0xc89a6b, roughness: 1 }));
  soil.position.y = -0.62; island.add(soil);
  // maliliit na bulaklak (sampaguita) at bato
  const petal = M({ color: 0xffffff, roughness: 0.6 }), center = M({ color: 0xffd54f });
  const rnd = (a) => { let s = a; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const r = rnd(7);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = 1.4 + r() * 1;
    const f = new THREE.Group(); f.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d * 0.8);
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(G(new THREE.SphereGeometry(0.06, 8, 6)), petal); p.scale.set(1, 0.4, 0.6); const b = (k / 5) * Math.PI * 2; p.position.set(Math.cos(b) * 0.06, 0.02, Math.sin(b) * 0.06); f.add(p); }
    const c = new THREE.Mesh(G(new THREE.SphereGeometry(0.03, 8, 6)), center); c.position.y = 0.04; f.add(c);
    island.add(f);
  }
  const rock = new THREE.Mesh(G(new THREE.DodecahedronGeometry(0.22)), M({ color: 0xb8b2a8, roughness: 0.95 }));
  rock.position.set(-1.9, 0.05, -0.6); rock.scale.y = 0.6; rock.castShadow = true; island.add(rock);
  // kama (para sa tulog)
  const bed = new THREE.Group();
  const bedBase = new THREE.Mesh(G(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 32)), M({ color: 0x9fb3ff, roughness: 0.8 })); bedBase.position.y = 0.06; bedBase.receiveShadow = true;
  bed.add(bedBase); bed.position.set(1.65, 0, -0.9); island.add(bed);

  // ---------- mga Tigo ----------
  const pets = [];
  const main = createTigo(opts.pet || {}); scene.add(main.group); pets.push(main);
  function add(o) {
    const t = createTigo(o || {});
    const n = pets.length; // bisita: salitan sa kaliwa at kanan
    t.group.position.set(n % 2 ? -1.35 : 1.35, 0, -0.35 - Math.floor((n - 1) / 2) * 0.6);
    t.group.scale.setScalar(0.82); t.group.rotation.y = n % 2 ? 0.5 : -0.5;
    scene.add(t.group); pets.push(t); t.jump();
    return t;
  }
  function remove(t) { const i = pets.indexOf(t); if (i > 0) { pets.splice(i, 1); scene.remove(t.group); t.dispose(); } }

  // ---------- effects ----------
  const fx = [];
  const fxMats = {
    hearts: M({ color: 0xff4f7b, emissive: 0x551122, roughness: 0.4 }),
    food: M({ color: 0xffb74d, roughness: 0.6 }),
    bubbles: new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, transmission: 0.6, transparent: true, opacity: 0.55, roughness: 0.05 }),
    stars: M({ color: 0xffe066, emissive: 0x665500, roughness: 0.3 }),
    ball: M({ color: 0xff5a36, roughness: 0.4 }),
  };
  dispose.push(fxMats.bubbles);
  function heartGeo() {
    const s = new THREE.Shape(); s.moveTo(0, 0.06); s.bezierCurveTo(0, 0.1, -0.08, 0.12, -0.1, 0.06); s.bezierCurveTo(-0.12, 0, -0.04, -0.06, 0, -0.1); s.bezierCurveTo(0.04, -0.06, 0.12, 0, 0.1, 0.06); s.bezierCurveTo(0.08, 0.12, 0, 0.1, 0, 0.06);
    return G(new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }));
  }
  const geos = { hearts: heartGeo(), food: G(new THREE.SphereGeometry(0.12, 14, 10)), bubbles: G(new THREE.SphereGeometry(0.1, 16, 12)), stars: G(new THREE.OctahedronGeometry(0.09)), ball: G(new THREE.SphereGeometry(0.16, 20, 14)) };
  function effect(kind, at) {
    const base = (at || main.group).position;
    const n = kind === "ball" ? 1 : kind === "food" ? 3 : 8;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geos[kind], fxMats[kind]); m.castShadow = kind === "ball" || kind === "food";
      const a = Math.random() * Math.PI * 2;
      m.position.set(base.x + (kind === "food" ? (i - 1) * 0.25 : Math.cos(a) * 0.5), kind === "food" ? 2.6 + i * 0.3 : 1 + Math.random() * 0.8, base.z + 0.6 + Math.sin(a) * 0.3);
      if (kind === "hearts") m.rotation.z = Math.PI;
      scene.add(m);
      fx.push({ m, kind, life: kind === "ball" ? 2.4 : 1.6 + Math.random() * 0.6, v: new THREE.Vector3((Math.random() - 0.5) * 0.6, kind === "food" ? -2.2 : 0.8 + Math.random() * 0.6, 0), t0: 0, target: base });
    }
  }
  function updateFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.life -= dt; f.t0 += dt;
      if (f.kind === "ball") {
        // bola: tumatalbog papunta kay Tigo
        f.m.position.x = Math.sin(f.t0 * 2.2) * 1.2 + f.target.x; f.m.position.z = f.target.z + 0.9;
        f.m.position.y = 0.16 + Math.abs(Math.sin(f.t0 * 5)) * 0.9 * Math.max(0.2, f.life / 2.4); f.m.rotation.x += dt * 8;
      } else if (f.kind === "food") {
        f.m.position.y = Math.max(1.05, f.m.position.y + f.v.y * dt); f.m.scale.setScalar(Math.max(0.01, Math.min(1, f.life)));
      } else {
        f.m.position.addScaledVector(f.v, dt);
        if (f.kind === "hearts") f.m.rotation.y = Math.sin(f.t0 * 3) * 0.4; else f.m.rotation.y += dt * 3; // puso: laging nakaharap
        f.m.scale.setScalar(Math.max(0.01, Math.min(1, f.life)) * (f.kind === "hearts" ? 1.7 : 1));
      }
      if (f.life <= 0) { scene.remove(f.m); fx.splice(i, 1); }
    }
  }

  // ---------- gabi (tulog) ----------
  function night(on) {
    hemi.intensity = on ? 0.35 : 1.1; sun.intensity = on ? 0.5 : 2.2; sun.color.set(on ? 0x9bb6ff : 0xffffff);
    rim.color.set(on ? 0x6b7bff : 0xff9a6b);
    if (on) { main.group.position.set(1.55, 0.12, -0.9); main.group.rotation.y = -0.4; } else { main.group.position.set(0, 0, 0); }
  }

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let raf = 0, alive = true;
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.8 ? 9 : 7.2; // phone (patayo): medyo malayo para kasya ang isla
    camera.updateProjectionMatrix();
  }
  function loop() {
    if (!alive) return;
    const dt = clock.getDelta(), t = clock.elapsedTime;
    pets.forEach((p) => p.update(opts.reduced ? dt * 0.4 : dt, t));
    island.rotation.y = Math.sin(t * 0.15) * 0.06;
    updateFx(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  resize(); loop();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  // pause kapag nakatago ang page (tipid sa baterya)
  function vis() { if (document.hidden) cancelAnimationFrame(raf); else { clock.getDelta(); raf = requestAnimationFrame(loop); } }
  document.addEventListener("visibilitychange", vis);

  return {
    main, add, remove, effect, night, renderer,
    pick(x, y) { // tap sa sariling Tigo? (x, y = -1..1)
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x, y), camera);
      return ray.intersectObject(main.group, true).length > 0;
    },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("visibilitychange", vis); pets.forEach((p) => p.dispose()); dispose.forEach((d) => d.dispose()); renderer.dispose(); },
  };
}
