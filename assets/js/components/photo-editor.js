/* TigoMeNote · components/photo-editor.js
   Photo editor sa browser (walang upload):
     Crop (Free, 1:1, 4:5, 16:9, 9:16) · Rotate · Flip · Brightness/Contrast/Saturation · Filters
     var res = await TMN_PHOTO_EDITOR.open(blob)   → { blob, mode: "replace" | "copy" } o null
   Preview: CSS filter sa canvas. Save: full resolution na canvas (ctx.filter, o pixel math kung walang suporta). */
(function () {
  var I = function (n, c) { return window.TMN_ICON(n, c); };

  var PRESETS = [
    { id: "none",  label: "Original", ops: [] },
    { id: "vivid", label: "Vivid", ops: [["saturate", 1.35], ["contrast", 1.1]] },
    { id: "warm",  label: "Warm",  ops: [["sepia", 0.25], ["saturate", 1.15], ["brightness", 1.03]] },
    { id: "cool",  label: "Cool",  ops: [["hue-rotate", 12], ["saturate", 1.05], ["brightness", 1.02]] },
    { id: "mono",  label: "Mono",  ops: [["grayscale", 1], ["contrast", 1.12]] },
    { id: "fade",  label: "Fade",  ops: [["contrast", 0.85], ["brightness", 1.08], ["saturate", 0.8]] }
  ];
  var ASPECTS = [["free", "Free", 0], ["1:1", "1:1", 1], ["4:5", "4:5", 4 / 5], ["16:9", "16:9", 16 / 9], ["9:16", "9:16", 9 / 16]];

  // ---------- filter math ----------
  function opsFor(st) {
    var ops = [];
    if (st.b) ops.push(["brightness", 1 + st.b / 100]);
    if (st.c) ops.push(["contrast", 1 + st.c / 100]);
    if (st.s) ops.push(["saturate", 1 + st.s / 100]);
    var p = PRESETS.filter(function (x) { return x.id === st.preset; })[0];
    return ops.concat(p ? p.ops : []);
  }
  function cssFilter(ops) {
    if (!ops.length) return "none";
    return ops.map(function (o) { return o[0] + "(" + o[1] + (o[0] === "hue-rotate" ? "deg" : "") + ")"; }).join(" ");
  }
  // Color matrices (W3C Filter Effects) para sa browsers na walang ctx.filter (hal. lumang Safari)
  function matrixFor(op) {
    var n = op[0], v = op[1];
    if (n === "saturate") return [0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v];
    if (n === "grayscale") { var g = 1 - v; return [0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g]; }
    if (n === "sepia") { var q = 1 - v; return [0.393 + 0.607 * q, 0.769 - 0.769 * q, 0.189 - 0.189 * q, 0.349 - 0.349 * q, 0.686 + 0.314 * q, 0.168 - 0.168 * q, 0.272 - 0.272 * q, 0.534 - 0.534 * q, 0.131 + 0.869 * q]; }
    if (n === "hue-rotate") {
      var a = v * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
              0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
              0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
    }
    return null;
  }
  function applyPixels(ctx, w, h, ops) {
    if (!ops.length) return;
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      for (var k = 0; k < ops.length; k++) {
        var o = ops[k];
        if (o[0] === "brightness") { r *= o[1]; g *= o[1]; b *= o[1]; }
        else if (o[0] === "contrast") { r = (r - 0.5) * o[1] + 0.5; g = (g - 0.5) * o[1] + 0.5; b = (b - 0.5) * o[1] + 0.5; }
        else {
          var m = matrixFor(o);
          if (m) { var nr = m[0] * r + m[1] * g + m[2] * b, ng = m[3] * r + m[4] * g + m[5] * b, nb = m[6] * r + m[7] * g + m[8] * b; r = nr; g = ng; b = nb; }
        }
        r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; b = b < 0 ? 0 : b > 1 ? 1 : b;
      }
      d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // Iguhit ang buong image na naka-rotate/flip
  function drawTransformed(ctx, src, rot, flip, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rot * Math.PI / 180);
    if (flip) ctx.scale(-1, 1);
    var sw = rot % 180 === 0 ? w : h, sh = rot % 180 === 0 ? h : w;
    ctx.drawImage(src, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  function open(blob) {
    return new Promise(async function (resolve) {
      var src;
      try { src = await createImageBitmap(blob); }
      catch (e) { window.TMN_UI && TMN_UI.toast("Hindi ma-edit ang file na ito sa browser."); return resolve(null); }

      var st = { rot: 0, flip: false, aspect: "free", crop: { x: 0, y: 0, w: 1, h: 1 }, b: 0, c: 0, s: 0, preset: "none" };
      var resolved = false;

      var root = document.createElement("div");
      root.className = "pe";
      root.innerHTML =
        '<div class="pe-stage"><div class="pe-canvas-wrap"><canvas class="pe-canvas"></canvas>' +
          '<div class="pe-crop"><i class="h nw"></i><i class="h ne"></i><i class="h sw"></i><i class="h se"></i></div></div></div>' +
        '<div class="pe-panel">' +
          '<div class="segmented pe-tabs" role="tablist">' +
            '<button type="button" data-tab="crop" aria-pressed="true">' + I("crop", "ic-sm") + 'Crop</button>' +
            '<button type="button" data-tab="adjust" aria-pressed="false">' + I("sliders", "ic-sm") + 'Adjust</button>' +
            '<button type="button" data-tab="filters" aria-pressed="false">' + I("sparkle", "ic-sm") + 'Filters</button>' +
          '</div>' +
          '<div class="pe-tab" data-pane="crop">' +
            '<div class="pe-label">Aspect</div><div class="chips pe-aspects">' +
              ASPECTS.map(function (a) { return '<button type="button" class="chip' + (a[0] === "free" ? " active" : "") + '" data-aspect="' + a[0] + '">' + a[1] + "</button>"; }).join("") +
            '</div>' +
            '<div class="pe-label">Rotate &amp; flip</div><div class="pe-row">' +
              '<button type="button" class="btn btn-ghost" data-act="rotl">' + I("rotateL", "ic-sm") + 'Left</button>' +
              '<button type="button" class="btn btn-ghost" data-act="rotr">' + I("rotateR", "ic-sm") + 'Right</button>' +
              '<button type="button" class="btn btn-ghost" data-act="flip">' + I("flip", "ic-sm") + 'Flip</button>' +
            '</div>' +
          '</div>' +
          '<div class="pe-tab hidden" data-pane="adjust">' +
            [["b", "Brightness"], ["c", "Contrast"], ["s", "Saturation"]].map(function (x) {
              return '<label class="pe-slider"><span>' + x[1] + '<b data-val="' + x[0] + '">0</b></span><input type="range" min="-100" max="100" value="0" data-adj="' + x[0] + '"></label>';
            }).join("") +
          '</div>' +
          '<div class="pe-tab hidden" data-pane="filters"><div class="pe-presets">' +
            PRESETS.map(function (p) { return '<button type="button" class="pe-preset' + (p.id === "none" ? " active" : "") + '" data-preset="' + p.id + '"><canvas width="88" height="88"></canvas><span>' + p.label + "</span></button>"; }).join("") +
          '</div></div>' +
        '</div>';

      var modal = window.TMN_MODAL.open({
        title: "Edit photo", size: "full", cls: "modal-editor", body: root, closeOnBackdrop: false,
        actions: [
          { label: "Reset", cls: "btn-ghost pe-reset", onClick: function () { reset(); } },
          { label: "Gawing bagong copy", cls: "btn-ghost", onClick: function (m, b) { save("copy", b); } },
          { label: "Save (palitan)", cls: "btn-primary", onClick: function (m, b) { save("replace", b); } }
        ],
        onClose: function () { if (!resolved) { resolved = true; resolve(null); } if (src.close) src.close(); window.removeEventListener("resize", render); }
      });

      var canvas = root.querySelector(".pe-canvas"), ctx = canvas.getContext("2d");
      var wrap = root.querySelector(".pe-canvas-wrap"), stage = root.querySelector(".pe-stage");
      var cropEl = root.querySelector(".pe-crop");

      function dims() { var r = st.rot % 180 !== 0; return { w: r ? src.height : src.width, h: r ? src.width : src.height }; }

      function render() {
        var d = dims();
        var maxW = Math.max(200, stage.clientWidth - 24), maxH = Math.max(200, stage.clientHeight - 24);
        var scale = Math.min(maxW / d.w, maxH / d.h, 1);
        var cw = Math.round(d.w * scale), ch = Math.round(d.h * scale);
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = cw * dpr; canvas.height = ch * dpr;
        canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
        wrap.style.width = cw + "px"; wrap.style.height = ch + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, ch);
        drawTransformed(ctx, src, st.rot, st.flip, cw, ch);
        canvas.style.filter = cssFilter(opsFor(st));
        placeCrop();
      }

      function placeCrop() {
        var c = st.crop;
        cropEl.style.left = c.x * 100 + "%"; cropEl.style.top = c.y * 100 + "%";
        cropEl.style.width = c.w * 100 + "%"; cropEl.style.height = c.h * 100 + "%";
      }

      function ratioNorm() {
        var a = ASPECTS.filter(function (x) { return x[0] === st.aspect; })[0];
        if (!a || !a[2]) return 0;
        var d = dims();
        return a[2] * d.h / d.w; // aspect sa normalized (0..1) na coordinates
      }

      function setAspect(id) {
        st.aspect = id;
        var r = ratioNorm();
        if (!r) st.crop = { x: 0, y: 0, w: 1, h: 1 };
        else {
          var w = 1, h = w / r;
          if (h > 1) { h = 1; w = r; }
          st.crop = { x: (1 - w) / 2, y: (1 - h) / 2, w: w, h: h };
        }
        root.querySelectorAll("[data-aspect]").forEach(function (b) { b.classList.toggle("active", b.dataset.aspect === id); });
        placeCrop();
      }

      // ---- crop drag / resize ----
      var drag = null;
      cropEl.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        var handle = e.target.classList.contains("h") ? (e.target.classList[1]) : "move";
        var rect = wrap.getBoundingClientRect();
        drag = { mode: handle, sx: e.clientX, sy: e.clientY, start: Object.assign({}, st.crop), W: rect.width, H: rect.height };
        cropEl.setPointerCapture(e.pointerId);
      });
      cropEl.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var dx = (e.clientX - drag.sx) / drag.W, dy = (e.clientY - drag.sy) / drag.H;
        var s = drag.start, c = Object.assign({}, s), MIN = 0.06, r = ratioNorm();
        if (drag.mode === "move") {
          c.x = Math.min(Math.max(0, s.x + dx), 1 - s.w);
          c.y = Math.min(Math.max(0, s.y + dy), 1 - s.h);
        } else {
          var left = drag.mode.indexOf("w") > -1, top = drag.mode.indexOf("n") > -1;
          var x1 = s.x, y1 = s.y, x2 = s.x + s.w, y2 = s.y + s.h;
          if (left) x1 = Math.min(Math.max(0, x1 + dx), x2 - MIN); else x2 = Math.max(Math.min(1, x2 + dx), x1 + MIN);
          if (top) y1 = Math.min(Math.max(0, y1 + dy), y2 - MIN); else y2 = Math.max(Math.min(1, y2 + dy), y1 + MIN);
          var w = x2 - x1, h = y2 - y1;
          if (r) { // panatilihin ang aspect: sundan ang lapad
            h = w / r;
            if (top) { y1 = y2 - h; if (y1 < 0) { y1 = 0; h = y2; w = h * r; if (left) x1 = x2 - w; else x2 = x1 + w; } }
            else { y2 = y1 + h; if (y2 > 1) { y2 = 1; h = 1 - y1; w = h * r; if (left) x1 = x2 - w; else x2 = x1 + w; } }
          }
          c = { x: left ? x2 - w : x1, y: top ? y2 - h : y1, w: w, h: h };
        }
        st.crop = c; placeCrop();
      });
      ["pointerup", "pointercancel"].forEach(function (ev) { cropEl.addEventListener(ev, function () { drag = null; }); });

      // ---- controls ----
      root.querySelector(".pe-tabs").addEventListener("click", function (e) {
        var b = e.target.closest("[data-tab]"); if (!b) return;
        root.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        root.querySelectorAll("[data-pane]").forEach(function (p) { p.classList.toggle("hidden", p.dataset.pane !== b.dataset.tab); });
        cropEl.classList.toggle("hidden", b.dataset.tab !== "crop");
      });
      root.querySelector(".pe-aspects").addEventListener("click", function (e) { var b = e.target.closest("[data-aspect]"); if (b) setAspect(b.dataset.aspect); });
      root.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.dataset.act === "rotl") st.rot = (st.rot + 270) % 360;
          if (b.dataset.act === "rotr") st.rot = (st.rot + 90) % 360;
          if (b.dataset.act === "flip") st.flip = !st.flip;
          setAspect(st.aspect); render();
        });
      });
      root.querySelectorAll("[data-adj]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          st[inp.dataset.adj] = Number(inp.value);
          root.querySelector('[data-val="' + inp.dataset.adj + '"]').textContent = (inp.value > 0 ? "+" : "") + inp.value;
          canvas.style.filter = cssFilter(opsFor(st));
        });
      });
      root.querySelector(".pe-presets").addEventListener("click", function (e) {
        var b = e.target.closest("[data-preset]"); if (!b) return;
        st.preset = b.dataset.preset;
        root.querySelectorAll("[data-preset]").forEach(function (x) { x.classList.toggle("active", x === b); });
        canvas.style.filter = cssFilter(opsFor(st));
      });

      // Preview ng bawat filter (maliit na thumbnail)
      (function presetThumbs() {
        var s = Math.min(88 / src.width, 88 / src.height);
        root.querySelectorAll(".pe-preset").forEach(function (b) {
          var cv = b.querySelector("canvas"), c2 = cv.getContext("2d");
          var w = src.width * s, h = src.height * s;
          c2.drawImage(src, (88 - w) / 2, (88 - h) / 2, w, h);
          var p = PRESETS.filter(function (x) { return x.id === b.dataset.preset; })[0];
          cv.style.filter = cssFilter(p.ops);
        });
      })();

      function reset() {
        st = { rot: 0, flip: false, aspect: "free", crop: { x: 0, y: 0, w: 1, h: 1 }, b: 0, c: 0, s: 0, preset: "none" };
        root.querySelectorAll("[data-adj]").forEach(function (inp) { inp.value = 0; root.querySelector('[data-val="' + inp.dataset.adj + '"]').textContent = "0"; });
        root.querySelectorAll("[data-preset]").forEach(function (x) { x.classList.toggle("active", x.dataset.preset === "none"); });
        setAspect("free"); render();
      }

      async function save(mode, btn) {
        btn.disabled = true; var old = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span>Saving…';
        try {
          var d = dims();
          var full = document.createElement("canvas"); full.width = d.w; full.height = d.h;
          var fctx = full.getContext("2d");
          drawTransformed(fctx, src, st.rot, st.flip, d.w, d.h);
          var c = st.crop;
          var cx = Math.round(c.x * d.w), cy = Math.round(c.y * d.h), cw = Math.max(1, Math.round(c.w * d.w)), ch = Math.max(1, Math.round(c.h * d.h));
          var out = document.createElement("canvas"); out.width = cw; out.height = ch;
          var octx = out.getContext("2d"), ops = opsFor(st);
          var hasFilter = typeof octx.filter === "string";
          if (hasFilter) octx.filter = cssFilter(ops);
          octx.drawImage(full, cx, cy, cw, ch, 0, 0, cw, ch);
          if (!hasFilter) applyPixels(octx, cw, ch, ops);
          var blob = await new Promise(function (r) { out.toBlob(r, "image/jpeg", 0.92); });
          resolved = true;
          modal.close();
          resolve({ blob: blob, mode: mode });
        } catch (e) {
          btn.disabled = false; btn.innerHTML = old;
          window.TMN_UI && TMN_UI.toast("Hindi ma-save: " + e.message);
        }
      }

      window.addEventListener("resize", render);
      requestAnimationFrame(render);
    });
  }

  window.TMN_PHOTO_EDITOR = { open: open };
})();
