/* TigoMeNote · realtime.js — mabilis na "ping" sa pagitan ng mga device (Supabase Realtime, broadcast lang)
   Walang library: diretsong WebSocket (Phoenix protocol). Walang laman ng message na dumadaan dito;
   "may bago" lang, at ang browser ang kukuha sa server (messages-fast). Ang channel ay lihim na key ng chat.
   var ch = TMN_RT.join(channelKey, function (event, payload) { ... });
   ch.send("typing", { user_id })   ch.leave()
   TMN_RT.connected() → true kapag konektado (kung hindi, mag-poll ang page) */
(function () {
  var C = window.TMN_CONFIG;
  var url = C.supabaseUrl.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(C.publishableKey) + "&vsn=1.0.0";
  var ws = null, ok = false, ref = 0, beat = null, retry = 0, timer = null;
  var chans = {}; // topic → { handlers: [fn], joined }

  function nextRef() { ref += 1; return String(ref); }
  function raw(obj) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; } return false; }
  function joinTopic(topic) {
    raw({ topic: topic, event: "phx_join", ref: nextRef(), payload: { config: { broadcast: { ack: false, self: false }, presence: { key: "" }, private: false } } });
  }
  function connect() {
    if (ws || !("WebSocket" in window)) return;
    try { ws = new WebSocket(url); } catch (e) { ws = null; return schedule(); }
    ws.onopen = function () {
      ok = true; retry = 0;
      Object.keys(chans).forEach(joinTopic);
      clearInterval(beat);
      beat = setInterval(function () { raw({ topic: "phoenix", event: "heartbeat", payload: {}, ref: nextRef() }); }, 25000);
      document.dispatchEvent(new CustomEvent("tmn:rt", { detail: { connected: true } }));
    };
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.event !== "broadcast" || !chans[m.topic] || !m.payload) return;
      chans[m.topic].handlers.forEach(function (fn) { try { fn(m.payload.event, m.payload.payload || {}); } catch (err) {} });
    };
    ws.onclose = function () {
      var was = ok; ok = false; ws = null; clearInterval(beat);
      if (was) document.dispatchEvent(new CustomEvent("tmn:rt", { detail: { connected: false } }));
      if (Object.keys(chans).length) schedule();
    };
    ws.onerror = function () { try { ws.close(); } catch (err) {} };
  }
  function schedule() {
    clearTimeout(timer);
    retry = Math.min(retry + 1, 6);
    timer = setTimeout(connect, 1000 * Math.pow(2, retry)); // 2 s hanggang ~1 min
  }

  function join(key, fn) {
    var topic = "realtime:" + key;
    var c = chans[topic] || (chans[topic] = { handlers: [] });
    c.handlers.push(fn);
    if (ok) joinTopic(topic); else connect();
    return {
      send: function (event, payload) {
        return raw({ topic: topic, event: "broadcast", ref: nextRef(), payload: { type: "broadcast", event: event, payload: payload || {} } });
      },
      leave: function () {
        c.handlers = c.handlers.filter(function (h) { return h !== fn; });
        if (!c.handlers.length) { delete chans[topic]; raw({ topic: topic, event: "phx_leave", payload: {}, ref: nextRef() }); }
      }
    };
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && !ws && Object.keys(chans).length) connect(); });

  window.TMN_RT = { join: join, connected: function () { return ok; } };
})();
