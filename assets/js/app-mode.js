/* TigoMeNote · app-mode.js — "app mode" para sa APK lang (isinisingit ng CI sa bawat page ng app; wala sa web)
   - Walang zoom (pinch o zoom ng phone) → hindi lumiliit ang app. Ang textZoom 100 ay nasa MainActivity.
   - Back button ng Android: isara muna ang modal / sheet / menu → bumalik ng page → labas ng app.
   - window.TMN_APP (para sa native-bridge.js) · window.TMN_APP_ID (main | chat | tigo) · <html class="in-app app-<id>"> para sa CSS.
   Kailangan: Capacitor (kusang nilalagay ng APK). */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
  var P = Cap.Plugins || {};
  // Aling APK: "main" (TigoMeNote) | "chat" (TigoMeNote Chat) | "tigo" — galing sa ?app= ng script na ito (build-web.py)
  var me = document.currentScript, m = me && /[?&]app=(\w+)/.exec(me.src);
  var APP_ID = (m && m[1]) || "main";
  window.TMN_IN_APP = true; window.TMN_APP_ID = APP_ID;
  document.documentElement.classList.add("in-app", "app-" + APP_ID);

  // walang zoom
  var vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");

  // tulay papunta sa native (dadagdagan: FCM push, location sa background, SMS, files)
  window.TMN_APP = window.TMN_APP || {
    appName: APP_ID === "chat" ? "messenger" : APP_ID === "tigo" ? "tigo" : "tigomenote",
    pushToken: function () { return Promise.resolve(null); }
  };

  function closeTop() {
    var bds = document.querySelectorAll(".modal-backdrop");
    if (bds.length) {
      var x = bds[bds.length - 1].querySelector(".modal-head .icon-btn");
      if (x) { x.click(); return true; }
    }
    var sh = document.getElementById("tgSheet");
    if (sh && !sh.classList.contains("hidden")) { var c = sh.querySelector('[data-sheet="close"]'); if (c) { c.click(); return true; } }
    var dr = document.getElementById("tgDanceRow");
    if (dr && !dr.classList.contains("hidden")) { var d = document.getElementById("tgDance"); if (d) { d.click(); return true; } }
    if (document.body.classList.contains("drawer-open")) { var t = document.querySelector("[aria-controls][aria-expanded=\"true\"]"); if (t) t.click(); else document.body.classList.remove("drawer-open"); return true; }
    return false;
  }
  if (P.App && P.App.addListener) {
    P.App.addListener("backButton", function (e) {
      if (closeTop()) return;
      var start = { main: "app/home", chat: "app/messages", tigo: "app/tigo" }[APP_ID] || "app/home";
      var home = location.pathname.indexOf("/" + start + ".html") >= 0 || /\/login\.html$/.test(location.pathname);
      if (!home && (e && e.canGoBack !== false) && history.length > 1) history.back();
      else if (P.App.minimizeApp) P.App.minimizeApp(); else P.App.exitApp();
    });
  }

  // kulay ng status bar ayon sa theme (DARK = puting text)
  function bar() {
    var dark = document.documentElement.dataset.theme === "dark";
    var m = document.querySelector('meta[name="theme-color"]'), color = (m && m.getAttribute("content")) || (dark ? "#0e0e10" : "#ffffff");
    try {
      if (window.TMNNative && TMNNative.setBars) TMNNative.setBars(color, dark);   // MainActivity (patch-android.py)
      else if (P.StatusBar && P.StatusBar.setStyle) P.StatusBar.setStyle({ style: dark ? "DARK" : "LIGHT" });
    } catch (e) {}
  }
  document.addEventListener("tmn:theme", bar);
  function ready() {
    bar();
    if (P.SplashScreen && P.SplashScreen.hide) setTimeout(function () { P.SplashScreen.hide(); }, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
