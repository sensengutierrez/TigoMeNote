/* TigoMeNote · app-update.js — APK lang (isinisingit ng apk/build-web.py pagkatapos ng app-mode.js)
   Kapag may mas bagong version sa tigomenote.com/app-version.json, HINDI na magagamit ang app hangga't hindi naa-update:
   lalabas ang "Download new version" + What's new → dina-download sa Chrome (gumagana sa lahat ng phone; hindi Play Store kaya walang auto-install).
   Inalis ang "Install inside the app" (0.11.33): "There was a problem while parsing the package" sa phone ni Bench; Chrome lang ang maaasahan.
   Chine-check: pagbukas, pagbalik sa app (resume) at bawat 30 minuto. Walang internet = hindi hinaharang. */
(function () {
  if (!window.TMN_IN_APP) return;
  var C = window.TMN_CONFIG, APP_ID = window.TMN_APP_ID || "main", NA = window.TMNApps;
  var Cap = window.Capacitor, P = (Cap && Cap.Plugins) || {};
  var URL_V = (C.apps && C.apps.remoteVersion) || "https://tigomenote.com/app-version.json";
  var NAMES = { main: "TigoMeNote", chat: "TigoMeNote Chat", tigo: "Tigo" };
  var code = function (v) { var p = String(v || "0.0.0").split(".").map(Number); return (p[0] || 0) * 1000000 + (p[1] || 0) * 1000 + (p[2] || 0); };
  var mine = code(C.version), box = null, info = null, notes = [];
  var URL_N = URL_V.replace(/app-version\.json.*$/, "whatsnew.json");

  function check() {
    if (box || !navigator.onLine) return;
    fetch(URL_V + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      var a = v && v[APP_ID];
      if (a && a.url && (a.code || code(a.version)) > mine) {
        info = a;
        // Ano ang bago (whatsnew.json): mga version na mas bago sa nakalagay sa phone na ito
        fetch(URL_N + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (n) {
          notes = Object.keys(n || {}).filter(function (k) { return code(k) > mine && code(k) <= (a.code || code(a.version)); })
            .sort(function (x, y) { return code(y) - code(x); }).slice(0, 4).map(function (k) { return { v: k, items: n[k] || [] }; });
          show();
        });
      }
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
        (notes.length ? '<div class="upd-new"><b>What’s new</b>' + notes.map(function (n) {
          return '<p class="upd-v">' + n.v + "</p><ul>" + n.items.map(function (t) { return "<li>" + String(t).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</li>"; }).join("") + "</ul>";
        }).join("") + "</div>" : "") +
        '<p class="upd-msg small" aria-live="polite"></p>' +
        '<button type="button" class="btn btn-primary btn-lg upd-dl">⬇ Download new version</button>' +
        '<p class="upd-how faint small">Opens in Chrome. When it finishes, tap the downloaded file → Install. Your data stays.</p>' +
      "</div>";
    document.body.appendChild(box);
    document.documentElement.classList.add("upd-open");
    document.dispatchEvent(new Event("tmn:upd")); // hal. Tigo 3D: tumitigil habang nag-a-update
    box.querySelector(".upd-dl").addEventListener("click", function () { chrome(); msg("Downloading in Chrome… then open the file to install."); });
  }
  function msg(t) { box.querySelector(".upd-msg").textContent = t || ""; }
  function chrome() { if (NA && NA.openUrl) NA.openUrl(info.url); else location.href = info.url; }

  // Back button: sarado ang ibang bagay, hindi ang update
  if (P.App && P.App.addListener) P.App.addListener("resume", check);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) check(); });
  setInterval(check, 30 * 60 * 1000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", check); else check();
  window.TMN_UPDATE = { check: check, open: function () { return !!box; } };
})();
