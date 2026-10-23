/* TigoMeNote · pages/share.js (app/share.html)
   Take photo / Record video / From gallery → naka-save sa device (media-store.js), sa napiling album.
   Kapag naka-check ang "I-post din": bubuksan ang composer (post-composer.js) pagka-save. */
(function () {
  var M = window.TMN_MEDIA, UI = window.TMN_UI;
  var sel = document.getElementById("albumSel");
  var postToo = document.getElementById("postToo");
  try { postToo.checked = localStorage.getItem("tmnPostToo") === "1"; } catch (e) {}
  postToo.addEventListener("change", function () { try { localStorage.setItem("tmnPostToo", postToo.checked ? "1" : "0"); } catch (e) {} });

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
      var files = [].slice.call(this.files || []); this.value = "";
      if (!files.length) return;
      var album = sel.value && sel.value !== "__new" ? sel.value : null;
      UI.toast("Sine-save sa device…", 1500);
      try {
        var added = await M.addFiles(files, album);
        if (postToo.checked) {
          UI.toast(added.length + " na-save sa Gallery.");
          window.TMN_COMPOSER.open(added.slice(0, 10), { onPosted: function () { setTimeout(function () { location.href = "profile.html"; }, 900); } });
          return;
        }
        UI.toast(added.length + " na-save! Bubuksan ang Gallery…");
        setTimeout(function () { location.href = "gallery.html" + (album ? "?album=" + encodeURIComponent(album) : ""); }, 900);
      } catch (e) { UI.toast("Hindi na-save: " + e.message, 4000); }
    });
  });

  fillAlbums().catch(function () {});
})();
