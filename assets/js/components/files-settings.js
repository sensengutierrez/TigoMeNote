/* TigoMeNote · components/files-settings.js — Settings → Files on this device
   Saan napupunta ang mga kopya (hal. location history .zip): TigoMeNote folder.
   APK: Documents/TigoMeNote (naiiwan kahit i-uninstall; tatanungin din ng Android kung itatabi ang app data).
   Desktop Chrome/Edge: puwedeng pumili ng folder (gagawa ng "TigoMeNote" sa loob). Iba: Downloads.
   TMN_FILES_SETTINGS.mount(el) · Kailangan: file-save.js */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc, N = window.TMN_NATIVE || {};

  async function paint(el) {
    var w = await TMN_FILES.where();
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
        '<div class="row"><div class="row-main"><div class="row-title">' + I("phone", "ic-sm") + " If you uninstall the app</div>" +
          '<div class="row-sub">' + (N.isApp
            ? "Android will ask if you want to keep your app data. Files in Documents/TigoMeNote always stay on your phone."
            : "In the Android app, you can choose to keep your data when uninstalling, and saved copies stay in Documents/TigoMeNote.") +
          "</div></div></div>" +
      "</div>";
  }
  function mount(el) {
    paint(el);
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return;
      try {
        if (b.dataset.f === "pick") { var name = await TMN_FILES.pick(); UI.toast("Saving to " + name + "."); }
        else { await TMN_FILES.forget(); UI.toast("Saving to Downloads."); }
      } catch (err) { if (err && err.name !== "AbortError") UI.toast(err.message); }
      paint(el);
    });
  }
  window.TMN_FILES_SETTINGS = { mount: mount };
})();
