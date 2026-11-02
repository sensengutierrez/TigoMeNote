/* TigoMeNote · pages/settings.js (app/settings.html)
   Main list (grupo: Personalization, Alerts, Privacy & security, Account, About) at mga page sa loob:
   #appearance · #language · #background · #privacy · #files — gumagana ang Back ng Android/browser (hash).
   Appearance: Theme (agad), Theme color / Text size / UI style = preview muna → "N changes · Discard · Review" → Save.
   Kailangan: theme.js, ui-prefs.js, i18n.js, modal.js, appearance-settings.js, wellbeing-settings.js, files-settings.js */
(function () {
  var C = window.TMN_CONFIG, T = window.TMN_THEME, P = window.TMN_UI_PREFS, L = window.TMN_I18N, UI = window.TMN_UI;
  var $ = function (id) { return document.getElementById(id); };
  var PANES = ["main", "appearance", "language", "background", "privacy", "files"];
  var mounted = {};

  // ---------- pages sa loob (hash) ----------
  function show() {
    var want = (location.hash || "").replace("#", "");
    if (PANES.indexOf(want) < 0) want = "main";
    if (cur === "appearance" && want !== "appearance") leaveAppearance();
    document.querySelectorAll(".set-pane").forEach(function (p) { p.hidden = p.dataset.pane !== want; });
    cur = want; window.scrollTo(0, 0);
    if (want === "background" && !mounted.bg && window.TMN_LOOK_UI) { mounted.bg = 1; TMN_LOOK_UI.mount($("lookMount")); }
    if (want === "privacy" && !mounted.wb && window.TMN_WB_SETTINGS) { mounted.wb = 1; TMN_WB_SETTINGS.mount($("wbMount"), { part: "rest" }); }
    if (want === "files" && !mounted.files && window.TMN_FILES_SETTINGS) { mounted.files = 1; TMN_FILES_SETTINGS.mount($("filesMount")); }
    if (want === "appearance") enterAppearance();
    paintMain();
  }
  var cur = "main";
  document.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (go) { location.hash = go.dataset.go; return; }
    if (e.target.closest(".set-back")) { if (history.length > 1 && cur !== "main") history.back(); else location.hash = ""; }
  });
  window.addEventListener("hashchange", show);

  // ---------- main list ----------
  function name(kind, id) { return P.OPTIONS[kind].filter(function (o) { return o.id === id; })[0].name; }
  function paintMain() {
    var dark = T.current() === "dark", sw = $("sDark");
    sw.setAttribute("aria-checked", String(dark));
    $("sDarkSub").textContent = T.get() === "system" ? "Following your device (Auto)" : "Tap to switch the mood";
    var p = P.get();
    $("sAppSub").textContent = name("accent", p.accent) + " · " + name("size", p.size) + " · " + name("style", p.style);
    var lg = L.langs.filter(function (l) { return l.code === L.lang; })[0];
    $("sLangSub").textContent = lg ? lg.native + (lg.native !== lg.name ? " · " + lg.name : "") : "";
    var lk = window.TMN_LOOK ? TMN_LOOK.get() : null;
    $("sBgSub").textContent = !lk || lk.use === "none" ? "None" : lk.use === "image" ? "Your photo" : "Color";
  }
  $("sDark").addEventListener("click", function () { T.set(T.current() === "dark" ? "light" : "dark"); paintMain(); paintSeg(); });
  document.addEventListener("tmn:theme", function () { paintMain(); paintSeg(); });
  document.addEventListener("tmn:look", paintMain);

  function paintUser() {
    var u = window.TMN_USER || {};
    $("sUser").textContent = u.username ? "@" + u.username : "";
    $("sRole").textContent = u.role || "";
  }
  paintUser();
  document.addEventListener("tmn:user", paintUser);
  $("sLogout").addEventListener("click", function () { this.disabled = true; window.TMN_AUTH.logout(); });
  // Delete account: password + "DELETE" (auth-fast deleteAccount). Ang nasa phone (Pictures/Documents TigoMeNote) ay hindi nabubura.
  $("sDelete").addEventListener("click", function () {
    var body = document.createElement("form"); body.className = "del-acc";
    body.innerHTML =
      '<p>This permanently deletes your account. It can’t be undone.</p>' +
      '<ul class="small"><li>Deleted: your profile, posts, photos and status on our server, comments and likes, followers, Family &amp; Friends, location history, SOS alerts, Tigo, reminders and notifications.</li>' +
      '<li>Your messages are blanked in other people’s chats.</li>' +
      '<li>Not deleted: files on your phone (Pictures/TigoMeNote, Documents/TigoMeNote) and your Daily notes on this device.</li></ul>' +
      '<label class="field"><span>Password</span><input class="input" type="password" autocomplete="current-password" required></label>' +
      '<label class="field"><span>Type <b>DELETE</b> to confirm</span><input class="input del-confirm" autocomplete="off" autocapitalize="characters" required></label>' +
      '<p class="del-msg small" aria-live="polite"></p>' +
      '<button type="submit" class="btn btn-danger-solid btn-block">Delete my account</button>';
    var m = TMN_MODAL.open({ title: "Delete account?", size: "sm", body: body });
    body.addEventListener("submit", async function (e) {
      e.preventDefault();
      var pw = body.querySelector('[type="password"]').value, cf = body.querySelector(".del-confirm").value.trim().toUpperCase(), msg = body.querySelector(".del-msg");
      if (cf !== "DELETE") { msg.textContent = "Type DELETE to confirm."; return; }
      var btn = body.querySelector("button[type=submit]"); btn.disabled = true; msg.textContent = "Deleting…";
      try {
        var r = await fetch(C.fn.auth, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ action: "deleteAccount", token: window.TMN_TOKEN, password: pw, confirm: cf }) });
        var d = await r.json().catch(function () { return {}; });
        if (!r.ok || !d.ok) throw new Error(d.error || "Couldn’t delete the account.");
        m.close();
        try { localStorage.clear(); sessionStorage.clear(); if (window.caches) await caches.delete("tmn-media-v1"); } catch (er) {}
        location.replace(C.root + "login.html?deleted=1");
      } catch (err) { msg.textContent = err.message; btn.disabled = false; }
    });
  });
  $("sVersion").textContent = C.appName + " v" + C.version;
  $("sBug").addEventListener("click", function () { if (window.TMN_BUG) TMN_BUG.open(); });

  // ---------- Language ----------
  var pick = $("langPick");
  pick.innerHTML = L.langs.map(function (l) {
    return '<button type="button" class="set-item" role="radio" data-lang="' + l.code + '" aria-checked="' + (l.code === L.lang) + '" lang="' + l.code + '"' + (l.dir ? ' dir="' + l.dir + '"' : "") + ">" +
      '<span class="set-ic set-code">' + l.code.toUpperCase() + '</span><span class="set-txt"><b>' + l.native + "</b>" + (l.native !== l.name ? '<span class="faint small">' + l.name + "</span>" : "") + "</span>" +
      '<span class="set-check" aria-hidden="true"></span></button>';
  }).join("");
  pick.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === L.lang) return;
    L.set(b.dataset.lang);
  });

  // ---------- Appearance ----------
  var seg = $("themeSeg");
  function paintSeg() { var m = T.get(); seg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === m)); }); }
  seg.addEventListener("click", function (e) { var b = e.target.closest("button[data-mode]"); if (b) { T.set(b.dataset.mode); paintSeg(); paintMain(); } });
  paintSeg();

  var saved = P.get(), draft = Object.assign({}, saved);
  var LABEL = { accent: "Theme color", size: "Text size", style: "UI style" };
  $("pAccent").innerHTML = P.OPTIONS.accent.map(function (o) {
    return '<button type="button" class="set-sw" role="radio" data-k="accent" data-v="' + o.id + '" aria-label="' + o.name + '" style="--sw:' + o.color + '"><i></i></button>';
  }).join("");
  $("pSize").innerHTML = P.OPTIONS.size.map(function (o) {
    return '<button type="button" class="set-size" role="radio" data-k="size" data-v="' + o.id + '" aria-label="' + o.name + '"><span style="font-size:' + Math.round(15 * o.pct / 100) + 'px">Aa</span></button>';
  }).join("");
  $("pStyle").innerHTML = P.OPTIONS.style.map(function (o) {
    return '<button type="button" class="set-style" role="radio" data-k="style" data-v="' + o.id + '"><span class="set-shape s-' + o.id + '"></span><small>' + o.name + "</small></button>";
  }).join("");
  function changes() { return ["accent", "size", "style"].filter(function (k) { return draft[k] !== saved[k]; }); }
  function paintAppearance() {
    document.querySelectorAll("[data-pane=appearance] [data-k]").forEach(function (b) { b.setAttribute("aria-checked", String(draft[b.dataset.k] === b.dataset.v)); });
    $("vAccent").textContent = name("accent", draft.accent); $("vSize").textContent = name("size", draft.size); $("vStyle").textContent = name("style", draft.style);
    var n = changes().length;
    $("sReview").classList.toggle("hidden", !n);
    document.querySelector("[data-pane=appearance]").classList.toggle("has-review", !!n);
    $("sCount").textContent = n + (n === 1 ? " change" : " changes");
  }
  function enterAppearance() { saved = P.get(); draft = Object.assign({}, saved); paintAppearance(); }
  function leaveAppearance() { if (changes().length) { P.apply(saved); draft = Object.assign({}, saved); if (UI) UI.toast("Appearance not saved."); } }
  document.querySelector("[data-pane=appearance]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]"); if (!b) return;
    draft[b.dataset.k] = b.dataset.v; P.apply(draft); paintAppearance();      // preview agad
  });
  $("sDiscard").addEventListener("click", function () { draft = Object.assign({}, saved); P.apply(saved); paintAppearance(); });
  $("sReviewBtn").addEventListener("click", function () {
    var list = changes();
    var body = document.createElement("div"); body.className = "set-changes";
    body.innerHTML = '<p class="faint small" style="margin:0 0 8px">' + list.length + (list.length === 1 ? " change" : " changes") + " ready to apply</p>" +
      list.map(function (k) {
        return '<div class="set-chg"><span>' + LABEL[k] + '</span><span><span class="faint">' + name(k, saved[k]) + "</span> → <b>" + name(k, draft[k]) + "</b></span></div>";
      }).join("") +
      '<button type="button" class="btn btn-primary btn-block set-save">Save changes</button>';
    var m = TMN_MODAL.open({ title: "Review changes", size: "sm", cls: "modal-sheet", body: body });
    body.querySelector(".set-save").addEventListener("click", function () {
      saved = P.set(draft); draft = Object.assign({}, saved); m.close(); paintAppearance(); paintMain();
      if (UI) UI.toast("Saved ✓");
    });
  });

  show();
})();
