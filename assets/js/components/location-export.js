/* TigoMeNote · components/location-export.js — kopya ng location history (.zip) at pagbura nito
   Laman ng zip: location-history.csv (Excel), .gpx (Google Earth / maps apps), .json (buong data).
   Naise-save sa TigoMeNote/Location (APK: Documents ng phone; desktop: napiling folder; iba: Downloads).
   TMN_LOC_EXPORT.save()            → Promise<{ count, where }>
   TMN_LOC_EXPORT.clearSheet(done)  → sheet: "Save to zip, then delete" / "Delete without saving"
   Kailangan: api.js, modal.js, zip.js, file-save.js */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stamp(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "_" + pad(d.getHours()) + pad(d.getMinutes()); }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function xml(s) { return String(s).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); }

  function build(points, user) {
    var who = (user && user.username) || "me";
    var csv = ["time_utc,local_time,latitude,longitude,accuracy_m,source,google_maps"].concat(points.map(function (p) {
      return [p.at, new Date(p.at).toLocaleString(), p.lat, p.lng, p.acc == null ? "" : Math.round(p.acc), p.source || "", "https://maps.google.com/?q=" + p.lat + "," + p.lng].map(csvCell).join(",");
    })).join("\r\n");
    var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TigoMeNote" xmlns="http://www.topografix.com/GPX/1/1">\n' +
      "<metadata><name>" + xml("TigoMeNote location history · @" + who) + "</name><time>" + new Date().toISOString() + "</time></metadata>\n<trk><name>Location history</name><trkseg>\n" +
      points.map(function (p) { return '<trkpt lat="' + p.lat + '" lon="' + p.lng + '"><time>' + xml(p.at) + "</time></trkpt>"; }).join("\n") +
      "\n</trkseg></trk>\n</gpx>\n";
    var json = JSON.stringify({ app: "TigoMeNote", user: "@" + who, exported_at: new Date().toISOString(), count: points.length, points: points }, null, 2);
    return TMN_ZIP.make([
      { name: "location-history.csv", data: "﻿" + csv },
      { name: "location-history.gpx", data: gpx },
      { name: "location-history.json", data: json }
    ]);
  }

  async function save() {
    var r = await TMN_API.call("safety", "exportHistory", {}, { timeout: 60000 });
    var points = r.points || [];
    if (!points.length) return { count: 0, where: null };
    var name = "TigoMeNote-location-" + stamp(new Date()) + ".zip";
    var where = await TMN_FILES.save("Location", name, build(points, window.TMN_USER));
    return { count: points.length, where: where };
  }

  function clearSheet(done) {
    var body = document.createElement("div");
    body.className = "lx";
    body.innerHTML =
      '<p class="lx-text">Delete all your saved locations? Your circle will see “No location yet” until the next update.</p>' +
      '<p class="faint small lx-where">' + I("folder", "ic-sm") + '<span class="lx-where-t">Checking…</span></p>' +
      '<div class="lx-btns">' +
        '<button type="button" class="btn btn-primary btn-block" data-lx="save">' + I("download", "ic-sm") + "Save to zip, then delete</button>" +
        '<button type="button" class="btn btn-danger btn-block" data-lx="delete">' + I("trash", "ic-sm") + "Delete without saving</button>" +
        '<button type="button" class="btn btn-ghost btn-block" data-lx="cancel">Cancel</button>' +
      "</div>";
    var m = TMN_MODAL.open({ title: "Location history", size: "sm", cls: "modal-sheet", body: body });
    TMN_FILES.where().then(function (w) { body.querySelector(".lx-where-t").textContent = "The copy goes to: " + w.label + (w.kind === "downloads" ? "" : "/Location"); });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-lx]"); if (!b) return;
      if (b.dataset.lx === "cancel") { m.close(); return; }
      body.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
      try {
        if (b.dataset.lx === "save") {
          b.textContent = "Saving…";
          var s = await save();
          if (s.count) UI.toast("Saved " + s.count + " locations to " + s.where + ".", 4000);
        }
        await TMN_API.call("safety", "clearHistory", {});
        UI.toast("Location history deleted.");
        m.close();
        if (done) done();
      } catch (err) {
        UI.toast(err.message === "The user aborted a request." ? "Not saved. Nothing was deleted." : err.message, 4000);
        body.querySelectorAll("button").forEach(function (x) { x.disabled = false; });
        b.innerHTML = b.dataset.lx === "save" ? I("download", "ic-sm") + "Save to zip, then delete" : b.innerHTML;
      }
    });
    return m;
  }

  window.TMN_LOC_EXPORT = { save: save, build: build, clearSheet: clearSheet };
})();
