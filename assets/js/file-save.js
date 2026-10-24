/* TigoMeNote · file-save.js — pag-save ng file sa "TigoMeNote" folder ng device
   - APK: Documents/TigoMeNote/<sub>/ (sa phone; naiiwan kahit i-uninstall ang app)
   - Desktop (Chrome/Edge): folder na pinili mo sa Settings → Files (gagawa ng "TigoMeNote" sa loob)
   - Iba pa: download (Downloads folder)
   TMN_FILES.save(sub, name, blob) → Promise<string>  (saan napunta, para sa toast)
   TMN_FILES.where() → Promise<{ kind: "app"|"folder"|"downloads", label }>
   TMN_FILES.canPick() · TMN_FILES.pick() · TMN_FILES.forget() */
(function () {
  var N = window.TMN_NATIVE || {};
  var DB = "tmnFiles", STORE = "handles", KEY = "root";

  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      var open = indexedDB.open(DB, 1);
      open.onupgradeneeded = function () { open.result.createObjectStore(STORE); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        var tx = open.result.transaction(STORE, mode), st = tx.objectStore(STORE), req = fn(st);
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
      };
    });
  }
  function getHandle() { try { return idb("readonly", function (s) { return s.get(KEY); }).catch(function () { return null; }); } catch (e) { return Promise.resolve(null); } }
  function canPick() { return !N.isApp && "showDirectoryPicker" in window; }

  async function where() {
    if (N.isApp && N.saveFile) return { kind: "app", label: "Documents/TigoMeNote" };
    var h = canPick() ? await getHandle() : null;
    if (h) return { kind: "folder", label: h.name };
    return { kind: "downloads", label: "Downloads" };
  }
  async function pick() {
    var root = await window.showDirectoryPicker({ id: "tigomenote", mode: "readwrite", startIn: "documents" });
    var dir = root.name === "TigoMeNote" ? root : await root.getDirectoryHandle("TigoMeNote", { create: true });
    await idb("readwrite", function (s) { return s.put(dir, KEY); });
    return dir.name;
  }
  function forget() { return idb("readwrite", function (s) { return s.delete(KEY); }).catch(function () {}); }

  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
  }

  async function save(sub, name, blob) {
    if (N.isApp && N.saveFile) {
      await N.saveFile("TigoMeNote/" + sub + "/" + name, blob);
      return "Documents/TigoMeNote/" + sub;
    }
    var h = canPick() ? await getHandle() : null;
    if (h) {
      try {
        var ok = (await h.queryPermission({ mode: "readwrite" })) === "granted" || (await h.requestPermission({ mode: "readwrite" })) === "granted";
        if (ok) {
          var dir = await h.getDirectoryHandle(sub, { create: true });
          var fh = await dir.getFileHandle(name, { create: true });
          var w = await fh.createWritable(); await w.write(blob); await w.close();
          return h.name + "/" + sub;
        }
      } catch (e) { /* hal. binura ang folder: i-download na lang */ }
    }
    download(name, blob);
    return "Downloads";
  }

  window.TMN_FILES = { save: save, where: where, canPick: canPick, pick: pick, forget: forget };
})();
