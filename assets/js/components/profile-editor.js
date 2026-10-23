/* TigoMeNote · components/profile-editor.js
   Pag-edit ng sariling profile: pangalan, bio, profile photo at cover (banner).
     TMN_PROFILE_EDIT.open()                 → "Edit profile" modal
     TMN_PROFILE_EDIT.changePhoto("avatar")  → pili ng larawan → crop → upload (pareho sa "banner")
     TMN_PROFILE_EDIT.removePhoto("banner")
   Server: profile-fast (imageUpload → PUT → setImage). Pagkatapos: TMN_AUTH.setUser(user) para ma-update ang buong site.
   Kailangan: api.js, modal.js, image-cropper.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var SPEC = {
    avatar: { aspect: 1, outW: 600, outH: 600, round: true, title: "Profile photo", label: "Profile photo" },
    banner: { aspect: 3, outW: 1500, outH: 500, round: false, title: "Cover photo", label: "Cover photo" }
  };

  function saveUser(u) {
    var merged = Object.assign({}, window.TMN_USER || {}, u);
    if (window.TMN_AUTH && TMN_AUTH.setUser) TMN_AUTH.setUser(merged); else window.TMN_USER = merged;
    return merged;
  }
  function needOnline() {
    if (navigator.onLine) return true;
    window.TMN_UI.toast("Kailangan ng internet para mapalitan ang profile.");
    return false;
  }
  function pickFile() {
    return new Promise(function (resolve) {
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.addEventListener("change", function () { var f = inp.files && inp.files[0]; inp.remove(); resolve(f || null); });
      inp.click();
    });
  }

  // Pili → crop → upload. Ibinabalik ang bagong user, o null kung na-cancel.
  async function changePhoto(kind, file) {
    var UI = window.TMN_UI, sp = SPEC[kind];
    if (!needOnline()) return null;
    file = file || await pickFile();
    if (!file) return null;
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|heic)$/i.test(file.name)) { UI.toast("Larawan lang ang pwede."); return null; }
    var blob;
    try { blob = await window.TMN_CROPPER.open(file, sp); }
    catch (e) { UI.toast(e.message); return null; }
    if (!blob) return null;
    UI.toast("Ina-upload ang " + sp.label.toLowerCase() + "…");
    try {
      var up = await TMN_API.call("profile", "imageUpload", { kind: kind, size: blob.size });
      var r = await fetch(up.url, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: blob });
      if (!r.ok) throw new Error("Hindi na-upload (" + r.status + "). Subukan ulit.");
      var res;
      for (var t = 0; t < 3; t++) {
        try { res = await TMN_API.call("profile", "setImage", { kind: kind, path: up.path }); break; }
        catch (e) { if (e.status === 409 && t < 2) await new Promise(function (ok) { setTimeout(ok, 1200); }); else throw e; }
      }
      UI.toast(sp.label + " napalitan ✓");
      return saveUser(res.user);
    } catch (e) { UI.toast(e.message || "Hindi na-upload."); return null; }
  }

  async function removePhoto(kind) {
    var UI = window.TMN_UI;
    if (!needOnline()) return null;
    if (!(await TMN_MODAL.confirm("Alisin ang " + SPEC[kind].label.toLowerCase() + "?", { okText: "Alisin", danger: true }))) return null;
    try { var res = await TMN_API.call("profile", "removeImage", { kind: kind }); UI.toast("Naalis."); return saveUser(res.user); }
    catch (e) { UI.toast(e.message); return null; }
  }

  function open() {
    var UI = window.TMN_UI, esc = UI.esc;
    var u = window.TMN_USER || {};
    var f = document.createElement("form");
    f.className = "pe-form"; f.noValidate = true;
    f.innerHTML =
      '<div class="pe-pics">' +
        '<div class="pe-pic" data-kind="avatar"><span class="thumb"></span><span class="grow">Profile photo</span><span class="btns"></span></div>' +
        '<div class="pe-pic" data-kind="banner"><span class="thumb wide"></span><span class="grow">Cover photo</span><span class="btns"></span></div>' +
      "</div>" +
      '<label class="field"><span class="pe-label">Pangalan</span><input class="input" name="name" maxlength="40" autocomplete="name"></label>' +
      '<label class="field"><span class="pe-label">Bio</span><textarea class="input" name="bio" maxlength="300" rows="4" placeholder="Konting kwento tungkol sa iyo…"></textarea>' +
        '<span class="pe-count faint small"></span></label>' +
      '<p class="faint small">Username: <b>@' + esc(u.username || "") + "</b> (hindi pa napapalitan)</p>";
    var name = f.querySelector("[name=name]"), bio = f.querySelector("[name=bio]"), cnt = f.querySelector(".pe-count");
    name.value = u.display_name || ""; bio.value = u.bio || "";
    function count() { cnt.textContent = bio.value.length + " / 300"; }
    bio.addEventListener("input", count); count();

    function paintPics() {
      var cur = window.TMN_USER || {};
      ["avatar", "banner"].forEach(function (k) {
        var row = f.querySelector('[data-kind="' + k + '"]'), url = cur[k + "_url"];
        row.querySelector(".thumb").innerHTML = url ? '<img alt="" src="' + esc(url) + '">' : (k === "avatar" ? esc(UI.initials(cur.display_name)) : "");
        row.querySelector(".btns").innerHTML =
          '<button type="button" class="btn btn-ghost btn-sm" data-act="change">' + I("camera", "ic-sm") + (url ? "Palitan" : "Lagyan") + "</button>" +
          (url ? '<button type="button" class="icon-btn" data-act="remove" aria-label="Alisin">' + I("trash") + "</button>" : "");
      });
    }
    paintPics();
    f.querySelector(".pe-pics").addEventListener("click", async function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var k = b.closest("[data-kind]").dataset.kind;
      b.disabled = true;
      if (b.dataset.act === "change") await changePhoto(k); else await removePhoto(k);
      b.disabled = false; paintPics();
    });

    async function save(m, btn) {
      var d = name.value.trim().replace(/\s+/g, " ");
      if (!d) { name.setAttribute("aria-invalid", "true"); name.focus(); return; }
      if (!needOnline()) return;
      btn.disabled = true;
      try {
        var res = await TMN_API.call("profile", "update", { display_name: d, bio: bio.value });
        saveUser(res.user); UI.toast("Na-save ang profile ✓"); m.close();
      } catch (e) { btn.disabled = false; UI.toast(e.message); }
    }
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    var m = TMN_MODAL.open({
      title: "Edit profile", size: "md", body: f,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } },
        { label: "Save", cls: "btn-primary", onClick: function (api, b) { save(api, b); } }
      ]
    });
    return m;
  }

  window.TMN_PROFILE_EDIT = { open: open, changePhoto: changePhoto, removePhoto: removePhoto };
})();
