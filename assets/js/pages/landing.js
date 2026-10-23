/* TigoMeNote · pages/landing.js (index.html) */
(function () {
  if (window.TMN_I18N) TMN_I18N.mountPicker(document.getElementById("langMini"));
  var I = window.TMN_ICON, C = window.TMN_CONFIG, K = C.storageKeys;

  document.querySelectorAll("[data-icon]").forEach(function (el) {
    el.outerHTML = I(el.dataset.icon, el.dataset.size ? "ic-" + el.dataset.size : "");
  });

  var btn = document.querySelector(".js-theme");
  function paint() { btn.innerHTML = I(window.TMN_THEME.current() === "dark" ? "sun" : "moon"); }
  btn.addEventListener("click", function () { window.TMN_THEME.toggle(); });
  document.addEventListener("tmn:theme", paint);
  paint();

  // Naka-login na? Diretso ang buttons sa app.
  var token = null;
  try { token = localStorage.getItem(K.token) || sessionStorage.getItem(K.token); } catch (e) {}
  if (token) {
    document.querySelectorAll(".js-start").forEach(function (a) { a.href = "app/home.html"; a.innerHTML = "Open TigoMeNote " + I("arrowRight"); });
    document.querySelectorAll(".js-signin").forEach(function (a) { a.classList.add("hidden"); });
  }
})();
