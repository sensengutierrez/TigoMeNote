/* TigoMeNote · components/create-menu.js — "Create": Status, Post, o Explore (route + photos, parang Komoot)
     TMN_CREATE.open({ onPosted })
   Status → stories.js (24 oras) · Post → pili ng photo/video → post-composer.js · Explore → activity-composer.js */
(function () {
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  var OPTS = [
    { id: "story", icon: "clock", title: "Status", sub: "Photo or video for 24 hours" },
    { id: "post", icon: "image", title: "Post", sub: "Photos and videos on your profile and Explore" },
    { id: "explore", icon: "map", title: "Explore", sub: "Your route on a map, with photos and stats (hike, walk, ride…)" }
  ];
  function pickFiles() {
    return new Promise(function (res) {
      var i = document.createElement("input"); i.type = "file"; i.accept = "image/*,video/*"; i.multiple = true; i.style.display = "none";
      document.body.appendChild(i);
      i.addEventListener("change", function () { var f = [].slice.call(i.files || []); i.remove(); res(f); });
      i.click();
    });
  }
  function open(o) {
    o = o || {};
    var body = document.createElement("div");
    body.className = "cm act-src";
    body.innerHTML = OPTS.filter(function (x) { return x.id !== "story" || window.TMN_STORIES; }).map(function (x) {
      return '<button type="button" class="act-opt" data-c="' + x.id + '"><span class="act-ic">' + I(x.icon) + '</span><span><b>' + x.title + '</b><span class="faint small">' + x.sub + "</span></span></button>";
    }).join("");
    var m = TMN_MODAL.open({ title: "Create", size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-c]"); if (!b) return;
      var c = b.dataset.c;
      m.close();
      if (c === "story") return TMN_STORIES.add();
      if (c === "explore") return TMN_ACTIVITY.open({ onPosted: o.onPosted });
      if (!window.TMN_MEDIA || !window.TMN_COMPOSER) { location.href = "share.html"; return; }
      var files = await pickFiles(); if (!files.length) return;
      try { var items = await TMN_MEDIA.addFiles(files.slice(0, 10), null); TMN_COMPOSER.open(items, { onPosted: o.onPosted }); }
      catch (er) { TMN_UI.toast(er.message); }
    });
    return m;
  }
  window.TMN_CREATE = { open: open };
})();
