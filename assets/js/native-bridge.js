/* TigoMeNote · native-bridge.js — iisang daan papunta sa features ng phone
   Ngayon (web): browser GPS, Web Audio na alarm, vibrate, web push.
   Sa APK (naka-abang): kapag may window.TMN_APP (ibibigay ng Android app), iyon ang gagamitin:
     TMN_APP.getLocation()            → Promise<{lat,lng,acc}>
     TMN_APP.startBackgroundLocation()/stopBackgroundLocation()
     TMN_APP.alarmStart(title, body)  → malakas na alarm kahit naka-silent
     TMN_APP.alarmStop()
     TMN_APP.pushToken()              → Promise<string>  (FCM token)
     TMN_APP.sendSms(numbers[], text) → SMS kahit walang internet
     TMN_APP.saveFile(path, base64, mime) → Promise<uri>  (path = "TigoMeNote/Location/x.zip", sa Documents ng phone)
   Gamit sa page: TMN_NATIVE.getLocation(), TMN_NATIVE.alarm.start(), TMN_NATIVE.isApp, atbp.
   Ilagay pagkatapos ng config.js. */
(function () {
  var APP = window.TMN_APP || null;

  // ---------- location ----------
  function getLocation(opts) {
    opts = opts || {};
    if (APP && APP.getLocation) return APP.getLocation(opts);
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject(new Error("Location isn't available on this device.")); return; }
      navigator.geolocation.getCurrentPosition(function (p) {
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) });
      }, function (e) {
        reject(new Error(e.code === 1 ? "Location permission is off. Allow it in your browser settings." : "Couldn't get your location. Try again outside or near a window."));
      }, { enableHighAccuracy: opts.high !== false, timeout: opts.timeout || 15000, maximumAge: opts.maxAge == null ? 30000 : opts.maxAge });
    });
  }
  // Tuloy-tuloy na location habang bukas ang app. Ibinabalik ang stop()
  function watchLocation(cb, onErr) {
    if (!navigator.geolocation) return function () {};
    var id = navigator.geolocation.watchPosition(function (p) {
      cb({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) });
    }, function (e) { if (onErr) onErr(e); }, { enableHighAccuracy: true, maximumAge: 20000, timeout: 30000 });
    return function () { navigator.geolocation.clearWatch(id); };
  }
  function permission() {
    if (!navigator.permissions || !navigator.permissions.query) return Promise.resolve("prompt");
    return navigator.permissions.query({ name: "geolocation" }).then(function (r) { return r.state; }, function () { return "prompt"; });
  }

  // ---------- alarm (siren) ----------
  var ctx = null, osc = null, gain = null, lfo = null, vibTimer = null;
  function unlockAudio() { // tawagin sa unang tap para payagan ng browser ang tunog mamaya
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
  var alarm = {
    playing: false,
    start: function (title, body) {
      if (APP && APP.alarmStart) { APP.alarmStart(title || "SOS", body || ""); alarm.playing = true; return true; }
      if (alarm.playing) return true;
      alarm.playing = true;
      if (navigator.vibrate) { navigator.vibrate([600, 300, 600, 300, 600]); vibTimer = setInterval(function () { navigator.vibrate([600, 300, 600, 300, 600]); }, 3000); }
      try {
        unlockAudio();
        osc = ctx.createOscillator(); gain = ctx.createGain(); lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        osc.type = "sawtooth"; osc.frequency.value = 880;
        lfo.type = "triangle"; lfo.frequency.value = 1.6; lfoGain.gain.value = 380; // pataas-pababa na parang siren
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
        gain.gain.value = 0.35; osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); lfo.start();
        return ctx.state === "running"; // false = kailangan munang i-tap ang screen
      } catch (e) { return false; }
    },
    stop: function () {
      if (APP && APP.alarmStop) APP.alarmStop();
      alarm.playing = false;
      clearInterval(vibTimer); if (navigator.vibrate) navigator.vibrate(0);
      try { if (osc) osc.stop(); if (lfo) lfo.stop(); } catch (e) {}
      osc = lfo = gain = null;
    }
  };

  // ---------- SMS (APK lang) ----------
  function canSms() { return !!(APP && APP.sendSms); }
  function sendSms(numbers, text) {
    if (canSms()) return APP.sendSms(numbers, text);
    return Promise.reject(new Error("SMS works in the Android app."));
  }

  // ---------- background location (APK lang) ----------
  var background = {
    supported: !!(APP && APP.startBackgroundLocation),
    start: function () { return APP && APP.startBackgroundLocation ? APP.startBackgroundLocation() : Promise.resolve(false); },
    stop: function () { return APP && APP.stopBackgroundLocation ? APP.stopBackgroundLocation() : Promise.resolve(false); }
  };

  // Bansa (para sa emergency number) — mula sa timezone ng device
  function country() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz === "Asia/Bahrain") return "BH";
      if (tz === "Asia/Manila") return "PH";
    } catch (e) {}
    return "default";
  }
  function emergencyNumber() {
    var E = (window.TMN_CONFIG && TMN_CONFIG.emergency) || { default: "112" };
    return E[country()] || E.default;
  }
  function directionsUrl(lat, lng) {
    return ((window.TMN_CONFIG && TMN_CONFIG.map && TMN_CONFIG.map.directions) || "https://www.google.com/maps/dir/?api=1&destination=") + lat + "," + lng;
  }

  // I-save ang file sa Documents/TigoMeNote ng phone (APK lang)
  function saveFile(path, blob) {
    if (!(APP && APP.saveFile)) return Promise.reject(new Error("Not available."));
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(blob);
    }).then(function (b64) { return APP.saveFile(path, b64, blob.type || "application/octet-stream"); });
  }

  window.TMN_NATIVE = {
    isApp: !!APP,
    getLocation: getLocation, watchLocation: watchLocation, permission: permission,
    alarm: alarm, unlockAudio: unlockAudio,
    canSms: canSms, sendSms: sendSms,
    background: background,
    saveFile: APP && APP.saveFile ? saveFile : null,
    pushToken: function () { return APP && APP.pushToken ? APP.pushToken() : Promise.resolve(null); },
    country: country, emergencyNumber: emergencyNumber, directionsUrl: directionsUrl
  };
})();
