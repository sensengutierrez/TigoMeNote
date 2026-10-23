/* TigoMeNote · pages/explore.js (app/explore.html)
   Placeholder grid muna habang wala pang Share. */
(function () {
  var html = "";
  for (var i = 0; i < 12; i++) html += '<div class="skel' + (i === 1 || i === 7 ? " tall" : "") + '"></div>';
  document.getElementById("grid").innerHTML = html;

  document.querySelectorAll(".chip").forEach(function (c) {
    c.addEventListener("click", function () {
      document.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
      c.classList.add("active"); c.setAttribute("aria-selected", "true");
    });
  });
})();
