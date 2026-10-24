/* TigoMeNote · pages/daily.js (app/home.html) — Daily: notes, to-do, mood, reminders/alarms, calendar
   Mga bahagi: daily-notes.js (sulat + listahan), reminders.js, mini-calendar.js, home-clock.js, weather.js.
   Pinipili ang araw sa "This week" o sa Calendar; ang notes ay nasa device lang (daily-store.js). */
(function () {
  var UI = window.TMN_UI, D = window.TMN_DAILY;
  var now = new Date();
  var loc = window.TMN_I18N ? TMN_I18N.locale : undefined;
  var $ = function (id) { return document.getElementById(id); };
  var day = D.dayKey();

  // Bati ayon sa oras: umaga (bago 12), hapon (12–6 PM), gabi (6 PM pataas)
  function partOfDay(h) { return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
  function paintUser() {
    var u = window.TMN_USER || {};
    var first = String(u.display_name || "").split(" ")[0];
    $("greet").textContent = partOfDay(now.getHours()) + (first ? ", " + first : "") + ".";
  }

  // ---------- notes ----------
  var notes = window.TMN_DAILY_UI.mount({
    composer: $("dnComposer"), list: $("dnList"), mood: $("dnMood"),
    onCount: function (n) { if (day === D.dayKey()) $("tNotes").textContent = n; }
  });

  // Linggo ng napiling araw (Lunes hanggang Linggo); tap = buksan ang araw na iyon
  async function paintDays() {
    var sel = new Date(day + "T12:00"), isToday = day === D.dayKey();
    $("today").textContent = sel.toLocaleDateString(loc, { weekday: "long", month: "long", day: "numeric" });
    $("weekTitle").textContent = isToday ? "This week" : sel.toLocaleDateString(loc, { month: "long", year: "numeric" });
    $("moodTitle").textContent = isToday ? "How's your day?" : "Mood on " + sel.toLocaleDateString(loc, { month: "short", day: "numeric" });
    var start = new Date(sel); start.setDate(sel.getDate() - ((sel.getDay() + 6) % 7));
    var info = {};
    try {
      info = await D.month(D.dayKey(start).slice(0, 7));
      var end = new Date(start); end.setDate(start.getDate() + 6);
      if (D.dayKey(end).slice(0, 7) !== D.dayKey(start).slice(0, 7)) Object.assign(info, await D.month(D.dayKey(end).slice(0, 7)));
    } catch (e) {}
    var html = "";
    for (var i = 0; i < 7; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var k = D.dayKey(d), x = info[k] || {};
      html += '<button type="button" class="day' + (k === D.dayKey() ? " today" : "") + (k === day ? " sel" : "") + '" data-day="' + k + '"' + (k === D.dayKey() ? ' aria-current="date"' : "") + ">" +
        '<span class="d-name">' + d.toLocaleDateString(loc, { weekday: "short" }) + "</span>" +
        '<span class="d-num">' + d.getDate() + '</span><span class="d-dot' + (x.notes || x.mood ? " on" : "") + '">' + (x.mood || "") + "</span></button>";
    }
    $("week").innerHTML = html;
  }
  function setDay(k) { day = k; notes.setDay(k); paintDays(); otd(); }
  $("week").addEventListener("click", function (e) { var b = e.target.closest("[data-day]"); if (b) setDay(b.dataset.day); });
  $("calBtn").addEventListener("click", function () { window.TMN_CAL.open({ day: day, onPick: setDay }); });
  document.addEventListener("tmn:daily", paintDays);

  // ---------- On this day: notes sa parehong petsa noong nakaraan ----------
  async function otd() {
    var box = $("dnOtd"), l = [];
    try { l = await D.onThisDay(day); } catch (e) {}
    box.classList.toggle("hidden", !l.length);
    if (!l.length) return;
    box.innerHTML = '<h3 class="side-title">✨ On this day</h3><div class="otd-list">' + l.map(function (n) {
      var d = new Date(n.day + "T12:00");
      var txt = n.kind === "todo" ? n.items.map(function (x) { return (x.done ? "✓ " : "• ") + x.t; }).join("  ") : n.text;
      return '<button type="button" class="otd" data-day="' + n.day + '"><span class="faint small">' + d.toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" }) +
        "</span><span>" + UI.esc((txt || (n.photos && n.photos.length ? "📷 Photo" : "")).slice(0, 140)) + "</span></button>";
    }).join("") + "</div>";
  }
  $("dnOtd").addEventListener("click", function (e) { var b = e.target.closest("[data-day]"); if (b) setDay(b.dataset.day); });

  // ---------- reminders, orasan ----------
  if (window.TMN_REMIND) TMN_REMIND.mount($("remind"));
  if (window.TMN_HOMECLOCK) TMN_HOMECLOCK.mount($("homeClock"));

  paintUser(); paintDays(); otd();
  document.addEventListener("tmn:user", paintUser);

  // Kusang nagbabago kahit bukas lang ang page: bawat minuto, at pagbalik sa app
  function tick() {
    var prev = now; now = new Date();
    if (partOfDay(prev.getHours()) !== partOfDay(now.getHours())) paintUser();
    if (prev.toDateString() !== now.toDateString() && day === D.dayKey(prev)) setDay(D.dayKey(now));
  }
  setInterval(tick, 60000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") tick(); });

  // Weather: sa phone nasa taas ng feed, sa desktop nasa side panel
  var wx = $("weather");
  var stack = document.querySelector(".layout > .stack");
  var aside = document.querySelector(".layout-aside");
  var mq = window.matchMedia("(min-width: 900px)");
  function placeWeather() { if (mq.matches) aside.insertBefore(wx, aside.firstChild); else stack.insertBefore(wx, stack.firstChild); }
  placeWeather();
  mq.addEventListener("change", placeWeather);
  if (window.TMN_WEATHER) window.TMN_WEATHER.mount(wx);

  // Bilang ng photos/videos ngayong araw (galing sa Gallery sa device)
  async function counts() {
    try {
      var c = await window.TMN_MEDIA.todayCounts();
      $("tPhotos").textContent = c.photos;
      $("tVideos").textContent = c.videos;
    } catch (e) {}
  }
  if (window.TMN_MEDIA) { counts(); document.addEventListener("tmn:media", counts); }
})();
