/* TigoMeNote · components/capture-review.js — pagkatapos kumuha: tingnan, may auto sound, tapos Save o Save & post
     TMN_REVIEW.open(file, { kind, filter, postDefault, onDone({ sound, post }), onRetake })
   Auto-pick ng sound (sound-picker.js) at tumutugtog agad; puwedeng palitan o tanggalin. */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };

  function open(file, o) {
    o = o || {};
    var kind = o.kind || (/^video/.test(file.type) ? "video" : "photo");
    var url = URL.createObjectURL(file), rowApi = null, finished = false;
    var root = document.createElement("div");
    root.className = "crv";
    root.innerHTML =
      '<div class="crv-media">' + (kind === "video"
        ? '<video src="' + url + '" playsinline autoplay loop></video>'
        : '<img alt="Your photo" src="' + url + '">') + "</div>" +
      '<div class="crv-sound"></div>' +
      '<p class="crv-hint faint small hidden"></p>';

    var media = root.querySelector("video, img"), hint = root.querySelector(".crv-hint");
    function vidVol(s) { if (kind === "video") media.volume = s ? (s.orig != null ? s.orig : 0.4) : 1; }

    var m = window.TMN_MODAL.open({
      title: kind === "video" ? "Your video" : "Your photo", size: "md", cls: "modal-review", body: root, closeOnBackdrop: false,
      actions: [
        { label: I("camera", "ic-sm") + "Retake", cls: "btn-ghost", onClick: function () { finished = true; m.close(); if (o.onRetake) o.onRetake(); } },
        { label: I("download", "ic-sm") + "Save", cls: "btn-ghost crv-save", onClick: function () { done(false); } },
        { label: I("send", "ic-sm") + "Save & post", cls: "btn-primary crv-post", onClick: function () { done(true); } }
      ],
      onClose: function () { if (rowApi) rowApi.destroy(); URL.revokeObjectURL(url); if (!finished && o.onCancel) o.onCancel(); }
    });
    function done(post) {
      finished = true;
      var s = rowApi ? rowApi.get() : null;
      m.close();
      if (o.onDone) o.onDone({ sound: s, post: post });
    }
    var main = m.el.querySelector(o.postDefault ? ".crv-post" : ".crv-save");
    if (main) setTimeout(function () { main.focus(); }, 50);

    var box = root.querySelector(".crv-sound");
    if (!window.TMN_SOUND_PICK) { box.remove(); return m; }
    function mount(sound) {
      rowApi = TMN_SOUND_PICK.row(box, { src: file, kind: kind, filter: o.filter, sound: sound, autoplay: !!sound, onChange: vidVol });
      vidVol(sound);
      if (sound) { hint.textContent = "Sound picked for you. Tap Change for more."; hint.classList.remove("hidden"); }
    }
    box.innerHTML = '<span class="faint small">' + I("music", "ic-sm") + " Finding a sound…</span>";
    TMN_SOUND_PICK.auto(file, { kind: kind, filter: o.filter })
      .then(function (r) { if (!finished) mount(r.sound); })
      .catch(function () { if (!finished) mount(null); });
    return m;
  }

  window.TMN_REVIEW = { open: open };
})();
