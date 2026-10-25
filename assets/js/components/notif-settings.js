/* TigoMeNote · components/notif-settings.js — settings ng notifications
   Push sa device na ito, Pause all, Sleep mode, at bawat uri: Off / In app / Push.
   TMN_NOTIF_SETTINGS.mount(el)  → gumagawa ng settings sa loob ng el (desktop: gilid ng Notifications page)
   TMN_NOTIF_SETTINGS.open()     → bubukas bilang sheet (phone: gear sa Notifications page)
   Kailangan: api.js, modal.js, push-setup.js (para sa "This device") */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;
  var PAUSES = [[0, "Off"], [15, "15 min"], [60, "1 hour"], [480, "8 hours"], [1440, "24 hours"]];
  var CATS = [
    { k: "likes", icon: "heart", title: "Reactions", sub: "When someone reacts to your post." },
    { k: "comments", icon: "comment", title: "Comments", sub: "When someone comments on your post." },
    { k: "reposts", icon: "repost", title: "Reposts", sub: "When someone reposts your post." },
    { k: "follows", icon: "userPlus", title: "Followers and requests", sub: "New followers, follow requests and accepted requests." },
    { k: "messages", icon: "chat", title: "Messages", sub: "New messages and message requests in TigoMeNote Chat." },
    { k: "updates", icon: "trophy", title: "From TigoMeNote", sub: "Milestones and your weekly recap." }
  ];
  var state = null;

  function seg(k, v) {
    return '<div class="segmented ns-seg" role="group" aria-label="' + esc(k) + '">' +
      [["off", "Off"], ["app", "In app"], ["push", "Push"]].map(function (o) {
        return '<button type="button" data-cat="' + k + '" data-v="' + o[0] + '" aria-pressed="' + String(v === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</div>";
  }
  function pausedText(p) {
    if (!p.paused_until || new Date(p.paused_until) <= new Date()) return "";
    var d = new Date(p.paused_until), loc = (window.TMN_I18N && TMN_I18N.locale) || undefined;
    return "Paused until " + d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });
  }

  function html() {
    var p = state.prefs, s = state.sleep, paused = pausedText(p);
    return '<div class="ns">' +
      '<div class="rows">' +
        '<div class="row ns-device"><div class="row-main"><div class="row-title">' + I("phone", "ic-sm") + " Push on this device</div>" +
          '<div class="row-sub ns-push-sub">Checking…</div></div><button type="button" class="btn btn-ghost btn-sm hidden" data-ns="push-on">Turn on</button></div>' +
        '<div class="row"><div class="row-main"><div class="row-title">' + I("bell", "ic-sm") + " Pause all</div>" +
          '<div class="row-sub">' + (paused ? esc(paused) : "Temporarily stop push notifications.") + "</div></div>" +
          '<select class="input ns-sel" data-ns="pause" aria-label="Pause all">' + PAUSES.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select></div>" +
        '<div class="row"><div class="row-main"><div class="row-title">' + I("moon", "ic-sm") + " Sleep mode</div>" +
          '<div class="row-sub">' + (s.sleep_on ? "Mute push during your sleep time (" + esc(s.sleep_start) + "–" + esc(s.sleep_end) + ")." : "Mute push during your sleep time. Turn on Sleep time in Settings first.") + "</div></div>" +
          '<label class="switch"><input type="checkbox" data-ns="sleep"' + (p.sleep_mute ? " checked" : "") + ' aria-label="Sleep mode"><span></span></label></div>' +
      "</div>" +
      '<h4 class="ns-head">What to notify you about</h4>' +
      '<div class="rows">' + CATS.map(function (c) {
        return '<div class="row ns-cat"><div class="row-main"><div class="row-title">' + I(c.icon, "ic-sm") + " " + c.title + '</div><div class="row-sub">' + c.sub + "</div></div>" + seg(c.k, p[c.k]) + "</div>";
      }).join("") + "</div>" +
      '<p class="ns-note small faint">' + I("shield", "ic-sm") + "<span>SOS alerts and account notices (like a hidden post) are always on.</span></p>" +
    "</div>";
  }

  async function devicePush(root) {
    var sub = root.querySelector(".ns-push-sub"), btn = root.querySelector('[data-ns="push-on"]');
    if (!window.TMN_PUSH) { sub.textContent = "Not available here."; return; }
    var st = await TMN_PUSH.status();
    var text = { on: "On. You'll get notifications on this device.", off: "Off on this device.", denied: "Blocked in your browser settings for this site.",
      unsupported: "This browser can't receive notifications.", "ios-home": "On iPhone: Add to Home Screen first, then open TigoMeNote from there." }[st] || "";
    sub.textContent = text;
    btn.classList.toggle("hidden", st !== "off");
  }

  async function save(root, ch) {
    try {
      var r = await TMN_API.call("notify", "setPrefs", ch);
      state.prefs = r.prefs;
      paint(root);
      UI.toast("Saved.");
    } catch (e) { UI.toast(e.message); paint(root); }
  }

  function paint(root) {
    root.innerHTML = html();
    devicePush(root);
  }
  function bind(root) {
    root.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-cat]");
      if (b) { var ch = {}; ch[b.dataset.cat] = b.dataset.v; save(root, ch); return; }
      if (e.target.closest('[data-ns="push-on"]')) {
        try { await TMN_PUSH.enable(); UI.toast("Notifications are on for this device."); } catch (err) { UI.toast(err.message, 5000); }
        devicePush(root);
      }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.dataset.ns === "pause") save(root, { pause_minutes: Number(t.value) });
      if (t.dataset.ns === "sleep") save(root, { sleep_mute: t.checked });
    });
  }

  async function mount(el) {
    el.innerHTML = '<p class="faint small sx-empty">Loading…</p>';
    try {
      state = await TMN_API.call("notify", "prefs", {});
      paint(el); bind(el);
    } catch (e) { el.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
  }
  function open() {
    var el = document.createElement("div");
    TMN_MODAL.open({ title: "Notification settings", size: "md", cls: "modal-sheet", body: el });
    mount(el);
  }

  window.TMN_NOTIF_SETTINGS = { mount: mount, open: open };
})();
