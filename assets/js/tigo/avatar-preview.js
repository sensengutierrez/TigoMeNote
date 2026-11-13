/* TigoMeNote · tigo/avatar-preview.js — maliit na 3D na silip ng avatar sa editor (umiikot; hilahin para paikutin)
   import { avatarPreview } from "./avatar-preview.js"
   const pv = avatarPreview(host, { avatar, outfit })   pv.set(avatar|null) · pv.dispose()
   Sariling maliit na renderer (hiwalay sa isla) para kita ang buong katawan kahit natatakpan ng panel ang 3D. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { createTigo } from "./pet-model.js";

export function avatarPreview(host, { avatar, outfit } = {}) {
  const wrap = document.createElement("div"); wrap.className = "tg-av-view"; wrap.setAttribute("role", "img"); wrap.setAttribute("aria-label", "Avatar preview — drag to turn");
  const canvas = document.createElement("canvas"); wrap.appendChild(canvas); host.appendChild(wrap);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { wrap.remove(); return { set() {}, dispose() {} }; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.15, 4.1); camera.lookAt(0, 0.92, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c7b8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(2, 4, 3); scene.add(sun);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 40), new THREE.MeshStandardMaterial({ color: 0xffe3d9, roughness: 0.8 })); disc.position.y = -0.03; scene.add(disc);
  const t = createTigo({ avatar }); scene.add(t.group); t.group.scale.setScalar(0.92);
  const dress = (o) => ["hat", "face", "body", "hand"].forEach((s) => { if (o && o[s]) t.wear(s, o[s]); });
  dress(outfit);
  let yaw = 0.4, spin = 0.6, drag = null, raf = 0, alive = true, last = performance.now();
  const size = () => { const w = wrap.clientWidth || 240, h = wrap.clientHeight || 190; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(wrap); size();
  wrap.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y0: yaw }; spin = 0; wrap.setPointerCapture(e.pointerId); e.stopPropagation(); });
  wrap.addEventListener("pointermove", (e) => { if (drag) yaw = drag.y0 + (e.clientX - drag.x) * 0.012; });
  const up = () => { if (drag) { drag = null; spin = 0.6; } };
  wrap.addEventListener("pointerup", up); wrap.addEventListener("pointercancel", up);
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    yaw += spin * dt; t.group.rotation.y = yaw; t.face(yaw); t.update(dt, now / 1000);
    if (!document.hidden) renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return {
    set(av) { t.setAvatar(av); dress(outfit); t.jump(); },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); t.dispose(); disc.geometry.dispose(); disc.material.dispose(); renderer.dispose(); wrap.remove(); },
  };
}
