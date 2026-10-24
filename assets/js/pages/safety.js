/* TigoMeNote · pages/safety.js (app/safety.html)
   Family/Friends circle, mapa (Locate), SOS button, at settings ng phone na ito (alerts, location, pause, history).
   Link ng isang SOS: safety.html?sos=<id> → nakatutok ang mapa sa taong iyon.
   Gamit: components/sos-button.js, components/map-view.js, push-setup.js, native-bridge.js, safety-watch.js */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, N = window.TMN_NATIVE, P = window.TMN_PUSH;
  var $ = function (id) { return document.getElementById(id); };
  var esc = UI.esc;
  var data = null, tab = "family", alerts = [], map = null, mapFailed = false, focusSos = new URLSearchParams(location.search).get("sos");

  function ago(iso) {
    if (!iso) return "";
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " d ago";
  }
  function avatar(u, size) {
    return '<span class="avatar" style="--size:' + (size || 44) + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username))) + "</span>";
  }
  function who(u) {
    return '<div class="sf-who"><b translate="no">' + esc(u.display_name || u.username) + '</b><span class="faint small" translate="no">@' + esc(u.username) + "</span></div>";
  }

  // ---------- SOS ----------
  var num = N.emergencyNumber();
  $("callBtn").href = "tel:" + num; $("callTxt").textContent = "Call " + num;
  TMN_SOS.mount($("sosMount"), { onChange: function () { load(); } });
  $("safeBtn").addEventListener("click", async function () { this.disabled = true; try { await TMN_SOS.end("safe"); } catch (e) { UI.toast(e.message); } this.disabled = false; });
  $("cancelSosBtn").addEventListener("click", async function () { this.disabled = true; try { await TMN_SOS.end("cancelled"); } catch (e) { UI.toast(e.message); } this.disabled = false; });

  document.addEventListener("tmn:safety", function (e) { alerts = e.detail.alerts || []; paintActive(); paintMap(); });
  function paintActive() {
    var mine = alerts.filter(function (a) { return a.mine; })[0];
    $("myActive").classList.toggle("hidden", !mine);
    $("sosCard").classList.toggle("is-on", !!mine);
    if (!mine) return;
    $("myActiveTxt").textContent = mine.loc ? "Your circle can see your location (updated " + ago(mine.loc.at) + ")." : "Turn on location so your circle can find you.";
    $("myAcks").innerHTML = mine.acks.length
      ? mine.acks.map(function (k) { return '<span class="badge badge-ok">' + I("nav", "ic-sm") + '<span translate="no">' + esc(k.user.display_name || k.user.username) + "</span>&nbsp;is responding</span>"; }).join("")
      : '<span class="faint">Waiting for someone to respond…</span>';
  }

  // ---------- circle ----------
  async function load() {
    if (!navigator.onLine) { $("members").innerHTML = '<p class="faint small">You\'re offline.</p>'; return; }
    try {
      data = await TMN_API.call("safety", "circle", {});
      render();
      paintPhone();
    } catch (e) { UI.toast(e.message); }
  }
  function render() {
    var m = data.members, out = data.outgoing;
    // Kasama sa bilang at listahan ang mga in-invite mo na hindi pa tumatanggap (para hindi "nawawala")
    function count(k) { return m.concat(out).filter(function (x) { return x.kind === k; }).length; }
    $("nFamily").textContent = count("family");
    $("nFriend").textContent = count("friend");
    var list = m.filter(function (x) { return x.kind === tab; }), pend = out.filter(function (x) { return x.kind === tab; });
    $("members").innerHTML = list.map(memberRow).join("") + pend.map(pendingRow).join("");
    $("membersEmpty").classList.toggle("hidden", !!(list.length + pend.length));
    $("emptyTitle").textContent = tab === "family" ? "No Family yet" : "No Friends yet";
    $("emptyText").textContent = tab === "family"
      ? "Add the people you trust. They'll get your SOS and, if you allow, see where you are."
      : "Friends get your SOS. You choose which friends can see your location.";
    // invites
    $("invitesCard").classList.toggle("hidden", !data.incoming.length);
    $("invites").innerHTML = data.incoming.map(function (x) {
      return '<div class="sf-row" data-id="' + x.id + '">' + avatar(x.user) + '<div class="sf-row-main">' + who(x.user) +
        '<span class="small">wants to add you to <b>' + (x.kind === "family" ? "Family" : "Friends") + "</b></span>" +
        '<label class="sf-check"><input type="checkbox" class="inv-share"' + (x.kind === "family" ? " checked" : "") + "> Let them locate me</label></div>" +
        '<div class="sf-row-act"><button type="button" class="btn btn-primary btn-sm" data-a="accept">Accept</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-a="decline">Decline</button></div></div>';
    }).join("");
    paintMap();
  }
  function pendingRow(x) {
    return '<div class="sf-row is-pending" data-id="' + x.id + '">' + avatar(x.user) + '<div class="sf-row-main">' + who(x.user) +
      '<span class="sf-sub small">' + I("clock", "ic-sm") + "<span>Invite sent · waiting for them to accept</span></span></div>" +
      '<div class="sf-row-act"><button type="button" class="btn btn-ghost btn-sm" data-a="remove">Cancel invite</button></div></div>';
  }
  function memberRow(x) {
    var u = x.user, sub;
    if (x.paused) sub = I("eyeOff", "ic-sm") + "<span>Location paused</span>";
    else if (!x.they_share) sub = I("lock", "ic-sm") + "<span>Not sharing location with you</span>";
    else if (x.last) sub = I("pin", "ic-sm") + "<span>Seen " + ago(x.last.at) + "</span>" + (x.last.acc ? '<span class="faint">· ±' + Math.round(x.last.acc) + " m</span>" : "");
    else sub = I("pin", "ic-sm") + "<span>No location yet</span>";
    var tags = (x.guardian ? '<span class="badge">Parent</span>' : "") + (x.ward ? '<span class="badge">Teen</span>' : "");
    return '<div class="sf-row" data-id="' + x.id + '" data-uid="' + u.id + '">' + avatar(u) +
      '<div class="sf-row-main">' + who(u) + '<span class="sf-sub small">' + sub + "</span>" + (tags ? '<span class="sf-tags">' + tags + "</span>" : "") + "</div>" +
      '<div class="sf-row-act">' +
        (x.last ? '<button type="button" class="btn btn-ghost btn-sm sf-locate" data-a="locate" aria-label="Locate">' + I("map", "ic-sm") + "<span>Locate</span></button>" : "") +
        '<label class="sf-share" title="Can locate me"><span class="small">Can locate me</span><span class="switch"><input type="checkbox" data-a="share"' + (x.i_share ? " checked" : "") + (x.locked ? " disabled" : "") + ' aria-label="Can locate me"><span></span></span></label>' +
        '<button type="button" class="icon-btn" data-a="more" aria-label="More">' + I("more") + "</button>" +
      "</div></div>";
  }

  function selectTab(k) {
    tab = k;
    $("circleTabs").querySelectorAll("[data-k]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.k === k)); });
    if (data) render();
  }
  $("circleTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]"); if (b) selectTab(b.dataset.k);
  });

  function linkById(id) { return data && data.members.concat(data.incoming, data.outgoing).filter(function (x) { return x.id === id; })[0]; }
  document.querySelector(".sf-main").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-a]"); if (!b || b.dataset.a === "share") return;
    var row = b.closest("[data-id]"); if (!row) return;
    var x = linkById(row.dataset.id); if (!x) return;
    var a = b.dataset.a;
    if (a === "accept" || a === "decline") {
      b.disabled = true;
      try { await TMN_API.call("safety", "respond", { id: x.id, accept: a === "accept", share: row.querySelector(".inv-share").checked }); UI.toast(a === "accept" ? "Added to your circle." : "Invite declined."); load(); }
      catch (err) { b.disabled = false; UI.toast(err.message); }
    }
    if (a === "remove") { try { await TMN_API.call("safety", "remove", { id: x.id }); load(); } catch (err) { UI.toast(err.message); } }
    if (a === "locate") locate(x);
    if (a === "more") moreMenu(x);
  });
  document.querySelector(".sf-main").addEventListener("change", async function (e) {
    var sw = e.target.closest('[data-a="share"]'); if (!sw) return;
    var x = linkById(sw.closest("[data-id]").dataset.id);
    sw.disabled = true;
    try { await TMN_API.call("safety", "update", { id: x.id, share: sw.checked }); x.i_share = sw.checked; UI.toast(sw.checked ? "They can locate you now." : "They can't locate you anymore."); if (window.TMN_SAFETY_WATCH) TMN_SAFETY_WATCH.refresh(); }
    catch (err) { sw.checked = !sw.checked; UI.toast(err.message); }
    sw.disabled = !!x.locked;
  });

  function moreMenu(x) {
    var body = document.createElement("div");
    body.className = "pick-list";
    body.innerHTML =
      (x.last ? '<button type="button" class="pick" data-m="dir">' + I("compass") + "Directions</button>" : "") +
      '<button type="button" class="pick" data-m="kind">' + I(x.kind === "family" ? "users" : "home") + (x.kind === "family" ? "Move to Friends" : "Move to Family") + "</button>" +
      (x.locked ? "" : '<button type="button" class="pick danger" data-m="remove">' + I("trash") + "Remove from circle</button>");
    var m = TMN_MODAL.open({ title: x.user.display_name || x.user.username, size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-m]"); if (!b) return;
      m.close();
      if (b.dataset.m === "dir") window.open(N.directionsUrl(x.last.lat, x.last.lng), "_blank", "noopener");
      if (b.dataset.m === "kind") { try { await TMN_API.call("safety", "update", { id: x.id, kind: x.kind === "family" ? "friend" : "family" }); load(); } catch (err) { UI.toast(err.message); } }
      if (b.dataset.m === "remove") {
        if (!(await TMN_MODAL.confirm("Remove from your circle? You won't get each other's SOS anymore.", { okText: "Remove", danger: true }))) return;
        try { await TMN_API.call("safety", "remove", { id: x.id }); UI.toast("Removed."); load(); } catch (err) { UI.toast(err.message); }
      }
    });
  }

  // ---------- map ----------
  async function ensureMap() {
    if (map || mapFailed) return map;
    try { map = await TMN_MAP.create($("map")); }
    catch (e) { mapFailed = true; $("mapEmpty").classList.remove("hidden"); $("mapEmpty").querySelector("span").textContent = e.message; }
    return map;
  }
  var fitted = false;
  async function paintMap() {
    if (!data) return;
    var pts = [], me = window.TMN_USER || {};
    data.members.forEach(function (x) { if (x.last) pts.push({ id: x.user.id, lat: x.last.lat, lng: x.last.lng, acc: x.last.acc, user: x.user, label: (x.user.display_name || x.user.username) + " · " + ago(x.last.at) }); });
    if (data.me.last) pts.push({ id: me.id, me: true, lat: data.me.last.lat, lng: data.me.last.lng, acc: data.me.last.acc, user: me, label: "You · " + ago(data.me.last.at) });
    alerts.forEach(function (a) {
      if (!a.loc || !a.user) return;
      pts = pts.filter(function (p) { return p.id !== a.user.id; });
      pts.push({ id: a.user.id, sos: true, me: a.mine, lat: a.loc.lat, lng: a.loc.lng, acc: a.loc.acc, user: a.user, label: "SOS · " + (a.user.display_name || a.user.username) + " · " + ago(a.loc.at) });
    });
    $("mapEmpty").classList.toggle("hidden", !!pts.length && !mapFailed);
    if (!pts.length && !map) return;
    var m = await ensureMap(); if (!m) return;
    m.set(pts);
    var target = focusSos && alerts.filter(function (a) { return a.id === focusSos; })[0];
    if (target && target.user && m.focus(target.user.id)) { focusSos = null; fitted = true; }
    else if (!fitted && pts.length) { m.fit(); fitted = true; }
  }
  async function locate(x) {
    var m = await ensureMap(); if (!m) return;
    $("map").scrollIntoView({ behavior: "smooth", block: "center" });
    m.focus(x.user.id);
    try { var r = await TMN_API.call("safety", "history", { user_id: x.user.id, hours: 24 }); m.path(r.points); } catch (e) {}
  }

  // ---------- this phone ----------
  async function paintPhone() {
    var st = await P.status();
    var sub = $("pushSub"), btn = $("pushBtn");
    btn.disabled = false; btn.dataset.s = st;
    if (st === "on") { sub.textContent = "On for this phone."; btn.textContent = "Test"; btn.className = "btn btn-ghost btn-sm"; }
    else if (st === "denied") { sub.textContent = "Blocked. Allow notifications for this site in your browser settings."; btn.textContent = "Turn on"; btn.disabled = true; }
    else if (st === "ios-home") { sub.textContent = "On iPhone: tap Share → Add to Home Screen, then open TigoMeNote from there."; btn.textContent = "How"; btn.className = "btn btn-ghost btn-sm"; }
    else if (st === "unsupported") { sub.textContent = "This browser can't get alerts. Use Chrome."; btn.textContent = "Turn on"; btn.disabled = true; }
    else { sub.textContent = "Turn on to get an alarm when someone in your circle sends SOS."; btn.textContent = "Turn on"; btn.className = "btn btn-primary btn-sm"; }

    var perm = await N.permission(), ls = $("locSub"), lb = $("locBtn");
    lb.disabled = false;
    var last = data && data.me.last;
    if (perm === "granted") { ls.textContent = last ? "On · last saved " + ago(last.at) + "." : "On."; lb.textContent = "Update now"; }
    else if (perm === "denied") { ls.textContent = "Blocked. Allow location for this site in your browser settings."; lb.textContent = "Turn on"; lb.disabled = true; }
    else { ls.textContent = "Needed so your circle can find you."; lb.textContent = "Turn on"; }

    if (data) {
      $("pauseSw").checked = !!data.me.paused;
      $("pauseSw").disabled = !!data.me.supervised;
      $("pauseSub").textContent = data.me.supervised ? "Your parent can see your location until you turn 18." : "Nobody can locate you while paused. SOS still works.";
    }
  }
  $("pushBtn").addEventListener("click", async function () {
    var b = this; b.disabled = true;
    try {
      if (b.dataset.s === "on") { var r = await P.test(); UI.toast(r.sent ? "Test sent. Check your notifications." : "Couldn't reach this phone. Turn alerts off and on again."); }
      else if (b.dataset.s === "ios-home") { TMN_MODAL.open({ title: "Alerts on iPhone", size: "sm", body: '<p>1. Tap the <b>Share</b> button in Safari.<br>2. Tap <b>Add to Home Screen</b>.<br>3. Open <b>TigoMeNote</b> from your home screen.<br>4. Come back here and tap <b>Turn on</b>.</p>' }); }
      else { await P.enable(); UI.toast("Alerts are on for this phone."); }
    } catch (e) { UI.toast(e.message); }
    b.disabled = false; paintPhone();
  });
  $("locBtn").addEventListener("click", async function () {
    var b = this; b.disabled = true;
    try {
      var c = await N.getLocation({ high: true, maxAge: 0 });
      await TMN_API.call("safety", "ping", Object.assign({ source: "manual" }, c));
      UI.toast("Location saved.");
      await load();
      if (window.TMN_SAFETY_WATCH) TMN_SAFETY_WATCH.refresh();
    } catch (e) { UI.toast(e.message); }
    b.disabled = false; paintPhone();
  });
  $("pauseSw").addEventListener("change", async function () {
    var sw = this; sw.disabled = true;
    try { await TMN_API.call("safety", "pause", { on: sw.checked }); UI.toast(sw.checked ? "Sharing paused." : "Sharing is back on."); if (data) data.me.paused = sw.checked; if (window.TMN_SAFETY_WATCH) TMN_SAFETY_WATCH.refresh(); }
    catch (e) { sw.checked = !sw.checked; UI.toast(e.message); }
    sw.disabled = !!(data && data.me.supervised);
  });
  // Bago burahin: puwedeng i-save muna ang kopya (.zip) sa TigoMeNote folder (components/location-export.js)
  $("clearBtn").addEventListener("click", function () { TMN_LOC_EXPORT.clearSheet(load); });
  $("exportBtn").addEventListener("click", async function () {
    var b = this; b.disabled = true;
    try {
      var s = await TMN_LOC_EXPORT.save();
      UI.toast(s.count ? "Saved " + s.count + " locations to " + s.where + "." : "No saved locations yet.", 4000);
    } catch (e) { UI.toast(e.message); }
    b.disabled = false;
  });
  if (N.isApp) $("appNote").classList.add("hidden");

  // ---------- invite ----------
  function inviteSheet() {
    var kind = tab, picked = null, t = null;
    var body = document.createElement("div");
    body.className = "sf-inv";
    body.innerHTML =
      '<div class="segmented sf-inv-kind" role="group" aria-label="Circle">' +
        '<button type="button" data-k="family" aria-pressed="' + (kind === "family") + '">' + I("home", "ic-sm") + "Family</button>" +
        '<button type="button" data-k="friend" aria-pressed="' + (kind === "friend") + '">' + I("users", "ic-sm") + "Friends</button></div>" +
      '<input class="input" type="search" placeholder="Search name or @username" aria-label="Search people">' +
      '<div class="sf-list sf-inv-list"><p class="faint small">Type a name to search.</p></div>' +
      '<label class="sf-check"><input type="checkbox" class="inv-share"' + (kind === "family" ? " checked" : "") + "> Let them locate me</label>" +
      '<p class="faint small">They must accept first. You can change this anytime.</p>';
    var input = body.querySelector("input[type=search]"), list = body.querySelector(".sf-inv-list"), share = body.querySelector(".inv-share");
    var m = TMN_MODAL.open({
      title: "Add to your circle", size: "sm", body: body,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } },
        { label: "Send invite", cls: "btn-primary", onClick: async function (api, btn) {
          if (!picked) { UI.toast("Choose a person first."); return; }
          btn.disabled = true;
          try { await TMN_API.call("safety", "invite", { user_id: picked, kind: kind, share: share.checked }); UI.toast("Invite sent. They'll see it in Notifications."); m.close(); selectTab(kind); load(); }
          catch (e) { btn.disabled = false; UI.toast(e.message); }
        } }
      ]
    });
    body.querySelector(".sf-inv-kind").addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]"); if (!b) return;
      kind = b.dataset.k; share.checked = kind === "family";
      this.querySelectorAll("[data-k]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    });
    input.addEventListener("input", function () {
      clearTimeout(t);
      var q = input.value.trim();
      if (q.length < 2) { list.innerHTML = '<p class="faint small">Type a name to search.</p>'; return; }
      t = setTimeout(async function () {
        try {
          var r = await TMN_API.call("social", "people", { q: q });
          var ids = data ? data.members.concat(data.outgoing, data.incoming).map(function (x) { return x.user.id; }) : [];
          list.innerHTML = r.list.length ? r.list.map(function (u) {
            var inC = ids.indexOf(u.id) >= 0;
            return '<button type="button" class="sf-row sf-pick' + (picked === u.id ? " on" : "") + '" data-uid="' + u.id + '"' + (inC ? " disabled" : "") + ">" + avatar(u, 36) + '<div class="sf-row-main">' + who(u) + (inC ? '<span class="faint small">Already in your circle</span>' : "") + "</div>" + I("check", "sf-tick") + "</button>";
          }).join("") : '<p class="faint small">Nobody found.</p>';
        } catch (e) { list.innerHTML = '<p class="faint small">' + esc(e.message) + "</p>"; }
      }, 300);
    });
    list.addEventListener("click", function (e) {
      var b = e.target.closest(".sf-pick"); if (!b || b.disabled) return;
      picked = b.dataset.uid;
      list.querySelectorAll(".sf-pick").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
    setTimeout(function () { input.focus(); }, 50);
  }
  $("inviteBtn").addEventListener("click", inviteSheet);
  $("emptyInvite").addEventListener("click", inviteSheet);

  window.addEventListener("online", load);
  load();
  if (window.TMN_SAFETY_WATCH) { alerts = TMN_SAFETY_WATCH.state.alerts || []; TMN_SAFETY_WATCH.refresh(); }
})();
