/* TigoMeNote · pages/explore.js (app/explore.html)
   Feed mula sa posts-fast "feed": Public ng lahat + Followers-only ng fina-follow mo + sarili mong posts.
   Ang naka-schedule ay hindi lalabas hangga't hindi pa oras (server ang nagbabantay). */
(function () {
  var UI = window.TMN_UI, PU = window.TMN_POSTS_UI;
  var $ = function (id) { return document.getElementById(id); };
  var posts = [], filter = "all", term = "", busy = false, end = false, loaded = false;
  var PAGE = 30;

  function shown() {
    var t = term.toLowerCase();
    return posts.filter(function (p) {
      if (filter === "mine" && !p.mine) return false;
      if (filter === "photo" && !p.media.some(function (m) { return m.kind === "photo"; })) return false;
      if (filter === "video" && !p.media.some(function (m) { return m.kind === "video"; })) return false;
      if (t) {
        var a = p.author || {};
        var hay = ((p.caption || "") + " @" + (a.username || "") + " " + (a.display_name || "")).toLowerCase();
        if (hay.indexOf(t) === -1) return false;
      }
      return true;
    });
  }
  function empty(title, text, btn) {
    $("grid").innerHTML = "";
    $("empty").classList.remove("hidden");
    $("emptyTitle").textContent = title; $("emptyText").textContent = text;
    $("emptyBtn").classList.toggle("hidden", !btn);
  }
  function render() {
    var list = shown();
    if (!list.length) {
      if (!posts.length) empty("Wala pang posts", "Ikaw na ang mauna! Pumili ng photo sa Gallery at pindutin ang Post.", true);
      else empty("Walang tugma", "Subukan ang ibang filter o search.", false);
    } else {
      $("empty").classList.add("hidden");
      $("grid").innerHTML = PU.tiles(list, { showAuthor: true, showVis: false });
    }
    $("more").classList.toggle("hidden", end || !posts.length);
  }
  async function load(more) {
    if (busy) return;
    if (!navigator.onLine) { if (!loaded) empty("Offline ka", "Lalabas ang Explore pag may internet na. Pwede ka pa ring mag-post — mase-save muna sa device.", true); return; }
    busy = true;
    if (!loaded) $("grid").innerHTML = new Array(13).join(".").split(".").map(function () { return '<div class="pt skel"></div>'; }).join("");
    $("more").disabled = true;
    try {
      var body = { limit: PAGE };
      if (more && posts.length) body.before = posts[posts.length - 1].publish_at;
      var r = await TMN_API.call("posts", "feed", body);
      var got = r.posts || [];
      posts = more ? posts.concat(got.filter(function (p) { return !posts.some(function (x) { return x.id === p.id; }); })) : got;
      end = got.length < PAGE; loaded = true;
      render();
    } catch (err) {
      if (!loaded) empty("Hindi ma-load", err.message, false); else UI.toast(err.message);
    } finally { busy = false; $("more").disabled = false; }
  }

  $("grid").addEventListener("click", function (e) {
    var t = e.target.closest("[data-pi]"); if (!t) return;
    PU.open(shown(), Number(t.dataset.pi), { onChange: function (ch) {
      if (ch.type === "delete") posts = posts.filter(function (p) { return p.id !== ch.id; });
      if (ch.type === "update") posts = posts.map(function (p) { return p.id === ch.post.id ? ch.post : p; });
      render();
    } });
  });
  $("chips").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    this.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("active", x === c); x.setAttribute("aria-selected", String(x === c)); });
    filter = c.dataset.f; if (loaded) render();
  });
  var deb;
  $("q").addEventListener("input", function () { var v = this.value.trim(); clearTimeout(deb); deb = setTimeout(function () { term = v; if (loaded) render(); }, 150); });
  $("more").addEventListener("click", function () { load(true); });
  window.addEventListener("online", function () { load(false); });
  // Kapag may natapos na upload, i-refresh
  var lastDone = null;
  document.addEventListener("tmn:queue", async function () {
    var d = (await window.TMN_POSTQ.list()).filter(function (e) { return e.status === "done"; }).length;
    if (lastDone !== null && d > lastDone) load(false);
    lastDone = d;
  });

  load(false);
})();
