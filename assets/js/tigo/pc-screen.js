/* TigoMeNote · tigo/pc-screen.js — gumagalaw na screen ng computer sa mesa (parang totoong PC)
   import { pcScreen } from "./pc-screen.js"
   const s = pcScreen()  → { texture, update(t, night), dispose() }
   Paikot-ikot na palabas bawat ~12 s: 🎮 laro (tumatakbo at tumatalon na karakter, may score) · 💻 code na tinatype · 🎵 music player na may bars.
   May taskbar at orasan (totoong oras). Ina-update nang ~10 beses bawat segundo lang (magaan sa phone). Sariling disenyo. */
import * as THREE from "../../vendor/three/three.module.min.js";

const CODE = ["function play() {", "  tigo.jump();", "  coins += 1;", "}", "", "for (let i = 0; i < 3; i++) {", "  say('hi!');", "}", "// TigoMeNote ✨", "const mood = 'happy';", "if (mood) dance();"];
export function pcScreen() {
  const W = 256, H = 150, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), texture = new THREE.CanvasTexture(cv); texture.colorSpace = THREE.SRGBColorSpace;
  let last = -1;
  function bar(t) {
    c.fillStyle = "rgba(10,14,30,.85)"; c.fillRect(0, H - 14, W, 14);
    ["#ff5a36", "#3dd6c0", "#ffd23f", "#7cc4ff"].forEach((col, i) => { c.fillStyle = col; c.fillRect(6 + i * 14, H - 11, 9, 8); });
    const d = new Date(); c.fillStyle = "#fff"; c.font = "bold 9px sans-serif"; c.textAlign = "right";
    c.fillText(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"), W - 6, H - 4); c.textAlign = "left";
  }
  function win(title, x, y, w, h) {
    c.fillStyle = "#f4f6fb"; c.fillRect(x, y, w, h); c.fillStyle = "#3a4a8a"; c.fillRect(x, y, w, 11);
    c.fillStyle = "#fff"; c.font = "bold 8px sans-serif"; c.fillText(title, x + 4, y + 8);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(x + w - 8 - i * 9, y + 5.5, 3, 0, 7); c.fill(); });
  }
  function game(t) {
    const x = 14, y = 10, w = W - 28, h = H - 34; win("Tigo Run", x, y, w, h);
    const g = c.createLinearGradient(0, y + 11, 0, y + h); g.addColorStop(0, "#7cc4ff"); g.addColorStop(1, "#d8f0ff"); c.fillStyle = g; c.fillRect(x, y + 11, w, h - 11);
    const off = (t * 60) % 64; c.fillStyle = "#58c26a"; c.fillRect(x, y + h - 18, w, 18);
    c.fillStyle = "#3fa858"; for (let k = -1; k < 5; k++) c.fillRect(x + k * 64 - off + 64, y + h - 18, 30, 4);
    for (let k = 0; k < 3; k++) { const bx = x + ((k * 90 - t * 60) % (w + 40) + w + 40) % (w + 40) - 20; c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(bx, y + h - 40, 5, 0, 7); c.fill(); }   // coins
    const bx2 = x + ((140 - t * 60) % (w + 40) + w + 40) % (w + 40) - 20; c.fillStyle = "#8a5a3a"; c.fillRect(bx2, y + h - 30, 12, 12);   // kahon
    const hop = Math.max(0, Math.sin(t * 5)) * 22, px = x + 50, py = y + h - 18 - 16 - hop;
    c.fillStyle = "#ff7a59"; c.fillRect(px, py, 14, 16); c.fillStyle = "#fff"; c.fillRect(px + 8, py + 4, 4, 4); c.fillStyle = "#222"; c.fillRect(px + 10, py + 5, 2, 2);
    c.fillStyle = "#fff"; c.font = "bold 10px sans-serif"; c.fillText("★ " + (Math.floor(t * 7) % 999), x + 6, y + 24);
  }
  function code(t) {
    const x = 12, y = 8, w = W - 24, h = H - 30; win("tigo.js — Editor", x, y, w, h);
    c.fillStyle = "#1e2236"; c.fillRect(x, y + 11, w, h - 11);
    const n = Math.floor(t * 9) % (CODE.join("").length + 40); let left = n;
    c.font = "8px monospace";
    CODE.forEach((ln, i) => { if (left <= 0) return; const s = ln.slice(0, left); left -= ln.length + 1;
      c.fillStyle = "#5c6390"; c.fillText(String(i + 1).padStart(2, " "), x + 3, y + 22 + i * 9);
      c.fillStyle = ln.trim().startsWith("//") ? "#7f8bb3" : i % 3 === 0 ? "#ff9ec7" : i % 3 === 1 ? "#9be564" : "#7cc4ff"; c.fillText(s, x + 18, y + 22 + i * 9);
      if (left <= 0 && Math.floor(t * 3) % 2) { c.fillStyle = "#fff"; c.fillRect(x + 18 + c.measureText(s).width + 1, y + 15 + i * 9, 4, 8); } });
  }
  function music(t) {
    const x = 20, y = 12, w = W - 40, h = H - 36; win("Tigo Music", x, y, w, h);
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#8f5bff"); g.addColorStop(1, "#ff5a9e"); c.fillStyle = g; c.fillRect(x, y + 11, w, h - 11);
    for (let i = 0; i < 18; i++) { const v = (Math.sin(t * 6 + i * 0.7) * 0.5 + 0.5) * (Math.sin(t * 2.3 + i) * 0.3 + 0.7); c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(x + 12 + i * 10, y + h - 22 - v * 50, 6, v * 50); }
    c.fillStyle = "#fff"; c.font = "bold 9px sans-serif"; c.fillText("♪ La la la~ (Tigo mix)", x + 10, y + 26);
    c.fillStyle = "rgba(255,255,255,.4)"; c.fillRect(x + 10, y + h - 12, w - 20, 3); c.fillStyle = "#fff"; c.fillRect(x + 10, y + h - 12, (w - 20) * ((t * 0.05) % 1), 3);
  }
  function draw(t) {
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#1f6f8b"); bg.addColorStop(1, "#5a3fb0"); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    [game, code, music][Math.floor(t / 12) % 3](t); bar(t);
    texture.needsUpdate = true;
  }
  draw(0);
  return {
    texture,
    update(t) { if (t - last < 0.1) return; last = t; draw(t); },
    dispose() { texture.dispose(); },
  };
}
