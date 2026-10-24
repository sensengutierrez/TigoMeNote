/* TigoMeNote · components/media-viewer.js — buong-screen na tingin ng photo, video at mapa ng route
     TMN_VIEWER.open(items, index)   items = [{ kind: "photo"|"video", url } | { kind: "route", route }]
   Photo/video: buo at tamang laki (walang putol, walang scroll). Swipe o ← → para sa susunod.
   Isara: X sa itaas, Esc, o Back ng phone/APK. Ang mapa ng route ay interactive (route.js + map-view.js). */
(function () {
  var cur = null;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }

  function open(items, index) {
    items = (items || []).filter(function (x) { return x && (x.url || x.kind === "route"); });
    if (!items.length) return;
    if (cur) cur.close(true);
    var at = Math.max(0, Math.min(items.length - 1, index || 0)), maps = {};
    document.querySelectorAll("video").forEach(function (v) { if (!v.paused) v.pause(); });

    var el = document.createElement("div");
    el.className = "mv";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Photo viewer");
    el.innerHTML =
      '<div class="mv-top"><span class="mv-count" translate="no"></span>' +
        '<button type="button" class="mv-x" aria-label="Close">' + I("x") + "</button></div>" +
      '<div class="mv-track">' + items.map(function (it, i) {
        var inner = it.kind === "route" ? '<div class="mv-map" data-i="' + i + '">' + (window.TMN_ROUTE ? TMN_ROUTE.svg(it.route, 900, 900, { pad: 0.1 }) : "") + "</div>"
          : it.kind === "video" ? '<video src="' + esc(it.url) + '" controls playsinline preload="metadata"></video>'
          : '<img alt="" src="' + esc(it.url) + '" draggable="false">';
        return '<div class="mv-slide' + (it.kind === "route" ? " is-map" : "") + '">' + inner + "</div>";
      }).join("") + "</div>" +
      (items.length > 1 ? '<button type="button" class="mv-nav prev" aria-label="Previous">' + I("chevronL") + '</button><button type="button" class="mv-nav next" aria-label="Next">' + I("chevronR") + "</button>" : "");
    document.body.appendChild(el);
    document.documentElement.classList.add("mv-open");
    var track = el.querySelector(".mv-track"), count = el.querySelector(".mv-count");

    function paint() {
      count.textContent = items.length > 1 ? (at + 1) + " / " + items.length : "";
      var p = el.querySelector(".prev"), n = el.querySelector(".next");
      if (p) { p.disabled = at === 0; n.disabled = at === items.length - 1; }
      track.querySelectorAll("video").forEach(function (v, k) { if (v.closest(".mv-slide") !== track.children[at]) v.pause(); });
      var v = track.children[at].querySelector("video"); if (v) v.play().catch(function () {});
      var it = items[at];
      if (it.kind === "route" && !maps[at] && window.TMN_ROUTE && window.TMN_MAP) {
        var box = track.children[at].querySelector(".mv-map");
        maps[at] = "loading";
        TMN_ROUTE.map(box, it.route).then(function (m) { maps[at] = m; }, function () { maps[at] = null; }); // kung offline: maiiwan ang static na mapa
      }
    }
    function go(i, smooth) {
      at = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: at * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
      paint();
    }
    var t = null;
    track.addEventListener("scroll", function () {
      clearTimeout(t);
      t = setTimeout(function () { var i = Math.round(track.scrollLeft / (track.clientWidth || 1)); if (i !== at) { at = i; paint(); } }, 90);
    });
    el.addEventListener("click", function (e) {
      if (e.target.closest(".mv-x")) { close(); return; }
      if (e.target.closest(".prev")) { go(at - 1, true); return; }
      if (e.target.closest(".next")) { go(at + 1, true); return; }
      // Tap sa itim na bahagi (hindi sa photo/video/mapa) = sara
      if (e.target.classList.contains("mv-slide")) close();
    });
    function key(e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      else if (e.key === "ArrowLeft" && !e.target.closest(".mv-map")) go(at - 1, true);
      else if (e.key === "ArrowRight" && !e.target.closest(".mv-map")) go(at + 1, true);
    }
    document.addEventListener("keydown", key, true);
    function resize() { track.scrollLeft = at * track.clientWidth; Object.keys(maps).forEach(function (k) { if (maps[k] && maps[k].resize) maps[k].resize(); }); }
    window.addEventListener("resize", resize);

    // Back ng phone / APK = sara (hindi aalis sa page)
    var pushed = false;
    try { history.pushState({ tmnViewer: 1 }, ""); pushed = true; } catch (e) {}
    function onPop() { pushed = false; close(); }
    window.addEventListener("popstate", onPop);

    function close(silent) {
      if (!el.isConnected) return;
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("resize", resize);
      Object.keys(maps).forEach(function (k) { try { if (maps[k] && maps[k].destroy) maps[k].destroy(); } catch (e) {} });
      track.querySelectorAll("video").forEach(function (v) { v.pause(); v.removeAttribute("src"); v.load(); });
      el.remove();
      document.documentElement.classList.remove("mv-open");
      cur = null;
      if (pushed && !silent) { pushed = false; try { history.back(); } catch (e) {} }
    }
    go(at, false);
    setTimeout(function () { el.querySelector(".mv-x").focus(); }, 0);
    cur = { close: close, el: el };
    return cur;
  }

  // Mula sa post (galing posts-fast): photos/videos + mapa ng route kung Explore activity
  function itemsOf(p) {
    var list = (p.media || []).map(function (m) { return { kind: m.kind, url: m.url }; });
    if (p.activity && p.activity.route) list.push({ kind: "route", route: p.activity.route });
    return list;
  }

  window.TMN_VIEWER = { open: open, itemsOf: itemsOf, close: function () { if (cur) cur.close(); } };
})();
