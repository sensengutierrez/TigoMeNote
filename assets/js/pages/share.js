/* TigoMeNote · pages/share.js (app/share.html)
   Take photo / Record video / From gallery → naka-save sa device (media-store.js), sa napiling album. */
(function () {
  var M = window.TMN_MEDIA, UI = window.TMN_UI;
  var sel = document.getElementById("albumSel");

  async function fillAlbums() {
    var keep = sel.value;
    var albums = await M.albums();
    sel.innerHTML = '<option value="">Walang album</option>' + albums.map(function (a) {
      return '<option value="' + a.id + '">' + UI.esc(a.name) + " (" + a.count + ")</option>";
    }).join("") + '<option value="__new">+ Bagong album…</option>';
    if (keep && keep !== "__new") sel.value = keep;
  }

  sel.addEventListener("change", async function () {
    if (sel.value !== "__new") return;
    var name = await window.TMN_MODAL.prompt("Bagong album", { placeholder: "hal. Bahrain trip", okText: "Create" });
    if (!name) { sel.value = ""; return; }
    var a = await M.createAlbum(name);
    await fillAlbums(); sel.value = a.id;
  });

  document.querySelectorAll("[data-pick]").forEach(function (inp) {
    inp.addEventListener("change", async function () {
      var files = this.files; if (!files || !files.length) return;
      var album = sel.value && sel.value !== "__new" ? sel.value : null;
      UI.toast("Sine-save sa device…", 1500);
      try {
        var added = await M.addFiles(files, album);
        UI.toast(added.length + " na-save! Bubuksan ang Gallery…");
        setTimeout(function () { location.href = "gallery.html" + (album ? "?album=" + encodeURIComponent(album) : ""); }, 900);
      } catch (e) { UI.toast("Hindi na-save: " + e.message, 4000); }
      this.value = "";
    });
  });

  fillAlbums().catch(function () {});
})();
