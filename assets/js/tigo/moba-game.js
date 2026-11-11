/* TigoMeNote · tigo/moba-game.js — "Bloom Clash": 3 laban sa 3 sa isang daan ng hardin (cartoon, walang dugo). Sariling disenyo.
   import { startMoba, HEROES } from "./moba-game.js"
   const g = startMoba(sc, { voice, net, me:{name,color,av}, cls:"archer"|"fighter"|"assassin"|"mage", onHud(h), onButtons(b), onEnd(res) })
     g.go() · g.stop() · g.skill() · g.look(dx,dy) · g.zoom(k) · g._s (para sa tests)
   Layunin: sirain ang Great Flower (base) ng kalaban. Kailangang masira muna ang Tower nila. Bawat 22 s may lumalabas na 3 Sprouties sa bawat panig.
   Kontrol: lakad gamit ang stick. KUSANG umaatake ang hero sa pinakamalapit na kalaban na abot. ✨ Skill (button o Space) ayon sa klase:
     🏹 Archer — Volley (3 pana) · 🛡️ Fighter — Slam (lahat ng malapit) · 🗡️ Assassin — Dash (talon sa kalaban) · 🔮 Mage — Burst (sabog sa paligid ng target).
   XP sa bawat natalo (Lv 1–8: +10% buhay, +8% lakas). Natalo = babalik sa base pagkalipas ng ilang segundo. Malapit sa sariling base = gumagaling.
   Solo: ikaw + 2 bot laban sa 3 bot. Online (net mula sa room-lobby.js, hanggang 6): salitan ang team ayon sa pagkakasunod sa room; bot ang pumupuno sa kulang.
   Ang HOST ang may hawak ng lahat (buhay, Sprouties, tore, bots, atake). Ang iba: sariling lakad lang + hiling ng skill.
   Events: me {x,z,h,c} · sk {} · st {t, h:[…], m:[…], s:[…], fx:[…]} (host, ~6/s) · end {win} (host) · bye.
   Puntos: 60 bawat natalong hero + 8 bawat Sprouty + 20 bawat level + 300 kung panalo. */
import * as THREE from "../../vendor/three/three.module.min.js";

export const HEROES = {
  archer:   { icon: "🏹", name: "Archer",   text: "Far shots. Skill: Volley hits 3 enemies.",          hp: 420, dmg: 26, range: 5.0, rate: 0.9, speed: 3.0, cd: 7, sk: "Volley" },
  fighter:  { icon: "🛡️", name: "Fighter",  text: "Tough, up close. Skill: Slam hits everyone near.",  hp: 720, dmg: 34, range: 1.5, rate: 0.8, speed: 2.9, cd: 8, sk: "Slam" },
  assassin: { icon: "🗡️", name: "Assassin", text: "Fast and sharp. Skill: Dash jumps to an enemy.",    hp: 480, dmg: 44, range: 1.5, rate: 0.7, speed: 3.5, cd: 6, sk: "Dash" },
  mage:     { icon: "🔮", name: "Mage",     text: "Magic from afar. Skill: Burst blasts an area.",     hp: 400, dmg: 30, range: 4.5, rate: 1.1, speed: 2.9, cd: 8, sk: "Burst" },
};
const ORDER = ["archer", "fighter", "assassin", "mage"];
const L = 16, W = 3.4, TOWER_X = 7.5, BASE_X = 15, MAXT = 420;
const TEAM = [{ c: 0x2f7fe0, soft: 0x6fb6ff, name: "Blue" }, { c: 0xe5533c, soft: 0xff8a7a, name: "Red" }];
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });

// ---- hero: maliit na mandirigma (sariling disenyo) — ulo, katawan, braso at binting gumagalaw, kapa ng team, at sandata ayon sa klase ----
const LOOK = {
  archer:   { tunic: 0x3f9b58, trim: 0xd9b25f, hair: 0x7a4a22 },
  fighter:  { tunic: 0x8f9bb0, trim: 0xe9eef7, hair: 0x2b2118 },
  assassin: { tunic: 0x3b3550, trim: 0x8d7bd6, hair: 0x15131c },
  mage:     { tunic: 0x6a4bd6, trim: 0xffd76b, hair: 0xe9e2ff },
};
function heroModel(cls, team) {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const lk = LOOK[cls], tc = TEAM[team], geos = [], mats = [];
  const mt = (c, o) => { const m = M(c, o); mats.push(m); return m; };
  const add = (geo, mat, x, y, z, p = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); geos.push(geo); return m; };
  const skin = mt(0xf3c9a5), tunic = mt(lk.tunic), trim = mt(lk.trim, { metalness: 0.35, roughness: 0.45 }), dark = mt(0x2a2630), teamM = mt(tc.c), steel = mt(0xd5dbe6, { metalness: 0.6, roughness: 0.3 }), wood = mt(0x8a5a2b);
  // binti (o laylayan ng balabal ng mage)
  const legs = [-1, 1].map((k) => { const L = new THREE.Group(); L.position.set(k * 0.09, 0.34, 0); body.add(L); add(new THREE.CylinderGeometry(0.06, 0.055, 0.24, 8), cls === "mage" ? tunic : dark, 0, -0.13, 0, L); add(new THREE.BoxGeometry(0.11, 0.08, 0.17), mt(0x5a3b22), 0, -0.3, 0.02, L); return L; });
  if (cls === "mage") add(new THREE.ConeGeometry(0.27, 0.42, 12, 1, true), tunic, 0, 0.3, 0).material.side = THREE.DoubleSide;
  // katawan + sinturon
  add(new THREE.CapsuleGeometry(0.17, 0.2, 4, 10), tunic, 0, 0.56, 0);
  add(new THREE.CylinderGeometry(0.185, 0.185, 0.05, 12), trim, 0, 0.44, 0);
  if (cls === "fighter") add(new THREE.BoxGeometry(0.26, 0.2, 0.06), steel, 0, 0.6, 0.15);                         // baluti sa dibdib
  if (cls === "archer") { const q = add(new THREE.CylinderGeometry(0.05, 0.045, 0.3, 8), wood, -0.08, 0.64, -0.19); q.rotation.z = 0.35; [0, 1, 2].forEach((i) => add(new THREE.ConeGeometry(0.018, 0.06, 5), trim, -0.14 + i * 0.03, 0.82, -0.19)); }
  // kapa ng team (gumagalaw sa likod)
  const cape = new THREE.Group(); cape.position.set(0, 0.74, -0.15); body.add(cape);
  add(new THREE.BoxGeometry(cls === "assassin" ? 0.2 : 0.34, 0.46, 0.025), teamM, 0, -0.23, 0, cape);
  // balikat + braso
  const sh = cls === "fighter" ? 0.1 : 0.07;
  const arms = [-1, 1].map((k) => { add(new THREE.SphereGeometry(sh, 10, 8), cls === "fighter" ? steel : teamM, k * 0.22, 0.72, 0); const A = new THREE.Group(); A.position.set(k * 0.23, 0.7, 0); body.add(A);
    add(new THREE.CylinderGeometry(0.048, 0.042, 0.24, 8), tunic, 0, -0.13, 0, A); add(new THREE.SphereGeometry(0.05, 8, 6), skin, 0, -0.27, 0, A); return A; });
  // ulo
  const head = new THREE.Group(); head.position.y = 0.97; body.add(head);
  add(new THREE.SphereGeometry(0.19, 16, 12), skin, 0, 0, 0, head);
  [-1, 1].forEach((k) => { add(new THREE.SphereGeometry(0.03, 8, 6), dark, k * 0.07, 0.01, 0.17, head); add(new THREE.SphereGeometry(0.011, 6, 5), mt(0xffffff), k * 0.064, 0.022, 0.196, head); });
  if (cls === "archer") { add(new THREE.SphereGeometry(0.205, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), tunic, 0, 0.02, -0.01, head); add(new THREE.ConeGeometry(0.09, 0.2, 8), tunic, 0, 0.2, -0.1, head).rotation.x = -0.9; const fe = add(new THREE.ConeGeometry(0.02, 0.2, 5), mt(0xff5a4a), 0.14, 0.2, 0, head); fe.rotation.z = -0.5; add(new THREE.SphereGeometry(0.06, 8, 6), mt(lk.hair), 0, 0.02, 0.17, head).scale.set(2.2, 0.6, 0.5); }
  if (cls === "fighter") { add(new THREE.SphereGeometry(0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), steel, 0, 0.02, 0, head); add(new THREE.BoxGeometry(0.03, 0.12, 0.03), steel, 0, -0.02, 0.2, head); const pl = add(new THREE.BoxGeometry(0.04, 0.16, 0.3), teamM, 0, 0.27, -0.03, head); pl.rotation.x = 0.2; }
  if (cls === "assassin") { add(new THREE.SphereGeometry(0.212, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), tunic, 0, 0.02, -0.015, head); add(new THREE.BoxGeometry(0.3, 0.1, 0.1), dark, 0, -0.09, 0.13, head); const sc1 = add(new THREE.BoxGeometry(0.07, 0.3, 0.02), mt(lk.trim), 0.1, -0.3, -0.14, head); sc1.rotation.z = 0.2; }
  if (cls === "mage") { add(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 16), tunic, 0, 0.13, 0, head); const hat = add(new THREE.ConeGeometry(0.19, 0.42, 12), tunic, 0, 0.34, -0.02, head); hat.rotation.x = -0.18; add(new THREE.CylinderGeometry(0.192, 0.192, 0.04, 12), trim, 0, 0.16, 0, head); add(new THREE.SphereGeometry(0.1, 8, 6), mt(lk.hair), 0, -0.14, 0.12, head).scale.set(1.1, 1.3, 0.6); }
  // sandata (kanang kamay) at kaliwa
  const R = arms[1], Lh = arms[0]; let orb = null;
  if (cls === "archer") { const b = add(new THREE.TorusGeometry(0.2, 0.018, 6, 14, Math.PI), wood, 0, -0.27, 0.06, Lh); b.rotation.set(0, Math.PI / 2, Math.PI / 2); add(new THREE.CylinderGeometry(0.004, 0.004, 0.4, 4), mt(0xffffff), 0, -0.27, 0.06, Lh).rotation.x = Math.PI / 2; }
  if (cls === "fighter") { add(new THREE.BoxGeometry(0.045, 0.5, 0.012), steel, 0, -0.27, 0.3, R).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.16, 0.03, 0.03), trim, 0, -0.27, 0.06, R); const sd = add(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 14), teamM, -0.07, -0.2, 0.05, Lh); sd.rotation.z = Math.PI / 2; add(new THREE.SphereGeometry(0.05, 8, 6), trim, -0.1, -0.2, 0.05, Lh); }
  if (cls === "assassin") [R, Lh].forEach((A) => { add(new THREE.ConeGeometry(0.028, 0.26, 4), steel, 0, -0.27, 0.16, A).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.09, 0.02, 0.02), trim, 0, -0.27, 0.03, A); });
  if (cls === "mage") { add(new THREE.CylinderGeometry(0.016, 0.02, 0.95, 6), wood, 0, -0.1, 0.06, R); orb = add(new THREE.SphereGeometry(0.075, 12, 10), mt(0xb388ff, { emissive: 0x9c6bff, emissiveIntensity: 1 }), 0, 0.42, 0.06, R); add(new THREE.TorusGeometry(0.09, 0.012, 6, 14), trim, 0, 0.42, 0.06, R); }
  // bilog ng team sa paanan
  const ring = add(new THREE.RingGeometry(0.42, 0.52, 28), new THREE.MeshBasicMaterial({ color: tc.c, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 0.03, 0, group); ring.rotation.x = -Math.PI / 2; ring.castShadow = false; mats.push(ring.material);
  const st = { walk: 0, h: 0, ph: Math.random() * 6, atk: 0 };
  return {
    group,
    walk(sp, h) { st.walk = sp || 0; if (h !== undefined && sp) st.h = h; },
    face(h) { st.h = h; },
    attack() { st.atk = 0.32; },
    update(dt, t) {
      let d = st.h - group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); group.rotation.y += d * Math.min(1, dt * 12);
      st.ph += dt * (4 + st.walk * 8); const sw = Math.sin(st.ph) * 0.7 * st.walk;
      legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      body.position.y = st.walk > 0.05 ? Math.abs(Math.sin(st.ph)) * 0.03 : Math.sin(t * 2 + st.ph) * 0.008;
      body.rotation.x = st.walk * 0.12;
      st.atk = Math.max(0, st.atk - dt); const k = st.atk > 0 ? Math.sin((1 - st.atk / 0.32) * Math.PI) : 0;
      arms[0].rotation.x = (cls === "archer" ? -1.2 * k : -sw * 0.8) - (cls === "fighter" ? 0.5 : 0);
      arms[1].rotation.x = sw * 0.8 - k * (cls === "mage" ? 1.0 : 1.9) - (cls === "mage" ? 0.25 : 0);
      if (cls === "assassin") arms[0].rotation.x = -sw * 0.8 - k * 1.9;
      cape.rotation.x = 0.12 + st.walk * 0.5 + Math.sin(t * 3 + st.ph) * 0.06;
      if (orb) orb.material.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.3 + k * 1.5;
    },
    dispose() { geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); },
  };
}

export function startMoba(sc, opts = {}) {
  const { voice, net, onHud, onButtons, onEnd } = opts, meInfo = opts.me || {};
  const multi = !!net, host = !multi || net.host, myId = multi ? net.me : "me";
  const world = new THREE.Group(); sc.scene.add(world);
  const oldFog = sc.scene.fog, oldBg = sc.scene.background; sc.scene.fog = new THREE.Fog(0xbfe9c8, 16, 40); sc.scene.background = new THREE.Color(0xbfe9c8);
  const disp = [];
  const mesh = (geo, mat, x, y, z, parent = world) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); disp.push(geo); return m; };
  // ---- mapa: damuhan, daan, mga palamuti ----
  const ground = mesh(new THREE.PlaneGeometry(L * 2 + 14, 26), M(0x7ccf6f), 0, 0, 0); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.castShadow = false;
  const lane = mesh(new THREE.PlaneGeometry(L * 2 + 2, W * 2), M(0xe9d6a6), 0, 0.01, 0); lane.rotation.x = -Math.PI / 2; lane.receiveShadow = true; lane.castShadow = false;
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const bushG = new THREE.SphereGeometry(0.5, 10, 8), bushM = M(0x4caf6a), flG = new THREE.SphereGeometry(0.12, 8, 6); disp.push(bushG, flG);
  for (let i = 0; i < 34; i++) { const x = (rnd() * 2 - 1) * (L + 4), s = rnd() < 0.5 ? -1 : 1, z = s * (W + 0.8 + rnd() * 5); const b = new THREE.Mesh(bushG, bushM); b.position.set(x, 0.3, z); b.scale.set(1 + rnd(), 0.8 + rnd() * 0.6, 1 + rnd()); world.add(b);
    const f = new THREE.Mesh(flG, M([0xff8fb1, 0xffe066, 0xffffff][i % 3])); f.position.set(x + rnd() - 0.5, 0.12, s * (W + 0.3 + rnd() * 0.5)); world.add(f); }

  const stG = new THREE.DodecahedronGeometry(0.22), stM = M(0xcfc6b4, { roughness: 1 }), trunkG = new THREE.CylinderGeometry(0.12, 0.16, 0.9, 7), crownG = new THREE.ConeGeometry(0.7, 1.5, 8), trunkM = M(0x8a5a2b), crownM = [M(0x3f9b58), M(0x58b56a)]; disp.push(stG, trunkG, crownG);
  for (let x = -L; x <= L; x += 1.6) [-1, 1].forEach((k) => { const r = new THREE.Mesh(stG, stM); r.position.set(x + rnd() * 0.5, 0.08, k * (W + 0.25)); r.scale.set(1 + rnd() * 0.6, 0.5 + rnd() * 0.3, 1); r.rotation.y = rnd() * 3; world.add(r); });
  for (let i = 0; i < 16; i++) { const k = i % 2 ? -1 : 1, x = -L - 2 + i * 2.4 + rnd(), z = k * (W + 3 + rnd() * 3.5), tr = new THREE.Group(); tr.position.set(x, 0, z); const s1 = 0.8 + rnd() * 0.7; tr.scale.setScalar(s1);
    const a = new THREE.Mesh(trunkG, trunkM); a.position.y = 0.45; a.castShadow = true; const b = new THREE.Mesh(crownG, crownM[i % 2]); b.position.y = 1.5; b.castShadow = true; tr.add(a, b); world.add(tr); }
  // ---- mga unit ----
  const units = new Map(); let uid = 0;
  const barG = new THREE.PlaneGeometry(1, 0.12); disp.push(barG);
  function addBar(u, w, y) {
    const bg = new THREE.Mesh(barG, new THREE.MeshBasicMaterial({ color: 0x1d1d22, transparent: true, opacity: 0.6, depthTest: false })), fg = new THREE.Mesh(barG, new THREE.MeshBasicMaterial({ color: u.team ? 0xff5a4a : 0x35c26b, transparent: true, depthTest: false }));
    const g = new THREE.Group(); bg.scale.x = w; fg.scale.x = w; fg.position.z = 0.001; g.add(bg, fg); g.position.y = y; g.renderOrder = 5; bg.renderOrder = 5; fg.renderOrder = 6; u.g.add(g); u.bar = { g, fg, w };
  }
  function structure(id, kind, team, x) {
    const g = new THREE.Group(); g.position.set(x, 0, 0); world.add(g); const tc = TEAM[team];
    if (kind === "tower") { mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.2, 10), M(0x5fae5a), 0, 1.1, 0, g); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.34, 10, 8), M(tc.soft), Math.cos(a) * 0.5, 2.3, Math.sin(a) * 0.5, g).scale.y = 0.5; }
      mesh(new THREE.SphereGeometry(0.4, 12, 10), M(tc.c, { emissive: tc.c, emissiveIntensity: 0.35 }), 0, 2.35, 0, g); }
    else { mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 18), M(0xcdb38a), 0, 0.25, 0, g); mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.6, 10), M(0x5fae5a), 0, 1.6, 0, g);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.62, 10, 8), M(tc.soft), Math.cos(a) * 1.0, 3.0, Math.sin(a) * 1.0, g).scale.y = 0.45; }
      mesh(new THREE.SphereGeometry(0.75, 14, 12), M(tc.c, { emissive: tc.c, emissiveIntensity: 0.45 }), 0, 3.05, 0, g); }
    const u = { id, kind, team, x, z: 0, g, hp: kind === "tower" ? 900 : 1600, dmg: kind === "tower" ? 58 : 70, range: kind === "tower" ? 5.4 : 5, rate: 1.0, cd: 0, dead: false, r: kind === "tower" ? 0.6 : 1.6 };
    u.mats = []; g.traverse((o) => { if (o.isMesh) { o.material.transparent = true; u.mats.push(o.material); } });   // para lumabo kapag nakaharang sa camera
    u.mhp = u.hp; addBar(u, kind === "tower" ? 1.6 : 2.6, kind === "tower" ? 3.1 : 4.1); units.set(id, u); return u;
  }
  [0, 1].forEach((t) => { const s = t ? 1 : -1; structure("t" + t, "tower", t, s * TOWER_X); structure("b" + t, "base", t, s * BASE_X); });
  const sproutG = new THREE.SphereGeometry(0.26, 12, 10), leafG = new THREE.ConeGeometry(0.1, 0.3, 6); disp.push(sproutG, leafG);
  function minion(team, z, id) {
    const g = new THREE.Group(); const b = new THREE.Mesh(sproutG, M(TEAM[team].soft)); b.position.y = 0.26; b.castShadow = true; g.add(b);
    const lf = new THREE.Mesh(leafG, M(0x4caf6a)); lf.position.set(0, 0.62, 0); g.add(lf); const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), M(0x1d1416)); e.position.set(0.1, 0.3, 0.22); g.add(e, Object.assign(e.clone(), {})); g.children[3].position.x = -0.1;
    world.add(g); const s = team ? 1 : -1;
    const u = { id: id || "m" + (++uid), kind: "minion", team, x: s * (BASE_X - 2), z, tx: 0, tz: z, g, hp: 150, mhp: 150, dmg: 12, range: 1.3, rate: 1.0, cd: rnd(), speed: 1.7, dead: false, r: 0.3 };
    g.position.set(u.x, 0, u.z); addBar(u, 0.7, 0.95); units.set(u.id, u); return u;
  }
  // ---- mga hero ----
  const T = sc.main;
  const roster = multi ? net.roster : [{ p: "me", name: meInfo.name || "You", color: meInfo.color, av: meInfo.av }];
  const heroes = [], taken = {};
  function hero(slot, id, info, cls, bot) {
    const team = slot % 2, mine = id === myId, C = HEROES[cls];
    const t = heroModel(cls, team); world.add(t.group);
    const s = team ? 1 : -1, z = (Math.floor(slot / 2) - 1) * 1.6;
    const u = { id, kind: "hero", team, cls, bot, mine, name: info.name || C.name, t, g: t.group, x: s * (BASE_X - 2.4), z, h: team ? -Math.PI / 2 : Math.PI / 2, sx: s * (BASE_X - 2.4), sz: z,
      hp: C.hp, mhp: C.hp, base: C, dmg: C.dmg, range: C.range, rate: C.rate, speed: C.speed, cd: 0, skcd: 0, lv: 1, xp: 0, k: 0, d: 0, mk: 0, dead: false, rs: 0, tp: 0, r: 0.35, laneZ: z, got: false };
    t.group.position.set(u.x, 0, u.z); t.face(u.h); t.group.rotation.y = u.h; addBar(u, 0.9, 1.62);
    units.set(id, u); heroes.push(u); taken[cls] = (taken[cls] || 0) + 1; return u;
  }
  const myCls = HEROES[opts.cls] ? opts.cls : "archer";
  const BOTN = ["Bud", "Fern", "Thorn", "Petal", "Moss"];
  for (let slot = 0, bi = 0; slot < 6; slot++) {
    const r = roster[slot];
    if (r) hero(slot, r.p, r, r.p === myId ? myCls : (r.cls && HEROES[r.cls] ? r.cls : ORDER[slot % 4]), false);
    else { const cls = ORDER.slice().sort((a, b) => (taken[a] || 0) - (taken[b] || 0))[0]; hero(slot, "bot" + slot, { name: BOTN[bi++ % 5] + " (bot)", color: ["mint", "amber", "lilac", "lime", "pink"][slot % 5] }, cls, true); }
  }
  const me = units.get(myId);
  const view = { yaw: me.team ? -Math.PI / 2 : Math.PI / 2, zoom: 1 };
  sc.beginGame({ tick, cam });
  T.group.visible = false;   // ang sariling Tigo ay nakatago; hero ang nilalaro

  // ---- tama, XP, pagkatalo (host lang) ----
  const fx = [], shots = [];
  const lvMul = (u) => 1 + (u.lv - 1) * 0.08;
  const enemiesOf = (u) => [...units.values()].filter((o) => o.team !== u.team && !o.dead);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const canHit = (o) => !(o.kind === "base" && !units.get("t" + o.team).dead);   // ang base ay ligtas hangga't buhay ang tore
  function nearest(u, range, pred) { let best = null, bd = range; for (const o of units.values()) { if (o.team === u.team || o.dead || !canHit(o) || (pred && !pred(o))) continue; const d = dist(u, o) - o.r; if (d < bd) { bd = d; best = o; } } return best; }
  function giveXp(h, n) { if (!h || h.kind !== "hero" || h.dead) return; h.xp += n; while (h.lv < 8 && h.xp >= 60 * h.lv) { h.xp -= 60 * h.lv; h.lv++; const nm = Math.round(h.base.hp * (1 + (h.lv - 1) * 0.1)); h.hp += nm - h.mhp; h.mhp = nm; fx.push([h.id, h.id, "lv"]); } }
  function hurt(o, amt, by) {
    if (o.dead || !canHit(o) || ended) return;
    o.hp -= amt;
    if (o.hp > 0) return;
    o.hp = 0; o.dead = true; fx.push([o.id, o.id, "ko"]);
    const killer = by && by.kind === "hero" ? by : null;
    if (o.kind === "minion") { if (killer) { killer.mk++; giveXp(killer, 22); } heroes.forEach((h) => { if (h.team !== o.team && h !== killer && dist(h, o) < 6) giveXp(h, 10); }); }
    if (o.kind === "hero") { o.d++; o.rs = 5 + o.lv * 1.5; score[1 - o.team]++; if (killer) { killer.k++; giveXp(killer, 60); } heroes.forEach((h) => { if (h.team !== o.team && h !== killer && dist(h, o) < 7) giveXp(h, 30); }); }
    if (o.kind === "tower") heroes.forEach((h) => { if (h.team !== o.team) giveXp(h, 80); });
    if (o.kind === "base") finish(1 - o.team);
  }
  function attack(u, dt) {
    u.cd -= dt; if (u.cd > 0) return null;
    const tg = nearest(u, u.range, u.kind === "tower" || u.kind === "base" ? null : null);
    if (!tg) return null;
    u.cd = u.rate; fx.push([u.id, tg.id, u.range > 2 ? "shot" : "hit"]); hurt(tg, u.dmg * (u.kind === "hero" ? lvMul(u) : 1), u);
    return tg;
  }
  function doSkill(u) {
    if (u.dead || u.skcd > 0) return false; const k = lvMul(u);
    if (u.cls === "fighter") { fx.push([u.id, u.id, "slam"]); enemiesOf(u).forEach((o) => { if (dist(u, o) - o.r < 2.4) hurt(o, 80 * k, u); }); }
    else if (u.cls === "archer") { const tg = enemiesOf(u).filter((o) => canHit(o) && dist(u, o) - o.r < 6.2).sort((a, b) => dist(u, a) - dist(u, b)).slice(0, 3); if (!tg.length) return false; tg.forEach((o) => { fx.push([u.id, o.id, "shot"]); hurt(o, 70 * k, u); }); }
    else if (u.cls === "assassin") { const tg = nearest(u, 5.2, (o) => o.kind === "hero") || nearest(u, 5.2); if (!tg) return false; const a = Math.atan2(u.x - tg.x, u.z - tg.z); u.x = tg.x + Math.sin(a) * (tg.r + 0.6); u.z = Math.max(-W, Math.min(W, tg.z + Math.cos(a) * (tg.r + 0.6))); u.tp++; fx.push([u.id, tg.id, "dash"]); hurt(tg, 130 * k, u); }
    else { const tg = nearest(u, 5.6); if (!tg) return false; fx.push([u.id, tg.id, "burst"]); enemiesOf(u).forEach((o) => { if (dist(tg, o) - o.r < 2.2) hurt(o, 110 * k, u); }); }
    u.skcd = u.base.cd; return true;
  }
  // ---- bot: sumusulong sa daan; umaatras kapag mahina; hindi pumapasok sa tore nang walang kasamang Sprouty ----
  function botMove(u, dt) {
    const s = u.team ? -1 : 1, foeTower = units.get("t" + (1 - u.team)), home = { x: u.sx, z: u.sz };
    let gx, gz = u.laneZ, stop = false;
    const tg = nearest(u, u.range + 0.2);
    if (u.hp < u.mhp * 0.3) u.flee = true; if (u.hp > u.mhp * 0.8) u.flee = false;
    if (u.flee) { gx = home.x; gz = home.z; }
    else if (tg) { stop = true; if (u.skcd <= 0 && (tg.kind === "hero" || rnd() < 0.02)) doSkill(u); }
    else {
      gx = u.x + s * 3;
      const danger = !foeTower.dead ? foeTower : units.get("b" + (1 - u.team));
      const cover = [...units.values()].some((o) => o.kind === "minion" && o.team === u.team && !o.dead && dist(o, danger) < danger.range + 0.5);
      if (!cover && Math.abs(u.x + s * 0.6 - danger.x) < danger.range + 1.2) { gx = danger.x - s * (danger.range + 1.6); }
      gx = Math.max(-BASE_X + 1, Math.min(BASE_X - 1, gx));
    }
    if (stop || gx === undefined) { u.t.walk(0); if (tg) { u.h = Math.atan2(tg.x - u.x, tg.z - u.z); u.t.face(u.h); } return; }
    const dx = gx - u.x, dz = gz - u.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { u.t.walk(0); return; }
    u.x += (dx / d) * u.speed * dt; u.z += (dz / d) * u.speed * dt; u.h = Math.atan2(dx, dz); u.t.walk(1, u.h);
  }
  function minionMove(u, dt) {
    const tg = nearest(u, 3.4);
    let gx = u.team ? -BASE_X : BASE_X, gz = u.tz;
    if (tg) { if (dist(u, tg) - tg.r <= u.range) return; gx = tg.x; gz = tg.z; }
    const dx = gx - u.x, dz = gz - u.z, d = Math.hypot(dx, dz) || 1;
    u.x += (dx / d) * u.speed * dt; u.z += (dz / d) * u.speed * dt; u.g.rotation.y = Math.atan2(dx, dz);
  }

  // ---- ako: lakad ayon sa camera ----
  function moveMe(dt) {
    if (me.dead) { me.t.walk(0); return; }
    const i = sc.input ? sc.input() : { x: 0, z: 0 }, mag = Math.min(1, Math.hypot(i.x, i.z));
    if (mag < 0.15) { me.t.walk(0); me.moving = false; return; }
    const fxx = Math.sin(view.yaw), fzz = Math.cos(view.yaw); let wx = -fzz * i.x - fxx * i.z, wz = fxx * i.x - fzz * i.z; const wk = 1 / (Math.hypot(wx, wz) || 1);
    const sp = me.speed * dt * mag;
    me.x = Math.max(-L, Math.min(L, me.x + wx * wk * sp)); me.z = Math.max(-W, Math.min(W, me.z + wz * wk * sp));
    // hindi tumatagos sa tore at base
    units.forEach((o) => { if ((o.kind === "tower" || o.kind === "base") && !o.dead) { const d = dist(me, o), m = o.r + 0.3; if (d < m && d > 0.001) { me.x = o.x + ((me.x - o.x) / d) * m; me.z = o.z + ((me.z - o.z) / d) * m; } } });
    me.h = Math.atan2(wx, wz); me.moving = true; me.t.walk(mag, me.h);
  }

  // ---- mga epekto ----
  const shotG = new THREE.SphereGeometry(0.13, 8, 6); disp.push(shotG);
  function playFx(list) {
    list.forEach(([a, b, k]) => {
      const A = units.get(a), B = units.get(b); if (!A) return;
      if (k === "shot" && B) { const m = new THREE.Mesh(shotG, new THREE.MeshBasicMaterial({ color: A.kind === "hero" && A.cls === "mage" ? 0xb388ff : TEAM[A.team].c })); world.add(m); shots.push({ m, a: new THREE.Vector3(A.x, A.kind === "hero" ? 0.75 : A.kind === "minion" ? 0.3 : 2.3, A.z), b: B, t: 0 }); }
      else if (k === "ko") { sc.effect(A.kind === "minion" ? "bubbles" : "stars", { x: A.x, y: 0.5, z: A.z }); if (A === me && voice) voice.sfx("hit"); }
      else if (k === "lv") { sc.effect("sparkle", { x: A.x, y: 0.6, z: A.z }); if (A === me) { if (voice) voice.sfx("level"); if (onHud) onHud({ toast: "⭐ Level " + A.lv }); } }
      else if (k === "slam" || k === "burst") { const P = k === "slam" ? A : B || A; sc.effect("stars", { x: P.x, y: 0.3, z: P.z }); sc.effect("sparkle", { x: P.x, y: 0.2, z: P.z }); }
      else if (k === "dash") sc.effect("sparkle", { x: A.x, y: 0.4, z: A.z });
      if (A.kind === "hero" && k !== "ko" && k !== "lv") A.t.attack();
      if (A.kind === "hero" && (k === "shot" || k === "hit") && B && !A.moving) { A.h = Math.atan2(B.x - A.x, B.z - A.z); A.t.face(A.h); }
    });
  }

  // ---- network ----
  let ended = false, running = false, time = 0, waveT = 2, sendT = 0, stT = 0, hudT = 0, t0 = 0; const score = [0, 0];
  const pack = () => ({ t: Math.round(time), sc: score,
    h: heroes.map((u) => [u.id, +u.x.toFixed(2), +u.z.toFixed(2), +u.h.toFixed(2), Math.round(u.hp), u.mhp, u.lv, u.dead ? Math.ceil(u.rs) : 0, u.k, u.d, u.tp, Math.ceil(u.skcd), u.mk]),
    m: [...units.values()].filter((u) => u.kind === "minion" && !u.dead).map((u) => [u.id, u.team, +u.x.toFixed(1), +u.z.toFixed(1), Math.round(u.hp)]),
    s: ["t0", "b0", "t1", "b1"].map((id) => Math.round(units.get(id).hp)), fx: fx.splice(0, 40) });
  function apply(d) {
    time = d.t; score[0] = d.sc[0]; score[1] = d.sc[1];
    (d.h || []).forEach((a) => { const u = units.get(a[0]); if (!u) return;
      const wasDead = u.dead; u.hp = a[4]; u.mhp = a[5]; u.lv = a[6]; u.dead = a[7] > 0; u.rs = a[7]; u.k = a[8]; u.d = a[9]; u.skcd = a[11]; u.mk = a[12];
      if (u.mine) { if (a[10] !== u.tp || (wasDead && !u.dead)) { u.tp = a[10]; u.x = a[1]; u.z = a[2]; } } else { u.nx = a[1]; u.nz = a[2]; u.h = a[3]; if (!u.got) { u.x = a[1]; u.z = a[2]; u.got = true; } } });
    const seen = new Set();
    (d.m || []).forEach((a) => { seen.add(a[0]); let u = units.get(a[0]); if (!u) { u = minion(a[1], a[3], a[0]); u.x = a[2]; u.z = a[3]; } u.nx = a[2]; u.nz = a[3]; u.hp = a[4]; });
    units.forEach((u) => { if (u.kind === "minion" && !seen.has(u.id)) { u.dead = true; } });
    ["t0", "b0", "t1", "b1"].forEach((id, i) => { const u = units.get(id); u.hp = d.s[i]; u.dead = u.hp <= 0; });
    playFx(d.fx || []);
  }
  if (net) net.on((ev, d, from) => {
    if (ended) return; const u = units.get(from);
    if (ev === "me" && host && u && !u.mine && !u.dead) { u.nx = Number(d.x) || 0; u.nz = Number(d.z) || 0; u.h = Number(d.h) || 0; u.moving = !!d.mv; if (!u.got) { u.x = u.nx; u.z = u.nz; u.got = true; } return; }
    if (ev === "sk" && host && u) { doSkill(u); return; }
    if (ev === "st" && !host && from === net.roster[0].p) { apply(d); return; }
    if (ev === "end" && !host) { finish(d.win, true); return; }
    if (ev === "bye" && u) { if (from === net.roster[0].p && !host) { if (onHud) onHud({ note: "The host left the game." }); finish(1 - me.team, true); } else if (host) { u.bot = true; u.name += " (bot)"; } }
  });

  // ---- bawat frame ----
  function tick(dt, t) {
    if (ended) return;
    T.group.visible = false;
    if (!running) { heroes.forEach((u) => { u.t.walk(0); u.t.update(dt, t); }); hud(); return; }
    moveMe(dt);
    if (host) {
      time += dt;
      waveT -= dt; if (waveT <= 0) { waveT = 22; [0, 1].forEach((tm) => { if ([...units.values()].filter((u) => u.kind === "minion" && u.team === tm && !u.dead).length < 12) [-1.2, 0, 1.2].forEach((z) => minion(tm, z)); }); }
      units.forEach((u) => {
        if (u.kind === "hero") {
          if (u.dead) { u.rs -= dt; if (u.rs <= 0) { u.dead = false; u.hp = u.mhp; u.x = u.sx; u.z = u.sz; u.tp++; u.flee = false; } return; }
          u.skcd = Math.max(0, u.skcd - dt);
          if (u.bot) botMove(u, dt); else if (!u.mine && u.nx !== undefined) { const dx = u.nx - u.x, dz = u.nz - u.z, d = Math.hypot(dx, dz); if (d > 3) { u.x = u.nx; u.z = u.nz; } else if (d > 0.02) { const st = Math.min(d, u.speed * 1.3 * dt); u.x += (dx / d) * st; u.z += (dz / d) * st; u.t.walk(u.moving ? 1 : 0, u.h); } else u.t.walk(0); }
          if (Math.abs(u.x - u.sx) < 3.2) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.12 * dt);   // gumagaling malapit sa sariling base
          attack(u, dt);
        } else if (!u.dead) { if (u.kind === "minion") minionMove(u, dt); attack(u, dt); }
      });
      if (time >= MAXT && !ended) { const v = (tm) => units.get("b" + tm).hp + units.get("t" + tm).hp + score[tm] * 20; finish(v(0) >= v(1) ? 0 : 1); return; }
      const out = fx.slice(); playFx(out);
      if (net) { stT -= dt; if (stT <= 0) { stT = 0.16; net.send("st", pack()); } else fx.length = Math.min(fx.length, 60); } else fx.length = 0;
    } else {
      units.forEach((u) => { if (u.mine || u.nx === undefined || u.dead) return; const dx = u.nx - u.x, dz = u.nz - u.z, d = Math.hypot(dx, dz);
        if (d > 4) { u.x = u.nx; u.z = u.nz; } else if (d > 0.03) { const st = Math.min(d, (u.speed || 3) * 1.4 * dt); u.x += (dx / d) * st; u.z += (dz / d) * st; if (u.kind === "hero") u.t.walk(1, u.h); else u.g.rotation.y = Math.atan2(dx, dz); } else if (u.kind === "hero") u.t.walk(0); });
    }
    if (net) { sendT -= dt; if (sendT <= 0) { sendT = 0.12; if (!host) net.send("me", { x: +me.x.toFixed(2), z: +me.z.toFixed(2), h: +(me.h || 0).toFixed(2), mv: me.moving ? 1 : 0 }); } }
    // ipakita
    units.forEach((u) => {
      if (u.kind === "minion" && u.dead) { world.remove(u.g); units.delete(u.id); return; }
      u.g.visible = !u.dead || u.kind === "tower" || u.kind === "base";
      if (u.kind === "tower" || u.kind === "base") {
        u.g.scale.y += ((u.dead ? 0.25 : 1) - u.g.scale.y) * Math.min(1, dt * 6);
        // nasa pagitan ng camera at ng hero ko → palabuin para kita pa rin ang laro
        const cx = sc.camera.position.x, between = (u.x - cx) * (me.x - u.x) > 0 && Math.abs(me.x - u.x) < 7 && Math.abs(me.z - u.z) < 3.2, op = between ? 0.22 : 1;
        if (u.op !== op) { u.op = op; u.mats.forEach((m) => { m.opacity = op; m.depthWrite = op === 1; }); }
      }
      else { u.g.position.x = u.x; u.g.position.z = u.z; if (u.kind === "hero") u.t.update(dt, t); if (u.kind === "minion") u.g.position.y = Math.abs(Math.sin(t * 7 + u.x)) * 0.06; }
      if (u.bar) { const k = Math.max(0, Math.min(1, u.hp / u.mhp)); u.bar.fg.scale.x = Math.max(0.001, u.bar.w * k); u.bar.fg.position.x = -(u.bar.w * (1 - k)) / 2; u.bar.g.quaternion.copy(sc.camera.quaternion); if (u.kind !== "tower" && u.kind !== "base") { u.g.updateMatrixWorld(); const q = new THREE.Quaternion(); u.g.getWorldQuaternion(q); u.bar.g.quaternion.premultiply(q.invert()); } u.bar.g.visible = !u.dead && !(u.op !== undefined && u.op < 1); }
    });
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt / 0.22; const B = s.b; if (s.t >= 1) { world.remove(s.m); s.m.material.dispose(); shots.splice(i, 1); continue; } s.m.position.set(s.a.x + (B.x - s.a.x) * s.t, s.a.y + (0.6 - s.a.y) * s.t + Math.sin(s.t * Math.PI) * 0.5, s.a.z + (B.z - s.a.z) * s.t); }
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; hud(); }
  }
  function hud() {
    if (onHud) onHud({ hp: Math.round(me.hp), mhp: me.mhp, lv: me.lv, k: me.k, d: me.d, blue: score[0], red: score[1], team: me.team, left: Math.max(0, Math.ceil(MAXT - time)), dead: me.dead ? Math.ceil(me.rs) : 0, cls: me.cls });
    if (onButtons) onButtons({ skill: !me.dead && me.skcd <= 0 && running, cd: Math.ceil(me.skcd), name: me.base.sk });
  }
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function cam(camera, dt) {
    const tall = camera.aspect < 0.8, k = (tall ? 1.5 : 1) * view.zoom, fxx = Math.sin(view.yaw), fzz = Math.cos(view.yaw);
    camPos.set(me.x - fxx * 5.2 * k, 6.0 * k, me.z - fzz * 5.2 * k); camera.position.lerp(camPos, 1 - Math.exp(-(dt || 0.016) * 6));
    look.set(me.x + fxx * 2.4, 0.3, me.z + fzz * 2.4); camera.lookAt(look);
    sc.sun.position.set(me.x + 4, 9, me.z + 5); sc.sun.target.position.set(me.x, 0, me.z); sc.sun.target.updateMatrixWorld();
  }
  function finish(winTeam, remote) {
    if (ended) return; ended = true; running = false;
    if (net && host && !remote) net.send("end", { win: winTeam });
    const win = winTeam === me.team, pts = me.k * 60 + me.mk * 8 + me.lv * 20 + (win ? 300 : 0);
    if (voice) voice.sfx(win ? "win" : "hit");
    setTimeout(() => {
      heroes.forEach((u) => u.t.dispose());
      shots.forEach((s) => s.m.material.dispose());
      sc.scene.fog = oldFog; sc.scene.background = oldBg; disp.forEach((d) => d.dispose());
      sc.scene.remove(world); sc.endGame();
      if (onEnd) onEnd({ score: pts, win, finished: true, ms: Math.round(performance.now() - t0), kills: me.k, deaths: me.d, level: me.lv, label: (win ? "🏆 Victory! " : "💪 Good try! ") + "⭐ " + pts });
    }, 900);
  }
  hud();
  return {
    go() { running = true; t0 = performance.now(); },
    stop() { if (net) net.send("bye", {}); finish(1 - me.team, true); },
    skill() { if (!running || me.dead || me.skcd > 0) return false; if (host) { const ok = doSkill(me); if (ok && voice) voice.sfx("power"); return ok; } net.send("sk", {}); me.skcd = 1; if (voice) voice.sfx("power"); return true; },
    look(dx) { view.yaw -= dx * 0.0062; }, zoom(k) { if (k > 0) view.zoom = Math.max(0.6, Math.min(1.7, view.zoom / k)); },
    _s: { units, heroes, me, score, view, get time() { return time; }, set time(v) { time = v; }, hurt, doSkill, finish, minion },
  };
}
