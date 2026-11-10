/* TigoMeNote · components/weather-detail.js — "Weather details" (pindot ang Weather card sa Daily)
     TMN_WX_DETAIL.open(c)   c = { loc:{lat,lon}, place:{city,country}, data } galing sa weather.js (cache)
   Malaking card: temperatura, kalagayan, lugar · Humidity, Wind, Pressure, UV · Sunrise/Sunset
   · bawat oras (24 oras) · 7 araw na may bar ng init. Kumukuha ng mas detalyadong forecast (Open-Meteo, walang key); cache 30 min.
   Kailangan: weather.js (describe, getJSON), modal.js */
(function () {
  var cache = null, TTL = 30 * 60000;
  var EMO = { sun: "☀️", moon: "🌙", cloudSun: "⛅", cloud: "☁️", fog: "🌫️", rain: "🌧️", snow: "❄️", storm: "⛈️" };
  function esc(s) { return window.TMN_UI.esc(s); }
  function loc() { return window.TMN_I18N ? TMN_I18N.locale : undefined; }
  function sky(code, day) {   // kulay ng card ayon sa panahon
    if (!day) return "night";
    if (code >= 95) return "storm";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code === 3 || code === 45 || code === 48) return "cloud";
    return "sun";
  }
  async function fetchMore(lat, lon) {
    var q = "https://api.open-meteo.com/v1/forecast?latitude=" + lat.toFixed(4) + "&longitude=" + lon.toFixed(4) +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,is_day" +
      "&hourly=temperature_2m,weather_code,precipitation_probability,is_day" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max" +
      "&timezone=auto&forecast_days=7";
    return TMN_WEATHER._get(q, 10000);
  }
  function dir(deg) { return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((deg || 0) % 360) / 45) % 8]; }
  function uvText(u) { return u < 3 ? "Low" : u < 6 ? "Moderate" : u < 8 ? "High" : u < 11 ? "Very high" : "Extreme"; }
  function t(iso) { return new Date(iso).toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" }); }

  function view(c, d) {
    var D = TMN_WEATHER._describe, cur = d.current, day = d.daily, h = d.hourly;
    var now = D(cur.weather_code, cur.is_day), place = [c.place.city, c.place.country].filter(Boolean).join(", ") || "Your location";
    // susunod na 24 na oras
    var i0 = Math.max(0, h.time.findIndex(function (x) { return new Date(x).getTime() >= Date.now() - 3600000; }));
    var hours = h.time.slice(i0, i0 + 24).map(function (x, k) {
      var i = i0 + k, dd = D(h.weather_code[i], h.is_day[i]);
      return '<div class="wd-h"><small>' + (k === 0 ? "Now" : new Date(x).toLocaleTimeString(loc(), { hour: "numeric" })) + "</small><span>" + EMO[dd[1]] + "</span><b>" +
        Math.round(h.temperature_2m[i]) + "°</b>" + (h.precipitation_probability[i] >= 20 ? "<i>💧" + h.precipitation_probability[i] + "%</i>" : "<i></i>") + "</div>";
    }).join("");
    var lo = Math.min.apply(null, day.temperature_2m_min), hi = Math.max.apply(null, day.temperature_2m_max), span = Math.max(1, hi - lo);
    var days = day.time.map(function (x, i) {
      var dd = D(day.weather_code[i], 1), a = (day.temperature_2m_min[i] - lo) / span * 100, b = (day.temperature_2m_max[i] - lo) / span * 100;
      return '<div class="wd-d"><b>' + (i === 0 ? "Today" : new Date(x + "T12:00").toLocaleDateString(loc(), { weekday: "short" })) + '</b><span class="wd-de">' + EMO[dd[1]] + "</span>" +
        '<small class="wd-rain">' + (day.precipitation_probability_max[i] >= 20 ? "💧" + day.precipitation_probability_max[i] + "%" : "") + "</small>" +
        '<small translate="no">' + Math.round(day.temperature_2m_min[i]) + '°</small><span class="wd-bar"><i style="left:' + a.toFixed(0) + "%;right:" + (100 - b).toFixed(0) + '%"></i></span><b translate="no">' + Math.round(day.temperature_2m_max[i]) + "°</b></div>";
    }).join("");
    return '<div class="wd-hero ' + sky(cur.weather_code, cur.is_day) + '">' +
        '<div class="wd-place">📍 ' + esc(place) + "</div>" +
        '<div class="wd-main"><span class="wd-emo">' + EMO[now[1]] + '</span><div><div class="wd-temp" translate="no">' + Math.round(cur.temperature_2m) + "<sup>°C</sup></div>" +
          '<div class="wd-cond">' + now[0] + "</div><div class=\"wd-feel\">Feels like " + Math.round(cur.apparent_temperature) + "° · H " + Math.round(day.temperature_2m_max[0]) + "° L " + Math.round(day.temperature_2m_min[0]) + "°</div></div></div>" +
        '<div class="wd-stats">' +
          '<div><span>💧</span><small>Humidity</small><b>' + cur.relative_humidity_2m + "%</b></div>" +
          '<div><span>🌬️</span><small>Wind</small><b>' + Math.round(cur.wind_speed_10m) + " km/h " + dir(cur.wind_direction_10m) + "</b></div>" +
          '<div><span>🧭</span><small>Pressure</small><b>' + Math.round(cur.surface_pressure) + " hPa</b></div>" +
          '<div><span>🔆</span><small>UV</small><b>' + Math.round(cur.uv_index || 0) + " " + uvText(cur.uv_index || 0) + "</b></div>" +
        "</div>" +
        '<div class="wd-sun"><span>🌅 Sunrise <b translate="no">' + t(day.sunrise[0]) + '</b></span><span>🌇 Sunset <b translate="no">' + t(day.sunset[0]) + "</b></span></div>" +
      "</div>" +
      '<div class="wd-card"><b class="wd-t">Next 24 hours</b><div class="wd-hours">' + hours + "</div></div>" +
      '<div class="wd-card"><b class="wd-t">7-day forecast</b><div class="wd-days">' + days + "</div></div>" +
      '<p class="faint small wd-src">Open-Meteo · ' + (c.source === "gps" ? "your phone's location" : "approximate location") + "</p>";
  }

  async function open(c) {
    if (!c || !c.loc) return;
    var body = document.createElement("div"); body.className = "wd";
    body.innerHTML = '<div class="wd-hero ' + sky(c.data.current.weather_code, c.data.current.is_day) + ' wd-wait"><div class="wd-temp">' + Math.round(c.data.current.temperature_2m) + '<sup>°C</sup></div><p>Loading the forecast…</p></div>';
    TMN_MODAL.open({ title: "Weather", size: "sm", cls: "modal-sheet modal-wd", body: body });
    try {
      var key = c.loc.lat.toFixed(2) + "," + c.loc.lon.toFixed(2);
      if (!cache || cache.key !== key || Date.now() - cache.at > TTL) cache = { key: key, at: Date.now(), d: await fetchMore(c.loc.lat, c.loc.lon) };
      body.innerHTML = view(c, cache.d);
    } catch (e) {
      body.innerHTML = '<p class="muted">Couldn\'t load the full forecast. Check your internet and try again.</p>';
    }
  }
  window.TMN_WX_DETAIL = { open: open };
})();
