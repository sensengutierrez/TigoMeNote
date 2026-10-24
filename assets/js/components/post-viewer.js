/* TigoMeNote · components/post-viewer.js
   Pang-display ng posts galing sa server (posts-fast). Ginagamit ng Profile at Explore.
     TMN_POSTS_UI.tiles(posts)                     → HTML ng grid tiles (data-pi = index)
     TMN_POSTS_UI.open(posts, index, { onChange({type:'delete',id}|{type:'update',post}) }) → full viewer (carousel, caption, Edit/Delete kung sa iyo)
   Kailangan: modal.js, api.js, app-shell.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var VIS = { public: ["globe", "Public"], followers: ["users", "Followers"], private: ["lock", "Only me"] };
  function esc(s) { return window.TMN_UI.esc(s); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function localInput(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function when(iso) { return new Date(iso).toLocaleString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
  function short(iso) { var d = new Date(iso); return d.toLocaleDateString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(window.TMN_I18N ? TMN_I18N.locale : undefined, { hour: "numeric", minute: "2-digit" }); }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    if (s < 604800) return Math.floor(s / 86400) + "d";
    return new Date(iso).toLocaleDateString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "short", day: "numeric" });
  }

  // 1200 → 1.2K
  function num(n) {
    n = Number(n) || 0;
    if (n < 1000) return String(n);
    if (n < 1e6) return (n / 1000).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, "") + "K";
    return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  // opts: showVis, showAuthor, pins (ipakita ang "Pinned")
  function tiles(posts, opts) {
    opts = opts || {};
    return posts.map(function (p, i) {
      var m = p.media[0] || {};
      var inner = !m.url ? '<div class="pt-missing">' + I("image") + "</div>"
        : m.kind === "video" ? '<video src="' + esc(m.url) + '#t=0.1" muted playsinline preload="metadata"></video>'
        : '<img alt="" loading="lazy" src="' + esc(m.url) + '">';
      var badges = "";
      if (p.hidden) badges += '<span class="pt-badge review">' + I("flag", "ic-sm") + "Under review</span>";
      if (opts.pins !== false && p.pinned) badges += '<span class="pt-badge pin">Pinned</span>';
      if (p.scheduled) badges += '<span class="pt-badge sched">' + I("clock", "ic-sm") + short(p.publish_at) + "</span>";
      if (opts.showVis && p.visibility !== "public") badges += '<span class="pt-badge">' + I(VIS[p.visibility][0], "ic-sm") + "</span>";
      var corner = (p.media.length > 1 ? '<span class="pt-corner">' + I("album", "ic-sm") + p.media.length + "</span>" : "") +
        (m.kind === "video" ? '<span class="pt-corner">' + I("video", "ic-sm") + "</span>" : "");
      var st = p.stats || {};
      var stats = p.scheduled ? "" : '<span class="pt-stats" translate="no">' +
        '<span title="Views">' + I("play", "ic-sm") + num(st.views) + "</span>" +
        '<span title="Reactions">' + I("heart", "ic-sm") + num(st.reactions) + "</span></span>";
      return '<button type="button" class="pt' + (p.scheduled ? " is-sched" : "") + '" data-pi="' + i + '" aria-label="Open post">' + inner +
        '<span class="pt-top">' + corner + "</span>" + (badges ? '<span class="pt-badges">' + badges + "</span>" : "") + stats +
        (opts.showAuthor && p.author ? '<span class="pt-author">@' + esc(p.author.username) + "</span>" : "") + "</button>";
    }).join("");
  }

  // Bilang ng views: ipunin at ipadala nang sabay (posts-fast "view"). Isang beses lang bawat post bawat page.
  var seen = {}, pending = [], timer = null;
  function markViewed(id) {
    if (!id || seen[id] || !window.TMN_API) return;
    seen[id] = 1; pending.push(id);
    clearTimeout(timer);
    timer = setTimeout(flushViews, 1200);
  }
  function flushViews() {
    if (!pending.length || !navigator.onLine) return;
    var ids = pending.splice(0, 30);
    TMN_API.call("posts", "view", { ids: ids }).catch(function () {});
    if (pending.length) flushViews();
  }
  window.addEventListener("pagehide", flushViews);

  function open(posts, index, o) {
    o = o || {};
    var UI = window.TMN_UI, MODAL = window.TMN_MODAL;
    var idx = index, slide = 0, modal;
    var root = document.createElement("div");
    root.className = "pv";
    root.innerHTML =
      '<div class="pv-stage"><div class="pv-media"></div>' +
        '<button type="button" class="vw-nav prev" aria-label="Previous">' + I("chevronL") + "</button>" +
        '<button type="button" class="vw-nav next" aria-label="Next">' + I("chevronR") + "</button>" +
        '<div class="pv-dots"></div></div>' +
      '<div class="pv-info"><div class="pv-author"></div><div class="pv-sound"></div><div class="pv-badges"></div><p class="pv-cap"></p>' +
        '<div class="pv-social"></div><div class="pv-actions"></div></div>';
    var media = root.querySelector(".pv-media"), dots = root.querySelector(".pv-dots");
    var prev = root.querySelector(".prev"), next = root.querySelector(".next");

    function cur() { return posts[idx]; }
    function showSlide() {
      var p = cur(), m = p.media[slide] || {};
      media.innerHTML = !m.url ? '<div class="pt-missing">' + I("image", "ic-lg") + "<span>Couldn't load. Please try again.</span></div>"
        : m.kind === "video" ? '<video src="' + esc(m.url) + '" controls playsinline autoplay></video>'
        : '<img alt="" src="' + esc(m.url) + '">';
      // May sound ang post: hinaan ang sariling tunog ng video ayon sa pinili ng nag-post
      var vid = media.querySelector("video");
      if (vid && p.sound) vid.volume = p.sound.orig != null ? p.sound.orig : 0.4;
      dots.innerHTML = p.media.length > 1 ? p.media.map(function (_, i) { return '<span class="' + (i === slide ? "on" : "") + '"></span>'; }).join("") : "";
      var hasPrev = slide > 0 || idx > 0, hasNext = slide < p.media.length - 1 || idx < posts.length - 1;
      prev.disabled = !hasPrev; next.disabled = !hasNext;
    }
    function show() {
      var p = cur(); if (!p) { modal.close(); return; }
      var a = p.author || {};
      root.querySelector(".pv-author").innerHTML =
        '<span class="avatar" style="--size:38px">' + (a.avatar_url ? '<img alt="" src="' + esc(a.avatar_url) + '">' : esc(UI.initials(a.display_name || a.username || "?"))) + "</span>" +
        "<div><b>" + esc(a.display_name || a.username || "") + '</b><div class="faint small">@' + esc(a.username || "") + " · " + (p.scheduled ? "scheduled" : ago(p.publish_at)) + "</div></div>";
      var v = VIS[p.visibility] || VIS.public;
      root.querySelector(".pv-badges").innerHTML =
        (p.mine ? '<span class="badge">' + I(v[0], "ic-sm") + v[1] + "</span>" : "") +
        (p.hidden ? '<span class="badge badge-review" title="Hidden from others while an admin reviews it.">' + I("flag", "ic-sm") + "Under review</span>" : "") +
        (p.pinned ? '<span class="badge badge-pin">' + I("pin", "ic-sm") + "Pinned</span>" : "") +
        (p.scheduled ? '<span class="badge badge-accent">' + I("clock", "ic-sm") + "Appears " + when(p.publish_at) + "</span>" : "") +
        (p.stats && !p.scheduled ? '<span class="badge" title="Views">' + I("play", "ic-sm") + '<span translate="no">' + num(p.stats.views) + "</span> views</span>" : "");
      if (!p.mine && !p.scheduled) markViewed(p.id);
      root.querySelector(".pv-cap").textContent = p.caption || "";
      // Sound: tumutugtog agad pagbukas (tap sa ♪ para itigil)
      var S = window.TMN_SOUNDS, sb = root.querySelector(".pv-sound");
      sb.innerHTML = p.sound && S ? S.chip(p.sound) : "";
      if (S) { if (p.sound && S.get(p.sound.id)) { if (S.playing() !== p.sound.id) S.play(p.sound.id, { vol: p.sound.vol }); } else S.stop(); }
      root.querySelector(".pv-actions").innerHTML = p.mine
        ? (p.scheduled ? "" : '<button type="button" class="btn btn-ghost btn-sm' + (p.pinned ? " is-on" : "") + '" data-a="pin">' + I("pin", "ic-sm") + (p.pinned ? "Unpin" : "Pin") + "</button>") +
          '<button type="button" class="btn btn-ghost btn-sm" data-a="edit">' + I("edit", "ic-sm") + "Edit</button>" +
          '<button type="button" class="btn btn-danger btn-sm" data-a="delete">' + I("trash", "ic-sm") + "Delete</button>"
        : (p.author && window.TMN_SOCIAL ? '<button type="button" class="btn btn-ghost btn-sm pv-report" data-a="report">' + I("flag", "ic-sm") + "Report</button>" : "");
      // Reactions, comments, share, bookmark (kapag naka-load ang post-card.js)
      var soc = root.querySelector(".pv-social");
      if (window.TMN_POST_CARD && p.stats && !p.scheduled) {
        soc.dataset.id = p.id;
        soc.innerHTML = TMN_POST_CARD.actionsHtml(p) +
          (p.stats.comments ? '<button type="button" class="pc-more-comments" data-act="comments">View ' + p.stats.comments + " comment" + (p.stats.comments > 1 ? "s" : "") + "</button>" : "");
      } else soc.innerHTML = "";
      modal.el.querySelector(".modal-head h3").textContent = posts.length > 1 ? (idx + 1) + " / " + posts.length : "Post";
      showSlide();
    }
    function go(d) {
      var p = cur();
      if (d > 0 && slide < p.media.length - 1) slide++;
      else if (d < 0 && slide > 0) slide--;
      else { var n = idx + d; if (n < 0 || n >= posts.length) return; idx = n; slide = d > 0 ? 0 : posts[n].media.length - 1; show(); return; }
      showSlide();
    }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    function onKey(e) { if (e.target.closest && e.target.closest("textarea, input")) return; if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }
    document.addEventListener("keydown", onKey);
    var sx = null;
    media.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    media.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; });

    root.querySelector(".pv-actions").addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var p = cur();
      if (b.dataset.a === "delete") {
        if (!(await MODAL.confirm("Delete this post from the server? (Your Gallery copy stays.)", { okText: "Delete", danger: true }))) return;
        try {
          await TMN_API.call("posts", "deletePost", { id: p.id });
          posts.splice(idx, 1); UI.toast("Post deleted.");
          if (o.onChange) o.onChange({ type: "delete", id: p.id });
          if (!posts.length) { modal.close(); return; }
          idx = Math.min(idx, posts.length - 1); slide = 0; show();
        } catch (err) { UI.toast(err.message); }
      }
      if (b.dataset.a === "report") { TMN_SOCIAL.reportSheet("post", p.id, "post"); return; }
      if (b.dataset.a === "pin") {
        b.disabled = true;
        try {
          var r = await TMN_API.call("posts", "pin", { id: p.id, on: !p.pinned });
          posts[idx] = r.post; UI.toast(r.post.pinned ? "Pinned to your profile." : "Unpinned.");
          if (o.onChange) o.onChange({ type: "update", post: r.post });
          show();
        } catch (err) { b.disabled = false; UI.toast(err.message); }
      }
      if (b.dataset.a === "edit") {
        var upd = await edit(p);
        if (upd) { posts[idx] = upd; UI.toast("Saved."); if (o.onChange) o.onChange({ type: "update", post: upd }); show(); }
      }
    });

    if (window.TMN_POST_CARD) {
      TMN_POST_CARD.bind(root.querySelector(".pv-social"), {
        find: function (id) { return posts.filter(function (x) { return x.id === id; })[0]; },
        update: function (np) { posts[idx] = np; if (o.onChange) o.onChange({ type: "update", post: np }); }
      });
    }
    modal = MODAL.open({
      title: "", size: "full", cls: "modal-viewer modal-post", body: root,
      onClose: function () { document.removeEventListener("keydown", onKey); if (window.TMN_SOUNDS) TMN_SOUNDS.stop(); }
    });
    show();
  }

  // Edit: caption, visibility, schedule
  function edit(p) {
    var UI = window.TMN_UI;
    return new Promise(function (resolve) {
      var done = false, vis = p.visibility, sched = p.scheduled;
      var f = document.createElement("form");
      f.className = "pc";
      var d = new Date(p.publish_at); if (!sched) { d = new Date(Date.now() + 3600000); d.setMinutes(0, 0, 0); }
      f.innerHTML =
        '<label class="field"><span class="pe-label">Caption</span><textarea class="input" rows="4" maxlength="1000"></textarea></label>' +
        '<div class="field"><span class="pe-label">Who can see this</span><div class="segmented" data-g="vis">' +
          Object.keys(VIS).map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (k === vis) + '">' + I(VIS[k][0], "ic-sm") + VIS[k][1] + "</button>"; }).join("") +
        "</div></div>" +
        (p.scheduled
          ? '<div class="field"><span class="pe-label">Schedule</span><div class="segmented" data-g="when">' +
              '<button type="button" data-v="later" aria-pressed="true">' + I("calendar", "ic-sm") + "Scheduled</button>" +
              '<button type="button" data-v="now" aria-pressed="false">' + I("send", "ic-sm") + "Publish now</button></div>" +
              '<input class="input pc-date" type="datetime-local" value="' + localInput(d) + '"></div>'
          : "");
      var ta = f.querySelector("textarea"); ta.value = p.caption || "";
      if (window.TMN_GUARD) TMN_GUARD.watch(ta);
      var date = f.querySelector(".pc-date");
      f.addEventListener("click", function (e) {
        var b = e.target.closest(".segmented button"); if (!b) return;
        var g = b.parentNode.dataset.g;
        b.parentNode.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (g === "vis") vis = b.dataset.v;
        if (g === "when") { sched = b.dataset.v === "later"; date.classList.toggle("hidden", !sched); }
      });
      async function save(m, btn) {
        if (window.TMN_GUARD && !TMN_GUARD.ok(ta.value)) { ta.focus(); return; }
        var body = { id: p.id, caption: ta.value.trim(), visibility: vis };
        if (p.scheduled) {
          if (sched) {
            var t = new Date(date.value);
            if (isNaN(t) || t.getTime() < Date.now() + 60000) { UI.toast("The schedule must be in the future."); return; }
            body.publish_at = t.toISOString();
          } else body.publish_at = new Date().toISOString();
        }
        btn.disabled = true;
        try { var r = await TMN_API.call("posts", "updatePost", body); done = true; m.close(); resolve(r.post); }
        catch (err) { btn.disabled = false; UI.toast(err.message); }
      }
      f.addEventListener("submit", function (e) { e.preventDefault(); });
      var m = window.TMN_MODAL.open({
        title: "Edit post", size: "sm", body: f,
        actions: [
          { label: "Cancel", cls: "btn-ghost", onClick: function () { done = true; m.close(); resolve(null); } },
          { label: "Save", cls: "btn-primary", onClick: function (api, btn) { save(api, btn); } }
        ],
        onClose: function () { if (!done) resolve(null); }
      });
    });
  }

  window.TMN_POSTS_UI = { tiles: tiles, num: num, markViewed: markViewed, open: open, edit: edit, ago: ago, when: when, short: short, VIS: VIS };
})();
