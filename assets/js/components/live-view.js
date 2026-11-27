/* TigoMeNote · components/live-view.js — 🔴 Live (Explore): ibahagi ang live mo at manood
   Ang video ay nasa YouTube / Twitch / Facebook / TikTok (libre — sila ang nagpapadala ng video). Dito: player nila, chat at ❤️.
   0.11.62: tinanggal ang sariling camera live (Cloudflare) — link na lang.
   Chat (dumadaan sa moderation sa server) at ❤️ / bilang ng nanonood sa Supabase Realtime (lihim na channel ng live).
   TMN_LIVE.host()       → "Go live": ipaste ang link ng live mo
   TMN_LIVE.watch(id)    → manood ng live
   TMN_LIVE.list()       → Promise<{ lives }> (para sa "Live now" sa Explore) */
(function () {
  var UI = window.TMN_UI, C = window.TMN_CONFIG, esc = UI.esc;
  var V = "?v=" + encodeURIComponent(C.version || ""), base = (C.root || "/") + "assets/";
  var cur = null;
  var PLAT = { youtube: "YouTube", twitch: "Twitch", facebook: "Facebook", tiktok: "TikTok" };

  function rt() {
    if (window.TMN_RT) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = base + "js/realtime.js" + V; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  function me() { var u = {}; try { u = JSON.parse(sessionStorage.getItem("tmnUser") || localStorage.getItem("tmnUser") || "{}"); } catch (e) {} return u; }
  function avatar(u, size) {
    u = u || {};
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : String(n); }

  // ---------- screen ng live ----------
  function mount() {
    var el = document.createElement("div");
    el.className = "lv-ov is-link";
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Live");
    el.innerHTML =
      '<div class="lv-top"><div class="lv-who"></div><span class="lv-badge hidden">LIVE</span><span class="lv-count hidden" aria-live="polite"></span>' +
      '<button type="button" class="lv-x" data-lv="close" aria-label="Close">✕</button></div>' +
      '<div class="lv-hearts" aria-hidden="true"></div>' +
      '<div class="lv-mid"></div>' +
      '<div class="lv-chat" aria-live="polite"></div>' +
      '<div class="lv-bot"></div>';
    document.body.appendChild(el); document.body.classList.add("in-live");
    return el;
  }
  function close() {
    var c = cur; if (!c) return; cur = null;
    clearInterval(c.tallyT); clearInterval(c.hiT);
    if (c.ch) { try { c.ch.leave(); } catch (e) {} }
    c.el.remove(); document.body.classList.remove("in-live");
  }
  function chatLine(m) {
    var c = cur; if (!c) return;
    var box = c.el.querySelector(".lv-chat"), d = document.createElement("div");
    d.className = "lv-line";
    d.innerHTML = avatar(m.user, 24) + '<p><b translate="no">' + esc((m.user && (m.user.display_name || "@" + m.user.username)) || "") + "</b> " + esc(m.text) + "</p>";
    box.appendChild(d);
    while (box.children.length > 40) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  function heart() {
    var c = cur; if (!c) return;
    var h = document.createElement("span"); h.className = "lv-heart"; h.textContent = ["❤️", "💖", "💜", "🧡"][Math.floor(Math.random() * 4)];
    h.style.setProperty("--dx", (Math.random() * 40 - 20) + "px");
    c.el.querySelector(".lv-hearts").appendChild(h); setTimeout(function () { h.remove(); }, 2200);
  }
  function chatBox() {
    return '<form class="lv-say" data-lv-form><input class="lv-in" maxlength="200" placeholder="Say something…" aria-label="Chat message" autocomplete="off"><button type="submit" class="lv-send" aria-label="Send">➤</button></form>';
  }
  async function send(form) {
    var c = cur, inp = form.querySelector(".lv-in"), t = inp.value.trim(); if (!c || !t || !c.live) return;
    inp.value = "";
    try { var r = await TMN_API.call("live", "say", { id: c.live.id, text: t }); c.seen[r.msg.id] = 1; chatLine(r.msg); }
    catch (e) { UI.toast(e.message || "Couldn't send."); inp.value = t; }
  }
  function onRt(ev, p) {
    var c = cur; if (!c) return;
    if (ev === "chat" && p && !c.seen[p.id]) { c.seen[p.id] = 1; chatLine(p); }
    else if (ev === "heart") heart();
    else if (ev === "hi" && p && p.u) c.viewers[p.u] = Date.now();
    else if (ev === "end" && !(c.live && c.live.mine)) ended();
  }
  function count(n) { var c = cur; if (!c) return; var e = c.el.querySelector(".lv-count"); e.classList.remove("hidden"); e.textContent = "👁 " + fmt(n || 0); }

  // ---------- 🔴 ibahagi ang live: ipaste ang link ----------
  async function host() {
    if (cur) return;
    var st;
    try { st = await TMN_API.call("live", "status", {}); } catch (e) { UI.toast(e.message || "Couldn't open Live."); return; }
    if (!st.can_live) { UI.toast("Going live is for 18+ accounts. You can still watch lives.", 4500); return; }
    var f = document.createElement("form");
    f.className = "lv-link";
    f.innerHTML =
      '<p class="muted small">Start your live in the YouTube, TikTok, Facebook or Twitch app first. Then tap <b>Share → Copy link</b> there and paste it here. Your followers will see it in <b>Live now</b>.</p>' +
      '<div class="lv-plats" aria-hidden="true"><span>▶️ YouTube</span><span>🎵 TikTok</span><span>📘 Facebook</span><span>🟣 Twitch</span></div>' +
      '<label class="field"><span>Link of your live</span><input class="input" name="link" type="url" inputmode="url" required placeholder="https://youtu.be/…" autocomplete="off"></label>' +
      '<label class="field"><span>Title (optional)</span><input class="input" name="title" maxlength="80" placeholder="What\'s your live about?"></label>' +
      '<button type="submit" class="btn btn-primary btn-block lv-share">🔴 Share my live</button>';
    var m = TMN_MODAL.open({ title: "Go live", size: "sm", cls: "modal-sheet", body: f });
    f.addEventListener("submit", async function (e) {
      e.preventDefault();
      var b = f.querySelector(".lv-share"); b.disabled = true;
      try {
        var r = await TMN_API.call("live", "start", { link: f.link.value.trim(), title: f.title.value.trim() });
        m.close();
        UI.toast("You're live on Explore! Your followers can watch here 🎉", 4000);
        document.dispatchEvent(new CustomEvent("tmn:live-changed"));
        watch(r.live.id);
      } catch (err) { b.disabled = false; UI.toast(err.message || "Couldn't share the live.", 4500); }
    });
    setTimeout(function () { try { f.link.focus(); } catch (e) {} }, 60);
  }

  // ---------- player ng platform (opisyal na embed; buo ang ads at logo nila) ----------
  function embedSrc(l) {
    var host = location.hostname || "localhost", mute = l.mine;
    if (l.platform === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(l.embed || "")) return "https://www.youtube-nocookie.com/embed/" + l.embed + "?autoplay=1&playsinline=1&rel=0" + (mute ? "&mute=1" : "");
    if (l.platform === "twitch" && /^[a-z0-9_]{3,25}$/.test(l.embed || "")) return "https://player.twitch.tv/?channel=" + l.embed + "&parent=" + encodeURIComponent(host) + "&autoplay=true" + (mute ? "&muted=true" : "");
    if (l.platform === "facebook" && /^https:\/\/(www\.facebook\.com|fb\.watch)\//.test(l.embed || "")) return "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(l.embed) + "&show_text=false&autoplay=true" + (mute ? "&muted=true" : "");
    return "";   // TikTok: walang player na puwedeng ilagay — bubuksan sa TikTok
  }
  function player(c, l) {
    var mid = c.el.querySelector(".lv-mid"), src = embedSrc(l), name = PLAT[l.platform] || "the app", u = l.user || {};
    var open = /^https:\/\//.test(l.link || "") ? l.link : "";
    mid.innerHTML = src
      ? '<iframe class="lv-frame" src="' + esc(src) + '" title="Live on ' + esc(name) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
      : '<div class="lv-card">' + avatar(u, 84) + '<p><b translate="no">' + esc(u.display_name || "@" + u.username) + "</b> is live on " + esc(name) + "</p>" + (l.title ? '<p class="lv-card-t">' + esc(l.title) + "</p>" : "") +
        (open ? '<a class="btn lv-open-big" href="' + esc(open) + '" target="_blank" rel="noopener noreferrer">Watch on ' + esc(name) + "</a>" : "") + "</div>";
    if (open && src) {
      var a = document.createElement("a"); a.className = "lv-open"; a.href = open; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Open in " + name + " ↗";
      c.el.querySelector(".lv-top").insertBefore(a, c.el.querySelector(".lv-x"));
    }
  }

  // ---------- 👀 manood: player nila + chat at ❤️ dito; bilang ng nanonood = mga "hi" (kasama ang sarili) ----------
  async function watch(id) {
    if (cur) return;
    cur = { seen: {}, viewers: {} };
    var c = cur; c.el = mount();
    c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">Opening…</p>';
    try {
      var r = await TMN_API.call("live", "watch", { id: id }, { timeout: 20000 });
      if (cur !== c) return;
      var l = c.live = r.live, u = l.user || {};
      c.el.querySelector(".lv-who").innerHTML = avatar(u, 34) + '<span><b translate="no">' + esc(u.display_name || "@" + u.username) + "</b>" + (l.title ? "<small>" + esc(l.title) + "</small>" : "<small>on " + esc(PLAT[l.platform] || "") + "</small>") + "</span>";
      c.el.querySelector(".lv-badge").classList.remove("hidden"); count(1);
      player(c, l);
      await rt(); if (cur !== c) return;
      c.ch = TMN_RT.join(l.channel, onRt);
      var hi = function () { if (c.ch) c.ch.send("hi", { u: me().id || "x" }); };
      var tally = function () { var now = Date.now(), n = 1; Object.keys(c.viewers).forEach(function (k) { if (now - c.viewers[k] < 70000) n++; else delete c.viewers[k]; }); count(n); };
      setTimeout(hi, 500); c.hiT = setInterval(function () { hi(); tally(); }, 30000); c.tallyT = setInterval(tally, 5000);
      c.el.querySelector(".lv-bot").innerHTML = chatBox() + '<button type="button" class="lv-round" data-lv="heart" aria-label="Send a heart">❤️</button>' +
        (l.mine ? '<button type="button" class="btn lv-end" data-lv="end">End</button>' : "");
    } catch (e) {
      if (cur !== c) return;
      c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">' + esc(e.status === 410 ? "This live has ended." : e.message || "Couldn't open the live.") + "</p>";
    }
  }
  function ended() {
    var c = cur; if (!c) return;
    c.el.classList.add("is-ended"); c.el.querySelector(".lv-badge").textContent = "ENDED";
    c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">The live has ended. Thanks for watching 💛</p>';
    c.el.querySelector(".lv-bot").innerHTML = "";
  }

  // ---------- mga pindot ----------
  document.addEventListener("click", function (e) {
    var c = cur; if (!c) return;
    var b = e.target.closest && e.target.closest("[data-lv]"); if (!b || !c.el.contains(b)) return;
    var a = b.dataset.lv;
    if (a === "close") close();
    else if (a === "end") {
      TMN_MODAL.confirm("End your live on TigoMeNote? (Stop it in " + (PLAT[c.live.platform] || "the other app") + " too.)", { okText: "End live", danger: true }).then(function (ok) {
        if (!ok || cur !== c) return;
        TMN_API.call("live", "end", { id: c.live.id }).catch(function () {});
        close(); UI.toast("Live ended"); document.dispatchEvent(new CustomEvent("tmn:live-changed"));
      });
    }
    else if (a === "heart") { heart(); if (c.ch) c.ch.send("heart", {}); }
  });
  document.addEventListener("submit", function (e) { if (cur && e.target.matches && e.target.matches("[data-lv-form]")) { e.preventDefault(); send(e.target); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && !document.querySelector(".modal-backdrop")) close(); });

  window.TMN_LIVE = {
    host: host, watch: watch,
    list: function () { return TMN_API.call("live", "list", {}, { timeout: 15000 }); },
    active: function () { return !!cur; },
  };
})();
