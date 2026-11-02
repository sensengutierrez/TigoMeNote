/* TigoMeNote · app-health.js — para sa beta: ipinapadala sa server (crash-fast) ang errors at bagal ng app, at kung sino ang gumagamit
     • error: JavaScript error / promise na walang catch / server error (500+) ng isang function
     • slow:  tawag sa server na lampas 4 s, o page na lampas 6 s bago bumukas
     • hello: isang beses bawat bukas ng app (naka-sign in lang) → Beta monitor → Testers (ilang araw na ginagamit)
   Tahimik: walang lumalabas sa user. Hanggang 15 bawat page; sabay-sabay ipinapadala bawat 10 s at kapag umalis sa page.
   TMN_HEALTH.recent() → huling mga error (para sa Report a bug) · TMN_HEALTH.device() · TMN_HEALTH.pages()
   Kailangan: config.js, api.js (sinusukat ang TMN_API.call). Admin: app/admin/beta.html */
(function () {
  var C = window.TMN_CONFIG; if (!C || !C.fn || !C.fn.crash) return;
  var APP = window.TMN_APP_ID || "web", MAX = 15, SLOW_API = 4000, SLOW_PAGE = 6000;
  var q = [], sent = 0, seen = {}, recent = [];
  function device() {
    var u = navigator.userAgent || "", a = /Android ([\d.]+)/.exec(u), m = /Android [\d.]+; ([^;)]+?)(?: Build|\))/.exec(u), c = /Chrome\/(\d+)/.exec(u);
    var os = a ? "Android " + a[1] : /iPhone|iPad/.test(u) ? "iOS" : /Windows/.test(u) ? "Windows" : /Mac OS/.test(u) ? "Mac" : "Other";
    return [os, m && m[1] !== "K" ? m[1].trim() : "", c ? "Chrome " + c[1] : /Safari/.test(u) ? "Safari" : "", innerWidth + "×" + innerHeight].filter(Boolean).join(" · ");
  }
  function page() { return location.pathname + location.hash; }
  // huling mga page na binuksan (para sa Report a bug)
  try { var h = JSON.parse(sessionStorage.getItem("tmnPages") || "[]"); h.push(location.pathname.replace(/^.*\/(app|legal)\//, "$1/")); sessionStorage.setItem("tmnPages", JSON.stringify(h.slice(-6))); } catch (e) {}
  function add(kind, msg, detail, ms) {
    msg = String(msg || "").slice(0, 300); if (!msg) return;
    var k = kind + "|" + msg;
    recent.push({ kind: kind, msg: msg, ms: ms, at: new Date().toISOString(), page: page() }); recent = recent.slice(-10);
    if (seen[k] || sent + q.length >= MAX) return; seen[k] = 1;
    q.push({ kind: kind, msg: msg, detail: detail ? String(detail).slice(0, 3000) : null, ms: ms == null ? null : Math.round(ms), page: page() });
  }
  function flush(leaving) {
    if (!q.length || !navigator.onLine) return;
    var items = q.splice(0, 10); sent += items.length;
    var body = JSON.stringify({ action: "log", token: window.TMN_TOKEN || undefined, app: APP, version: C.version, device: device(), items: items });
    try { fetch(C.fn.crash, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: body, keepalive: !!leaving }).catch(function () {}); } catch (e) {}
  }
  setInterval(function () { flush(false); }, 10000);
  addEventListener("pagehide", function () { flush(true); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(true); });

  // JavaScript errors
  var NOISE = /^Script error\.?$|ResizeObserver loop|Non-Error promise rejection|AbortError|The play\(\) request was interrupted|NotAllowedError: play\(\)/i;
  addEventListener("error", function (e) {
    if (!e || !e.message || NOISE.test(e.message)) return;
    add("error", e.message, (e.error && e.error.stack) || (e.filename ? e.filename.replace(/^.*\/assets\//, "assets/") + ":" + e.lineno + ":" + e.colno : ""));
  });
  addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason, m = r && (r.message || String(r));
    if (!m || NOISE.test(m) || (r && r.status && r.status < 500)) return;   // 4xx = sagot ng server (hal. maling password), hindi bug
    add("error", "Unhandled: " + m, r && r.stack);
  });

  // tawag sa server: bagal at 500
  function wrap() {
    var A = window.TMN_API; if (!A || A._health) return; A._health = 1;
    var call = A.call;
    A.call = function (fn, action) {
      var t0 = performance.now(), name = fn + "." + action;
      var p = call.apply(this, arguments);
      if (fn === "crash") return p;
      p.then(function () { var ms = performance.now() - t0; if (ms > SLOW_API) add("slow", "Server " + name, null, ms); },
        function (er) {
          var ms = performance.now() - t0;
          if (er && er.status >= 500) add("error", "Server " + name + " " + er.status + ": " + er.message, null, ms);
          else if (er && er.status === 0 && navigator.onLine && /too long/.test(er.message)) add("slow", "Server " + name + " (timeout)", null, ms);
        });
      return p;
    };
  }
  wrap(); if (!window.TMN_API) document.addEventListener("DOMContentLoaded", wrap);

  // bagal ng pagbukas ng page
  addEventListener("load", function () {
    setTimeout(function () {
      try {
        var n = performance.getEntriesByType("navigation")[0], ms = n ? n.loadEventEnd || n.duration : 0;
        if (ms > SLOW_PAGE) add("slow", "Page load", "dom " + Math.round(n.domContentLoadedEventEnd) + " ms · transfer " + Math.round((n.transferSize || 0) / 1024) + " KB", ms);
      } catch (e) {}
    }, 0);
  });

  // tester: isang beses bawat bukas ng app (bawat session)
  setTimeout(function () {
    try { if (!window.TMN_TOKEN || sessionStorage.getItem("tmnHello")) return; sessionStorage.setItem("tmnHello", "1"); } catch (e) { return; }
    try { fetch(C.fn.crash, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ action: "hello", token: window.TMN_TOKEN, app: APP, version: C.version, device: device() }) }).catch(function () {}); } catch (e) {}
  }, 4000);

  window.TMN_HEALTH = { device: device, recent: function () { return recent.slice(); },
    pages: function () { try { return JSON.parse(sessionStorage.getItem("tmnPages") || "[]"); } catch (e) { return []; } }, add: add };
})();
