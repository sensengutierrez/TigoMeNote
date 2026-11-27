/* TigoMeNote · components/call-effects.js — mga filter at "mukha" na effect sa camera habang may tawag (lahat libre, sariling disenyo)
   var fx = TMN_CALL_FX.create()
     fx.track(cameraTrack) → ang track na ipapadala (ang camera mismo kung walang effect; kung may effect: canvas.captureStream)
     fx.setFilter(id) · fx.setMask(id) → Promise (kinukuha muna ang face tracker kapag kailangan) · fx.stop()
   TMN_CALL_FX.FILTERS = [{ id, name, css }]   TMN_CALL_FX.MASKS = [{ id, name, icon }]
   Mukha (bigote, salamin, tainga ng pusa…): MediaPipe Face Landmarker (Apache 2.0) mula sa jsDelivr + modelo ng Google; kinukuha lang kapag pinili.
   Kapag hindi makuha (walang internet / lumang phone): kulay na filter lang, may paalala. */
(function () {
  var FILTERS = [
    { id: "none", name: "Normal", css: "none" },
    { id: "warm", name: "Warm", css: "saturate(1.25) sepia(.18) brightness(1.04)" },
    { id: "cool", name: "Cool", css: "saturate(1.1) hue-rotate(-12deg) brightness(1.03) contrast(1.05)" },
    { id: "bright", name: "Glow", css: "brightness(1.15) contrast(.95) saturate(1.15)" },
    { id: "bw", name: "B&W", css: "grayscale(1) contrast(1.15)" },
    { id: "vintage", name: "Vintage", css: "sepia(.55) contrast(1.05) brightness(.98) saturate(.9)" },
    { id: "dream", name: "Dreamy", css: "saturate(1.35) brightness(1.08) hue-rotate(8deg) blur(.4px)" },
    { id: "pop", name: "Pop", css: "saturate(1.8) contrast(1.15)" },
  ];
  var MASKS = [
    { id: "none", name: "None", icon: "🚫" },
    { id: "mustache", name: "Mustache", icon: "🥸" },
    { id: "glasses", name: "Glasses", icon: "🤓" },
    { id: "shades", name: "Shades", icon: "😎" },
    { id: "gent", name: "Gentleman", icon: "🎩" },
    { id: "cat", name: "Kitty", icon: "🐱" },
    { id: "crown", name: "Crown", icon: "👑" },
    { id: "blush", name: "Blush", icon: "☺️" },
  ];
  var MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  var MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  var trackerP = null;
  function tracker() {
    if (!trackerP) trackerP = import(MP + "/vision_bundle.mjs").then(async function (V) {
      var files = await V.FilesetResolver.forVisionTasks(MP + "/wasm");
      var mk = function (d) { return V.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: "VIDEO", numFaces: 1 }); };
      try { return await mk("GPU"); } catch (e) { return await mk("CPU"); }
    }).catch(function (e) { trackerP = null; throw e; });
    return trackerP;
  }

  // ---------- mga disenyo (iginuguhit sa canvas; p = punto sa mukha [x,y] sa pixels) ----------
  function face(L, w, h) {
    var P = function (i) { return [L[i].x * w, L[i].y * h]; };
    var eL = P(33), eR = P(263), ang = Math.atan2(eR[1] - eL[1], eR[0] - eL[0]);
    var size = Math.hypot(P(454)[0] - P(234)[0], P(454)[1] - P(234)[1]);
    return { P: P, ang: ang, size: size, eL: eL, eR: eR };
  }
  function at(c, x, y, ang, fn) { c.save(); c.translate(x, y); c.rotate(ang); fn(); c.restore(); }
  function mustache(c, F) {
    var a = F.P(2), b = F.P(0), x = (a[0] + b[0]) / 2, y = a[1] * 0.45 + b[1] * 0.55, s = F.size;
    at(c, x, y, F.ang, function () {
      c.fillStyle = "#2b1a12";
      [-1, 1].forEach(function (k) {
        c.beginPath(); c.moveTo(0, -s * 0.02);
        c.bezierCurveTo(k * s * 0.08, -s * 0.07, k * s * 0.2, -s * 0.05, k * s * 0.24, s * 0.02);
        c.bezierCurveTo(k * s * 0.3, s * 0.06, k * s * 0.32, -s * 0.03, k * s * 0.29, -s * 0.05);   // kulot sa dulo
        c.bezierCurveTo(k * s * 0.33, -s * 0.01, k * s * 0.3, s * 0.09, k * s * 0.22, s * 0.07);
        c.bezierCurveTo(k * s * 0.14, s * 0.05, k * s * 0.06, s * 0.04, 0, s * 0.03);
        c.closePath(); c.fill();
      });
    });
  }
  function glasses(c, F, dark) {
    var s = F.size, mid = [(F.eL[0] + F.eR[0]) / 2, (F.eL[1] + F.eR[1]) / 2], d = Math.hypot(F.eR[0] - F.eL[0], F.eR[1] - F.eL[1]);
    at(c, mid[0], mid[1], F.ang, function () {
      c.lineWidth = Math.max(3, s * 0.03); c.strokeStyle = dark ? "#111" : "#3b2416";
      var r = d * 0.36;
      [-1, 1].forEach(function (k) {
        c.beginPath();
        if (dark) { c.moveTo(k * d * 0.12, -r * 0.7); c.lineTo(k * (d * 0.12 + r * 1.9), -r * 0.8); c.quadraticCurveTo(k * (d * 0.12 + r * 2), r * 1.1, k * (d * 0.12 + r), r * 0.95); c.quadraticCurveTo(k * d * 0.1, r, k * d * 0.12, -r * 0.7); }
        else c.arc(k * (d * 0.5), 0, r, 0, Math.PI * 2);
        c.fillStyle = dark ? "rgba(10,10,20,.82)" : "rgba(180,220,255,.18)"; c.fill(); c.stroke();
        if (dark) { c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(k * (d * 0.12 + r * 0.6), -r * 0.35, r * 0.25, r * 0.12, -0.4, 0, Math.PI * 2); c.fill(); }
      });
      c.beginPath(); c.moveTo(-d * (dark ? 0.12 : 0.14), -r * 0.15); c.quadraticCurveTo(0, -r * 0.45, d * (dark ? 0.12 : 0.14), -r * 0.15); c.stroke();
      c.beginPath(); c.moveTo(-d * 0.5 - r * (dark ? 1.7 : 1), -r * 0.2); c.lineTo(-s * 0.5, -r * 0.4); c.moveTo(d * 0.5 + r * (dark ? 1.7 : 1), -r * 0.2); c.lineTo(s * 0.5, -r * 0.4); c.stroke();
    });
  }
  function hat(c, F) {   // maliit na top hat
    var t = F.P(10), s = F.size;
    at(c, t[0], t[1] - s * 0.08, F.ang, function () {
      c.fillStyle = "#1d1d24"; c.fillRect(-s * 0.42, -s * 0.06, s * 0.84, s * 0.08);
      c.fillRect(-s * 0.26, -s * 0.5, s * 0.52, s * 0.46);
      c.fillStyle = "#c0392b"; c.fillRect(-s * 0.26, -s * 0.14, s * 0.52, s * 0.07);
    });
  }
  function cat(c, F) {
    var t = F.P(10), s = F.size, n = F.P(1);
    at(c, t[0], t[1], F.ang, function () {
      [-1, 1].forEach(function (k) {
        c.fillStyle = "#3a2f2a"; c.beginPath(); c.moveTo(k * s * 0.18, -s * 0.02); c.lineTo(k * s * 0.36, -s * 0.36); c.lineTo(k * s * 0.44, s * 0.04); c.closePath(); c.fill();
        c.fillStyle = "#ff9fb8"; c.beginPath(); c.moveTo(k * s * 0.24, -s * 0.03); c.lineTo(k * s * 0.35, -s * 0.24); c.lineTo(k * s * 0.4, s * 0.0); c.closePath(); c.fill();
      });
    });
    at(c, n[0], n[1], F.ang, function () {
      c.fillStyle = "#ff7aa2"; c.beginPath(); c.ellipse(0, 0, s * 0.045, s * 0.032, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(40,30,30,.8)"; c.lineWidth = Math.max(2, s * 0.008);
      [-1, 1].forEach(function (k) { [-0.04, 0.0, 0.04].forEach(function (dy) { c.beginPath(); c.moveTo(k * s * 0.08, s * 0.03 + dy * s); c.lineTo(k * s * 0.32, s * 0.01 + dy * s * 2); c.stroke(); }); });
    });
  }
  function crown(c, F) {
    var t = F.P(10), s = F.size;
    at(c, t[0], t[1] - s * 0.06, F.ang, function () {
      var g = c.createLinearGradient(0, -s * 0.35, 0, 0); g.addColorStop(0, "#ffe27a"); g.addColorStop(1, "#e0a106");
      c.fillStyle = g; c.beginPath(); c.moveTo(-s * 0.32, 0);
      [[-0.32, -0.28], [-0.16, -0.12], [0, -0.36], [0.16, -0.12], [0.32, -0.28], [0.32, 0]].forEach(function (p) { c.lineTo(p[0] * s, p[1] * s); });
      c.closePath(); c.fill();
      [[-0.32, -0.28, "#4fc3f7"], [0, -0.36, "#ef476f"], [0.32, -0.28, "#06d6a0"]].forEach(function (p) { c.fillStyle = p[2]; c.beginPath(); c.arc(p[0] * s, p[1] * s, s * 0.035, 0, Math.PI * 2); c.fill(); });
    });
  }
  function blush(c, F, t) {
    var s = F.size;
    [205, 425].forEach(function (i) { var p = F.P(i); var g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], s * 0.12); g.addColorStop(0, "rgba(255,105,140,.55)"); g.addColorStop(1, "rgba(255,105,140,0)"); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], s * 0.12, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = "rgba(255,255,255,.9)";
    for (var i = 0; i < 5; i++) { var a = t / 600 + i * 1.3, r = s * (0.45 + 0.05 * Math.sin(t / 300 + i)), x = (F.eL[0] + F.eR[0]) / 2 + Math.cos(a) * r, y = F.eL[1] + Math.sin(a) * r * 0.6 - s * 0.1, q = s * 0.025 * (1 + Math.sin(t / 200 + i) * 0.4);
      c.beginPath(); c.moveTo(x, y - q * 2); c.lineTo(x + q * 0.6, y - q * 0.6); c.lineTo(x + q * 2, y); c.lineTo(x + q * 0.6, y + q * 0.6); c.lineTo(x, y + q * 2); c.lineTo(x - q * 0.6, y + q * 0.6); c.lineTo(x - q * 2, y); c.lineTo(x - q * 0.6, y - q * 0.6); c.closePath(); c.fill(); }
  }
  var DRAW = {
    mustache: function (c, F) { mustache(c, F); },
    glasses: function (c, F) { glasses(c, F, false); },
    shades: function (c, F) { glasses(c, F, true); },
    gent: function (c, F) { hat(c, F); glasses(c, F, false); mustache(c, F); },
    cat: function (c, F) { cat(c, F); },
    crown: function (c, F) { crown(c, F); },
    blush: function (c, F, t) { blush(c, F, t); },
  };

  function create() {
    var raw = null, out = null, vid = null, cv = null, ctx = null, loop = 0, filter = "none", mask = "none", lm = null, faceL = null, lastTs = 0, alive = true;
    function css() { var f = FILTERS.filter(function (x) { return x.id === filter; })[0]; return f ? f.css : "none"; }
    function active() { return filter !== "none" || mask !== "none"; }
    function ensureCanvas() {
      if (cv) return;
      vid = document.createElement("video"); vid.muted = true; vid.playsInline = true; vid.setAttribute("playsinline", "");
      cv = document.createElement("canvas"); ctx = cv.getContext("2d");
    }
    function frame() {
      if (!alive || !raw || !active()) return;
      var w = vid.videoWidth, h = vid.videoHeight;
      if (w && h) {
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        ctx.filter = css(); ctx.drawImage(vid, 0, 0, w, h); ctx.filter = "none";
        if (mask !== "none" && lm) {
          var now = performance.now();
          if (now - lastTs > 45) { lastTs = now; try { var r = lm.detectForVideo(vid, now); faceL = r && r.faceLandmarks && r.faceLandmarks[0] ? r.faceLandmarks[0] : null; } catch (e) { faceL = null; } }
          if (faceL && DRAW[mask]) DRAW[mask](ctx, face(faceL, w, h), now);
        }
      }
      loop = setTimeout(frame, 40);   // ~24 fps (setTimeout: tuloy kahit nasa ibang tab)
    }
    function rebuild() {
      clearTimeout(loop);
      if (!raw || !active()) { if (out) { out.stop(); out = null; } return raw; }
      ensureCanvas();
      if (vid.srcObject === null || vid.srcObject.getVideoTracks()[0] !== raw) { vid.srcObject = new MediaStream([raw]); vid.play().catch(function () {}); }
      if (!out) { out = cv.captureStream(24).getVideoTracks()[0]; }
      frame();
      return out;
    }
    return {
      track: function (t) { raw = t; return rebuild(); },
      current: function () { return active() && out ? out : raw; },
      setFilter: function (id) { filter = id || "none"; return rebuild(); },
      setMask: async function (id) {
        id = id || "none";
        if (id !== "none" && !lm) lm = await tracker();
        mask = id; return rebuild();
      },
      filter: function () { return filter; }, mask: function () { return mask; },
      stop: function () { alive = false; clearTimeout(loop); if (out) out.stop(); out = null; if (vid) vid.srcObject = null; },
    };
  }
  window.TMN_CALL_FX = { create: create, FILTERS: FILTERS, MASKS: MASKS,
    _draw: function (c, id, L, w, h, t) { if (DRAW[id]) DRAW[id](c, face(L, w, h), t || 0); } };   // para sa test (pekeng mukha)
})();
