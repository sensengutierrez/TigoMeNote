/* TigoMeNote · components/music-tigo.js — si Tigo sa "Now playing" ng music player (web at APK)
     TMN_MUSIC_TIGO.html()          → markup (ilagay sa loob ng .mu-now)
     TMN_MUSIC_TIGO.set(root, on)   → on = tumutugtog: sumasayaw (music1–3, palit bawat 0.5 s); off = tulog (rest)
   Ang mga larawan ay assets/img/tigo2d/*.svg (gawa ng tools/make-widget-art.py; pareho sa widget ng Android). */
(function () {
  var DANCE = ["music1", "music2", "music3", "music2"];
  function src(n) { return ((window.TMN_CONFIG && TMN_CONFIG.root) || "/") + "assets/img/tigo2d/" + n + ".svg"; }
  function html() { return '<div class="mu-tigo" aria-hidden="true"><img alt="" width="96" height="96" src="' + src("rest") + '"></div>'; }
  function set(root, on) {
    var box = root && root.querySelector(".mu-tigo"); if (!box) return;
    var img = box.querySelector("img");
    if (!!box._on === !!on) return;
    box._on = !!on; clearInterval(box._t); box.classList.toggle("on", !!on);
    if (!on) { img.src = src("rest"); return; }
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, i = 0;
    img.src = src(DANCE[0]);
    if (reduce) return;
    box._t = setInterval(function () {
      if (!document.body.contains(box)) { clearInterval(box._t); return; }
      if (document.hidden) return;
      i = (i + 1) % DANCE.length; img.src = src(DANCE[i]);
    }, 520);
  }
  // i-preload para walang kisap
  if (document.readyState !== "loading") DANCE.concat("rest").forEach(function (n) { new Image().src = src(n); });
  else document.addEventListener("DOMContentLoaded", function () { DANCE.concat("rest").forEach(function (n) { new Image().src = src(n); }); });
  window.TMN_MUSIC_TIGO = { html: html, set: set };
})();
