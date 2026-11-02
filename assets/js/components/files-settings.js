/* TigoMeNote · components/files-settings.js — Settings → Files on this device
   Saan napupunta ang mga kopya (hal. location history .zip): TigoMeNote folder.
   APK: Documents/TigoMeNote (naiiwan kahit i-uninstall; tatanungin din ng Android kung itatabi ang app data).
   Desktop Chrome/Edge: puwedeng pumili ng folder (gagawa ng "TigoMeNote" sa loob). Iba: Downloads.
   TMN_FILES_SETTINGS.mount(el) · Kailangan: file-save.js */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc, N = window.TMN_NATIVE || {};

  async function paint(el) {
    var w = await TMN_FILES.where();
    var phone = !!(window.TMN_PHONE && TMN_PHONE.ok()), last = phone ? TMN_PHONE.lastBackup() : 0;
    var sub = w.kind === "app" ? "Copies you save (like location history) go to this folder on your phone."
      : w.kind === "folder" ? "Copies you save go to this folder on this computer."
      : TMN_FILES.canPick() ? "Copies go to Downloads. Choose a folder to keep them together in a TigoMeNote folder."
      : "Copies go to your Downloads folder.";
    el.innerHTML =
      '<div class="rows">' +
        '<div class="row"><div class="row-main"><div class="row-title">' + I("folder", "ic-sm") + ' Save folder: <span translate="no">' + esc(w.label) + "</span></div>" +
          '<div class="row-sub">' + sub + "</div></div>" +
          (TMN_FILES.canPick() ? '<button type="button" class="btn btn-ghost btn-sm" data-f="pick">' + (w.kind === "folder" ? "Change" : "Choose folder") + "</button>" : "") +
          (w.kind === "folder" ? '<button type="button" class="btn btn-ghost btn-sm" data-f="forget">Use Downloads</button>' : "") +
        "</div>" +
        // Daily backup sa phone (phone-storage.js) at Restore mula sa file
        '<div class="row fs-backup"><div class="row-main"><div class="row-title">' + I("edit", "ic-sm") + " Daily backup</div>" +
          '<div class="row-sub">' + (phone ? "Your Daily notes are copied to Documents/TigoMeNote on this phone. " + (last ? "Last backup: " + new Date(last).toLocaleString() + "." : "No backup yet.") :
            "In the Android app, your Daily notes are copied to Documents/TigoMeNote automatically.") +
          " After reinstalling, tap Restore and choose the daily-….json file.</div></div>" +
          (phone ? '<button type="button" class="btn btn-ghost btn-sm" data-f="backup">Back up now</button>' : "") +
          '<label class="btn btn-ghost btn-sm">Restore<input type="file" accept="application/json,.json" class="sr-only fs-restore"></label>' +
        "</div>" +
        '<div class="row"><div class="row-main"><div class="row-title">' + I("phone", "ic-sm") + " If you uninstall the app</div>" +
          '<div class="row-sub">' + (phone
            ? "Photos from the TigoMeNote camera are in Pictures/TigoMeNote and your Daily backup is in Documents/TigoMeNote — they stay on your phone. Some phones also offer \u201cKeep app data\u201d when uninstalling."
            : "In the Android app, photos you take are saved to your phone gallery (Pictures/TigoMeNote) and stay even if you uninstall.") +
          "</div></div></div>" +
      "</div>";
  }
  function mount(el) {
    paint(el);
    document.addEventListener("tmn:backup", function () { paint(el); });
    if (!window.TMN_PHONE) document.addEventListener("DOMContentLoaded", function () { paint(el); });   // phone-storage.js ay "defer"
    el.addEventListener("change", async function (e) {
      if (!e.target.classList.contains("fs-restore")) return;
      var f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
      try {
        if (!window.TMN_DAILY || !TMN_DAILY.restore) throw new Error("Open Daily once, then try again.");
        var r = await TMN_DAILY.restore(JSON.parse(await f.text()));
        UI.toast("Restored " + r.notes + " note" + (r.notes === 1 ? "" : "s") + ".");
      } catch (err) { UI.toast(err.message || "Couldn't read this file."); }
    });
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return;
      if (b.dataset.f === "backup") { try { await TMN_PHONE.backupDaily(); UI.toast("Backed up to Documents/TigoMeNote."); } catch (err) { UI.toast(err.message || "Backup failed."); } return; }
      try {
        if (b.dataset.f === "pick") { var name = await TMN_FILES.pick(); UI.toast("Saving to " + name + "."); }
        else { await TMN_FILES.forget(); UI.toast("Saving to Downloads."); }
      } catch (err) { if (err && err.name !== "AbortError") UI.toast(err.message); }
      paint(el);
    });
  }
  window.TMN_FILES_SETTINGS = { mount: mount };
})();
