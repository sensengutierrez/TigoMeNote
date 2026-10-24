/* TigoMeNote · components/post-composer.js
   "Gumawa ng post" na modal. Gumagana kahit OFFLINE: sine-save sa device (TMN_POSTQ) at kusang ia-upload pag may internet.
     TMN_COMPOSER.open(items, { onPosted, activity })   items = mga item galing sa TMN_MEDIA (photo/video, max 10)
       activity = Explore post (activity-composer.js): { type, title, route, stats } → puwedeng walang photo
   Pinipili dito: caption, sound (sound-picker.js; auto-pick kung wala pa), sino ang makakakita (Public / Followers / Ako lang),
   at kailan lalabas (Ngayon o I-schedule).
   Kailangan: modal.js, post-queue.js, app-shell.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  var MAX = 10, CAP = 1000;
  var VIS = [
    { v: "public", label: "Public", icon: "globe", hint: "Everyone can see it in Explore." },
    { v: "followers", label: "Followers", icon: "users", hint: "Only people who follow you." },
    { v: "private", label: "Only me", icon: "lock", hint: "Only you can see it (like a backup)." }
  ];

  function pad(n) { return String(n).padStart(2, "0"); }
  function localInput(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function fmtWhen(d) { return d.toLocaleString(window.TMN_I18N ? TMN_I18N.locale : undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

  function open(items, o) {
    o = o || {};
    var UI = window.TMN_UI;
    items = (items || []).filter(function (it) { return it && it.blob && (it.type === "photo" || it.type === "video"); });
    var act = o.activity && window.TMN_ROUTE ? o.activity : null;
    if (!items.length && !act) { UI.toast("Choose a photo or video first."); return; }
    if (items.length > MAX) { UI.toast("Up to " + MAX + " per post. The first " + MAX + " were used."); items = items.slice(0, MAX); }

    var urls = [];
    var state = { vis: "public", when: "now", busy: false };
    var lastVis = null; try { lastVis = localStorage.getItem("tmnPostVis"); } catch (e) {}
    if (lastVis && VIS.some(function (x) { return x.v === lastVis; })) state.vis = lastVis;

    var root = document.createElement("form");
    root.className = "pc";
    root.noValidate = true;
    var later = new Date(Date.now() + 60 * 60 * 1000); later.setMinutes(0, 0, 0);
    root.innerHTML =
      (act ? '<div class="pc-actbox"><div class="pc-actmap">' + TMN_ROUTE.svg(act.route, 240, 160, { attr: false }) + '</div><div><b>' + UI.esc(act.title) + '</b><div class="faint small">' +
        TMN_ROUTE.type(act.type).label + " · " + TMN_ROUTE.fmt.dist(act.stats.dist_m) + (act.stats.dur_s ? " · " + TMN_ROUTE.fmt.time(act.stats.dur_s) : "") + "</div></div></div>" : "") +
      (items.length ? '<div class="pc-strip">' + items.map(function (it, i) {
        var u = URL.createObjectURL(it.thumb || it.blob); urls.push(u);
        return '<div class="pc-thumb" data-i="' + i + '"><img alt="" src="' + u + '">' +
          (it.type === "video" ? '<span class="pc-dur">' + I("play", "ic-sm") + Math.min(15, Math.round(it.duration || 0)) + "s</span>" : "") +
          '<div class="pc-prog hidden"><span></span></div></div>';
      }).join("") + "</div>" : "") +
      (items.some(function (it) { return it.type === "video" && it.duration > 15.5; })
        ? '<p class="pc-warn small">' + I("clock", "ic-sm") + "Videos longer than 15 seconds will be cut to the first 15 s.</p>" : "") +
      (window.TMN_SOUND_PICK && items.length ? '<div class="field"><span class="pe-label">Sound</span><div class="pc-soundpick"></div></div>' : "") +
      '<label class="field"><span class="pe-label">Caption</span>' +
        '<textarea class="input pc-cap" maxlength="' + CAP + '" rows="3" placeholder="' + (act ? "How was it?" : "What\'s the story?") + '" data-autogrow="220"></textarea>' +
        '<span class="pc-count faint small">' + (window.TMN_EMOJI_PICK ? '<button type="button" class="icon-btn pc-emo" aria-label="Emoji" aria-expanded="false">' + I("smile", "ic-sm") + "</button>" : "") + '<span class="pc-count-n">0 / ' + CAP + "</span></span></label>" +
      '<div class="field"><span class="pe-label">Who can see this</span>' +
        '<div class="segmented pc-vis" role="group" aria-label="Visibility">' + VIS.map(function (x) {
          return '<button type="button" data-vis="' + x.v + '" aria-pressed="' + (x.v === state.vis) + '">' + I(x.icon, "ic-sm") + x.label + "</button>";
        }).join("") + '</div><span class="pc-vis-hint faint small"></span></div>' +
      '<div class="field"><span class="pe-label">When to post</span>' +
        '<div class="segmented pc-when" role="group" aria-label="When">' +
          '<button type="button" data-when="now" aria-pressed="true">' + I("send", "ic-sm") + "Now</button>" +
          '<button type="button" data-when="later" aria-pressed="false">' + I("calendar", "ic-sm") + "Schedule</button></div>" +
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
      if (state.when === "now") whenHint.textContent = navigator.onLine ? "Uploads right away." : "Appears after uploading (once you're online).";
      else {
        var d = new Date(date.value);
        whenHint.textContent = isNaN(d) ? "Pick a date and time." : "Appears on " + fmtWhen(d) + ". It still works if you're offline then, as long as it uploaded before.";
      }
    }
    function paintNet() {
      net.className = "pc-net small " + (navigator.onLine ? "on" : "off");
      net.innerHTML = navigator.onLine
        ? I("cloud", "ic-sm") + "Online · uploads as soon as you save."
        : I("cloud", "ic-sm") + "You're offline · it will be saved on your device and upload automatically when you're back online.";
      paintWhen();
    }
    paintVis(); paintNet();

    // Sound: galing sa camera review, o auto-pick base sa unang photo/video
    var sound = null;
    if (window.TMN_SOUND_PICK && items.length) {
      var sbox = root.querySelector(".pc-soundpick"), first = items[0];
      var mountSound = function (s) {
        if (state.busy || closed) return;
        sound = s;
        soundRow = TMN_SOUND_PICK.row(sbox, { src: first.blob, kind: first.type, sound: s, onChange: function (x) { sound = x; } });
      };
      var soundRow = null, closed = false;
      if (first.sound) mountSound(first.sound);
      else {
        sbox.innerHTML = '<span class="faint small">' + I("music", "ic-sm") + " Finding a sound…</span>";
        TMN_SOUND_PICK.auto(first.blob, { kind: first.type }).then(function (r) { mountSound(r.sound); }, function () { mountSound(null); });
      }
    }
    window.addEventListener("online", paintNet); window.addEventListener("offline", paintNet);

    cap.addEventListener("input", function () { count.querySelector(".pc-count-n").textContent = cap.value.length + " / " + CAP; });
    if (window.TMN_EMOJI_PICK) TMN_EMOJI_PICK.attach(root.querySelector(".pc-emo"), cap);
    root.querySelector(".pc-vis").addEventListener("click", function (e) { var b = e.target.closest("[data-vis]"); if (b && !state.busy) { state.vis = b.dataset.vis; paintVis(); } });
    root.querySelector(".pc-when").addEventListener("click", function (e) {
      var b = e.target.closest("[data-when]"); if (!b || state.busy) return;
      state.when = b.dataset.when; paintWhen();
      if (state.when === "later") date.focus();
    });
    date.addEventListener("input", paintWhen);
    root.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    if (window.TMN_GUARD) TMN_GUARD.watch(cap); // babala habang nagta-type

    async function submit() {
      if (state.busy) return;
      if (window.TMN_GUARD && !TMN_GUARD.ok(cap.value)) { cap.focus(); return; }
      var publishAt = null;
      if (state.when === "later") {
        var d = new Date(date.value);
        if (isNaN(d)) { UI.toast("Pick a date and time."); date.focus(); return; }
        if (d.getTime() < Date.now() + 60 * 1000) { UI.toast("The schedule must be in the future."); date.focus(); return; }
        if (d.getTime() > Date.now() + 365 * 86400000) { UI.toast("You can schedule up to 1 year ahead."); return; }
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
          status.textContent = (it.type === "video" ? "Compressing video " : "Preparing photo ") + (i + 1) + " / " + n + "…" + (it.type === "video" ? " (don't close)" : "");
        });
        await window.TMN_POSTQ.enqueue({ files: files, caption: cap.value.trim(), visibility: state.vis, publishAt: publishAt, sound: sound, activity: act });
        try { localStorage.setItem("tmnPostVis", state.vis); } catch (e) {}
        done = true; m.close(true);
        if (o.onPosted) o.onPosted();
        UI.toast(navigator.onLine ? "Queued · uploading…" : "Saved on device · will upload when you're online.");
      } catch (err) {
        state.busy = false; btn.disabled = false;
        m.el.querySelectorAll("textarea, input, .segmented button").forEach(function (x) { x.disabled = false; });
        status.textContent = err.message || "Couldn't save the post.";
        status.classList.add("err");
      }
    }

    var done = false;
    var m = window.TMN_MODAL.open({
      title: act ? "New Explore post" : "New post", size: "md", cls: "modal-composer", body: root,
      closeOnBackdrop: false,
      actions: [
        { label: "Cancel", cls: "btn-ghost", onClick: function () { if (!state.busy) m.close(); } },
        { label: I("send", "ic-sm") + "Post", cls: "btn-primary pc-submit", onClick: submit }
      ],
      onClose: function () {
        closed = true;
        if (soundRow) soundRow.destroy();
        window.removeEventListener("online", paintNet); window.removeEventListener("offline", paintNet);
        urls.forEach(function (u) { URL.revokeObjectURL(u); });
      }
    });
    return m;
  }

  window.TMN_COMPOSER = { open: open };
})();
