/* TigoMeNote · components/mini-calendar.js — maliit na calendar ng buwan (Daily → This week → Calendar)
     TMN_CAL.open({ day: "YYYY-MM-DD", onPick(day) })
   May tuldok ang araw na may notes, emoji ng mood, at 🔔 kapag may reminder/alarm. Tap = buksan ang araw na iyon.
   Kailangan: daily-store.js, modal.js; reminders.js kung meron (para sa 🔔). */
(function () {
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function open(o) {
    o = o || {};
    var D = window.TMN_DAILY, loc = window.TMN_I18N ? TMN_I18N.locale : undefined;
    var sel = o.day || D.dayKey(), today = D.dayKey();
    var cur = new Date(sel + "T12:00"); cur.setDate(1);
    var body = document.createElement("div");
    body.className = "cal";
    var m = TMN_MODAL.open({ title: "Calendar", size: "sm", cls: "modal-sheet modal-cal", body: body });

    async function paint() {
      var ym = cur.getFullYear() + "-" + pad(cur.getMonth() + 1);
      var info = {};
      try { info = await D.month(ym); } catch (e) {}
      var rem = {};
      (window.TMN_REMIND ? TMN_REMIND.list() : []).forEach(function (r) { if (!r.done_at) rem[D.dayKey(r.due_at)] = (rem[D.dayKey(r.due_at)] || 0) + 1; });
      // Lunes ang simula ng linggo (gaya ng "This week")
      var first = (cur.getDay() + 6) % 7, days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      var names = []; for (var i = 0; i < 7; i++) names.push(new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: "narrow" }));
      var cells = "";
      for (var b = 0; b < first; b++) cells += "<span></span>";
      for (var d = 1; d <= days; d++) {
        var k = ym + "-" + pad(d), x = info[k] || {};
        cells += '<button type="button" class="cal-d' + (k === today ? " today" : "") + (k === sel ? " sel" : "") + '" data-day="' + k + '">' +
          '<span class="cal-n" translate="no">' + d + "</span>" +
          '<span class="cal-marks">' + (x.mood ? '<i class="cal-mood">' + x.mood + "</i>" : x.notes ? '<i class="cal-dot"></i>' : "") + (rem[k] ? '<i class="cal-bell">🔔</i>' : "") + "</span></button>";
      }
      body.innerHTML =
        '<div class="cal-head"><button type="button" class="icon-btn" data-nav="-1" aria-label="Previous month">' + I("chevronL") + "</button>" +
          "<b>" + cur.toLocaleDateString(loc, { month: "long", year: "numeric" }) + "</b>" +
          '<button type="button" class="icon-btn" data-nav="1" aria-label="Next month">' + I("chevronR") + "</button></div>" +
        '<div class="cal-grid cal-names">' + names.map(function (n) { return "<span>" + n + "</span>"; }).join("") + "</div>" +
        '<div class="cal-grid">' + cells + "</div>" +
        '<div class="cal-foot"><button type="button" class="btn btn-ghost btn-sm" data-today>Today</button>' +
          (window.TMN_REMIND ? '<button type="button" class="btn btn-ghost btn-sm" data-remind>🔔 Reminder on this day</button>' : "") + "</div>" +
        '<p class="faint small cal-legend"><i class="cal-dot"></i> notes · 😊 mood · 🔔 reminder</p>';
    }
    body.addEventListener("click", function (e) {
      var n = e.target.closest("[data-nav]"), d = e.target.closest("[data-day]");
      if (n) { cur.setMonth(cur.getMonth() + Number(n.dataset.nav)); paint(); return; }
      if (d) { sel = d.dataset.day; m.close(); if (o.onPick) o.onPick(sel); return; }
      if (e.target.closest("[data-today]")) { m.close(); if (o.onPick) o.onPick(today); return; }
      if (e.target.closest("[data-remind]")) { var t = new Date(sel + "T09:00"); m.close(); TMN_REMIND.add({ due: t < new Date() ? undefined : t }); }
    });
    paint();
    return m;
  }
  window.TMN_CAL = { open: open };
})();
