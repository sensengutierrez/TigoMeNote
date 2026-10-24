/* TigoMeNote · pages/legal.js (legal/*.html) — mga public na policy page
   - Contact: kung may TMN_CONFIG.legal.contactEmail, iyon ang ipinapakita (mailto); kung wala, ang Report button.
   - Theme toggle at language dropdown sa itaas. */
(function () {
  var L = (window.TMN_CONFIG && TMN_CONFIG.legal) || {};
  if (L.contactEmail) {
    document.querySelectorAll("[data-contact]").forEach(function (el) {
      el.innerHTML = 'email <a href="mailto:' + L.contactEmail + '">' + L.contactEmail + "</a> or the <b>Report</b> button in the app";
    });
  }
  var y = document.querySelector("[data-year]"); if (y) y.textContent = String(Math.max(2026, new Date().getFullYear()));
  var t = document.querySelector(".js-theme");
  function paint() { if (t && window.TMN_ICON) t.innerHTML = TMN_ICON(TMN_THEME.current() === "dark" ? "sun" : "moon"); }
  if (t) { t.addEventListener("click", function () { TMN_THEME.toggle(); }); paint(); document.addEventListener("tmn:theme", paint); }
  var cur = document.querySelector(".lg-nav [aria-current]");
  if (cur && cur.scrollIntoView && innerWidth < 900) cur.scrollIntoView({ block: "nearest", inline: "center" });
  if (window.TMN_I18N) TMN_I18N.mountPicker(document.getElementById("langMini"));
})();
