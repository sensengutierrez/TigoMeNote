/* TigoMeNote · components/post-viewer.js
   Pang-display ng posts galing sa server (posts-fast). Ginagamit ng Profile at Explore.
     TMN_POSTS_UI.tiles(posts)                     → HTML ng grid tiles (data-pi = index)
     TMN_POSTS_UI.open(posts, index, { onChange({type:'delete',id}|{type:'update',post}) }) → full viewer (carousel, caption, Edit/Delete kung sa iyo)
   Kailangan: modal.js, api.js, app-shell.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var VIS = { public: ["globe", "Public"], followers: ["users", "Followers"], private: ["lock", "Ako lang"] };
  function esc(s) { return window.TMN_UI.esc(s); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function localInput(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function when(iso) { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
  function short(iso) { var d = new Date(iso); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "ngayon lang";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    if (s < 604800) return Math.floor(s / 86400) + "d";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function tiles(posts, opts) {
    opts = opts || {};
    return posts.map(function (p, i) {
      var m = p.media[0] || {};
      var inner = !m.url ? '<div class="pt-missing">' + I("image") + "</div>"
        : m.kind === "video" ? '<video src="' + esc(m.url) + '#t=0.1" muted playsinline preload="metadata"></video>'
        : '<img alt="" loading="lazy" src="' + esc(m.url) + '">';
      var badges = "";
      if (p.scheduled) badges += '<span class="pt-badge sched">' + I("clock", "ic-sm") + short(p.publish_at) + "</span>";
      if (opts.showVis && p.visibility !== "public") badges += '<span class="pt-badge">' + I(VIS[p.visibility][0], "ic-sm") + "</span>";
      var corner = (p.media.length > 1 ? '<span class="pt-corner">' + I("album", "ic-sm") + p.media.length + "</span>" : "") +
        (m.kind === "video" ? '<span class="pt-corner">' + I("play", "ic-sm") + "</span>" : "");
      return '<button type="button" class="pt' + (p.scheduled ? " is-sched" : "") + '" data-pi="' + i + '" aria-label="Open post">' + inner +
        '<span class="pt-top">' + corner + "</span>" + (badges ? '<span class="pt-badges">' + badges + "</span>" : "") +
        (opts.showAuthor && p.author ? '<span class="pt-author">@' + esc(p.author.username) + "</span>" : "") + "</button>";
    }).join("");
  }

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
      '<div class="pv-info"><div class="pv-author"></div><div class="pv-badges"></div><p class="pv-cap"></p>' +
        '<div class="pv-actions"></div></div>';
    var media = root.querySelector(".pv-media"), dots = root.querySelector(".pv-dots");
    var prev = root.querySelector(".prev"), next = root.querySelector(".next");

    function cur() { return posts[idx]; }
    function showSlide() {
      var p = cur(), m = p.media[slide] || {};
      media.innerHTML = !m.url ? '<div class="pt-missing">' + I("image", "ic-lg") + "<span>Hindi ma-load. Subukan ulit.</span></div>"
        : m.kind === "video" ? '<video src="' + esc(m.url) + '" controls playsinline autoplay></video>'
        : '<img alt="" src="' + esc(m.url) + '">';
      dots.innerHTML = p.media.length > 1 ? p.media.map(function (_, i) { return '<span class="' + (i === slide ? "on" : "") + '"></span>'; }).join("") : "";
      var hasPrev = slide > 0 || idx > 0, hasNext = slide < p.media.length - 1 || idx < posts.length - 1;
      prev.disabled = !hasPrev; next.disabled = !hasNext;
    }
    function show() {
      var p = cur(); if (!p) { modal.close(); return; }
      var a = p.author || {};
      root.querySelector(".pv-author").innerHTML =
        '<span class="avatar" style="--size:38px">' + (a.avatar_url ? '<img alt="" src="' + esc(a.avatar_url) + '">' : esc(UI.initials(a.display_name || a.username || "?"))) + "</span>" +
        "<div><b>" + esc(a.display_name || a.username || "") + '</b><div class="faint small">@' + esc(a.username || "") + " · " + (p.scheduled ? "naka-schedule" : ago(p.publish_at)) + "</div></div>";
      var v = VIS[p.visibility] || VIS.public;
      root.querySelector(".pv-badges").innerHTML =
        (p.mine ? '<span class="badge">' + I(v[0], "ic-sm") + v[1] + "</span>" : "") +
        (p.scheduled ? '<span class="badge badge-accent">' + I("clock", "ic-sm") + "Lalabas " + when(p.publish_at) + "</span>" : "");
      root.querySelector(".pv-cap").textContent = p.caption || "";
      root.querySelector(".pv-actions").innerHTML = p.mine
        ? '<button type="button" class="btn btn-ghost btn-sm" data-a="edit">' + I("edit", "ic-sm") + "Edit</button>" +
          '<button type="button" class="btn btn-danger btn-sm" data-a="delete">' + I("trash", "ic-sm") + "Delete</button>"
        : "";
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
        if (!(await MODAL.confirm("Burahin ang post na ito sa server? (Hindi kasama ang copy sa Gallery mo.)", { okText: "Delete", danger: true }))) return;
        try {
          await TMN_API.call("posts", "deletePost", { id: p.id });
          posts.splice(idx, 1); UI.toast("Nabura ang post.");
          if (o.onChange) o.onChange({ type: "delete", id: p.id });
          if (!posts.length) { modal.close(); return; }
          idx = Math.min(idx, posts.length - 1); slide = 0; show();
        } catch (err) { UI.toast(err.message); }
      }
      if (b.dataset.a === "edit") {
        var upd = await edit(p);
        if (upd) { posts[idx] = upd; UI.toast("Na-save."); if (o.onChange) o.onChange({ type: "update", post: upd }); show(); }
      }
    });

    modal = MODAL.open({
      title: "", size: "full", cls: "modal-viewer modal-post", body: root,
      onClose: function () { document.removeEventListener("keydown", onKey); }
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
        '<div class="field"><span class="pe-label">Sino ang makakakita</span><div class="segmented" data-g="vis">' +
          Object.keys(VIS).map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (k === vis) + '">' + I(VIS[k][0], "ic-sm") + VIS[k][1] + "</button>"; }).join("") +
        "</div></div>" +
        (p.scheduled
          ? '<div class="field"><span class="pe-label">Schedule</span><div class="segmented" data-g="when">' +
              '<button type="button" data-v="later" aria-pressed="true">' + I("calendar", "ic-sm") + "Naka-schedule</button>" +
              '<button type="button" data-v="now" aria-pressed="false">' + I("send", "ic-sm") + "Ipalabas ngayon</button></div>" +
              '<input class="input pc-date" type="datetime-local" value="' + localInput(d) + '"></div>'
          : "");
      var ta = f.querySelector("textarea"); ta.value = p.caption || "";
      var date = f.querySelector(".pc-date");
      f.addEventListener("click", function (e) {
        var b = e.target.closest(".segmented button"); if (!b) return;
        var g = b.parentNode.dataset.g;
        b.parentNode.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (g === "vis") vis = b.dataset.v;
        if (g === "when") { sched = b.dataset.v === "later"; date.classList.toggle("hidden", !sched); }
      });
      async function save(m, btn) {
        var body = { id: p.id, caption: ta.value.trim(), visibility: vis };
        if (p.scheduled) {
          if (sched) {
            var t = new Date(date.value);
            if (isNaN(t) || t.getTime() < Date.now() + 60000) { UI.toast("Dapat sa hinaharap ang schedule."); return; }
            body.publish_at = t.toISOString();
          } else body.publish_at = new Date().toISOString();
        }
        btn.disabled = true;
        try { var r = await TMN_API.call("posts", "updatePost", body); done = true; m.close(); resolve(r.post); }
        catch (err) { btn.disabled = false; UI.toast(err.message); }
      }
      f.addEventListener("submit", function (e) { e.preventDefault(); });
      var m = window.TMN_MODAL.open({
        title: "I-edit ang post", size: "sm", body: f,
        actions: [
          { label: "Cancel", cls: "btn-ghost", onClick: function () { done = true; m.close(); resolve(null); } },
          { label: "Save", cls: "btn-primary", onClick: function (api, btn) { save(api, btn); } }
        ],
        onClose: function () { if (!done) resolve(null); }
      });
    });
  }

  window.TMN_POSTS_UI = { tiles: tiles, open: open, edit: edit, ago: ago, when: when, short: short, VIS: VIS };
})();
