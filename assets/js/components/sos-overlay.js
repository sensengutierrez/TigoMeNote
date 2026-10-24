/* TigoMeNote · components/sos-overlay.js — ang pulang screen kapag may SOS ang Family/Friend mo
   TMN_SOS_ALERT.show(alert)   → full screen + alarm (tunog + vibrate)
   TMN_SOS_ALERT.hide()        → alisin lahat (tapos na ang SOS)
   TMN_SOS_ALERT.banner(list)  → maliit na pulang bar sa itaas para sa mga SOS na naka-silence na
   TMN_SOS_ALERT.mine(alert|null) → bar na "Naka-on ang SOS mo · I'm safe"
   Kailangan: native-bridge.js, api.js. Ginagamit ng safety-watch.js. */
(function () {
  var N = window.TMN_NATIVE;
  var I = function (n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function root() { return (window.TMN_CONFIG && TMN_CONFIG.root) || "../"; }
  function ago(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    return Math.floor(s / 3600) + " h ago";
  }
  function avatar(u, size) {
    u = u || {};
    var ini = String(u.display_name || u.username || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(ini)) + "</span>";
  }
  function name(u) { return (u && (u.display_name || "@" + u.username)) || "Someone"; }

  var el = null, current = null, onSilence = null, onAck = null;
  function show(a, handlers) {
    handlers = handlers || {};
    onSilence = handlers.silence; onAck = handlers.ack;
    var first = !el || !current || current.id !== a.id;
    current = a;
    if (!el) {
      el = document.createElement("div");
      el.className = "sos-ov"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-modal", "true");
      document.body.appendChild(el);
      el.addEventListener("click", click);
    }
    var num = N.emergencyNumber();
    var loc = a.loc;
    el.innerHTML =
      '<div class="sos-ov-in">' +
        '<div class="sos-ov-top">' + I("sos") + "<span>SOS</span></div>" +
        '<div class="sos-ov-who">' + avatar(a.user, 84) +
          '<h2><span translate="no">' + esc(name(a.user)) + "</span></h2><p>needs help now</p></div>" +
        (a.note ? '<p class="sos-ov-note" translate="no">“' + esc(a.note) + "”</p>" : "") +
        '<p class="sos-ov-meta">' + I("clock", "ic-sm") + "<span>Sent " + ago(a.started_at) + "</span>" +
          (loc ? " · " + I("pin", "ic-sm") + "<span>Location " + ago(loc.at) + "</span>" : " · <span>No location yet</span>") + "</p>" +
        (a.acks && a.acks.length ? '<p class="sos-ov-acks">' + a.acks.map(function (k) { return '<span translate="no">' + esc(name(k.user)) + "</span>"; }).join(", ") + " <span>responding</span></p>" : "") +
        '<div class="sos-ov-btns">' +
          (a.acked ? '<button type="button" class="sos-b sos-b-main" disabled>' + I("check") + "You're responding</button>"
                   : '<button type="button" class="sos-b sos-b-main" data-a="ack">' + I("nav") + "I'm on my way</button>") +
          '<a class="sos-b" href="' + root() + "app/safety.html?sos=" + esc(a.id) + '">' + I("map") + "Open map</a>" +
          (loc ? '<a class="sos-b" target="_blank" rel="noopener" href="' + esc(N.directionsUrl(loc.lat, loc.lng)) + '">' + I("compass") + "Directions</a>" : "") +
          '<a class="sos-b" href="tel:' + num + '">' + I("phone") + "Call " + num + "</a>" +
        "</div>" +
        '<button type="button" class="sos-ov-silence" data-a="silence">' + I("x", "ic-sm") + (a.acked ? "Close" : "Silence alarm") + "</button>" +
        '<p class="sos-ov-sound hidden">Tap anywhere to turn on the alarm sound.</p>' +
      "</div>";
    document.documentElement.classList.add("sos-open");
    if (a.acked) N.alarm.stop(); // tumutugon ka na: tahimik na, pero bukas pa ang screen
    else if (first || !N.alarm.playing) {
      var audible = N.alarm.start("SOS: " + name(a.user), "needs help now");
      el.querySelector(".sos-ov-sound").classList.toggle("hidden", !!audible);
    }
  }
  async function click(e) {
    var b = e.target.closest("[data-a]");
    if (!b) { // unang tap: payagan ang tunog
      N.unlockAudio();
      if (N.alarm.playing) { N.alarm.stop(); N.alarm.start(); }
      var hint = el.querySelector(".sos-ov-sound"); if (hint) hint.classList.add("hidden");
      return;
    }
    if (b.dataset.a === "silence") { var was = current, cb = onSilence; hide(); if (cb && was) cb(was); }
    if (b.dataset.a === "ack") {
      b.disabled = true;
      try { await TMN_API.call("safety", "ack", { id: current.id }); current.acked = true; show(current, { silence: onSilence, ack: onAck }); if (onAck) onAck(current); }
      catch (err) { b.disabled = false; if (window.TMN_UI) TMN_UI.toast(err.message); }
    }
  }
  function hide() {
    N.alarm.stop();
    if (el) { el.remove(); el = null; }
    current = null;
    document.documentElement.classList.remove("sos-open");
  }

  // Maliit na bar sa itaas (SOS ng iba na naka-silence, o sarili mong SOS)
  var bar = null;
  function barEl() {
    if (!bar) { bar = document.createElement("div"); bar.className = "sos-bar"; document.body.appendChild(bar); }
    return bar;
  }
  var others = [], mineA = null;
  function paintBar() {
    if (!others.length && !mineA) { if (bar) { bar.remove(); bar = null; } document.documentElement.classList.remove("sos-bar-on"); return; }
    var h = "";
    if (mineA) h += '<a class="sos-bar-row mine" href="' + root() + 'app/safety.html">' + I("sos", "ic-sm") + "<span>Your SOS is on · sharing your location</span><b>I'm safe</b></a>";
    others.forEach(function (a) {
      h += '<a class="sos-bar-row" href="' + root() + "app/safety.html?sos=" + esc(a.id) + '">' + I("sos", "ic-sm") + '<span><span translate="no">' + esc(name(a.user)) + "</span> needs help</span><b>View</b></a>";
    });
    barEl().innerHTML = h;
    document.documentElement.classList.add("sos-bar-on");
  }
  function banner(list) { others = list || []; paintBar(); }
  function mine(a) { mineA = a; paintBar(); }

  window.TMN_SOS_ALERT = { show: show, hide: hide, banner: banner, mine: mine, get current() { return current; } };
})();
