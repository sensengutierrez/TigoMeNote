/* TigoMeNote · components/post-card.js
   Feed card na parang Instagram: author, media (swipe), reactions, comment, repost/share, bookmark, caption.
     el.innerHTML = TMN_POST_CARD.html(post)
     TMN_POST_CARD.bind(container, { find(id) → post, update(post) })   ← iisang listener para sa lahat ng card
     TMN_POST_CARD.actionsHtml(post)  ← action row lang (ginagamit din sa post viewer)
   Kailangan: api.js, components/social-ui.js (TMN_SOCIAL), app-shell.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];
  function esc(s) { return window.TMN_UI.esc(s); }
  function ago(iso) { return window.TMN_POSTS_UI ? TMN_POSTS_UI.ago(iso) : ""; }
  function n(x) { return x >= 1000 ? (x / 1000).toFixed(x >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(x || 0); }
  function avatar(u, size) {
    u = u || {};
    return '<span class="avatar" style="--size:' + (size || 36) + 'px">' +
      (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(window.TMN_UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }

  // Explore activity (parang Komoot): mapa ng nilakbay. Walang photo = mapa ang buong media; may photo = maliit na mapa sa sulok.
  function routeSvg(p, w, h) { return p.activity && p.activity.route && window.TMN_ROUTE ? TMN_ROUTE.svg(p.activity.route, w, h) : ""; }
  function activityHead(p) {
    var a = p.activity, R = window.TMN_ROUTE; if (!a || !R) return "";
    var s = a.stats || {};
    var cells = [["Time", R.fmt.time(s.dur_s)], ["Distance", R.fmt.dist(s.dist_m)], ["Speed", R.fmt.speed(s.dist_m, s.dur_s)], ["Elevation", R.fmt.elev(s.up_m)]]
      .filter(function (c) { return c[1] !== "—"; });
    return (a.title ? '<h3 class="pc-act-title">' + esc(a.title) + "</h3>" : "") +
      (p.caption ? '<p class="pc-act-cap">' + esc(p.caption) + "</p>" : "") +
      (cells.length ? '<div class="pc-act-stats">' + cells.map(function (c) { return '<div><span class="faint small">' + c[0] + '</span><b translate="no">' + c[1] + "</b></div>"; }).join("") + "</div>" : "");
  }
  // Hugis ng media (parang Facebook): buong lapad, taas ayon sa photo/video (4:5 pinakamatangkad, 1.91:1 pinakamalapad).
  // Walang itim na gilid at walang scroll sa loob. Naaalala ang hugis bawat URL para hindi tumalon ang feed.
  var AR_KEY = "tmnMediaAR", arCache = null;
  function arMap() { if (!arCache) { try { arCache = JSON.parse(localStorage.getItem(AR_KEY) || "{}"); } catch (e) { arCache = {}; } } return arCache; }
  function arOf(url) { var v = arMap()[String(url).split("?")[0]]; return v ? Math.max(0.8, Math.min(1.91, v)) : 0; }
  function arSave(url, v) {
    var m = arMap(), k = String(url).split("?")[0]; if (m[k] === v) return; m[k] = v;
    var ks = Object.keys(m); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(function (x) { delete m[x]; });
    try { localStorage.setItem(AR_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function mediaHtml(p) {
    var hasRoute = !!(p.activity && p.activity.route && window.TMN_ROUTE);
    if (!p.media.length) return hasRoute ? '<div class="pcard-media pc-route-only"><button type="button" class="pc-route-full" data-act="route" aria-label="Open map">' + routeSvg(p, 640, 460) + "</button></div>" : "";
    var slides = p.media.map(function (m, i) {
      var inner = !m.url ? '<div class="pt-missing">' + I("image") + "</div>"
        : m.kind === "video" ? '<video src="' + esc(m.url) + '" playsinline muted loop preload="metadata"></video>'
        : '<img alt="" loading="lazy" src="' + esc(m.url) + '">';
      return '<div class="pc-slide' + (m.kind === "video" ? " is-video" : "") + '">' + inner + (m.kind === "video" ? '<button type="button" class="pc-sound" data-act="sound" aria-label="Sound on">' + I("mute", "ic-sm") + "</button>" : "") + "</div>";
    }).join("");
    var m0 = p.media[0], ar = m0.w && m0.h ? Math.max(0.8, Math.min(1.91, m0.w / m0.h)) : arOf(m0.url); // galing sa server (w/h) o naalala
    return '<div class="pcard-media' + (ar ? "" : " ar-wait") + '" style="--ar:' + (ar || 1) + '">' +
      '<div class="pc-track" data-act="track">' + slides + "</div>" +
      (p.media.length > 1 ? '<span class="pc-count-badge">1/' + p.media.length + '</span><div class="pc-dots">' +
        p.media.map(function (_, i) { return '<span class="' + (i ? "" : "on") + '"></span>'; }).join("") + "</div>" : "") +
      (hasRoute ? '<button type="button" class="pc-route-inset" data-act="route" aria-label="Open map">' + routeSvg(p, 240, 240) + "</button>" : "") +
      '<span class="pc-burst" aria-hidden="true"></span></div>';
  }

  function actionsHtml(p) {
    var s = p.stats || {};
    var mine = s.my_reaction;
    return '<div class="pcard-actions">' +
      '<div class="pc-react-wrap">' +
        '<button type="button" class="pc-act pc-react' + (mine ? " on" : "") + '" data-act="react" aria-label="React">' +
          (mine ? '<span class="pc-emoji">' + mine + "</span>" : I("heart")) + "</button>" +
        '<div class="pc-picker" role="menu">' + EMOJIS.map(function (e) { return '<button type="button" data-act="emoji" data-emoji="' + e + '"' + (e === mine ? ' class="on"' : "") + ">" + e + "</button>"; }).join("") + "</div>" +
      "</div>" +
      '<button type="button" class="pc-act" data-act="who-react">' + (s.reactions ? n(s.reactions) : "") + "</button>" +
      '<button type="button" class="pc-act" data-act="comments" aria-label="Comments">' + I("comment") + (s.comments ? "<span>" + n(s.comments) + "</span>" : "") + "</button>" +
      '<button type="button" class="pc-act' + (s.reposted ? " on-green" : "") + '" data-act="share" aria-label="Repost or share">' + I("repost") + (s.shares ? "<span>" + n(s.shares) + "</span>" : "") + "</button>" +
      '<button type="button" class="pc-act" data-act="sendlink" aria-label="Share link">' + I("send") + "</button>" +
      '<button type="button" class="pc-act pc-mark' + (s.bookmarked ? " on" : "") + '" data-act="bookmark" aria-label="Bookmark">' + I(s.bookmarked ? "bookmarkFill" : "bookmark") + "</button>" +
    "</div>" +
    (s.reactions ? '<button type="button" class="pc-summary" data-act="who-react"><span class="pc-tops">' + (s.top || []).join("") + "</span>" + summaryText(p) + "</button>" : "");
  }
  function summaryText(p) {
    var s = p.stats, t = s.reactions;
    if (s.my_reaction) return t === 1 ? "You" : "You and " + n(t - 1) + " other" + (t - 1 === 1 ? "" : "s");
    return n(t) + (t === 1 ? " reaction" : " reactions");
  }

  function html(p) {
    var a = p.author || {};
    var showFollow = !p.mine && a.id && !a.following;
    return '<article class="pcard" data-id="' + esc(p.id) + '">' +
      (p.repost_by ? '<div class="pc-repost">' + I("repost", "ic-sm") + '<button type="button" data-act="user" data-uid="' + esc(p.repost_by.id) + '">' + esc(p.repost_by.display_name || p.repost_by.username) + "</button> reposted</div>" : "") +
      '<header class="pcard-head">' +
        '<button type="button" class="pc-author" data-act="user" data-uid="' + esc(a.id || "") + '">' + avatar(a, 38) +
          '<span class="pc-who"><b>' + esc(a.display_name || a.username || "") + (p.activity && window.TMN_ROUTE ? ' <span class="pc-did">' + TMN_ROUTE.type(p.activity.type).verb + "</span>" : "") + '</b><span class="faint small">@' + esc(a.username || "") + " · " + ago(p.publish_at) +
          (p.visibility !== "public" ? " · " + I(window.TMN_POSTS_UI.VIS[p.visibility][0], "ic-sm") : "") + "</span></span></button>" +
        (showFollow ? '<button type="button" class="btn btn-ghost btn-sm pc-follow" data-act="follow" data-uid="' + esc(a.id) + '">Follow</button>' : "") +
        '<button type="button" class="icon-btn" data-act="more" aria-label="More">' + I("more") + "</button>" +
      "</header>" +
      (p.sound && window.TMN_SOUNDS ? '<div class="pc-music">' + TMN_SOUNDS.chip(p.sound) + "</div>" : "") +
      activityHead(p) +
      mediaHtml(p) +
      actionsHtml(p) +
      (p.caption && !p.activity ? '<p class="pc-caption"><b data-act="user" data-uid="' + esc(a.id || "") + '">' + esc(a.username || "") + "</b> " + esc(p.caption) + "</p>" : "") +
      (p.stats && p.stats.comments ? '<button type="button" class="pc-more-comments" data-act="comments">' + (p.stats.comments === 1 ? "View 1 comment" : "View all " + n(p.stats.comments) + " comments") + "</button>" : "") +
      '<div class="pc-time faint small">' + new Date(p.publish_at).toLocaleDateString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "long", day: "numeric" }) + "</div>" +
    "</article>";
  }

  // ---------- events (event delegation) ----------
  function bind(root, api) {
    var S = function () { return window.TMN_SOCIAL; };
    var press = null;

    function card(el) { return el.closest("[data-id]"); }
    function post(el) { var c = card(el); return c ? api.find(c.dataset.id) : null; }
    function repaint(p) {
      api.update(p);
      var sel = '[data-id="' + p.id + '"]', cards = [].slice.call(root.querySelectorAll(sel));
      if (root.matches && root.matches(sel)) cards.push(root);
      cards.forEach(function (c) {
        var a = c.querySelector(".pcard-actions"), sum = c.querySelector(".pc-summary");
        var tmp = document.createElement("div"); tmp.innerHTML = actionsHtml(p);
        if (a) a.replaceWith(tmp.querySelector(".pcard-actions"));
        if (sum) sum.remove();
        var ns = tmp.querySelector(".pc-summary");
        if (ns) c.querySelector(".pcard-actions").after(ns);
      });
    }
    async function call(action, data, p) {
      try { var r = await TMN_API.call("posts", action, data); if (r.post) repaint(Object.assign({}, p, { stats: r.post.stats })); return r; }
      catch (e) { window.TMN_UI.toast(e.message); return null; }
    }
    async function react(p, emoji) {
      // optimistic: palitan agad ang itsura
      var s = Object.assign({}, p.stats), had = s.my_reaction;
      var next = emoji === undefined ? (had ? null : "❤️") : (emoji === had ? null : emoji);
      s.reactions += (had ? 0 : 1) - (next ? 0 : 1); s.my_reaction = next;
      if (next && s.top.indexOf(next) < 0) s.top = [next].concat(s.top).slice(0, 3);
      repaint(Object.assign({}, p, { stats: s }));
      if (!navigator.onLine) { window.TMN_UI.toast("Offline: the reaction wasn't saved."); repaint(p); return; }
      await call("react", { post_id: p.id, emoji: next }, p);
    }
    function burst(c, emoji) {
      var b = c && c.querySelector(".pc-burst"); if (!b) return;
      b.textContent = emoji || "❤️"; b.classList.remove("go"); void b.offsetWidth; b.classList.add("go");
    }

    // Tap sa photo/video = buong-screen na tingin (TMN_VIEWER). Hinihintay saglit para hindi masalo ang double-tap ❤️
    var openT = null, dblAt = 0;
    function viewer(p, i) { if (window.TMN_VIEWER) TMN_VIEWER.open(TMN_VIEWER.itemsOf(p), i); }
    // Video: play mode (parang Facebook) — tuloy mula sa kung nasaan na, may full screen at minimize
    function player(p, sl) {
      var v = sl.querySelector("video"); if (!v || !window.TMN_PLAYER) return false;
      var m = p.media[[].indexOf.call(sl.parentNode.children, sl)] || {};
      TMN_PLAYER.open({ url: m.url || v.currentSrc || v.src, time: v.currentTime, volume: p.sound && p.sound.orig != null ? p.sound.orig : null,
        onClose: function (t) { try { v.currentTime = t; } catch (e) {} } });
      return true;
    }
    root.addEventListener("click", function (e) {
      var sl = e.target.closest(".pc-slide"); if (!sl || e.target.closest("button") || !root.contains(sl)) return;
      var p = post(sl); if (!p || Date.now() - dblAt < 450) return;
      var i = [].indexOf.call(sl.parentNode.children, sl);
      clearTimeout(openT); openT = setTimeout(function () { if (!sl.classList.contains("is-video") || !player(p, sl)) viewer(p, i); }, 280);
    });
    root.addEventListener("click", async function (e) {
      var t = e.target.closest("[data-act]"); if (!t || !root.contains(t)) return;
      var act = t.dataset.act, p = post(t);
      if (act === "user") { e.preventDefault(); if (t.dataset.uid) S().userSheet(t.dataset.uid); return; }
      if (act === "track") return;
      if (!p) return;
      var cd = card(t);
      if (act === "react") { if (press && press.fired) { press = null; return; } if (!p.stats.my_reaction) burst(cd, "❤️"); react(p); }
      if (act === "emoji") { t.closest(".pc-react-wrap").classList.remove("open"); burst(cd, t.dataset.emoji); react(p, t.dataset.emoji); }
      if (act === "who-react") S().whoSheet(p, "reactions");
      if (act === "comments") S().commentsSheet(p, function (count) { var s = Object.assign({}, p.stats, { comments: count }); repaint(Object.assign({}, p, { stats: s })); });
      if (act === "share") S().shareMenu(p, function (np) { repaint(Object.assign({}, p, { stats: np.stats })); });
      if (act === "sendlink") S().shareLink(p, function (np) { repaint(Object.assign({}, p, { stats: np.stats })); });
      if (act === "bookmark") {
        var on = !p.stats.bookmarked;
        repaint(Object.assign({}, p, { stats: Object.assign({}, p.stats, { bookmarked: on }) }));
        window.TMN_UI.toast(on ? "Saved to Bookmarks" : "Removed from Bookmarks");
        await call("bookmark", { post_id: p.id, on: on }, p);
      }
      if (act === "follow") {
        t.disabled = true;
        var ok = await S().follow(t.dataset.uid, true);
        if (ok) { root.querySelectorAll('.pc-follow[data-uid="' + t.dataset.uid + '"]').forEach(function (b) { b.remove(); }); }
        else t.disabled = false;
      }
      if (act === "more") S().postMenu(p, api);
      if (act === "route") viewer(p, p.media.length);
      if (act === "sound") {
        var v = t.parentNode.querySelector("video");
        if (v) { v.muted = !v.muted; if (v.paused) v.play().catch(function () {}); t.classList.toggle("on", !v.muted); t.innerHTML = I(v.muted ? "mute" : "volume", "ic-sm"); t.setAttribute("aria-label", v.muted ? "Sound on" : "Sound off"); }
      }
    });
    // Double-tap sa photo = ❤️ (parang Instagram)
    var lastTap = 0;
    root.addEventListener("pointerup", function (e) {
      var m = e.target.closest(".pcard-media"); if (!m || e.target.closest("button")) return;
      var now = Date.now();
      if (now - lastTap < 300) { clearTimeout(openT); dblAt = now; var p = post(m); if (p && p.stats.my_reaction !== "❤️") { react(p, "❤️"); } burst(card(m), "❤️"); lastTap = 0; }
      else lastTap = now;
    });
    // Pindutin nang matagal (o hover sa desktop) ang puso = pumili ng emoji
    root.addEventListener("pointerdown", function (e) {
      var b = e.target.closest('[data-act="react"]'); if (!b) return;
      press = { fired: false, t: setTimeout(function () { press.fired = true; b.closest(".pc-react-wrap").classList.add("open"); }, 420) };
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      root.addEventListener(ev, function () { if (press && !press.fired) { clearTimeout(press.t); press = null; } }, true);
    });
    root.addEventListener("contextmenu", function (e) { if (e.target.closest('[data-act="react"]')) e.preventDefault(); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".pc-react-wrap")) root.querySelectorAll(".pc-react-wrap.open").forEach(function (w) { w.classList.remove("open"); });
    });
    // Carousel: dots + counter habang nagsi-swipe
    root.addEventListener("scroll", function (e) {
      var tr = e.target; if (!tr.classList || !tr.classList.contains("pc-track")) return;
      var i = Math.round(tr.scrollLeft / tr.clientWidth), m = tr.parentNode;
      m.querySelectorAll(".pc-dots span").forEach(function (d, k) { d.classList.toggle("on", k === i); });
      var c = m.querySelector(".pc-count-badge"); if (c) c.textContent = (i + 1) + "/" + tr.children.length;
    }, true);
    // Kunin ang tunay na hugis ng unang photo/video (kapag hindi pa alam)
    function fit(el) {
      var w = el.naturalWidth || el.videoWidth, h = el.naturalHeight || el.videoHeight; if (!w || !h) return;
      var sl = el.closest(".pc-slide"), box = el.closest(".pcard-media"); if (!sl || !box || !box.classList.contains("ar-wait") || sl !== sl.parentNode.firstElementChild) return; // may w/h na galing sa server = sundin iyon
      var ar = Math.round((w / h) * 1000) / 1000; arSave(el.currentSrc || el.src, ar);
      box.style.setProperty("--ar", Math.max(0.8, Math.min(1.91, ar))); box.classList.remove("ar-wait");
    }
    root.addEventListener("load", function (e) { if (e.target.tagName === "IMG") fit(e.target); }, true);
    root.addEventListener("loadedmetadata", function (e) { if (e.target.tagName === "VIDEO") fit(e.target); }, true);
    // Auto-play ng video kapag nasa screen
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { var v = en.target; if (en.isIntersecting && en.intersectionRatio > 0.6) { v.play().catch(function () {}); } else v.pause(); });
      }, { threshold: [0, 0.6, 1] });
      new MutationObserver(function () { root.querySelectorAll(".pcard video:not([data-io])").forEach(function (v) { v.dataset.io = 1; io.observe(v); }); })
        .observe(root, { childList: true, subtree: true });
    }
    return { repaint: repaint };
  }

  window.TMN_POST_CARD = { html: html, bind: bind, actionsHtml: actionsHtml, avatar: avatar, EMOJIS: EMOJIS };
})();
