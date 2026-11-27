/* TigoMeNote · components/live-view.js — 🔴 Live (Explore): mag-live at manood
   Video: Cloudflare Realtime (SFU) sa pamamagitan ng live-fast — isang upload lang ang nagla-live, ang Cloudflare ang nagpapadala sa mga nanonood.
   Magaan pero malinaw: 720p, 24 fps, hanggang ~1.2 Mbps (camera) · 1080p/15 fps hanggang ~1.8 Mbps (screen sa computer).
   Chat (dumadaan sa moderation sa server) at ❤️ / bilang ng nanonood sa Supabase Realtime (lihim na channel ng live).
   0.11.61: Live gamit ang link ng YouTube / Twitch / Facebook / TikTok — libre (sila ang nagpapadala ng video); dito ang player, chat at ❤️.
     Ang sariling camera (Cloudflare) ay lumalabas lang kapag naka-setup ang keys (status.ready).
   TMN_LIVE.host()       → "Go live": ipaste ang link (at camera kung naka-setup)
   TMN_LIVE.watch(id)    → manood ng live
   TMN_LIVE.list()       → Promise<{ ready, lives }> (para sa "Live now" sa Explore) */
(function () {
  var UI = window.TMN_UI, C = window.TMN_CONFIG, esc = UI.esc;
  var V = "?v=" + encodeURIComponent(C.version || ""), base = (C.root || "/") + "assets/";
  var cur = null;
  var MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);

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
  function mmss(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); }

  // ---------- overlay ----------
  function mount(kind) {
    var el = document.createElement("div");
    el.className = "lv-ov lv-" + kind;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", kind === "host" ? "Go live" : "Live");
    el.innerHTML =
      '<video class="lv-video" playsinline autoplay muted></video>' +
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
    clearInterval(c.beatT); clearInterval(c.hiT); clearInterval(c.clock);
    if (c.ch) { try { c.ch.leave(); } catch (e) {} }
    if (c.pc) { try { c.pc.close(); } catch (e) {} }
    (c.tracks || []).forEach(function (t) { try { t.stop(); } catch (e) {} });
    if (c.actx) { try { c.actx.close(); } catch (e) {} }
    c.el.remove(); document.body.classList.remove("in-live");
    window.removeEventListener("beforeunload", guard);
    try { if (window.TMNNative && TMNNative.setInCall) TMNNative.setInCall(false); } catch (e) {}
  }
  function guard(e) { if (cur && cur.kind === "host" && cur.live) { e.preventDefault(); e.returnValue = ""; } }
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
    try { var r = await TMN_API.call("live", "say", { id: c.live.id, text: t }); if (c.kind === "host") chatLine(r.msg); else chatLine(r.msg); c.seen[r.msg.id] = 1; }
    catch (e) { UI.toast(e.message || "Couldn't send."); inp.value = t; }
  }
  function onRt(ev, p) {
    var c = cur; if (!c) return;
    if (ev === "chat" && p && !c.seen[p.id]) { c.seen[p.id] = 1; chatLine(p); }
    else if (ev === "heart") heart();
    else if (ev === "hi" && (c.kind === "host" || c.link) && p && p.u) c.viewers[p.u] = Date.now();
    else if (ev === "count" && c.kind === "watch" && !c.link) count(p && p.n);
    else if (ev === "end" && c.kind === "watch") { if (c.link && c.live && c.live.mine) return; ended(); }
  }
  function count(n) { var c = cur; if (!c) return; var e = c.el.querySelector(".lv-count"); e.classList.remove("hidden"); e.textContent = "👁 " + fmt(n || 0); }

  // ---------- 🔴 mag-live ----------
  async function host() {
    if (cur) return;
    if (!window.RTCPeerConnection || !navigator.mediaDevices) { UI.toast("Live doesn't work in this browser. Try Chrome, Edge or Safari."); return; }
    var st;
    try { st = await TMN_API.call("live", "status", {}); } catch (e) { UI.toast(e.message || "Couldn't open Live."); return; }
    if (!st.can_live) { UI.toast("Going live is for 18+ accounts. You can still watch lives.", 4500); return; }
    linkSheet(st);
  }
  // ---------- 🔗 live sa ibang platform: ipaste ang link ----------
  var PLAT = { youtube: "YouTube", twitch: "Twitch", facebook: "Facebook", tiktok: "TikTok" };
  function linkSheet(st) {
    var f = document.createElement("form");
    f.className = "lv-link";
    f.innerHTML =
      '<p class="muted small">Start your live in the YouTube, TikTok, Facebook or Twitch app first. Then tap <b>Share → Copy link</b> there and paste it here. Your followers will see it in <b>Live now</b>.</p>' +
      '<div class="lv-plats" aria-hidden="true"><span>▶️ YouTube</span><span>🎵 TikTok</span><span>📘 Facebook</span><span>🟣 Twitch</span></div>' +
      '<label class="field"><span>Link of your live</span><input class="input" name="link" type="url" inputmode="url" required placeholder="https://youtu.be/…" autocomplete="off"></label>' +
      '<label class="field"><span>Title (optional)</span><input class="input" name="title" maxlength="80" placeholder="What\'s your live about?"></label>' +
      '<button type="submit" class="btn btn-primary btn-block lv-share">🔴 Share my live</button>' +
      (st.ready && navigator.mediaDevices ? '<button type="button" class="btn btn-ghost btn-block" data-lvcam="1">📷 Go live with my camera instead</button>' : "");
    var m = TMN_MODAL.open({ title: "Go live", size: "sm", cls: "modal-sheet", body: f });
    var cam = f.querySelector("[data-lvcam]");
    if (cam) cam.addEventListener("click", function () { m.close(); camHost(st); });
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
  function embedSrc(l) {
    var host = location.hostname || "localhost", mute = l.mine;
    if (l.platform === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(l.embed || "")) return "https://www.youtube-nocookie.com/embed/" + l.embed + "?autoplay=1&playsinline=1&rel=0" + (mute ? "&mute=1" : "");
    if (l.platform === "twitch" && /^[a-z0-9_]{3,25}$/.test(l.embed || "")) return "https://player.twitch.tv/?channel=" + l.embed + "&parent=" + encodeURIComponent(host) + "&autoplay=true" + (mute ? "&muted=true" : "");
    if (l.platform === "facebook" && /^https:\/\/(www\.facebook\.com|fb\.watch)\//.test(l.embed || "")) return "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(l.embed) + "&show_text=false&autoplay=true" + (mute ? "&muted=true" : "");
    return "";   // TikTok: walang player na puwedeng ilagay — bubuksan sa TikTok
  }
  function linkPlayer(c, l) {
    var mid = c.el.querySelector(".lv-mid"), src = embedSrc(l), name = PLAT[l.platform] || "the app", u = l.user || {};
    var open = /^https:\/\//.test(l.link || "") ? l.link : "";
    c.el.classList.add("is-link");
    c.el.querySelector(".lv-video").classList.add("hidden");
    mid.innerHTML = src
      ? '<iframe class="lv-frame" src="' + esc(src) + '" title="Live on ' + esc(name) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
      : '<div class="lv-card">' + avatar(u, 84) + '<p><b translate="no">' + esc(u.display_name || "@" + u.username) + "</b> is live on " + esc(name) + "</p>" + (l.title ? '<p class="lv-card-t">' + esc(l.title) + "</p>" : "") +
        (open ? '<a class="btn lv-open-big" href="' + esc(open) + '" target="_blank" rel="noopener noreferrer">Watch on ' + esc(name) + "</a>" : "") + "</div>";
    if (open && src) {
      var a = document.createElement("a"); a.className = "lv-open"; a.href = open; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Open in " + name + " ↗";
      c.el.querySelector(".lv-top").insertBefore(a, c.el.querySelector(".lv-x"));
    }
  }
  async function camHost(st) {
    if (cur) return;
    if (!st.ready) { UI.toast("Live isn't set up yet. Please try again later.", 4000); return; }
    cur = { kind: "host", ice: st.ice, source: "camera", facing: "user", seen: {}, viewers: {}, tracks: [] };
    var c = cur; c.el = mount("host");
    c.el.querySelector(".lv-who").innerHTML = avatar(me(), 34) + '<b translate="no">' + esc(me().display_name || "@" + (me().username || "")) + "</b>";
    c.el.querySelector(".lv-mid").innerHTML =
      '<div class="lv-setup"><input class="lv-title" maxlength="80" placeholder="Add a title (optional)" aria-label="Live title">' +
      (!MOBILE && navigator.mediaDevices.getDisplayMedia ? '<div class="segmented lv-src" role="group" aria-label="What to share"><button type="button" data-lv="src-camera" aria-pressed="true">📷 Camera</button><button type="button" data-lv="src-screen" aria-pressed="false">🖥️ Screen</button></div>' : "") +
      '<p class="lv-tip">Your followers can watch. Be kind and keep it safe 💛</p></div>';
    c.el.querySelector(".lv-bot").innerHTML = (MOBILE ? '<button type="button" class="lv-round" data-lv="flip" aria-label="Flip camera">🔄</button>' : "") +
      '<button type="button" class="btn lv-go" data-lv="go">🔴 Go live</button>';
    try { await media(); } catch (e) { UI.toast("Please allow the camera and microphone for TigoMeNote.", 4500); close(); }
  }
  async function media() {
    var c = cur; (c.tracks || []).forEach(function (t) { t.stop(); }); c.tracks = [];
    if (c.actx) { try { c.actx.close(); } catch (e) {} c.actx = null; }
    var mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: c.source === "camera" ? { facingMode: c.facing, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } } : false });
    var vid, aud = mic.getAudioTracks()[0];
    if (c.source === "screen") {
      var scr = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 24 }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
      vid = scr.getVideoTracks()[0]; c.tracks.push(vid);
      vid.addEventListener("ended", function () { if (cur === c && c.live) stop(); });
      if (scr.getAudioTracks()[0]) {   // tunog ng screen + mic
        c.actx = new AudioContext(); var dst = c.actx.createMediaStreamDestination();
        c.actx.createMediaStreamSource(new MediaStream([aud])).connect(dst); c.actx.createMediaStreamSource(new MediaStream([scr.getAudioTracks()[0]])).connect(dst);
        c.tracks.push(scr.getAudioTracks()[0], aud); aud = dst.stream.getAudioTracks()[0];
      }
    } else vid = mic.getVideoTracks()[0];
    try { vid.contentHint = c.source === "screen" ? "detail" : "motion"; } catch (e) {}
    c.tracks.push(vid, aud); c.vid = vid; c.aud = aud;
    var v = c.el.querySelector(".lv-video"); v.srcObject = new MediaStream([vid]);
    v.classList.toggle("mirror", c.source === "camera" && c.facing === "user"); v.classList.toggle("is-screen", c.source === "screen");
    if (c.pc) {   // habang live: palitan lang ang track (walang bagong koneksyon)
      c.tv.sender.replaceTrack(vid); c.ta.sender.replaceTrack(aud); bitrate();
    }
  }
  function bitrate() {
    var c = cur; if (!c || !c.tv) return;
    var p = c.tv.sender.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}];
    p.encodings[0].maxBitrate = c.source === "screen" ? 1800000 : 1200000; p.encodings[0].maxFramerate = c.source === "screen" ? 15 : 24;
    p.degradationPreference = c.source === "screen" ? "maintain-resolution" : "balanced";
    c.tv.sender.setParameters(p).catch(function () {});
  }
  async function go() {
    var c = cur; if (!c || c.live || c.going) return;
    c.going = true; var b = c.el.querySelector('[data-lv="go"]'); b.disabled = true; b.textContent = "Starting…";
    try {
      c.pc = new RTCPeerConnection({ iceServers: c.ice, bundlePolicy: "max-bundle" });
      c.tv = c.pc.addTransceiver(c.vid, { direction: "sendonly" }); c.ta = c.pc.addTransceiver(c.aud, { direction: "sendonly" });
      await c.pc.setLocalDescription(await c.pc.createOffer());
      var r = await TMN_API.call("live", "start", { title: c.el.querySelector(".lv-title").value.trim(), source: c.source, sdp: c.pc.localDescription.sdp,
        tracks: [{ mid: c.tv.mid, name: "video" }, { mid: c.ta.mid, name: "audio" }] }, { timeout: 25000 });
      if (cur !== c) { TMN_API.call("live", "end", { id: r.live.id }).catch(function () {}); return; }
      await c.pc.setRemoteDescription({ type: "answer", sdp: r.sdp });
      bitrate();
      c.live = r.live; c.startAt = Date.now();
      await rt(); c.ch = TMN_RT.join(r.live.channel, onRt);
      c.el.classList.add("is-live");
      c.el.querySelector(".lv-badge").classList.remove("hidden"); count(0); c.el.querySelector(".lv-count").classList.remove("hidden");
      c.el.querySelector(".lv-mid").innerHTML = "";
      c.el.querySelector(".lv-bot").innerHTML = chatBox() + (MOBILE && c.source === "camera" ? '<button type="button" class="lv-round" data-lv="flip" aria-label="Flip camera">🔄</button>' : "") +
        '<button type="button" class="lv-round" data-lv="mute" aria-label="Mute">🎤</button><button type="button" class="btn lv-end" data-lv="stop">End</button>';
      c.clock = setInterval(function () { var t = c.el.querySelector(".lv-badge"); if (t) t.textContent = "LIVE · " + mmss((Date.now() - c.startAt) / 1000); }, 1000);
      c.beatT = setInterval(beat, 20000);
      c.pc.addEventListener("connectionstatechange", function () { if (c.pc.connectionState === "failed") { UI.toast("Your connection dropped. The live has ended.", 4500); stop(); } });
      window.addEventListener("beforeunload", guard);
      try { if (window.TMNNative && TMNNative.setInCall) TMNNative.setInCall(true); } catch (e) {}   // APK: lumulutang na window kapag umalis sa app
    } catch (e) {
      c.going = false; if (c.pc) { c.pc.close(); c.pc = null; }
      if (cur === c) { b.disabled = false; b.textContent = "🔴 Go live"; }
      UI.toast(e.message || "Couldn't start the live.", 4500);
    }
  }
  function beat() {
    var c = cur; if (!c || !c.live) return;
    var now = Date.now(), n = 0; Object.keys(c.viewers).forEach(function (k) { if (now - c.viewers[k] < 40000) n++; else delete c.viewers[k]; });
    count(n); if (c.ch) c.ch.send("count", { n: n });
    TMN_API.call("live", "beat", { id: c.live.id, viewers: n }).catch(function (e) { if (e.status === 410) stop(); });
  }
  function stop() {
    var c = cur; if (!c) return;
    if (c.live) { TMN_API.call("live", "end", { id: c.live.id }).catch(function () {}); var secs = (Date.now() - c.startAt) / 1000; UI.toast("Live ended · " + mmss(secs)); }
    close();
  }

  // ---------- 👀 manood ----------
  async function watch(id) {
    if (cur) return;
    if (!window.RTCPeerConnection) { UI.toast("Live doesn't work in this browser."); return; }
    cur = { kind: "watch", seen: {}, tracks: [] };
    var c = cur; c.el = mount("watch");
    c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">Connecting…</p>';
    try {
      var r = await TMN_API.call("live", "watch", { id: id }, { timeout: 25000 });
      if (cur !== c) return;
      c.live = r.live;
      if (r.live.platform && r.live.platform !== "cf") return linkWatch(c, r.live);
      var u = r.live.user || {};
      c.el.querySelector(".lv-who").innerHTML = avatar(u, 34) + '<span><b translate="no">' + esc(u.display_name || "@" + u.username) + "</b>" + (r.live.title ? "<small>" + esc(r.live.title) + "</small>" : "") + "</span>";
      c.el.querySelector(".lv-badge").classList.remove("hidden"); count(r.live.viewers);
      c.pc = new RTCPeerConnection({ iceServers: r.ice, bundlePolicy: "max-bundle" });
      var ms = new MediaStream(), v = c.el.querySelector(".lv-video");
      v.classList.toggle("is-screen", r.live.source === "screen");
      c.pc.ontrack = function (e) { ms.addTrack(e.track); v.srcObject = ms; };
      c.pc.addEventListener("connectionstatechange", function () {
        if (c.pc.connectionState === "connected") { c.el.querySelector(".lv-mid").innerHTML = ""; sound(); }
        if (c.pc.connectionState === "failed" && cur === c) c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">Connection lost. <button type="button" class="btn btn-sm" data-lv="retry">Try again</button></p>';
      });
      await c.pc.setRemoteDescription({ type: "offer", sdp: r.sdp });
      await c.pc.setLocalDescription(await c.pc.createAnswer());
      await TMN_API.call("live", "answer", { session: r.session, sdp: c.pc.localDescription.sdp }, { timeout: 20000 });
      await rt(); c.ch = TMN_RT.join(r.live.channel, onRt);
      var hi = function () { if (c.ch) c.ch.send("hi", { u: me().id || "x" }); };
      setTimeout(hi, 800); c.hiT = setInterval(hi, 15000);
      c.el.querySelector(".lv-bot").innerHTML = chatBox() + '<button type="button" class="lv-round" data-lv="heart" aria-label="Send a heart">❤️</button>';
    } catch (e) {
      if (cur !== c) return;
      c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">' + esc(e.status === 410 ? "This live has ended." : e.message || "Couldn't open the live.") + "</p>";
    }
  }
  // panonood ng live sa ibang platform: player nila + chat at ❤️ dito; bilang ng nanonood = mga "hi" (kasama ang sarili)
  async function linkWatch(c, l) {
    var u = l.user || {};
    c.link = true; c.viewers = {};
    c.el.querySelector(".lv-who").innerHTML = avatar(u, 34) + '<span><b translate="no">' + esc(u.display_name || "@" + u.username) + "</b>" + (l.title ? "<small>" + esc(l.title) + "</small>" : "<small>on " + esc(PLAT[l.platform] || "") + "</small>") + "</span>";
    c.el.querySelector(".lv-badge").classList.remove("hidden"); count(1);
    linkPlayer(c, l);
    await rt(); if (cur !== c) return;
    c.ch = TMN_RT.join(l.channel, onRt);
    var hi = function () { if (c.ch) c.ch.send("hi", { u: me().id || "x" }); };
    var tally = function () { var now = Date.now(), n = 1; Object.keys(c.viewers).forEach(function (k) { if (now - c.viewers[k] < 70000) n++; else delete c.viewers[k]; }); count(n); };
    setTimeout(hi, 500); c.hiT = setInterval(function () { hi(); tally(); }, 30000); c.beatT = setInterval(tally, 5000);
    c.el.querySelector(".lv-bot").innerHTML = chatBox() + '<button type="button" class="lv-round" data-lv="heart" aria-label="Send a heart">❤️</button>' +
      (l.mine ? '<button type="button" class="btn lv-end" data-lv="endlink">End</button>' : "");
  }
  function sound() {
    var c = cur; if (!c) return; var v = c.el.querySelector(".lv-video");
    v.muted = false;
    v.play().catch(function () { v.muted = true; v.play().catch(function () {}); c.el.querySelector(".lv-mid").innerHTML = '<button type="button" class="btn lv-snd" data-lv="sound">🔊 Tap for sound</button>'; });
  }
  function ended() {
    var c = cur; if (!c) return;
    c.el.classList.add("is-ended"); c.el.querySelector(".lv-badge").textContent = "ENDED";
    c.el.querySelector(".lv-mid").innerHTML = '<p class="lv-wait">The live has ended. Thanks for watching 💛</p>';
    c.el.querySelector(".lv-bot").innerHTML = "";
    if (c.pc) { try { c.pc.close(); } catch (e) {} }
    var fr = c.el.querySelector(".lv-frame"); if (fr) fr.remove();
  }

  // ---------- mga pindot ----------
  document.addEventListener("click", function (e) {
    var c = cur; if (!c) return;
    var b = e.target.closest && e.target.closest("[data-lv]"); if (!b || !c.el.contains(b)) return;
    var a = b.dataset.lv;
    if (a === "close") { if (c.kind === "host" && c.live) { TMN_MODAL.confirm("End your live?", { okText: "End live", danger: true }).then(function (ok) { if (ok && cur === c) stop(); }); } else close(); }
    else if (a === "go") go();
    else if (a === "stop") stop();
    else if (a === "endlink") {
      TMN_MODAL.confirm("End your live on TigoMeNote? (Stop it in " + (PLAT[c.live.platform] || "the other app") + " too.)", { okText: "End live", danger: true }).then(function (ok) {
        if (!ok || cur !== c) return;
        TMN_API.call("live", "end", { id: c.live.id }).catch(function () {});
        close(); UI.toast("Live ended"); document.dispatchEvent(new CustomEvent("tmn:live-changed"));
      });
    }
    else if (a === "flip") { c.facing = c.facing === "user" ? "environment" : "user"; media().catch(function () { UI.toast("Couldn't switch the camera."); }); }
    else if (a === "mute") { c.aud.enabled = !c.aud.enabled; b.textContent = c.aud.enabled ? "🎤" : "🔇"; b.setAttribute("aria-label", c.aud.enabled ? "Mute" : "Unmute"); }
    else if (a === "src-camera" || a === "src-screen") {
      var s = a.slice(4); if (s === c.source) return; var old = c.source; c.source = s;
      c.el.querySelectorAll(".lv-src button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.lv === a)); });
      media().catch(function () { c.source = old; c.el.querySelectorAll(".lv-src button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.lv === "src-" + old)); }); media().catch(function () {}); });
    }
    else if (a === "heart") { heart(); if (c.ch) c.ch.send("heart", {}); }
    else if (a === "sound") { c.el.querySelector(".lv-mid").innerHTML = ""; sound(); }
    else if (a === "retry") { var id = c.live && c.live.id; close(); if (id) watch(id); }
  });
  document.addEventListener("submit", function (e) { if (cur && e.target.matches && e.target.matches("[data-lv-form]")) { e.preventDefault(); send(e.target); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && !(cur.kind === "host" && cur.live)) close(); });
  window.addEventListener("pagehide", function () {
    var c = cur; if (!c || c.kind !== "host" || !c.live || !navigator.sendBeacon) return;
    try { navigator.sendBeacon(C.fn.live, new Blob([JSON.stringify({ action: "end", id: c.live.id, token: window.TMN_TOKEN })], { type: "text/plain;charset=UTF-8" })); } catch (e) {}
  });

  window.TMN_LIVE = {
    host: host, watch: watch,
    list: function () { return TMN_API.call("live", "list", {}, { timeout: 15000 }); },
    active: function () { return !!cur; },
  };
})();
