/* TigoMeNote · phone-storage.js — ang PHONE ang storage (APK lang). Ang server ay para lang sa ipinost mo para makita ng iba.
     TMN_PHONE.ok()                 → true sa APK (Android 10+ ang may native)
     TMN_PHONE.save(file)           → kopya sa gallery ng phone: Pictures/TigoMeNote (litrato) o Movies/TigoMeNote (video)
     TMN_PHONE.backupDaily()        → Documents/TigoMeNote/daily-<user>.json (text ng Daily notes at moods)
     TMN_PHONE.lastBackup()         → oras ng huling backup (ms) o 0
   Kusa: bawat kuha sa camera ng app → sa phone gallery (camera.js); bawat pagbabago sa Daily → backup pagkalipas ng 4 s.
   Hindi nabubura ang mga ito kahit i-uninstall ang app. Ibalik ang Daily: Settings → Files on this device → Restore. */
(function () {
  var Cap = window.Capacitor, N = null, KEY = "tmnDailyBackupAt";
  function nat() {
    if (N) return N;
    if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return null;
    N = (Cap.Plugins && Cap.Plugins.TmnNative) || null;
    return N && N.saveToPhone ? N : null;
  }
  function b64(blob) {
    return new Promise(function (ok, bad) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(",")[1] || ""); };
      r.onerror = function () { bad(r.error); };
      r.readAsDataURL(blob);
    });
  }
  async function save(file) {
    var n = nat(); if (!n || !file) return null;
    var name = file.name || ("TigoMeNote_" + Date.now() + (/^video\//.test(file.type) ? ".mp4" : ".jpg"));
    return n.saveToPhone({ data: await b64(file), name: name, mime: file.type || "image/jpeg" });
  }
  var t = 0;
  async function backupDaily() {
    var n = nat(); if (!n || !n.backupWrite || !window.TMN_DAILY || !TMN_DAILY.backup) return null;
    var d = await TMN_DAILY.backup();
    var r = await n.backupWrite({ name: "daily-" + (d.user || "guest") + ".json", text: JSON.stringify(d) });
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    document.dispatchEvent(new CustomEvent("tmn:backup"));
    return r;
  }
  document.addEventListener("tmn:daily", function () {
    if (!nat()) return;
    clearTimeout(t); t = setTimeout(function () { backupDaily().catch(function () {}); }, 4000);
  });
  function lastBackup() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
  window.TMN_PHONE = { ok: function () { return !!nat(); }, save: save, backupDaily: backupDaily, lastBackup: lastBackup };
})();
