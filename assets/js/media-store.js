/* TigoMeNote · media-store.js
   Photos, videos at albums na naka-save SA DEVICE LANG (IndexedDB ng browser). Hindi ina-upload sa server.
   Hiwalay ang storage bawat account (db name may user id).

   Gamit (lahat ay Promise):
     TMN_MEDIA.addFiles(fileList, albumId?)    → [items]
     TMN_MEDIA.list({ albumId, type })         → items (bago muna)
     TMN_MEDIA.get(id) / update(id, changes) / remove(ids)
     TMN_MEDIA.albums() / createAlbum(name) / renameAlbum(id, name) / deleteAlbum(id)
     TMN_MEDIA.usage()                          → { used, quota, persisted }
   Events sa document: "tmn:media" (kapag may nagbago). */
(function () {
  var DB_VERSION = 1;
  var THUMB = 480;              // px, pinakamahabang side ng thumbnail
  var dbPromise = null;

  function userKey() {
    var u = window.TMN_USER || {};
    return "tmn-media-" + (u.id || "guest");
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("Hindi suportado ng browser na ito ang device storage."));
      var req = indexedDB.open(userKey(), DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("albums")) db.createObjectStore("albums", { keyPath: "id" });
        if (!db.objectStoreNames.contains("items")) {
          var s = db.createObjectStore("items", { keyPath: "id" });
          s.createIndex("albumId", "albumId");
          s.createIndex("createdAt", "createdAt");
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("Hindi mabuksan ang device storage.")); };
    });
    // Hilingin na huwag burahin ng browser kapag kulang sa space
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(store, mode);
        var s = t.objectStore(store);
        var out = fn(s);
        t.oncomplete = function () { resolve(out && typeof out === "object" && "__result" in out ? out.__result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error || new Error("Na-cancel ang pag-save (baka puno na ang storage).")); };
      });
    });
  }
  function reqResult(r) { var box = {}; r.onsuccess = function () { box.__result = r.result; }; return box; }

  function uid() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function changed() { document.dispatchEvent(new CustomEvent("tmn:media")); }

  // ---------- thumbnails ----------
  function canvasToBlob(canvas, type, q) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, type || "image/jpeg", q || 0.82); });
  }
  function fit(w, h, max) {
    var r = Math.min(1, max / Math.max(w, h));
    return { w: Math.round(w * r), h: Math.round(h * r) };
  }

  async function imageInfo(blob) {
    var bmp = await createImageBitmap(blob);
    var s = fit(bmp.width, bmp.height, THUMB);
    var c = document.createElement("canvas");
    c.width = s.w; c.height = s.h;
    c.getContext("2d").drawImage(bmp, 0, 0, s.w, s.h);
    var info = { w: bmp.width, h: bmp.height, thumb: await canvasToBlob(c) };
    if (bmp.close) bmp.close();
    return info;
  }

  function videoInfo(blob) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(blob);
      var v = document.createElement("video");
      var done = false;
      function finish(info) { if (done) return; done = true; URL.revokeObjectURL(url); resolve(info); }
      v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url;
      v.onloadedmetadata = function () {
        var t = Math.min(0.5, (v.duration || 1) / 3);
        try { v.currentTime = t; } catch (e) { finish({ w: v.videoWidth, h: v.videoHeight, duration: v.duration || 0, thumb: null }); }
      };
      v.onseeked = async function () {
        var s = fit(v.videoWidth || 320, v.videoHeight || 240, THUMB);
        var c = document.createElement("canvas");
        c.width = s.w; c.height = s.h;
        try { c.getContext("2d").drawImage(v, 0, 0, s.w, s.h); } catch (e) {}
        finish({ w: v.videoWidth, h: v.videoHeight, duration: v.duration || 0, thumb: await canvasToBlob(c) });
      };
      v.onerror = function () { finish({ w: 0, h: 0, duration: 0, thumb: null }); };
      setTimeout(function () { finish({ w: 0, h: 0, duration: 0, thumb: null }); }, 8000);
    });
  }

  // ---------- items ----------
  async function addFiles(files, albumId) {
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var type = /^video\//.test(f.type) ? "video" : /^image\//.test(f.type) ? "photo" : null;
      if (!type) continue;
      var info = { w: 0, h: 0, duration: 0, thumb: null };
      try { info = type === "photo" ? await imageInfo(f) : await videoInfo(f); } catch (e) { /* hal. HEIC na hindi kaya ng browser */ }
      var item = {
        id: uid(), type: type, albumId: albumId || null,
        name: f.name || (type + "-" + Date.now()), mime: f.type, size: f.size,
        blob: f, thumb: info.thumb, w: info.w, h: info.h, duration: info.duration || 0,
        caption: "", createdAt: Date.now(), takenAt: f.lastModified || Date.now(), editedAt: null
      };
      await tx("items", "readwrite", function (s) { s.put(item); });
      out.push(item);
    }
    if (out.length) changed();
    return out;
  }

  function list(opts) {
    opts = opts || {};
    return tx("items", "readonly", function (s) { return reqResult(s.getAll()); }).then(function (all) {
      return (all || []).filter(function (it) {
        if (opts.albumId === "none" && it.albumId) return false;
        if (opts.albumId && opts.albumId !== "none" && it.albumId !== opts.albumId) return false;
        if (opts.type && opts.type !== "all" && it.type !== opts.type) return false;
        return true;
      }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    });
  }

  function get(id) { return tx("items", "readonly", function (s) { return reqResult(s.get(id)); }); }

  async function update(id, changes) {
    var it = await get(id);
    if (!it) throw new Error("Wala na ang item.");
    Object.assign(it, changes);
    if (changes.blob && it.type === "photo") {
      try { var info = await imageInfo(changes.blob); it.thumb = info.thumb; it.w = info.w; it.h = info.h; } catch (e) {}
      it.size = changes.blob.size; it.editedAt = Date.now();
    }
    await tx("items", "readwrite", function (s) { s.put(it); });
    changed();
    return it;
  }

  async function addEditedCopy(id, blob) {
    var it = await get(id);
    var copy = Object.assign({}, it, { id: uid(), blob: blob, createdAt: Date.now(), editedAt: Date.now(), name: it.name.replace(/(\.\w+)?$/, "-edit.jpg"), mime: "image/jpeg" });
    try { var info = await imageInfo(blob); copy.thumb = info.thumb; copy.w = info.w; copy.h = info.h; } catch (e) {}
    copy.size = blob.size;
    await tx("items", "readwrite", function (s) { s.put(copy); });
    changed();
    return copy;
  }

  async function remove(ids) {
    ids = [].concat(ids);
    await tx("items", "readwrite", function (s) { ids.forEach(function (id) { s.delete(id); }); });
    changed();
  }

  async function move(ids, albumId) {
    ids = [].concat(ids);
    for (var i = 0; i < ids.length; i++) {
      var it = await get(ids[i]);
      if (it) { it.albumId = albumId || null; await tx("items", "readwrite", function (s) { s.put(it); }); }
    }
    changed();
  }

  // ---------- albums ----------
  async function albums() {
    var list = await tx("albums", "readonly", function (s) { return reqResult(s.getAll()); });
    var items = await tx("items", "readonly", function (s) { return reqResult(s.getAll()); });
    return (list || []).map(function (a) {
      var mine = (items || []).filter(function (it) { return it.albumId === a.id; }).sort(function (x, y) { return y.createdAt - x.createdAt; });
      return Object.assign({}, a, { count: mine.length, cover: mine[0] || null });
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  async function createAlbum(name) {
    name = String(name || "").trim().slice(0, 40);
    if (!name) throw new Error("Lagyan ng pangalan ang album.");
    var a = { id: uid(), name: name, createdAt: Date.now() };
    await tx("albums", "readwrite", function (s) { s.put(a); });
    changed();
    return a;
  }

  async function renameAlbum(id, name) {
    name = String(name || "").trim().slice(0, 40);
    if (!name) throw new Error("Lagyan ng pangalan ang album.");
    var a = await tx("albums", "readonly", function (s) { return reqResult(s.get(id)); });
    a.name = name;
    await tx("albums", "readwrite", function (s) { s.put(a); });
    changed();
  }

  // Binubura ang album; ang laman ay mananatili sa "All" (walang album), maliban kung deleteItems = true
  async function deleteAlbum(id, deleteItems) {
    var inside = await list({ albumId: id });
    if (deleteItems) await remove(inside.map(function (i) { return i.id; }));
    else await move(inside.map(function (i) { return i.id; }), null);
    await tx("albums", "readwrite", function (s) { s.delete(id); });
    changed();
  }

  async function usage() {
    var est = { usage: 0, quota: 0 }, persisted = false;
    try { if (navigator.storage && navigator.storage.estimate) est = await navigator.storage.estimate(); } catch (e) {}
    try { if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted(); } catch (e) {}
    return { used: est.usage || 0, quota: est.quota || 0, persisted: persisted };
  }

  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  async function todayCounts() {
    var all = await list({});
    var t = startOfToday();
    var today = all.filter(function (i) { return i.createdAt >= t; });
    return {
      photos: today.filter(function (i) { return i.type === "photo"; }).length,
      videos: today.filter(function (i) { return i.type === "video"; }).length,
      total: all.length
    };
  }

  window.TMN_MEDIA = {
    addFiles: addFiles, list: list, get: get, update: update, addEditedCopy: addEditedCopy,
    remove: remove, move: move, albums: albums, createAlbum: createAlbum,
    renameAlbum: renameAlbum, deleteAlbum: deleteAlbum, usage: usage, todayCounts: todayCounts
  };
})();
