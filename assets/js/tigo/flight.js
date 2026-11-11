/* TigoMeNote · tigo/flight.js — lipad sa ibabaw ng mundo papunta sa isla ng kaibigan (o pauwi)
   import { fly } from "./flight.js"
   await fly(sc, { stage, label: "Flying to @ana's island…", seconds: 5, reduced })
   Sariling disenyo: maliit na eroplanong may elisi (si Tigo ang sakay), bilog na mundong may mga isla at maliliit na bahay, mga ulap.
   Gumagamit ng sc.beginGame/endGame (ibang mundo, gaya ng mga laro). Walang kontrol — panoorin lang (~5 s; 1.2 s kung reduced motion). */
import * as THREE from "../../vendor/three/three.module.min.js";

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const R = 14;

function plane() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.3, 6, 14), M(0x3f8fd8)); body.rotation.x = Math.PI / 2; g.add(body);
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 4, 12), M(0xfff3e0)); belly.rotation.x = Math.PI / 2; belly.position.y = -0.09; g.add(belly);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.07, 0.62), M(0xffc83d)); wing.position.set(0, 0.02, 0.12); g.add(wing);
  [-1, 1].forEach((s) => { const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), M(0x3f8fd8)); tip.position.set(s * 1.55, 0.02, 0.12); g.add(tip); });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.34), M(0xffc83d)); tail.position.set(0, 0.06, -0.92); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.4), M(0x3f8fd8)); fin.position.set(0, 0.3, -0.95); g.add(fin);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M(0x394150)); nose.position.z = 1.02; g.add(nose);
  const prop = new THREE.Group(); prop.position.z = 1.2; g.add(prop);
  [0, 1].forEach((i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.03), M(0x394150)); b.rotation.z = i * Math.PI / 2; prop.add(b); });
  const seat = new THREE.Group(); seat.position.set(0, 0.2, 0.05); g.add(seat);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.35, roughness: 0.1 }));
  glass.position.set(0, 0.22, 0.42); glass.scale.set(1, 0.8, 0.7); g.add(glass);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, prop, seat };
}

function globe(a, b) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), M(0x4fb3e8, { roughness: 0.55 })));
  const land = M(0x8fd47a), sand = M(0xf4e1a8), roofs = [0xe5533c, 0x3f8fd8, 0xf2a03d, 0x8a63d2, 0x2fae8f];
  // maliliit na isla sa palibot ng mundo (pare-pareho ang puwesto: may sariling "random" para hindi magbago)
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const spots = [a.clone(), b.clone()];
  for (let i = 0; i < 26; i++) { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u); spots.push(new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th))); }
  const up = new THREE.Vector3(0, 1, 0);
  spots.forEach((n, i) => {
    const isle = new THREE.Group(); isle.position.copy(n).multiplyScalar(R - 0.05); isle.quaternion.setFromUnitVectors(up, n);
    const k = i < 2 ? 1.25 : 0.6 + rnd() * 0.7;
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(1.25 * k, 1.35 * k, 0.16, 20), sand); isle.add(beach);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(1.0 * k, 1.1 * k, 0.2, 20), land); grass.position.y = 0.1; isle.add(grass);
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.5 * k, 0.4 * k, 0.45 * k), M(0xfff3e0)); house.position.y = 0.4 * k; isle.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.46 * k, 0.34 * k, 4), M(roofs[i % roofs.length])); roof.position.y = 0.77 * k; roof.rotation.y = Math.PI / 4; isle.add(roof);
    const tree = new THREE.Mesh(new THREE.SphereGeometry(0.24 * k, 10, 8), M(0x4caf6a)); tree.position.set(0.55 * k, 0.42 * k, 0.2 * k); isle.add(tree);
    if (i < 2) { const flag = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8), M(i ? 0xff4f7b : 0xffc83d, { emissive: i ? 0x661a2c : 0x664d00 })); flag.position.set(-0.6, 1.3, 0); flag.rotation.x = Math.PI; isle.add(flag); }
    g.add(isle);
  });
  const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 16; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), n = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
    const c = new THREE.Group(); c.position.copy(n).multiplyScalar(R + 1.6 + rnd() * 1.6); c.quaternion.setFromUnitVectors(up, n);
    for (let j = 0; j < 3; j++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.5 + rnd() * 0.3, 10, 8), cm); p.position.set((j - 1) * 0.6, 0, rnd() * 0.3); p.scale.y = 0.6; c.add(p); }
    g.add(c);
  }
  return g;
}

export function fly(sc, o = {}) {
  return new Promise((done) => {
    const dur = o.reduced ? 1.2 : Math.max(2, o.seconds || 5);
    const a = new THREE.Vector3(0.25, 0.92, 0.3).normalize(), b = new THREE.Vector3(-0.72, 0.42, 0.55).normalize();
    const world = new THREE.Group(); sc.scene.add(world);
    const gl = globe(a, b); world.add(gl);
    const pl = plane(); world.add(pl.group);
    const oldFog = sc.scene.fog; sc.scene.fog = null;
    const lab = document.createElement("div"); lab.className = "tg-fly"; lab.setAttribute("role", "status"); lab.textContent = o.label || "Flying…";
    if (o.stage) o.stage.appendChild(lab);
    let t0 = -1, ended = false, camSet = false; const tgt = new THREE.Vector3();
    const pos = new THREE.Vector3(), nxt = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), cp = new THREE.Vector3(), m = new THREE.Matrix4();
    const at = (k, out) => {   // punto sa arko mula a papuntang b (slerp) + taas
      const om = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))), so = Math.sin(om) || 1;
      out.copy(a).multiplyScalar(Math.sin((1 - k) * om) / so).addScaledVector(b, Math.sin(k * om) / so).normalize();
      return out.multiplyScalar(R + 0.9 + Math.sin(Math.PI * k) * 3.2);
    };
    const ease = (x) => x * x * (3 - 2 * x);
    function finish() {
      if (ended) return; ended = true;
      lab.remove(); sc.scene.fog = oldFog; sc.scene.remove(world);
      world.traverse((x) => { if (x.isMesh) { x.geometry.dispose(); if (x.material.dispose) x.material.dispose(); } });
      sc.endGame(); done();
    }
    sc.beginGame({
      tick(dt, t) {
        if (t0 < 0) {
          t0 = t; pl.seat.add(sc.main.group); sc.main.group.position.set(0, 0, 0); sc.main.group.rotation.set(0, 0, 0); sc.main.group.scale.setScalar(0.5);
          if (sc.main.sitPose) sc.main.sitPose(true);
        }
        const k = Math.min(1, (t - t0) / dur), e = ease(k);
        at(e, pos); at(Math.min(1, e + 0.01), nxt);
        up.copy(pos).normalize(); fwd.copy(nxt).sub(pos); if (fwd.lengthSq() < 1e-8) fwd.copy(b).sub(a); fwd.normalize();
        side.crossVectors(up, fwd).normalize(); up.crossVectors(fwd, side).normalize();
        m.makeBasis(side, up, fwd); pl.group.position.copy(pos); pl.group.quaternion.setFromRotationMatrix(m);
        pl.group.rotateZ(Math.sin(t * 1.7) * 0.12); pl.group.rotateX((0.5 - e) * 0.5);
        pl.prop.rotation.z += dt * 40;
        sc.sun.position.copy(pos).addScaledVector(up, 8).addScaledVector(side, 5); sc.sun.target.position.copy(pos); sc.sun.target.updateMatrixWorld();
        if (k >= 1) { if (sc.main.sitPose) sc.main.sitPose(false); setTimeout(finish, 0); }
      },
      cam(camera, dt) {
        if (!pos.lengthSq()) return;
        const h = Math.max(0, Math.min(1, (pos.length() - R - 0.9) / 3.2)), far = 4.5 + h * 6;   // malapit sa pag-alis at paglapag; malayo sa gitna (kita ang mundo)
        cp.copy(pos).addScaledVector(up, far * 0.75).addScaledVector(fwd, -far).addScaledVector(side, far * 0.4);
        if (!camSet) { camera.position.copy(cp); camSet = true; } else camera.position.lerp(cp, 1 - Math.exp(-(dt || 0.016) * 6));
        tgt.copy(pos).addScaledVector(up, -0.6 - h * 1.2).addScaledVector(fwd, 1.2);
        camera.up.copy(up); camera.lookAt(tgt); camera.up.set(0, 1, 0);
      },
    });
    o._finish = finish;   // para sa tests
  });
}
