/* TigoMeNote · pages/profile.js (app/profile.html) */
(function () {
  var UI = window.TMN_UI;
  function paint() {
    var u = window.TMN_USER || {};
    var av = document.getElementById("pAvatar");
    if (u.avatar_url) av.innerHTML = '<img alt="" src="' + UI.esc(u.avatar_url) + '">';
    else av.textContent = UI.initials(u.display_name);
    document.getElementById("pName").textContent = u.display_name || "";
    document.getElementById("pUser").textContent = u.username ? "@" + u.username : "";
    document.getElementById("pBio").textContent = u.bio || "";
    document.getElementById("pRole").textContent = u.role || "";
    document.getElementById("pJoined").textContent = u.created_at
      ? "Joined " + new Date(u.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : "";
  }
  paint();
  document.addEventListener("tmn:user", paint);

  document.querySelectorAll(".posts .chip").forEach(function (c) {
    c.addEventListener("click", function () {
      document.querySelectorAll(".posts .chip").forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
      c.classList.add("active"); c.setAttribute("aria-selected", "true");
    });
  });
})();
