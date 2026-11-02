/* TigoMeNote · components/upload-queue.js — "Uploading" (dating "Waiting on this device" sa Profile; nasa Gallery na)
     TMN_UPLOAD_Q.mount(el)  → card na lumalabas lang kapag may ina-upload, naghihintay, o kaka-post (24 oras; ✕ = alisin)
   Kailangan: post-queue.js (TMN_POSTQ), modal.js. Kusang nag-a-update (event "tmn:queue", online/offline). */
(function () {
  var VIS = { public: ["globe", "Public"], followers: ["users", "Followers"], private: ["lock", "Only me"] };
  function short(t) { try { return new Date(t).toLocaleString(window.TMN_I18N ? TMN_I18N.locale : undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function mount(el) {
    var UI = window.TMN_UI, I = window.TMN_ICON, Q = window.TMN_POSTQ;
    if (!el || !Q) return;
    var urls = [];
    el.classList.add("card", "uq", "hidden");
    el.innerHTML = '<div class="q-head"><h3>' + I("upload", "ic-sm") + ' Uploading</h3><span class="faint small uq-net"></span></div><div class="queue"></div>';
    var box = el.querySelector(".queue");
    async function render() {
      var list = (await Q.list()).sort(function (a, b) { return b.createdAt - a.createdAt; });
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      el.classList.toggle("hidden", !list.length);
      el.querySelector(".uq-net").textContent = navigator.onLine ? "Online" : "Offline · uploads when online";
      box.innerHTML = list.map(function (e) {
        var thumb = e.cover ? (function () { var u = URL.createObjectURL(e.cover); urls.push(u); return '<img alt="" src="' + u + '">'; })() : I("image");
        var n = e.files.length, kinds = n + (n > 1 ? " photos" : " photo");
        var v = VIS[e.visibility] || VIS.public;
        var st = e.status === "uploading" ? '<span class="q-state uploading">' + I("refresh", "ic-sm spin") + "Uploading " + e.progress.done + "/" + e.progress.total + "</span>"
          : e.status === "done" ? '<span class="q-state done">' + I("check", "ic-sm") + (e.publishAt && new Date(e.publishAt) > new Date() ? "Uploaded · scheduled" : "Posted") + "</span>"
          : e.status === "error" ? '<span class="q-state">' + I("info", "ic-sm") + "Not uploaded yet</span>"
          : e.status === "blocked" ? '<span class="q-state err">' + I("flag", "ic-sm") + "Blocked</span>"
          : '<span class="q-state">' + I("clock", "ic-sm") + (navigator.onLine ? "Waiting" : "Waiting for internet") + "</span>";
        var sub = st + "<span>" + kinds + "</span><span>" + I(v[0], "ic-sm") + v[1] + "</span>" + (e.publishAt ? "<span>" + I("calendar", "ic-sm") + short(e.publishAt) + "</span>" : "");
        var acts = e.status === "done" ? '<button class="icon-btn" type="button" data-q="clear" data-id="' + e.id + '" aria-label="Remove">' + I("x") + "</button>"
          : (e.status === "error" ? '<button class="btn btn-ghost btn-sm" type="button" data-q="retry" data-id="' + e.id + '">' + I("refresh", "ic-sm") + "Retry</button>" : "") +
            (e.status !== "uploading" ? '<button class="icon-btn" type="button" data-q="cancel" data-id="' + e.id + '" aria-label="Cancel">' + I("trash") + "</button>" : "");
        return '<div class="q-item"><div class="q-thumb">' + thumb + '</div><div class="q-main">' +
          '<div class="q-title">' + (UI.esc(e.caption) || '<span class="faint">No caption</span>') + "</div>" +
          '<div class="q-sub">' + sub + "</div>" +
          ((e.status === "error" || e.status === "blocked") && e.error ? '<div class="q-sub err">' + UI.esc(e.error) + "</div>" : "") +
          (e.status === "uploading" ? '<div class="q-bar"><span style="width:' + Math.round(100 * e.progress.done / Math.max(1, e.progress.total)) + '%"></span></div>' : "") +
          '</div><div class="q-acts">' + acts + "</div></div>";
      }).join("");
    }
    box.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-q]"); if (!b) return;
      var id = b.dataset.id;
      if (b.dataset.q === "retry") Q.retry(id);
      if (b.dataset.q === "clear") Q.cancel(id);
      if (b.dataset.q === "cancel" && await TMN_MODAL.confirm("Remove this post from the queue? It won't be uploaded. (The photos stay on your phone.)", { okText: "Remove", danger: true })) Q.cancel(id);
    });
    document.addEventListener("tmn:queue", render);
    window.addEventListener("online", render); window.addEventListener("offline", render);
    render();
    return { render: render };
  }
  window.TMN_UPLOAD_Q = { mount: mount };
  // kusa: <section data-upload-queue></section>
  function auto() { document.querySelectorAll("[data-upload-queue]").forEach(function (el) { if (!el._uq) { el._uq = 1; mount(el); } }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
