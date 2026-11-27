/* TigoMeNote · app-update.js — APK lang (isinisingit ng apk/build-web.py pagkatapos ng app-mode.js)
   Kapag may mas bagong version sa tigomenote.com/app-version.json, HINDI na magagamit ang app hangga't hindi naa-update.
   0.11.57: in-app update (OTA) — "Update now": dina-download ng app mismo ang APK mula sa GitHub Releases (itinutuloy kapag naputol),
   sinusuri ang laki at SHA-256, saka binubuksan ang installer ng Android (native: apk/native/AppUpdater.java, plugin "TmnUpdate").
   Kung kailangan: "Install unknown apps" para sa app na ito (isang beses). Reserba: "Download in Chrome instead".
   Ang lumang Tigo app (app-version.json "tigo".moved = "main"): ida-download ang TigoMeNote (nasa loob na ang Tigo).
   Chine-check: pagbukas, pagbalik sa app (resume) at bawat 30 minuto. Walang internet = hindi hinaharang. */
(function () {
  if (!window.TMN_IN_APP) return;
  var C = window.TMN_CONFIG, APP_ID = window.TMN_APP_ID || "main", NA = window.TMNApps;
  var Cap = window.Capacitor, P = (Cap && Cap.Plugins) || {};
  var URL_V = (C.apps && C.apps.remoteVersion) || "https://tigomenote.com/app-version.json";
  var NAMES = { main: "TigoMeNote", chat: "TigoMeNote Chat", tigo: "Tigo" };
  var U = P.TmnUpdate || null, state = "idle", file = null, waitPerm = false;
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
        '<div class="upd-bar hidden" role="progressbar" aria-label="Download" aria-valuemin="0" aria-valuemax="100"><i></i></div>' +
        '<p class="upd-msg small" aria-live="polite"></p>' +
        '<button type="button" class="btn btn-primary btn-lg upd-go">' + (U && !info.moved ? "⬇ Update now" : "⬇ Download new version") + "</button>" +
        (U && !info.moved ? '<button type="button" class="upd-alt upd-chrome">Download in Chrome instead</button>' :
          '<p class="upd-how faint small">Opens in Chrome. When it finishes, tap the downloaded file → Install. Your data stays.</p>') +
      "</div>";
    document.body.appendChild(box);
    document.documentElement.classList.add("upd-open");
    document.dispatchEvent(new Event("tmn:upd")); // hal. Tigo 3D: tumitigil habang nag-a-update
    if (info.moved) {   // lumang Tigo app → TigoMeNote na
      box.querySelector("#updT").textContent = "Tigo is now inside TigoMeNote";
      box.querySelector(".upd-sub").textContent = "TigoMeNote " + info.version + mb;
      box.querySelector(".upd-txt").textContent = "Install TigoMeNote and open Tigo from the menu. Your Tigo stays the same. You can uninstall this app after.";
    }
    box.querySelector(".upd-go").addEventListener("click", function () { if (waitPerm) { U.openInstallSettings(); return; } if (U && !info.moved) inApp(); else { chrome(); msg("Downloading in Chrome… then open the file to install."); } });
    var alt = box.querySelector(".upd-chrome"); if (alt) alt.addEventListener("click", function () { chrome(); msg("Downloading in Chrome… then open the file to install."); });
  }
  function msg(t) { box.querySelector(".upd-msg").textContent = t || ""; }
  function chrome() { if (NA && NA.openUrl) NA.openUrl(info.url); else location.href = info.url; }
  function bar(pct) {
    var b = box.querySelector(".upd-bar"); b.classList.toggle("hidden", pct == null);
    if (pct != null) { b.querySelector("i").style.width = Math.max(2, Math.min(100, pct)) + "%"; b.setAttribute("aria-valuenow", String(Math.round(pct))); }
  }
  function btn(text, disabled) { var g = box.querySelector(".upd-go"); g.textContent = text; g.disabled = !!disabled; }

  // ---------- in-app: download → suriin → install ----------
  var listening = false;
  async function inApp() {
    if (state === "downloading") return;
    if (state === "ready" && file) return install();
    state = "downloading"; btn("Downloading…", true); bar(0); msg("Starting download…");
    if (!listening && U.addListener) {
      listening = true;
      U.addListener("progress", function (p) {
        if (state !== "downloading" || !p) return;
        var t = p.total || info.size || 0, pct = t ? (p.done / t) * 100 : 0;
        bar(pct); msg(t ? (p.done / 1048576).toFixed(1) + " / " + (t / 1048576).toFixed(1) + " MB" : (p.done / 1048576).toFixed(1) + " MB");
      });
    }
    try {
      var r = await U.download({ name: APP_ID + "-" + info.version, url: info.github || info.url, url2: info.url, sha256: info.sha256 || "", size: info.size || 0 });
      file = r.path; state = "ready"; bar(100);
      install();
    } catch (e) {
      state = "idle"; bar(null);
      btn("⬇ Try again"); msg((e && e.message ? e.message : "Download failed.") + " Check your internet and try again.");
    }
  }
  async function install() {
    msg("Verified ✓ Opening the installer…"); btn("Install update");
    try {
      var r = await U.install({ path: file });
      if (r && r.needPermission) {
        waitPerm = true;
        msg('One time only: allow "Install unknown apps" for ' + NAMES[APP_ID] + ", then come back here.");
        btn("Open settings");
        return;
      }
      msg("Tap Install on the next screen. Your data stays.");
    } catch (e) { msg((e && e.message) || "Couldn't open the installer."); btn("Install update"); }
  }
  function onResume() {
    if (waitPerm && state === "ready" && box) {
      U.canInstall().then(function (c) {
        if (!c || !c.allowed) return;
        waitPerm = false; install();
      }).catch(function () {});
      return;
    }
    check();
  }

  // Back button: sarado ang ibang bagay, hindi ang update
  if (P.App && P.App.addListener) P.App.addListener("resume", onResume);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) onResume(); });
  setInterval(check, 30 * 60 * 1000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", check); else check();
  window.TMN_UPDATE = { check: check, open: function () { return !!box; } };
})();
