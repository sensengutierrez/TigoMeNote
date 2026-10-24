/* TigoMeNote · music-store.js — sariling playlist na naka-save sa DEVICE lang (IndexedDB). Hindi ina-upload.
     await TMN_MUSICDB.list()            → [{ id, name, artist, type, size, duration, order, addedAt }]  (walang blob)
     await TMN_MUSICDB.add(files)         → mga bagong track (audio files galing sa phone/computer)
     await TMN_MUSICDB.blob(id)           → ang audio file mismo (para i-play)
     await TMN_MUSICDB.remove(id) / move(id, -1|+1) / rename(id, name)
   Hiwalay bawat account sa iisang device. */
(function () {
  var MAX_BYTES = 60 * 1024 * 1024, dbp = null;
  function name() { return "tmn-music-" + ((window.TMN_USER || {}).id || "guest"); }
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(name(), 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("tracks")) d.createObjectStore("tracks", { keyPath: "id" });
        if (!d.objectStoreNames.contains("files")) d.createObjectStore("files");
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { dbp = null; rej(r.error); };
    });
    return dbp;
  }
  function tx(stores, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(stores, mode), out = {};
        fn(t, out);
        t.oncomplete = function () { res(out.v); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error || new Error("Device storage is full.")); };
      });
    });
  }
  function list() {
    return tx(["tracks"], "readonly", function (t, o) {
      var r = t.objectStore("tracks").getAll();
      r.onsuccess = function () { o.v = (r.result || []).sort(function (a, b) { return a.order - b.order; }); };
    });
  }
  function duration(file) {
    return new Promise(function (res) {
      var a = document.createElement("audio"), u = URL.createObjectURL(file), done = false;
      function fin(d) { if (done) return; done = true; URL.revokeObjectURL(u); res(isFinite(d) ? Math.round(d) : null); }
      a.preload = "metadata"; a.onloadedmetadata = function () { fin(a.duration); }; a.onerror = function () { fin(null); };
      setTimeout(function () { fin(null); }, 4000);
      a.src = u;
    });
  }
  function clean(n) { return String(n || "Song").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").trim().slice(0, 120) || "Song"; }
  async function add(files) {
    var cur = await list(), order = cur.length ? cur[cur.length - 1].order + 1 : 0, out = [], skipped = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i.test(f.name)) { skipped++; continue; }
      if (f.size > MAX_BYTES) { skipped++; continue; }
      var parts = clean(f.name).split(" - ");
      var t = {
        id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: parts.length > 1 ? parts.slice(1).join(" - ") : parts[0], artist: parts.length > 1 ? parts[0] : "",
        type: f.type || "audio/mpeg", size: f.size, duration: await duration(f), order: order++, addedAt: Date.now()
      };
      await tx(["tracks", "files"], "readwrite", function (x) { x.objectStore("tracks").put(t); x.objectStore("files").put(f, t.id); });
      out.push(t);
    }
    out.skipped = skipped;
    return out;
  }
  function blob(id) { return tx(["files"], "readonly", function (t, o) { var r = t.objectStore("files").get(id); r.onsuccess = function () { o.v = r.result || null; }; }); }
  function remove(id) { return tx(["tracks", "files"], "readwrite", function (t) { t.objectStore("tracks").delete(id); t.objectStore("files").delete(id); }); }
  async function move(id, dir) {
    var l = await list(), i = l.findIndex(function (x) { return x.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return;
    var a = l[i], b = l[j], o = a.order; a.order = b.order; b.order = o;
    return tx(["tracks"], "readwrite", function (t) { t.objectStore("tracks").put(a); t.objectStore("tracks").put(b); });
  }
  async function rename(id, nm) {
    var l = await list(), t = l.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    t.name = String(nm).trim().slice(0, 120) || t.name;
    return tx(["tracks"], "readwrite", function (x) { x.objectStore("tracks").put(t); });
  }
  window.TMN_MUSICDB = { list: list, add: add, blob: blob, remove: remove, move: move, rename: rename, MAX_BYTES: MAX_BYTES };
})();
