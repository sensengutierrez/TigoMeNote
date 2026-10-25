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

  // ---------- push (Firebase): token ng phone na ito para sa server ----------
  // pushToken()            → token kung pinayagan na (walang tanong) · null kung hindi
  // pushToken({ ask: true }) → hihingi muna ng permission (Android 13+)
  // Mga channel (Settings → Notifications ng app): pareho ang id sa backend/push.ts
  var PN = P.PushNotifications, tokP = null, waiters = [];
  var CHANNELS = [
    { id: "messages", name: "Messages", description: "New messages and calls", importance: 5, vibration: true },
    { id: "social", name: "Likes, comments and follows", description: "Activity on your posts and profile", importance: 3 },
    { id: "safety", name: "Safety and SOS", description: "SOS alerts and circle invites", importance: 5, vibration: true },
    { id: "reminders", name: "Reminders and alarms", description: "Your Daily reminders", importance: 5, vibration: true },
    { id: "tigo", name: "Tigo", description: "Your Tigo and friends' Tigo", importance: 3 }
  ];
  function done(t) { var w = waiters; waiters = []; w.forEach(function (f) { f(t); }); }
  if (PN && PN.addListener) {
    PN.addListener("registration", function (t) { done(t && t.value ? t.value : null); });
    PN.addListener("registrationError", function () { done(null); });
    // pinindot ang notification → buksan ang tamang page
    PN.addListener("pushNotificationActionPerformed", function (a) {
      var d = (a && a.notification && a.notification.data) || {}, u = String(d.url || "");
      if (!u || /^[a-z]+:/i.test(u) || u.indexOf("//") === 0) return;
      var root = (window.TMN_CONFIG && TMN_CONFIG.root) || "/";
      location.href = root + u.replace(/^\/+/, "");
    });
  }
  function pushToken(opts) {
    if (!PN || !PN.checkPermissions) return Promise.resolve(null);
    if (tokP) return tokP;
    var ask = !!(opts && opts.ask);
    return PN.checkPermissions().then(function (p) {
      if (p.receive === "granted" || !ask || p.receive === "denied") return p;
      return PN.requestPermissions();
    }).then(function (p) {
      if (!p || p.receive !== "granted") return null;
      if (PN.createChannel) CHANNELS.forEach(function (c) { PN.createChannel(c).catch(function () {}); });
      tokP = new Promise(function (res) {
        waiters.push(res);
        setTimeout(function () { res(null); }, 15000);
        PN.register().catch(function () { res(null); });
      }).then(function (t) { if (!t) tokP = null; return t; });
      return tokP;
    }).catch(function () { tokP = null; return null; });
  }

  // tulay papunta sa native (dadagdagan: location sa background, SMS, files)
  // ibang TigoMeNote app: naka-install? buksan · kung wala → download page (sa Chrome) habang wala pa sa Play Store
  var PKG = { messenger: "com.tigomenote.chat", chat: "com.tigomenote.chat", tigomenote: "com.tigomenote.app", main: "com.tigomenote.app", tigo: "com.tigomenote.tigo" };
  var NA = window.TMNApps;
  window.TMN_APP = window.TMN_APP || {
    appName: APP_ID === "chat" ? "messenger" : APP_ID === "tigo" ? "tigo" : "tigomenote",
    pushToken: pushToken,
    hasApp: function (name) { try { return !!(NA && NA.hasApp(PKG[name] || name)); } catch (e) { return false; } },
    openApp: function (name) { try { return !!(NA && NA.openApp(PKG[name] || name)); } catch (e) { return false; } },
    installApp: function () {
      var url = (window.TMN_CONFIG && TMN_CONFIG.apps && TMN_CONFIG.apps.publicGet) || "https://tigomenote.com/get/";
      if (NA && NA.openUrl) NA.openUrl(url); else location.href = url;
      return true;
    }
  };

  function closeTop() {
    if (window.TMN_UPDATE && TMN_UPDATE.open()) return true;   // may update: hindi puwedeng isara
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
    // version ng app sa ibaba ng menu (para malaman kung updated)
    var foot = document.querySelector(".drawer-foot"), C = window.TMN_CONFIG;
    if (foot && C && !foot.querySelector(".app-ver")) {
      var v = document.createElement("p"); v.className = "app-ver faint small";
      v.textContent = { main: "TigoMeNote", chat: "TigoMeNote Chat", tigo: "Tigo" }[APP_ID] + " app · v" + C.version;
      foot.appendChild(v);
    }
    if (P.SplashScreen && P.SplashScreen.hide) setTimeout(function () { P.SplashScreen.hide(); }, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
