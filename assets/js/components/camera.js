/* TigoMeNote · components/camera.js — sariling camera na may libreng live filters
     TMN_CAMERA.supported()                       → may camera API ba ang browser
     TMN_CAMERA.open({ mode: "photo"|"video", onCapture(file, { kind, filter }) })
   Live preview na may filter (swipe o tap sa ilalim), front/back, photo, at video hanggang 15 s.
   Naka-"bake" ang filter sa mismong file (canvas → JPEG / canvas.captureStream + mic → MediaRecorder).
   Kailangan: filters.js, icons.js, app-shell.js (TMN_UI.toast) */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var MAX_SEC = 15;

  function supported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !!window.TMN_FILTERS; }
  function pickMime() {
    if (!window.MediaRecorder) return null;
    var list = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    for (var i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(list[i])) return list[i];
    return "";
  }

  function open(o) {
    o = o || {};
    var F = window.TMN_FILTERS, UI = window.TMN_UI;
    var mode = o.mode === "video" ? "video" : "photo";
    var facing = "environment", filter = "none", stream = null, raf = 0, rec = null, recStart = 0, recTimer = 0, closed = false;
    try { filter = localStorage.getItem("tmnCamFilter") || "none"; if (!F.get(filter) || F.get(filter).id !== filter) filter = "none"; } catch (e) {}

    var root = document.createElement("div");
    root.className = "cam";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Camera");
    root.innerHTML =
      '<div class="cam-stage"><video class="cam-video" playsinline muted autoplay></video><canvas class="cam-canvas hidden"></canvas>' +
        '<div class="cam-msg hidden"></div><div class="cam-flash"></div>' +
        '<div class="cam-rec hidden"><span class="cam-dot"></span><span class="cam-time">0:00</span></div>' +
        '<div class="cam-fname" aria-live="polite"></div></div>' +
      '<div class="cam-top">' +
        '<button type="button" class="cam-btn" data-a="close" aria-label="Close">' + I("x") + "</button>" +
        '<span class="cam-free">' + I("sparkle", "ic-sm") + "Free filters</span>" +
        '<button type="button" class="cam-btn" data-a="flip" aria-label="Switch camera">' + I("refresh") + "</button></div>" +
      '<div class="cam-bottom">' +
        '<div class="cam-filters" role="listbox" aria-label="Filters">' + F.list.map(function (f) {
          return '<button type="button" role="option" class="cam-f" data-f="' + f.id + '" aria-selected="' + (f.id === filter) + '">' +
            '<span class="cam-f-sw" style="filter:' + F.css(f.id) + '"></span><span class="cam-f-l">' + f.label + "</span></button>";
        }).join("") + "</div>" +
        '<div class="cam-row">' +
          '<div class="segmented cam-mode" role="group" aria-label="Mode">' +
            '<button type="button" data-m="photo" aria-pressed="' + (mode === "photo") + '">Photo</button>' +
            '<button type="button" data-m="video" aria-pressed="' + (mode === "video") + '">Video</button></div>' +
          '<button type="button" class="cam-shutter" data-a="shoot" aria-label="Take photo"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="cam-ring-bg" cx="40" cy="40" r="36"/><circle class="cam-ring" cx="40" cy="40" r="36"/></svg><span></span></button>' +
          '<span class="cam-spacer"></span></div></div>';
    document.body.appendChild(root);
    document.body.classList.add("cam-open");

    var video = root.querySelector(".cam-video"), canvas = root.querySelector(".cam-canvas"), msg = root.querySelector(".cam-msg");
    var shutter = root.querySelector(".cam-shutter"), fname = root.querySelector(".cam-fname"), ring = root.querySelector(".cam-ring");

    function paintFilter(announce) {
      video.style.filter = F.css(filter);
      root.querySelectorAll(".cam-f").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.f === filter)); });
      var b = root.querySelector('.cam-f[data-f="' + filter + '"]');
      if (b && b.scrollIntoView) b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      if (announce) { fname.textContent = F.get(filter).label; fname.classList.remove("show"); void fname.offsetWidth; fname.classList.add("show"); }
      try { localStorage.setItem("tmnCamFilter", filter); } catch (e) {}
    }
    function paintMode() {
      root.querySelectorAll("[data-m]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.m === mode)); });
      root.classList.toggle("is-video", mode === "video");
      shutter.setAttribute("aria-label", mode === "video" ? "Record video" : "Take photo");
    }

    async function start() {
      stopStream();
      msg.classList.add("hidden");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: mode === "video"
        });
      } catch (e) {
        // Walang mic? Subukan ulit kahit video lang
        if (mode === "video") { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } }); } catch (e2) { stream = null; } }
        if (!stream) {
          msg.innerHTML = "<b>Can't open the camera.</b><span>Allow camera access in your browser settings, or use your phone's camera instead.</span>" +
            '<button type="button" class="btn btn-primary btn-sm" data-a="native">' + I("camera", "ic-sm") + "Use phone camera</button>";
          msg.classList.remove("hidden");
          return;
        }
      }
      if (closed) { stopStream(); return; }
      video.srcObject = stream;
      root.classList.toggle("mirror", facing === "user");
      try { await video.play(); } catch (e) {}
    }
    function stopStream() { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }

    // Laki ng output: kapareho ng camera, max 1920 (photo) / 720 (video, para mabilis at maliit)
    function size(max) {
      var w = video.videoWidth || 1280, h = video.videoHeight || 720, r = Math.min(1, max / Math.max(w, h));
      return { w: Math.round(w * r / 2) * 2, h: Math.round(h * r / 2) * 2 };
    }
    function drawFrame(ctx, s) {
      ctx.save();
      if (facing === "user") { ctx.translate(s.w, 0); ctx.scale(-1, 1); }
      F.draw(ctx, video, s.w, s.h, filter);
      ctx.restore();
    }

    function flash() { var f = root.querySelector(".cam-flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }

    function takePhoto() {
      if (!video.videoWidth) return;
      var s = size(1920);
      canvas.width = s.w; canvas.height = s.h;
      var ctx = canvas.getContext("2d", { willReadFrequently: !F.native() });
      drawFrame(ctx, s);
      flash();
      canvas.toBlob(function (b) {
        if (!b) { UI.toast("Couldn't take the photo."); return; }
        var file = new File([b], "TigoMeNote_" + stamp() + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
        finish(file, "photo");
      }, "image/jpeg", 0.9);
    }

    function startRec() {
      var mime = pickMime();
      if (mime === null || !canvas.captureStream) { UI.toast("Video recording isn't supported here. Using your phone camera."); nativeFallback(); return; }
      var s = size(F.native() ? 1280 : 640);
      canvas.width = s.w; canvas.height = s.h;
      var ctx = canvas.getContext("2d", { willReadFrequently: !F.native() });
      var out = canvas.captureStream(30);
      stream.getAudioTracks().forEach(function (t) { out.addTrack(t); });
      var chunks = [];
      try { rec = new MediaRecorder(out, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined); }
      catch (e) { rec = new MediaRecorder(out); }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        cancelAnimationFrame(raf); clearInterval(recTimer);
        root.classList.remove("recording");
        root.querySelector(".cam-rec").classList.add("hidden");
        ring.style.strokeDashoffset = "";
        var type = (rec.mimeType || mime || "video/webm").split(";")[0];
        var secs = (Date.now() - recStart) / 1000;
        rec = null;
        if (secs < 0.6 || !chunks.length) { UI.toast("Hold a little longer to record."); return; }
        var file = new File(chunks, "TigoMeNote_" + stamp() + (type.indexOf("mp4") > -1 ? ".mp4" : ".webm"), { type: type, lastModified: Date.now() });
        finish(file, "video");
      };
      (function loop() { drawFrame(ctx, s); raf = requestAnimationFrame(loop); })();
      rec.start(250);
      recStart = Date.now();
      root.classList.add("recording");
      root.querySelector(".cam-rec").classList.remove("hidden");
      var time = root.querySelector(".cam-time"), C = 2 * Math.PI * 36;
      recTimer = setInterval(function () {
        var t = (Date.now() - recStart) / 1000;
        time.textContent = "0:" + String(Math.min(MAX_SEC, Math.floor(t))).padStart(2, "0");
        ring.style.strokeDashoffset = String(C * (1 - Math.min(1, t / MAX_SEC)));
        if (t >= MAX_SEC) stopRec();
      }, 100);
    }
    function stopRec() { if (rec && rec.state !== "inactive") rec.stop(); }

    function stamp() { var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }

    function finish(file, kind) {
      var f = filter;
      close();
      if (o.onCapture) o.onCapture(file, { kind: kind, filter: f });
    }
    function nativeFallback() {
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = mode === "video" ? "video/*" : "image/*"; inp.setAttribute("capture", "environment");
      inp.onchange = function () { var file = inp.files && inp.files[0]; if (file && o.onCapture) o.onCapture(file, { kind: mode, filter: "none", native: true }); };
      close();
      inp.click();
    }
    function close() {
      if (closed) return;
      closed = true;
      if (rec && rec.state !== "inactive") { rec.onstop = null; rec.stop(); }
      cancelAnimationFrame(raf); clearInterval(recTimer);
      stopStream();
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("cam-open");
      root.remove();
      if (o.onClose) o.onClose();
    }
    function step(d) {
      var ids = F.list.map(function (x) { return x.id; }), i = ids.indexOf(filter);
      filter = ids[(i + d + ids.length) % ids.length]; paintFilter(true);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); shutter.click(); }
    }
    document.addEventListener("keydown", onKey);

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.f) { filter = b.dataset.f; paintFilter(true); return; }
      if (b.dataset.m && !rec) { if (mode !== b.dataset.m) { mode = b.dataset.m; paintMode(); start(); } return; }
      var a = b.dataset.a;
      if (a === "close") close();
      if (a === "native") nativeFallback();
      if (a === "flip" && !rec) { facing = facing === "user" ? "environment" : "user"; start(); }
      if (a === "shoot") {
        if (!stream) return;
        if (mode === "photo") takePhoto();
        else if (rec) stopRec(); else startRec();
      }
    });
    // Swipe sa preview = palit filter (parang IG)
    var sx = null, stage = root.querySelector(".cam-stage");
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });

    paintFilter(false); paintMode(); start();
    return { close: close };
  }

  window.TMN_CAMERA = { open: open, supported: supported };
})();
