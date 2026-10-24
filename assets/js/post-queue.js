/* TigoMeNote · post-queue.js
   OFFLINE QUEUE ng posts. Pwedeng mag-post kahit walang internet:
     1) enqueue() → kino-compress ang photos/videos at sine-save sa device ("Naka-pila")
     2) kapag may internet → kusang ina-upload (posts-fast: createUpload → PUT files → createPost)
     3) ang server ang magpapalabas sa naka-schedule na oras (publish_at)
   Gamit:
     await TMN_POSTQ.prepare(items, onProgress)   → compressed files (photo ≤1600px JPEG, video 720p, max 15 s)
     await TMN_POSTQ.enqueue({ files, caption, visibility, publishAt })
     TMN_POSTQ.list() / retry(id) / cancel(id) / process()
   Event: "tmn:queue" sa document. Kailangan: config.js, api.js (TMN_API). */
(function () {
  var C = window.TMN_CONFIG;
  var DBV = 1, dbp = null, running = false;
  var PHOTO_MAX = 1600, PHOTO_Q = 0.82, VIDEO_MAX_SEC = 15, VIDEO_LONG = 1280, VIDEO_BPS = 1500000;

  function dbName() { return "tmn-outbox-" + ((window.TMN_USER || {}).id || "guest"); }
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(dbName(), DBV);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains("outbox")) r.result.createObjectStore("outbox", { keyPath: "id" }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function store(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction("outbox", mode), s = t.objectStore("outbox"), box = {};
        fn(s, box);
        t.oncomplete = function () { res(box.v); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error || new Error("Device storage is full.")); };
      });
    });
  }
  function getAll() { return store("readonly", function (s, b) { var r = s.getAll(); r.onsuccess = function () { b.v = r.result || []; }; }); }
  function put(e) { return store("readwrite", function (s) { s.put(e); }); }
  function del(id) { return store("readwrite", function (s) { s.delete(id); }); }
  function emit() { document.dispatchEvent(new CustomEvent("tmn:queue")); badge(); }

  function uid() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  // ================= Compression =================
  function fit(w, h, max) { var r = Math.min(1, max / Math.max(w, h)); return { w: Math.round(w * r), h: Math.round(h * r) }; }

  async function compressPhoto(blob) {
    var bmp = await createImageBitmap(blob);
    var s = fit(bmp.width, bmp.height, PHOTO_MAX);
    var c = document.createElement("canvas"); c.width = s.w; c.height = s.h;
    c.getContext("2d").drawImage(bmp, 0, 0, s.w, s.h);
    if (bmp.close) bmp.close();
    var q = PHOTO_Q, out;
    do {
      out = await new Promise(function (r) { c.toBlob(r, "image/jpeg", q); });
      q -= 0.12;
    } while (out && out.size > 1.8 * 1024 * 1024 && q > 0.4);
    return { kind: "photo", blob: out, mime: "image/jpeg", w: s.w, h: s.h, duration: 0, size: out.size };
  }

  function pickVideoMime() {
    if (!window.MediaRecorder) return null;
    var list = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1,mp4a", "video/mp4"];
    for (var i = 0; i < list.length; i++) { try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) {} }
    return null;
  }

  // Re-encode ng video sa 720p, unang 15 segundo lang. Real-time ito (15 s na video ≈ 15 s na proseso).
  function compressVideo(blob, onPct) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var v = document.createElement("video");
      v.src = url; v.playsInline = true; v.preload = "auto"; v.crossOrigin = "anonymous";
      v.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Can't read the video.")); };
      v.onloadedmetadata = async function () {
        var dur = Math.min(isFinite(v.duration) && v.duration > 0 ? v.duration : VIDEO_MAX_SEC, VIDEO_MAX_SEC);
        var mime = pickVideoMime();
        var s = fit(v.videoWidth || 1280, v.videoHeight || 720, VIDEO_LONG);
        // Walang MediaRecorder: ipadala ang original kung maliit at maikli na
        if (!mime) {
          URL.revokeObjectURL(url);
          if ((v.duration || 0) <= VIDEO_MAX_SEC + 0.5 && blob.size <= 12 * 1024 * 1024)
            return resolve({ kind: "video", blob: blob, mime: /mp4/.test(blob.type) ? "video/mp4" : "video/webm", w: v.videoWidth, h: v.videoHeight, duration: v.duration, size: blob.size });
          return reject(new Error("This browser can't compress the video. Use a video of 15 s or less and 12 MB or less."));
        }
        var c = document.createElement("canvas"); c.width = s.w; c.height = s.h;
        var ctx = c.getContext("2d");
        var stream = c.captureStream(30);
        var ac = null;
        try { // audio: dumadaan sa AudioContext para hindi marinig habang nagko-convert
          ac = new (window.AudioContext || window.webkitAudioContext)();
          var src = ac.createMediaElementSource(v), dest = ac.createMediaStreamDestination();
          src.connect(dest);
          dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
        } catch (e) { v.muted = true; }
        var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: VIDEO_BPS, audioBitsPerSecond: 96000 });
        var chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          URL.revokeObjectURL(url);
          try { if (ac) ac.close(); } catch (e) {}
          var type = /mp4/.test(mime) ? "video/mp4" : "video/webm";
          var out = new Blob(chunks, { type: type });
          // Kung mas malaki pa ang resulta at pasok na ang original, original na lang
          var origOk = (v.duration || 0) <= VIDEO_MAX_SEC + 0.5 && blob.size <= 12 * 1024 * 1024 && /^video\/(webm|mp4)/.test(blob.type);
          if (origOk && (out.size >= blob.size || !out.size))
            return resolve({ kind: "video", blob: blob, mime: /mp4/.test(blob.type) ? "video/mp4" : "video/webm", w: v.videoWidth, h: v.videoHeight, duration: v.duration, size: blob.size });
          if (!out.size) return reject(new Error("The video wasn't compressed. Please try again."));
          if (out.size > 12 * 1024 * 1024) return reject(new Error("The video is still too large after compressing."));
          resolve({ kind: "video", blob: out, mime: type, w: s.w, h: s.h, duration: dur, size: out.size });
        };
        var stopped = false, loop = null, guard = null;
        function finish() {
          if (stopped) return; stopped = true;
          clearInterval(loop); clearTimeout(guard);
          try { v.pause(); } catch (e) {}
          if (rec.state !== "inactive") rec.stop();
        }
        // Timer loop (gumagana kahit nakatago ang video; ang requestVideoFrameCallback ay hindi laging tumatakbo)
        function draw() {
          if (stopped) return;
          try { ctx.drawImage(v, 0, 0, s.w, s.h); } catch (e) {}
          if (onPct) onPct(Math.min(1, v.currentTime / (dur || 1)));
          if (v.currentTime >= dur || v.ended) finish();
        }
        v.onended = finish;
        try {
          if (ac && ac.state === "suspended") await Promise.race([ac.resume(), new Promise(function (r) { setTimeout(r, 600); })]);
          v.currentTime = 0;
          try { await v.play(); }
          catch (e1) { v.muted = true; await v.play(); } // walang permiso sa tunog → walang audio, pero tuloy
          rec.start(500);
          loop = setInterval(draw, 33); draw();
          guard = setTimeout(finish, (dur + 8) * 1000); // safety: huwag ma-stuck
        } catch (e) { URL.revokeObjectURL(url); reject(new Error("Can't play the video to compress it.")); }
      };
    });
  }

  // items: galing sa TMN_MEDIA (may .blob, .type, .w, .h, .duration, .takenAt)
  async function prepare(items, onProgress) {
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var report = function (pct) { if (onProgress) onProgress(i, items.length, pct, it); };
      report(0);
      var f = it.type === "video" ? await compressVideo(it.blob, report) : await compressPhoto(it.blob);
      f.sourceId = it.id; f.takenAt = it.takenAt || it.createdAt; f.thumb = it.thumb || null;
      out.push(f);
      report(1);
    }
    return out;
  }

  async function enqueue(o) {
    var e = {
      id: uid(), status: "queued", caption: o.caption || "", visibility: o.visibility || "public",
      publishAt: o.publishAt || null, files: o.files, createdAt: Date.now(), attempts: 0,
      error: null, postId: null, progress: { done: 0, total: o.files.length },
      cover: o.files[0] ? (o.files[0].thumb || (o.files[0].kind === "photo" ? o.files[0].blob : null)) : null
    };
    await put(e);
    emit();
    setTimeout(process, 50);
    return e;
  }

  // ================= Upload =================
  function putFile(url, file) {
    return fetch(url, { method: "PUT", headers: { "content-type": file.mime, "x-upsert": "true" }, body: file.blob })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error("Upload " + r.status + ": " + t.slice(0, 120)); }); });
  }

  function backoffOk(e) {
    if (e.status !== "error") return true;
    var wait = Math.min(10 * 60 * 1000, 15000 * Math.pow(2, Math.max(0, e.attempts - 1)));
    return Date.now() - (e.lastTry || 0) >= wait;
  }

  async function process() {
    if (running || !navigator.onLine || !window.TMN_TOKEN) return;
    running = true;
    try {
      var all = (await getAll()).sort(function (a, b) { return a.createdAt - b.createdAt; });
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (e.status === "done" || e.status === "blocked" || !backoffOk(e) || !navigator.onLine) continue;
        try {
          e.status = "uploading"; e.error = null; e.lastTry = Date.now(); await put(e); emit();
          var up = await TMN_API.call("posts", "createUpload", {
            client_id: e.id, caption: e.caption,
            files: e.files.map(function (f) { return { kind: f.kind, mime: f.mime, size: f.size, duration: f.duration }; })
          });
          if (!up.already) {
            for (var k = 0; k < up.uploads.length; k++) {
              await putFile(up.uploads[k].url, e.files[up.uploads[k].index]);
              e.progress = { done: k + 1, total: e.files.length }; await put(e); emit();
            }
          }
          var res;
          for (var t = 0; t < 3; t++) { // retry kung hindi pa "nakikita" ng storage ang file
            try {
              res = await TMN_API.call("posts", "createPost", {
                client_id: e.id, caption: e.caption, visibility: e.visibility,
                publish_at: e.publishAt || null, taken_at: e.files[0] && e.files[0].takenAt ? new Date(e.files[0].takenAt).toISOString() : null,
                media: e.files.map(function (f, n) { return { path: up.uploads ? up.uploads[n].path : null, kind: f.kind, mime: f.mime, w: f.w, h: f.h, duration: f.duration, size: f.size }; })
              });
              break;
            } catch (err) { if (err.data && err.data.retry && t < 2) await new Promise(function (r) { setTimeout(r, 1500); }); else throw err; }
          }
          // Tapos: burahin ang malalaking blob, itira ang maliit na record para sa "Posted ✓"
          e.status = "done"; e.postId = (res && res.post && res.post.id) || up.post_id || null;
          e.doneAt = Date.now(); e.files = e.files.map(function (f) { return { kind: f.kind, size: f.size }; });
          await put(e); emit();
          if (window.TMN_UI) TMN_UI.toast(e.publishAt && new Date(e.publishAt) > new Date() ? "Uploaded ✓ It will appear at the scheduled time." : "Posted ✓");
        } catch (err) {
          e.attempts = (e.attempts || 0) + 1;
          // Hinarang ng Community Guidelines: hindi na uulitin
          e.status = err.data && err.data.blocked ? "blocked" : navigator.onLine ? "error" : "queued";
          e.error = err.message || "Upload failed";
          await put(e); emit();
          if (err.status === 401) break; // expired session: hintayin ang login
        }
      }
      // Linisin ang mga "done" na lampas 24 oras
      var old = (await getAll()).filter(function (x) { return x.status === "done" && Date.now() - (x.doneAt || 0) > 86400000; });
      for (var j = 0; j < old.length; j++) await del(old[j].id);
    } finally { running = false; }
  }

  async function badge() {
    if (!window.TMN_UI || !TMN_UI.setBadge) return;
    try { var n = (await getAll()).filter(function (e) { return e.status !== "done"; }).length; TMN_UI.setBadge("profile", n); } catch (e) {}
  }

  async function retry(id) { var e = (await getAll()).filter(function (x) { return x.id === id; })[0]; if (!e) return; e.status = "queued"; e.attempts = 0; e.lastTry = 0; await put(e); emit(); process(); }
  async function cancel(id) { await del(id); emit(); }

  window.addEventListener("online", function () {
    getAll().then(function (l) {
      var n = l.filter(function (e) { return e.status !== "done"; }).length;
      if (n && window.TMN_UI) TMN_UI.toast("Back online — uploading " + n + " waiting post(s)…");
    });
    process();
  });
  window.addEventListener("offline", function () { if (window.TMN_UI) TMN_UI.toast("You're offline. Posts will be saved on your device for now."); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) process(); });
  setInterval(process, 45000);
  setTimeout(function () { process(); badge(); }, 800);

  window.TMN_POSTQ = { prepare: prepare, enqueue: enqueue, list: getAll, retry: retry, cancel: cancel, process: process, _compressPhoto: compressPhoto };
})();
