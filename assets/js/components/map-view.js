/* TigoMeNote · components/map-view.js — mapa (Leaflet + OpenStreetMap, libre)
   var m = await TMN_MAP.create(el);         → gumagawa ng mapa sa loob ng el
   m.set([{ id, lat, lng, acc, user, label, sos, me }])  → mga marker (avatar ng tao)
   m.focus(id) · m.fit() · m.path(points) (daan sa huling 24 oras) · m.destroy()
   Ang URLs (Leaflet, tiles) ay nasa config.js → TMN_CONFIG.map */
(function () {
  var M = window.TMN_CONFIG.map;
  var loading = null;
  function load() {
    if (window.L) return Promise.resolve(window.L);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = M.css; document.head.appendChild(css);
      var s = document.createElement("script"); s.src = M.js; s.async = true;
      s.onload = function () { resolve(window.L); };
      s.onerror = function () { loading = null; reject(new Error("Couldn't load the map. Check your internet.")); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function initials(u) { return String((u && (u.display_name || u.username)) || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }

  async function create(el, opts) {
    opts = opts || {};
    var L = await load();
    var map = L.map(el, { zoomControl: true, attributionControl: true }).setView(opts.center || [26.07, 50.55], opts.zoom || 11);
    L.tileLayer(M.tiles, { maxZoom: 19, attribution: M.attribution }).addTo(map);
    var layers = {}, pathLayer = null;
    function icon(p) {
      var u = p.user || {};
      return L.divIcon({
        className: "mv-pin" + (p.sos ? " is-sos" : "") + (p.me ? " is-me" : ""),
        html: '<span class="mv-av">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(initials(u))) + "</span>" + (p.sos ? '<span class="mv-pulse"></span>' : ""),
        iconSize: [44, 44], iconAnchor: [22, 22]
      });
    }
    function set(list) {
      var keep = {};
      (list || []).forEach(function (p) {
        if (p.lat == null || p.lng == null) return;
        keep[p.id] = 1;
        var cur = layers[p.id];
        if (cur) { cur.marker.setLatLng([p.lat, p.lng]).setIcon(icon(p)); cur.circle.setLatLng([p.lat, p.lng]).setRadius(p.acc || 0); }
        else {
          var circle = L.circle([p.lat, p.lng], { radius: p.acc || 0, color: p.sos ? "#e11d48" : "#3b82f6", weight: 1, fillOpacity: 0.12 }).addTo(map);
          var marker = L.marker([p.lat, p.lng], { icon: icon(p), title: p.label || "" }).addTo(map);
          if (p.label) marker.bindPopup('<div translate="no">' + esc(p.label) + "</div>");
          layers[p.id] = { marker: marker, circle: circle };
        }
      });
      Object.keys(layers).forEach(function (id) { if (!keep[id]) { map.removeLayer(layers[id].marker); map.removeLayer(layers[id].circle); delete layers[id]; } });
    }
    function fit() {
      var pts = Object.keys(layers).map(function (id) { return layers[id].marker.getLatLng(); });
      if (pts.length === 1) map.setView(pts[0], 15);
      else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
    }
    function focus(id) {
      var l = layers[id]; if (!l) return false;
      map.setView(l.marker.getLatLng(), Math.max(map.getZoom(), 15)); l.marker.openPopup();
      return true;
    }
    function path(points) {
      if (pathLayer) { map.removeLayer(pathLayer); pathLayer = null; }
      if (points && points.length > 1) pathLayer = L.polyline(points.map(function (p) { return [p.lat, p.lng]; }), { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "6 6" }).addTo(map);
    }
    return { map: map, set: set, fit: fit, focus: focus, path: path, resize: function () { map.invalidateSize(); }, destroy: function () { map.remove(); } };
  }

  window.TMN_MAP = { load: load, create: create };
})();
