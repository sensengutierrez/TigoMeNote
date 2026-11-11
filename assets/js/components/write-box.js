/* TigoMeNote · components/write-box.js — "What's on your mind?" (parang Facebook): mabilis na pagsulat ng post, may photo o wala
     Kusang naka-mount sa <section id="writeBox"> (Explore at Profile).   TMN_WRITE.mount(el, { onPosted })
     Pindutin ang kahon → post-composer.js (text mode: puwedeng TEXT lang) · 🖼 Photo → pumili ng litrato muna, tapos composer
   Kailangan: post-composer.js, post-queue.js, modal.js; (opsyonal) media-store.js / phone-pick para sa photos */
(function () {
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }
  function pickFiles() {
    return new Promise(function (res) {
      var i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = true; i.style.display = "none";
      document.body.appendChild(i);
      i.addEventListener("change", function () { var f = [].slice.call(i.files || []); i.remove(); res(f); });
      i.click();
    });
  }
  function mount(el, o) {
    o = o || {};
    function paint() {
      var u = window.TMN_USER || {}, nm = u.display_name || u.username || "";
      el.innerHTML =
        '<span class="avatar wb-av" style="--size:40px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc((nm || "?").slice(0, 1).toUpperCase())) + "</span>" +
        '<button type="button" class="wb-input" data-w="text">What\'s on your mind?</button>' +
        '<button type="button" class="icon-btn wb-photo" data-w="photo" aria-label="Add photos" title="Photo">' + I("image") + "</button>";
    }
    var posted = function () { if (o.onPosted) o.onPosted(); };   // ang composer na ang nagto-toast ("Queued · uploading…"); kusang nagre-refresh ang page pag "Posted ✓"
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-w]"); if (!b || !window.TMN_COMPOSER) return;
      if (b.dataset.w === "text") { TMN_COMPOSER.open([], { text: true, onPosted: posted }); return; }
      try {
        var items = null;
        if (window.TMN_PHONE_PICK && TMN_PHONE_PICK.ok()) items = await TMN_PHONE_PICK.open({ max: 10 });
        else if (window.TMN_MEDIA) { var files = await pickFiles(); if (files.length) items = await TMN_MEDIA.addFiles(files.slice(0, 10), null); }
        else { location.href = "share.html"; return; }
        if (items && items.length) TMN_COMPOSER.open(items, { text: true, onPosted: posted });
      } catch (er) { if (window.TMN_UI) TMN_UI.toast(er.message || "Couldn't add the photos."); }
    });
    paint();
    document.addEventListener("tmn:user", paint);
  }
  window.TMN_WRITE = { mount: mount };
  var auto = document.getElementById("writeBox"); if (auto) mount(auto);
})();
