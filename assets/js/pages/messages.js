/* TigoMeNote · pages/messages.js (app/messages.html) — inbox ng Tigo Messenger
   Chats at Message requests, search, bagong chat/group, at ang bukas na chat (components/chat-view.js).
   Desktop: listahan sa kaliwa, chat sa kanan. Phone: listahan, tapos buong screen ang chat.
   Links: messages.html?c=<chat id> (buksan ang chat) · messages.html?to=<user id> (magsimula ng chat)
   Sa TigoMeNote APK: hindi dito ang chat; kailangan ang hiwalay na Tigo Messenger app (bubuksan o ipapa-install). */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc, N = window.TMN_NATIVE || {};
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var me = window.TMN_USER || {};

  // ---------- APK: hiwalay na Tigo Messenger ----------
  if (N.isApp && N.appName !== "messenger") {
    document.body.classList.add("msg-gate");
    var gate = $("msgGate");
    gate.classList.remove("hidden");
    N.messenger.installed().then(function (yes) {
      $("gateTitle").textContent = yes ? "Opening Tigo Messenger…" : "Get Tigo Messenger";
      $("gateText").textContent = yes ? "Your chats open in the Tigo Messenger app." : "Chats on your phone are in a separate app, Tigo Messenger. Same account, no new sign-up.";
      $("gateBtn").innerHTML = I(yes ? "chat" : "download", "ic-sm") + (yes ? "Open Tigo Messenger" : "Install Tigo Messenger");
      $("gateBtn").onclick = function () { if (yes) N.messenger.open(location.search); else N.messenger.install(); };
      if (yes) N.messenger.open(location.search);
    });
    return;
  }

  var list = [], tab = "chats", current = null, chans = {}, q = "";

  function av(u, size) {
    u = u || {};
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }
  function when(iso) {
    var d = new Date(iso), now = new Date(), loc = (window.TMN_I18N && TMN_I18N.locale) || undefined;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });
    if (now - d < 6 * 86400000) return d.toLocaleDateString(loc, { weekday: "short" });
    return d.toLocaleDateString(loc, { month: "short", day: "numeric" });
  }
  function emptyThread() {
    return '<div class="empty thread-empty"><div class="empty-art">' + I("chat", "ic-lg") + "</div><h3>Tigo Messenger</h3>" +
      "<p>Chat with friends and groups. Send photos, share and pin your location, and react to messages.</p>" +
      '<button class="btn btn-primary" type="button" data-new-chat>' + I("edit", "ic-sm") + "New message</button></div>";
  }
  function name(c) { return TMN_CHAT.chatName(c, c.members.concat([me]), me.id); }

  function paintList() {
    var reqs = list.filter(function (c) { return c.status === "request"; });
    var rows = list.filter(function (c) { return (tab === "requests") === (c.status === "request"); })
      .filter(function (c) { return !q || name(c).toLowerCase().indexOf(q) > -1 || c.members.some(function (u) { return (u.username || "").indexOf(q) > -1; }); });
    $("reqCount").textContent = reqs.length ? String(reqs.length) : "";
    $("reqCount").classList.toggle("hidden", !reqs.length);
    $("ibItems").innerHTML = rows.length ? rows.map(function (c) {
      var pic = c.kind === "group" ? '<span class="ib-stack">' + av(c.members[1], 32) + av(c.members[0], 32) + "</span>" : av(c.members[0], 48);
      return '<button type="button" class="ib-item' + (current && current.id === c.id ? " active" : "") + (c.unread ? " unread" : "") + '" data-id="' + esc(c.id) + '">' + pic +
        '<span class="ib-main"><span class="ib-top"><b translate="no">' + esc(name(c)) + "</b>" + (c.muted ? I("bellOff", "ic-sm ib-muted") : "") +
          '<span class="ib-time">' + (c.last ? when(c.last.at) : "") + "</span></span>" +
          '<span class="ib-last" translate="no">' + esc(c.last ? c.last.text : c.kind === "group" ? "Group created" : "Say hi 👋") + "</span></span>" +
        (c.unread ? '<span class="dot-count">' + (c.unread > 99 ? "99+" : c.unread) + "</span>" : "") + "</button>";
    }).join("") : '<div class="ib-empty"><p class="faint small">' + (q ? "No chats found." : tab === "requests" ? "No message requests." : "No chats yet. Tap ✎ to start one.") + "</p></div>";
    var unread = list.filter(function (c) { return c.status === "active" && c.unread; }).length;
    UI.setBadge("messages", unread + reqs.length);
  }

  async function loadList() {
    try {
      var r = await TMN_API.call("messages", "inbox", {});
      list = r.list || [];
      paintList();
      // Bawat chat: ping kapag may bago (para gumalaw ang listahan kahit hindi bukas ang chat)
      if (window.TMN_RT) list.forEach(function (c) {
        if (chans[c.id] || !c.channel) return;
        chans[c.id] = TMN_RT.join(c.channel, function (ev) { if (ev === "msg" || ev === "unsend" || ev === "meta") softReload(); });
      });
    } catch (e) { $("ibItems").innerHTML = '<div class="ib-empty"><p class="faint small">' + esc(e.message) + "</p></div>"; }
  }
  var softT = null;
  function softReload() { clearTimeout(softT); softT = setTimeout(loadList, 400); }

  function openChat(id) {
    if (current && current.id === id) return;
    if (current) current.destroy();
    document.body.classList.add("msg-open");
    $("thread").innerHTML = "";
    current = TMN_CHAT.mount($("thread"), id, {
      onBack: closeChat,
      onChange: function (left) { if (left) { closeChat(); } softReload(); }
    });
    history.replaceState(null, "", location.pathname + "?c=" + encodeURIComponent(id));
    paintList();
  }
  function closeChat() {
    if (current) current.destroy();
    current = null;
    document.body.classList.remove("msg-open");
    $("thread").innerHTML = emptyThread();
    history.replaceState(null, "", location.pathname);
    paintList();
  }

  $("ibItems").addEventListener("click", function (e) { var b = e.target.closest("[data-id]"); if (b) openChat(b.dataset.id); });
  $("ibTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]"); if (!b) return;
    tab = b.dataset.tab;
    this.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    paintList();
  });
  $("ibSearch").addEventListener("input", function () { q = this.value.trim().toLowerCase().replace(/^@/, ""); paintList(); });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-new-chat]")) TMN_CHAT_NEW.open(function (id) { loadList(); openChat(id); }); });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape" && current && !document.querySelector(".modal-backdrop")) closeChat(); });

  // Realtime ang pangunahing balita ng bagong message; poll lang bilang reserba (20 s kung walang realtime, 2 min kung meron)
  (function poll() {
    setTimeout(function () { if (document.visibilityState === "visible") loadList(); poll(); }, window.TMN_RT && TMN_RT.connected() ? 120000 : 20000);
  })();
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") loadList(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", function (e) {
    if (e.data && e.data.type === "tmn-push" && e.data.data && e.data.data.type === "message") softReload();
  });

  (async function start() {
    $("thread").innerHTML = emptyThread();
    await loadList();
    var to = params.get("to"), c = params.get("c");
    if (to) {
      try { var r = await TMN_API.call("messages", "start", { user_id: to }); await loadList(); openChat(r.id); }
      catch (e) { UI.toast(e.message, 4000); history.replaceState(null, "", location.pathname); }
    } else if (c) openChat(c);
  })();
})();
