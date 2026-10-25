/* TigoMeNote · pages/get.js (get/index.html) — "Get the app": Android APK, iPhone (Home Screen), Computer (QR)
   Ang APK link, version at laki ay galing sa app-version.json (ginagawa ng .github/workflows/apk.yml).
   Kusang pinipili ang tab ayon sa device. QR: assets/img/qr-get.svg (gawa ng tools/make-qr.py, walang library). */
(function () {
  var C = window.TMN_CONFIG, A = C.apps, I = window.TMN_ICON;
  if (window.TMN_I18N) TMN_I18N.mountPicker(document.getElementById("langMini"));
  var btn = document.querySelector(".js-theme");
  function paint() { btn.innerHTML = I(window.TMN_THEME.current() === "dark" ? "sun" : "moon"); }
  btn.addEventListener("click", function () { window.TMN_THEME.toggle(); });
  document.addEventListener("tmn:theme", paint); paint();

  var ua = navigator.userAgent;
  var isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  // Browser sa loob ng ibang app (WebView): "; wv)" o mga kilalang app. Hindi dito gumagana ang download ng APK.
  var inApp = isAndroid && /; wv\)|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|GSA\//.test(ua);
  // Android intent: buksan ang https link sa Chrome (kung walang Chrome → fallback na link sa default browser)
  function chrome(url) {
    var u = new URL(url, location.href);
    return "intent://" + u.host + u.pathname + u.search + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(u.href) + ";end";
  }
  function dl(url) { return inApp ? chrome(url) : url; }
  if (inApp) {
    document.getElementById("inApp").hidden = false;
    document.getElementById("inAppBtn").href = chrome(location.href);
  }

  // ---------- tabs ----------
  function show(tab) {
    document.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === tab)); b.setAttribute("aria-pressed", String(b.dataset.tab === tab)); });
    document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== tab; });
  }
  document.querySelector(".ga-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) show(b.dataset.tab); });
  show(isAndroid ? "android" : isIOS ? "ios" : "pc");

  // ---------- Android: pinakabagong APK ----------
  function mb(n) { return (n / 1048576).toFixed(1) + " MB"; }
  fetch(A.versionJson + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (v) {
    var m = v.main; if (!m || !m.url) throw new Error();
    var a = document.getElementById("apkBtn"); a.href = dl(m.url);
    document.getElementById("apkMeta").textContent = "Version " + m.version + " · " + mb(m.size) + (m.date ? " · " + m.date : "");
    // Listahan ng apps: bawat app na may APK = sariling ⬇ Download (lahat ng device; sa iPhone: "Android only")
    document.querySelectorAll(".ga-app[data-app]").forEach(function (row) {
      var a = v[row.dataset.app], tag = row.querySelector(".ga-tag"); if (!a || !a.url) return;
      if (isIOS) { tag.textContent = "Android only"; return; }
      var link = document.createElement("a"); link.className = "btn btn-primary btn-sm ga-tag-btn"; link.href = dl(a.url); link.rel = "noopener";
      link.innerHTML = "⬇ Download <small>" + mb(a.size) + "</small>"; link.title = a.name + " · Version " + a.version; tag.replaceWith(link);
    });
  }).catch(function () {
    document.getElementById("apkMeta").textContent = "Couldn't load the download. Check your internet and refresh.";
  });

  // ---------- Computer: QR (static na larawan: assets/img/qr-get.svg) ----------
  document.getElementById("getUrl").textContent = A.publicGet.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Naka-login? "Open on web" → diretso sa app
  try { if (localStorage.getItem(C.storageKeys.token)) document.querySelector(".js-open").href = "../app/home.html"; } catch (e) {}
})();
