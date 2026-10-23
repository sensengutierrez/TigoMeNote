/* TigoMeNote · pages/explore.js (app/explore.html)
   Explore na parang Instagram: Status sa taas, feed ng posts (Para sa iyo / Following),
   at sa gilid (desktop): hanap ng tao + suggestions. Sa phone: ang search button sa itaas.
   Link ng isang post: explore.html?post=<id> → bubukas ang post na iyon.
   Gamit: post-card.js (cards), social-ui.js (comments, share, follow, profile), stories.js */
(function () {
  var UI = window.TMN_UI, PC = window.TMN_POST_CARD, S = window.TMN_SOCIAL;
  var $ = function (id) { return document.getElementById(id); };
  var posts = [], mode = "all", busy = false, more = false, loaded = false;
  try { mode = localStorage.getItem("tmnFeedMode") || "all"; } catch (e) {}

  // ---------- Status ----------
  window.TMN_STORIES.mount($("stories"));

  // ---------- Feed ----------
  var api = {
    find: function (id) { return posts.filter(function (p) { return p.id === id; })[0] || extra[id]; },
    update: function (np) { posts = posts.map(function (p) { return p.id === np.id ? np : p; }); if (extra[np.id]) extra[np.id] = np; },
    changed: function (ch) {
      if (ch.type === "delete") { posts = posts.filter(function (p) { return p.id !== ch.id; }); render(); }
      if (ch.type === "update") { api.update(ch.post); render(); }
    }
  };
  var extra = {}; // posts na binuksan mula sa link (wala sa feed)
  PC.bind($("feed"), api);

  function empty(title, text, btn) {
    $("feed").innerHTML = "";
    $("empty").classList.remove("hidden");
    $("emptyTitle").textContent = title; $("emptyText").textContent = text;
    $("emptyBtn").classList.toggle("hidden", !btn);
  }
  function skeleton() {
    return new Array(3).join(".").split(".").map(function () {
      return '<div class="pcard pcard-skel"><div class="pcard-head"><span class="avatar skel" style="--size:38px"></span><span class="skel" style="width:140px;height:12px"></span></div><div class="skel" style="aspect-ratio:1"></div><div class="pcard-actions"><span class="skel" style="width:180px;height:14px"></span></div></div>';
    }).join("");
  }
  function render() {
    if (!posts.length) {
      if (mode === "following") empty("Nothing in Following yet", "Follow people from Suggestions to see their posts and reposts here.", false);
      else empty("No posts yet", "Be the first! Pick a photo in Gallery and tap Post.", true);
    } else {
      $("empty").classList.add("hidden");
      $("feed").innerHTML = posts.map(PC.html).join("");
    }
    $("more").classList.toggle("hidden", !more || !posts.length);
  }
  async function load(next) {
    if (busy) return;
    if (!navigator.onLine) { if (!loaded) empty("You're offline", "Explore will load once you're online. You can still post — it will be saved on your device first.", true); return; }
    busy = true;
    if (!next) { $("feed").innerHTML = skeleton(); $("empty").classList.add("hidden"); }
    $("more").disabled = true;
    try {
      var body = { mode: mode, limit: 15 };
      if (next && posts.length) body.before = posts[posts.length - 1].feed_at || posts[posts.length - 1].publish_at;
      var r = await TMN_API.call("posts", "feed", body);
      var got = (r.posts || []).filter(function (p) { return !posts.some(function (x) { return next && x.id === p.id; }); });
      posts = next ? posts.concat(got) : got;
      more = !!r.more; loaded = true;
      if (next) { $("feed").insertAdjacentHTML("beforeend", got.map(PC.html).join("")); $("more").classList.toggle("hidden", !more); }
      else render();
    } catch (err) {
      if (!loaded) empty("Couldn't load", err.message, false); else UI.toast(err.message);
    } finally { busy = false; $("more").disabled = false; }
  }
  function paintTabs() { $("tabs").querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); }); }
  $("tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mode]"); if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode; paintTabs();
    try { localStorage.setItem("tmnFeedMode", mode); } catch (er) {}
    posts = []; loaded = false; load(false);
  });
  $("more").addEventListener("click", function () { load(true); });
  // Kusang mag-load pa pag malapit na sa dulo
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting && more && !busy) load(true); }, { rootMargin: "600px" }).observe($("more").parentNode);
  }
  window.addEventListener("online", function () { load(false); });
  // Kapag may natapos na upload ng sarili mong post, i-refresh
  var lastDone = null;
  document.addEventListener("tmn:queue", async function () {
    var d = (await window.TMN_POSTQ.list()).filter(function (e) { return e.status === "done"; }).length;
    if (lastDone !== null && d > lastDone) load(false);
    lastDone = d;
  });
  // Kapag nag-follow: alisin ang Follow button sa ibang card ng parehong tao
  document.addEventListener("tmn:follow", function (e) {
    posts.forEach(function (p) { if (p.author && p.author.id === e.detail.id) p.author.following = e.detail.on; });
    document.querySelectorAll('.pc-follow[data-uid="' + e.detail.id + '"]').forEach(function (b) { if (e.detail.on) b.remove(); });
  });

  // ---------- People: search + suggestions ----------
  S.bindPeople($("sugg")); S.bindPeople($("results"));
  async function suggestions() {
    if (!navigator.onLine) return;
    try { var r = await TMN_API.call("social", "people", {}); $("sugg").innerHTML = S.peopleHtml(r.list, "You're following everyone 🎉"); }
    catch (e) { $("sugg").innerHTML = '<p class="faint small sx-empty">' + UI.esc(e.message) + "</p>"; }
  }
  var deb, lastQ = "";
  function searchInto(input, out) {
    input.addEventListener("input", function () {
      var v = input.value.trim(); clearTimeout(deb);
      if (!v) { out.classList.add("hidden"); out.innerHTML = ""; return; }
      deb = setTimeout(async function () {
        lastQ = v;
        try {
          var r = await TMN_API.call("social", "people", { q: v.replace(/^@/, "") });
          if (lastQ !== v) return;
          out.innerHTML = S.peopleHtml(r.list, "No results for \"" + UI.esc(v) + "\"."); out.classList.remove("hidden");
        } catch (e) { out.innerHTML = '<p class="faint small sx-empty">' + UI.esc(e.message) + "</p>"; out.classList.remove("hidden"); }
      }, 250);
    });
  }
  searchInto($("q"), $("results"));
  // Phone: search sheet (wala ang side panel sa itaas)
  $("findBtn").addEventListener("click", function () {
    var body = document.createElement("div");
    body.className = "ex-find-sheet";
    body.innerHTML = '<label class="search"><input class="input" type="search" placeholder="Name or @username" autofocus></label>' +
      '<div class="ex-results hidden"></div><h4 class="faint small">Suggestions</h4><div class="ex-sugg">' + $("sugg").innerHTML + "</div>";
    S.bindPeople(body);
    searchInto(body.querySelector("input"), body.querySelector(".ex-results"));
    TMN_MODAL.open({ title: "Search people", size: "sm", cls: "modal-sheet", body: body });
  });

  // ---------- ?post=<id> ----------
  async function openFromLink() {
    var id = new URLSearchParams(location.search).get("post"); if (!id) return;
    try {
      var r = await TMN_API.call("posts", "getPost", { id: id });
      extra[r.post.id] = r.post;
      var wrap = document.createElement("div");
      wrap.className = "feed feed-single";
      wrap.innerHTML = PC.html(r.post);
      PC.bind(wrap, api);
      TMN_MODAL.open({ title: "Post", size: "md", cls: "modal-sheet", body: wrap, onClose: function () { history.replaceState(null, "", location.pathname); } });
    } catch (e) { UI.toast(e.message); }
  }

  paintTabs();
  load(false);
  suggestions();
  openFromLink();
})();
