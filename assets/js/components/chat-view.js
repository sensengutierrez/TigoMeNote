/* TigoMeNote · components/chat-view.js — isang chat (TigoMeNote Chat)
   Text, photo, location (may mapa), reactions, pin, Seen, "typing…", message requests, at group settings.
   var v = TMN_CHAT.mount(el, chatId, { onBack, onChange })  → v.destroy()
   Server: messages-fast. Real-time: realtime.js (kung hindi konektado, nagpo-poll bawat 4 s).
   Kailangan: api.js, modal.js, realtime.js, post-queue.js (pang-compress ng photo), native-bridge.js,
              map-view.js (mapa ng location), social-ui.js (profile, report), chat-new.js (add people) */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;
  var EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];
  var POLL_FAST = 6000, POLL_SLOW = 60000; // realtime ang pangunahin; reserba lang ang poll

  function av(u, size) {
    u = u || {};
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }
  function loc() { return (window.TMN_I18N && TMN_I18N.locale) || undefined; }
  function time(iso) { return new Date(iso).toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" }); }
  function day(iso) {
    var d = new Date(iso), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString(loc(), { weekday: "short", month: "short", day: "numeric" });
  }
  function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>'); }
  function cid() { return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function chatName(chat, members, meId) {
    if (chat.title) return chat.title;
    var others = members.filter(function (m) { return m.id !== meId; });
    return others.map(function (m) { return m.display_name || m.username; }).slice(0, 3).join(", ") + (others.length > 3 ? " +" + (others.length - 3) : "") || "Chat";
  }

  function mount(el, id, opts) {
    opts = opts || {};
    var me = window.TMN_USER || {};
    var S = { chat: null, members: [], msgs: [], pinned: null, more: false, typing: {}, dead: false, loading: false, pendingRefresh: false };
    var rt = null, poll = null, typingSent = 0, typingTimer = null;

    el.innerHTML =
      '<div class="ch">' +
        '<header class="ch-head"><button type="button" class="icon-btn ch-back" aria-label="Back">' + I("chevronL") + "</button>" +
          '<button type="button" class="ch-who" data-ch="who"></button>' +
          '<button type="button" class="icon-btn" data-ch="menu" aria-label="Chat settings">' + I("more") + "</button></header>" +
        '<div class="ch-pin hidden"></div>' +
        '<div class="ch-list" role="log" aria-live="polite"><div class="ch-loading faint small">Loading…</div></div>' +
        '<div class="ch-typing hidden"></div>' +
        '<div class="ch-req hidden"></div>' +
        '<form class="ch-compose">' +
          '<button type="button" class="icon-btn" data-ch="photo" aria-label="Send a photo" title="Photo">' + I("image") + "</button>" +
          '<button type="button" class="icon-btn" data-ch="loc" aria-label="Send your location" title="Location">' + I("pin") + "</button>" +
          (window.TMN_EMOJI_PICK ? '<button type="button" class="icon-btn" data-ch="emoji" aria-label="Emoji and stickers" title="Emoji and stickers" aria-expanded="false">' + I("smile") + "</button>" : "") +
          '<textarea class="input ch-input" rows="1" maxlength="2000" placeholder="Message…" aria-label="Message"></textarea>' +
          '<button type="submit" class="icon-btn ch-send" aria-label="Send">' + I("send") + "</button>" +
          '<input type="file" accept="image/*" class="hidden ch-file">' +
        "</form>" +
      "</div>";
    var root = el.querySelector(".ch"), list = root.querySelector(".ch-list"), input = root.querySelector(".ch-input");
    var form = root.querySelector(".ch-compose"), fileIn = root.querySelector(".ch-file");
    if (window.TMN_GUARD) TMN_GUARD.watch(input);
    root.querySelector(".ch-back").addEventListener("click", function () { if (opts.onBack) opts.onBack(); });

    function memberById(uid) { return S.members.filter(function (m) { return m.id === uid; })[0] || null; }
    function others() { return S.members.filter(function (m) { return m.id !== me.id; }); }
    function isAdmin() { return S.chat && (S.chat.kind === "dm" || S.chat.role === "admin"); }

    // ---------- header, pin, request ----------
    function paintHead() {
      var o = others(), c = S.chat;
      var pic = c.kind === "group" ? '<span class="ch-stack">' + av(o[1], 26) + av(o[0], 26) + "</span>" : av(o[0], 38);
      var sub = c.kind === "group" ? S.members.length + " members" : o[0] ? "@" + o[0].username : "";
      root.querySelector(".ch-who").innerHTML = pic + '<span class="ch-who-t"><b translate="no">' + esc(chatName(c, S.members, me.id)) + '</b><span class="faint small" translate="no">' + esc(sub) + "</span></span>" +
        (c.muted ? I("bellOff", "ic-sm ch-muted") : "");
    }
    function pinText(m) { return m.kind === "photo" ? "📷 Photo" : m.kind === "location" ? "Location" : m.kind === "sticker" ? "Sticker" : m.kind === "gif" ? "GIF" : (m.body || ""); }
    function paintPin() {
      var b = root.querySelector(".ch-pin");
      b.classList.toggle("hidden", !S.pinned);
      if (!S.pinned) return;
      b.innerHTML = '<button type="button" class="ch-pin-go" data-ch="pin-go">' + I("pin", "ic-sm") + '<span><b>Pinned</b> <span translate="no">' + esc(pinText(S.pinned)) + "</span></span></button>" +
        (isAdmin() ? '<button type="button" class="icon-btn" data-ch="unpin" aria-label="Unpin">' + I("x", "ic-sm") + "</button>" : "");
    }
    function paintReq() {
      var b = root.querySelector(".ch-req"), c = S.chat, o = others();
      var pendingThem = c.kind === "dm" && o[0] && o[0].status === "request";
      if (c.status === "request") {
        b.innerHTML = "<p><b translate=\"no\">" + esc(chatName(c, S.members, me.id)) + "</b> wants to send you a message. They won't know you've seen it until you accept.</p>" +
          '<div class="ch-req-btns"><button type="button" class="btn btn-primary btn-sm" data-ch="accept">Accept</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-ch="decline">Delete</button>' +
          (c.kind === "dm" ? '<button type="button" class="btn btn-ghost btn-sm" data-ch="report-user">' + I("flag", "ic-sm") + "Report</button>" : "") + "</div>";
      } else if (pendingThem) {
        b.innerHTML = '<p class="faint small">Your messages go to their Message requests until they accept.</p>';
      }
      b.classList.toggle("hidden", !(c.status === "request" || pendingThem));
      form.classList.toggle("hidden", c.status === "request");
    }

    // ---------- messages ----------
    function seenLine() {
      var mine = S.msgs.filter(function (m) { return m.mine && m.kind !== "system" && !m.pending && !m.failed; });
      var last = mine[mine.length - 1];
      if (!last || S.msgs[S.msgs.length - 1] !== last) return { id: null };
      var readers = others().filter(function (m) { return m.status === "active" && m.last_read_at && m.last_read_at >= last.at; });
      var text = S.chat.kind === "dm" ? (readers.length ? "Seen" : "Sent") : (readers.length ? (readers.length === others().length ? "Seen by everyone" : "Seen by " + readers.length) : "Sent");
      return { id: last.id, text: text };
    }
    function reactHtml(m) {
      if (!m.reactions || !m.reactions.length) return "";
      var c = {};
      m.reactions.forEach(function (r) { c[r.emoji] = (c[r.emoji] || 0) + 1; });
      return '<button type="button" class="ch-rx" data-ch="rx">' + Object.keys(c).map(function (e) { return e + (c[e] > 1 ? "<small>" + c[e] + "</small>" : ""); }).join("") + "</button>";
    }
    function bodyHtml(m) {
      if (m.deleted) return '<span class="ch-gone">Message unsent</span>';
      if (m.hidden && !m.mine) return '<span class="ch-gone">Hidden while we review it</span>';
      if (m.kind === "photo") {
        var src = m.localUrl || (m.photo && m.photo.url);
        var ratio = m.photo && m.photo.w && m.photo.h ? m.photo.w / m.photo.h : 1;
        return '<button type="button" class="ch-photo" data-ch="photo-open" style="aspect-ratio:' + Math.max(.6, Math.min(1.8, ratio)) + '">' + (src ? '<img alt="" src="' + esc(src) + '" onerror="this.parentNode.classList.add(\'broken\')">' : I("image")) + '<span class="ch-photo-err">' + I("image") + "<small>Tap to reload</small></span>" + "</button>" +
          (m.body ? '<span class="ch-text" translate="no">' + linkify(m.body) + "</span>" : "");
      }
      if (m.kind === "gif" && m.gif && m.gif.url) {
        var gr = m.gif.w && m.gif.h ? m.gif.w / m.gif.h : 1;
        return '<span class="ch-gif" style="aspect-ratio:' + Math.max(.5, Math.min(2, gr)) + '"><img alt="GIF" loading="lazy" src="' + esc(m.gif.url) + '"><span class="ch-gif-tag">GIF</span></span>';
      }
      if (m.kind === "sticker") {
        var svg = window.TMN_STICKERS ? TMN_STICKERS.svg(m.body, 132) : "";
        return svg ? '<span class="ch-sticker">' + svg + "</span>" : '<span class="ch-sticker missing">Sticker</span>';
      }
      if (m.kind === "location" && m.loc) {
        return '<div class="ch-loc"><span class="ch-loc-pin">' + I("pin") + "</span><span><b>Location</b><span class=\"faint small\" translate=\"no\">" +
          m.loc.lat.toFixed(5) + ", " + m.loc.lng.toFixed(5) + "</span></span></div>" +
          '<div class="ch-loc-btns"><button type="button" class="btn btn-ghost btn-sm" data-ch="map">' + I("map", "ic-sm") + "View map</button>" +
          '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="' + esc(TMN_NATIVE.directionsUrl(m.loc.lat, m.loc.lng)) + '">' + I("nav", "ic-sm") + "Directions</a></div>";
      }
      return '<span class="ch-text" translate="no">' + linkify(m.body || "") + "</span>";
    }
    function msgHtml(m, prev, next, seen) {
      var h = "";
      if (!prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString()) h += '<div class="ch-day">' + day(m.at) + "</div>";
      if (m.kind === "system") return h + '<div class="ch-sys" translate="no">' + esc(m.body || "") + "</div>";
      var u = memberById(m.user_id) || {};
      var first = !prev || prev.user_id !== m.user_id || prev.kind === "system" || (new Date(m.at) - new Date(prev.at)) > 300000;
      var last = !next || next.user_id !== m.user_id || next.kind === "system" || (new Date(next.at) - new Date(m.at)) > 300000;
      var group = S.chat.kind === "group" && !m.mine;
      h += '<div class="ch-row' + (m.mine ? " mine" : "") + (first ? " first" : "") + (last ? " last" : "") + '" data-id="' + esc(m.id || m.client_id) + '">' +
        (group ? '<span class="ch-av">' + (last ? av(u, 28) : "") + "</span>" : "") +
        '<div class="ch-col">' +
          (group && first ? '<span class="ch-name" translate="no">' + esc(u.display_name || u.username || "") + "</span>" : "") +
          '<div class="ch-bubble k-' + m.kind + (m.pending ? " pending" : "") + (m.failed ? " failed" : "") + (m.hidden && m.mine ? " under-review" : "") + '" data-ch="msg" title="' + esc(time(m.at)) + '">' +
            bodyHtml(m) + "</div>" + reactHtml(m) +
          (m.failed ? '<button type="button" class="ch-retry" data-ch="retry">Not sent · Tap to retry</button>' : "") +
          (m.hidden && m.mine ? '<span class="ch-meta">Under review</span>' : "") +
          (seen.id && seen.id === m.id ? '<span class="ch-meta">' + seen.text + " · " + time(m.at) + "</span>" : "") +
        "</div>" +
        '<button type="button" class="icon-btn ch-more" data-ch="msg" aria-label="Message options">' + I("more", "ic-sm") + "</button>" +
      "</div>";
      return h;
    }
    function render(keepScroll) {
      var atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      var prevH = list.scrollHeight, prevTop = list.scrollTop;
      var seen = seenLine();
      var html = (S.more ? '<div class="ch-older"><button type="button" class="btn btn-ghost btn-sm" data-ch="older">Load older</button></div>' : "") +
        (S.msgs.length ? S.msgs.map(function (m, i) { return msgHtml(m, S.msgs[i - 1], S.msgs[i + 1], seen); }).join("")
          : '<div class="ch-empty faint small">Say hi 👋</div>');
      if (html === S.lastHtml && keepScroll !== "top") return; // walang nagbago → huwag galawin (iwas kurap ng photo)
      S.lastHtml = html;
      list.innerHTML = html;
      if (keepScroll === "top") list.scrollTop = list.scrollHeight - prevH + prevTop;
      else if (atBottom || keepScroll === "bottom") list.scrollTop = list.scrollHeight;
    }
    function find(key) { return S.msgs.filter(function (m) { return m.id === key || m.client_id === key; })[0]; }

    // ---------- load / refresh ----------
    async function load() {
      try {
        var r = await TMN_API.call("messages", "open", { id: id });
        if (S.dead) return;
        S.chat = r.chat; S.members = r.members; S.pinned = r.pinned; S.more = r.more;
        // Pagsamahin: palitan ang luma, idagdag ang bago, ingatan ang mga hindi pa naipapadala
        var byId = {}, now = Date.now();
        S.msgs.forEach(function (m) { if (m.id) byId[m.id] = m; });
        r.messages.forEach(function (m) {
          // Huwag palitan ang link ng photo bawat refresh (bagong link = reload = blangko); bago lang pag malapit nang mag-expire
          var old = byId[m.id];
          if (m.photo && m.photo.url && old && old.photo && old.photo.url && old.urlAt && now - old.urlAt < 45 * 60000) { m.photo.url = old.photo.url; m.urlAt = old.urlAt; }
          else if (m.photo && m.photo.url) m.urlAt = now;
          if (old && old.localUrl) m.localUrl = old.localUrl;
          byId[m.id] = m;
        });
        var pend = S.msgs.filter(function (m) { return (m.pending || m.failed) && !r.messages.some(function (x) { return x.client_id && x.client_id === m.client_id; }); });
        S.msgs = Object.keys(byId).map(function (k) { return byId[k]; }).concat(pend).sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
        paintHead(); paintPin(); paintReq(); render(S.first ? null : "bottom"); S.first = true;
        if (!rt) startLive();
        if (opts.onChange) opts.onChange();
      } catch (e) {
        if (!S.chat) list.innerHTML = '<div class="ch-empty faint small">' + esc(e.message) + "</div>";
      }
    }
    var refreshT = null;
    function refresh() {
      if (document.visibilityState !== "visible") { S.pendingRefresh = true; return; }
      clearTimeout(refreshT);
      refreshT = setTimeout(load, 120);
    }
    var softAt = 0;
    function refreshSoon() { var wait = Math.max(120, 3000 - (Date.now() - softAt)); softAt = Date.now() + wait; clearTimeout(refreshT); refreshT = setTimeout(load, wait); }
    async function older() {
      var first = S.msgs.filter(function (m) { return m.id; })[0]; if (!first) return;
      var r = await TMN_API.call("messages", "open", { id: id, before: first.at });
      S.msgs = r.messages.concat(S.msgs); S.more = r.more;
      render("top");
    }

    // ---------- real-time ----------
    function showTyping() {
      var now = Date.now(), names = [];
      Object.keys(S.typing).forEach(function (uid) { if (S.typing[uid] > now) { var u = memberById(uid); if (u) names.push(u.display_name || u.username); } else delete S.typing[uid]; });
      var t = root.querySelector(".ch-typing");
      t.classList.toggle("hidden", !names.length);
      t.innerHTML = names.length ? '<span class="ch-dots"><i></i><i></i><i></i></span><span translate="no">' + esc(names.join(", ")) + "</span> " + (names.length > 1 ? "are typing…" : "is typing…") : "";
    }
    function startLive() {
      if (window.TMN_RT && S.chat.channel) {
        rt = TMN_RT.join(S.chat.channel, function (ev, p) {
          if (ev === "typing") { if (p.user_id !== me.id) { S.typing[p.user_id] = Date.now() + 5000; showTyping(); setTimeout(showTyping, 5200); } return; }
          if (ev === "read") { if (p.user_id === me.id) return; return refreshSoon(); } // Seen lang ang magbabago
          if (ev === "msg" && p.user_id) { delete S.typing[p.user_id]; showTyping(); }
          refresh();
        });
      }
      (function tick() {
        poll = setTimeout(function () { if (document.visibilityState === "visible") load(); tick(); }, window.TMN_RT && TMN_RT.connected() ? POLL_SLOW : POLL_FAST);
      })();
    }
    function onVisible() { if (document.visibilityState === "visible" && S.pendingRefresh) { S.pendingRefresh = false; load(); } }
    document.addEventListener("visibilitychange", onVisible);
    function onPush(e) { if (e.data && e.data.type === "tmn-push" && e.data.data && e.data.data.id === id) refresh(); }
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", onPush);

    // ---------- send ----------
    async function deliver(m) {
      m.pending = true; m.failed = false; render("bottom");
      try {
        var data = { id: id, client_id: m.client_id, kind: m.kind, body: m.body || "" };
        if (m.kind === "gif" && m.gif) { data.w = m.gif.w; data.h = m.gif.h; }
        if (m.kind === "photo") {
          if (!m.path) {
            var up = await TMN_API.call("messages", "upload", { id: id, size: m.file.size, mime: m.file.mime });
            var res = await fetch(up.url, { method: "PUT", headers: { "content-type": m.file.mime }, body: m.file.blob });
            if (!res.ok) throw new Error("Upload failed. Please try again.");
            m.path = up.path;
          }
          Object.assign(data, { path: m.path, w: m.file.w, h: m.file.h });
        }
        if (m.kind === "location") Object.assign(data, { lat: m.loc.lat, lng: m.loc.lng });
        var r = await TMN_API.call("messages", "send", data);
        var i = S.msgs.indexOf(m);
        if (r.message.photo && m.localUrl) r.message.localUrl = m.localUrl;
        if (i > -1) S.msgs[i] = r.message;
        if (S.chat.status === "request") { S.chat.status = "active"; paintReq(); }
        render("bottom");
        if (opts.onChange) opts.onChange();
      } catch (e) {
        m.pending = false; m.failed = true; render();
        UI.toast(e.message, e.data && e.data.blocked ? 5000 : 2600);
        if (e.data && e.data.blocked) { S.msgs.splice(S.msgs.indexOf(m), 1); render(); if (m.kind === "text") { input.value = m.body; input.dispatchEvent(new Event("input")); } }
      }
    }
    function queue(m) {
      m.client_id = cid(); m.at = new Date().toISOString(); m.mine = true; m.user_id = me.id; m.reactions = [];
      S.msgs.push(m); deliver(m);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim(); if (!text) return;
      if (window.TMN_GUARD && !TMN_GUARD.ok(text)) return;
      input.value = ""; grow();
      queue({ kind: "text", body: text });
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && window.matchMedia("(min-width: 900px)").matches) { e.preventDefault(); form.requestSubmit(); }
    });
    function grow() { input.style.height = "auto"; input.style.height = Math.min(140, input.scrollHeight) + "px"; }
    input.addEventListener("input", function () {
      grow();
      if (rt && Date.now() - typingSent > 3000 && input.value.trim()) { typingSent = Date.now(); rt.send("typing", { user_id: me.id }); }
    });
    fileIn.addEventListener("change", async function () {
      var f = fileIn.files && fileIn.files[0]; fileIn.value = "";
      if (!f) return;
      try {
        var c = window.TMN_POSTQ ? await TMN_POSTQ._compressPhoto(f) : { blob: f, mime: f.type, w: 0, h: 0, size: f.size };
        queue({ kind: "photo", file: c, localUrl: URL.createObjectURL(c.blob), photo: { w: c.w, h: c.h } });
      } catch (e) { UI.toast("Couldn't open that photo."); }
    });
    async function sendLocation() {
      var b = root.querySelector('[data-ch="loc"]'); b.disabled = true;
      try {
        var p = await TMN_NATIVE.getLocation({ timeout: 15000 });
        b.disabled = false;
        var ok = await TMN_MODAL.confirm("Send your current location to this chat?" + (p.acc ? " (about " + Math.round(p.acc) + " m)" : ""), { okText: "Send location" });
        if (ok) queue({ kind: "location", loc: { lat: p.lat, lng: p.lng } });
      } catch (e) { b.disabled = false; UI.toast(e.message || "Couldn't get your location."); }
    }

    // ---------- message options ----------
    function msgSheet(m) {
      var body = document.createElement("div");
      body.className = "ch-sheet";
      var mineRx = (m.reactions || []).filter(function (r) { return r.user_id === me.id; })[0];
      var canPin = S.chat.status === "active" && isAdmin() && !m.deleted;
      var isPinned = S.pinned && S.pinned.id === m.id;
      body.innerHTML =
        (m.deleted ? "" : '<div class="ch-emojis">' + EMOJIS.map(function (e) { return '<button type="button" data-e="' + e + '"' + (mineRx && mineRx.emoji === e ? ' aria-pressed="true"' : "") + ">" + e + "</button>"; }).join("") +
          (window.TMN_EMOJI_PICK ? '<button type="button" class="ch-more-rx" data-more-rx aria-label="More emoji">' + I("plus") + "</button>" : "") + "</div>") +
        '<div class="ch-acts">' +
          (canPin ? '<button type="button" class="btn btn-ghost btn-block" data-a="pin">' + I("pin", "ic-sm") + (isPinned ? "Unpin" : "Pin") + "</button>" : "") +
          (m.kind === "text" && m.body ? '<button type="button" class="btn btn-ghost btn-block" data-a="copy">' + I("edit", "ic-sm") + "Copy text</button>" : "") +
          (m.mine && !m.deleted ? '<button type="button" class="btn btn-danger btn-block" data-a="unsend">' + I("trash", "ic-sm") + "Unsend</button>" : "") +
          (!m.mine && !m.deleted ? '<button type="button" class="btn btn-ghost btn-block" data-a="report">' + I("flag", "ic-sm") + "Report message</button>" : "") +
        "</div>" +
        '<p class="faint small center">' + new Date(m.at).toLocaleString(loc(), { dateStyle: "medium", timeStyle: "short" }) + "</p>";
      var sheet = TMN_MODAL.open({ title: "", size: "sm", cls: "modal-sheet", body: body });
      body.addEventListener("click", async function (e) {
        var eb = e.target.closest("[data-e]"), ab = e.target.closest("[data-a]"), more = e.target.closest("[data-more-rx]");
        if (more) {
          // Kahit anong emoji (pati pinakabago) bilang reaction
          TMN_EMOJI_PICK.open(more, { closeOnPick: true, onEmoji: async function (em) {
            sheet.close();
            try { var r2 = await TMN_API.call("messages", "react", { message_id: m.id, emoji: em }); Object.assign(m, { reactions: r2.message.reactions }); render(); }
            catch (err) { UI.toast(err.message); }
          } });
          return;
        }
        try {
          if (eb) {
            var emoji = mineRx && mineRx.emoji === eb.dataset.e ? null : eb.dataset.e;
            sheet.close();
            var r = await TMN_API.call("messages", "react", { message_id: m.id, emoji: emoji });
            Object.assign(m, { reactions: r.message.reactions }); render();
          } else if (ab) {
            sheet.close();
            var a = ab.dataset.a;
            if (a === "pin") { await TMN_API.call("messages", "pin", { id: id, message_id: isPinned ? null : m.id }); load(); }
            if (a === "copy") { try { await navigator.clipboard.writeText(m.body); UI.toast("Copied."); } catch (err) {} }
            if (a === "unsend" && (await TMN_MODAL.confirm("Unsend this message? It will be removed for everyone.", { okText: "Unsend", danger: true }))) {
              await TMN_API.call("messages", "unsend", { message_id: m.id }); load();
            }
            if (a === "report" && window.TMN_SOCIAL) TMN_SOCIAL.reportSheet("message", m.id, "message");
          }
        } catch (err) { UI.toast(err.message); }
      });
    }
    function openMap(m) {
      var box = document.createElement("div");
      box.className = "ch-map";
      TMN_MODAL.open({ title: "Location", size: "md", cls: "modal-sheet", body: box });
      if (!window.TMN_MAP) { box.innerHTML = '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(TMN_NATIVE.directionsUrl(m.loc.lat, m.loc.lng)) + '">Open in Maps</a>'; return; }
      TMN_MAP.create(box).then(function (map) {
        var u = memberById(m.user_id) || {};
        map.set([{ id: m.id, lat: m.loc.lat, lng: m.loc.lng, user: u, label: u.display_name || u.username || "" }]);
        map.focus(m.id);
      }).catch(function (e) { box.innerHTML = '<p class="faint small">' + esc(e.message) + "</p>"; });
    }

    // ---------- chat settings ----------
    function menu() {
      var c = S.chat, o = others();
      var body = document.createElement("div");
      body.className = "ch-sheet";
      var h = '<div class="ch-acts">';
      if (c.kind === "dm" && o[0]) h += '<button type="button" class="btn btn-ghost btn-block" data-m="profile">' + I("user", "ic-sm") + "View profile</button>";
      if (c.kind === "group") {
        h += '<div class="ch-members">' + S.members.map(function (u) {
          return '<div class="ch-mem">' + av(u, 34) + '<span><b translate="no">' + esc(u.display_name || u.username) + "</b>" +
            '<span class="faint small">' + (u.role === "admin" ? "Admin" : u.status === "request" ? "Invited" : "Member") + "</span></span>" +
            (isAdmin() && u.id !== me.id ? '<button type="button" class="btn btn-ghost btn-sm" data-m="remove" data-uid="' + esc(u.id) + '">Remove</button>' : "") + "</div>";
        }).join("") + "</div>";
        if (isAdmin()) h += '<button type="button" class="btn btn-ghost btn-block" data-m="add">' + I("userPlus", "ic-sm") + "Add people</button>";
        h += '<button type="button" class="btn btn-ghost btn-block" data-m="rename">' + I("edit", "ic-sm") + "Rename group</button>";
      }
      h += '<button type="button" class="btn btn-ghost btn-block" data-m="mute">' + I("bell", "ic-sm") + (c.muted ? "Unmute notifications" : "Mute notifications") + "</button>";
      if (c.kind === "dm" && o[0]) h += '<button type="button" class="btn btn-ghost btn-block" data-m="report">' + I("flag", "ic-sm") + "Report account</button>";
      if (c.kind === "group") h += '<button type="button" class="btn btn-danger btn-block" data-m="leave">' + I("logout", "ic-sm") + "Leave group</button>";
      body.innerHTML = h + "</div>";
      var sheet = TMN_MODAL.open({ title: c.kind === "group" ? chatName(c, S.members, me.id) : "Chat", size: "sm", cls: "modal-sheet", body: body });
      body.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-m]"); if (!b) return;
        var a = b.dataset.m;
        try {
          if (a === "profile") { sheet.close(); if (window.TMN_SOCIAL) TMN_SOCIAL.userSheet(o[0].id); }
          if (a === "report") { sheet.close(); TMN_SOCIAL.reportSheet("user", o[0].id, "account"); }
          if (a === "mute") { await TMN_API.call("messages", "mute", { id: id, on: !c.muted }); c.muted = !c.muted; sheet.close(); paintHead(); UI.toast(c.muted ? "Muted." : "Unmuted."); }
          if (a === "rename") {
            var t = await TMN_MODAL.prompt("Group name", { value: c.title || "" });
            if (t) { await TMN_API.call("messages", "rename", { id: id, title: t }); sheet.close(); load(); }
          }
          if (a === "add") {
            sheet.close();
            TMN_CHAT_NEW.pick({ title: "Add people", exclude: S.members.map(function (u) { return u.id; }), okText: "Add", onDone: async function (ids) {
              await TMN_API.call("messages", "addMembers", { id: id, user_ids: ids }); load();
            } });
          }
          if (a === "remove" && (await TMN_MODAL.confirm("Remove this person from the group?", { okText: "Remove", danger: true }))) {
            await TMN_API.call("messages", "removeMember", { id: id, user_id: b.dataset.uid }); sheet.close(); load();
          }
          if (a === "leave" && (await TMN_MODAL.confirm("Leave this group? You won't get its messages anymore.", { okText: "Leave", danger: true }))) {
            await TMN_API.call("messages", "leave", { id: id }); sheet.close(); if (opts.onChange) opts.onChange(true); if (opts.onBack) opts.onBack();
          }
        } catch (err) { UI.toast(err.message); }
      });
    }

    // ---------- clicks ----------
    root.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-ch]"); if (!b) return;
      var a = b.dataset.ch, row = b.closest("[data-id]"), m = row ? find(row.dataset.id) : null;
      try {
        if (a === "photo") fileIn.click();
        else if (a === "emoji") {
          if (b.getAttribute("aria-expanded") === "true") { TMN_EMOJI_PICK.close(); return; }
          TMN_EMOJI_PICK.open(b, { stickers: S.chat && S.chat.status !== "request", onEmoji: function (em) { TMN_EMOJI_PICK.insert(input, em); },
            onSticker: function (sid) { queue({ kind: "sticker", body: sid }); },
            gifs: !!(window.TMN_CONFIG && TMN_CONFIG.fn && TMN_CONFIG.fn.gifs),
            onGif: function (g) { queue({ kind: "gif", body: g.full.url, gif: g.full }); } });
        }
        else if (a === "loc") sendLocation();
        else if (a === "menu" || a === "who") { if (a === "who" && S.chat.kind === "dm" && others()[0] && window.TMN_SOCIAL) TMN_SOCIAL.userSheet(others()[0].id); else menu(); }
        else if (a === "older") older();
        else if (a === "retry" && m) deliver(m);
        else if (a === "map" && m) openMap(m);
        else if (a === "photo-open" && m) {
          if (b.classList.contains("broken")) { m.urlAt = 0; S.lastHtml = null; load(); return; } // kumuha ng bagong link
          var src = m.localUrl || (m.photo && m.photo.url);
          if (src) {
            var pv = document.createElement("div"), im = new Image();
            pv.className = "ch-viewer-box"; im.alt = ""; im.src = src;
            im.onerror = function () { pv.innerHTML = '<p class="faint small">Couldn\'t load the photo. Close and tap it again.</p>'; };
            pv.appendChild(im);
            TMN_MODAL.open({ title: "Photo", size: "lg", cls: "modal-sheet ch-viewer", body: pv });
          }
        }
        else if ((a === "msg" || a === "rx") && m && m.id && m.kind !== "system" && !m.pending) msgSheet(m);
        else if (a === "pin-go" && S.pinned) {
          var r2 = list.querySelector('[data-id="' + S.pinned.id + '"]');
          if (r2) { r2.scrollIntoView({ block: "center", behavior: "smooth" }); r2.classList.add("flash"); setTimeout(function () { r2.classList.remove("flash"); }, 1600); }
          else if (S.pinned.loc) openMap(S.pinned);
        }
        else if (a === "unpin") { await TMN_API.call("messages", "pin", { id: id, message_id: null }); load(); }
        else if (a === "accept") { await TMN_API.call("messages", "accept", { id: id }); S.chat.status = "active"; paintReq(); if (opts.onChange) opts.onChange(); }
        else if (a === "decline" && (await TMN_MODAL.confirm("Delete this message request?", { okText: "Delete", danger: true }))) {
          await TMN_API.call("messages", "decline", { id: id }); if (opts.onChange) opts.onChange(true); if (opts.onBack) opts.onBack();
        }
        else if (a === "report-user") TMN_SOCIAL.reportSheet("user", others()[0].id, "account");
      } catch (err) { UI.toast(err.message); }
    });
    list.addEventListener("contextmenu", function (e) {
      var row = e.target.closest("[data-id]"); if (!row) return;
      var m = find(row.dataset.id); if (!m || !m.id || m.kind === "system") return;
      e.preventDefault(); msgSheet(m);
    });

    load();
    return {
      destroy: function () {
        S.dead = true; clearTimeout(poll); clearTimeout(refreshT); clearTimeout(typingTimer);
        if (rt) rt.leave();
        document.removeEventListener("visibilitychange", onVisible);
        if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", onPush);
      },
      id: id
    };
  }

  window.TMN_CHAT = { mount: mount, chatName: chatName };
})();
