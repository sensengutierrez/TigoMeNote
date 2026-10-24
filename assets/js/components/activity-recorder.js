/* TigoMeNote · components/activity-recorder.js — i-record ang nilakbay gamit ang GPS (parang Komoot/Strava)
     TMN_TRACK.open({ onDone(track) })   track = { points: [{lat,lng,ele,t}], dur_s }  (dur_s = oras na hindi naka-pause)
     TMN_TRACK.saved()                    → huling natapos na recording na hindi pa naipo-post (o null)
     TMN_TRACK.clear()                    → burahin ang naka-save na recording (pagkatapos i-post)
   Naka-save sa device habang nagre-record (localStorage) kaya hindi nawawala kahit ma-refresh o mag-close ang page.
   Paalala: sa browser, tumitigil ang GPS kapag naka-lock ang screen, kaya pinapanatiling bukas ang screen (Wake Lock).
   Kailangan: modal.js, route.js, map-view.js */
(function () {
  var KEY = "tmnTrack", MAX_ACC = 40, MIN_MOVE = 4;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function store(s) { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) {} }
  function elapsed(s, now) {
    if (!s || !s.startedAt) return 0;
    var end = s.finishedAt || (s.pausedAt || now || Date.now());
    return Math.max(0, Math.round((end - s.startedAt - (s.pausedMs || 0)) / 1000));
  }
  function saved() { var s = load(); return s && s.finishedAt && s.pts && s.pts.length > 1 ? { points: s.pts, dur_s: elapsed(s) } : null; }

  function open(o) {
    o = o || {};
    var UI = window.TMN_UI, R = window.TMN_ROUTE;
    if (!navigator.geolocation) { UI.toast("GPS isn't available on this device."); return; }
    var s = load();
    if (s && s.finishedAt) s = null; // tapos na ang dati: bagong recording
    var watch = null, lock = null, mv = null, line = null, here = null, tick = null, closed = false, lastFix = null;

    var body = document.createElement("div");
    body.className = "trk";
    body.innerHTML =
      '<div class="trk-map"><p class="faint small trk-map-msg">' + I("map", "ic-sm") + " Loading map…</p></div>" +
      '<div class="trk-stats">' +
        '<div><span class="faint small">Time</span><b class="trk-time" translate="no">0:00</b></div>' +
        '<div><span class="faint small">Distance</span><b class="trk-dist" translate="no">0 m</b></div>' +
        '<div><span class="faint small">Speed</span><b class="trk-speed" translate="no">—</b></div>' +
        '<div><span class="faint small">Elevation</span><b class="trk-elev" translate="no">—</b></div></div>' +
      '<p class="trk-gps small" aria-live="polite"></p>' +
      '<p class="faint small trk-tip">Keep this screen open while recording. Your route is saved on this device as you go.</p>' +
      '<div class="trk-btns"></div>';
    var $ = function (c) { return body.querySelector(c); };

    function paintStats() {
      var pts = (s && s.pts) || [], st = R.stats(pts), sec = elapsed(s);
      $(".trk-time").textContent = R.fmt.clock(sec);
      $(".trk-dist").textContent = R.fmt.dist(st.dist_m);
      $(".trk-speed").textContent = R.fmt.speed(st.dist_m, sec);
      $(".trk-elev").textContent = pts.some(function (p) { return p.ele != null; }) ? R.fmt.elev(st.up_m) : "—";
    }
    function paintBtns() {
      var b = $(".trk-btns");
      if (!s) b.innerHTML = '<button type="button" class="btn btn-primary btn-lg" data-t="start">' + I("play", "ic-sm") + "Start</button>";
      else b.innerHTML =
        (s.pausedAt ? '<button type="button" class="btn btn-primary" data-t="resume">' + I("play", "ic-sm") + "Resume</button>"
          : '<button type="button" class="btn btn-ghost" data-t="pause">' + I("pause", "ic-sm") + "Pause</button>") +
        '<button type="button" class="btn btn-primary" data-t="finish">' + I("check", "ic-sm") + "Finish</button>" +
        '<button type="button" class="btn btn-danger btn-ghost" data-t="discard">' + I("trash", "ic-sm") + "Discard</button>";
    }
    function gps(text, bad) { var g = $(".trk-gps"); g.textContent = text; g.classList.toggle("err", !!bad); }

    function drawMap() {
      if (!mv || !s) return;
      var ll = s.pts.map(function (p) { return [p.lat, p.lng]; });
      if (!line) line = window.L.polyline(ll, { color: "#1d6fe0", weight: 5 }).addTo(mv.map); else line.setLatLngs(ll);
    }
    function onFix(pos) {
      var c = pos.coords; lastFix = { lat: c.latitude, lng: c.longitude, acc: c.accuracy };
      if (mv && window.L) {
        if (!here) here = window.L.circleMarker([c.latitude, c.longitude], { radius: 8, color: "#fff", weight: 3, fillColor: "#1d6fe0", fillOpacity: 1 }).addTo(mv.map);
        else here.setLatLng([c.latitude, c.longitude]);
        if (!s || !s.pts.length) mv.map.setView([c.latitude, c.longitude], 16);
        else mv.map.panTo([c.latitude, c.longitude], { animate: true });
      }
      if (c.accuracy > MAX_ACC) { gps("Weak GPS signal (±" + Math.round(c.accuracy) + " m). Go outside or wait a moment…", true); return; }
      gps("GPS ready · ±" + Math.round(c.accuracy) + " m");
      if (!s || s.pausedAt) return;
      var p = { lat: Math.round(c.latitude * 1e6) / 1e6, lng: Math.round(c.longitude * 1e6) / 1e6, ele: c.altitude == null ? null : Math.round(c.altitude), t: pos.timestamp || Date.now() };
      var last = s.pts[s.pts.length - 1];
      if (last && R.dist(last, p) < Math.max(MIN_MOVE, c.accuracy / 3)) return; // hindi pa gumagalaw
      s.pts.push(p); store(s); drawMap(); paintStats();
    }
    function onErr(e) {
      gps(e.code === 1 ? "Location is blocked. Allow location for this site in your browser settings." : "Looking for GPS…", e.code === 1);
    }
    function startWatch() {
      if (watch !== null) return;
      watch = navigator.geolocation.watchPosition(onFix, onErr, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    }
    async function keepAwake() {
      try { if ("wakeLock" in navigator && !lock && !document.hidden) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", function () { lock = null; }); } } catch (e) {}
    }
    function onVis() { if (!document.hidden && s && !closed) keepAwake(); }
    document.addEventListener("visibilitychange", onVis);

    $(".trk-btns").addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      var now = Date.now(), t = b.dataset.t;
      if (t === "start") { s = { startedAt: now, pausedMs: 0, pausedAt: null, pts: [] }; if (lastFix && lastFix.acc <= MAX_ACC) s.pts.push({ lat: lastFix.lat, lng: lastFix.lng, ele: null, t: now }); store(s); keepAwake(); UI.toast("Recording started"); }
      if (t === "pause") { s.pausedAt = now; store(s); }
      if (t === "resume") { s.pausedMs += now - s.pausedAt; s.pausedAt = null; store(s); keepAwake(); }
      if (t === "finish") {
        if (s.pts.length < 2) { UI.toast("Move a little more first: no route yet."); return; }
        if (s.pausedAt) { s.pausedMs += now - s.pausedAt; s.pausedAt = null; }
        s.finishedAt = now; store(s);
        var track = { points: s.pts, dur_s: elapsed(s) };
        m.close(); if (o.onDone) o.onDone(track); return;
      }
      if (t === "discard") {
        TMN_MODAL.confirm("Discard this recording?", { okText: "Discard", danger: true }).then(function (ok) {
          if (!ok) return;
          store(null); s = null; paintBtns(); paintStats(); if (line) line.setLatLngs([]);
          try { if (lock) lock.release(); } catch (er) {}
        });
        return;
      }
      paintBtns(); paintStats();
    });

    var m = TMN_MODAL.open({
      title: "Record your route", size: "md", cls: "modal-sheet modal-track", body: body, closeOnBackdrop: false,
      onClose: function () {
        closed = true;
        if (watch !== null) navigator.geolocation.clearWatch(watch);
        clearInterval(tick); document.removeEventListener("visibilitychange", onVis);
        try { if (lock) lock.release(); } catch (e) {}
        if (mv) mv.destroy();
        if (s && !s.finishedAt && s.pts.length) UI.toast("Recording saved on this device. Open Record again to continue.", 3500);
      }
    });
    paintBtns(); paintStats(); gps("Looking for GPS…");
    if (s) { keepAwake(); gps("Continuing your recording…"); }
    startWatch();
    tick = setInterval(paintStats, 1000);
    if (window.TMN_MAP) TMN_MAP.create($(".trk-map"), { zoom: 15 }).then(function (x) {
      if (closed) { x.destroy(); return; }
      mv = x; var msg = $(".trk-map-msg"); if (msg) msg.remove();
      drawMap();
      if (s && s.pts.length) mv.map.fitBounds(window.L.latLngBounds(s.pts.map(function (p) { return [p.lat, p.lng]; })), { padding: [30, 30], maxZoom: 16 });
      setTimeout(function () { mv.resize(); }, 250);
    }, function () { var msg = $(".trk-map-msg"); if (msg) msg.textContent = "Map is offline. Recording still works."; });
    return m;
  }

  window.TMN_TRACK = { open: open, saved: saved, clear: function () { store(null); } };
})();
