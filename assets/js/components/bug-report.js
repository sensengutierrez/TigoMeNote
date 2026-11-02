/* TigoMeNote · components/bug-report.js — "Report a bug" (para sa beta testers)
     TMN_BUG.open()  → sheet: ano ang nangyari, screenshot (opsyonal), at technical info (version, device, huling errors at pages)
   Ipinapadala sa crash-fast (action "bug") → Admin: app/admin/beta.html → Bugs. Kailangan: api.js, modal.js, app-health.js */
(function () {
  function shrink(file) {   // screenshot → JPEG, hanggang 1080 px, para maliit
    return new Promise(function (ok) {
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var k = Math.min(1, 1080 / Math.max(im.width, im.height)), c = document.createElement("canvas");
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          var q = 0.7, d = c.toDataURL("image/jpeg", q);
          while (d.length > 390000 && q > 0.3) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
          ok(d.length <= 400000 ? d : null);
        };
        im.onerror = function () { ok(null); };
        im.src = r.result;
      };
      r.onerror = function () { ok(null); };
      r.readAsDataURL(file);
    });
  }
  function open() {
    var UI = window.TMN_UI, H = window.TMN_HEALTH, I = window.TMN_ICON || function () { return ""; };
    var shot = null;
    var body = document.createElement("form"); body.className = "bug-form"; body.noValidate = true;
    body.innerHTML =
      '<p class="faint small">Thank you for testing! Tell us what went wrong, and we\'ll fix it.</p>' +
      '<label class="field"><span class="pe-label">What happened?</span><textarea class="input bug-text" rows="4" maxlength="500" placeholder="e.g. I tapped Post and nothing happened. / The map is blank on Safety."></textarea></label>' +
      '<div class="bug-shot"><label class="btn btn-ghost btn-sm">' + I("image", "ic-sm") + 'Add a screenshot<input type="file" accept="image/*" hidden></label><span class="faint small bug-shot-n"></span></div>' +
      '<label class="bug-tech"><input type="checkbox" checked> <span class="small">Send technical info (app version, phone model, recent errors and pages)</span></label>';
    body.querySelector("input[type=file]").addEventListener("change", async function () {
      var f = this.files && this.files[0]; if (!f) return;
      body.querySelector(".bug-shot-n").textContent = "Adding…";
      shot = await shrink(f);
      body.querySelector(".bug-shot-n").textContent = shot ? "✓ " + f.name.slice(0, 30) : "Couldn't add this picture.";
    });
    var m = TMN_MODAL.open({ title: "Report a bug", size: "sm", cls: "modal-sheet", body: body, actions: [
      { label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } },
      { label: I("send", "ic-sm") + "Send", cls: "btn-primary", onClick: async function (a, btn) {
        var text = body.querySelector(".bug-text").value.trim();
        if (text.length < 5) { UI.toast("Tell us a little more about what happened."); body.querySelector(".bug-text").focus(); return; }
        var tech = body.querySelector(".bug-tech input").checked;
        var detail = tech && H ? JSON.stringify({ pages: H.pages(), recent: H.recent(), lang: document.documentElement.lang, theme: document.documentElement.getAttribute("data-theme"), online: navigator.onLine, ua: navigator.userAgent }, null, 1) : null;
        btn.disabled = true;
        try {
          await TMN_API.call("crash", "bug", { app: window.TMN_APP_ID || "web", version: window.TMN_CONFIG.version, device: tech && H ? H.device() : null,
            page: (H && H.pages().slice(-2)[0]) || location.pathname, text: text, detail: detail, shot: shot });
          m.close(); UI.toast("Thanks! Your report was sent 🐞");
        } catch (e) { btn.disabled = false; UI.toast(e.message); }
      } }] });
  }
  window.TMN_BUG = { open: open };
})();
