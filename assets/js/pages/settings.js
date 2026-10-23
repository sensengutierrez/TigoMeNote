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

  document.getElementById("sVersion").textContent = C.appName + " v" + C.version;
})();
