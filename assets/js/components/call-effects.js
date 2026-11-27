/* TigoMeNote · components/call-effects.js — mga filter at "mukha" na effect sa camera habang may tawag (lahat libre, sariling disenyo)
   var fx = TMN_CALL_FX.create()
     fx.track(cameraTrack) → ang track na ipapadala (ang camera mismo kung walang effect; kung may effect: canvas.captureStream)
     fx.setFilter(id) · fx.setMask(id) → Promise · fx.setTouch(on) (✨ Touch up) · fx.setBack(id) → Promise (Blur / 🖼️ Background, MediaPipe selfie segmenter) · fx.stop()
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
  var visionP = null, trackerP = null, segP = null;
  var SEG_MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
  function vision() {
    if (!visionP) visionP = import(MP + "/vision_bundle.mjs").then(async function (V) { return { V: V, files: await V.FilesetResolver.forVisionTasks(MP + "/wasm") }; })
      .catch(function (e) { visionP = null; throw e; });
    return visionP;
  }
  async function gpuOrCpu(mk) { try { return await mk("GPU"); } catch (e) { return await mk("CPU"); } }
  function tracker() {   // mukha (fun faces)
    if (!trackerP) trackerP = vision().then(function (x) {
      return gpuOrCpu(function (d) { return x.V.FaceLandmarker.createFromOptions(x.files, { baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: "VIDEO", numFaces: 1 }); });
    }).catch(function (e) { trackerP = null; throw e; });
    return trackerP;
  }
  function segmenter() {   // tao vs likod (Blur at Background)
    if (!segP) segP = vision().then(function (x) {
      return gpuOrCpu(function (d) { return x.V.ImageSegmenter.createFromOptions(x.files, { baseOptions: { modelAssetPath: SEG_MODEL, delegate: d }, runningMode: "VIDEO", outputCategoryMask: false, outputConfidenceMasks: true }); });
    }).catch(function (e) { segP = null; throw e; });
    return segP;
  }

  // ---------- 🖼️ mga background (sariling disenyo, iginuguhit sa canvas) ----------
  var BACKS = [
    { id: "none", name: "None", icon: "🚫" }, { id: "blur", name: "Blur", icon: "🌫️" },
    { id: "sunset", name: "Sunset", icon: "🌅" }, { id: "beach", name: "Beach", icon: "🏖️" }, { id: "night", name: "Night sky", icon: "🌌" },
    { id: "pastel", name: "Pastel", icon: "🍬" }, { id: "bokeh", name: "Lights", icon: "✨" }, { id: "room", name: "Cozy room", icon: "🛋️" },
  ];
  function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function paintBack(c, id, w, h) {
    var g;
    if (id === "sunset") {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2d1b69"); g.addColorStop(0.45, "#f0627a"); g.addColorStop(0.7, "#ffb45a"); g.addColorStop(1, "#2c4a7c");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(255,226,150,.95)"; c.beginPath(); c.arc(w * 0.5, h * 0.66, h * 0.14, Math.PI, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,.25)"; for (var i = 0; i < 6; i++) c.fillRect(w * (0.3 + rnd(i) * 0.3), h * (0.7 + i * 0.04), w * (0.1 + rnd(i + 9) * 0.2), 3);
    } else if (id === "beach") {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#7fd3ff"); g.addColorStop(0.55, "#bdeeff"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "#2aa7d8"; c.fillRect(0, h * 0.55, w, h * 0.15); c.fillStyle = "#f6dfa4"; c.beginPath(); c.moveTo(0, h * 0.72); c.quadraticCurveTo(w * 0.5, h * 0.64, w, h * 0.74); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = "#fff8c9"; c.beginPath(); c.arc(w * 0.82, h * 0.18, h * 0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#6b4a2b"; c.fillRect(w * 0.1, h * 0.35, w * 0.015, h * 0.38); c.fillStyle = "#2f9e44";
      for (var k = 0; k < 5; k++) { c.beginPath(); c.ellipse(w * 0.107 + Math.cos(k * 1.3) * w * 0.05, h * 0.35 + Math.sin(k * 1.3) * h * 0.02, w * 0.06, h * 0.015, k * 0.7, 0, Math.PI * 2); c.fill(); }
    } else if (id === "night") {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b1033"); g.addColorStop(1, "#33215e"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "#fff"; for (var j = 0; j < 140; j++) { c.globalAlpha = 0.3 + rnd(j) * 0.7; c.fillRect(rnd(j + 1) * w, rnd(j + 2) * h * 0.8, 1 + rnd(j + 3) * 2, 1 + rnd(j + 3) * 2); }
      c.globalAlpha = 1; c.fillStyle = "#fff4cf"; c.beginPath(); c.arc(w * 0.8, h * 0.2, h * 0.07, 0, Math.PI * 2); c.fill(); c.fillStyle = "#0b1033"; c.beginPath(); c.arc(w * 0.82, h * 0.19, h * 0.065, 0, Math.PI * 2); c.fill();
    } else if (id === "pastel") {
      c.fillStyle = "#fde7f0"; c.fillRect(0, 0, w, h);
      [["#ffd1e8", 0.2, 0.3, 0.45], ["#c9e7ff", 0.8, 0.25, 0.4], ["#d9f7d4", 0.5, 0.85, 0.5], ["#fff1c1", 0.9, 0.85, 0.35]].forEach(function (b) {
        var r = Math.max(w, h) * b[3], gg = c.createRadialGradient(w * b[1], h * b[2], 0, w * b[1], h * b[2], r); gg.addColorStop(0, b[0]); gg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gg; c.fillRect(0, 0, w, h);
      });
    } else if (id === "bokeh") {
      g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#2b1d14"); g.addColorStop(1, "#120c1e"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      var cols = ["255,196,110", "255,140,120", "255,230,170", "180,160,255"];
      for (var q = 0; q < 34; q++) { var r2 = h * (0.03 + rnd(q) * 0.08), x = rnd(q + 5) * w, y = rnd(q + 7) * h, gr = c.createRadialGradient(x, y, 0, x, y, r2);
        gr.addColorStop(0, "rgba(" + cols[q % 4] + ",.55)"); gr.addColorStop(0.8, "rgba(" + cols[q % 4] + ",.25)"); gr.addColorStop(1, "rgba(" + cols[q % 4] + ",0)"); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r2, 0, Math.PI * 2); c.fill(); }
    } else if (id === "room") {
      c.fillStyle = "#efe3d3"; c.fillRect(0, 0, w, h); c.fillStyle = "#d9c3a5"; c.fillRect(0, h * 0.78, w, h * 0.22);
      c.fillStyle = "#b8865b"; c.fillRect(w * 0.06, h * 0.3, w * 0.3, h * 0.025); c.fillRect(w * 0.64, h * 0.42, w * 0.3, h * 0.025);
      ["#e76f51", "#2a9d8f", "#e9c46a", "#264653"].forEach(function (cl, i) { c.fillStyle = cl; c.fillRect(w * (0.08 + i * 0.05), h * 0.3 - h * (0.08 + (i % 2) * 0.03), w * 0.035, h * (0.08 + (i % 2) * 0.03)); });
      c.fillStyle = "#cfe8ff"; c.fillRect(w * 0.42, h * 0.12, w * 0.18, h * 0.3); c.strokeStyle = "#fff"; c.lineWidth = Math.max(4, w * 0.008); c.strokeRect(w * 0.42, h * 0.12, w * 0.18, h * 0.3);
      c.beginPath(); c.moveTo(w * 0.51, h * 0.12); c.lineTo(w * 0.51, h * 0.42); c.stroke();
      c.fillStyle = "#8d5a3b"; c.fillRect(w * 0.8, h * 0.62, w * 0.06, h * 0.16); c.fillStyle = "#3f9b55"; c.beginPath(); c.arc(w * 0.83, h * 0.57, h * 0.08, 0, Math.PI * 2); c.fill();
    }
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
    var raw = null, out = null, vid = null, cv = null, ctx = null, loop = 0, alive = true;
    var filter = "none", mask = "none", touch = false, back = "none", lm = null, seg = null, faceL = null, lastTs = 0, segTs = 0;
    var pc = null, pctx = null, mc = null, mctx = null, bc = null, bctx = null, bKey = "", mImg = null;
    function css() { var f = FILTERS.filter(function (x) { return x.id === filter; })[0]; return f ? f.css : "none"; }
    function active() { return filter !== "none" || mask !== "none" || touch || back !== "none"; }
    function ensureCanvas() {
      if (cv) return;
      vid = document.createElement("video"); vid.muted = true; vid.playsInline = true; vid.setAttribute("playsinline", "");
      cv = document.createElement("canvas"); ctx = cv.getContext("2d");
      pc = document.createElement("canvas"); pctx = pc.getContext("2d");
      mc = document.createElement("canvas"); mctx = mc.getContext("2d");
      bc = document.createElement("canvas"); bctx = bc.getContext("2d");
    }
    // ✨ Touch up: malambot na balat (malabong kopya na bahagyang nakapatong) + kaunting liwanag
    function soften(c, w, h) { c.save(); c.globalAlpha = 0.42; c.filter = "blur(" + Math.max(1.2, w / 520) + "px) brightness(1.06) saturate(1.06)"; c.drawImage(vid, 0, 0, w, h); c.restore(); }
    function readMask(now) {
      if (now - segTs < 70) return;
      segTs = now;
      try {
        var r = seg.segmentForVideo(vid, now), m = r && r.confidenceMasks && r.confidenceMasks[0];
        if (m) {
          var mw = m.width, mh = m.height, f = m.getAsFloat32Array();
          if (mc.width !== mw || mc.height !== mh) { mc.width = mw; mc.height = mh; mImg = mctx.createImageData(mw, mh); }
          var d = mImg.data;
          for (var i = 0, n = mw * mh; i < n; i++) { var a = (f[i] - 0.25) / 0.5; a = a < 0 ? 0 : a > 1 ? 1 : a; d[i * 4 + 3] = a * 255; }
          mctx.putImageData(mImg, 0, 0);
        }
        if (r && r.close) r.close();
      } catch (e) {}
    }
    function frame() {
      if (!alive || !raw || !active()) return;
      var w = vid.videoWidth, h = vid.videoHeight, now = performance.now();
      if (w && h) {
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; pc.width = w; pc.height = h; }
        if (back !== "none" && seg && mImg) {
          readMask(now);
          // likod
          if (back === "blur") { ctx.filter = "blur(" + Math.round(w / 60) + "px) " + (css() === "none" ? "" : css()); ctx.drawImage(vid, 0, 0, w, h); ctx.filter = "none"; }
          else { var key = back + w + "x" + h; if (bKey !== key) { bKey = key; bc.width = w; bc.height = h; paintBack(bctx, back, w, h); } ctx.drawImage(bc, 0, 0); }
          // tao (galing sa camera) na pinutol gamit ang mask
          pctx.globalCompositeOperation = "source-over"; pctx.clearRect(0, 0, w, h);
          pctx.filter = css(); pctx.drawImage(vid, 0, 0, w, h); pctx.filter = "none";
          if (touch) soften(pctx, w, h);
          pctx.globalCompositeOperation = "destination-in"; pctx.filter = "blur(2px)"; pctx.drawImage(mc, 0, 0, w, h); pctx.filter = "none"; pctx.globalCompositeOperation = "source-over";
          ctx.drawImage(pc, 0, 0);
        } else {
          if (back !== "none" && seg) readMask(now);
          ctx.filter = css(); ctx.drawImage(vid, 0, 0, w, h); ctx.filter = "none";
          if (touch) soften(ctx, w, h);
        }
        if (mask !== "none" && lm) {
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
      setMask: async function (id) { id = id || "none"; if (id !== "none" && !lm) lm = await tracker(); mask = id; return rebuild(); },
      setTouch: function (on) { touch = !!on; return rebuild(); },
      setBack: async function (id) { id = id || "none"; if (id !== "none" && !seg) seg = await segmenter(); back = id; return rebuild(); },
      filter: function () { return filter; }, mask: function () { return mask; }, touch: function () { return touch; }, back: function () { return back; },
      stop: function () { alive = false; clearTimeout(loop); if (out) out.stop(); out = null; if (vid) vid.srcObject = null; },
    };
  }
  window.TMN_CALL_FX = { create: create, FILTERS: FILTERS, MASKS: MASKS, BACKS: BACKS, _back: paintBack,
    _draw: function (c, id, L, w, h, t) { if (DRAW[id]) DRAW[id](c, face(L, w, h), t || 0); } };   // para sa test (pekeng mukha)
})();
