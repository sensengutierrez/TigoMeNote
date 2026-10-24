/* TigoMeNote · safety-watch.js — bantay ng SOS sa bawat page ng app
   - Tuwing 60 s (habang nakikita ang page) + agad kapag may push o bumalik sa app: kinukuha ang active na SOS ng circle mo.
   - SOS ng iba → pulang screen + alarm (components/sos-overlay.js). Kapag "Silence", maliit na bar na lang.
   - Sarili mong SOS → tuloy-tuloy na pagpapadala ng location (bawat ~15 s) habang bukas ang app.
   - Nagpapadala ng event "tmn:safety" {share, alerts} para sa location-share.js at safety page.
   TMN_SAFETY_WATCH.refresh() → kunin agad. */
(function () {
  var N = window.TMN_NATIVE, A = window.TMN_SOS_ALERT;
  var POLL = 60000, SOS_EVERY = 15000;
  var SILENCED = "tmnSosSilenced";
  var timer = null, busy = false, last = { alerts: [], share: false };
  var stopWatch = null, lastSent = 0;

  function silenced() { try { return JSON.parse(sessionStorage.getItem(SILENCED) || "[]"); } catch (e) { return []; } }
  function silence(id) { var s = silenced(); if (s.indexOf(id) < 0) s.push(id); try { sessionStorage.setItem(SILENCED, JSON.stringify(s)); } catch (e) {} }

  async function refresh() {
    if (busy || !window.TMN_TOKEN || !navigator.onLine) return last;
    busy = true;
    try {
      var r = await TMN_API.call("safety", "alerts", {}, { timeout: 15000 });
      last = { alerts: r.alerts || [], share: !!r.share };
      apply(last);
      document.dispatchEvent(new CustomEvent("tmn:safety", { detail: last }));
    } catch (e) { /* subok ulit sa susunod */ }
    busy = false;
    return last;
  }

  function apply(st) {
    var others = st.alerts.filter(function (a) { return !a.mine; });
    var mine = st.alerts.filter(function (a) { return a.mine; })[0] || null;
    var quiet = silenced();
    var loud = others.filter(function (a) { return quiet.indexOf(a.id) < 0; });
    if (loud.length) A.show(loud[0], { silence: function (a) { silence(a.id); apply(last); }, ack: function () { refresh(); } });
    else if (A.current) A.hide();
    A.banner(others.filter(function (a) { return !loud.length || a.id !== loud[0].id; }));
    A.mine(document.body.dataset.page === "safety" ? null : mine);
    // Sariling SOS: ipadala ang location habang bukas ang app
    if (mine && !stopWatch) {
      stopWatch = N.watchLocation(function (c) {
        if (Date.now() - lastSent < SOS_EVERY) return;
        lastSent = Date.now();
        TMN_API.call("safety", "sosUpdate", c).catch(function () {});
      });
    } else if (!mine && stopWatch) { stopWatch(); stopWatch = null; }
  }

  function loop() {
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) refresh(); }, POLL);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  window.addEventListener("online", refresh);
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", function (e) {
      var d = e.data || {};
      if (d.type === "tmn-push" && d.data && /^sos/.test(d.data.type || "")) refresh();
    });
  }
  function start() { if (window.TMN_TOKEN) { refresh(); loop(); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.TMN_SAFETY_WATCH = { refresh: refresh, get state() { return last; } };
})();
