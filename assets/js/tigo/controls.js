/* TigoMeNote · tigo/controls.js — pagkontrol kay Tigo: keyboard (WASD / arrows + Space) at phone (joystick, jump, swipe)
   import { createControls } from "./controls.js"
   const c = createControls({ stage, pad, jumpBtn, onJump })
     c.state()  → { x, z }  galaw (-1..1); x = kanan, z = palapit sa camera
     c.dispose()
   stage = elementong sinu-swipe; pad = joystick (div na may .knob); jumpBtn = button.
   Swipe sa stage: maikling hila = maglakad doon nang sandali; tap = talon (kung walang ibang action ang tap). */
export function createControls({ stage, pad, jumpBtn, onJump, onTap }) {
  const keys = new Set();
  const joy = { x: 0, z: 0, id: null };
  const swipe = { x: 0, z: 0, until: 0 };
  const typing = (e) => { const t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); };
  const MAP = { KeyW: "u", ArrowUp: "u", KeyS: "d", ArrowDown: "d", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };

  function kd(e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.body.classList.contains("modal-open")) return;
    if (e.code === "Space") { e.preventDefault(); if (!e.repeat) onJump && onJump(); return; }
    if (MAP[e.code]) { e.preventDefault(); keys.add(MAP[e.code]); }
  }
  function ku(e) { if (MAP[e.code]) keys.delete(MAP[e.code]); }
  function blur() { keys.clear(); joy.x = joy.z = 0; }
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  window.addEventListener("blur", blur);

  // ---------- joystick ----------
  const knob = pad && pad.querySelector(".knob");
  function joyMove(e) {
    if (e.pointerId !== joy.id) return;
    const r = pad.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    joy.x = dx / R; joy.z = dy / R;
    if (knob) knob.style.transform = "translate(" + dx * 0.6 + "px," + dy * 0.6 + "px)";
  }
  function joyEnd(e) { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.z = 0; if (knob) knob.style.transform = ""; }
  if (pad) {
    pad.addEventListener("pointerdown", (e) => { e.preventDefault(); joy.id = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (er) {} joyMove(e); });
    pad.addEventListener("pointermove", joyMove);
    pad.addEventListener("pointerup", joyEnd); pad.addEventListener("pointercancel", joyEnd);
  }
  if (jumpBtn) jumpBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); onJump && onJump(); });

  // ---------- swipe sa stage ----------
  let s0 = null;
  if (stage) {
    stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button, .tg-pad")) return; s0 = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
    stage.addEventListener("pointerup", (e) => {
      if (!s0 || e.pointerId !== s0.id) return;
      const dx = e.clientX - s0.x, dy = e.clientY - s0.y, d = Math.hypot(dx, dy), dt = performance.now() - s0.t; s0 = null;
      if (d < 12 && dt < 350) { onTap && onTap(e); return; }
      if (d >= 30) { swipe.x = dx / d; swipe.z = dy / d; swipe.until = performance.now() + Math.min(1400, 350 + d * 3); }
    });
    stage.addEventListener("pointercancel", () => { s0 = null; });
  }

  return {
    state() {
      let x = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0), z = (keys.has("d") ? 1 : 0) - (keys.has("u") ? 1 : 0);
      if (!x && !z && (joy.x || joy.z)) { x = joy.x; z = joy.z; if (Math.hypot(x, z) < 0.18) x = z = 0; }
      if (!x && !z && performance.now() < swipe.until) { x = swipe.x; z = swipe.z; }
      const m = Math.hypot(x, z); if (m > 1) { x /= m; z /= m; }
      return { x, z };
    },
    stopSwipe() { swipe.until = 0; },
    dispose() { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", blur); },
  };
}
