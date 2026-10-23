/* TigoMeNote · pages/profile.js (app/profile.html)
   Profile card + "Naka-pila sa device" (offline queue) + sariling posts mula sa server. */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, Q = window.TMN_POSTQ, PU = window.TMN_POSTS_UI;
  var $ = function (id) { return document.getElementById(id); };
  var posts = [], filter = "all", loaded = false, qUrls = [];

  function paint() {
    var u = window.TMN_USER || {};
    var av = $("pAvatar");
    if (u.avatar_url) av.innerHTML = '<img alt="" src="' + UI.esc(u.avatar_url) + '">';
    else av.textContent = UI.initials(u.display_name);
    $("pName").textContent = u.display_name || "";
    $("pUser").textContent = u.username ? "@" + u.username : "";
    $("pBio").textContent = u.bio || "";
    $("pRole").textContent = u.role || "";
    $("pJoined").textContent = u.created_at
      ? "Joined " + new Date(u.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : "";
  }
  paint();
  document.addEventListener("tmn:user", paint);

  // ---------- Naka-pila (device) ----------
  async function renderQueue() {
    var list = (await Q.list()).sort(function (a, b) { return b.createdAt - a.createdAt; });
    qUrls.forEach(function (u) { URL.revokeObjectURL(u); }); qUrls = [];
    $("qWrap").classList.toggle("hidden", !list.length);
    $("qNet").textContent = navigator.onLine ? "Online" : "Offline · ia-upload pag may internet";
    $("queue").innerHTML = list.map(function (e) {
      var thumb = e.cover ? (function () { var u = URL.createObjectURL(e.cover); qUrls.push(u); return '<img alt="" src="' + u + '">'; })() : I(e.files[0] && e.files[0].kind === "video" ? "video" : "image");
      var n = e.files.length, kinds = n + (n > 1 ? " items" : " item");
      var v = PU.VIS[e.visibility] || PU.VIS.public;
      var st = e.status === "uploading" ? '<span class="q-state uploading">' + I("refresh", "ic-sm spin") + "Ina-upload " + e.progress.done + "/" + e.progress.total + "</span>"
        : e.status === "done" ? '<span class="q-state done">' + I("check", "ic-sm") + (e.publishAt && new Date(e.publishAt) > new Date() ? "Na-upload · naka-schedule" : "Na-post") + "</span>"
        : e.status === "error" ? '<span class="q-state">' + I("info", "ic-sm") + "Hindi pa na-upload</span>"
        : '<span class="q-state">' + I("clock", "ic-sm") + (navigator.onLine ? "Naghihintay" : "Naghihintay ng internet") + "</span>";
      var sub = st + "<span>" + kinds + "</span><span>" + I(v[0], "ic-sm") + v[1] + "</span>" +
        (e.publishAt ? "<span>" + I("calendar", "ic-sm") + PU.short(e.publishAt) + "</span>" : "");
      var acts = e.status === "done" ? '<button class="icon-btn" type="button" data-q="clear" data-id="' + e.id + '" aria-label="Alisin">' + I("x") + "</button>"
        : (e.status === "error" ? '<button class="btn btn-ghost btn-sm" type="button" data-q="retry" data-id="' + e.id + '">' + I("refresh", "ic-sm") + "Retry</button>" : "") +
          (e.status !== "uploading" ? '<button class="icon-btn" type="button" data-q="cancel" data-id="' + e.id + '" aria-label="Cancel">' + I("trash") + "</button>" : "");
      return '<div class="q-item"><div class="q-thumb">' + thumb + '</div><div class="q-main">' +
        '<div class="q-title">' + (UI.esc(e.caption) || '<span class="faint">Walang caption</span>') + "</div>" +
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
      if (await TMN_MODAL.confirm("Alisin ang post na ito sa pila? Hindi ito ma-uupload. (Hindi mabubura sa Gallery.)", { okText: "Alisin", danger: true })) Q.cancel(id);
    }
  });
  document.addEventListener("tmn:queue", renderQueue);
  window.addEventListener("online", renderQueue); window.addEventListener("offline", renderQueue);

  // ---------- Posts (server) ----------
  function shown() {
    return posts.filter(function (p) {
      if (filter === "scheduled") return p.scheduled;
      if (filter === "photo") return p.media.some(function (m) { return m.kind === "photo"; });
      if (filter === "video") return p.media.some(function (m) { return m.kind === "video"; });
      return true;
    });
  }
  function renderPosts() {
    var list = shown();
    $("statPosts").textContent = posts.filter(function (p) { return !p.scheduled; }).length;
    $("postGrid").innerHTML = PU.tiles(list, { showVis: true });
    $("postGrid").classList.toggle("hidden", !list.length);
    $("postsEmpty").classList.toggle("hidden", !!list.length);
    if (!list.length && posts.length) {
      $("emptyTitle").textContent = filter === "scheduled" ? "Walang naka-schedule" : "Wala sa filter na ito";
      $("emptyText").textContent = "Subukan ang ibang filter.";
    }
  }
  async function loadPosts() {
    if (!navigator.onLine) {
      if (!loaded) { $("postGrid").innerHTML = ""; $("postsEmpty").classList.remove("hidden"); $("emptyTitle").textContent = "Offline ka"; $("emptyText").textContent = "Lalabas dito ang posts mo pag may internet na."; }
      return;
    }
    if (!loaded) $("postGrid").innerHTML = new Array(6).join(".").split(".").map(function () { return '<div class="pt skel"></div>'; }).join("");
    try {
      var r = await TMN_API.call("posts", "myPosts", { limit: 60 });
      posts = r.posts || []; loaded = true; renderPosts();
    } catch (err) {
      if (!loaded) { $("postGrid").innerHTML = ""; $("postsEmpty").classList.remove("hidden"); $("emptyTitle").textContent = "Hindi ma-load"; $("emptyText").textContent = err.message; }
    }
  }
  $("postGrid").addEventListener("click", function (e) {
    var t = e.target.closest("[data-pi]"); if (!t) return;
    var list = shown();
    PU.open(list.slice(), Number(t.dataset.pi), { onChange: function (ch) {
      if (ch.type === "delete") posts = posts.filter(function (p) { return p.id !== ch.id; });
      if (ch.type === "update") posts = posts.map(function (p) { return p.id === ch.post.id ? ch.post : p; });
      renderPosts();
    } });
  });
  $("postChips").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    this.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("active", x === c); x.setAttribute("aria-selected", String(x === c)); });
    filter = c.dataset.f; renderPosts();
  });
  window.addEventListener("online", function () { loadPosts(); });

  renderQueue();
  loadPosts();
})();
