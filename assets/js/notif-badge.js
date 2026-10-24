/* TigoMeNote · notif-badge.js — bilang ng bagong notifications sa bawat page (bell sa itaas at sa menu)
   - Kinukuha tuwing 60 s habang nakikita ang page, at agad kapag may dumating na push.
   - Ang notifications page ang nagsasabing "nakita na" (TMN_NOTIF_BADGE.set(0)).
   TMN_NOTIF_BADGE.refresh() · TMN_NOTIF_BADGE.set(n) */
(function () {
  var POLL = 60000, KEY = "tmnNotifCount";
  var busy = false, timer = null;

  function set(n) {
    n = Math.max(0, n | 0);
    if (window.TMN_UI) TMN_UI.setBadge("notifications", n);
    try { sessionStorage.setItem(KEY, String(n)); } catch (e) {}
  }
  async function refresh() {
    if (busy || !window.TMN_TOKEN || !navigator.onLine || document.body.dataset.page === "notifications") return;
    busy = true;
    try { var r = await TMN_API.call("notify", "count", {}, { timeout: 12000 }); set(r.unread || 0); } catch (e) { /* subok ulit */ }
    busy = false;
  }
  function loop() {
    clearTimeout(timer);
    if (document.visibilityState === "visible") refresh();
    timer = setTimeout(loop, POLL);
  }

  // Ipakita agad ang huling bilang (walang kurap habang naglo-load)
  try { var last = +sessionStorage.getItem(KEY); if (last) set(last); } catch (e) {}
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(); });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (e) {
      if (e.data && e.data.type === "tmn-push" && e.data.data && e.data.data.type === "notif") refresh();
    });
  }
  window.TMN_NOTIF_BADGE = { refresh: refresh, set: set };
  loop();
})();
