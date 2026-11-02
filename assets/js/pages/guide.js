/* TigoMeNote · pages/guide.js — "How to use": sa Chat app, Messages / Profile / Settings lang ang ipinapakita;
   ang pindot sa topic ay maayos na nag-i-scroll (walang talon). */
(function () {
  if (window.TMN_APP_ID === "chat") document.querySelectorAll('.g-sec[data-for="main"]').forEach(function (s) {
    s.hidden = true; var a = document.querySelector('.g-toc a[href="#' + s.id + '"]'); if (a) a.hidden = true;
  });
  document.querySelector(".g-toc").addEventListener("click", function (e) {
    var a = e.target.closest("a[href^='#']"); if (!a) return;
    var t = document.querySelector(a.getAttribute("href")); if (!t) return;
    e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
