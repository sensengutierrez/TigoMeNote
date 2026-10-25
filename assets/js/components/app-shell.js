/* TigoMeNote · components/app-shell.js
   Gumagawa ng sidebar (desktop), topbar + hamburger drawer + bottom tabs (phone)
   mula sa TMN_NAV (nav-items.js). Hindi na kailangang i-copy ang menu sa bawat page.

   Sa page:  <body data-page="home" data-title="Daily">  <main id="page" class="page">...</main>
   Scripts sa dulo ng body: icons.js → nav-items.js → components/app-shell.js → page script

   Extra helpers: TMN_UI.toast("Saved"), TMN_UI.setBadge("messages", 3), TMN_UI.esc(text) */
(function () {
  var C = window.TMN_CONFIG, NAV = window.TMN_NAV, I = window.TMN_ICON;
  // Ibang APK (hal. TigoMeNote Chat) = sariling menu (nav-items.js → apps)
  if (window.TMN_APP_ID && NAV.apps && NAV.apps[window.TMN_APP_ID]) NAV = Object.assign({}, NAV, NAV.apps[window.TMN_APP_ID]);
  var body = document.body;
  var pageId = body.dataset.page || "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initials(name) {
    var p = String(name || "?").trim().split(/\s+/);
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function allowed(item) {
    var u = window.TMN_USER;
    if (item.web && window.TMN_IN_APP) return false;
    return !item.role || (u && u.role === item.role);
  }
  function url(href) { return C.root + href; }
  function byId(id) {
    return NAV.main.concat(NAV.more).filter(function (i) { return i.id === id; })[0];
  }

  var current = byId(pageId);
  var title = body.dataset.title || (current && current.label) || C.appName;
  document.title = title + " · " + C.appName;

  // ---------- pieces ----------
  function brand() {
    return '<a class="brand" href="' + url(NAV.main[0].href) + '"><span class="brand-mark">T</span><span>Tigo<b>Me</b>Note</span></a>';
  }
  function navLink(item) {
    var active = item.id === pageId;
    return '<a class="nav-link' + (active ? " active" : "") + '" href="' + url(item.href) + '"' +
      (active ? ' aria-current="page"' : "") + ">" + I(item.icon) +
      '<span class="nav-label">' + esc(item.label) + "</span>" +
      '<span class="dot-count nav-badge hidden" data-for="' + item.id + '"></span></a>';
  }
  function navList(items) {
    return '<nav class="nav-list">' + items.filter(allowed).map(navLink).join("") + "</nav>";
  }
  function userCard() {
    var u = window.TMN_USER || {};
    return '<a class="user-card" href="' + url("app/profile.html") + '">' +
      '<span class="avatar" style="--size:36px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(initials(u.display_name))) + "</span>" +
      '<span class="who"><b>' + esc(u.display_name || "…") + "</b><span>@" + esc(u.username || "") + "</span></span></a>";
  }
  function themeBtn(extraCls) {
    return '<button class="icon-btn js-theme ' + (extraCls || "") + '" type="button" aria-label="Toggle dark mode"></button>';
  }

  // ---------- build ----------
  var main = document.getElementById("page");
  var shell = document.createElement("div");
  shell.className = "shell";

  var nonPrimary = NAV.main.filter(function (i) { return !i.primary; });
  var primary = NAV.main.filter(function (i) { return i.primary; })[0];

  shell.innerHTML =
    // Sidebar (desktop)
    '<aside class="sidebar" aria-label="Main menu">' + brand() +
      (primary ? '<a class="btn btn-primary btn-block sidebar-cta" href="' + url(primary.href) + '">' + I(primary.icon) + esc(primary.label) + "</a>" : "") +
      navList(nonPrimary) +
      '<div class="nav-section">More</div>' + navList(NAV.more) +
      '<div class="sidebar-foot">' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn-ghost js-theme-wide" type="button" style="flex:1"></button>' +
          '<button class="icon-btn js-logout" type="button" aria-label="Log out" title="Log out">' + I("logout") + "</button>" +
        "</div>" +
        '<div class="js-usercard">' + userCard() + "</div>" +
      "</div>" +
    "</aside>" +

    // Topbar (phone)
    '<header class="topbar">' +
      '<button class="icon-btn js-open-drawer" type="button" aria-label="Open menu" aria-expanded="false">' + I("menu") + "</button>" +
      '<div class="topbar-title">' + esc(title) + "</div>" +
      (NAV.topbar || []).map(byId).filter(Boolean).filter(allowed).map(function (item) {
        return '<a class="icon-btn topbar-link' + (item.id === pageId ? " active" : "") + '" href="' + url(item.href) + '" aria-label="' + esc(item.label) + '">' + I(item.icon) +
          '<span class="dot-count nav-badge hidden" data-for="' + item.id + '"></span></a>';
      }).join("") +
      themeBtn() +
    "</header>" +

    '<div class="shell-main"></div>' +

    // Bottom tabs (phone)
    '<nav class="tabbar" aria-label="Tabs">' +
      NAV.tabs.map(byId).filter(Boolean).filter(allowed).map(function (item) {
        var active = item.id === pageId;
        var cls = "tab" + (active ? " active" : "") + (item.primary ? " tab-primary" : "");
        var icon = item.primary ? '<span class="tab-fab">' + I(item.icon) + "</span>" : I(item.icon);
        return '<a class="' + cls + '" href="' + url(item.href) + '"' + (active ? ' aria-current="page"' : "") + ' aria-label="' + esc(item.label) + '">' +
          icon + '<span class="tab-label">' + esc(item.label) + "</span>" +
          '<span class="dot-count nav-badge hidden" data-for="' + item.id + '"></span></a>';
      }).join("") +
    "</nav>" +

    // Drawer (hamburger, phone)
    '<div class="drawer-backdrop js-close-drawer"></div>' +
    '<aside class="drawer" aria-label="Menu" aria-hidden="true">' +
      '<div class="drawer-head">' + brand() +
        '<button class="icon-btn js-close-drawer" type="button" aria-label="Close menu">' + I("x") + "</button></div>" +
      navList(NAV.main) +
      '<div class="nav-section">More</div>' + navList(NAV.more) +
      '<div class="drawer-foot">' +
        '<button class="btn btn-ghost btn-block js-theme-wide" type="button"></button>' +
        '<div class="js-usercard">' + userCard() + "</div>" +
        '<button class="btn btn-danger btn-block js-logout" type="button">' + I("logout") + "Log out</button>" +
      "</div>" +
    "</aside>";

  body.insertBefore(shell, body.firstChild);
  if (main) shell.querySelector(".shell-main").appendChild(main);

  // Icons sa page: <i data-icon="camera"></i>  (optional: data-size="lg" o "sm")
  document.querySelectorAll("#page [data-icon]").forEach(function (el) {
    el.outerHTML = I(el.dataset.icon, el.dataset.size ? "ic-" + el.dataset.size : "");
  });

  var toastHost = document.createElement("div");
  toastHost.className = "toast-host";
  toastHost.setAttribute("aria-live", "polite");
  body.appendChild(toastHost);

  // ---------- behaviour ----------
  var openBtn = shell.querySelector(".js-open-drawer");
  var drawer = shell.querySelector(".drawer");
  function setDrawer(open) {
    body.classList.toggle("drawer-open", open);
    openBtn.setAttribute("aria-expanded", String(open));
    drawer.setAttribute("aria-hidden", String(!open));
    if (open) { var f = drawer.querySelector(".nav-link"); if (f) f.focus(); } else openBtn.focus();
  }
  openBtn.addEventListener("click", function () { setDrawer(true); });
  shell.querySelectorAll(".js-close-drawer").forEach(function (el) { el.addEventListener("click", function () { setDrawer(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && body.classList.contains("drawer-open")) setDrawer(false); });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) body.classList.remove("drawer-open"); });

  function paintTheme() {
    var dark = window.TMN_THEME.current() === "dark";
    shell.querySelectorAll(".js-theme").forEach(function (b) { b.innerHTML = I(dark ? "sun" : "moon"); });
    shell.querySelectorAll(".js-theme-wide").forEach(function (b) { b.innerHTML = I(dark ? "sun" : "moon") + (dark ? "Light mode" : "Dark mode"); });
  }
  shell.querySelectorAll(".js-theme, .js-theme-wide").forEach(function (b) {
    b.addEventListener("click", function () { window.TMN_THEME.toggle(); });
  });
  document.addEventListener("tmn:theme", paintTheme);
  paintTheme();

  shell.querySelectorAll(".js-logout").forEach(function (b) {
    b.addEventListener("click", function () {
      b.disabled = true;
      if (window.TMN_AUTH) window.TMN_AUTH.logout();
    });
  });

  // Kapag na-update ang user galing sa server (auth-guard), i-refresh ang user card
  document.addEventListener("tmn:user", function () {
    shell.querySelectorAll(".js-usercard").forEach(function (el) { el.innerHTML = userCard(); });
  });

  // ---------- public helpers ----------
  window.TMN_UI = {
    esc: esc,
    initials: initials,
    toast: function (msg, ms) {
      var t = document.createElement("div");
      t.className = "toast"; t.textContent = msg;
      toastHost.appendChild(t);
      setTimeout(function () { t.remove(); }, ms || 2600);
    },
    setBadge: function (id, n) {
      document.querySelectorAll('.nav-badge[data-for="' + id + '"]').forEach(function (b) {
        b.textContent = n > 99 ? "99+" : String(n);
        b.classList.toggle("hidden", !n);
      });
    }
  };

  // Textarea na kusang humahaba habang nagta-type (walang scrollbar sa gilid): <textarea data-autogrow="140">
  function autogrow(t) {
    var max = Number(t.getAttribute("data-autogrow")) || 140;
    t.style.height = "auto";
    var h = Math.min(max, t.scrollHeight + 2);
    t.style.height = h + "px";
    t.style.overflowY = t.scrollHeight + 2 > max ? "auto" : "hidden";
  }
  document.addEventListener("input", function (e) { if (e.target && e.target.matches && e.target.matches("textarea[data-autogrow]")) autogrow(e.target); });
  window.TMN_AUTOGROW = autogrow;
})();
