/* TigoMeNote · components/weather.js
   Weather card na kusang nakaka-detect ng lokasyon (hal. Bahrain o Pilipinas).
     TMN_WEATHER.mount(element)
   Lokasyon: 1) GPS ng device (kung pinayagan)  2) kung hindi, approximate mula sa IP.
   Data: Open-Meteo (libre, walang API key). Pangalan ng lugar: BigDataCloud reverse geocode.
   Cache: 30 minuto sa browser (localStorage "tmnWeather"). */
(function () {
  var I = function (n, c) { return window.TMN_ICON(n, c); };
  var KEY = "tmnWeather";
  var TTL = 30 * 60 * 1000;
  var API = {
    forecast: "https://api.open-meteo.com/v1/forecast",
    reverse: "https://api.bigdatacloud.net/data/reverse-geocode-client",
    ip1: "https://ipapi.co/json/",
    ip2: "https://get.geojs.io/v1/ip/geo.json"
  };

  // WMO weather codes → [label, icon]
  function describe(code, isDay) {
    if (code === 0) return [isDay ? "Clear sky" : "Clear night", isDay ? "sun" : "moon"];
    if (code === 1) return [isDay ? "Mostly sunny" : "Mostly clear", isDay ? "sun" : "moon"];
    if (code === 2) return ["Partly cloudy", "cloudSun"];
    if (code === 3) return ["Cloudy", "cloud"];
    if (code === 45 || code === 48) return ["Fog", "fog"];
    if (code >= 51 && code <= 57) return ["Drizzle", "rain"];
    if (code >= 61 && code <= 67) return ["Rain", "rain"];
    if (code >= 71 && code <= 77) return ["Snow", "snow"];
    if (code >= 80 && code <= 82) return ["Rain showers", "rain"];
    if (code >= 85 && code <= 86) return ["Snow showers", "snow"];
    if (code >= 95) return ["Thunderstorm", "storm"];
    return ["—", "cloud"];
  }

  function readCache() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function writeCache(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  async function getJSON(url, ms) {
    var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, ms || 9000);
    try {
      var r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  function gps() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error("no geolocation"));
      navigator.geolocation.getCurrentPosition(
        function (p) { resolve({ lat: p.coords.latitude, lon: p.coords.longitude, source: "gps" }); },
        function (e) { reject(e); },
        { enableHighAccuracy: false, timeout: 9000, maximumAge: 30 * 60 * 1000 }
      );
    });
  }

  async function permissionState() {
    try { if (navigator.permissions) return (await navigator.permissions.query({ name: "geolocation" })).state; } catch (e) {}
    return "prompt";
  }

  async function byIp() {
    try {
      var a = await getJSON(API.ip1, 7000);
      if (a && a.latitude != null) return { lat: a.latitude, lon: a.longitude, city: a.city, country: a.country_name, cc: a.country_code, source: "ip" };
    } catch (e) {}
    var b = await getJSON(API.ip2, 7000);
    return { lat: Number(b.latitude), lon: Number(b.longitude), city: b.city, country: b.country, cc: b.country_code, source: "ip" };
  }

  async function placeName(loc) {
    if (loc.city || loc.country) return { city: loc.city || "", country: loc.country || "", cc: loc.cc || "" };
    try {
      var r = await getJSON(API.reverse + "?latitude=" + loc.lat + "&longitude=" + loc.lon + "&localityLanguage=en", 7000);
      return { city: r.city || r.locality || r.principalSubdivision || "", country: r.countryName || "", cc: r.countryCode || "" };
    } catch (e) { return { city: "", country: "", cc: "" }; }
  }

  async function forecast(lat, lon) {
    var q = "?latitude=" + lat.toFixed(4) + "&longitude=" + lon.toFixed(4) +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=5";
    return getJSON(API.forecast + q, 10000);
  }

  function distKm(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function flag(cc) {
    if (!cc || cc.length !== 2) return "";
    return String.fromCodePoint.apply(null, cc.toUpperCase().split("").map(function (c) { return 127397 + c.charCodeAt(0); }));
  }

  function mount(el) {
    el.classList.add("wx");
    var busy = false;

    function skeleton() {
      el.innerHTML = '<div class="wx-head"><span class="skel" style="width:140px;height:16px"></span></div>' +
        '<div class="wx-now"><span class="skel" style="width:120px;height:52px"></span></div>' +
        '<div class="wx-days">' + Array(5).join('<span class="skel" style="height:62px"></span>') + '<span class="skel" style="height:62px"></span></div>';
    }

    function error(msg) {
      el.innerHTML = '<div class="wx-head"><span class="wx-place">' + I("cloud", "ic-sm") + 'Weather</span></div>' +
        '<p class="muted small wx-err">' + msg + '</p>' +
        '<button type="button" class="btn btn-ghost btn-sm wx-retry">' + I("refresh", "ic-sm") + 'Try again</button>';
      el.querySelector(".wx-retry").addEventListener("click", function () { load(true); });
    }

    function render(c) {
      var d = c.data, cur = d.current, day = d.daily;
      var now = describe(cur.weather_code, cur.is_day);
      var place = [c.place.city, c.place.country].filter(Boolean).join(", ") || "Your location";
      var days = day.time.map(function (t, i) {
        var dd = describe(day.weather_code[i], 1);
        var name = i === 0 ? "Today" : new Date(t + "T12:00:00").toLocaleDateString(window.TMN_I18N ? TMN_I18N.locale : undefined, { weekday: "short" });
        return '<div class="wx-day' + (i === 0 ? " today" : "") + '"><span>' + name + "</span>" + I(dd[1]) +
          "<b>" + Math.round(day.temperature_2m_max[i]) + "°</b><small>" + Math.round(day.temperature_2m_min[i]) + "°</small></div>";
      }).join("");
      el.innerHTML =
        '<div class="wx-head">' +
          '<span class="wx-place" title="' + (c.source === "gps" ? "From your device's GPS" : "Approximate, from your internet (IP)") + '">' + I("pin", "ic-sm") +
            '<span class="wx-name">' + window.TMN_UI.esc(place) + "</span> " + flag(c.place.cc) + "</span>" +
          '<button type="button" class="icon-btn wx-refresh" aria-label="Refresh weather">' + I("refresh", "ic-sm") + "</button>" +
        "</div>" +
        '<div class="wx-now">' +
          '<div class="wx-icon">' + I(now[1], "ic-lg") + "</div>" +
          '<div><div class="wx-temp">' + Math.round(cur.temperature_2m) + '<span>°C</span></div>' +
          '<div class="wx-cond">' + now[0] + " · Feels " + Math.round(cur.apparent_temperature) + "°</div></div>" +
        "</div>" +
        '<div class="wx-meta">' +
          "<span>" + I("drop", "ic-sm") + cur.relative_humidity_2m + "% humidity</span>" +
          "<span>" + I("wind", "ic-sm") + Math.round(cur.wind_speed_10m) + " km/h</span>" +
          "<span>" + I("rain", "ic-sm") + (day.precipitation_probability_max[0] != null ? day.precipitation_probability_max[0] : 0) + "% ulan</span>" +
        "</div>" +
        '<div class="wx-days">' + days + "</div>" +
        '<div class="wx-foot faint">' +
          (c.source === "gps" ? "Location: device GPS" : 'Approximate location (internet). <button type="button" class="link-btn wx-precise">Use GPS</button>') +
          ' · Updated ' + new Date(c.at).toLocaleTimeString(window.TMN_I18N ? TMN_I18N.locale : undefined, { hour: "numeric", minute: "2-digit" }) +
        "</div>";
      el.querySelector(".wx-refresh").addEventListener("click", function () { load(true); });
      var p = el.querySelector(".wx-precise");
      if (p) p.addEventListener("click", function () { load(true, true); });
    }

    async function load(force, wantGps) {
      if (busy) return; busy = true;
      var cache = readCache();
      if (cache && !force) render(cache); else skeleton();
      try {
        var loc = null, perm = await permissionState();
        if (wantGps || perm === "granted" || perm === "prompt") { try { loc = await gps(); } catch (e) { loc = null; } }
        if (!loc) loc = await byIp();
        // Gamitin ang cache kung bago pa at halos parehong lugar
        if (cache && !force && Date.now() - cache.at < TTL && distKm(cache.loc, loc) < 25) { busy = false; return; }
        var results = await Promise.all([forecast(loc.lat, loc.lon), placeName(loc)]);
        var fresh = { at: Date.now(), loc: { lat: loc.lat, lon: loc.lon }, source: loc.source, place: results[1], data: results[0] };
        writeCache(fresh);
        render(fresh);
      } catch (e) {
        if (!cache) error("Can't get the weather right now. Check your internet.");
        else window.TMN_UI && TMN_UI.toast("Couldn't update the weather.");
      }
      busy = false;
    }

    load(false);
    return { refresh: function () { load(true); } };
  }

  window.TMN_WEATHER = { mount: mount, _describe: describe };
})();
