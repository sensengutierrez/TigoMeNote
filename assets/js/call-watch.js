/* TigoMeNote · call-watch.js — bantay ng tawag sa bawat page ng app (📞 Messages)
   - Nakikinig sa sariling "ring" channel (Supabase Realtime; lihim na key galing calls-fast "key") → papasok na tawag kahit ibang page ang bukas.
   - Push na "call" (service worker) at link na ?call=<id> (pinindot ang notification) → ipakita ang papasok na tawag kung nagri-ring pa.
   - TMN_CALL.start(conversationId, video, who) → tumawag o sumali sa group call (chat-view.js). TMN_CALL.current(conversationId) → may tawag ba sa group? Kinukuha lang ang call-view.js, call-rtc.js at call.css kapag kailangan.
   Walang tawag sa APK ng Tigo (laro lang) at kapag naka-logout. */
(function () {
  var C = window.TMN_CONFIG, N = window.TMN_NATIVE || {};
  if (!C || !C.fn || !C.fn.calls) return;
  var V = "?v=" + encodeURIComponent(C.version || "");
  var base = (C.root || "/") + "assets/";
  var loading = null, ringCh = null, key = null;
  var callParam = new URLSearchParams(location.search).get("call");   // basahin agad (bago palitan ng page ang URL)

  function script(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src + V; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function ready() {
    if (window.TMN_CALL_VIEW) return Promise.resolve();
    if (!loading) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = base + "css/call.css" + V; document.head.appendChild(l);
      loading = Promise.all([window.TMN_RT ? null : script(base + "js/realtime.js"), script(base + "js/components/call-effects.js"), script(base + "js/components/call-rtc.js")])
        .then(function () { return script(base + "js/components/call-view.js"); })
        .catch(function (e) { loading = null; throw e; });
    }
    return loading;
  }
  function show(call) { ready().then(function () { TMN_CALL_VIEW.incoming(call); }).catch(function () {}); }
  async function check(id) {
    try {
      var r = await TMN_API.call("calls", "get", { id: id }, { timeout: 12000 });
      if (r.call && r.call.status === "ringing" && !r.call.mine) show(r.call);
      else if (r.call && r.call.status !== "ringing" && r.call.status !== "active" && window.TMN_UI) TMN_UI.toast(r.call.status === "missed" ? "You missed this call." : "The call has ended.");
    } catch (e) {}
  }

  async function listen() {
    if (!window.TMN_TOKEN || ringCh) return;
    try {
      if (!window.TMN_RT) await script(base + "js/realtime.js");
      if (!key) { var r = await TMN_API.call("calls", "key", {}, { timeout: 15000 }); key = r.ring_key; }
      if (ringCh || !key) return;
      ringCh = TMN_RT.join("tmn-ring-" + key, function (ev, d) {
        if (ev === "ring" && d && d.id) show({ id: d.id, video: !!d.video, with: d.from, conversation_id: d.conversation_id, group: !!d.group, title: d.title });
        if ((ev === "cancel" || ev === "taken") && d && window.TMN_CALL_VIEW) TMN_CALL_VIEW.cancel(d.id);
      });
    } catch (e) { setTimeout(listen, 30000); }
  }

  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "tmn-push" && d.data && d.data.type === "call" && d.data.id) check(d.data.id);
  });

  function start() {
    if (!window.TMN_TOKEN || (N.isApp && N.appName === "tigo")) return;
    listen();
    if (callParam) {
      check(callParam);
      var u = new URL(location.href); if (u.searchParams.has("call")) { u.searchParams.delete("call"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.TMN_CALL = {
    current: function (convId) { return TMN_API.call("calls", "current", { conversation_id: convId }, { timeout: 12000 }).then(function (r) { return r.call || null; }).catch(function () { return null; }); },
    start: function (convId, video, who) {
      return ready().then(function () { TMN_CALL_VIEW.outgoing(convId, video, who); })
        .catch(function () { if (window.TMN_UI) TMN_UI.toast("Couldn't start the call. Check your internet."); });
    },
  };
})();
