/* TigoMeNote · components/mini-calendar.js — "Smart calendar" ng Daily (pindot ang petsa sa itaas, o This week → Calendar)
     TMN_CAL.open({ day: "YYYY-MM-DD", onPick(day) })
   Buwan: may kulay na tuldok bawat araw — 📚 klase (asul), 💼 trabaho (dalandan), 🔔 paalala/alarm (pink), 📝 notes (dilaw), at mood.
   Pindot sa araw = makikita ang mga event ng araw na iyon (klase/trabaho, paalala, notes). Pindot ulit / "Open day" = buksan sa Daily.
   "+ Add" = paalala sa araw na iyon. Sa ibaba: ang susunod na paalala.
   Kailangan: daily-store.js, modal.js; reminders.js (paalala, klase at trabaho) kung meron. */
(function () {
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }
  function loc() { return window.TMN_I18N ? TMN_I18N.locale : undefined; }
  function hm(s) { var p = s.split(":"); return new Date(2000, 0, 1, +p[0], +p[1]).toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" }); }
  function tm(d) { return d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" }); }

  // nangyayari ba ang paalala sa araw na k? (kasama ang umuulit)
  function occurs(r, k, D) {
    if (r.done_at) return false;
    var due = new Date(r.due_at), dk = D.dayKey(due);
    if (r.sched) return r.sched.days.indexOf(new Date(k + "T12:00").getDay()) >= 0;
    if (k === dk) return true;
    if (k < dk || !r.repeat || r.repeat === "none") return false;
    var day = new Date(k + "T12:00");
    if (r.repeat === "daily") return true;
    if (r.repeat === "weekly") return day.getDay() === due.getDay();
    if (r.repeat === "monthly") return day.getDate() === due.getDate();
    return false;
  }
  function eventsOf(k, D) {
    var out = [];
    (window.TMN_REMIND ? TMN_REMIND.list() : []).forEach(function (r) {
      if (!occurs(r, k, D)) return;
      if (r.sched) out.push({ kind: r.kind, at: r.sched.start, time: hm(r.sched.start) + (r.sched.end ? " – " + hm(r.sched.end) : ""), title: r.title, sub: r.note || (r.kind === "class" ? "Class" : "Work"), ic: r.kind === "class" ? "📚" : "💼" });
      else { var d = new Date(r.due_at); out.push({ kind: r.kind === "alarm" ? "alarm" : "reminder", at: pad(d.getHours()) + ":" + pad(d.getMinutes()), time: tm(d), title: r.title, sub: r.note || (r.kind === "alarm" ? "Alarm" : "Reminder"), ic: r.kind === "alarm" ? "⏰" : "🔔" }); }
    });
    return out.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
  }

  function open(o) {
    o = o || {};
    var D = window.TMN_DAILY;
    var sel = o.day || D.dayKey(), today = D.dayKey();
    var cur = new Date(sel + "T12:00"); cur.setDate(1);
    var body = document.createElement("div");
    body.className = "cal sc2";
    var m = TMN_MODAL.open({ title: "Calendar", size: "sm", cls: "modal-sheet modal-cal", body: body });

    async function paint() {
      var ym = cur.getFullYear() + "-" + pad(cur.getMonth() + 1);
      var info = {};
      try { info = await D.month(ym); } catch (e) {}
      // Lunes ang simula ng linggo (gaya ng "This week")
      var first = (cur.getDay() + 6) % 7, days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      var names = []; for (var i = 0; i < 7; i++) names.push(new Date(2024, 0, 1 + i).toLocaleDateString(loc(), { weekday: "short" }));
      var cells = "";
      for (var b = 0; b < first; b++) cells += '<span class="cal-e"></span>';
      for (var d = 1; d <= days; d++) {
        var k = ym + "-" + pad(d), x = info[k] || {}, ev = eventsOf(k, D);
        var dots = (ev.some(function (e) { return e.kind === "class"; }) ? '<i class="dot class"></i>' : "") + (ev.some(function (e) { return e.kind === "work"; }) ? '<i class="dot work"></i>' : "") +
          (ev.some(function (e) { return e.kind === "reminder" || e.kind === "alarm"; }) ? '<i class="dot rem"></i>' : "") + (x.notes ? '<i class="dot note"></i>' : "");
        cells += '<button type="button" class="cal-d' + (k === today ? " today" : "") + (k === sel ? " sel" : "") + '" data-day="' + k + '"' + (k === today ? ' aria-current="date"' : "") + ">" +
          '<span class="cal-n" translate="no">' + d + "</span>" + (x.mood ? '<i class="cal-mood">' + x.mood + "</i>" : "") +
          '<span class="cal-dots">' + dots + "</span></button>";
      }
      var head = new Date(sel + "T12:00"), ev = eventsOf(sel, D), notes = [];
      try { notes = await D.list(sel); } catch (e) {}
      var rows = ev.map(function (e) {
        return '<div class="ce ' + e.kind + '"><span class="ce-bar"></span><div class="ce-t"><small translate="no">' + esc(e.time) + "</small><b>" + esc(e.title) + "</b><span>" + esc(e.sub) + '</span></div><span class="ce-ic">' + e.ic + "</span></div>";
      }).concat(notes.slice(0, 4).map(function (n) {
        var done = (n.items || []).filter(function (x) { return x.done; }).length, t = n.kind === "todo" ? (n.text || "To-do") + (n.items && n.items.length ? " · " + done + "/" + n.items.length : "") : n.text;
        return '<div class="ce note"><span class="ce-bar"></span><div class="ce-t"><small>' + (n.kind === "todo" ? "To-do" : "Note") + "</small><b>" + esc(String(t || "").slice(0, 70)) + '</b></div><span class="ce-ic">' + (n.kind === "todo" ? "☑️" : "📝") + "</span></div>";
      })).join("");
      var now = Date.now(), next = (window.TMN_REMIND ? TMN_REMIND.list() : []).filter(function (r) { return !r.done_at && !r.sched && new Date(r.due_at).getTime() > now; })
        .sort(function (a, b) { return new Date(a.due_at) - new Date(b.due_at); })[0];
      var isToday = sel === today;
      body.innerHTML =
        '<div class="sc2-month">' +
          '<div class="cal-head"><button type="button" class="sc2-nav" data-nav="-1" aria-label="Previous month">' + I("chevronL") + "</button>" +
            "<b>" + cur.toLocaleDateString(loc(), { month: "long", year: "numeric" }) + "</b>" +
            '<button type="button" class="sc2-nav" data-nav="1" aria-label="Next month">' + I("chevronR") + "</button></div>" +
          '<div class="cal-grid cal-names">' + names.map(function (n) { return "<span>" + n + "</span>"; }).join("") + "</div>" +
          '<div class="cal-grid">' + cells + "</div>" +
        "</div>" +
        '<div class="sc2-day">' +
          '<div class="sc2-dh"><span class="sc2-dic">' + I("calendar", "ic-sm") + "</span><b>" + (isToday ? "Today's events" : head.toLocaleDateString(loc(), { weekday: "long", month: "short", day: "numeric" })) + "</b>" +
            (window.TMN_REMIND ? '<button type="button" class="sc2-add" data-remind>' + I("plus", "ic-sm") + "Add</button>" : "") + "</div>" +
          (rows || '<p class="sc2-empty">Nothing planned. ' + (isToday ? "Enjoy your day ✨" : "Free day ✨") + "</p>") +
          '<button type="button" class="sc2-open" data-open>' + (isToday ? "Open today in Daily" : "Open this day in Daily") + " " + I("chevronR", "ic-sm") + "</button>" +
        "</div>" +
        (next ? '<div class="sc2-next">' + '<span class="sc2-bell">🔔</span><div><small>Upcoming reminder</small><b>' + esc(next.title) + "</b><span translate=\"no\">" +
          new Date(next.due_at).toLocaleString(loc(), { weekday: "short", hour: "numeric", minute: "2-digit" }) + "</span></div></div>" : "") +
        '<p class="cal-legend"><i class="dot class"></i>Class <i class="dot work"></i>Work <i class="dot rem"></i>Reminder <i class="dot note"></i>Notes</p>';
    }
    body.addEventListener("click", function (e) {
      var n = e.target.closest("[data-nav]"), d = e.target.closest("[data-day]");
      if (n) { cur.setMonth(cur.getMonth() + Number(n.dataset.nav)); paint(); return; }
      if (d) {
        if (d.dataset.day === sel) { m.close(); if (o.onPick) o.onPick(sel); return; }   // pindot ulit = buksan
        sel = d.dataset.day; paint(); return;
      }
      if (e.target.closest("[data-open]")) { m.close(); if (o.onPick) o.onPick(sel); return; }
      if (e.target.closest("[data-remind]")) { var t = new Date(sel + "T09:00"); m.close(); TMN_REMIND.add({ due: t < new Date() ? undefined : t }); }
    });
    paint();
    return m;
  }
  window.TMN_CAL = { open: open };
})();
