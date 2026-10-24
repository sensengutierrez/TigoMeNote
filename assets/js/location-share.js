/* TigoMeNote · location-share.js — nagpapadala ng location habang bukas ang app
   Gumagana lang kapag: (1) may pinayagan kang mag-Locate sa iyo (galing sa safety-watch: event "tmn:safety"),
   (2) naka-allow na ang location sa browser (hindi ito nagtatanong; ang Safety page ang nagtatanong),
   (3) hindi naka-Pause. Tuwing 5 minuto habang nakikita ang page. Sa APK: background location.
   TMN_LOCSHARE.now() → ipadala agad (hal. pagkatapos i-on). */
(function () {
  var N = window.TMN_NATIVE;
  var EVERY = 5 * 60 * 1000;
  var LAST_KEY = "tmnLocLast";
  var on = false, timer = null, busy = false;

  function lastSent() { try { return Number(sessionStorage.getItem(LAST_KEY) || 0); } catch (e) { return 0; } }
  async function send(force) {
    if (busy || !on || !navigator.onLine || document.hidden) return;
    if (!force && Date.now() - lastSent() < EVERY - 15000) return;
    if ((await N.permission()) !== "granted") return;
    busy = true;
    try {
      var c = await N.getLocation({ high: true, maxAge: 60000, timeout: 20000 });
      await TMN_API.call("safety", "ping", { lat: c.lat, lng: c.lng, acc: c.acc, source: "app" });
      try { sessionStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {}
    } catch (e) { /* tahimik: susubok ulit mamaya */ }
    busy = false;
  }
  function set(share) {
    if (share === on) return;
    on = share;
    clearInterval(timer); timer = null;
    if (on) { send(false); timer = setInterval(function () { send(false); }, 60000); }
    if (N.background.supported) (on ? N.background.start() : N.background.stop());
  }
  document.addEventListener("tmn:safety", function (e) { set(!!(e.detail && e.detail.share)); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) send(false); });

  window.TMN_LOCSHARE = { now: function () { return send(true); }, set: set, get on() { return on; } };
})();
