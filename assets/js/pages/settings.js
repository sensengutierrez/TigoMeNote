/* TigoMeNote · pages/settings.js (app/settings.html) */
(function () {
  var C = window.TMN_CONFIG, T = window.TMN_THEME;

  var seg = document.getElementById("themeSeg");
  function paintSeg() {
    var mode = T.get();
    seg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
  }
  seg.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-mode]");
    if (!b) return;
    T.set(b.dataset.mode);
    paintSeg();
  });
  document.addEventListener("tmn:theme", paintSeg);
  paintSeg();

  function paintUser() {
    var u = window.TMN_USER || {};
    document.getElementById("sUser").textContent = u.username ? "@" + u.username : "";
    document.getElementById("sRole").textContent = u.role || "";
  }
  paintUser();
  document.addEventListener("tmn:user", paintUser);

  document.getElementById("sLogout").addEventListener("click", function () {
    this.disabled = true;
    window.TMN_AUTH.logout();
  });

  // Language (assets/js/i18n.js). Naka-save sa browser; nagre-reload ang page para mailapat.
  var L = window.TMN_I18N, pick = document.getElementById("langPick");
  pick.innerHTML = L.langs.map(function (l) {
    return '<button type="button" role="radio" data-lang="' + l.code + '" aria-checked="' + (l.code === L.lang) + '" lang="' + l.code + '"' + (l.dir ? ' dir="' + l.dir + '"' : "") + ">" +
      "<b>" + l.native + "</b>" + (l.native !== l.name ? '<span class="faint small">' + l.name + "</span>" : "") + "</button>";
  }).join("");
  pick.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === L.lang) return;
    L.set(b.dataset.lang);
  });

  document.getElementById("sVersion").textContent = C.appName + " v" + C.version;
  // Sleep & breaks, Privacy, Parental supervision
  if (window.TMN_WB_SETTINGS) TMN_WB_SETTINGS.mount(document.getElementById("wbMount"));
  if (window.TMN_FILES_SETTINGS) TMN_FILES_SETTINGS.mount(document.getElementById("filesMount"));
})();
