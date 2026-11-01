/* TigoMeNote · season-fx.js — gumagalaw na epekto ng mga seasonal theme (canvas, magaan)
     snow      🎄 Christmas  — umuulan ng niyebe
     fireworks 🎆 New Year   — paputok at confetti
     bats      🎃 Halloween  — lumilipad na paniki at multo
     hearts    💘 Valentine's — lumulutang na puso
   Sa buong app: kusang sumusunod sa Background (html[data-fx], galing sa appearance.js) — canvas sa likod ng laman.
   Sa chat:      TMN_FX.attach(hostEl, kind) → canvas sa ibabaw ng hostEl (hindi napipindot); kind "" = alisin.
   Humihinto kapag nakatago ang page; isang larawan lang kapag "reduce motion". */
(function () {
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KINDS = ["snow", "fireworks", "bats", "hearts"];
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function Fx(canvas, kind, sizeOf) {
    var ctx = canvas.getContext("2d"), parts = [], sparks = [], W = 0, H = 0, dpr = 1, raf = 0, last = 0, nextRocket = 0, alive = true;
    function resize() {
      var s = sizeOf(); dpr = Math.min(2, window.devicePixelRatio || 1);
      if (s.w === W && s.h === H) return;
      W = s.w; H = s.h; canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      seed();
    }
    function count(per, max) { return Math.max(6, Math.min(max, Math.round(W * H / per))); }
    function seed() {
      parts = []; sparks = [];
      var i, n;
      if (kind === "snow") for (n = count(9000, 80), i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(-H, H), r: rnd(1.2, 3.8), vy: rnd(18, 55), ph: rnd(0, 6.3), flake: Math.random() < 0.12 });
      if (kind === "fireworks") for (n = count(30000, 30), i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(-H, H), w: rnd(4, 8), h: rnd(2, 4), vy: rnd(25, 60), rot: rnd(0, 6.3), vr: rnd(-3, 3), c: ["#ffd23f", "#ff5aa5", "#3dd6ff", "#9b7bff", "#ffffff"][i % 5] });
      if (kind === "bats") {
        for (n = Math.max(4, Math.min(10, Math.round(W / 140))), i = 0; i < n; i++) parts.push({ e: "🦇", x: rnd(-W * 0.2, W), y: rnd(H * 0.05, H * 0.6), s: rnd(16, 28), vx: rnd(35, 80) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 6.3) });
        for (i = 0; i < 3; i++) parts.push({ e: "👻", x: rnd(0, W), y: rnd(H * 0.4, H), s: rnd(22, 32), vy: rnd(-14, -6), ph: rnd(0, 6.3), ghost: true });
      }
      if (kind === "hearts") for (n = count(22000, 36), i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H * 1.3), s: rnd(7, 18), vy: rnd(-40, -16), ph: rnd(0, 6.3), c: ["#ff4d8d", "#ff7aa8", "#e11d48", "#ffb3cd"][i % 4], a: rnd(0.55, 0.95) });
    }
    function heart(x, y, s, c, a) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.translate(x, y); ctx.scale(s / 16, s / 16);
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -2, -6, -11, 0, -6); ctx.bezierCurveTo(6, -11, 9, -2, 0, 5); ctx.fill(); ctx.restore();
    }
    function rocket(t) {
      var x = rnd(W * 0.12, W * 0.88), y = rnd(H * 0.12, H * 0.45), cols = [["#ffd23f", "#fff3b0"], ["#ff5aa5", "#ffd1e6"], ["#3dd6ff", "#d6f6ff"], ["#9b7bff", "#e2d8ff"], ["#7cf29c", "#e3ffe9"]][Math.floor(rnd(0, 5))];
      var n = Math.round(rnd(28, 46));
      for (var i = 0; i < n; i++) { var a = (i / n) * 6.283, v = rnd(60, 140); sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.9, 1.5), age: 0, c: cols[i % 2] }); }
      nextRocket = t + rnd(0.7, 1.6);
    }
    function frame(ts) {
      if (!alive) return;
      var t = ts / 1000, dt = last ? Math.min(0.05, t - last) : 0.016; last = t;
      resize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var i, p;
      if (kind === "snow") {
        ctx.fillStyle = "#ffffff";
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; p.y += p.vy * dt; p.x += Math.sin(t * 0.8 + p.ph) * 12 * dt;
          if (p.y > H + 6) { p.y = -6; p.x = rnd(0, W); }
          ctx.globalAlpha = 0.85;
          if (p.flake) { ctx.font = (p.r * 5) + "px sans-serif"; ctx.fillText("❄", p.x, p.y); }
          else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        }
      }
      if (kind === "fireworks") {
        if (t >= nextRocket) rocket(t);
        for (i = sparks.length - 1; i >= 0; i--) {
          p = sparks[i]; p.age += dt; if (p.age > p.life) { sparks.splice(i, 1); continue; }
          p.vx *= 0.985; p.vy = p.vy * 0.985 + 60 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.1, 0, 6.283); ctx.fill();
        }
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 8) { p.y = -8; p.x = rnd(0, W); }
          ctx.save(); ctx.globalAlpha = 0.8; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        }
      }
      if (kind === "bats") {
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          if (p.ghost) { p.y += p.vy * dt; p.x += Math.sin(t + p.ph) * 10 * dt; if (p.y < -40) { p.y = H + 40; p.x = rnd(0, W); } ctx.globalAlpha = 0.55; }
          else { p.x += p.vx * dt; if (p.vx > 0 && p.x > W + 40) p.x = -40; if (p.vx < 0 && p.x < -40) p.x = W + 40; ctx.globalAlpha = 0.9; }
          var yy = p.y + (p.ghost ? 0 : Math.sin(t * 3 + p.ph) * 14);
          ctx.save(); ctx.translate(p.x, yy); if (!p.ghost) ctx.scale(p.vx < 0 ? -1 : 1, 0.75 + Math.abs(Math.sin(t * 9 + p.ph)) * 0.35);
          ctx.font = p.s + "px sans-serif"; ctx.fillText(p.e, 0, 0); ctx.restore();
        }
      }
      if (kind === "hearts") {
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; p.y += p.vy * dt; if (p.y < -20) { p.y = H + 20; p.x = rnd(0, W); }
          heart(p.x + Math.sin(t * 1.4 + p.ph) * 10, p.y, p.s * (1 + Math.sin(t * 3 + p.ph) * 0.06), p.c, p.a);
        }
      }
      ctx.globalAlpha = 1;
      if (!still && !document.hidden) raf = requestAnimationFrame(frame); else raf = 0;
    }
    function start() { if (!raf && alive) { last = 0; raf = requestAnimationFrame(frame); } }
    function onVis() { if (!document.hidden) start(); }
    document.addEventListener("visibilitychange", onVis);
    if (kind === "fireworks") nextRocket = 0;
    start();
    if (still) { for (var k = 0; k < 4 && kind === "fireworks"; k++) rocket(0); }
    return { stop: function () { alive = false; if (raf) cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); canvas.remove(); } };
  }

  // ---------- buong app (Background) ----------
  var page = null, pageKind = "";
  function syncPage() {
    var k = document.documentElement.getAttribute("data-fx") || "";
    if (KINDS.indexOf(k) < 0) k = "";
    if (k === pageKind) return;
    pageKind = k;
    if (page) { page.stop(); page = null; }
    if (!k || !document.body) return;
    var c = document.createElement("canvas"); c.className = "fx-page"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    page = Fx(c, k, function () { return { w: innerWidth, h: innerHeight }; });
  }
  document.addEventListener("tmn:look", syncPage);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncPage); else syncPage();

  // ---------- isang element (hal. chat) ----------
  function attach(host, kind) {
    if (!host) return;
    if (host._fx && host._fxKind === kind) return;
    if (host._fx) { host._fx.stop(); host._fx = null; host._fxKind = ""; }
    if (KINDS.indexOf(kind) < 0) return;
    var c = document.createElement("canvas"); c.className = "fx-box"; c.setAttribute("aria-hidden", "true");
    host.appendChild(c);
    host._fxKind = kind;
    host._fx = Fx(c, kind, function () { return { w: host.clientWidth, h: host.clientHeight }; });
  }
  window.TMN_FX = { attach: attach, KINDS: KINDS };
})();
