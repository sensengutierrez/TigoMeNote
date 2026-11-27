/* TigoMeNote · components/call-rtc.js — ang koneksyon ng tawag (WebRTC): mic/camera, offer/answer/ICE sa lihim na Realtime channel
   var rtc = TMN_CALL_RTC.create({ signal, ice, video, caller, onState(s), onRemote(stream), onLocal(stream), onPeer(info) })
     rtc.start()  → Promise (humihingi ng mic/camera)      rtc.mute(on) · rtc.camera(on) → Promise · rtc.flip() → Promise · rtc.close()
   onState: "media" → "connecting" → "connected" ⇄ "reconnecting" → "failed"
   onPeer: { answered: true } (sumagot na ang tinawagan) · { cam: true|false } (naka-on/off ang camera ng kausap) · { end: "hangup"|"declined"|"cancel" } (tinapos ng kausap)
   Paano: ang caller ang gumagawa ng offer kapag narinig ang "hello" ng callee (inuulit ng callee bawat 1.5 s hanggang may offer).
   May video transceiver palagi (kahit voice call) para ma-on ang camera sa gitna ng tawag nang walang bagong offer.
   Kapag "failed" ang ICE: ang caller ang nag-i-ICE restart (hanggang 3 beses). Walang audio/video na dumadaan sa server. */
(function () {
  function create(o) {
    var pc = null, ch = null, local = null, remote = new MediaStream(), camTrack = null, vSender = null, facing = "user", closed = false;
    var pending = [], helloT = null, gotOffer = false, restarts = 0, discT = null, state = "";
    function set(s) { if (s !== state && !closed) { state = s; try { o.onState(s); } catch (e) {} } }
    function send(ev, d) { if (ch) ch.send(ev, d || {}); }

    function peer() {
      pc = new RTCPeerConnection({ iceServers: o.ice || [], bundlePolicy: "max-bundle" });
      pc.onicecandidate = function (e) { if (e.candidate) send("ice", { c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
      // iisang stream ng kausap (audio + video), kahit magkahiwalay dumating ang mga track
      pc.ontrack = function (e) {
        remote.getTracks().forEach(function (t) { if (t.kind === e.track.kind && t !== e.track) remote.removeTrack(t); });
        if (remote.getTracks().indexOf(e.track) < 0) remote.addTrack(e.track);
        try { o.onRemote(remote); } catch (x) {}
      };
      pc.oniceconnectionstatechange = function () {
        var st = pc.iceConnectionState;
        if (st === "connected" || st === "completed") { clearTimeout(discT); restarts = 0; set("connected"); }
        else if (st === "disconnected") { set("reconnecting"); clearTimeout(discT); discT = setTimeout(function () { if (pc && pc.iceConnectionState === "disconnected") restart(); }, 6000); }
        else if (st === "failed") restart();
      };
      // mic
      local.getAudioTracks().forEach(function (t) { pc.addTrack(t, local); });
      // video: palaging may transceiver (sendrecv); walang laman kapag naka-off ang camera
      if (o.caller) {
        var tr = pc.addTransceiver("video", { direction: "sendrecv", streams: [local] });
        vSender = tr.sender;
        if (camTrack) vSender.replaceTrack(camTrack);
      }
    }
    function restart() {
      if (closed || !pc) return;
      set("reconnecting");
      if (!o.caller) return;   // ang caller ang nagsisimula ng restart
      if (restarts >= 3) { set("failed"); return; }
      restarts++;
      try { pc.restartIce && pc.restartIce(); } catch (e) {}
      offer(true);
    }
    async function offer(iceRestart) {
      try {
        var d = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
        await pc.setLocalDescription(d);
        send("offer", { sdp: pc.localDescription.sdp, type: "offer" });
      } catch (e) { console.warn("offer", e); }
    }
    async function flush() { var p = pending; pending = []; for (var i = 0; i < p.length; i++) { try { await pc.addIceCandidate(p[i]); } catch (e) {} } }

    async function onSignal(ev, d) {
      if (closed) return;
      if (ev === "hello" && o.caller) {
        try { o.onPeer({ answered: true }); } catch (e) {}
        // bagong hello: gumawa ng offer (o ulitin ang dati kung wala pang sagot)
        if (pc.signalingState === "stable" && !pc.currentRemoteDescription) offer(false);
        else if (pc.localDescription && pc.signalingState === "have-local-offer") send("offer", { sdp: pc.localDescription.sdp, type: "offer" });
        else if (pc.currentRemoteDescription && d && d.again) offer(true);   // nag-reload ang kausap
        return;
      }
      if (ev === "offer" && !o.caller) {
        gotOffer = true; clearInterval(helloT);
        if (pc.remoteDescription && pc.remoteDescription.sdp === d.sdp) return;   // inulit lang na offer
        await pc.setRemoteDescription({ type: "offer", sdp: d.sdp });
        if (!vSender) {   // callee: hanapin ang video transceiver galing sa offer at gawing sendrecv
          var tv = pc.getTransceivers().filter(function (t) { return t.receiver && t.receiver.track && t.receiver.track.kind === "video"; })[0];
          if (tv) { tv.direction = "sendrecv"; vSender = tv.sender; if (camTrack) await vSender.replaceTrack(camTrack); }
        }
        await flush();
        var a = await pc.createAnswer(); await pc.setLocalDescription(a);
        send("answer", { sdp: pc.localDescription.sdp, type: "answer" });
        send("cam", { on: !!camTrack });
        return;
      }
      if (ev === "answer" && o.caller) {
        if (pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription({ type: "answer", sdp: d.sdp }); await flush();
        send("cam", { on: !!camTrack });
        return;
      }
      if (ev === "ice" && d && d.c) {
        if (pc.remoteDescription && pc.remoteDescription.type) { try { await pc.addIceCandidate(d.c); } catch (e) {} } else pending.push(d.c);
        return;
      }
      if (ev === "cam") { try { o.onPeer({ cam: !!(d && d.on) }); } catch (e) {} return; }
      if (ev === "end") { try { o.onPeer({ end: (d && d.why) || "hangup" }); } catch (e) {} }
    }

    async function camOn() {
      var s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 24, max: 30 } } });
      var t = s.getVideoTracks()[0];
      if (camTrack) { camTrack.stop(); local.removeTrack(camTrack); }
      camTrack = t; local.addTrack(t);
      if (vSender) await vSender.replaceTrack(t);
      try { o.onLocal(local); } catch (e) {}
      send("cam", { on: true });
    }
    function camOff() {
      if (camTrack) { camTrack.stop(); local.removeTrack(camTrack); camTrack = null; }
      if (vSender) vSender.replaceTrack(null);
      try { o.onLocal(local); } catch (e) {}
      send("cam", { on: false });
    }

    return {
      start: async function () {
        set("media");
        local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        if (o.video) { try { await camOn(); } catch (e) { /* walang camera: tuloy bilang voice */ } }
        try { o.onLocal(local); } catch (e) {}
        if (closed) { local.getTracks().forEach(function (t) { t.stop(); }); return; }
        peer();
        set("connecting");
        ch = TMN_RT.join("tmn-call-" + o.signal, function (ev, d) { onSignal(ev, d).catch(function (e) { console.warn("signal", ev, e); }); });
        if (!o.caller) {
          var n = 0;
          send("hello", {});
          helloT = setInterval(function () { if (gotOffer || closed || ++n > 40) { clearInterval(helloT); return; } send("hello", {}); }, 1500);
        }
      },
      mute: function (on) { if (local) local.getAudioTracks().forEach(function (t) { t.enabled = !on; }); },
      camera: function (on) { return on ? camOn() : Promise.resolve(camOff()); },
      flip: function () { facing = facing === "user" ? "environment" : "user"; return camTrack ? camOn() : Promise.resolve(); },
      hasCam: function () { return !!camTrack; },
      facing: function () { return facing; },
      bye: function (why) { send("end", { why: why || "hangup" }); },
      close: function () {
        if (closed) return; closed = true;
        clearInterval(helloT); clearTimeout(discT);
        if (local) local.getTracks().forEach(function (t) { t.stop(); });
        if (pc) { try { pc.close(); } catch (e) {} }
        if (ch) setTimeout(function () { ch.leave(); }, 400);   // para maipadala pa ang huling "end"
      },
    };
  }
  window.TMN_CALL_RTC = { create: create, supported: function () { return !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); } };
})();
