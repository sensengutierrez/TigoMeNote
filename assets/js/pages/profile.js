/* TigoMeNote · pages/profile.js (app/profile.html)
   Profile (cover, photo, edit) + "Naka-pila sa device" (offline queue) + sariling posts mula sa server. */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, Q = window.TMN_POSTQ, PU = window.TMN_POSTS_UI;
  var $ = function (id) { return document.getElementById(id); };
  var posts = [], filter = "all", loaded = false, qUrls = [];

  function paint() {
    var u = window.TMN_USER || {};
    var av = $("pAvatar");
    if (u.avatar_url) av.innerHTML = '<img alt="" src="' + UI.esc(u.avatar_url) + '">';
    else av.textContent = UI.initials(u.display_name);
    var bi = $("pBannerImg");
    if (u.banner_url) { if (bi.getAttribute("src") !== u.banner_url) bi.src = u.banner_url; bi.classList.remove("hidden"); }
    else { bi.removeAttribute("src"); bi.classList.add("hidden"); }
    $("pName").textContent = u.display_name || "";
    $("pUser").textContent = u.username ? "@" + u.username : "";
    $("pBio").textContent = u.bio || "";
    $("pRole").textContent = u.role || "";
    $("pJoined").textContent = u.created_at
      ? "Joined " + new Date(u.created_at).toLocaleDateString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "long", year: "numeric" })
      : "";
  }
  paint();
  document.addEventListener("tmn:user", paint);

  // ---------- Edit profile / palit ng larawan (components/profile-editor.js) ----------
  var PE = window.TMN_PROFILE_EDIT;
  $("editBtn").addEventListener("click", function () { PE.open(); });
  $("avatarBtn").addEventListener("click", function () { photoMenu("avatar"); });
  $("bannerBtn").addEventListener("click", function () { photoMenu("banner"); });
  // Kapag may larawan na: Palitan / Alisin. Kapag wala pa: diretso sa pili.
  function photoMenu(kind) {
    var u = window.TMN_USER || {};
    if (!u[kind + "_url"]) { PE.changePhoto(kind); return; }
    var body = document.createElement("div");
    body.className = "pick-list";
    body.innerHTML =
      '<button type="button" class="pick" data-a="change">' + I("camera") + "Change</button>" +
      '<button type="button" class="pick danger" data-a="remove">' + I("trash") + "Remove</button>";
    var m = TMN_MODAL.open({ title: kind === "avatar" ? "Profile photo" : "Cover photo", size: "sm", body: body });
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      m.close();
      if (b.dataset.a === "change") PE.changePhoto(kind); else PE.removePhoto(kind);
    });
  }
  // Kunin ang pinakabagong profile (cover photo + bilang ng followers)
  async function loadProfile() {
    if (!navigator.onLine) return;
    try {
      var r = await TMN_API.call("profile", "get", {});
      if (window.TMN_AUTH && TMN_AUTH.setUser) TMN_AUTH.setUser(Object.assign({}, window.TMN_USER || {}, r.user));
      $("statFollowers").textContent = r.counts.followers;
      $("statFollowing").textContent = r.counts.following;
      $("statLikes").textContent = PU.num(r.counts.likes || 0);
    } catch (e) {}
  }

  // ---------- Naka-pila (device) ----------
  async function renderQueue() {
    var list = (await Q.list()).sort(function (a, b) { return b.createdAt - a.createdAt; });
    qUrls.forEach(function (u) { URL.revokeObjectURL(u); }); qUrls = [];
    $("qWrap").classList.toggle("hidden", !list.length);
    $("qNet").textContent = navigator.onLine ? "Online" : "Offline · will upload when online";
    $("queue").innerHTML = list.map(function (e) {
      var thumb = e.cover ? (function () { var u = URL.createObjectURL(e.cover); qUrls.push(u); return '<img alt="" src="' + u + '">'; })() : I(e.files[0] && e.files[0].kind === "video" ? "video" : "image");
      var n = e.files.length, kinds = n + (n > 1 ? " items" : " item");
      var v = PU.VIS[e.visibility] || PU.VIS.public;
      var st = e.status === "uploading" ? '<span class="q-state uploading">' + I("refresh", "ic-sm spin") + "Uploading " + e.progress.done + "/" + e.progress.total + "</span>"
        : e.status === "done" ? '<span class="q-state done">' + I("check", "ic-sm") + (e.publishAt && new Date(e.publishAt) > new Date() ? "Uploaded · scheduled" : "Posted") + "</span>"
        : e.status === "error" ? '<span class="q-state">' + I("info", "ic-sm") + "Not uploaded yet</span>"
        : '<span class="q-state">' + I("clock", "ic-sm") + (navigator.onLine ? "Waiting" : "Waiting for internet") + "</span>";
      var sub = st + "<span>" + kinds + "</span><span>" + I(v[0], "ic-sm") + v[1] + "</span>" +
        (e.publishAt ? "<span>" + I("calendar", "ic-sm") + PU.short(e.publishAt) + "</span>" : "");
      var acts = e.status === "done" ? '<button class="icon-btn" type="button" data-q="clear" data-id="' + e.id + '" aria-label="Remove">' + I("x") + "</button>"
        : (e.status === "error" ? '<button class="btn btn-ghost btn-sm" type="button" data-q="retry" data-id="' + e.id + '">' + I("refresh", "ic-sm") + "Retry</button>" : "") +
          (e.status !== "uploading" ? '<button class="icon-btn" type="button" data-q="cancel" data-id="' + e.id + '" aria-label="Cancel">' + I("trash") + "</button>" : "");
      return '<div class="q-item"><div class="q-thumb">' + thumb + '</div><div class="q-main">' +
        '<div class="q-title">' + (UI.esc(e.caption) || '<span class="faint">No caption</span>') + "</div>" +
        '<div class="q-sub">' + sub + "</div>" +
        (e.status === "error" && e.error ? '<div class="q-sub err">' + UI.esc(e.error) + "</div>" : "") +
        (e.status === "uploading" ? '<div class="q-bar"><span style="width:' + Math.round(100 * e.progress.done / Math.max(1, e.progress.total)) + '%"></span></div>' : "") +
        '</div><div class="q-acts">' + acts + "</div></div>";
    }).join("");
    // Kapag may bagong natapos, i-refresh ang posts
    var doneIds = list.filter(function (e) { return e.status === "done"; }).map(function (e) { return e.id; }).join();
    if (loaded && doneIds !== renderQueue._done) loadPosts();
    renderQueue._done = doneIds;
  }
  $("queue").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-q]"); if (!b) return;
    var id = b.dataset.id;
    if (b.dataset.q === "retry") Q.retry(id);
    if (b.dataset.q === "clear") Q.cancel(id);
    if (b.dataset.q === "cancel") {
      if (await TMN_MODAL.confirm("Remove this post from the queue? It won't be uploaded. (It stays in your Gallery.)", { okText: "Remove", danger: true })) Q.cancel(id);
    }
  });
  document.addEventListener("tmn:queue", renderQueue);
  window.addEventListener("online", renderQueue); window.addEventListener("offline", renderQueue);

  // ---------- Posts (server) at mga tab na parang TikTok ----------
  // posts = sarili mong posts · private = "Only me" posts · reposts / saved / liked / history = galing sa server pag binuksan
  var tab = "posts", sort = "latest";
  try { sort = localStorage.getItem("tmnProfSort") || "latest"; } catch (e) {}
  $("pSort").value = sort;
  var remote = { reposts: null, saved: null, liked: null, history: null };
  var ACTION = { reposts: "reposts", saved: "bookmarks", liked: "liked", history: "history" };
  var EMPTY = {
    posts: ["No posts yet", null],
    private: ["No private posts", "Posts you set to “Only me” show here. Only you can see them."],
    reposts: ["No reposts yet", "Posts you repost from Explore show here."],
    saved: ["Nothing saved yet", "Tap the bookmark on a post in Explore to save it here."],
    liked: ["No likes yet", "Posts you react to in Explore show here."],
    history: ["Nothing viewed yet", "Posts you open or scroll past in Explore show here."]
  };
  var NOTE = { private: "Only you can see this tab.", liked: "Only you can see this tab.", saved: "Only you can see this tab.", history: "Recently viewed · only you can see this." };
  function score(p) { var s = p.stats || {}; return (s.views || 0) + 5 * (s.reactions || 0) + 8 * (s.comments || 0) + 10 * (s.reposts || 0); }
  function sorted(list) {
    var out = list.slice();
    if (sort === "oldest") out.sort(function (a, b) { return a.publish_at < b.publish_at ? -1 : 1; });
    else if (sort === "popular") out.sort(function (a, b) { return score(b) - score(a); });
    else out.sort(function (a, b) { return a.publish_at < b.publish_at ? 1 : -1; });
    // Naka-pin: laging una (sa Latest lang, gaya ng TikTok)
    if (sort === "latest") out.sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      if (a.pinned && b.pinned) return a.pinned_at < b.pinned_at ? 1 : -1;
      return 0;
    });
    return out;
  }
  function shown() {
    if (tab === "private") return sorted(posts.filter(function (p) { return p.visibility === "private"; }));
    if (tab !== "posts") return remote[tab] || [];
    return sorted(posts.filter(function (p) {
      if (filter === "scheduled") return p.scheduled;
      if (filter === "photo") return p.media.some(function (m) { return m.kind === "photo"; });
      if (filter === "video") return p.media.some(function (m) { return m.kind === "video"; });
      return true;
    }));
  }
  function renderPosts() {
    var list = shown(), mineTab = tab === "posts" || tab === "private";
    $("statPosts").textContent = posts.filter(function (p) { return !p.scheduled; }).length;
    $("postsHead").classList.toggle("hidden", !mineTab);
    $("postChips").classList.toggle("hidden", tab !== "posts");
    $("tabNote").textContent = NOTE[tab] || "";
    $("tabNote").classList.toggle("hidden", !NOTE[tab] || !list.length);
    $("postGrid").innerHTML = PU.tiles(list, { showVis: tab === "posts", showAuthor: !mineTab, pins: tab === "posts" && sort === "latest" });
    $("postGrid").classList.toggle("hidden", !list.length);
    $("postsEmpty").classList.toggle("hidden", !!list.length);
    var link = $("postsEmpty").querySelector(".btn");
    link.classList.toggle("hidden", tab !== "posts");
    if (list.length) return;
    if (tab === "posts" && posts.length) {
      $("emptyTitle").textContent = filter === "scheduled" ? "Nothing scheduled" : "Nothing in this filter";
      $("emptyText").textContent = "Try another filter.";
    } else if (tab === "posts") {
      if (!loaded) return;
      $("emptyTitle").textContent = EMPTY.posts[0];
      $("emptyText").innerHTML = "Pick a photo or video in Gallery, then tap <b>Post</b>. Works offline.";
    } else {
      var loading = !mineTab && remote[tab] === null;
      $("emptyTitle").textContent = loading ? "Loading…" : EMPTY[tab][0];
      $("emptyText").textContent = loading ? "" : EMPTY[tab][1];
    }
  }
  async function loadPosts() {
    if (!navigator.onLine) {
      if (!loaded) { $("postGrid").innerHTML = ""; $("postsEmpty").classList.remove("hidden"); $("emptyTitle").textContent = "You're offline"; $("emptyText").textContent = "Your posts will appear here once you're online."; }
      return;
    }
    if (!loaded) $("postGrid").innerHTML = new Array(6).join(".").split(".").map(function () { return '<div class="pt skel"></div>'; }).join("");
    try {
      var r = await TMN_API.call("posts", "myPosts", { limit: 60 });
      posts = r.posts || []; loaded = true; renderPosts();
    } catch (err) {
      if (!loaded) { $("postGrid").innerHTML = ""; $("postsEmpty").classList.remove("hidden"); $("emptyTitle").textContent = "Couldn't load"; $("emptyText").textContent = err.message; }
    }
  }
  async function loadTab(t) {
    if (!navigator.onLine) { if (remote[t] === null) { remote[t] = []; } if (tab === t) renderPosts(); return; }
    try { var r = await TMN_API.call("posts", ACTION[t], {}); remote[t] = r.posts || []; }
    catch (e) { if (remote[t] === null) remote[t] = []; UI.toast(e.message); }
    if (tab === t) renderPosts();
  }
  function replaceIn(list, np) { return list ? list.map(function (p) { return p.id === np.id ? np : p; }) : list; }
  $("postGrid").addEventListener("click", function (e) {
    var t = e.target.closest("[data-pi]"); if (!t) return;
    var list = shown();
    PU.open(list.slice(), Number(t.dataset.pi), { onChange: function (ch) {
      if (ch.type === "delete") {
        posts = posts.filter(function (p) { return p.id !== ch.id; });
        Object.keys(remote).forEach(function (k) { if (remote[k]) remote[k] = remote[k].filter(function (p) { return p.id !== ch.id; }); });
      }
      if (ch.type === "update") {
        var np = ch.post;
        posts = replaceIn(posts, np);
        Object.keys(remote).forEach(function (k) { remote[k] = replaceIn(remote[k], np); });
        var st = np.stats || {};
        if (remote.saved && !st.bookmarked) remote.saved = remote.saved.filter(function (p) { return p.id !== np.id; });
        if (remote.liked && !st.my_reaction) remote.liked = remote.liked.filter(function (p) { return p.id !== np.id; });
        if (remote.reposts && !st.reposted) remote.reposts = remote.reposts.filter(function (p) { return p.id !== np.id; });
      }
      renderPosts();
    } });
  });
  $("pTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-t]"); if (!b || b.dataset.t === tab) return;
    this.querySelectorAll("[data-t]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
    tab = b.dataset.t;
    renderPosts();
    if (ACTION[tab]) loadTab(tab); // laging kunin ang pinakabago
  });
  $("postChips").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    this.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("active", x === c); x.setAttribute("aria-pressed", String(x === c)); });
    filter = c.dataset.f; renderPosts();
  });
  $("pSort").addEventListener("change", function () {
    sort = this.value; try { localStorage.setItem("tmnProfSort", sort); } catch (e) {}
    renderPosts();
  });
  // Followers / Following list
  document.querySelector(".p-hero .stats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-list]"); if (!b || !window.TMN_SOCIAL) return;
    var u = window.TMN_USER || {};
    TMN_SOCIAL.followList({ id: u.id, username: u.username }, b.dataset.list);
  });
  window.addEventListener("online", function () { loadPosts(); if (ACTION[tab]) loadTab(tab); });

  renderQueue();
  loadPosts();
  loadProfile();
})();
