/* TigoMeNote · pages/daily.js (app/home.html) */
(function () {
  var UI = window.TMN_UI;
  var now = new Date();
  var loc = window.TMN_I18N ? TMN_I18N.locale : undefined;

  // Bati ayon sa oras: umaga (bago 12), hapon (12–6 PM), gabi (6 PM pataas)
  function partOfDay(h) { return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
  function paintUser() {
    var u = window.TMN_USER || {};
    var first = String(u.display_name || "").split(" ")[0];
    document.getElementById("greet").textContent = partOfDay(now.getHours()) + (first ? ", " + first : "") + ".";
    document.getElementById("meAvatar").textContent = UI.initials(u.display_name);
  }

  // Linggo ngayon (Lunes hanggang Linggo)
  function paintDays() {
    document.getElementById("today").textContent = now.toLocaleDateString(loc, { weekday: "long", month: "long", day: "numeric" });
    var start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    var html = "";
    for (var i = 0; i < 7; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var isToday = d.toDateString() === now.toDateString();
      html += '<div class="day' + (isToday ? " today" : "") + '"' + (isToday ? ' aria-current="date"' : "") + ">" +
        '<span class="d-name">' + d.toLocaleDateString(loc, { weekday: "short" }) + "</span>" +
        '<span class="d-num">' + d.getDate() + "</span><span class=\"d-dot\"></span></div>";
    }
    document.getElementById("week").innerHTML = html;
  }
  paintUser();
  paintDays();
  document.addEventListener("tmn:user", paintUser);

  // Kusang nagbabago kahit bukas lang ang page: bawat minuto, at pagbalik sa app
  function tick() {
    var prev = now; now = new Date();
    if (partOfDay(prev.getHours()) !== partOfDay(now.getHours())) paintUser();
    if (prev.toDateString() !== now.toDateString()) paintDays();
  }
  setInterval(tick, 60000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") tick(); });

  // Weather: sa phone nasa taas ng feed, sa desktop nasa side panel
  var wx = document.getElementById("weather");
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
      document.getElementById("tPhotos").textContent = c.photos;
      document.getElementById("tVideos").textContent = c.videos;
    } catch (e) {}
  }
  if (window.TMN_MEDIA) { counts(); document.addEventListener("tmn:media", counts); }
})();
