/* TigoMeNote · tigo/controls.js — pagkontrol kay Tigo: keyboard (WASD / arrows + Space) at phone (2 joystick + jump)
   import { createControls } from "./controls.js"
   const c = createControls({ stage, pad, lookPad, jumpBtn, onJump, onTap })
     c.state() → { x, z }  galaw (-1..1, kaliwang joystick / WASD); x = kanan, z = palapit sa camera
     c.look()  → { x, y }  camera (kanang joystick); x = ikot, y = taas/baba
     c.dispose()
   pad / lookPad = div na may .knob. Tap sa stage (maikli, hindi hila) = onTap (hal. hawakan si Tigo). */
function joystick(pad, onMove) {
  const j = { x: 0, y: 0, id: null };
  if (!pad) return j;
  const knob = pad.querySelector(".knob");
  function mv(e) {
    if (e.pointerId !== j.id) return;
    const r = pad.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    j.x = dx / R; j.y = dy / R;
    if (knob) knob.style.transform = "translate(" + dx * 0.6 + "px," + dy * 0.6 + "px)";
    onMove && onMove();
  }
  function end(e) { if (e.pointerId !== j.id) return; j.id = null; j.x = j.y = 0; if (knob) knob.style.transform = ""; }
  pad.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); j.id = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (er) {} mv(e); });
  pad.addEventListener("pointermove", mv);
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
  j.reset = () => { j.id = null; j.x = j.y = 0; if (knob) knob.style.transform = ""; };
  return j;
}

export function createControls({ stage, pad, lookPad, jumpBtn, onJump, onTap }) {
  const keys = new Set();
  const typing = (e) => { const t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); };
  const MAP = { KeyW: "u", ArrowUp: "u", KeyS: "d", ArrowDown: "d", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };

  function kd(e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.body.classList.contains("modal-open")) return;
    if (e.code === "Space") { e.preventDefault(); if (!e.repeat) onJump && onJump(); return; }
    if (MAP[e.code]) { e.preventDefault(); keys.add(MAP[e.code]); }
  }
  function ku(e) { if (MAP[e.code]) keys.delete(MAP[e.code]); }
  const move = joystick(pad), look = joystick(lookPad);
  function blur() { keys.clear(); move.reset && move.reset(); look.reset && look.reset(); }
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  window.addEventListener("blur", blur);
  if (jumpBtn) jumpBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); onJump && onJump(); });

  // ---------- tap sa stage ----------
  let s0 = null;
  if (stage) {
    stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button, .tg-pad, .tg-room-bar")) return; s0 = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
    stage.addEventListener("pointerup", (e) => {
      if (!s0 || e.pointerId !== s0.id) return;
      const d = Math.hypot(e.clientX - s0.x, e.clientY - s0.y), dt = performance.now() - s0.t; s0 = null;
      if (d < 12 && dt < 350) onTap && onTap(e);
    });
    stage.addEventListener("pointercancel", () => { s0 = null; });
  }

  return {
    state() {
      let x = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0), z = (keys.has("d") ? 1 : 0) - (keys.has("u") ? 1 : 0);
      if (!x && !z && (move.x || move.y)) { x = move.x; z = move.y; if (Math.hypot(x, z) < 0.18) x = z = 0; }
      const m = Math.hypot(x, z); if (m > 1) { x /= m; z /= m; }
      return { x, z };
    },
    look() { return Math.hypot(look.x, look.y) < 0.15 ? { x: 0, y: 0 } : { x: look.x, y: look.y }; },
    stopSwipe() {},
    dispose() { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", blur); },
  };
}
