/* TigoMeNote · components/call-rtc.js — koneksyon ng tawag (WebRTC "mesh": bawat kasali ay may sariling koneksyon sa bawat isa)
   Pareho para sa 1-on-1 at group call (hanggang 8). Lahat ng signal ay sa lihim na Realtime channel na "tmn-call-<signal>".
   var rtc = TMN_CALL_RTC.create({ signal, ice, video, me: { id, name, avatar },
       onState(s), onPeers(list), onLocal(stream), onEnd(why), onNote(text) })
     rtc.start() → Promise (mic/camera)       rtc.mute(on) · rtc.camera(on) · rtc.flip() · rtc.setFilter(id) · rtc.setMask(id)
     rtc.share(on) → Promise (screen share, may tunog kung pinayagan) · rtc.sharing() · rtc.peers() · rtc.shot(name) · rtc.bye() · rtc.close()
   onState: "media" → "waiting" (wala pang kausap) → "connected" ⇄ "reconnecting"
   onPeers: [{ sid, uid, name, avatar, stream, cam, screen, state }]
   Paano kumokonekta: bawat ~3 s may "hello" ang bawat isa. Kapag bagong kasali: ang may mas maliit na sid ang gumagawa ng offer
   (walang banggaan). Kapag naputol ang isang koneksyon (failed), binubura at ginagawa ulit sa susunod na hello.
   Laging may video transceiver para ma-on ang camera, filter o screen share nang walang bagong offer. */
(function () {
  function sidOf() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function create(o) {
    var sid = sidOf(), peers = {}, ch = null, local = null, mic = null, cam = null, screen = null, mixed = null, actx = null, micGain = null;
    var fx = window.TMN_CALL_FX ? TMN_CALL_FX.create() : null, facing = "user", closed = false, helloT = null, state = "", muted = false, everConnected = false;
    function set(s) { if (s !== state && !closed) { state = s; try { o.onState(s); } catch (e) {} } }
    function send(ev, d) { if (ch) ch.send(ev, Object.assign({ from: sid }, d || {})); }
    function list() { return Object.keys(peers).map(function (k) { var p = peers[k]; return { sid: k, uid: p.uid, name: p.name, avatar: p.avatar, stream: p.stream, cam: p.cam, screen: p.screen, state: p.state }; }); }
    function emit() { try { o.onPeers(list()); } catch (e) {} overall(); }
    function overall() {
      var ps = list();
      if (ps.some(function (p) { return p.state === "connected"; })) { everConnected = true; set("connected"); }
      else if (everConnected && ps.length) set("reconnecting");
      else if (!ps.length && state !== "media") set("waiting");
    }
    function videoOut() { return screen || (fx && cam ? fx.current() : cam) || null; }
    function audioOut() { return mixed || mic; }
    function me() { return { uid: o.me.id, name: o.me.name, av: o.me.avatar, cam: !!videoOut(), screen: !!screen }; }

    function peer(k, info) {
      var p = peers[k];
      if (p) { if (info) Object.assign(p, { uid: info.uid, name: info.name, avatar: info.av }); return p; }
      p = peers[k] = { uid: info && info.uid, name: info && info.name, avatar: info && info.av, cam: !!(info && info.cam), screen: !!(info && info.screen), stream: new MediaStream(), pending: [], state: "new", seen: Date.now() };
      var pc = p.pc = new RTCPeerConnection({ iceServers: o.ice || [], bundlePolicy: "max-bundle" });
      pc.onicecandidate = function (e) { if (e.candidate) send("ice", { to: k, c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
      pc.ontrack = function (e) {
        p.stream.getTracks().forEach(function (t) { if (t.kind === e.track.kind && t !== e.track) p.stream.removeTrack(t); });
        if (p.stream.getTracks().indexOf(e.track) < 0) p.stream.addTrack(e.track);
        emit();
      };
      pc.oniceconnectionstatechange = function () {
        var st = pc.iceConnectionState;
        p.state = st === "connected" || st === "completed" ? "connected" : st === "failed" || st === "closed" ? "failed" : st === "disconnected" ? "reconnecting" : "connecting";
        if (p.state === "failed") drop(k);   // gagawin ulit sa susunod na hello
        else emit();
      };
      p.aSender = pc.addTrack(audioOut(), local);
      emit();
      return p;
    }
    function drop(k) { var p = peers[k]; if (!p) return; delete peers[k]; try { p.pc.close(); } catch (e) {} emit(); }
    async function offer(k) {
      var p = peers[k], pc = p.pc;
      if (!p.vSender) { var tr = pc.addTransceiver("video", { direction: "sendrecv", streams: [local] }); p.vSender = tr.sender; await p.vSender.replaceTrack(videoOut()); }
      var d = await pc.createOffer(); await pc.setLocalDescription(d);
      send("offer", { to: k, sdp: pc.localDescription.sdp, info: me() });
    }
    async function flush(p) { var q = p.pending; p.pending = []; for (var i = 0; i < q.length; i++) { try { await p.pc.addIceCandidate(q[i]); } catch (e) {} } }

    async function onSignal(ev, d) {
      if (closed || !d || d.from === sid) return;
      var k = d.from;
      if (d.to && d.to !== sid) return;   // para sa iba
      if (ev === "hello") {
        var p = peers[k];
        // hello na para sa akin = "wala pa akong koneksyon sa iyo" → ang may mas maliit na sid ang gagawa ulit
        if (p && d.to === sid && sid < k) { drop(k); p = null; }
        if (p) { p.seen = Date.now(); if (d.name) { p.name = d.name; p.avatar = d.av; } if (p.cam !== !!d.cam || p.screen !== !!d.screen) { p.cam = !!d.cam; p.screen = !!d.screen; emit(); } return; }
        peer(k, d);
        if (sid < k) await offer(k); else send("hello", Object.assign({ to: k }, me()));   // ang may mas maliit na sid ang nag-o-offer
        return;
      }
      if (ev === "offer") {
        var q = peers[k] || peer(k, d.info);
        if (q.pc.remoteDescription && q.pc.remoteDescription.sdp === d.sdp) return;
        await q.pc.setRemoteDescription({ type: "offer", sdp: d.sdp });
        if (!q.vSender) {
          var tv = q.pc.getTransceivers().filter(function (t) { return t.receiver && t.receiver.track && t.receiver.track.kind === "video"; })[0];
          if (tv) { tv.direction = "sendrecv"; q.vSender = tv.sender; await q.vSender.replaceTrack(videoOut()); }
        }
        await flush(q);
        var a = await q.pc.createAnswer(); await q.pc.setLocalDescription(a);
        send("answer", { to: k, sdp: q.pc.localDescription.sdp });
        return;
      }
      if (ev === "answer") { var r = peers[k]; if (!r || r.pc.signalingState !== "have-local-offer") return; await r.pc.setRemoteDescription({ type: "answer", sdp: d.sdp }); await flush(r); return; }
      if (ev === "ice") { var s = peers[k]; if (!s) return; if (s.pc.remoteDescription && s.pc.remoteDescription.type) { try { await s.pc.addIceCandidate(d.c); } catch (e) {} } else s.pending.push(d.c); return; }
      if (ev === "bye") { drop(k); try { o.onEnd("bye"); } catch (e) {} return; }   // 1-on-1: tapos na; group: umalis lang ang isa
      if (ev === "shot") { try { o.onNote((d.name || "Someone") + " took a screenshot 📸"); } catch (e) {} return; }
      if (ev === "end") { try { o.onEnd(d.why || "hangup"); } catch (e) {} }
    }

    // pinalitan ang video (camera, filter, screen): ipadala sa lahat
    function pushVideo() {
      var t = videoOut();
      Object.keys(peers).forEach(function (k) { if (peers[k].vSender) peers[k].vSender.replaceTrack(t).catch(function () {}); });
      send("hello", me());   // balita: naka-on/off ang camera o screen
      try { o.onLocal(local, { cam: !!cam, screen: !!screen, preview: screen || (fx && cam ? fx.current() : cam) }); } catch (e) {}
    }
    function pushAudio() { var t = audioOut(); Object.keys(peers).forEach(function (k) { if (peers[k].aSender) peers[k].aSender.replaceTrack(t).catch(function () {}); }); }
    async function camOn() {
      var s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 24, max: 30 } } });
      var t = s.getVideoTracks()[0];
      if (cam) { cam.stop(); local.removeTrack(cam); }
      cam = t; local.addTrack(t);
      if (fx) fx.track(t);
      pushVideo();
    }
    function camOff() { if (cam) { cam.stop(); local.removeTrack(cam); cam = null; } if (fx) fx.track(null); pushVideo(); }

    // screen share: video ng screen + (kung pinayagan) tunog ng screen na hinahalo sa mic
    async function shareOn() {
      var s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 } }, audio: true });
      screen = s.getVideoTracks()[0];
      screen.onended = function () { shareOff(); };
      var sa = s.getAudioTracks()[0];
      if (sa) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        var dst = actx.createMediaStreamDestination();
        micGain = actx.createGain(); micGain.gain.value = muted ? 0 : 1;
        actx.createMediaStreamSource(new MediaStream([mic])).connect(micGain).connect(dst);
        actx.createMediaStreamSource(new MediaStream([sa])).connect(dst);
        mixed = dst.stream.getAudioTracks()[0];
        screen._audio = sa;
        pushAudio();
      }
      pushVideo();
    }
    function shareOff() {
      if (!screen) return;
      try { screen.stop(); if (screen._audio) screen._audio.stop(); } catch (e) {}
      screen = null;
      if (mixed) { mixed = null; try { actx.close(); } catch (e) {} actx = null; micGain = null; pushAudio(); }
      pushVideo();
    }

    return {
      start: async function () {
        set("media");
        local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        mic = local.getAudioTracks()[0];
        if (o.video) { try { await camOn(); } catch (e) { /* walang camera: tuloy bilang voice */ } }
        else try { o.onLocal(local, { cam: false, screen: false, preview: null }); } catch (e) {}
        if (closed) { local.getTracks().forEach(function (t) { t.stop(); }); return; }
        set("waiting");
        ch = TMN_RT.join("tmn-call-" + o.signal, function (ev, d) { onSignal(ev, d).catch(function (e) { console.warn("call signal", ev, e); }); });
        send("hello", me());
        helloT = setInterval(function () {
          send("hello", me());
          // nawala nang tahimik (walang bye, hindi konektado): alisin
          Object.keys(peers).forEach(function (k) { var p = peers[k]; if (p.state !== "connected" && Date.now() - p.seen > 15000) drop(k); });
        }, 3000);
      },
      mute: function (on) { muted = !!on; if (mic) mic.enabled = !on; if (micGain) micGain.gain.value = on ? 0 : 1; },
      camera: function (on) { return on ? camOn() : Promise.resolve(camOff()); },
      flip: function () { facing = facing === "user" ? "environment" : "user"; return cam ? camOn() : Promise.resolve(); },
      setFilter: function (id) { if (fx) { fx.setFilter(id); pushVideo(); } },
      setMask: function (id) { return fx ? fx.setMask(id).then(pushVideo) : Promise.reject(new Error("no effects")); },
      fx: function () { return fx; },
      share: function (on) { return on ? shareOn() : Promise.resolve(shareOff()); },
      sharing: function () { return !!screen; },
      canShare: function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia); },
      hasCam: function () { return !!cam; },
      facing: function () { return facing; },
      peers: list,
      shot: function (name) { send("shot", { name: name }); },
      bye: function () { send("bye", {}); },
      close: function () {
        if (closed) return; closed = true;
        clearInterval(helloT);
        if (screen) shareOff();
        if (fx) fx.stop();
        if (local) local.getTracks().forEach(function (t) { t.stop(); });
        Object.keys(peers).forEach(function (k) { try { peers[k].pc.close(); } catch (e) {} });
        if (ch) setTimeout(function () { ch.leave(); }, 400);   // para maipadala pa ang huling "bye"
      },
    };
  }
  window.TMN_CALL_RTC = { create: create, supported: function () { return !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); } };
})();
