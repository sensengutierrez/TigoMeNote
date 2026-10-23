/* TigoMeNote · components/image-cropper.js
   Simpleng crop para sa profile photo (bilog, 1:1) at cover/banner (3:1).
     var blob = await TMN_CROPPER.open(file, { aspect: 3, outW: 1500, outH: 500, title: "Cover photo", round: false })
   I-drag para iusog, slider / scroll / pinch para mag-zoom. Ibinabalik: JPEG Blob, o null kung Cancel.
   Kailangan: modal.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };

  function loadImg(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Hindi mabasa ang larawan. Subukan ang JPG o PNG.")); };
      img.src = url;
    });
  }

  async function open(file, o) {
    o = o || {};
    var aspect = o.aspect || 1, outW = o.outW || 600, outH = o.outH || Math.round(outW / aspect);
    var loaded = await loadImg(file);
    var img = loaded.img, iw = img.naturalWidth, ih = img.naturalHeight;

    return new Promise(function (resolve) {
      var root = document.createElement("div");
      root.className = "crop";
      root.innerHTML =
        '<div class="crop-frame' + (o.round ? " round" : "") + '" style="aspect-ratio:' + aspect + '"><img alt="" draggable="false"></div>' +
        '<label class="crop-zoom">' + I("image", "ic-sm") + '<input type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom">' + I("image") + "</label>" +
        '<p class="faint small crop-hint">I-drag para iusog · i-slide para mag-zoom</p>';
      var frame = root.querySelector(".crop-frame"), el = root.querySelector("img"), zoomIn = root.querySelector("input");
      el.src = loaded.url;

      var st = { zoom: 1, x: 0, y: 0, fw: 0, fh: 0, base: 1 };
      function measure() {
        var r = frame.getBoundingClientRect();
        var ox = st.fw ? (st.x - st.fw / 2) / scale() : null, oy = st.fh ? (st.y - st.fh / 2) / scale() : null;
        st.fw = r.width; st.fh = r.height;
        st.base = Math.max(st.fw / iw, st.fh / ih);
        if (ox === null) { st.x = (st.fw - iw * scale()) / 2; st.y = (st.fh - ih * scale()) / 2; }
        else { st.x = st.fw / 2 + ox * scale(); st.y = st.fh / 2 + oy * scale(); }
        apply();
      }
      function scale() { return st.base * st.zoom; }
      function clamp() {
        var s = scale();
        st.x = Math.min(0, Math.max(st.fw - iw * s, st.x));
        st.y = Math.min(0, Math.max(st.fh - ih * s, st.y));
      }
      function apply() {
        clamp();
        var s = scale();
        el.style.width = iw * s + "px"; el.style.height = ih * s + "px";
        el.style.transform = "translate(" + st.x + "px," + st.y + "px)";
      }
      function setZoom(z, cx, cy) {
        z = Math.max(1, Math.min(4, z));
        if (cx === undefined) { cx = st.fw / 2; cy = st.fh / 2; }
        var s0 = scale(); st.zoom = z; var s1 = scale();
        st.x = cx - (cx - st.x) * (s1 / s0); st.y = cy - (cy - st.y) * (s1 / s0);
        zoomIn.value = z; apply();
      }
      zoomIn.addEventListener("input", function () { setZoom(Number(zoomIn.value)); });
      frame.addEventListener("wheel", function (e) {
        e.preventDefault();
        var r = frame.getBoundingClientRect();
        setZoom(st.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });

      // Drag + pinch (pointer events)
      var pts = {}, last = null, pinch = null;
      frame.addEventListener("pointerdown", function (e) { frame.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY }; pinch = null; });
      frame.addEventListener("pointermove", function (e) {
        if (!pts[e.pointerId]) return;
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pts);
        if (ids.length >= 2) {
          var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
          var r = frame.getBoundingClientRect();
          if (pinch) setZoom(pinch.zoom * d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
          else pinch = { d: d, zoom: st.zoom };
          return;
        }
        st.x += e.clientX - last.x; st.y += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; apply();
      });
      function up(e) { delete pts[e.pointerId]; pinch = null; var ids = Object.keys(pts); last = ids.length ? pts[ids[0]] : null; }
      frame.addEventListener("pointerup", up); frame.addEventListener("pointercancel", up);
      window.addEventListener("resize", measure);

      var done = false;
      function finish(v) { done = true; m.close(); resolve(v); }
      async function save(btn) {
        btn.disabled = true;
        var s = scale();
        var c = document.createElement("canvas"); c.width = outW; c.height = outH;
        var ctx = c.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, -st.x / s, -st.y / s, st.fw / s, st.fh / s, 0, 0, outW, outH);
        var q = 0.88, blob;
        do { blob = await new Promise(function (r) { c.toBlob(r, "image/jpeg", q); }); q -= 0.1; } while (blob && blob.size > 2.5 * 1024 * 1024 && q > 0.4);
        finish(blob);
      }
      var m = window.TMN_MODAL.open({
        title: o.title || "I-crop", size: aspect > 1.5 ? "lg" : "sm", cls: "modal-crop", body: root,
        actions: [
          { label: "Cancel", cls: "btn-ghost", onClick: function () { finish(null); } },
          { label: I("check", "ic-sm") + "Gamitin", cls: "btn-primary", onClick: function (api, b) { save(b); } }
        ],
        onClose: function () { window.removeEventListener("resize", measure); URL.revokeObjectURL(loaded.url); if (!done) resolve(null); }
      });
      requestAnimationFrame(function () { requestAnimationFrame(measure); });
    });
  }

  window.TMN_CROPPER = { open: open };
})();
