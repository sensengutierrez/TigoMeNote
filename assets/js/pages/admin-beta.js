/* TigoMeNote · pages/admin-beta.js (app/admin/beta.html) — Beta monitor, Admin lang
   Itaas: buod (testers ngayon / 7 araw / 14+ araw para sa Google Play, crash, error, bagal, bugs, content reports).
   Tabs: Testers (sino, aling app at version, phone, ilang araw, mga problema sa 7 araw) · Bugs (galing sa Report a bug, may screenshot)
         · Crashes (Android) · Errors (JavaScript / server 500) · Slow (server > 4 s, page > 6 s).
   Bawat problema: ilang beses (hits), una at huling oras, app/version, page, phone, user; "Mark fixed" / "Reopen" / Delete.
   Server: crash-fast (stats, list, testers, resolve, remove). Datos: app-health.js, app-mode.js, components/bug-report.js */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return UI.esc(s == null ? "" : String(s)); };
  var view = "testers", list = [], GOAL_PEOPLE = 12, GOAL_DAYS = 14;
  var APPN = { main: "TigoMeNote", chat: "Chat", tigo: "Tigo", web: "Web" };
  var KIND = { crash: ["💥", "Crash"], error: ["⚠️", "Error"], slow: ["🐢", "Slow"], bug: ["🐞", "Bug"] };

  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago";
  }
  function when(iso) { try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function who(u) { return u ? '<b translate="no">@' + esc(u.username || "user") + "</b>" : '<span class="faint">not signed in</span>'; }
  function initials(u) { var n = (u && (u.display_name || u.username)) || "?"; return esc(n.split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase()); }

  if (!window.TMN_USER || TMN_USER.role !== "Admin") {
    ["bmTabs", "bmFilters", "bmStats", "bmRefresh"].forEach(function (id) { $(id).classList.add("hidden"); });
    $("bmEmpty").classList.remove("hidden"); $("bmEmptyTitle").textContent = "Admins only"; $("bmEmptyText").textContent = "This page is for TigoMeNote admins.";
    return;
  }

  async function stats() {
    try {
      var r = await TMN_API.call("crash", "stats", {}), t = r.testers;
      $("bmBugN").textContent = r.openBugs || "";
      var vers = Object.keys(r.versions || {}).sort().map(function (k) { return '<span class="chip">' + esc(k.replace(/^main/, "TigoMeNote").replace(/^chat/, "Chat").replace(/^tigo/, "Tigo").replace(/^web/, "Web")) + " · " + r.versions[k] + "</span>"; }).join("");
      $("bmStats").innerHTML =
        tile("users", "Testers", t.total, t.today + " today · " + t.week + " this week") +
        tile("calendar", GOAL_DAYS + "+ days", t.days14 + " / " + GOAL_PEOPLE, "Google Play closed test", t.days14 >= GOAL_PEOPLE ? "ok" : "") +
        tile("flag", "Crashes", r.day.crash, r.week.crash + " this week", r.day.crash ? "bad" : "") +
        tile("info", "Errors", r.day.error, r.week.error + " this week", r.day.error ? "warn" : "") +
        tile("clock", "Slow", r.day.slow, r.week.slow + " this week", r.day.slow ? "warn" : "") +
        tile("comment", "Open bugs", r.openBugs, r.week.bug + " sent this week", r.openBugs ? "warn" : "") +
        '<a class="card bm-tile" href="reports.html"><span class="bm-ic">' + I("shield", "ic-sm") + '</span><span class="bm-n">' + r.reports + '</span><b>Content reports</b><span class="faint small">Open · tap to review</span></a>' +
        (vers ? '<div class="card bm-vers"><b>Versions in use (7 days)</b><div>' + vers + "</div></div>" : "");
    } catch (e) { $("bmStats").innerHTML = '<p class="faint small">' + esc(e.message) + "</p>"; }
  }
  function tile(ic, label, n, sub, tone) {
    return '<div class="card bm-tile ' + (tone || "") + '"><span class="bm-ic">' + I(ic, "ic-sm") + '</span><span class="bm-n" translate="no">' + esc(n) + "</span><b>" + label + '</b><span class="faint small">' + esc(sub) + "</span></div>";
  }

  async function load() {
    $("bmFilters").classList.toggle("hidden", view === "testers");
    $("bmList").innerHTML = '<p class="faint small">Loading…</p>'; $("bmEmpty").classList.add("hidden");
    try {
      if (view === "testers") list = (await TMN_API.call("crash", "testers", {})).list || [];
      else list = (await TMN_API.call("crash", "list", { kind: view, app: $("bmApp").value, status: $("bmStatus").value, q: $("bmQ").value.trim() })).list || [];
    } catch (e) { $("bmList").innerHTML = '<p class="faint small">' + esc(e.message) + "</p>"; return; }
    paint();
  }
  function paint() {
    var box = $("bmList");
    if (!list.length) {
      box.innerHTML = ""; $("bmEmpty").classList.remove("hidden");
      $("bmEmptyTitle").textContent = view === "testers" ? "No testers yet" : "All clear";
      $("bmEmptyText").textContent = view === "testers" ? "Testers show up here after they sign in on the app." : "No " + KIND[view][1].toLowerCase() + "s here.";
      return;
    }
    $("bmEmpty").classList.add("hidden");
    box.innerHTML = view === "testers" ? list.map(tester).join("") : list.map(item).join("");
  }
  function tester(p) {
    var pct = Math.min(100, Math.round(100 * p.days / GOAL_DAYS)), issues = p.crash + p.error + p.slow + p.bug;
    return '<article class="card bm-card bm-tester"><div class="bm-row"><span class="bm-av">' + initials(p.user) + '</span><div class="bm-main">' + who(p.user) +
      (p.user && p.user.display_name ? ' <span class="faint small">' + esc(p.user.display_name) + "</span>" : "") +
      '<div class="faint small">Active ' + ago(p.last_at) + " · opened " + p.opens + "×</div></div>" +
      '<span class="bm-days' + (p.days >= GOAL_DAYS ? " ok" : "") + '" title="Days used"><b>' + p.days + "</b>/" + GOAL_DAYS + " days</span></div>" +
      '<div class="bm-prog"><span style="width:' + pct + '%"></span></div>' +
      '<div class="bm-chips">' + p.apps.map(function (a) { return '<span class="chip">' + esc(APPN[a.app] || a.app) + " " + esc(a.version) + "</span>"; }).join("") + "</div>" +
      (p.apps[0] && p.apps[0].device ? '<div class="faint small">📱 ' + esc(p.apps[0].device) + "</div>" : "") +
      '<div class="small bm-issues">' + (issues ? (p.crash ? "💥 " + p.crash + " " : "") + (p.error ? "⚠️ " + p.error + " " : "") + (p.slow ? "🐢 " + p.slow + " " : "") + (p.bug ? "🐞 " + p.bug : "") + ' <span class="faint">· last 7 days</span>' : '<span class="faint">No problems in the last 7 days ✓</span>') + "</div></article>";
  }
  function item(l) {
    var k = KIND[l.kind];
    return '<article class="card bm-card ' + l.kind + (l.status === "fixed" ? " fixed" : "") + '" data-id="' + l.id + '">' +
      '<div class="bm-row"><span class="bm-k" title="' + k[1] + '">' + k[0] + '</span><div class="bm-main"><p class="bm-msg">' + esc(l.message) + "</p>" +
      '<div class="bm-chips"><span class="chip">' + esc(APPN[l.app] || l.app) + " " + esc(l.version) + "</span>" +
        (l.hits > 1 ? '<span class="chip bm-hits">×' + l.hits + "</span>" : "") +
        (l.ms ? '<span class="chip">' + (l.ms / 1000).toFixed(1) + " s</span>" : "") +
        (l.page ? '<span class="chip" translate="no">' + esc(l.page) + "</span>" : "") +
        (l.status === "fixed" ? '<span class="chip bm-fixed">✓ Fixed</span>' : "") + "</div></div>" +
      '<span class="faint small bm-time" title="' + esc(when(l.last_at)) + '">' + ago(l.last_at) + "</span></div>" +
      (l.shot ? '<a class="bm-shot" href="' + l.shot + '" target="_blank" rel="noopener"><img src="' + l.shot + '" alt="Screenshot" loading="lazy"></a>' : "") +
      '<div class="faint small">' + who(l.user) + (l.device ? " · 📱 " + esc(l.device) : "") + " · first " + esc(when(l.created_at)) + "</div>" +
      (l.detail ? '<details class="bm-det"><summary class="small">Details</summary><pre>' + esc(l.detail) + "</pre></details>" : "") +
      '<div class="bm-acts">' + (l.status === "fixed"
        ? '<button type="button" class="btn btn-ghost btn-sm" data-a="open">' + I("refresh", "ic-sm") + "Reopen</button>"
        : '<button type="button" class="btn btn-primary btn-sm" data-a="fixed">' + I("check", "ic-sm") + "Mark fixed</button>") +
      '<button type="button" class="btn btn-ghost btn-sm" data-a="copy">Copy</button>' +
      '<button type="button" class="icon-btn" data-a="del" aria-label="Delete">' + I("trash", "ic-sm") + "</button></div></article>";
  }

  $("bmList").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var card = b.closest("[data-id]"), id = Number(card.dataset.id), l = list.filter(function (x) { return x.id === id; })[0];
    try {
      if (b.dataset.a === "fixed" || b.dataset.a === "open") {
        await TMN_API.call("crash", "resolve", { id: id, status: b.dataset.a });
        UI.toast(b.dataset.a === "fixed" ? "Marked fixed ✓" : "Reopened"); load(); stats();
      }
      if (b.dataset.a === "del" && await TMN_MODAL.confirm("Delete this entry?", { okText: "Delete", danger: true })) { await TMN_API.call("crash", "remove", { id: id }); load(); stats(); }
      if (b.dataset.a === "copy" && l) {
        var t = [KIND[l.kind][1] + ": " + l.message, APPN[l.app] + " " + l.version + " · " + (l.page || ""), l.device || "", "hits " + l.hits + " · last " + when(l.last_at), l.detail || ""].join("\n");
        await navigator.clipboard.writeText(t); UI.toast("Copied");
      }
    } catch (er) { UI.toast(er.message || "Couldn't do that."); }
  });
  $("bmTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-v]"); if (!b) return;
    view = b.dataset.v;
    $("bmTabs").querySelectorAll("[data-v]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    load();
  });
  ["bmApp", "bmStatus"].forEach(function (id) { $(id).addEventListener("change", load); });
  var qt; $("bmQ").addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(load, 350); });
  $("bmRefresh").addEventListener("click", function () { stats(); load(); });
  stats(); load();
})();
