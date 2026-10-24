/* TigoMeNote · route.js — daan (route) ng Explore activity: kuwenta, GPX, at maliit na mapa
     TMN_ROUTE.stats(points)          → { dist_m, dur_s, up_m, down_m, start_at, end_at }   points = [{lat,lng,ele,t}]
     TMN_ROUTE.simplify(points, max)  → mas kaunting points (Douglas–Peucker), hanggang max (default 800)
     TMN_ROUTE.parseGpx(text)         → points (trkpt/rtept/wpt; may ele at time kung meron)
     TMN_ROUTE.pack(points)           → [[lat,lng,ele|null], …] para sa server (5 decimal)
     TMN_ROUTE.unpack(route)          → points
     TMN_ROUTE.svg(route, w, h, o)    → static na mapa (OpenStreetMap tiles + guhit), SVG na kusang lumalaki
     TMN_ROUTE.map(el, route)         → interactive na mapa (Leaflet) na may guhit, Start at Finish
     TMN_ROUTE.fmt.dist/time/speed/elev, TMN_ROUTE.TYPES
   Isang trabaho lang: walang UI na sheet dito. URLs (tiles, Leaflet) ay nasa config.js → TMN_CONFIG.map */
(function () {
  var R = 6371008.8;
  var TYPES = [
    { id: "hike", label: "Hike", verb: "went for a hike" },
    { id: "walk", label: "Walk", verb: "went for a walk" },
    { id: "run", label: "Run", verb: "went for a run" },
    { id: "bike", label: "Bike ride", verb: "went for a bike ride" },
    { id: "drive", label: "Drive", verb: "went for a drive" },
    { id: "other", label: "Trip", verb: "went on a trip" }
  ];
  function type(id) { return TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[TYPES.length - 1]; }

  function rad(d) { return d * Math.PI / 180; }
  function dist(a, b) {
    var dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  function stats(pts) {
    var d = 0, up = 0, down = 0, base = null;
    for (var i = 1; i < pts.length; i++) d += dist(pts[i - 1], pts[i]);
    // Elevation: binibilang lang ang pagbabago na ≥3 m (iwas "ingay" ng GPS)
    pts.forEach(function (p) {
      if (p.ele == null || !isFinite(p.ele)) return;
      if (base === null) { base = p.ele; return; }
      var df = p.ele - base;
      if (df >= 3) { up += df; base = p.ele; } else if (df <= -3) { down -= df; base = p.ele; }
    });
    var t0 = pts.length && pts[0].t ? pts[0].t : null, t1 = pts.length && pts[pts.length - 1].t ? pts[pts.length - 1].t : null;
    return {
      dist_m: Math.round(d), up_m: Math.round(up), down_m: Math.round(down),
      dur_s: t0 && t1 && t1 > t0 ? Math.round((t1 - t0) / 1000) : null,
      start_at: t0 ? new Date(t0).toISOString() : null, end_at: t1 ? new Date(t1).toISOString() : null
    };
  }

  // Douglas–Peucker (sa metro, halos patag na projection) hanggang max na points
  function simplify(pts, max) {
    max = max || 800;
    if (pts.length <= max) return pts.slice();
    var lat0 = rad(pts[0].lat), k = Math.cos(lat0);
    var xy = pts.map(function (p) { return [rad(p.lng) * R * k, rad(p.lat) * R]; });
    function segDist(p, a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      var t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
      var x = a[0] + t * dx - p[0], y = a[1] + t * dy - p[1];
      return Math.sqrt(x * x + y * y);
    }
    function run(tol) {
      var keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
      var stack = [[0, pts.length - 1]];
      while (stack.length) {
        var s = stack.pop(), a = s[0], b = s[1], best = -1, at = -1;
        for (var i = a + 1; i < b; i++) { var dd = segDist(xy[i], xy[a], xy[b]); if (dd > best) { best = dd; at = i; } }
        if (best > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
      }
      return pts.filter(function (_, i) { return keep[i]; });
    }
    var tol = 2, out = run(tol);
    while (out.length > max && tol < 5000) { tol *= 1.6; out = run(tol); }
    return out;
  }

  function parseGpx(text) {
    var doc = new DOMParser().parseFromString(String(text || ""), "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new Error("This isn't a valid GPX file.");
    var nodes = doc.getElementsByTagName("trkpt");
    if (!nodes.length) nodes = doc.getElementsByTagName("rtept");
    if (!nodes.length) nodes = doc.getElementsByTagName("wpt");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], lat = parseFloat(n.getAttribute("lat")), lng = parseFloat(n.getAttribute("lon"));
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      var e = n.getElementsByTagName("ele")[0], tm = n.getElementsByTagName("time")[0];
      var ele = e ? parseFloat(e.textContent) : null, t = tm ? Date.parse(tm.textContent) : null;
      out.push({ lat: lat, lng: lng, ele: isFinite(ele) ? ele : null, t: isFinite(t) ? t : null });
    }
    if (out.length < 2) throw new Error("No route found in this file.");
    var nameEl = doc.querySelector("trk > name, rte > name, metadata > name");
    out.name = nameEl ? nameEl.textContent.trim().slice(0, 80) : "";
    return out;
  }

  function pack(pts) {
    return pts.map(function (p) { return [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lng * 1e5) / 1e5, p.ele == null ? null : Math.round(p.ele)]; });
  }
  function unpack(route) {
    return (route || []).map(function (r) { return { lat: r[0], lng: r[1], ele: r[2] == null ? null : r[2] }; });
  }

  // ---------- static na mapa (SVG) ----------
  function proj(lat, lng, z) {
    var W = 256 * Math.pow(2, z), s = Math.sin(rad(Math.max(-85, Math.min(85, lat))));
    return [(lng + 180) / 360 * W, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * W];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function svg(route, w, h, o) {
    o = o || {};
    var pts = Array.isArray(route) && route.length && Array.isArray(route[0]) ? unpack(route) : (route || []);
    if (pts.length < 2) return "";
    var M = (window.TMN_CONFIG || {}).map || {}, tiles = M.tiles || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    var minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    pts.forEach(function (p) { minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat); minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng); });
    var pad = o.pad == null ? 0.18 : o.pad, z = 17;
    for (; z > 2; z--) {
      var a = proj(maxLat, minLng, z), b = proj(minLat, maxLng, z);
      if (b[0] - a[0] <= w * (1 - 2 * pad) && b[1] - a[1] <= h * (1 - 2 * pad)) break;
    }
    var c1 = proj(maxLat, minLng, z), c2 = proj(minLat, maxLng, z);
    var ox = (c1[0] + c2[0]) / 2 - w / 2, oy = (c1[1] + c2[1]) / 2 - h / 2, n = Math.pow(2, z);
    var img = "";
    for (var tx = Math.floor(ox / 256); tx <= Math.floor((ox + w) / 256); tx++) {
      for (var ty = Math.floor(oy / 256); ty <= Math.floor((oy + h) / 256); ty++) {
        if (ty < 0 || ty >= n) continue;
        var url = tiles.replace("{z}", z).replace("{x}", ((tx % n) + n) % n).replace("{y}", ty).replace("{s}", "a");
        img += '<image href="' + esc(url) + '" x="' + (tx * 256 - ox).toFixed(1) + '" y="' + (ty * 256 - oy).toFixed(1) + '" width="256.5" height="256.5"/>';
      }
    }
    var line = pts.map(function (p) { var q = proj(p.lat, p.lng, z); return (q[0] - ox).toFixed(1) + "," + (q[1] - oy).toFixed(1); }).join(" ");
    var s = proj(pts[0].lat, pts[0].lng, z), e = proj(pts[pts.length - 1].lat, pts[pts.length - 1].lng, z);
    var sw = o.stroke || Math.max(3, Math.round(Math.min(w, h) / 70));
    var r = Math.max(5, sw * 1.8);
    return '<svg class="rt-svg" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Route map">' +
      '<rect width="100%" height="100%" fill="#e8eef0"/>' + img +
      '<polyline points="' + line + '" fill="none" stroke="#fff" stroke-width="' + (sw + 3) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#1d6fe0" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + (e[0] - ox).toFixed(1) + '" cy="' + (e[1] - oy).toFixed(1) + '" r="' + r + '" fill="#e11d48" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="' + (s[0] - ox).toFixed(1) + '" cy="' + (s[1] - oy).toFixed(1) + '" r="' + r + '" fill="#2f7d32" stroke="#fff" stroke-width="2"/>' +
      (o.attr === false ? "" : '<text x="' + (w - 4) + '" y="' + (h - 4) + '" text-anchor="end" font-size="' + Math.max(8, Math.round(w / 60)) + '" fill="#333" opacity=".75">© OpenStreetMap</text>') +
      "</svg>";
  }

  // ---------- interactive na mapa ----------
  async function map(el, route) {
    if (!window.TMN_MAP) throw new Error("Map isn't loaded.");
    var L = await TMN_MAP.load();
    var pts = unpack(route).map(function (p) { return [p.lat, p.lng]; });
    var m = await TMN_MAP.create(el, { center: pts[0], zoom: 13 });
    var line = L.polyline(pts, { color: "#1d6fe0", weight: 5, opacity: 0.95 }).addTo(m.map);
    function dot(p, color, label) {
      return L.marker(p, { icon: L.divIcon({ className: "rt-pin", html: '<span style="background:' + color + '">' + label + "</span>", iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(m.map);
    }
    dot(pts[pts.length - 1], "#e11d48", "■"); dot(pts[0], "#2f7d32", "A");
    m.map.fitBounds(line.getBounds(), { padding: [30, 30] });
    return m;
  }

  // ---------- format ----------
  var fmt = {
    dist: function (m) { return m == null ? "—" : m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(m < 100000 ? 1 : 0) + " km"; },
    time: function (s) { if (!s) return "—"; var h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60); return h ? h + "h " + mi + "m" : mi ? mi + "m" : s + "s"; },
    speed: function (m, s) { return m && s ? (m / s * 3.6).toFixed(1) + " km/h" : "—"; },
    elev: function (m) { return m == null ? "—" : Math.round(m) + " m"; },
    clock: function (s) { s = Math.max(0, Math.round(s || 0)); var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); }
  };

  window.TMN_ROUTE = { TYPES: TYPES, type: type, dist: dist, stats: stats, simplify: simplify, parseGpx: parseGpx, pack: pack, unpack: unpack, svg: svg, map: map, fmt: fmt };
})();
