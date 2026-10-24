/* TigoMeNote · pages/notifications.js (app/notifications.html)
   Listahan ng activity: reactions, comments, reposts, followers, follow requests, milestones, weekly recap at account notices.
   - Pinagsasama ang magkakapareho: "Ana, Ben at 3 iba pa reacted to your post" (bawat post, bawat araw).
   - Mga grupo: New (hindi pa nakikita), Today, This week, Earlier.
   - Pagbukas ng page = nakita na lahat (seen). Server: notify-fast (list, seen).
   Settings: desktop = sa gilid; phone = gear (components/notif-settings.js). */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, S = window.TMN_SOCIAL, esc = UI.esc;
  var $ = function (id) { return document.getElementById(id); };
  var items = [], groups = [];

  function av(u, size) {
    u = u || {};
    return '<span class="avatar" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }
  function ago(iso) { return window.TMN_POSTS_UI ? TMN_POSTS_UI.ago(iso) : ""; }
  function dayKey(iso) { var d = new Date(iso); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
  function name(u) { return '<b translate="no" data-uid="' + esc((u || {}).id || "") + '">' + esc((u || {}).username || "someone") + "</b>"; }

  // ---------- pagsasama-sama ----------
  var GROUPED = { like: "post", repost: "post", follow: "day" };
  function build(list) {
    var out = [], index = {};
    list.forEach(function (n) {
      var how = GROUPED[n.type];
      if (!how) { out.push({ type: n.type, items: [n], at: n.at, unread: n.unread }); return; }
      var key = n.type + ":" + (how === "post" ? n.post_id : "") + ":" + dayKey(n.at) + ":" + (n.unread ? 1 : 0);
      var g = index[key];
      if (!g) { g = index[key] = { type: n.type, items: [], at: n.at, unread: n.unread }; out.push(g); }
      g.items.push(n);
    });
    return out;
  }
  function section(g) {
    if (g.unread) return "New";
    var age = (Date.now() - new Date(g.at).getTime()) / 86400000;
    if (dayKey(g.at) === dayKey(new Date().toISOString())) return "Today";
    if (age < 7) return "This week";
    if (age < 30) return "This month";
    return "Earlier";
  }

  // ---------- text ----------
  function who(g) {
    var us = [], seen = {};
    g.items.forEach(function (n) { if (n.actor && !seen[n.actor.id]) { seen[n.actor.id] = 1; us.push(n.actor); } });
    if (us.length === 1) return name(us[0]);
    if (us.length === 2) return name(us[0]) + " and " + name(us[1]);
    if (us.length === 3) return name(us[0]) + ", " + name(us[1]) + " and " + name(us[2]);
    return name(us[0]) + ", " + name(us[1]) + " <span>" + "and " + (us.length - 2) + " others" + "</span>";
  }
  // Bawat bilang ay hiwalay na chip (para maisalin nang maayos)
  function recapHtml(d) {
    d = d || {};
    var parts = [[d.posts, "{n} posts"], [d.reactions, "{n} reactions"], [d.comments, "{n} comments"], [d.followers, "{n} new followers"]]
      .filter(function (p) { return p[0]; })
      .map(function (p) { return '<span class="nt-chip">' + p[1].replace("{n}", p[0]) + "</span>"; });
    return "<span>Your weekly recap is ready. Keep sharing!</span>" + '<span class="nt-chips">' + parts.join("") + "</span>";
  }
  function text(g) {
    var n = g.items[0];
    switch (g.type) {
      case "like": {
        var em = [];
        g.items.forEach(function (x) { if (x.emoji && em.indexOf(x.emoji) < 0) em.push(x.emoji); });
        return who(g) + " reacted " + '<span class="nt-emoji" translate="no">' + esc(em.slice(0, 3).join("")) + "</span> to your post.";
      }
      case "comment": return who(g) + ' commented: <span class="nt-quote" translate="no">' + esc(n.body || "") + "</span>";
      case "repost": return who(g) + " reposted your post.";
      case "follow": return who(g) + " started following you.";
      case "follow_request": return who(g) + (n.pending ? " wants to follow you." : " requested to follow you.");
      case "follow_accept": return who(g) + " accepted your follow request.";
      case "circle_invite": return who(g) + (n.data && n.data.kind === "friend" ? " wants to add you to their Friends circle." : " wants to add you to their Family circle.");
      case "circle_accept": return who(g) + (n.data && n.data.kind === "friend" ? " joined your Friends circle." : " joined your Family circle.");
      case "milestone": return esc(n.body || "");
      case "recap": return recapHtml(n.data);
      case "moderation": return esc(n.body || "");
    }
    return esc(n.body || "");
  }

  // ---------- kaliwa (avatar o icon) ----------
  var SYS = { milestone: ["trophy", "nt-sys-gold"], recap: ["chart", "nt-sys-mint"], moderation: ["shield", "nt-sys-coral"] };
  var BADGE = { like: "heart", comment: "comment", repost: "repost", follow: "userPlus", follow_request: "userPlus", follow_accept: "check", circle_invite: "shield", circle_accept: "shield" };
  function left(g) {
    if (SYS[g.type]) return '<span class="nt-sys ' + SYS[g.type][1] + '">' + I(SYS[g.type][0]) + "</span>";
    var us = [];
    g.items.forEach(function (n) { if (n.actor && us.every(function (u) { return u.id !== n.actor.id; })) us.push(n.actor); });
    var pic = us.length > 1
      ? '<span class="nt-stack">' + av(us[1], 34) + av(us[0], 34) + "</span>"
      : av(us[0], 46);
    return '<span class="nt-pic" data-uid="' + esc((us[0] || {}).id || "") + '">' + pic +
      '<span class="nt-badge nt-b-' + g.type + '">' + I(BADGE[g.type] || "bell") + "</span></span>";
  }
  // ---------- kanan (thumbnail o button) ----------
  function right(g) {
    var n = g.items[0];
    if (g.type === "follow_request" && n.pending) {
      return '<div class="nt-btns"><button type="button" class="btn btn-primary btn-sm" data-nt="approve">Confirm</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-nt="decline">Delete</button></div>';
    }
    if (g.type === "circle_invite" && n.data && n.data.link && !n.done) {
      return '<div class="nt-btns"><button type="button" class="btn btn-primary btn-sm" data-nt="caccept">Accept</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-nt="cdecline">Decline</button></div>';
    }
    if ((g.type === "follow" || g.type === "follow_accept") && g.items.length === 1 && n.actor) {
      return n.following
        ? '<button type="button" class="btn btn-ghost btn-sm" data-nt="unfollow">Following</button>'
        : '<button type="button" class="btn btn-primary btn-sm" data-nt="follow">Follow back</button>';
    }
    if (n.thumb && n.thumb.url) {
      return '<span class="nt-thumb">' + (n.thumb.kind === "video"
        ? '<video src="' + esc(n.thumb.url) + '#t=0.1" muted playsinline preload="metadata"></video>'
        : '<img alt="" src="' + esc(n.thumb.url) + '" loading="lazy">') + "</span>";
    }
    return "";
  }

  function render() {
    groups = build(items);
    var h = "", last = "";
    groups.forEach(function (g, i) {
      var sec = section(g);
      if (sec !== last) { h += '<h3 class="nt-sec">' + sec + "</h3>"; last = sec; }
      var n = g.items[0];
      var link = n.post_id ? ' data-post="' + esc(n.post_id) + '"' : "";
      var r = right(g), under = r.indexOf("nt-btns") > -1; // Confirm/Delete: sa ilalim ng text
      h += '<div class="nt-row' + (g.unread ? " unread" : "") + '" data-i="' + i + '"' + link + ' role="listitem">' +
        left(g) + '<div class="nt-main"><p class="nt-text">' + text(g) + ' <span class="nt-time">' + ago(g.at) + "</span></p>" + (under ? r : "") + "</div>" + (under ? "" : r) + "</div>";
    });
    $("ntList").innerHTML = h;
    $("ntEmpty").classList.toggle("hidden", !!items.length);
  }

  async function load() {
    $("ntList").innerHTML = '<div class="nt-row skel-row"><span class="avatar skel" style="--size:46px"></span><span class="skel" style="height:12px;flex:1"></span></div>'.repeat(5);
    try {
      var r = await TMN_API.call("notify", "list", {});
      items = r.list || [];
      render();
      if (items.some(function (n) { return n.unread; })) TMN_API.call("notify", "seen", {}).catch(function () {});
      if (window.TMN_NOTIF_BADGE) TMN_NOTIF_BADGE.set(0);
    } catch (e) {
      $("ntList").innerHTML = "";
      $("ntEmpty").classList.remove("hidden");
      $("ntEmptyTitle").textContent = "Couldn't load";
      $("ntEmptyText").textContent = e.message;
    }
  }

  $("ntList").addEventListener("click", async function (e) {
    var row = e.target.closest(".nt-row"); if (!row || row.classList.contains("skel-row")) return;
    var g = groups[Number(row.dataset.i)], n = g.items[0];
    var b = e.target.closest("[data-nt]");
    if (b) {
      b.disabled = true;
      var a = b.dataset.nt;
      try {
        if (a === "caccept" || a === "cdecline") {
          // Family/Friends invite: tatanggapin dito, ang pag-share ng location ay sa Safety
          await TMN_API.call("safety", "respond", { id: n.data.link, accept: a === "caccept" });
          if (a === "caccept") { n.done = true; n.unread = false; UI.toast("Added to your circle. Manage location sharing in Safety."); }
          else { items = items.filter(function (x) { return x !== n; }); UI.toast("Invite declined."); }
        } else if (a === "approve" || a === "decline") {
          await TMN_API.call("social", a === "approve" ? "approveRequest" : "declineRequest", { user_id: n.actor.id });
          if (a === "approve") { n.type = "follow"; n.unread = false; g.type = "follow"; n.pending = false; }
          else items = items.filter(function (x) { return x !== n; });
          UI.toast(a === "approve" ? "Request confirmed." : "Request deleted.");
        } else {
          var st = await S.follow(n.actor.id, a === "follow");
          if (st !== null) items.forEach(function (x) { if (x.actor && x.actor.id === n.actor.id) x.following = st === true; });
        }
        render();
      } catch (err) { b.disabled = false; UI.toast(err.message); }
      return;
    }
    var u = e.target.closest("[data-uid]");
    if (u && u.dataset.uid && (u.tagName === "B" || u.classList.contains("nt-pic"))) { S.userSheet(u.dataset.uid); return; }
    if (row.dataset.post) { location.href = "explore.html?post=" + encodeURIComponent(row.dataset.post); return; }
    if (g.type === "follow" || g.type === "follow_request" || g.type === "follow_accept") { if (n.actor) S.userSheet(n.actor.id); return; }
    if (g.type === "milestone" || g.type === "recap") location.href = "profile.html";
    if (g.type === "circle_invite" || g.type === "circle_accept") location.href = "safety.html";
  });

  $("ntGear").addEventListener("click", function () { TMN_NOTIF_SETTINGS.open(); });
  // Desktop: settings sa gilid
  var side = $("ntSettings");
  if (side && window.matchMedia("(min-width: 900px)").matches) TMN_NOTIF_SETTINGS.mount(side);
  else if (new URLSearchParams(location.search).get("settings")) TMN_NOTIF_SETTINGS.open();

  // May bagong dumating habang bukas ang page
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (e) {
      if (e.data && e.data.type === "tmn-push" && e.data.data && e.data.data.type === "notif") load();
    });
  }
  load();
})();
