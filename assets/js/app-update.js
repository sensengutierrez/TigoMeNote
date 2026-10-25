/* TigoMeNote · app-update.js — APK lang (isinisingit ng apk/build-web.py pagkatapos ng app-mode.js)
   Kapag may mas bagong version sa tigomenote.com/app-version.json, HINDI na magagamit ang app hangga't hindi naa-update:
   lalabas ang "Install new version" → dina-download ng app mismo ang APK (may progress) → bubukas ang installer ng Android.
   Kung hindi kaya (luma ang app / walang bridge): bubuksan ang download sa Chrome.
   Chine-check: pagbukas, pagbalik sa app (resume) at bawat 30 minuto. Walang internet = hindi hinaharang. */
(function () {
  if (!window.TMN_IN_APP) return;
  var C = window.TMN_CONFIG, APP_ID = window.TMN_APP_ID || "main", U = window.TMNUpdate, NA = window.TMNApps;
  var Cap = window.Capacitor, P = (Cap && Cap.Plugins) || {};
  var URL_V = (C.apps && C.apps.remoteVersion) || "https://tigomenote.com/app-version.json";
  var NAMES = { main: "TigoMeNote", chat: "TigoMeNote Chat", tigo: "Tigo" };
  var code = function (v) { var p = String(v || "0.0.0").split(".").map(Number); return (p[0] || 0) * 1000000 + (p[1] || 0) * 1000 + (p[2] || 0); };
  var mine = code(C.version), box = null, info = null, timer = null;

  function check() {
    if (box || !navigator.onLine) return;
    fetch(URL_V + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      var a = v && v[APP_ID];
      if (a && a.url && (a.code || code(a.version)) > mine) { info = a; show(); }
    }).catch(function () {});
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function show() {
    if (box) return;
    box = el("div", "upd", null);
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "updT");
    var mb = info.size ? " · " + (info.size / 1048576).toFixed(1) + " MB" : "";
    box.innerHTML =
      '<div class="upd-card">' +
        '<img class="upd-ic" src="' + C.root + "assets/img/app-" + APP_ID + '.png" alt="" width="84" height="84">' +
        '<h2 id="updT">New version available</h2>' +
        '<p class="upd-sub">' + NAMES[APP_ID] + " " + info.version + mb + "</p>" +
        '<p class="upd-txt">Install the new version to keep using the app.</p>' +
        '<div class="upd-bar hidden"><i></i></div>' +
        '<p class="upd-msg small" aria-live="polite"></p>' +
        '<button type="button" class="btn btn-primary btn-lg upd-go">⬇ Install new version</button>' +
        '<button type="button" class="upd-alt small">Download in Chrome instead</button>' +
      "</div>";
    document.body.appendChild(box);
    document.documentElement.classList.add("upd-open");
    box.querySelector(".upd-go").addEventListener("click", start);
    box.querySelector(".upd-alt").addEventListener("click", chrome);
  }
  function msg(t) { box.querySelector(".upd-msg").textContent = t || ""; }
  function chrome() { if (NA && NA.openUrl) NA.openUrl(info.url); else location.href = info.url; }

  var done = false;
  function start() {
    var go = box.querySelector(".upd-go");
    if (done) { U.reopen(); msg("Tap Install on the next screen. Your data stays."); return; }
    if (!U || !U.install) { chrome(); msg("Opening the download in Chrome…"); return; }
    if (!U.canInstall()) {
      msg("Allow \"Install unknown apps\" for " + NAMES[APP_ID] + ", then come back and tap Install again.");
      U.allowInstall(); return;
    }
    if (!U.install(info.url)) { chrome(); msg("Opening the download in Chrome…"); return; }
    go.disabled = true; go.textContent = "Downloading…";
    var bar = box.querySelector(".upd-bar"), fill = bar.querySelector("i"); bar.classList.remove("hidden");
    clearInterval(timer);
    timer = setInterval(function () {
      var p = U.progress();
      if (p >= 0 && p <= 100) { fill.style.width = p + "%"; go.textContent = "Downloading… " + p + "%"; }
      else if (p === 101) {
        clearInterval(timer); fill.style.width = "100%"; go.disabled = false; go.textContent = "Install"; done = true;
        msg("Tap Install on the next screen. Your data stays.");
      } else if (p === -2) {
        clearInterval(timer); go.disabled = false; go.textContent = "⬇ Try again"; bar.classList.add("hidden");
        msg("Download failed. Check your internet, or download in Chrome.");
      }
    }, 400);
  }

  // Back button: sarado ang ibang bagay, hindi ang update
  if (P.App && P.App.addListener) P.App.addListener("resume", check);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) check(); });
  setInterval(check, 30 * 60 * 1000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", check); else check();
  window.TMN_UPDATE = { check: check, open: function () { return !!box; } };
})();
