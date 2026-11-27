/* TigoMeNote · components/call-view.js — screen ng tawag (buong screen): Calling… / papasok na tawag / habang nag-uusap
   TMN_CALL_VIEW.outgoing(conversationId, video, who)   → tumawag (who = { display_name, avatar_url } para sa agad na itsura)
   TMN_CALL_VIEW.incoming(call)                          → papasok (galing sa ring channel o push) · Accept / Decline
   TMN_CALL_VIEW.cancel(id)                              → tumigil ang pag-ring (binaba ng tumawag / sinagot sa ibang device)
   TMN_CALL_VIEW.active()                                → may bukas na tawag?
   Server: calls-fast (ring, answer, decline, end). Koneksyon: components/call-rtc.js. Tunog: WebAudio (walang file). */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;
  var NO_ANSWER_S = 45, RING_S = 50;
  var cur = null;   // { id, el, rtc, mode: "out"|"in"|"live", ... }

  // ---------- tunog: ringback (tumatawag ka) at ringtone (may tumatawag) ----------
  var ac = null, toneT = null;
  function beep(freqs, dur, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      var t0 = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.03); g.gain.setValueAtTime(vol, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0, t0 + dur);
      freqs.forEach(function (f) { var o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f; o.connect(g); o.start(t0); o.stop(t0 + dur + 0.02); });
    } catch (e) {}
  }
  function tone(kind) {
    stopTone();
    if (kind === "ringback") { var a = function () { beep([440, 480], 1.6, 0.07); }; a(); toneT = setInterval(a, 4000); }
    if (kind === "ring") {
      var b = function () { beep([660, 880], 0.35, 0.16); setTimeout(function () { beep([660, 880], 0.35, 0.16); }, 450); if (navigator.vibrate) navigator.vibrate([400, 200, 400]); };
      b(); toneT = setInterval(b, 2200);
    }
  }
  function stopTone() { clearInterval(toneT); toneT = null; if (navigator.vibrate) navigator.vibrate(0); }

  // ---------- itsura ----------
  function avatar(u, size) {
    u = u || {};
    return '<span class="avatar call-av" style="--size:' + size + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username || "?"))) + "</span>";
  }
  function btn(act, icon, label, cls) { return '<button type="button" class="call-btn ' + (cls || "") + '" data-call="' + act + '" aria-label="' + label + '" title="' + label + '">' + I(icon) + "<small>" + label + "</small></button>"; }
  function mount(who, video) {
    var el = document.createElement("div");
    el.className = "call-ov" + (video ? " is-video" : "");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Call with " + (who.display_name || who.username || ""));
    el.innerHTML =
      '<video class="call-remote" playsinline autoplay muted></video><audio class="call-audio" autoplay></audio>' +
      '<div class="call-who">' + avatar(who, 116) + '<h2 translate="no">' + esc(who.display_name || "@" + (who.username || "")) + '</h2><p class="call-status" aria-live="polite"></p></div>' +
      '<video class="call-local hidden" playsinline autoplay muted></video>' +
      '<div class="call-bar"></div>';
    document.body.appendChild(el);
    document.body.classList.add("in-call");
    return el;
  }
  function status(t) { if (cur) cur.el.querySelector(".call-status").textContent = t; }
  function bar(html) { if (cur) cur.el.querySelector(".call-bar").innerHTML = html; }
  function liveBar() {
    var c = cur;
    bar(btn("mic", c.muted ? "micOff" : "mic", c.muted ? "Unmute" : "Mute", c.muted ? "off" : "") +
      btn("cam", c.camOn ? "video" : "videoOff", c.camOn ? "Camera off" : "Camera on", c.camOn ? "" : "off") +
      (c.camOn ? btn("flip", "camSwitch", "Flip") : "") +
      btn("end", "callEnd", "End", "end"));
  }
  function mmss(s) { return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"); }
  function guard(e) { if (cur && cur.mode !== "done") { e.preventDefault(); e.returnValue = ""; } }

  // ---------- pagtatapos ----------
  function finish(text, why) {
    var c = cur; if (!c || c.mode === "done") return;
    var wasLive = c.mode === "live";
    c.mode = "done"; stopTone();
    clearInterval(c.clock); clearTimeout(c.noAns); clearTimeout(c.ringT);
    if (c.rtc) { if (why !== "peer") c.rtc.bye(why || "hangup"); c.rtc.close(); }
    if (c.id && why !== "peer" && why !== "declined-here") TMN_API.call("calls", "end", { id: c.id }).catch(function () {});
    var secs = c.startAt ? (Date.now() - c.startAt) / 1000 : 0;
    status(text || (wasLive ? "Call ended · " + mmss(secs) : "Call ended"));
    bar("");
    c.el.classList.add("ending");
    window.removeEventListener("beforeunload", guard);
    setTimeout(function () { c.el.remove(); if (cur === c) cur = null; if (!cur) document.body.classList.remove("in-call"); }, 1500);
  }

  // ---------- koneksyon (pareho sa caller at callee) ----------
  async function connect(call, ice, caller) {
    var c = cur;
    c.rtc = TMN_CALL_RTC.create({
      signal: call.signal, ice: ice, video: call.video, caller: caller,
      onState: function (s) {
        if (!cur || cur !== c || c.mode === "done") return;
        if (s === "connected") {
          stopTone(); clearTimeout(c.noAns);
          if (!c.startAt) { c.startAt = Date.now(); c.clock = setInterval(function () { if (c.mode === "live" && c.state === "connected") status(mmss((Date.now() - c.startAt) / 1000)); }, 1000); }
          c.mode = "live"; status(mmss((Date.now() - c.startAt) / 1000)); liveBar();
        }
        if (s === "reconnecting") status("Reconnecting…");
        if (s === "connecting" && !caller) status("Connecting…");
        if (s === "failed") finish("Connection lost", "failed");
        c.state = s;
      },
      onLocal: function (st) {
        var v = c.el.querySelector(".call-local");
        c.camOn = c.rtc ? c.rtc.hasCam() : !!st.getVideoTracks().length;
        v.classList.toggle("hidden", !c.camOn); v.classList.toggle("mirror", !c.rtc || c.rtc.facing() === "user");
        if (v.srcObject !== st) v.srcObject = st;
        if (c.mode === "live") liveBar();
      },
      onRemote: function (st) {
        var au = c.el.querySelector(".call-audio"), v = c.el.querySelector(".call-remote");
        if (au.srcObject !== st) au.srcObject = st;
        if (v.srcObject !== st) v.srcObject = st;
        var p = au.play(); if (p && p.catch) p.catch(function () {});
      },
      onPeer: function (x) {
        if (x.answered && c.mode === "out") { stopTone(); clearTimeout(c.noAns); status("Connecting…"); }
        if (x.cam !== undefined) c.el.classList.toggle("peer-cam", !!x.cam);
        if (x.end) finish(x.end === "declined" ? "Declined" : x.end === "cancel" ? "Missed call" : null, "peer");
      },
    });
    try { await c.rtc.start(); }
    catch (e) {
      var denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      finish(denied ? "Allow the microphone to call" : "No microphone found", "media");
      UI.toast(denied ? "Please allow the microphone" + (call.video ? " and camera" : "") + " for TigoMeNote, then try again." : "Couldn't use your microphone.", 5000);
    }
  }

  // ---------- tumawag ----------
  async function outgoing(convId, video, who) {
    if (cur) { UI.toast("You're already on a call."); return; }
    if (!window.TMN_CALL_RTC || !TMN_CALL_RTC.supported()) { UI.toast("Calls don't work in this browser. Try Chrome, Edge or Safari.", 4500); return; }
    who = who || {};
    cur = { mode: "out", video: !!video, muted: false, camOn: !!video };
    cur.el = mount(who, video);
    var c = cur;
    status(video ? "Starting video call…" : "Calling…");
    bar(btn("end", "callEnd", "Cancel", "end"));
    window.addEventListener("beforeunload", guard);
    try {
      var r = await TMN_API.call("calls", "ring", { conversation_id: convId, video: !!video });
      if (c.mode === "done") { TMN_API.call("calls", "end", { id: r.call.id }).catch(function () {}); return; }
      c.id = r.call.id; c.call = r.call;
      if (r.call.with) { c.el.querySelector(".call-who h2").textContent = r.call.with.display_name || "@" + r.call.with.username; }
      status("Ringing…"); tone("ringback");
      c.noAns = setTimeout(function () { if (c.mode === "out") finish("No answer", "noanswer"); }, NO_ANSWER_S * 1000);
      connect(r.call, r.ice, true);
    } catch (e) {
      stopTone(); status(e.message || "Couldn't call."); bar(btn("close", "x", "Close", ""));
      c.id = null; c.mode = "error";
      setTimeout(function () { if (cur === c) { c.el.remove(); cur = null; document.body.classList.remove("in-call"); window.removeEventListener("beforeunload", guard); } }, 4000);
    }
  }

  // ---------- may tumatawag ----------
  function incoming(call) {
    if (!call || !call.id) return;
    if (cur) {
      if (cur.id === call.id) return;
      // may kausap ka na: hindi na mag-ri-ring dito (busy na sa server ang bago)
      return;
    }
    var who = call.with || call.from || {};
    cur = { id: call.id, mode: "in", video: !!call.video, muted: false, camOn: !!call.video };
    cur.el = mount(who, call.video);
    var c = cur;
    c.el.classList.add("is-incoming");
    status(call.video ? "Incoming video call" : "Incoming voice call");
    bar(btn("decline", "callEnd", "Decline", "end") + btn("accept", call.video ? "video" : "call", "Accept", "accept"));
    tone("ring");
    c.ringT = setTimeout(function () { if (c.mode === "in") finish("Missed call", "peer"); }, RING_S * 1000);
    var a = c.el.querySelector('[data-call="accept"]'); if (a) a.focus();
  }
  async function accept() {
    var c = cur; if (!c || c.mode !== "in") return;
    stopTone(); clearTimeout(c.ringT); c.mode = "answering";
    c.el.classList.remove("is-incoming");
    status("Connecting…"); bar(btn("end", "callEnd", "End", "end"));
    window.addEventListener("beforeunload", guard);
    try {
      var r = await TMN_API.call("calls", "answer", { id: c.id });
      c.call = r.call;
      connect(r.call, r.ice, false);
    } catch (e) { c.mode = "in"; finish(e.message || "The call has ended.", "peer"); }
  }
  function decline() {
    var c = cur; if (!c || c.mode !== "in") return;
    TMN_API.call("calls", "decline", { id: c.id }).catch(function () {});
    finish("Declined", "declined-here");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-call]"); if (!b || !cur || !cur.el.contains(b)) return;
    var a = b.dataset.call, c = cur;
    if (a === "accept") accept();
    else if (a === "decline") decline();
    else if (a === "end") finish(null, c.mode === "out" ? "cancel" : "hangup");
    else if (a === "close") { c.el.remove(); cur = null; document.body.classList.remove("in-call"); window.removeEventListener("beforeunload", guard); }
    else if (a === "mic" && c.rtc) { c.muted = !c.muted; c.rtc.mute(c.muted); liveBar(); }
    else if (a === "cam" && c.rtc) {
      b.disabled = true;
      c.rtc.camera(!c.rtc.hasCam()).catch(function () { UI.toast("Couldn't turn on the camera. Please allow the camera for TigoMeNote.", 4500); }).then(function () { b.disabled = false; liveBar(); });
    }
    else if (a === "flip" && c.rtc) c.rtc.flip().catch(function () { UI.toast("Couldn't switch the camera."); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && cur.mode === "in") decline(); });

  window.TMN_CALL_VIEW = {
    outgoing: outgoing, incoming: incoming,
    cancel: function (id) { if (cur && cur.id === id && cur.mode === "in") finish("Missed call", "peer"); },
    active: function () { return !!cur && cur.mode !== "done"; },
  };
})();
