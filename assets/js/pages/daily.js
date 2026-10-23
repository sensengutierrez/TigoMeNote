/* TigoMeNote · pages/daily.js (app/home.html) */
(function () {
  var UI = window.TMN_UI;
  var now = new Date();

  document.getElementById("today").textContent =
    now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  function paintUser() {
    var u = window.TMN_USER || {};
    var h = now.getHours();
    var part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    var first = String(u.display_name || "").split(" ")[0];
    document.getElementById("greet").textContent = part + (first ? ", " + first : "") + ".";
    document.getElementById("meAvatar").textContent = UI.initials(u.display_name);
  }
  paintUser();
  document.addEventListener("tmn:user", paintUser);

  // Linggo ngayon (Lunes hanggang Linggo)
  var start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  var html = "";
  for (var i = 0; i < 7; i++) {
    var d = new Date(start); d.setDate(start.getDate() + i);
    var isToday = d.toDateString() === now.toDateString();
    html += '<div class="day' + (isToday ? " today" : "") + '"' + (isToday ? ' aria-current="date"' : "") + ">" +
      '<span class="d-name">' + d.toLocaleDateString(undefined, { weekday: "short" }) + "</span>" +
      '<span class="d-num">' + d.getDate() + "</span><span class=\"d-dot\"></span></div>";
  }
  document.getElementById("week").innerHTML = html;
})();
