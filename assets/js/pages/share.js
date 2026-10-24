/* TigoMeNote · pages/share.js (app/share.html)
   Take photo / Record video → sariling camera na may libreng filters (camera.js), tapos review na may auto sound
   (capture-review.js) → Save o Save & post. Kung walang camera API: ang camera ng phone (file input).
   From gallery → naka-save sa device (media-store.js), sa napiling album.
   Kapag naka-check ang "I-post din" (o pinindot ang Save & post): bubuksan ang composer (post-composer.js). */
(function () {
  var M = window.TMN_MEDIA, UI = window.TMN_UI;
  var sel = document.getElementById("albumSel");
  var postToo = document.getElementById("postToo");
  try { postToo.checked = localStorage.getItem("tmnPostToo") === "1"; } catch (e) {}
  postToo.addEventListener("change", function () { try { localStorage.setItem("tmnPostToo", postToo.checked ? "1" : "0"); } catch (e) {} });

  async function fillAlbums() {
    var keep = sel.value;
    var albums = await M.albums();
    sel.innerHTML = '<option value="">No album</option>' + albums.map(function (a) {
      return '<option value="' + a.id + '">' + UI.esc(a.name) + " (" + a.count + ")</option>";
    }).join("") + '<option value="__new">+ New album…</option>';
    if (keep && keep !== "__new") sel.value = keep;
  }

  sel.addEventListener("change", async function () {
    if (sel.value !== "__new") return;
    var name = await window.TMN_MODAL.prompt("New album", { placeholder: "e.g. Bahrain trip", okText: "Create" });
    if (!name) { sel.value = ""; return; }
    var a = await M.createAlbum(name);
    await fillAlbums(); sel.value = a.id;
  });

  function album() { return sel.value && sel.value !== "__new" ? sel.value : null; }

  // ---------- sariling camera ----------
  function camera(mode) {
    window.TMN_CAMERA.open({ mode: mode, onCapture: review });
  }
  function review(file, info) {
    if (!window.TMN_REVIEW) return save([file], postToo.checked);
    window.TMN_REVIEW.open(file, {
      kind: info.kind, filter: info.filter, postDefault: postToo.checked,
      onRetake: function () { if (!info.native) camera(info.kind); },
      onDone: function (r) { save([file], r.post, r.sound); }
    });
  }
  document.querySelectorAll("[data-cam]").forEach(function (tile) {
    tile.addEventListener("click", function (e) {
      if (!window.TMN_CAMERA || !TMN_CAMERA.supported()) return; // tuloy sa file input (camera ng phone)
      e.preventDefault();
      camera(tile.dataset.cam);
    });
  });

  async function save(files, post, sound) {
      var alb = album();
      UI.toast("Saving to device…", 1500);
      try {
        var added = await M.addFiles(files, alb);
        if (sound && added[0]) added[0] = await M.update(added[0].id, { sound: sound });
        if (post) {
          UI.toast(added.length + " saved to Gallery.");
          window.TMN_COMPOSER.open(added.slice(0, 10), { onPosted: function () { setTimeout(function () { location.href = "profile.html"; }, 900); } });
          return;
        }
        UI.toast(added.length + " saved! Opening Gallery…");
        setTimeout(function () { location.href = "gallery.html" + (alb ? "?album=" + encodeURIComponent(alb) : ""); }, 900);
      } catch (e) { UI.toast("Not saved: " + e.message, 4000); }
  }

  document.querySelectorAll("[data-pick]").forEach(function (inp) {
    inp.addEventListener("change", function () {
      var files = [].slice.call(this.files || []); this.value = "";
      if (!files.length) return;
      // Isang kuha mula sa camera ng phone → review din (may auto sound)
      if (inp.hasAttribute("capture") && files.length === 1) return review(files[0], { kind: /^video/.test(files[0].type) ? "video" : "photo", filter: "none", native: true });
      save(files, postToo.checked);
    });
  });

  fillAlbums().catch(function () {});
})();
