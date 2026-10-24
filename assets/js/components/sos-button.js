/* TigoMeNote · components/sos-button.js — ang SOS button (pindutin nang matagal)
   TMN_SOS.mount(el, { onChange }) → pindutin nang 3 s → 5 s countdown (puwedeng i-cancel) → ipapadala ang SOS
     kasama ang GPS sa buong Family/Friends circle (push + alarm sa phone nila).
   TMN_SOS.end("safe" | "cancelled") → tapusin ang sarili mong SOS.
   Sa APK: puwede ring mag-SMS kapag walang internet (TMN_NATIVE.canSms()).
   Kailangan: native-bridge.js, api.js, modal.js, safety-watch.js */
(function () {
  var N = window.TMN_NATIVE;
  var I = function (n, c) { return TMN_ICON(n, c); };
  var HOLD_MS = 3000, COUNT = 5;

  function mount(el, opts) {
    opts = opts || {};
    el.innerHTML =
      '<button type="button" class="sos-hold" aria-label="SOS: press and hold for 3 seconds">' +
        '<svg class="sos-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/></svg>' +
        '<span class="sos-hold-in"><b>SOS</b><small>Hold 3 sec</small></span>' +
      "</button>";
    var btn = el.querySelector(".sos-hold"), t0 = 0, raf = null, armed = false;
    function reset() { cancelAnimationFrame(raf); btn.classList.remove("holding"); btn.style.setProperty("--p", 0); armed = false; }
    function tick() {
      var p = Math.min(1, (Date.now() - t0) / HOLD_MS);
      btn.style.setProperty("--p", p);
      if (p >= 1) { reset(); if (navigator.vibrate) navigator.vibrate(200); countdown(opts); return; }
      raf = requestAnimationFrame(tick);
    }
    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); N.unlockAudio();
      t0 = Date.now(); armed = true; btn.classList.add("holding"); tick();
    }
    function up() { if (armed) { reset(); TMN_UI.toast("Keep holding for 3 seconds to send SOS."); } }
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", function () { if (armed) reset(); });
    btn.addEventListener("pointercancel", reset);
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    // Keyboard: Enter/Space nang matagal
    btn.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !armed && !e.repeat) down(e); });
    btn.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.key === " ") up(); });
  }

  // 5 s countdown na puwedeng i-cancel
  function countdown(opts) {
    var n = COUNT, done = false, iv;
    var body = document.createElement("div");
    body.className = "sos-count";
    body.innerHTML = '<div class="sos-count-n">' + n + '</div><p>Sending SOS to your Family &amp; Friends with your location…</p>' +
      '<label class="field"><span class="pe-label">Message (optional)</span><input class="input" maxlength="200" placeholder="e.g. Car accident on the highway"></label>';
    var m = TMN_MODAL.open({
      title: "SOS", size: "sm", cls: "modal-sos", body: body, closeOnBackdrop: false,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { done = true; clearInterval(iv); m.close(); TMN_UI.toast("SOS cancelled."); } },
        { label: "Send now", cls: "btn-danger-solid", onClick: function () { fire(); } }
      ],
      onClose: function () { if (!done) { done = true; clearInterval(iv); } }
    });
    var input = body.querySelector("input");
    iv = setInterval(function () {
      n--; body.querySelector(".sos-count-n").textContent = n;
      if (navigator.vibrate) navigator.vibrate(80);
      if (n <= 0) fire();
    }, 1000);
    function fire() {
      if (done) return; done = true; clearInterval(iv);
      var note = input.value.trim();
      m.close();
      send(note, opts);
    }
  }

  async function send(note, opts) {
    TMN_UI.toast("Sending SOS…");
    var c = null;
    try { c = await N.getLocation({ high: true, maxAge: 0, timeout: 8000 }); } catch (e) { /* ipadala kahit walang GPS */ }
    try {
      var r = await TMN_API.call("safety", "sos", Object.assign({ note: note }, c || {}), { timeout: 25000 });
      TMN_UI.toast(r.notified ? "SOS sent to " + r.notified + " people." : "SOS is on, but your circle is empty. Add Family in Safety.");
      if (!c) TMN_UI.toast("Turn on location so they can find you.");
      if (window.TMN_SAFETY_WATCH) TMN_SAFETY_WATCH.refresh();
      if (opts.onChange) opts.onChange(r.alert);
    } catch (err) {
      // Walang internet: sa APK, SMS na may location
      if (N.canSms() && c) {
        var link = N.directionsUrl(c.lat, c.lng);
        try { await N.sendSms([], "SOS! I need help. My location: " + link + (note ? " — " + note : "")); TMN_UI.toast("No internet. SMS opened."); return; } catch (e) {}
      }
      var num = N.emergencyNumber();
      TMN_MODAL.confirm("Couldn't send the SOS (" + err.message + "). Call " + num + " now?", { title: "SOS not sent", okText: "Call " + num, danger: true })
        .then(function (ok) { if (ok) location.href = "tel:" + num; });
    }
  }

  async function end(status) {
    await TMN_API.call("safety", "sosEnd", { status: status === "cancelled" ? "cancelled" : "safe" });
    TMN_UI.toast(status === "cancelled" ? "SOS cancelled." : "Glad you're safe. Your circle was told.");
    if (window.TMN_SAFETY_WATCH) await TMN_SAFETY_WATCH.refresh();
  }

  window.TMN_SOS = { mount: mount, end: end, send: send };
})();
