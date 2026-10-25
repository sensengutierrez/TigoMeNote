/* TigoMeNote · tigo/camera-rig.js — camera na puwedeng ikutin (360°), tumingala sa langit, at mag-zoom
   import { createCameraRig, VIEWS } from "./camera-rig.js"
   const rig = createCameraRig({ camera, el, blocked, claim, stick })
     rig.update(dt, focus{x,y,z}, base)  → bawat frame; base = layo ng camera para kasya ang mundo
     rig.yaw()                           → kung saan nakaharap ang camera (para sa direksyon ng lakad)
     rig.setView(id) / rig.next() → id   → isang button lang (parang MIR4): "follow" → "wide" → "top" → "close" → …
     rig.view() · rig.zoom() · rig.dispose()
   Phone: swipe sa gitna ng screen = ikot (kaliwa/kanan, 360°) at taas/baba (pataas = tingala sa langit);
          dalawang daliri (pinch) = zoom. stick() = (opsyonal) joystick ng camera.
   Desktop: hila ng mouse = ikot; wheel = zoom; Q / E = ikot sa keyboard.
   blocked() = true kapag may laro (ang laro ang may hawak ng camera). claim(e) = true kapag iba ang gagamit ng hila (hal. paglipat ng gamit sa bahay). */
export const VIEWS = {
  follow: { elev: 0.32, zoom: 1, name: "Follow view", icon: "🎥" },
  wide: { elev: 0.42, zoom: 1.9, name: "Wide view", icon: "🔭" },
  top: { elev: 1.42, zoom: 1.2, name: "Top view", icon: "🗺️" },
  close: { elev: 0.16, zoom: 0.4, name: "Close-up", icon: "🔍" },
};
const ORDER = ["follow", "wide", "top", "close"];
const ELEV_MIN = -0.9, ELEV_MAX = 1.5, LOW = 0.07; // sa ilalim ng LOW = tumitingala
const ZOOM_MIN = 0.28, ZOOM_MAX = 2.4;

export function createCameraRig({ camera, el, blocked = () => false, claim = () => false, stick = () => null }) {
  const s = { yaw: 0, elev: VIEWS.follow.elev, zoom: 1, view: "follow" };
  const goal = { yaw: 0, elev: s.elev, zoom: 1 };
  const focus = { x: 0, y: 0.95, z: 0, ready: false };
  const pts = new Map(); let pinch0 = 0, zoom0 = 1, dragged = false;
  const keys = new Set();

  function down(e) {
    if (blocked() || e.button > 0 || e.target.closest("button, a, input, select, .tg-pad, .tg-together, .tg-room-bar, .tg-dock, .tg-btns, .tg-sheet, .tg-top")) return;
    if (claim(e)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; zoom0 = goal.zoom; }
    dragged = false;
  }
  function move(e) {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      const [a, b] = [...pts.values()];
      goal.zoom = clampZ(zoom0 * pinch0 / (Math.hypot(a.x - b.x, a.y - b.y) || 1)); s.zoom = goal.zoom;
      dragged = true; return;
    }
    if (!dragged && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6) return;
    if (!dragged) { dragged = true; try { el.setPointerCapture(e.pointerId); } catch (er) {} }
    const k = (e.pointerType === "mouse" ? 2 : 2.6) * Math.PI / Math.max(320, el.clientWidth); // isang swipe sa buong lapad ≈ isang ikot
    goal.yaw -= dx * k; s.yaw = goal.yaw;
    goal.elev = Math.max(ELEV_MIN, Math.min(ELEV_MAX, goal.elev + dy * 0.0055)); s.elev = goal.elev;
  }
  function up(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; }
  function wheel(e) {
    if (blocked()) return;
    e.preventDefault();
    goal.zoom = clampZ(goal.zoom * Math.exp(e.deltaY * 0.0012));
  }
  const clampZ = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "") || (e.target && e.target.isContentEditable);
  function kd(e) { if (!typing(e) && (e.code === "KeyQ" || e.code === "KeyE")) keys.add(e.code); }
  function ku(e) { keys.delete(e.code); }
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

  function setView(id) {
    const v = VIEWS[id] || VIEWS.follow; s.view = VIEWS[id] ? id : "follow";
    goal.elev = v.elev; goal.zoom = v.zoom;
    return s.view;
  }
  const ease = (a, b, k) => a + (b - a) * k;
  function update(dt, f, base) {
    if (keys.has("KeyQ")) goal.yaw += dt * 1.8;
    if (keys.has("KeyE")) goal.yaw -= dt * 1.8;
    const j = !blocked() && stick();
    if (j && (j.x || j.y)) {
      goal.yaw -= j.x * dt * 2.4; s.yaw = goal.yaw;
      goal.elev = Math.max(ELEV_MIN, Math.min(ELEV_MAX, goal.elev + j.y * dt * 1.5));
    }
    const k = Math.min(1, dt * 6);
    s.yaw = ease(s.yaw, goal.yaw, k); s.elev = ease(s.elev, goal.elev, k); s.zoom = ease(s.zoom, goal.zoom, k);
    // malapit (zoom in) = nakatutok mismo kay Tigo; malayo = sa gitna ng mundo (malumanay)
    const near = Math.max(0, Math.min(1, (1.05 - s.zoom) / 0.6));
    const fx = f.x * (0.55 + 0.45 * near), fz = f.z * (0.5 + 0.5 * near), fy = ease(f.y, 0.7, near);
    if (!focus.ready) { focus.x = fx; focus.z = fz; focus.y = fy; focus.ready = true; }
    focus.x = ease(focus.x, fx, 0.08); focus.z = ease(focus.z, fz, 0.08); focus.y = ease(focus.y, fy, 0.08);
    const d = base * s.zoom, e = Math.max(LOW, s.elev);
    const cy = Math.sin(e) * d, ch = Math.cos(e) * d;
    camera.position.set(focus.x + Math.sin(s.yaw) * ch, Math.max(0.25, focus.y + cy - (e === LOW ? 0.55 : 0)), focus.z + Math.cos(s.yaw) * ch);
    // tingala: itaas ang tinitingnan (hanggang ~70°)
    const tilt = s.elev < LOW ? Math.min(1.25, (LOW - s.elev) * 1.4) : 0;
    camera.lookAt(focus.x, focus.y + (tilt ? Math.tan(tilt) * ch : 0), focus.z);
  }
  return {
    update, setView,
    next() { return setView(ORDER[(ORDER.indexOf(s.view) + 1) % ORDER.length]); },
    zoomStep() {
      const n = goal.zoom < 0.7 ? "near" : goal.zoom > 1.35 ? "far" : "mid";
      const to = n === "mid" ? "far" : n === "far" ? "near" : "mid";
      goal.zoom = { near: 0.4, mid: 1, far: 1.9 }[to]; return to;
    },
    view() { return s.view; }, zoom() { return s.zoom; }, elev() { return s.elev; },
    yaw() { return s.yaw; },
    dragging() { return dragged && pts.size > 0; },
    reset() { goal.yaw = 0; setView("follow"); },
    dispose() {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
    },
  };
}
