/* TigoMeNote · components/call-view.js — screen ng tawag (buong screen): 1-on-1 at group call
   TMN_CALL_VIEW.outgoing(conversationId, video, who)   → tumawag / sumali sa group call (who = { display_name, avatar_url, group, title })
   TMN_CALL_VIEW.incoming(call)                          → papasok (ring channel o push) · Accept / Decline
   TMN_CALL_VIEW.cancel(id) · TMN_CALL_VIEW.active()
   Sa tawag: 🎤 Mute · 📷 Camera · ✨ Effects (filter + mukha: bigote, salamin…) · 🖥️ Share screen (computer) · 📸 Screenshot · 🔄 Flip · End
   Server: calls-fast. Koneksyon: call-rtc.js (mesh). Effects: call-effects.js. Tunog: WebAudio (walang file). */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;
  var NO_ANSWER_S = 45, RING_S = 50, GROUP_WAIT_S = 70;
  var cur = null;
  var me = function () { var u = window.TMN_USER || {}; return { id: u.id, name: u.display_name || "@" + (u.username || ""), avatar: u.avatar_url || null }; };

  // ---------- tunog ----------
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
    return '<span class="avatar call-av" style="--size:' + size + 'px">' + (u.avatar_url || u.avatar ? '<img alt="" src="' + esc(u.avatar_url || u.avatar) + '">' : esc(UI.initials(u.display_name || u.name || u.username || "?"))) + "</span>";
  }
  function btn(act, icon, label, cls, emoji) { return '<button type="button" class="call-btn ' + (cls || "") + '" data-call="' + act + '" aria-label="' + label + '" title="' + label + '">' + (emoji ? '<span class="ic call-emo">' + emoji + "</span>" : I(icon)) + "<small>" + label + "</small></button>"; }
  function mount(who, video) {
    var el = document.createElement("div");
    el.className = "call-ov" + (video ? " is-video" : "") + (who.group ? " is-group" : "");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Call with " + (who.title || who.display_name || ""));
    el.innerHTML =
      '<video class="call-self" playsinline autoplay muted aria-hidden="true"></video>' +   // sariling camera, buong screen habang wala pang video ang kausap (parang Messenger)
      '<div class="call-grid" aria-live="polite"></div>' +
      '<button type="button" class="call-min" data-call="min" aria-label="Minimize call" title="Minimize">' + I("minimize") + "</button>" +
      '<div class="call-who">' + avatar(who, 116) + '<h2 translate="no">' + esc(who.title || who.display_name || "@" + (who.username || "")) + '</h2><p class="call-status" aria-live="polite"></p></div>' +
      '<video class="call-local hidden" playsinline autoplay muted></video>' +
      '<div class="call-fx hidden" role="dialog" aria-label="Effects"></div>' +
      '<div class="call-note" aria-live="polite"></div>' +
      '<div class="call-pills" role="group" aria-label="Camera effects"></div>' +
      '<div class="call-bar"></div>';
    document.body.appendChild(el);
    document.body.classList.add("in-call");
    miniDrag(el);
    native("setInCall", true);   // Android app: lalabas bilang maliit na window (PiP) kapag umalis sa app habang may tawag
    return el;
  }
  function status(t) { if (cur) cur.el.querySelector(".call-status").textContent = t; }
  function bar(html) { if (cur) cur.el.querySelector(".call-bar").innerHTML = html; }
  function note(t) {
    if (!cur) return; var n = cur.el.querySelector(".call-note"); n.textContent = t; n.classList.add("on");
    clearTimeout(n._t); n._t = setTimeout(function () { n.classList.remove("on"); }, 3000);
  }
  // mga button sa ibaba (parang Messenger): 📷 · 🎤 · 📸 · 🔄 · (🖥️ sa computer) · ☎ End — lumalabas na rin habang nagri-ring
  function liveBar() {
    var c = cur, r = c.rtc, on = r && r.hasCam(), sh = r && r.sharing(), fx = r && r.fx();
    bar(btn("cam", on ? "video" : "videoOff", on ? "Camera off" : "Camera on", on ? "on" : "") +
      btn("mic", c.muted ? "micOff" : "mic", c.muted ? "Unmute" : "Mute", c.muted ? "off" : "") +
      btn("shot", "camera", "Screenshot") +
      (on && !sh ? btn("flip", "camSwitch", "Flip") : "") +
      (r && r.canShare() && !/Android|iPhone|iPad/i.test(navigator.userAgent) ? btn("share", "monitor", sh ? "Stop share" : "Share", sh ? "sel" : "") : "") +
      btn("end", "callEnd", c.mode === "out" && !c.group ? "Cancel" : "End", "end"));
    // mabilis na effects sa ibabaw ng mga button (kapag naka-on ang camera)
    var pills = c.el.querySelector(".call-pills");
    pills.innerHTML = on && fx && !sh ? [["touch", "✨", "Touch up", fx.touch()], ["blur", "🌫️", "Blur", fx.back() === "blur"], ["fx", "😎", "Effects", c.sheet === "fx"], ["bg", "🖼️", "Background", c.sheet === "bg" || (fx.back() !== "none" && fx.back() !== "blur")]]
      .map(function (x) { return '<button type="button" class="call-pill' + (x[3] ? " on" : "") + '" data-call="' + x[0] + '" aria-pressed="' + !!x[3] + '"><span aria-hidden="true">' + x[1] + "</span>" + x[2] + "</button>"; }).join("") : "";
    selfFull();
  }
  // sariling camera sa buong screen hanggang may video ang kausap (o kapag naka-minimize ang kausap)
  function selfFull() {
    var c = cur; if (!c) return;
    var lv = c.el.querySelector(".call-local"), sv = c.el.querySelector(".call-self");
    var peerVid = c.el.querySelector(".call-tile.has-video"), mine = lv.srcObject && !lv.classList.contains("hidden");
    var on = !!(mine && !peerVid && (!c.group || !c.rtc || !c.rtc.peers().length));
    c.el.classList.toggle("self-full", on);
    if (on) { if (sv.srcObject !== lv.srcObject) sv.srcObject = lv.srcObject; sv.classList.toggle("mirror", lv.classList.contains("mirror")); }
    else if (sv.srcObject) sv.srcObject = null;
  }
  function mmss(s) { return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"); }
  function guard(e) { if (cur && cur.mode !== "done") { e.preventDefault(); e.returnValue = ""; } }

  // ---------- mga kausap (grid) ----------
  function paintPeers(list) {
    var c = cur; if (!c) return;
    var g = c.el.querySelector(".call-grid");
    var keep = {};
    list.forEach(function (p) {
      keep[p.sid] = 1;
      var t = g.querySelector('[data-sid="' + p.sid + '"]');
      if (!t) {
        t = document.createElement("div"); t.className = "call-tile"; t.dataset.sid = p.sid;
        t.innerHTML = '<video playsinline autoplay muted></video><audio autoplay></audio><div class="call-tile-av"></div><span class="call-tile-name" translate="no"></span>';
        g.appendChild(t);
      }
      var v = t.querySelector("video"), a = t.querySelector("audio");
      if (v.srcObject !== p.stream) v.srcObject = p.stream;
      if (a.srcObject !== p.stream) { a.srcObject = p.stream; var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); }
      var hasV = p.cam && p.stream.getVideoTracks().length > 0;
      t.classList.toggle("has-video", hasV); t.classList.toggle("is-screen", !!p.screen); t.classList.toggle("weak", p.state !== "connected");
      t.querySelector(".call-tile-av").innerHTML = avatar({ name: p.name, avatar: p.avatar }, list.length > 2 ? 72 : 104);
      t.querySelector(".call-tile-name").textContent = (p.name || "") + (p.screen ? " · sharing screen" : "") + (p.state === "reconnecting" ? " · reconnecting…" : "");
    });
    [].slice.call(g.children).forEach(function (t) { if (!keep[t.dataset.sid]) t.remove(); });
    g.dataset.n = String(list.length);
    c.el.classList.toggle("has-peers", list.length > 0);
    c.el.classList.toggle("peer-cam", list.length === 1 && list[0].cam);
    selfFull();
    if (list.length && c.mode === "out") { stopTone(); clearTimeout(c.noAns); status("Connecting…"); }
    if (c.group && c.mode === "live") status(list.length ? list.length + 1 + " in call · " + (c.startAt ? mmss((Date.now() - c.startAt) / 1000) : "") : "Waiting for others…");
    // group: lahat ay umalis → tapos na rin ako (pagkalipas ng ilang segundo)
    if (c.group && c.hadPeers && !list.length) { clearTimeout(c.aloneT); c.aloneT = setTimeout(function () { if (cur === c && !c.rtc.peers().length) finish("Everyone left"); }, 20000); }
    if (list.length) { c.hadPeers = true; clearTimeout(c.aloneT); }
  }

  // ---------- 😎 Effects / 🖼️ Background: sheet sa ibaba na may bilog na pagpipilian (parang Messenger) ----------
  function sheet(kind) {
    var c = cur, box = c.el.querySelector(".call-fx"), fx = c.rtc && c.rtc.fx();
    if (!fx) { UI.toast("Effects aren't available here."); return; }
    c.sheet = c.sheet === kind ? null : kind;
    box.classList.toggle("hidden", !c.sheet); liveBar();
    if (!c.sheet) return;
    var circ = function (attr, id, on, inner, name) { return '<button type="button" class="call-circ' + (on ? " on" : "") + '" ' + attr + '="' + id + '" aria-pressed="' + on + '" title="' + name + '"><span class="call-circ-i">' + inner + "</span><small>" + name + "</small></button>"; };
    if (kind === "fx") {
      box.innerHTML = '<span class="call-grab" aria-hidden="true"></span><div class="call-fx-row">' +
        TMN_CALL_FX.MASKS.map(function (m) { return circ("data-fx-mask", m.id, fx.mask() === m.id, '<b class="call-emo2">' + m.icon + "</b>", m.name); }).join("") + "</div>" +
        '<div class="call-fx-row">' + TMN_CALL_FX.FILTERS.map(function (f) { return circ("data-fx-filter", f.id, fx.filter() === f.id, '<i class="call-sw" style="filter:' + f.css + '"></i>', f.name); }).join("") + "</div>";
    } else {
      box.innerHTML = '<span class="call-grab" aria-hidden="true"></span><div class="call-fx-row">' + TMN_CALL_FX.BACKS.map(function (b) {
        var inner = b.id === "none" || b.id === "blur" ? '<b class="call-emo2">' + b.icon + "</b>" : '<canvas width="64" height="64" data-bgprev="' + b.id + '"></canvas>';
        return circ("data-fx-back", b.id, fx.back() === b.id, inner, b.name);
      }).join("") + "</div>";
      box.querySelectorAll("[data-bgprev]").forEach(function (cv) { TMN_CALL_FX._back(cv.getContext("2d"), cv.dataset.bgprev, 64, 64); });
    }
    box.style.bottom = (c.el.querySelector(".call-bar").offsetHeight + c.el.querySelector(".call-pills").offsetHeight + 8) + "px";   // nasa ibabaw ng mga pill para makalipat agad
  }
  // ---------- ↙ minimize: maliit na window sa loob ng app; sa Android app, Picture-in-Picture kapag lumabas ----------
  function setMini(on) {
    var c = cur; if (!c) return;
    c.el.classList.toggle("mini", on); document.body.classList.toggle("in-call", !on);
    c.el.setAttribute("aria-modal", on ? "false" : "true");
    if (on) { c.sheet = null; c.el.querySelector(".call-fx").classList.add("hidden"); if (!c.miniPos) c.miniPos = { r: 12, b: 96 }; c.el.style.right = c.miniPos.r + "px"; c.el.style.bottom = c.miniPos.b + "px"; }
    else { c.el.style.right = c.el.style.bottom = ""; }
  }
  function miniDrag(el) {
    var d = null;
    el.addEventListener("pointerdown", function (e) { if (!cur || !el.classList.contains("mini")) return; d = { x: e.clientX, y: e.clientY, r: cur.miniPos.r, b: cur.miniPos.b, moved: false }; el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", function (e) {
      if (!d) return; var dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
      cur.miniPos = { r: Math.max(6, Math.min(innerWidth - el.offsetWidth - 6, d.r - dx)), b: Math.max(6, Math.min(innerHeight - el.offsetHeight - 6, d.b - dy)) };
      el.style.right = cur.miniPos.r + "px"; el.style.bottom = cur.miniPos.b + "px";
    });
    el.addEventListener("pointerup", function () { if (d && !d.moved && cur && el.classList.contains("mini")) setMini(false); d = null; });
  }
  function native(fn, arg) { try { var N = window.TMNNative; if (N && N[fn]) N[fn](arg); } catch (e) {} }

  // ---------- 📸 screenshot (larawan ng screen ng tawag) ----------
  function cover(cx, v, x, y, w, h, fit, mirror) {
    var vw = v.videoWidth, vh = v.videoHeight; if (!vw || !vh) return;
    var s = fit === "contain" ? Math.min(w / vw, h / vh) : Math.max(w / vw, h / vh), dw = vw * s, dh = vh * s;
    cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip();
    if (mirror) { cx.translate(x + w, y); cx.scale(-1, 1); cx.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh); }
    else cx.drawImage(v, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    cx.restore();
  }
  async function screenshot() {
    var c = cur, el = c.el, r0 = el.getBoundingClientRect(), k = Math.min(2, window.devicePixelRatio || 1);
    var cv = document.createElement("canvas"); cv.width = Math.round(r0.width * k); cv.height = Math.round(r0.height * k);
    var cx = cv.getContext("2d"); cx.scale(k, k);
    var bg = cx.createLinearGradient(0, 0, 0, r0.height); bg.addColorStop(0, "#2b2a3c"); bg.addColorStop(1, "#0e0e14"); cx.fillStyle = bg; cx.fillRect(0, 0, r0.width, r0.height);
    el.querySelectorAll(".call-tile").forEach(function (t) {
      var r = t.getBoundingClientRect(), x = r.left - r0.left, y = r.top - r0.top, v = t.querySelector("video");
      if (t.classList.contains("has-video")) cover(cx, v, x, y, r.width, r.height, t.classList.contains("is-screen") ? "contain" : "cover", false);
      else {
        cx.fillStyle = "rgba(255,255,255,.12)"; cx.beginPath(); cx.arc(x + r.width / 2, y + r.height / 2 - 10, 42, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = "#fff"; cx.font = "700 30px system-ui, sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
        cx.fillText(UI.initials(t.querySelector(".call-tile-name").textContent || "?"), x + r.width / 2, y + r.height / 2 - 10);
      }
      cx.fillStyle = "#fff"; cx.font = "600 14px system-ui, sans-serif"; cx.textAlign = "left"; cx.textBaseline = "alphabetic";
      cx.fillText(t.querySelector(".call-tile-name").textContent, x + 12, y + r.height - 12);
    });
    var lv = el.querySelector(".call-local");
    if (!lv.classList.contains("hidden")) { var lr = lv.getBoundingClientRect(); cover(cx, lv, lr.left - r0.left, lr.top - r0.top, lr.width, lr.height, "cover", lv.classList.contains("mirror")); }
    cx.fillStyle = "rgba(255,255,255,.75)"; cx.font = "600 12px system-ui, sans-serif"; cx.textAlign = "right";
    cx.fillText("TigoMeNote · " + new Date().toLocaleString(), r0.width - 12, 20);
    el.classList.add("flash"); setTimeout(function () { el.classList.remove("flash"); }, 350);
    beep([1200], 0.08, 0.08);
    var blob = await new Promise(function (ok) { cv.toBlob(ok, "image/jpeg", 0.92); });
    if (!blob) { UI.toast("Couldn't take a screenshot."); return; }
    var name = "TigoMeNote_call_" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + ".jpg";
    var file = new File([blob], name, { type: "image/jpeg" });
    try {
      if (window.TMN_PHONE && TMN_PHONE.ok && TMN_PHONE.ok()) { await TMN_PHONE.save(file); note("Screenshot saved to your gallery 📸"); }
      else { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); note("Screenshot saved 📸"); }
    } catch (e) { UI.toast("Couldn't save the screenshot."); }
    if (c.rtc) c.rtc.shot(me().name);
  }

  // ---------- pagtatapos ----------
  function finish(text, why) {
    var c = cur; if (!c || c.mode === "done") return;
    var wasLive = !!c.startAt;
    c.mode = "done"; stopTone();
    clearInterval(c.clock); clearTimeout(c.noAns); clearTimeout(c.ringT); clearTimeout(c.aloneT); clearTimeout(c.waitT);
    if (c.rtc) { if (why !== "peer") c.rtc.bye(); c.rtc.close(); }
    if (c.id && why !== "peer" && why !== "declined-here") TMN_API.call("calls", "end", { id: c.id }).catch(function () {});
    var secs = c.startAt ? (Date.now() - c.startAt) / 1000 : 0;
    status(text || (wasLive ? "Call ended · " + mmss(secs) : "Call ended"));
    bar(""); c.el.querySelector(".call-fx").classList.add("hidden");
    c.el.classList.add("ending"); c.el.classList.remove("has-peers", "peer-cam");
    window.removeEventListener("beforeunload", guard);
    native("setInCall", false);
    c.sheet = null; c.el.querySelector(".call-pills").innerHTML = ""; c.el.classList.remove("self-full");
    setTimeout(function () { c.el.remove(); if (cur === c) cur = null; if (!cur) document.body.classList.remove("in-call"); }, 1500);
  }

  // ---------- koneksyon ----------
  async function connect(call, ice) {
    var c = cur;
    c.rtc = TMN_CALL_RTC.create({
      signal: call.signal, ice: ice, video: call.video, me: me(),
      onState: function (s) {
        if (!cur || cur !== c || c.mode === "done") return;
        if (s === "connected") {
          stopTone(); clearTimeout(c.noAns); clearTimeout(c.waitT);
          if (!c.startAt) { c.startAt = Date.now(); c.clock = setInterval(function () { if (c.mode !== "live") return; if (c.group) paintPeers(c.rtc.peers()); else if (c.state === "connected") status(mmss((Date.now() - c.startAt) / 1000)); }, 1000); }
          if (c.mode !== "live") { c.mode = "live"; liveBar(); }
          if (!c.group) status(mmss((Date.now() - c.startAt) / 1000));
        }
        if (s === "reconnecting") status("Reconnecting…");
        if (s === "waiting" && c.group && c.mode !== "live") { c.mode = "live"; liveBar(); status("Waiting for others…"); }
        c.state = s;
      },
      onPeers: paintPeers,
      onLocal: function (st, info) {
        var v = c.el.querySelector(".call-local");
        v.classList.toggle("hidden", !info.preview); v.classList.toggle("mirror", !info.screen && c.rtc && c.rtc.facing() === "user");
        v.classList.toggle("is-screen", !!info.screen);
        if (info.preview) { if (!v.srcObject || v.srcObject.getVideoTracks()[0] !== info.preview) v.srcObject = new MediaStream([info.preview]); }
        else v.srcObject = null;
        if (c.mode === "live" || c.mode === "out" || c.mode === "answering") liveBar(); else selfFull();
      },
      onEnd: function (why) { if (!c.group || why === "ended") finish(why === "declined" ? "Declined" : why === "cancel" ? "Missed call" : null, "peer"); },
      onNote: note,
    });
    try { await c.rtc.start(); if (c.mode === "out" || c.mode === "answering") liveBar(); }
    catch (e) {
      var denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      finish(denied ? "Allow the microphone to call" : "No microphone found", "media");
      UI.toast(denied ? "Please allow the microphone" + (call.video ? " and camera" : "") + " for TigoMeNote, then try again." : "Couldn't use your microphone.", 5000);
    }
  }

  // ---------- tumawag / sumali ----------
  async function outgoing(convId, video, who) {
    if (cur) { UI.toast("You're already on a call."); return; }
    if (!window.TMN_CALL_RTC || !TMN_CALL_RTC.supported()) { UI.toast("Calls don't work in this browser. Try Chrome, Edge or Safari.", 4500); return; }
    who = who || {};
    cur = { mode: "out", video: !!video, muted: false, group: !!who.group };
    cur.el = mount(who, video);
    var c = cur;
    status(who.group ? "Starting group call…" : video ? "Starting video call…" : "Calling…");
    bar(btn("end", "callEnd", "Cancel", "end"));
    window.addEventListener("beforeunload", guard);
    try {
      var r = await TMN_API.call("calls", "ring", { conversation_id: convId, video: !!video });
      if (c.mode === "done") { TMN_API.call("calls", "end", { id: r.call.id }).catch(function () {}); return; }
      c.id = r.call.id; c.call = r.call; c.group = !!r.call.group;
      c.el.classList.toggle("is-group", c.group);
      if (r.call.title || (r.call.with && !c.group)) c.el.querySelector(".call-who h2").textContent = c.group ? r.call.title : (r.call.with.display_name || "@" + r.call.with.username);
      if (c.group) {
        status(r.call.joined ? "Joining…" : "Ringing everyone…");
        if (!r.call.joined) tone("ringback");
        c.waitT = setTimeout(function () { if (cur === c && !c.rtc.peers().length) finish("No one joined", "noanswer"); }, GROUP_WAIT_S * 1000);
      } else {
        status("Ringing…"); tone("ringback");
        c.noAns = setTimeout(function () { if (c.mode === "out") finish("No answer", "noanswer"); }, NO_ANSWER_S * 1000);
      }
      connect(r.call, r.ice);
    } catch (e) {
      stopTone(); status(e.message || "Couldn't call."); bar(btn("close", "x", "Close", ""));
      c.id = null; c.mode = "error";
      setTimeout(function () { if (cur === c) { c.el.remove(); cur = null; document.body.classList.remove("in-call"); window.removeEventListener("beforeunload", guard); } }, 4000);
    }
  }

  // ---------- may tumatawag ----------
  function incoming(call) {
    if (!call || !call.id || cur) return;   // may kausap ka na: hindi na mag-ri-ring dito
    var who = call.group ? { display_name: call.title || "Group call", avatar_url: call.with && call.with.avatar_url, group: true, title: call.title } : (call.with || call.from || {});
    cur = { id: call.id, mode: "in", video: !!call.video, muted: false, group: !!call.group };
    cur.el = mount(who, call.video);
    var c = cur;
    c.el.classList.add("is-incoming");
    status(call.group ? (((call.with && (call.with.display_name || call.with.username)) || "Someone") + " started a " + (call.video ? "video" : "voice") + " call") : call.video ? "Incoming video call" : "Incoming voice call");
    bar(btn("decline", "callEnd", "Decline", "end") + btn("accept", call.video ? "video" : "call", call.group ? "Join" : "Accept", "accept"));
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
      c.call = r.call; c.group = !!r.call.group;
      connect(r.call, r.ice);
    } catch (e) { c.mode = "in"; finish(e.message || "The call has ended.", "peer"); }
  }
  function decline() {
    var c = cur; if (!c || c.mode !== "in") return;
    TMN_API.call("calls", "decline", { id: c.id }).catch(function () {});
    finish(c.group ? "Not joined" : "Declined", "declined-here");
  }

  document.addEventListener("click", function (e) {
    if (!cur) return;
    var c = cur, cl = function (q) { return e.target.closest && e.target.closest(q); };
    var f1 = cl("[data-fx-filter]"), f2 = cl("[data-fx-mask]"), f3 = cl("[data-fx-back]");
    if ((f1 || f2 || f3) && c.el.contains(e.target) && c.rtc) {
      var redraw = function () { var k = c.sheet; c.sheet = null; if (k) sheet(k); };
      if (f1) { c.rtc.setFilter(f1.dataset.fxFilter); redraw(); return; }
      var t = f2 || f3; t.classList.add("loading");
      (f2 ? c.rtc.setMask(f2.dataset.fxMask) : c.rtc.setBack(f3.dataset.fxBack)).then(redraw)
        .catch(function () { t.classList.remove("loading"); UI.toast("Effects need a good internet connection the first time. Try again in a bit.", 4000); });
      return;
    }
    // naka-minimize: pindot sa maliit na window = palakihin (hawak ng miniDrag); huwag pansinin ang ibang button
    if (c.el.classList.contains("mini")) return;
    var b = e.target.closest && e.target.closest("[data-call]"); if (!b || !c.el.contains(b)) return;
    var a = b.dataset.call;
    if (a === "accept") accept();
    else if (a === "decline") decline();
    else if (a === "end") finish(null, c.mode === "out" && !c.group ? "cancel" : "hangup");
    else if (a === "close") { c.el.remove(); cur = null; document.body.classList.remove("in-call"); window.removeEventListener("beforeunload", guard); }
    else if (a === "mic" && c.rtc) { c.muted = !c.muted; c.rtc.mute(c.muted); liveBar(); }
    else if (a === "cam" && c.rtc) {
      b.disabled = true;
      c.rtc.camera(!c.rtc.hasCam()).catch(function () { UI.toast("Couldn't turn on the camera. Please allow the camera for TigoMeNote.", 4500); }).then(function () { if (!c.rtc.hasCam()) { c.sheet = null; c.el.querySelector(".call-fx").classList.add("hidden"); } liveBar(); });
    }
    else if (a === "fx" || a === "bg") sheet(a);
    else if (a === "touch" && c.rtc && c.rtc.fx()) { c.rtc.setTouch(!c.rtc.fx().touch()); liveBar(); }
    else if (a === "blur" && c.rtc && c.rtc.fx()) {
      b.classList.add("loading");
      c.rtc.setBack(c.rtc.fx().back() === "blur" ? "none" : "blur").then(liveBar)
        .catch(function () { b.classList.remove("loading"); UI.toast("Blur needs a good internet connection the first time. Try again in a bit.", 4000); });
    }
    else if (a === "min") {
      // sa Android app: Picture-in-Picture (lumulutang sa ibabaw ng ibang apps); sa web: maliit na window sa loob ng page
      var N = window.TMNNative; if (N && N.enterPip) { try { N.enterPip(); return; } catch (er) {} }
      setMini(true);
    }
    else if (a === "share" && c.rtc) {
      c.rtc.share(!c.rtc.sharing()).then(function () { liveBar(); if (c.rtc.sharing()) note("You're sharing your screen. Movies from paid apps may show black to others."); })
        .catch(function (err) { if (!err || err.name !== "NotAllowedError") UI.toast("Couldn't share your screen."); liveBar(); });
    }
    else if (a === "shot") screenshot();
    else if (a === "flip" && c.rtc) c.rtc.flip().catch(function () { UI.toast("Couldn't switch the camera."); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && cur.mode === "in") decline(); });
  // isinara ang page habang may tawag: sabihan ang server (para hindi maiwang "may tawag" ang group)
  window.addEventListener("pagehide", function () {
    var c = cur; if (!c || !c.id || c.mode === "done" || c.mode === "in" || !navigator.sendBeacon) return;
    try { navigator.sendBeacon(TMN_CONFIG.fn.calls, new Blob([JSON.stringify({ action: "end", id: c.id, token: window.TMN_TOKEN })], { type: "text/plain;charset=UTF-8" })); } catch (e) {}
  });

  window.TMN_CALL_VIEW = {
    outgoing: outgoing, incoming: incoming,
    cancel: function (id) { if (cur && cur.id === id && cur.mode === "in") finish("Missed call", "peer"); },
    active: function () { return !!cur && cur.mode !== "done"; },
  };
})();
