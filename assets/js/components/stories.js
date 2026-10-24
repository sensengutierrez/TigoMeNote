/* TigoMeNote · components/stories.js
   Status / Stories (nawawala pagkalipas ng 24 oras), parang Instagram.
     TMN_STORIES.mount(el)   → bilog-bilog sa taas: "Status mo" + mga fina-follow mo na may status
     TMN_STORIES.add()       → pili ng photo/video → caption → upload
   Viewer: tap kanan = susunod, tap kaliwa = balik, pindutin nang matagal = pause, Esc / X = sara.
   Sa sariling status: bilang ng nanood at listahan nila, at Delete.
   Server: social-fast (stories, storyUpload, createStory, viewStory, storyViewers, deleteStory)
   Kailangan: api.js, modal.js, post-queue.js (TMN_POSTQ.prepare para sa compression), post-card.js (avatar) */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var PHOTO_MS = 5000;
  var state = { groups: [], el: null, loading: false };
  function UI() { return window.TMN_UI; }
  function esc(s) { return UI().esc(s); }
  function av(u, s) { return window.TMN_POST_CARD.avatar(u, s); }
  function ago(iso) { return window.TMN_POSTS_UI ? TMN_POSTS_UI.ago(iso) : ""; }

  // ---------- Bar ----------
  function render() {
    var el = state.el; if (!el) return;
    var me = window.TMN_USER || {};
    var mine = state.groups.filter(function (g) { return g.me; })[0];
    var others = state.groups.filter(function (g) { return !g.me; });
    el.innerHTML =
      '<div class="st-bar" role="list">' +
        '<div class="st-item st-me" role="listitem">' +
          '<button type="button" class="st-ring' + (mine ? " has" : " none") + '" data-st="' + (mine ? "open-me" : "add") + '" aria-label="Your status">' + av(me, 62) + "</button>" +
          '<button type="button" class="st-plus" data-st="add" aria-label="Add a status">' + I("plus", "ic-sm") + "</button>" +
          '<span class="st-name">Your status</span></div>' +
        others.map(function (g) {
          return '<div class="st-item" role="listitem"><button type="button" class="st-ring' + (g.unseen ? " has" : " seen") + '" data-st="open" data-uid="' + esc(g.user.id) + '">' + av(g.user, 62) + "</button>" +
            '<span class="st-name">' + esc(g.user.username) + "</span></div>";
        }).join("") +
        (state.loading && !others.length ? '<div class="st-item"><span class="st-ring skel"></span><span class="st-name skel" style="width:48px;height:10px"></span></div>' : "") +
      "</div>";
  }
  async function load() {
    if (!navigator.onLine) return;
    state.loading = true; render();
    try { var r = await TMN_API.call("social", "stories", {}); state.groups = r.groups || []; }
    catch (e) {}
    state.loading = false; render();
  }
  function mount(el) {
    state.el = el;
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-st]"); if (!b) return;
      if (b.dataset.st === "add") return add();
      if (b.dataset.st === "open-me") return view(state.groups.findIndex(function (g) { return g.me; }));
      if (b.dataset.st === "open") return view(state.groups.findIndex(function (g) { return g.user.id === b.dataset.uid; }));
    });
    render(); load();
    window.addEventListener("online", load);
    return { reload: load };
  }

  // ---------- Add ----------
  function pick() {
    return new Promise(function (res) {
      var i = document.createElement("input"); i.type = "file"; i.accept = "image/*,video/*"; i.style.display = "none";
      document.body.appendChild(i);
      i.addEventListener("change", function () { var f = i.files && i.files[0]; i.remove(); res(f || null); });
      i.click();
    });
  }
  async function add(file) {
    if (!navigator.onLine) { UI().toast("You need internet to post a status."); return; }
    file = file || await pick(); if (!file) return;
    var isVideo = /^video\//.test(file.type);
    var url = URL.createObjectURL(file);
    var root = document.createElement("form");
    root.className = "st-new";
    root.innerHTML =
      '<div class="st-prev">' + (isVideo ? '<video src="' + url + '" autoplay muted loop playsinline></video>' : '<img alt="" src="' + url + '">') + "</div>" +
      '<input class="input" maxlength="200" placeholder="Add a caption (optional)">' +
      '<p class="faint small">Visible to people who follow you. Disappears after 24 hours.' + (isVideo ? " Video: first 15 seconds only." : "") + "</p>" +
      '<p class="small st-status hidden" aria-live="polite"></p>';
    var cap = root.querySelector("input"), status = root.querySelector(".st-status");
    var busy = false;
    if (window.TMN_GUARD) TMN_GUARD.watch(cap);
    async function share(btn) {
      if (busy) return;
      if (window.TMN_GUARD && !TMN_GUARD.ok(cap.value)) { cap.focus(); return; }
      busy = true; btn.disabled = true;
      status.classList.remove("hidden");
      try {
        var item = { id: "st", type: isVideo ? "video" : "photo", blob: file, createdAt: Date.now() };
        var files = await TMN_POSTQ.prepare([item], function (i, n, pct) { status.textContent = (isVideo ? "Compressing video… " : "Preparing… ") + Math.round(pct * 100) + "%"; });
        var f = files[0];
        status.textContent = "Uploading…";
        var up = await TMN_API.call("social", "storyUpload", { kind: f.kind, mime: f.mime, size: f.size, duration: f.duration });
        var r = await fetch(up.url, { method: "PUT", headers: { "content-type": f.mime }, body: f.blob });
        if (!r.ok) throw new Error("Upload failed (" + r.status + ").");
        for (var t = 0; t < 3; t++) {
          try { await TMN_API.call("social", "createStory", { path: up.path, kind: f.kind, mime: f.mime, w: f.w, h: f.h, duration: f.duration, caption: cap.value.trim() }); break; }
          catch (e) { if (e.status === 409 && t < 2) await new Promise(function (ok) { setTimeout(ok, 1200); }); else throw e; }
        }
        done = true; m.close(); UI().toast("Status shared ✓"); load();
      } catch (e) { busy = false; btn.disabled = false; status.textContent = e.message || "Couldn't share."; status.classList.add("err"); }
    }
    root.addEventListener("submit", function (e) { e.preventDefault(); share(m.el.querySelector(".modal-foot .btn-primary")); });
    var done = false;
    var m = TMN_MODAL.open({
      title: "New status", size: "sm", cls: "modal-sheet", body: root, closeOnBackdrop: false,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { if (!busy) m.close(); } },
        { label: I("send", "ic-sm") + "Share", cls: "btn-primary", onClick: function (api, b) { share(b); } }
      ],
      onClose: function () { URL.revokeObjectURL(url); }
    });
  }

  // ---------- Viewer ----------
  function view(gi) {
    if (gi < 0 || !state.groups[gi]) return;
    var g, ii = 0, timer = null, started = 0, elapsed = 0, dur = PHOTO_MS, paused = false, raf = null;
    var ov = document.createElement("div");
    ov.className = "st-view";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML =
      '<div class="st-frame">' +
        '<div class="st-bars"></div>' +
        '<div class="st-top"><button type="button" class="st-who" data-v="user"></button><span class="st-acts">' +
          '<button type="button" class="st-btn hidden" data-v="del" aria-label="Delete">' + I("trash") + "</button>" +
          '<button type="button" class="st-btn hidden" data-v="report" aria-label="Report">' + I("flag") + "</button>" +
          '<button type="button" class="st-btn" data-v="close" aria-label="Close">' + I("x") + "</button></span></div>" +
        '<div class="st-media"></div>' +
        '<button type="button" class="st-tap prev" data-v="prev" aria-label="Previous"></button>' +
        '<button type="button" class="st-tap next" data-v="next" aria-label="Next"></button>' +
        '<div class="st-cap"></div>' +
        '<button type="button" class="st-views hidden" data-v="views">' + I("eye", "ic-sm") + "<span></span></button>" +
      "</div>";
    document.body.appendChild(ov);
    document.body.classList.add("modal-open");
    var media = ov.querySelector(".st-media"), bars = ov.querySelector(".st-bars");

    function item() { return g.items[ii]; }
    function paintBars(p) {
      bars.innerHTML = g.items.map(function (_, k) {
        var w = k < ii ? 100 : k > ii ? 0 : Math.round(p * 100);
        return '<span><i style="width:' + w + '%"></i></span>';
      }).join("");
    }
    function stopTimer() { cancelAnimationFrame(raf); raf = null; }
    function tick() {
      if (paused) return;
      var p = Math.min(1, (elapsed + (performance.now() - started)) / dur);
      var bar = bars.children[ii] && bars.children[ii].firstChild; if (bar) bar.style.width = (p * 100) + "%";
      if (p >= 1) return next();
      raf = requestAnimationFrame(tick);
    }
    function start(d) { dur = d; elapsed = 0; started = performance.now(); paused = false; stopTimer(); raf = requestAnimationFrame(tick); }
    function pause(on) {
      if (on === paused) return;
      var v = media.querySelector("video");
      if (on) { elapsed += performance.now() - started; paused = true; stopTimer(); if (v) v.pause(); }
      else { started = performance.now(); paused = false; if (v) v.play().catch(function () {}); raf = requestAnimationFrame(tick); }
    }
    function show() {
      g = state.groups[gi];
      var it = item(); if (!it) return close();
      paintBars(0);
      ov.querySelector(".st-who").innerHTML = av(g.user, 34) + "<b>" + esc(g.me ? "Your status" : g.user.username) + '</b><span class="st-time">' + ago(it.at) + "</span>";
      ov.querySelector(".st-who").dataset.uid = g.user.id;
      ov.querySelector('[data-v="del"]').classList.toggle("hidden", !g.me);
      ov.querySelector('[data-v="report"]').classList.toggle("hidden", !!g.me || !window.TMN_SOCIAL);
      var vb = ov.querySelector(".st-views");
      vb.classList.toggle("hidden", !g.me);
      if (g.me) vb.querySelector("span").textContent = (it.views || 0) + " views";
      var cap = ov.querySelector(".st-cap"); cap.textContent = it.caption || ""; cap.classList.toggle("hidden", !it.caption);
      stopTimer();
      if (!it.url) { media.innerHTML = '<div class="pt-missing">' + I("image", "ic-lg") + "</div>"; start(PHOTO_MS); }
      else if (it.kind === "video") {
        media.innerHTML = '<video src="' + esc(it.url) + '" playsinline autoplay></video>';
        var v = media.querySelector("video");
        v.addEventListener("loadedmetadata", function () { start(Math.min(15.5, isFinite(v.duration) && v.duration > 0 ? v.duration : (it.duration || 10)) * 1000); });
        v.play().catch(function () { v.muted = true; v.play().catch(function () {}); });
        start((it.duration || 10) * 1000);
      } else {
        media.innerHTML = '<img alt="" src="' + esc(it.url) + '">';
        start(PHOTO_MS);
      }
      if (!it.seen && !g.me) {
        it.seen = true; g.unseen = Math.max(0, g.unseen - 1);
        TMN_API.call("social", "viewStory", { id: it.id }).catch(function () {});
      }
    }
    function next() {
      if (ii < g.items.length - 1) { ii++; show(); }
      else if (gi < state.groups.length - 1) { gi++; ii = firstUnseen(state.groups[gi]); show(); }
      else close();
    }
    function prev() {
      if (ii > 0) { ii--; show(); }
      else if (gi > 0) { gi--; ii = 0; show(); }
      else { show(); }
    }
    function firstUnseen(gr) { var k = gr.items.findIndex(function (x) { return !x.seen; }); return k < 0 ? 0 : k; }
    function close() {
      stopTimer(); document.removeEventListener("keydown", onKey);
      ov.classList.add("out"); setTimeout(function () { ov.remove(); }, 160);
      if (!document.querySelector(".modal-backdrop")) document.body.classList.remove("modal-open");
      render();
    }
    function onKey(e) {
      if (document.querySelector(".modal-backdrop")) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev();
      if (e.key === " ") { e.preventDefault(); pause(!paused); }
    }
    document.addEventListener("keydown", onKey);

    // Hold = pause (tap = next/prev)
    var holdT = null, held = false;
    ov.addEventListener("pointerdown", function (e) {
      if (!e.target.closest(".st-tap, .st-media")) return;
      held = false; holdT = setTimeout(function () { held = true; pause(true); }, 220);
    });
    ov.addEventListener("pointerup", function () { clearTimeout(holdT); if (held) { pause(false); } });
    ov.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return;
      var v = b.dataset.v;
      if ((v === "next" || v === "prev") && held) { held = false; return; }
      if (v === "close") close();
      if (v === "next") next();
      if (v === "prev") prev();
      if (v === "user" && !g.me) { close(); TMN_SOCIAL.userSheet(b.dataset.uid); }
      if (v === "views") { pause(true); await viewers(item()); pause(false); }
      if (v === "report") {
        pause(true);
        var rm = TMN_SOCIAL.reportSheet("story", item().id, "status");
        var obs = new MutationObserver(function () { if (!document.body.contains(rm.el)) { obs.disconnect(); pause(false); } });
        obs.observe(document.body, { childList: true, subtree: true });
      }
      if (v === "del") {
        pause(true);
        if (await TMN_MODAL.confirm("Delete this status?", { okText: "Delete", danger: true })) {
          try {
            await TMN_API.call("social", "deleteStory", { id: item().id });
            g.items.splice(ii, 1);
            if (!g.items.length) { state.groups.splice(gi, 1); close(); return; }
            ii = Math.min(ii, g.items.length - 1); show(); UI().toast("Deleted.");
          } catch (err) { UI().toast(err.message); pause(false); }
        } else pause(false);
      }
    });
    ii = firstUnseen(state.groups[gi]);
    requestAnimationFrame(function () { ov.classList.add("show"); });
    show();
  }
  function viewers(it) {
    return new Promise(async function (resolve) {
      var body = document.createElement("div");
      body.className = "sx-people";
      body.innerHTML = '<p class="faint small sx-empty">Loading…</p>';
      TMN_MODAL.open({ title: "Viewers", size: "sm", cls: "modal-sheet", body: body, onClose: resolve });
      TMN_SOCIAL.bindPeople(body);
      try {
        var r = await TMN_API.call("social", "storyViewers", { id: it.id });
        body.innerHTML = r.list.length ? r.list.map(function (x) {
          var u = x.user || {};
          return '<div class="sx-row"><button type="button" class="sx-user" data-sx="user" data-uid="' + esc(u.id || "") + '">' + av(u, 40) +
            "<span><b>" + esc(u.display_name || u.username || "?") + '</b><span class="faint small">' + ago(x.at) + "</span></span></button></div>";
        }).join("") : '<p class="faint small sx-empty">No views yet.</p>';
      } catch (e) { body.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
    });
  }

  window.TMN_STORIES = { mount: mount, add: add, reload: load };
})();
