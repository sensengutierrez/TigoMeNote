/* TigoMeNote · components/activity-composer.js — "Explore" post na parang Komoot: route sa mapa + photos + stats
     TMN_ACTIVITY.open({ onPosted })
   Hakbang 1 · Saan galing ang route: Record now (GPS, activity-recorder.js) · Import GPX (Komoot, Strava, Garmin…)
              · From my location history (Safety, hanggang 30 araw) · o ang huling recording na hindi pa naipo-post.
   Hakbang 2 · Uri (Hike, Walk…), pamagat, oras kung wala sa file, at photos/videos (hanggang 10, hindi required).
   Tuloy sa post-composer.js (caption, sino ang makakakita, schedule) → offline queue → posts-fast (activity).
   Kailangan: modal.js, route.js, post-composer.js; activity-recorder.js at map-view.js para sa Record; media-store.js para sa photos. */
(function () {
  var MAX_POINTS = 800, MAX_MEDIA = 10;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function dayInput(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function autoTitle(type, t) {
    var h = new Date(t || Date.now()).getHours();
    var part = h < 5 ? "Night" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night";
    return part + " " + window.TMN_ROUTE.type(type).label.toLowerCase();
  }

  function open(o) {
    o = o || {};
    var UI = window.TMN_UI, R = window.TMN_ROUTE;
    var st = { points: null, dur_s: null, name: "", type: "hike", title: "", items: [], fromTrack: false };
    var body = document.createElement("div");
    body.className = "act";
    var m = TMN_MODAL.open({ title: "Explore post", size: "md", cls: "modal-sheet modal-act", body: body, closeOnBackdrop: false,
      onClose: function () { urls.forEach(function (u) { URL.revokeObjectURL(u); }); } });

    // ---------- Hakbang 1: route ----------
    function step1() {
      var last = window.TMN_TRACK && TMN_TRACK.saved();
      body.innerHTML =
        '<p class="faint small">Share where you went: your route on a map, with photos and stats.</p>' +
        '<div class="act-src">' +
          (last ? '<button type="button" class="act-opt is-last" data-src="last"><span class="act-ic">' + I("check") + '</span><span><b>Use my last recording</b><span class="faint small">' + R.fmt.dist(R.stats(last.points).dist_m) + " · " + R.fmt.time(last.dur_s) + "</span></span></button>" : "") +
          (window.TMN_TRACK ? '<button type="button" class="act-opt" data-src="record"><span class="act-ic">' + I("nav") + '</span><span><b>Record now</b><span class="faint small">Uses GPS while you walk, run or ride</span></span></button>' : "") +
          '<label class="act-opt" data-src="gpx"><span class="act-ic">' + I("upload") + '</span><span><b>Import GPX file</b><span class="faint small">From Komoot, Strava, Garmin, Google…</span></span>' +
            '<input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" class="sr-only"></label>' +
          '<button type="button" class="act-opt" data-src="history"><span class="act-ic">' + I("clock") + '</span><span><b>From my location history</b><span class="faint small">Saved by Safety (last 30 days)</span></span></button>' +
        "</div>" +
        '<div class="act-hist hidden">' +
          '<div class="act-row"><label class="field"><span class="pe-label">Day</span><input type="date" class="input act-day"></label>' +
          '<label class="field"><span class="pe-label">From</span><input type="time" class="input act-from" value="06:00"></label>' +
          '<label class="field"><span class="pe-label">To</span><input type="time" class="input act-to"></label></div>' +
          '<button type="button" class="btn btn-primary act-load">' + I("map", "ic-sm") + "Load route</button></div>" +
        '<p class="act-msg small hidden" aria-live="polite"></p>';
      var msg = body.querySelector(".act-msg");
      function say(t, bad) { msg.textContent = t; msg.classList.toggle("hidden", !t); msg.classList.toggle("err", !!bad); }
      var now = new Date(), day = body.querySelector(".act-day");
      day.value = dayInput(now); day.max = dayInput(now); day.min = dayInput(new Date(Date.now() - 29 * 86400000));
      body.querySelector(".act-to").value = hm(now);

      body.querySelector(".act-src").addEventListener("click", function (e) {
        var b = e.target.closest("[data-src]"); if (!b || b.tagName === "LABEL") return;
        if (b.dataset.src === "last") { st.fromTrack = true; setRoute(last.points, last.dur_s); }
        if (b.dataset.src === "record") TMN_TRACK.open({ onDone: function (t) { st.fromTrack = true; setRoute(t.points, t.dur_s); } });
        if (b.dataset.src === "history") { body.querySelector(".act-hist").classList.remove("hidden"); day.focus(); }
      });
      body.querySelector('[data-src="gpx"] input').addEventListener("change", async function () {
        var f = this.files && this.files[0]; this.value = ""; if (!f) return;
        if (f.size > 15 * 1024 * 1024) { say("The file is too large (max 15 MB).", true); return; }
        try { var pts = R.parseGpx(await f.text()); st.name = pts.name || ""; setRoute(pts, null); }
        catch (er) { say(er.message, true); }
      });
      body.querySelector(".act-load").addEventListener("click", async function () {
        var from = new Date(day.value + "T" + body.querySelector(".act-from").value), to = new Date(day.value + "T" + body.querySelector(".act-to").value);
        if (isNaN(from) || isNaN(to) || to <= from) { say("Pick a time range (To must be after From).", true); return; }
        if (!navigator.onLine) { say("You need internet to load your history.", true); return; }
        var btn = this; btn.disabled = true; say("Loading…");
        try {
          var hours = Math.min(720, Math.ceil((Date.now() - from.getTime()) / 3600000) + 1);
          var r = await TMN_API.call("safety", "history", { hours: hours });
          var pts = (r.points || []).map(function (p) { return { lat: p.lat, lng: p.lng, ele: null, t: new Date(p.at).getTime() }; })
            .filter(function (p) { return p.t >= from.getTime() && p.t <= to.getTime(); });
          if (pts.length < 2) { say("No saved locations in that time. Location history is saved only when Safety sharing is on.", true); btn.disabled = false; return; }
          setRoute(pts, null);
        } catch (er) { say(er.message, true); btn.disabled = false; }
      });
    }

    function setRoute(points, dur) {
      var full = R.stats(points);
      st.points = R.simplify(points, MAX_POINTS);
      st.stats = full;
      st.dur_s = dur || full.dur_s || null;
      st.start_at = full.start_at;
      if (!st.title) st.title = st.name || autoTitle(st.type, points[0].t);
      step2();
    }

    // ---------- Hakbang 2: detalye + photos ----------
    var urls = [];
    function step2() {
      var s = st.stats;
      body.innerHTML =
        '<div class="act-prev" data-a="map">' + R.svg(R.pack(st.points), 640, 320) + "</div>" +
        '<div class="pc-act-stats act-stats"></div>' +
        '<div class="field"><span class="pe-label">Type</span><div class="chips act-types">' + R.TYPES.map(function (t) {
          return '<button type="button" class="chip' + (t.id === st.type ? " active" : "") + '" data-type="' + t.id + '">' + t.label + "</button>";
        }).join("") + "</div></div>" +
        '<label class="field"><span class="pe-label">Title</span><input class="input act-title" maxlength="80" value="' + esc(st.title) + '"></label>' +
        (st.dur_s ? "" : '<label class="field"><span class="pe-label">How long did it take?</span><input class="input act-dur" type="time" step="60" placeholder="h:mm"><span class="faint small">This file has no times. Optional.</span></label>') +
        '<div class="field"><span class="pe-label">Photos and videos <span class="faint small">(optional, up to ' + MAX_MEDIA + ")</span></span>" +
          '<div class="act-media"></div></div>' +
        '<div class="act-foot"><button type="button" class="btn btn-ghost" data-a="back">' + I("chevronL", "ic-sm") + "Change route</button>" +
          '<button type="button" class="btn btn-primary" data-a="next">Next' + I("chevronR", "ic-sm") + "</button></div>" +
        '<p class="act-msg small hidden" aria-live="polite"></p>';
      paintStats(); paintMedia();
      var title = body.querySelector(".act-title");
      title.addEventListener("input", function () { st.title = title.value; });
      if (window.TMN_GUARD) TMN_GUARD.watch(title);
      var dur = body.querySelector(".act-dur");
      if (dur) dur.addEventListener("input", function () { var p = dur.value.split(":"); st.manualDur = p.length === 2 ? (+p[0]) * 3600 + (+p[1]) * 60 : null; paintStats(); });
      body.querySelector(".act-types").addEventListener("click", function (e) {
        var b = e.target.closest("[data-type]"); if (!b) return;
        var wasAuto = st.title === autoTitle(st.type, st.points[0].t);
        st.type = b.dataset.type;
        body.querySelectorAll("[data-type]").forEach(function (x) { x.classList.toggle("active", x === b); });
        if (wasAuto) { st.title = autoTitle(st.type, st.points[0].t); title.value = st.title; }
      });
    }
    function durNow() { return st.dur_s || st.manualDur || null; }
    function paintStats() {
      var s = st.stats, d = durNow();
      body.querySelector(".act-stats").innerHTML = [["Time", R.fmt.time(d)], ["Distance", R.fmt.dist(s.dist_m)], ["Speed", R.fmt.speed(s.dist_m, d)], ["Elevation", R.fmt.elev(st.points.some(function (p) { return p.ele != null; }) ? s.up_m : null)]]
        .map(function (c) { return '<div><span class="faint small">' + c[0] + '</span><b translate="no">' + c[1] + "</b></div>"; }).join("");
    }
    function paintMedia() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      var box = body.querySelector(".act-media");
      box.innerHTML = st.items.map(function (it, i) {
        var u = URL.createObjectURL(it.thumb || it.blob); urls.push(u);
        return '<div class="act-thumb"><img alt="" src="' + u + '">' + (it.type === "video" ? '<span class="pc-dur">' + I("play", "ic-sm") + "</span>" : "") +
          '<button type="button" class="act-rm" data-rm="' + i + '" aria-label="Remove">' + I("x", "ic-sm") + "</button></div>";
      }).join("") +
        (st.items.length < MAX_MEDIA ? '<label class="act-add">' + I("plus") + '<span class="small">Add</span><input type="file" accept="image/*,video/*" multiple class="sr-only"></label>' : "");
      var inp = box.querySelector("input");
      if (inp) inp.addEventListener("change", async function () {
        var files = [].slice.call(this.files || []).slice(0, MAX_MEDIA - st.items.length); this.value = "";
        if (!files.length) return;
        try {
          // Naka-save din sa Gallery ng device (parang Share); kung wala ang Gallery dito, diretso na lang
          var added = window.TMN_MEDIA ? await TMN_MEDIA.addFiles(files, null)
            : files.map(function (f, k) { return { id: "a" + Date.now() + k, type: /^video\//.test(f.type) ? "video" : "photo", blob: f, createdAt: f.lastModified || Date.now() }; })
                .filter(function (x) { return x.type === "photo"; });
          st.items = st.items.concat(added).slice(0, MAX_MEDIA); paintMedia();
        } catch (er) { UI.toast(er.message); }
      });
    }
    body.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]");
      if (rm) { st.items.splice(Number(rm.dataset.rm), 1); paintMedia(); return; }
      var a = e.target.closest("[data-a]"); if (!a) return;
      if (a.dataset.a === "map" && window.TMN_VIEWER) TMN_VIEWER.open([{ kind: "route", route: R.pack(st.points) }], 0);
      if (a.dataset.a === "back") { st.points = null; st.title = ""; step1(); }
      if (a.dataset.a === "next") next();
    });
    function next() {
      var title = st.title.trim();
      if (!title) { UI.toast("Add a title."); body.querySelector(".act-title").focus(); return; }
      if (window.TMN_GUARD && !TMN_GUARD.ok(title)) return;
      var activity = {
        type: st.type, title: title, route: R.pack(st.points),
        stats: { dist_m: st.stats.dist_m, dur_s: durNow(), up_m: st.points.some(function (p) { return p.ele != null; }) ? st.stats.up_m : null, down_m: st.stats.down_m || null },
        start_at: st.start_at || null
      };
      var fromTrack = st.fromTrack, items = st.items;
      m.close();
      TMN_COMPOSER.open(items, {
        activity: activity,
        onPosted: function () { if (fromTrack && window.TMN_TRACK) TMN_TRACK.clear(); if (o.onPosted) o.onPosted(); }
      });
    }
    step1();
    return m;
  }

  window.TMN_ACTIVITY = { open: open };
})();
