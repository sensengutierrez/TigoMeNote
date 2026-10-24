/* TigoMeNote · tigo/sky-dome.js — 3D na langit sa paligid ni Tigo (para kapag ini-ikot o tumingala ang camera)
   import { createSky } from "./sky-dome.js"
   const sky = createSky(scene)
     sky.set(colors[top, mid, bottom], night)  → kulay ng langit (galing sa SKY ng backdrops.js) at kung gabi
     sky.update(t) · sky.dispose()
   Araw: araw + ulap. Gabi: buwan + mga bituin na kumikislap. Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";

const NIGHT = ["#0c0f2e", "#1d2150", "#2c3170"];
export const skyColors = (css) => (String(css || "").match(/#[0-9a-f]{6}/gi) || ["#b9e1ff", "#d7f0ff", "#fde6d2"]);

export function createSky(scene) {
  const group = new THREE.Group(); group.renderOrder = -1; scene.add(group);
  const disp = [];
  const keep = (o) => { disp.push(o); return o; };

  // ---------- simboryo (gradient) ----------
  const uni = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  const dome = new THREE.Mesh(keep(new THREE.SphereGeometry(60, 32, 16)), keep(new THREE.ShaderMaterial({
    uniforms: uni, side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float h;" +
      "void main(){ vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.75, h)) : mix(mid, bot, smoothstep(0.0, 0.35, -h)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}",
  })));
  group.add(dome);

  // ---------- bituin ----------
  const N = 520, pos = new Float32Array(N * 3), tw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, y = 0.04 + Math.random() * 0.96, r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 55, y * 55, Math.sin(a) * r * 55], i * 3); tw[i] = Math.random() * 6.28;
  }
  const sg = keep(new THREE.BufferGeometry()); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sm = keep(new THREE.PointsMaterial({ color: 0xffffff, size: 0.42, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }));
  const stars = new THREE.Points(sg, sm); group.add(stars);

  // ---------- araw / buwan ----------
  const sun = new THREE.Mesh(keep(new THREE.SphereGeometry(2.4, 24, 16)), keep(new THREE.MeshBasicMaterial({ color: 0xfff1b8 })));
  sun.position.set(20, 30, -38); group.add(sun);
  const halo = new THREE.Mesh(keep(new THREE.SphereGeometry(3.6, 24, 16)), keep(new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.25, depthWrite: false })));
  sun.add(halo);
  const moon = new THREE.Group(); moon.position.set(-22, 28, -36); group.add(moon);
  moon.add(new THREE.Mesh(keep(new THREE.SphereGeometry(2, 24, 16)), keep(new THREE.MeshBasicMaterial({ color: 0xf4f1e1 }))));
  const crater = keep(new THREE.MeshBasicMaterial({ color: 0xd9d4bd }));
  [[0.6, 0.5, 0.45], [-0.5, -0.4, 0.35], [0.1, -0.9, 0.25]].forEach(([x, y, r]) => { const c = new THREE.Mesh(keep(new THREE.CircleGeometry(r, 16)), crater); c.position.set(x, y, 1.98); moon.add(c); });
  moon.lookAt(0, 0, 0);

  // ---------- ulap ----------
  const clouds = new THREE.Group(); group.add(clouds);
  const cm = keep(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 }));
  const cg = keep(new THREE.SphereGeometry(1, 14, 10));
  for (let i = 0; i < 15; i++) {
    // 9 sa paligid (abot-tanaw) + 6 sa itaas (makikita kapag tumingala)
    const hi = i >= 9, c = new THREE.Group(), a = ((hi ? i - 9 : i) / (hi ? 6 : 9)) * Math.PI * 2 + Math.random() * 0.4, d = hi ? 12 + Math.random() * 12 : 30 + Math.random() * 10;
    c.position.set(Math.cos(a) * d, hi ? 30 + Math.random() * 10 : 9 + Math.random() * 12, Math.sin(a) * d);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(cg, cm); b.scale.set(2.2 + Math.random(), 1.2 + Math.random() * 0.6, 1.6); b.position.set((k - 1.5) * 2, Math.random() * 0.8, Math.random()); c.add(b); }
    c.lookAt(0, c.position.y, 0); clouds.add(c);
  }

  let night = false;
  function set(colors, isNight) {
    night = !!isNight;
    const c = night ? NIGHT : colors && colors.length ? colors : skyColors("");
    uni.top.value.set(c[0]); uni.mid.value.set(c[Math.min(1, c.length - 1)]); uni.bot.value.set(c[c.length - 1]);
    if (!night) { uni.top.value.lerp(new THREE.Color("#4f9dff"), 0.5); } // mas asul sa itaas kapag tumingala
    stars.visible = night || /#0c0d22|#1d2046/i.test(String(colors)); // gabi o Moon base
    moon.visible = night; sun.visible = !night; clouds.visible = !night;
  }
  function update(t) {
    clouds.rotation.y = t * 0.004;
    if (stars.visible) sm.opacity = 0.75 + Math.sin(t * 1.7) * 0.15;
    if (night) group.rotation.y = t * 0.002;
  }
  return {
    group, set, update,
    dispose() { scene.remove(group); disp.forEach((d) => d.dispose()); },
  };
}
