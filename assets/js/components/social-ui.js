/* TigoMeNote · components/social-ui.js
   Mga "sheet" at helper para sa social features (ginagamit ng post-card, Explore, Profile):
     TMN_SOCIAL.commentsSheet(post, onCount)   comments + sulat ng comment
     TMN_SOCIAL.whoSheet(post, "reactions"|"shares")   sino ang nag-react / nag-repost / nag-share
     TMN_SOCIAL.shareMenu(post, onUpdate)      Repost / Undo repost / Copy link / Share sa ibang app
     TMN_SOCIAL.shareLink(post, onUpdate)
     TMN_SOCIAL.follow(userId, on) → true/false
     TMN_SOCIAL.userSheet(userId)              mini profile ng user (cover, follow, posts)
     TMN_SOCIAL.peopleHtml(list) / bindPeople(el)
     TMN_SOCIAL.postMenu(post, api)            ⋯ menu: copy link, edit/delete (kung sa iyo)
   Kailangan: api.js, modal.js, post-viewer.js (TMN_POSTS_UI), post-card.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  function UI() { return window.TMN_UI; }
  function esc(s) { return UI().esc(s); }
  function av(u, s) { return window.TMN_POST_CARD.avatar(u, s); }
  function ago(iso) { return window.TMN_POSTS_UI.ago(iso); }
  function postLink(p) { return (window.TMN_CONFIG.root || "/") + "app/explore.html?post=" + encodeURIComponent(p.id); }
  var followState = {}; // userId → true/false (para pare-pareho sa buong page)

  function userRow(u, right) {
    u = u || {};
    return '<div class="sx-row"><button type="button" class="sx-user" data-sx="user" data-uid="' + esc(u.id || "") + '">' + av(u, 40) +
      '<span><b>' + esc(u.display_name || u.username || "?") + '</b><span class="faint small">@' + esc(u.username || "") + "</span></span></button>" + (right || "") + "</div>";
  }
  // Estado ng follow: true (Following), false (Follow), "requested" (private account, naghihintay ng approval)
  function stateOf(u) {
    if (followState[u.id] !== undefined) return followState[u.id];
    return u.following ? true : u.requested ? "requested" : false;
  }
  function paintFollow(x, st) {
    x.dataset.on = String(st);
    x.textContent = st === true ? "Following" : st === "requested" ? "Requested" : "Follow";
    x.classList.toggle("btn-primary", st === false); x.classList.toggle("btn-ghost", st !== false);
  }
  function followBtn(u) {
    var me = (window.TMN_USER || {}).id;
    if (!u || !u.id || u.id === me) return "";
    var st = stateOf(u);
    return '<button type="button" class="btn btn-sm ' + (st !== false ? "btn-ghost" : "btn-primary") + ' sx-follow" data-sx="follow" data-uid="' + esc(u.id) + '" data-on="' + st + '">' +
      (st === true ? "Following" : st === "requested" ? "Requested" : "Follow") + "</button>";
  }

  // Ibinabalik: true / "requested" / false kapag nag-follow; false kapag nag-unfollow; null kapag may error
  async function follow(uid, on) {
    if (!navigator.onLine) { UI().toast("You need internet."); return null; }
    try {
      var r = await TMN_API.call("social", on ? "follow" : "unfollow", { user_id: uid });
      var st = on ? (r.requested ? "requested" : true) : false;
      followState[uid] = st;
      if (st === "requested") UI().toast("Follow request sent.");
      document.dispatchEvent(new CustomEvent("tmn:follow", { detail: { id: uid, on: st === true, requested: st === "requested" } }));
      return st === false ? false : st;
    } catch (e) { UI().toast(e.message); return null; }
  }
  // Isang listener para sa follow/user buttons sa loob ng isang element
  function bindPeople(el) {
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-sx]"); if (!b) return;
      if (b.dataset.sx === "user") { userSheet(b.dataset.uid); return; }
      if (b.dataset.sx === "follow") {
        var on = b.dataset.on === "false";
        if (b.dataset.on === "true" && !(await TMN_MODAL.confirm("Unfollow?", { okText: "Unfollow", danger: true }))) return;
        b.disabled = true;
        var st = await follow(b.dataset.uid, on);
        if (st !== null) document.querySelectorAll('.sx-follow[data-uid="' + b.dataset.uid + '"]').forEach(function (x) { paintFollow(x, st); });
        b.disabled = false;
      }
    });
  }
  function peopleHtml(list, empty) {
    if (!list.length) return '<p class="faint small sx-empty">' + (empty || "Nothing yet.") + "</p>";
    return list.map(function (u) { return userRow(u, followBtn(u)); }).join("");
  }

  // ---------- Comments ----------
  function commentsSheet(p, onCount) {
    var me = window.TMN_USER || {};
    var root = document.createElement("div");
    root.className = "sx-comments";
    root.innerHTML =
      (p.caption ? '<div class="sx-c sx-cap">' + av(p.author, 34) + '<div><b>' + esc((p.author || {}).username || "") + "</b> " + esc(p.caption) +
        '<div class="faint small">' + ago(p.publish_at) + "</div></div></div>" : "") +
      '<div class="sx-list" aria-live="polite"><div class="sx-loading faint small">Loading…</div></div>' +
      '<form class="sx-write">' + av(me, 32) +
        '<textarea class="input" rows="1" maxlength="500" placeholder="Add a comment…"></textarea>' +
        '<button type="submit" class="btn btn-primary btn-sm" disabled>Post</button></form>';
    var list = root.querySelector(".sx-list"), ta = root.querySelector("textarea"), send = root.querySelector("[type=submit]");
    var count = 0;
    function row(c) {
      return '<div class="sx-c" data-cid="' + esc(c.id) + '">' + '<button type="button" class="sx-av" data-sx="user" data-uid="' + esc((c.user || {}).id || "") + '">' + av(c.user, 34) + "</button>" +
        '<div class="sx-cbody"><b data-sx="user" data-uid="' + esc((c.user || {}).id || "") + '">' + esc((c.user || {}).username || "") + "</b> " + esc(c.body) +
        '<div class="faint small">' + ago(c.at) + (c.can_delete ? ' · <button type="button" class="link-btn small" data-del="' + esc(c.id) + '">Delete</button>' : "") + "</div></div></div>";
    }
    async function load() {
      try {
        var r = await TMN_API.call("posts", "comments", { post_id: p.id });
        count = r.list.length;
        list.innerHTML = r.list.length ? r.list.map(row).join("") : '<p class="faint small sx-empty">No comments yet. Be the first!</p>';
        list.scrollTop = list.scrollHeight;
      } catch (e) { list.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
    }
    ta.addEventListener("input", function () {
      send.disabled = !ta.value.trim();
      ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px";
    });
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover: hover)").matches) { e.preventDefault(); root.querySelector("form").requestSubmit(); } });
    root.querySelector("form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var body = ta.value.trim(); if (!body) return;
      if (!navigator.onLine) { UI().toast("Offline: the comment can't be sent."); return; }
      send.disabled = true;
      try {
        var r = await TMN_API.call("posts", "addComment", { post_id: p.id, body: body });
        var empty = list.querySelector(".sx-empty"); if (empty) empty.remove();
        list.insertAdjacentHTML("beforeend", row(r.comment));
        list.scrollTop = list.scrollHeight;
        ta.value = ""; ta.style.height = "auto"; count++;
        if (onCount) onCount(count);
      } catch (err) { UI().toast(err.message); send.disabled = false; }
    });
    list.addEventListener("click", async function (e) {
      var d = e.target.closest("[data-del]");
      if (d) {
        if (!(await TMN_MODAL.confirm("Delete this comment?", { okText: "Delete", danger: true }))) return;
        try { await TMN_API.call("posts", "deleteComment", { id: d.dataset.del }); d.closest(".sx-c").remove(); count--; if (onCount) onCount(count); }
        catch (err) { UI().toast(err.message); }
        return;
      }
      var u = e.target.closest('[data-sx="user"]'); if (u && u.dataset.uid) { m.close(); userSheet(u.dataset.uid); }
    });
    var m = TMN_MODAL.open({ title: "Comments", size: "md", cls: "modal-sheet sx-sheet", body: root });
    load();
    setTimeout(function () { ta.focus({ preventScroll: true }); }, 250);
    return m;
  }

  // ---------- Sino ang nag-react / nag-share ----------
  function whoSheet(p, tab) {
    var root = document.createElement("div");
    root.className = "sx-who";
    root.innerHTML =
      '<div class="segmented sx-tabs"><button type="button" data-tab="reactions">' + I("heart", "ic-sm") + "Reactions</button>" +
      '<button type="button" data-tab="shares">' + I("repost", "ic-sm") + "Shares</button></div>" +
      '<div class="sx-filter chips"></div><div class="sx-people"></div>';
    var body = root.querySelector(".sx-people"), filt = root.querySelector(".sx-filter");
    var cache = {}, cur = tab || "reactions", emoji = "all";
    function paint() {
      root.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tab === cur)); });
      var l = cache[cur];
      if (!l) { body.innerHTML = '<p class="faint small sx-empty">Loading…</p>'; filt.innerHTML = ""; return; }
      if (cur === "reactions") {
        var counts = {}; l.forEach(function (r) { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        filt.innerHTML = '<button type="button" class="chip' + (emoji === "all" ? " active" : "") + '" data-emoji="all">All ' + l.length + "</button>" +
          Object.keys(counts).map(function (e) { return '<button type="button" class="chip' + (emoji === e ? " active" : "") + '" data-emoji="' + e + '">' + e + " " + counts[e] + "</button>"; }).join("");
        var shown = l.filter(function (r) { return emoji === "all" || r.emoji === emoji; });
        body.innerHTML = shown.length ? shown.map(function (r) { return userRow(r.user, '<span class="sx-emo">' + r.emoji + "</span>"); }).join("") : '<p class="faint small sx-empty">No reactions yet.</p>';
      } else {
        filt.innerHTML = "";
        body.innerHTML = l.length ? l.map(function (r) {
          return userRow(r.user, '<span class="faint small sx-kind">' + (r.kind === "repost" ? I("repost", "ic-sm") + "Repost" : I("link", "ic-sm") + "Link") + " · " + ago(r.at) + "</span>");
        }).join("") : '<p class="faint small sx-empty">No shares yet.</p>';
      }
    }
    async function load(t) {
      if (cache[t]) return paint();
      paint();
      try { var r = await TMN_API.call("posts", t === "reactions" ? "reactions" : "shares", { post_id: p.id }); cache[t] = r.list; }
      catch (e) { cache[t] = []; UI().toast(e.message); }
      if (t === cur) paint();
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]"); if (b) { cur = b.dataset.tab; emoji = "all"; load(cur); return; }
      var c = e.target.closest("[data-emoji]"); if (c) { emoji = c.dataset.emoji; paint(); return; }
      var u = e.target.closest('[data-sx="user"]'); if (u && u.dataset.uid) { m.close(); userSheet(u.dataset.uid); }
    });
    var m = TMN_MODAL.open({ title: "Reactions and shares", size: "sm", cls: "modal-sheet", body: root });
    load(cur);
    return m;
  }

  // ---------- Share ----------
  async function shareLink(p, onUpdate) {
    var url = new URL(postLink(p), location.href).href;
    var done = false;
    if (navigator.share) {
      try { await navigator.share({ title: "TigoMeNote", text: p.caption ? p.caption.slice(0, 80) : "Check out this post", url: url }); done = true; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    if (!done) {
      try { await navigator.clipboard.writeText(url); done = true; UI().toast("Link copied ✓"); }
      catch (e) { TMN_MODAL.prompt("Copy the link", { value: url, okText: "OK", maxLength: 500 }); done = true; }
    }
    if (done && navigator.onLine) {
      try { var r = await TMN_API.call("posts", "share", { post_id: p.id, kind: "link" }); if (onUpdate && r.post) onUpdate(r.post); } catch (e) {}
    }
  }
  function shareMenu(p, onUpdate) {
    var s = p.stats || {};
    var body = document.createElement("div");
    body.className = "pick-list";
    var canRepost = !p.mine && p.visibility === "public";
    body.innerHTML =
      (canRepost ? '<button type="button" class="pick" data-a="repost">' + I("repost") + (s.reposted ? "Undo repost" : "Repost to your followers") + "</button>" : "") +
      '<button type="button" class="pick" data-a="link">' + I("send") + "Share link (copy / other apps)</button>" +
      '<button type="button" class="pick" data-a="who">' + I("users") + "Who shared (" + (s.shares || 0) + ")</button>" +
      (!canRepost && !p.mine ? '<p class="faint small">Only public posts can be reposted.</p>' : "");
    var m = TMN_MODAL.open({ title: "Share", size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      m.close();
      if (b.dataset.a === "link") return shareLink(p, onUpdate);
      if (b.dataset.a === "who") return whoSheet(p, "shares");
      if (!navigator.onLine) { UI().toast("You need internet."); return; }
      try {
        var r = await TMN_API.call("posts", s.reposted ? "unrepost" : "share", { post_id: p.id, kind: "repost" });
        UI().toast(s.reposted ? "Repost removed." : "Reposted ✓ Your followers will see it.");
        if (onUpdate && r.post) onUpdate(r.post);
      } catch (err) { UI().toast(err.message); }
    });
  }

  // ---------- ⋯ menu ng post ----------
  function postMenu(p, api) {
    var body = document.createElement("div");
    body.className = "pick-list";
    body.innerHTML =
      '<button type="button" class="pick" data-a="open">' + I("image") + "Open post</button>" +
      '<button type="button" class="pick" data-a="copy">' + I("link") + "Copy link</button>" +
      (p.mine && !p.scheduled ? '<button type="button" class="pick" data-a="pin">' + I("pin") + (p.pinned ? "Unpin from profile" : "Pin to profile") + "</button>" : "") +
      (p.mine ? '<button type="button" class="pick" data-a="edit">' + I("edit") + "Edit</button>" +
        '<button type="button" class="pick danger" data-a="delete">' + I("trash") + "Delete</button>" : "") +
      (!p.mine && p.author ? '<button type="button" class="pick" data-a="user">' + I("user") + "View @" + esc(p.author.username) + "</button>" : "");
    var m = TMN_MODAL.open({ title: "Post", size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      m.close();
      var a = b.dataset.a;
      if (a === "open") TMN_POSTS_UI.open([p], 0, { onChange: function (ch) { if (api && api.changed) api.changed(ch); } });
      if (a === "copy") {
        var url = new URL(postLink(p), location.href).href;
        try { await navigator.clipboard.writeText(url); UI().toast("Link copied ✓"); } catch (err) { TMN_MODAL.prompt("Copy the link", { value: url, okText: "OK", maxLength: 500 }); }
      }
      if (a === "user") userSheet(p.author.id);
      if (a === "pin") {
        try {
          var pr = await TMN_API.call("posts", "pin", { id: p.id, on: !p.pinned });
          UI().toast(pr.post.pinned ? "Pinned to your profile." : "Unpinned.");
          if (api && api.changed) api.changed({ type: "update", post: Object.assign({}, p, pr.post, { repost_by: p.repost_by }) });
        } catch (err) { UI().toast(err.message); }
      }
      if (a === "edit") { var upd = await TMN_POSTS_UI.edit(p); if (upd && api && api.changed) api.changed({ type: "update", post: Object.assign({}, p, upd, { repost_by: p.repost_by }) }); }
      if (a === "delete") {
        if (!(await TMN_MODAL.confirm("Delete this post?", { okText: "Delete", danger: true }))) return;
        try { await TMN_API.call("posts", "deletePost", { id: p.id }); UI().toast("Post deleted."); if (api && api.changed) api.changed({ type: "delete", id: p.id }); }
        catch (err) { UI().toast(err.message); }
      }
    });
  }

  // ---------- Mini profile ng ibang user ----------
  async function userSheet(uid) {
    if (!uid) return;
    var root = document.createElement("div");
    root.className = "sx-profile";
    root.innerHTML = '<p class="faint small sx-empty">Loading…</p>';
    var m = TMN_MODAL.open({ title: "", size: "lg", cls: "modal-sheet sx-prof-modal", body: root });
    try {
      var r = await TMN_API.call("social", "profile", { user_id: uid });
      var u = r.user, c = r.counts;
      if (followState[u.id] !== undefined) u.following = followState[u.id];
      root.innerHTML =
        '<div class="sx-cover">' + (u.banner_url ? '<img alt="" src="' + esc(u.banner_url) + '">' : "") + "</div>" +
        '<div class="sx-phead">' + av(u, 88) +
          '<div class="sx-pname"><h3>' + esc(u.display_name) + (u.private_account ? " " + I("lock", "ic-sm") : "") + '</h3><span class="faint">@' + esc(u.username) + (u.follows_you ? ' · <span class="badge">Follows you</span>' : "") + "</span></div>" +
          (u.me ? '<a class="btn btn-ghost btn-sm" href="profile.html">' + I("user", "ic-sm") + "My profile</a>" : followBtn(u)) + "</div>" +
        (u.bio ? '<p class="sx-bio">' + esc(u.bio) + "</p>" : "") +
        '<div class="sx-stats"><span><b>' + c.posts + "</b> posts</span>" +
          '<button type="button" data-list="followers"><b>' + c.followers + "</b> followers</button>" +
          '<button type="button" data-list="following"><b>' + c.following + "</b> following</button>" +
          '<span><b>' + TMN_POSTS_UI.num(c.likes || 0) + "</b> likes</span></div>" +
        '<div class="post-grid sx-grid"><div class="pt skel"></div><div class="pt skel"></div><div class="pt skel"></div></div>';
      bindPeople(root);
      root.addEventListener("click", function (e) {
        var l = e.target.closest("[data-list]"); if (l) followList(u, l.dataset.list);
      });
      var pr = await TMN_API.call("posts", "userPosts", { user_id: u.id, limit: 30 });
      var grid = root.querySelector(".sx-grid"), posts = pr.posts || [];
      grid.innerHTML = posts.length ? TMN_POSTS_UI.tiles(posts, {}) : "";
      if (!posts.length) grid.outerHTML = pr.private
        ? '<div class="sx-private">' + I("lock") + "<b>This account is private</b><span class=\"faint small\">Follow to see their posts.</span></div>"
        : '<p class="faint small sx-empty">' + (u.following || u.me ? "No posts yet." : "No public posts yet. Follow to see followers-only posts.") + "</p>";
      else grid.addEventListener("click", function (e) { var t = e.target.closest("[data-pi]"); if (t) TMN_POSTS_UI.open(posts, Number(t.dataset.pi), {}); });
    } catch (e) { root.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
    return m;
  }
  async function followList(u, which) {
    var body = document.createElement("div");
    body.className = "sx-people";
    body.innerHTML = '<p class="faint small sx-empty">Loading…</p>';
    TMN_MODAL.open({ title: (which === "followers" ? "Followers" : "Following") + " · @" + u.username, size: "sm", cls: "modal-sheet", body: body });
    bindPeople(body);
    try { var r = await TMN_API.call("social", "followList", { user_id: u.id, which: which }); body.innerHTML = peopleHtml(r.list, "Nothing yet."); }
    catch (e) { body.innerHTML = '<p class="faint small sx-empty">' + esc(e.message) + "</p>"; }
  }

  window.TMN_SOCIAL = {
    commentsSheet: commentsSheet, whoSheet: whoSheet, shareMenu: shareMenu, shareLink: shareLink, postMenu: postMenu,
    follow: follow, userSheet: userSheet, followList: followList, peopleHtml: peopleHtml, bindPeople: bindPeople, postLink: postLink
  };
})();
