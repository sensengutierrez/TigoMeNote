/* TigoMeNote · tigo/touch-look.js — hila at swipe sa screen habang may laro (hindi sa joystick o mga button)
   import { touchLook } from "./touch-look.js"
   const off = touchLook(stage, { onDrag(dx, dy), onPinch(k), onSwipe(dir), onWheel(dy) })     off() = tanggalin
     onDrag  : bawat galaw ng daliri / mouse (px) → pag-ikot ng view
     onPinch : dalawang daliri; k > 1 = palayo ang mga daliri (zoom in)
     onSwipe : "left" | "right" | "up" | "down" — isang beses bawat 34 px na hila (kaya puwedeng sunod-sunod nang hindi inaangat ang daliri)
   Hindi kumukuha ng pindot sa button, joystick (.tg-pad), pedals, o HUD. */
const SKIP = "button, a, input, select, .tg-pad, .tg-pedals, .tg-quit, .tg-sheet, .tg-btns";
export function touchLook(el, { onDrag, onPinch, onSwipe, onWheel, step = 34 } = {}) {
  const pts = new Map(); let pinch0 = 0;
  function down(e) {
    if (e.button > 0 || (e.target.closest && e.target.closest(SKIP))) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  }
  function move(e) {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      if (onPinch && pinch0) onPinch(d / pinch0); pinch0 = d; return;
    }
    if (onDrag) onDrag(dx, dy);
    if (onSwipe) {
      const sx = e.clientX - p.ax, sy = e.clientY - p.ay;
      if (Math.max(Math.abs(sx), Math.abs(sy)) >= step) {
        onSwipe(Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? "right" : "left") : (sy > 0 ? "down" : "up"));
        p.ax = e.clientX; p.ay = e.clientY;   // bagong simula: puwedeng mag-swipe ulit nang hindi inaangat
      }
    }
  }
  function up(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; }
  function wheel(e) { if (onWheel) { e.preventDefault(); onWheel(e.deltaY); } }
  el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  if (onWheel) el.addEventListener("wheel", wheel, { passive: false });
  return () => {
    el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    el.removeEventListener("wheel", wheel);
  };
}
