/* TigoMeNote · pages/admin-reports.js (app/admin/reports.html) — Admin lang
   Listahan ng mga ni-report (ng users o ng automatic na filter), naka-grupo bawat post/comment/account/status.
   Mga desisyon: Dismiss (walang mali), Hide / Unhide, Delete, Warn (strike), Suspend / Unsuspend ang account.
   Server: moderation-fast (queue, resolve, count). */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return UI.esc(s); };
  var status = "open", list = [];
  var REASON = {
    violence: "Violence", nudity: "Nudity", crime: "Drugs / crime", firearms: "Illegal firearms", harassment: "Harassment",
    hate: "Hate speech", child_safety: "Child safety", self_harm: "Self-harm", spam: "Spam", other: "Other"
  };
  var TYPE = { post: "Post", comment: "Comment", user: "Account", story: "Status", message: "Message" };

  function since(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "d";
  }
  function who(u) { return u ? "@" + esc(u.username) : '<span class="faint">deleted</span>'; }

  if (!window.TMN_USER || TMN_USER.role !== "Admin") {
    $("arTabs").classList.add("hidden");
    $("arEmpty").classList.remove("hidden");
    $("arEmptyTitle").textContent = "Admins only";
    $("arEmptyText").textContent = "This page is for TigoMeNote admins.";
    return;
  }

  function preview(g) {
    var p = g.preview || {};
    if (p.gone) return '<p class="faint small">This was already deleted.</p>';
    if (g.target_type === "post") {
      return '<div class="ar-media">' + (p.media || []).slice(0, 4).map(function (m) {
        return !m.url ? '<div class="ar-thumb">' + I("image") + "</div>"
          : m.kind === "video" ? '<video class="ar-thumb" src="' + esc(m.url) + '#t=0.1" muted playsinline controls preload="metadata"></video>'
          : '<a class="ar-thumb" href="' + esc(m.url) + '" target="_blank" rel="noopener"><img alt="" src="' + esc(m.url) + '"></a>';
      }).join("") + "</div>" + (p.caption ? '<p class="ar-text" translate="no">' + esc(p.caption) + "</p>" : "");
    }
    if (g.target_type === "message") return (p.url ? '<div class="ar-media"><a class="ar-thumb" href="' + esc(p.url) + '" target="_blank" rel="noopener"><img alt="" src="' + esc(p.url) + '"></a></div>' : "") +
      (p.body ? '<p class="ar-text" translate="no">' + esc(p.body) + "</p>" : "") + (p.lat != null ? '<p class="faint small">📍 ' + p.lat.toFixed(4) + ", " + p.lng.toFixed(4) + "</p>" : "");
    if (g.target_type === "comment") return '<p class="ar-text" translate="no">' + esc(p.body || "") + "</p>";
    if (g.target_type === "story") {
      return '<div class="ar-media">' + (p.url ? (p.kind === "video" ? '<video class="ar-thumb" src="' + esc(p.url) + '" muted playsinline controls></video>' : '<a class="ar-thumb" href="' + esc(p.url) + '" target="_blank" rel="noopener"><img alt="" src="' + esc(p.url) + '"></a>') : "") + "</div>" +
        (p.caption ? '<p class="ar-text" translate="no">' + esc(p.caption) + "</p>" : "");
    }
    return '<div class="ar-user"><span class="avatar" style="--size:44px">' + (p.avatar_url ? '<img alt="" src="' + esc(p.avatar_url) + '">' : esc(UI.initials(p.display_name || p.username || "?"))) + "</span>" +
      '<div><b translate="no">' + esc(p.display_name || "") + '</b> <span class="faint" translate="no">@' + esc(p.username || "") + "</span>" +
      (p.bio ? '<p class="ar-text small" translate="no">' + esc(p.bio) + "</p>" : "") + "</div></div>";
  }

  function card(g, i) {
    var p = g.preview || {}, o = g.owner || {};
    var reasons = Object.keys(g.reasons).map(function (r) {
      return '<span class="chip ar-reason' + (r === "child_safety" ? " urgent" : "") + '">' + esc(REASON[r] || r) + (g.reasons[r] > 1 ? ' <b translate="no">×' + g.reasons[r] + "</b>" : "") + "</span>";
    }).join("");
    var acts = [];
    if (status === "open") acts.push('<button type="button" class="btn btn-ghost btn-sm" data-a="dismiss">' + I("check", "ic-sm") + "Dismiss</button>");
    if (g.target_type !== "user" && !p.gone) {
      acts.push(p.hidden ? '<button type="button" class="btn btn-ghost btn-sm" data-a="unhide">' + I("eye", "ic-sm") + "Unhide</button>"
        : '<button type="button" class="btn btn-ghost btn-sm" data-a="hide">' + I("eyeOff", "ic-sm") + "Hide</button>");
      acts.push('<button type="button" class="btn btn-danger btn-sm" data-a="delete">' + I("trash", "ic-sm") + "Delete</button>");
    }
    if (o.id) {
      acts.push('<button type="button" class="btn btn-ghost btn-sm" data-a="warn">' + I("flag", "ic-sm") + "Warn user</button>");
      acts.push(o.status === "Inactive" ? '<button type="button" class="btn btn-ghost btn-sm" data-a="unsuspend">' + I("user", "ic-sm") + "Unsuspend</button>"
        : '<button type="button" class="btn btn-danger btn-sm" data-a="suspend">' + I("lock", "ic-sm") + "Suspend user</button>");
    }
    return '<article class="card ar-card' + (g.reasons.child_safety ? " urgent" : "") + '" data-i="' + i + '">' +
      '<div class="ar-head"><span class="badge">' + esc(TYPE[g.target_type] || g.target_type) + "</span>" + reasons +
        (g.auto ? '<span class="chip ar-auto">' + I("shield", "ic-sm") + "Auto-detected</span>" : "") +
        (p.hidden ? '<span class="badge badge-review">' + I("eyeOff", "ic-sm") + "Hidden</span>" : "") +
        '<span class="faint small ar-time">' + since(g.latest) + "</span></div>" +
      '<div class="ar-owner small">By ' + who(o) + (o.strikes ? ' · <span class="ar-strikes">' + o.strikes + " strike" + (o.strikes > 1 ? "s" : "") + "</span>" : "") +
        (o.status === "Inactive" ? ' · <span class="badge">Suspended</span>' : "") + "</div>" +
      '<div class="ar-preview">' + preview(g) + "</div>" +
      '<details class="ar-reports"><summary>' + g.count + " report" + (g.count > 1 ? "s" : "") + "</summary><ul>" +
        g.reports.map(function (r) {
          return "<li><b>" + esc(REASON[r.reason] || r.reason) + "</b> · " + (r.auto ? "Automatic filter" : who(r.reporter)) + ' · <span class="faint">' + since(r.at) + "</span>" +
            (r.note ? '<div class="faint small" translate="no">' + esc(r.note) + "</div>" : "") + "</li>";
        }).join("") + "</ul></details>" +
      '<div class="ar-actions">' + acts.join("") + "</div></article>";
  }

  function render() {
    $("arList").innerHTML = list.map(card).join("");
    $("arEmpty").classList.toggle("hidden", !!list.length);
    if (!list.length) {
      $("arEmptyTitle").textContent = status === "open" ? "All clear" : "Nothing here";
      $("arEmptyText").textContent = status === "open" ? "No open reports right now." : "No reports in this list.";
    }
  }
  async function load() {
    $("arList").innerHTML = '<div class="card ar-card skel" style="height:160px"></div>';
    try {
      var r = await TMN_API.call("moderation", "queue", { status: status });
      list = r.list || []; render();
      if (status === "open") $("arOpen").textContent = list.length ? String(list.length) : "";
    } catch (e) { $("arList").innerHTML = ""; $("arEmpty").classList.remove("hidden"); $("arEmptyTitle").textContent = "Couldn't load"; $("arEmptyText").textContent = e.message; }
  }

  var CONFIRM = {
    delete: ["Delete this permanently? The user gets a strike.", "Delete"],
    suspend: ["Suspend this account? They will be signed out and can't sign in.", "Suspend"],
    warn: ["Give this user a strike?", "Warn"]
  };
  $("arList").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var g = list[Number(b.closest("[data-i]").dataset.i)], a = b.dataset.a;
    if (CONFIRM[a] && !(await TMN_MODAL.confirm(CONFIRM[a][0], { okText: CONFIRM[a][1], danger: a !== "warn" }))) return;
    b.disabled = true;
    try {
      var top = Object.keys(g.reasons).sort(function (x, y) { return g.reasons[y] - g.reasons[x]; })[0];
      await TMN_API.call("moderation", "resolve", { target_type: g.target_type, target_id: g.target_id, owner_id: (g.owner || {}).id, decision: a, reason: top });
      UI.toast("Done.");
      load();
    } catch (err) { b.disabled = false; UI.toast(err.message); }
  });
  $("arTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-s]"); if (!b || b.dataset.s === status) return;
    status = b.dataset.s;
    this.querySelectorAll("[data-s]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    load();
  });
  load();
})();
