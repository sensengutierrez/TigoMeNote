/* TigoMeNote · components/phone-picker.js — pumili ng MARAMING litrato mula sa phone (APK), para sa Post
     TMN_PHONE_PICK.ok()                     → true sa APK (may native gallery)
     TMN_PHONE_PICK.open({ max: 10 })        → Promise<items | null>  (items para sa TMN_COMPOSER.open)
   Ang file picker ng Android ay madalas isa-isa lang ang napipili, kaya sariling picker ito: folder sa itaas,
   pindot = pili (may numero ng pagkakasunod), "Next" = tuloy sa post. Photos lang (walang video sa server).
   Native: TmnNative.galleryBuckets / galleryItems({ photosOnly }) / galleryThumb / galleryFile. Kailangan: modal.js */
(function () {
  var Cap = window.Capacitor;
  function nat() {
    if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return null;
    var N = Cap.Plugins && Cap.Plugins.TmnNative;
    return N && N.galleryItems ? N : null;
  }
  function src(p) { return Cap.convertFileSrc ? Cap.convertFileSrc(p) : "file://" + p; }
  async function blobOf(path, mime) { var r = await fetch(src(path)); var b = await r.blob(); return mime && b.type !== mime ? new Blob([b], { type: mime }) : b; }

  function open(o) {
    o = o || {};
    var N = nat(), UI = window.TMN_UI, I = window.TMN_ICON, MAX = o.max || 10;
    if (!N) return Promise.resolve(null);
    return new Promise(async function (done) {
      var ok = false;
      try { ok = (await N.galleryAccess()).granted || (await N.galleryRequest()).granted; } catch (e) {}
      if (!ok) { UI.toast("Allow Photos access to choose from your phone.", 3500); done(null); return; }
      var st = { bucket: "all", items: [], sel: [], doneLoading: false, loading: false, finished: false };
      var body = document.createElement("div"); body.className = "pp";
      body.innerHTML =
        '<div class="pp-top"><select class="input pp-folder" aria-label="Folder"><option value="all">All photos</option></select>' +
          '<span class="faint small pp-count">0 / ' + MAX + "</span></div>" +
        '<div class="pp-grid" role="listbox" aria-multiselectable="true"></div>' +
        '<div class="pp-bar"><button type="button" class="btn btn-ghost btn-sm pp-clear" disabled>Clear</button>' +
          '<button type="button" class="btn btn-primary pp-next" disabled>' + I("send", "ic-sm") + "Next</button></div>";
      var m = TMN_MODAL.open({ title: "Choose photos", size: "lg", cls: "modal-sheet pp-modal", body: body,
        onClose: function () { if (!st.finished) done(null); } });
      var grid = body.querySelector(".pp-grid"), sel = body.querySelector(".pp-folder");
      try {
        var r = await N.galleryBuckets();
        sel.innerHTML = '<option value="all">All photos</option>' + (r.buckets || []).map(function (b) { return '<option value="' + UI.esc(b.id) + '">' + UI.esc(b.name) + " (" + b.count + ")</option>"; }).join("");
      } catch (e) {}
      // thumbnails: 3 sabay lang
      var q = [], busy = 0;
      var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); q.push(e.target); pump(); } }); }, { root: grid, rootMargin: "200px" }) : null;
      function pump() {
        while (busy < 3 && q.length) {
          var im = q.shift(); busy++;
          N.galleryThumb({ id: Number(im.dataset.id), type: "photo", size: 256 }).then(function (x) { this.src = src(x.path); }.bind(im), function () {}).then(function () { busy--; pump(); });
        }
      }
      function paintSel() {
        grid.querySelectorAll(".pp-t").forEach(function (t) {
          var i = st.sel.findIndex(function (x) { return x.id === Number(t.dataset.id); });
          t.classList.toggle("on", i >= 0); t.setAttribute("aria-selected", String(i >= 0));
          t.querySelector(".pp-n").textContent = i >= 0 ? i + 1 : "";
        });
        body.querySelector(".pp-count").textContent = st.sel.length + " / " + MAX;
        body.querySelector(".pp-next").disabled = !st.sel.length; body.querySelector(".pp-clear").disabled = !st.sel.length;
      }
      async function more() {
        if (st.loading || st.doneLoading) return; st.loading = true;
        try {
          var r = await N.galleryItems({ bucket: st.bucket, offset: st.items.length, limit: 90, photosOnly: true });
          var got = (r.items || []).filter(function (x) { return x.type !== "video"; });
          if ((r.items || []).length < 90) st.doneLoading = true;
          st.items = st.items.concat(got);
          got.forEach(function (it) {
            var b = document.createElement("button"); b.type = "button"; b.className = "pp-t"; b.dataset.id = it.id; b.setAttribute("role", "option");
            b.innerHTML = '<img alt="" data-id="' + it.id + '"><span class="pp-n"></span>';
            grid.appendChild(b);
            var im = b.querySelector("img"); if (io) io.observe(im); else { q.push(im); pump(); }
          });
          if (!st.items.length) grid.innerHTML = '<p class="faint small pp-empty">No photos here.</p>';
        } catch (e) { st.doneLoading = true; UI.toast("Couldn’t read the phone gallery."); }
        st.loading = false; paintSel();
      }
      grid.addEventListener("scroll", function () { if (grid.scrollTop + grid.clientHeight > grid.scrollHeight - 400) more(); });
      grid.addEventListener("click", function (e) {
        var t = e.target.closest(".pp-t"); if (!t) return;
        var id = Number(t.dataset.id), i = st.sel.findIndex(function (x) { return x.id === id; });
        if (i >= 0) st.sel.splice(i, 1);
        else if (st.sel.length >= MAX) { UI.toast("Up to " + MAX + " photos per post."); return; }
        else st.sel.push(st.items.filter(function (x) { return x.id === id; })[0]);
        paintSel();
      });
      sel.addEventListener("change", function () { st.bucket = sel.value; st.items = []; st.doneLoading = false; grid.innerHTML = ""; grid.scrollTop = 0; more(); });
      body.querySelector(".pp-clear").addEventListener("click", function () { st.sel = []; paintSel(); });
      body.querySelector(".pp-next").addEventListener("click", async function () {
        var btn = this; btn.disabled = true; btn.textContent = "Getting photos…";
        var out = [];
        for (var k = 0; k < st.sel.length; k++) {
          var it = st.sel[k];
          try {
            var f = await N.galleryFile({ id: it.id, type: "photo", name: it.name || ("photo_" + it.id) });
            var blob = await blobOf(f.path, it.mime);
            var th = null; try { var t = await N.galleryThumb({ id: it.id, type: "photo", size: 480 }); th = await blobOf(t.path, "image/jpeg"); } catch (e) {}
            out.push({ id: "ph" + it.id, type: "photo", blob: blob, thumb: th, name: it.name, w: it.w, h: it.h, createdAt: it.date });
          } catch (e) {}
        }
        st.finished = true; m.close();
        if (!out.length) UI.toast("Couldn’t read the selected photos.");
        done(out.length ? out : null);
      });
      more();
    });
  }
  window.TMN_PHONE_PICK = { ok: function () { return !!nat(); }, open: open };
})();
