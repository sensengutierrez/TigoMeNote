/* TigoMeNote · components/appearance-settings.js — Settings → Background (para hindi boring ang app)
     TMN_LOOK_UI.mount(el)
   Pagpipilian: None · mga kulay/gradient (presets) · sariling kulay · sariling picture (Desktop/laptop at Phone, magkahiwalay).
   May slider: "Background strength" (gaano kakita) at "Card transparency" (gaano ka-see-through ang cards).
   Agad makikita ang pagbabago; sine-save sa account (profile-fast: saveLook, imageUpload → PUT → setImage).
   Kailangan: appearance.js (TMN_LOOK), api.js, modal.js */
(function () {
  var SIZES = { bg_desktop: { max: 2400, label: "Desktop / laptop", hint: "Landscape, e.g. 1920 × 1080" }, bg_phone: { max: 1600, label: "Phone", hint: "Portrait, e.g. 1080 × 1920" } };
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }

  // Paliitin ang picture bago i-upload (JPEG, ≤3 MB ang limit ng server)
  async function shrink(file, max) {
    var bmp = await createImageBitmap(file);
    var r = Math.min(1, max / Math.max(bmp.width, bmp.height));
    var c = document.createElement("canvas"); c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    var q = 0.85, out;
    do { out = await new Promise(function (ok) { c.toBlob(ok, "image/jpeg", q); }); q -= 0.1; } while (out && out.size > 2.5 * 1024 * 1024 && q > 0.4);
    return out;
  }

  function sw(p) { return '<button type="button" class="lk-sw" data-use="preset" data-preset="' + p.id + '" aria-label="' + p.name + '"><span style=\'background:' + p.css.replace(/'/g, "%27") + '\'></span><small translate="no">' + p.name + "</small></button>"; }
  function mount(el) {
    var L = window.TMN_LOOK, UI = window.TMN_UI;
    var look = Object.assign({ use: "none", strength: 60, panels: 88 }, L.get());
    var saveT = null;
    el.innerHTML =
      '<div class="lk">' +
        '<div class="lk-group faint small">TigoMeNote originals</div>' +
        '<div class="lk-swatches lk-tigo" role="radiogroup" aria-label="TigoMeNote backgrounds">' +
          L.PRESETS.filter(function (p) { return p.tigo; }).map(sw).join("") + "</div>" +
        '<div class="lk-group faint small">Colors and your photo</div>' +
        '<div class="lk-swatches" role="radiogroup" aria-label="Background">' +
          '<button type="button" class="lk-sw lk-none" data-use="none" aria-label="None"><span>' + I("x", "ic-sm") + '</span><small>None</small></button>' +
          L.PRESETS.filter(function (p) { return !p.tigo; }).map(sw).join("") +
          '<label class="lk-sw lk-color" data-use="color"><span class="lk-color-chip"></span><small>Color</small><input type="color" class="sr-only lk-color-in" value="' + (look.color || "#7ab8ff") + '"></label>' +
          '<button type="button" class="lk-sw lk-photo" data-use="image" aria-label="My photo"><span>' + I("image", "ic-sm") + "</span><small>My photo</small></button>" +
        "</div>" +
        '<div class="lk-photos hidden">' + Object.keys(SIZES).map(function (k) {
          var s = SIZES[k];
          return '<div class="lk-slot" data-kind="' + k + '"><div class="lk-thumb lk-' + k + '"></div><div class="lk-slot-main"><b>' + s.label + '</b><span class="faint small">' + s.hint + "</span>" +
            '<div class="lk-slot-btns"><label class="btn btn-ghost btn-sm">' + I("upload", "ic-sm") + 'Upload<input type="file" accept="image/*" class="sr-only"></label>' +
            '<button type="button" class="btn btn-ghost btn-sm lk-rm" data-rm="' + k + '">' + I("trash", "ic-sm") + "Remove</button></div></div></div>";
        }).join("") + '<p class="faint small">If you add only one, it is used on both.</p></div>' +
        '<div class="lk-sliders">' +
          '<label class="lk-slider"><span>Background strength <b class="lk-sv"></b></span><input type="range" min="10" max="100" step="5" class="lk-strength"></label>' +
          '<label class="lk-slider"><span>Card transparency <b class="lk-pv"></b></span><input type="range" min="0" max="70" step="5" class="lk-panels"></label>' +
        "</div>" +
        '<p class="lk-status faint small" aria-live="polite">Saved to your account, so it shows on all your devices.</p>' +
      "</div>";
    var $ = function (s) { return el.querySelector(s); };
    var strength = $(".lk-strength"), panels = $(".lk-panels"), status = $(".lk-status");

    function paint() {
      el.querySelectorAll(".lk-sw").forEach(function (b) {
        var on = b.dataset.use === look.use && (look.use !== "preset" || b.dataset.preset === look.preset);
        b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); b.setAttribute("role", "radio");
      });
      $(".lk-color-chip").style.background = look.color || "#7ab8ff";
      $(".lk-photos").classList.toggle("hidden", look.use !== "image");
      ["bg_desktop", "bg_phone"].forEach(function (k) {
        var url = look[k === "bg_desktop" ? "desktop" : "phone"], th = $(".lk-" + k);
        th.style.backgroundImage = url ? 'url("' + url + '")' : "";
        th.classList.toggle("empty", !url);
        el.querySelector('[data-rm="' + k + '"]').classList.toggle("hidden", !url);
      });
      strength.value = look.strength; panels.value = 100 - look.panels;
      $(".lk-sv").textContent = look.strength + "%"; $(".lk-pv").textContent = (100 - look.panels) + "%";
      el.querySelector(".lk-sliders").classList.toggle("off", look.use === "none");
    }
    function change(ch, now) {
      Object.assign(look, ch); L.set(look); paint();
      clearTimeout(saveT); saveT = setTimeout(save, now ? 0 : 700);
    }
    async function save() {
      if (!navigator.onLine) { status.textContent = "Offline: saved on this device for now."; return; }
      status.textContent = "Saving…";
      try {
        var r = await TMN_API.call("profile", "saveLook", { look: { use: look.use, preset: look.preset, color: look.color, strength: look.strength, panels: look.panels } });
        look = Object.assign(look, r.look); L.set(look, { noApply: true });
        status.textContent = "Saved ✓ It shows on all your devices.";
      } catch (e) { status.textContent = e.message; }
    }
    el.querySelectorAll(".lk-swatches").forEach(function (box) { box.addEventListener("click", onPick); });
    function onPick(e) {
      var b = e.target.closest(".lk-sw"); if (!b || b.tagName === "LABEL") return;
      if (b.dataset.use === "preset") change({ use: "preset", preset: b.dataset.preset }, true);
      else if (b.dataset.use === "image") { change({ use: "image" }, !!(look.desktop || look.phone)); if (!look.desktop && !look.phone) status.textContent = "Upload a photo for desktop/laptop, phone, or both."; }
      else change({ use: b.dataset.use }, true);
    }
    var colorIn = $(".lk-color-in");
    colorIn.addEventListener("input", function () { change({ use: "color", color: colorIn.value }); });
    $(".lk-color").addEventListener("click", function () { if (look.use !== "color") change({ use: "color", color: colorIn.value }); });
    strength.addEventListener("input", function () { change({ strength: Number(strength.value) }); });
    panels.addEventListener("input", function () { change({ panels: 100 - Number(panels.value) }); });

    // Upload ng sariling picture (desktop o phone)
    el.querySelectorAll(".lk-slot input[type=file]").forEach(function (inp) {
      inp.addEventListener("change", async function () {
        var f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
        var kind = inp.closest(".lk-slot").dataset.kind;
        if (!navigator.onLine) { UI.toast("You need internet to upload a background."); return; }
        status.textContent = "Uploading " + SIZES[kind].label.toLowerCase() + " photo…";
        try {
          var blob = await shrink(f, SIZES[kind].max);
          var up = await TMN_API.call("profile", "imageUpload", { kind: kind, size: blob.size });
          var r = await fetch(up.url, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: blob });
          if (!r.ok) throw new Error("Upload failed (" + r.status + "). Please try again.");
          var res;
          for (var t = 0; t < 3; t++) {
            try { res = await TMN_API.call("profile", "setImage", { kind: kind, path: up.path }); break; }
            catch (e) { if (e.status === 409 && t < 2) await new Promise(function (ok) { setTimeout(ok, 1200); }); else throw e; }
          }
          look = Object.assign(look, { desktop: res.look.desktop, phone: res.look.phone });
          change({ use: "image" }, true);
        } catch (e) { status.textContent = e.message; }
      });
    });
    el.querySelectorAll("[data-rm]").forEach(function (b) {
      b.addEventListener("click", async function () {
        var kind = b.dataset.rm;
        try {
          var res = await TMN_API.call("profile", "removeImage", { kind: kind });
          look = Object.assign(look, { desktop: res.look.desktop, phone: res.look.phone });
          change(!look.desktop && !look.phone ? { use: "none" } : {}, true);
        } catch (e) { UI.toast(e.message); }
      });
    });
    paint();
    // Kunin ang pinakabago sa account
    if (navigator.onLine) TMN_API.call("profile", "look", {}).then(function (r) { if (r.look) { look = Object.assign(look, r.look); L.set(look); paint(); } }, function () {});
  }

  window.TMN_LOOK_UI = { mount: mount };
})();
