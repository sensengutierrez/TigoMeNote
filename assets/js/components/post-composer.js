/* TigoMeNote · components/post-composer.js
   "Gumawa ng post" na modal. Gumagana kahit OFFLINE: sine-save sa device (TMN_POSTQ) at kusang ia-upload pag may internet.
     TMN_COMPOSER.open(items, { onPosted })   items = mga item galing sa TMN_MEDIA (photo/video, max 10)
   Pinipili dito: caption, sino ang makakakita (Public / Followers / Ako lang), at kailan lalabas (Ngayon o I-schedule).
   Kailangan: modal.js, post-queue.js, app-shell.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var MAX = 10, CAP = 1000;
  var VIS = [
    { v: "public", label: "Public", icon: "globe", hint: "Makikita ng lahat sa Explore." },
    { v: "followers", label: "Followers", icon: "users", hint: "Ang mga naka-follow lang sa iyo." },
    { v: "private", label: "Ako lang", icon: "lock", hint: "Ikaw lang ang makakakita (parang backup)." }
  ];

  function pad(n) { return String(n).padStart(2, "0"); }
  function localInput(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function fmtWhen(d) { return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

  function open(items, o) {
    o = o || {};
    var UI = window.TMN_UI;
    items = (items || []).filter(function (it) { return it && it.blob && (it.type === "photo" || it.type === "video"); });
    if (!items.length) { UI.toast("Pumili muna ng photo o video."); return; }
    if (items.length > MAX) { UI.toast("Hanggang " + MAX + " lang bawat post. Kinuha ang unang " + MAX + "."); items = items.slice(0, MAX); }

    var urls = [];
    var state = { vis: "public", when: "now", busy: false };
    var lastVis = null; try { lastVis = localStorage.getItem("tmnPostVis"); } catch (e) {}
    if (lastVis && VIS.some(function (x) { return x.v === lastVis; })) state.vis = lastVis;

    var root = document.createElement("form");
    root.className = "pc";
    root.noValidate = true;
    var later = new Date(Date.now() + 60 * 60 * 1000); later.setMinutes(0, 0, 0);
    root.innerHTML =
      '<div class="pc-strip">' + items.map(function (it, i) {
        var u = URL.createObjectURL(it.thumb || it.blob); urls.push(u);
        return '<div class="pc-thumb" data-i="' + i + '"><img alt="" src="' + u + '">' +
          (it.type === "video" ? '<span class="pc-dur">' + I("play", "ic-sm") + Math.min(15, Math.round(it.duration || 0)) + "s</span>" : "") +
          '<div class="pc-prog hidden"><span></span></div></div>';
      }).join("") + "</div>" +
      (items.some(function (it) { return it.type === "video" && it.duration > 15.5; })
        ? '<p class="pc-warn small">' + I("clock", "ic-sm") + "Ang video na lampas 15 segundo ay puputulin sa unang 15 s.</p>" : "") +
      '<label class="field"><span class="pe-label">Caption</span>' +
        '<textarea class="input pc-cap" maxlength="' + CAP + '" rows="3" placeholder="Anong kwento nito?"></textarea>' +
        '<span class="pc-count faint small">0 / ' + CAP + "</span></label>" +
      '<div class="field"><span class="pe-label">Sino ang makakakita</span>' +
        '<div class="segmented pc-vis" role="group" aria-label="Visibility">' + VIS.map(function (x) {
          return '<button type="button" data-vis="' + x.v + '" aria-pressed="' + (x.v === state.vis) + '">' + I(x.icon, "ic-sm") + x.label + "</button>";
        }).join("") + '</div><span class="pc-vis-hint faint small"></span></div>' +
      '<div class="field"><span class="pe-label">Kailan ipo-post</span>' +
        '<div class="segmented pc-when" role="group" aria-label="When">' +
          '<button type="button" data-when="now" aria-pressed="true">' + I("send", "ic-sm") + "Ngayon</button>" +
          '<button type="button" data-when="later" aria-pressed="false">' + I("calendar", "ic-sm") + "I-schedule</button></div>" +
        '<input class="input pc-date hidden" type="datetime-local" value="' + localInput(later) + '" min="' + localInput(new Date()) + '">' +
        '<span class="pc-when-hint faint small"></span></div>' +
      '<div class="pc-net small"></div>' +
      '<p class="pc-status small hidden" aria-live="polite"></p>';

    var cap = root.querySelector(".pc-cap"), count = root.querySelector(".pc-count");
    var date = root.querySelector(".pc-date"), whenHint = root.querySelector(".pc-when-hint");
    var visHint = root.querySelector(".pc-vis-hint"), net = root.querySelector(".pc-net"), status = root.querySelector(".pc-status");

    function paintVis() {
      root.querySelectorAll("[data-vis]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.vis === state.vis)); });
      visHint.textContent = VIS.filter(function (x) { return x.v === state.vis; })[0].hint;
    }
    function paintWhen() {
      root.querySelectorAll("[data-when]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.when === state.when)); });
      date.classList.toggle("hidden", state.when !== "later");
      if (state.when === "now") whenHint.textContent = navigator.onLine ? "Ia-upload agad." : "Lalabas pagka-upload (pag may internet na).";
      else {
        var d = new Date(date.value);
        whenHint.textContent = isNaN(d) ? "Pumili ng petsa at oras." : "Lalabas sa " + fmtWhen(d) + ". Kahit offline ka sa oras na iyon, basta na-upload na bago noon.";
      }
    }
    function paintNet() {
      net.className = "pc-net small " + (navigator.onLine ? "on" : "off");
      net.innerHTML = navigator.onLine
        ? I("cloud", "ic-sm") + "Online · ia-upload agad pagka-save."
        : I("cloud", "ic-sm") + "Offline ka · mase-save muna sa device at kusang ia-upload pag may internet na.";
      paintWhen();
    }
    paintVis(); paintNet();
    window.addEventListener("online", paintNet); window.addEventListener("offline", paintNet);

    cap.addEventListener("input", function () { count.textContent = cap.value.length + " / " + CAP; });
    root.querySelector(".pc-vis").addEventListener("click", function (e) { var b = e.target.closest("[data-vis]"); if (b && !state.busy) { state.vis = b.dataset.vis; paintVis(); } });
    root.querySelector(".pc-when").addEventListener("click", function (e) {
      var b = e.target.closest("[data-when]"); if (!b || state.busy) return;
      state.when = b.dataset.when; paintWhen();
      if (state.when === "later") date.focus();
    });
    date.addEventListener("input", paintWhen);
    root.addEventListener("submit", function (e) { e.preventDefault(); submit(); });

    async function submit() {
      if (state.busy) return;
      var publishAt = null;
      if (state.when === "later") {
        var d = new Date(date.value);
        if (isNaN(d)) { UI.toast("Pumili ng petsa at oras."); date.focus(); return; }
        if (d.getTime() < Date.now() + 60 * 1000) { UI.toast("Dapat sa hinaharap ang schedule."); date.focus(); return; }
        if (d.getTime() > Date.now() + 365 * 86400000) { UI.toast("Hanggang 1 taon lang ang schedule."); return; }
        publishAt = d.toISOString();
      }
      state.busy = true;
      var btn = m.el.querySelector(".pc-submit"); btn.disabled = true;
      m.el.querySelectorAll("textarea, input, .segmented button").forEach(function (x) { x.disabled = true; });
      status.classList.remove("hidden");
      try {
        var files = await window.TMN_POSTQ.prepare(items, function (i, n, pct, it) {
          var th = root.querySelector('.pc-thumb[data-i="' + i + '"] .pc-prog');
          th.classList.remove("hidden"); th.firstChild.style.width = Math.round(pct * 100) + "%";
          status.textContent = (it.type === "video" ? "Kino-compress ang video " : "Inaayos ang photo ") + (i + 1) + " / " + n + "…" + (it.type === "video" ? " (huwag isara)" : "");
        });
        await window.TMN_POSTQ.enqueue({ files: files, caption: cap.value.trim(), visibility: state.vis, publishAt: publishAt });
        try { localStorage.setItem("tmnPostVis", state.vis); } catch (e) {}
        done = true; m.close(true);
        if (o.onPosted) o.onPosted();
        UI.toast(navigator.onLine ? "Naka-pila na · ina-upload…" : "Naka-save sa device · ia-upload pag may internet.");
      } catch (err) {
        state.busy = false; btn.disabled = false;
        m.el.querySelectorAll("textarea, input, .segmented button").forEach(function (x) { x.disabled = false; });
        status.textContent = err.message || "Hindi ma-save ang post.";
        status.classList.add("err");
      }
    }

    var done = false;
    var m = window.TMN_MODAL.open({
      title: "Bagong post", size: "md", cls: "modal-composer", body: root,
      closeOnBackdrop: false,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { if (!state.busy) m.close(); } },
        { label: I("send", "ic-sm") + "Post", cls: "btn-primary pc-submit", onClick: submit }
      ],
      onClose: function () {
        window.removeEventListener("online", paintNet); window.removeEventListener("offline", paintNet);
        urls.forEach(function (u) { URL.revokeObjectURL(u); });
      }
    });
    return m;
  }

  window.TMN_COMPOSER = { open: open };
})();
