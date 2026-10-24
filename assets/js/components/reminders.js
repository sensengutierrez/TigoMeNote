/* TigoMeNote · components/reminders.js — Reminders at Alarms sa Daily
     TMN_REMIND.mount(el)          → card: susunod na reminders/alarms + "Add"
     TMN_REMIND.add({ due })       → sheet para gumawa (due = Date, hal. galing sa calendar)
   Naka-save sa server (daily-fast) para may push sa phone sa tamang oras kahit sarado ang app.
   Kapag bukas ang page: tumutunog dito (chime; alarm = tuloy-tuloy hanggang Stop) na may Snooze 10 min at Done.
   Sa APK (susunod): totoong alarm ng phone kahit naka-silent. Kailangan: api.js, modal.js, push-setup.js */
(function () {
  var REP = { none: "Once", daily: "Every day", weekly: "Every week", monthly: "Every month" };
  var items = [], el = null, rung = {}, ringing = null, timer = null;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function loc() { return window.TMN_I18N ? TMN_I18N.locale : undefined; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function when(iso) {
    var d = new Date(iso), t = new Date(), tm = new Date(); tm.setDate(t.getDate() + 1);
    var time = d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === t.toDateString()) return "Today · " + time;
    if (d.toDateString() === tm.toDateString()) return "Tomorrow · " + time;
    return d.toLocaleDateString(loc(), { weekday: "short", month: "short", day: "numeric" }) + " · " + time;
  }
  function upcoming() { return items.filter(function (r) { return !r.done_at && !r.sent_at; }).sort(function (a, b) { return a.due_at < b.due_at ? -1 : 1; }); }

  async function load() {
    if (!navigator.onLine) return paint();
    try { var r = await TMN_API.call("daily", "list", {}); items = r.list || []; } catch (e) {}
    paint(); document.dispatchEvent(new CustomEvent("tmn:reminders", { detail: items }));
  }
  function paint() {
    if (!el) return;
    var up = upcoming();
    el.innerHTML = '<div class="rm-head"><h3 class="side-title">Reminders &amp; alarms</h3>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-r="add">' + I("plus", "ic-sm") + "Add</button></div>" +
      (up.length ? '<ul class="rm-list">' + up.slice(0, 6).map(function (r) {
        return '<li class="rm-item" data-id="' + r.id + '"><span class="rm-ic ' + r.kind + '">' + (r.kind === "alarm" ? "⏰" : "🔔") + "</span>" +
          '<button type="button" class="rm-main" data-r="edit"><b>' + esc(r.title) + '</b><span class="faint small">' + when(r.due_at) + (r.repeat !== "none" ? " · " + REP[r.repeat] : "") + "</span></button>" +
          '<button type="button" class="icon-btn" data-r="done" aria-label="Done" title="Done">' + I("check", "ic-sm") + "</button></li>";
      }).join("") + "</ul>" + (up.length > 6 ? '<p class="faint small">+' + (up.length - 6) + " more</p>" : "")
        : '<p class="faint small rm-empty">Set a reminder or an alarm. Your phone gets a notification at the right time.</p>');
  }

  // ---------- gumawa / i-edit ----------
  function sheet(r, o) {
    o = o || {};
    var d = r ? new Date(r.due_at) : (o.due ? new Date(o.due) : new Date(Date.now() + 60 * 60000));
    if (!r && !o.time) { d.setMinutes(0, 0, 0); if (d < new Date()) d.setHours(d.getHours() + 1); }
    var st = { kind: r ? r.kind : o.kind || "reminder" };
    var body = document.createElement("form");
    body.className = "rm-form"; body.noValidate = true;
    body.innerHTML =
      '<div class="segmented rm-kind"><button type="button" data-k="reminder">🔔 Reminder</button><button type="button" data-k="alarm">⏰ Alarm</button></div>' +
      '<label class="field"><span class="pe-label">Title</span><input class="input rm-title" maxlength="120" placeholder="e.g. Take medicine, Call Mama, Pay bills" value="' + (r ? esc(r.title) : "") + '"></label>' +
      '<div class="rm-row"><label class="field"><span class="pe-label">Date</span><input type="date" class="input rm-date" value="' + d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + '"></label>' +
        '<label class="field"><span class="pe-label">Time</span><input type="time" class="input rm-time" value="' + pad(d.getHours()) + ":" + pad(d.getMinutes()) + '"></label></div>' +
      '<label class="field"><span class="pe-label">Repeat</span><select class="input rm-rep">' + Object.keys(REP).map(function (k) { return '<option value="' + k + '"' + (r && r.repeat === k ? " selected" : "") + ">" + REP[k] + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span class="pe-label">Note <span class="faint small">(optional)</span></span><input class="input rm-note" maxlength="300" value="' + (r && r.note ? esc(r.note) : "") + '"></label>' +
      '<p class="faint small rm-hint"></p>';
    function paintKind() {
      body.querySelectorAll("[data-k]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.k === st.kind)); });
      body.querySelector(".rm-hint").textContent = st.kind === "alarm"
        ? "Alarm: rings until you stop it while TigoMeNote is open, and stays on your phone's screen as a notification."
        : "Reminder: a notification on your phone at this time.";
    }
    body.querySelector(".rm-kind").addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) { st.kind = b.dataset.k; paintKind(); } });
    paintKind();
    var actions = [{ label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } }];
    if (r) actions.unshift({ label: I("trash", "ic-sm") + "Delete", cls: "btn-danger", onClick: async function () {
      try { await TMN_API.call("daily", "remove", { id: r.id }); m.close(); load(); } catch (e) { TMN_UI.toast(e.message); }
    } });
    actions.push({ label: "Save", cls: "btn-primary", onClick: async function (a, btn) {
      var due = new Date(body.querySelector(".rm-date").value + "T" + body.querySelector(".rm-time").value);
      var title = body.querySelector(".rm-title").value.trim();
      if (!title) { TMN_UI.toast("Add a title."); body.querySelector(".rm-title").focus(); return; }
      if (isNaN(due)) { TMN_UI.toast("Pick a date and time."); return; }
      btn.disabled = true;
      try {
        await TMN_API.call("daily", "save", { id: r ? r.id : undefined, kind: st.kind, title: title, note: body.querySelector(".rm-note").value, due_at: due.toISOString(), repeat: body.querySelector(".rm-rep").value });
        m.close(); TMN_UI.toast(st.kind === "alarm" ? "Alarm set ⏰" : "Reminder set 🔔"); load();
        askPush();
      } catch (e) { btn.disabled = false; TMN_UI.toast(e.message); }
    } });
    var m = TMN_MODAL.open({ title: r ? "Edit" : "New reminder or alarm", size: "sm", cls: "modal-sheet", body: body, actions: actions });
    body.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  // Para dumating sa phone kahit sarado ang app: kailangan naka-on ang notifications
  async function askPush() {
    if (!window.TMN_PUSH) return;
    try { var s = await TMN_PUSH.status(); if (s === "off") await TMN_PUSH.enable(); else if (s === "ios-home") TMN_UI.toast("On iPhone, add TigoMeNote to your Home Screen to get reminders.", 4000); } catch (e) {}
  }

  // ---------- pagtunog habang bukas ang page ----------
  var ac = null;
  function chime() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var t = ac.currentTime;
      [880, 1175, 1568].forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.18); g.gain.exponentialRampToValueAtTime(0.35, t + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.6);
        o.connect(g).connect(ac.destination); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.65);
      });
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  }
  function ring(r) {
    if (!r || ringing || Date.now() - (rung[r.id] || 0) < 3 * 60000) return; // iwas dobleng tunog (check + push)
    rung[r.id] = Date.now();
    chime();
    var loop = r.kind === "alarm" ? setInterval(chime, 2200) : null;
    var body = document.createElement("div");
    body.className = "rm-ring";
    body.innerHTML = '<div class="rm-ring-ic">' + (r.kind === "alarm" ? "⏰" : "🔔") + '</div><h2>' + esc(r.title) + "</h2>" +
      '<p class="faint" translate="no">' + new Date(r.due_at).toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit" }) + "</p>" + (r.note ? "<p>" + esc(r.note) + "</p>" : "");
    function stop() { clearInterval(loop); ringing = null; if (navigator.vibrate) navigator.vibrate(0); }
    var m = TMN_MODAL.open({
      title: false, size: "sm", cls: "modal-ring", body: body, closeOnBackdrop: false, onClose: stop,
      actions: [
        { label: "Snooze 10 min", cls: "btn-ghost", onClick: async function () { m.close(); try { await TMN_API.call("daily", "snooze", { id: r.id, minutes: 10 }); load(); } catch (e) {} } },
        { label: r.kind === "alarm" ? "Stop" : "Done", cls: "btn-primary", onClick: async function () { m.close(); try { await TMN_API.call("daily", "done", { id: r.id }); load(); } catch (e) {} } }
      ]
    });
    ringing = m;
  }
  function check() {
    var now = Date.now();
    upcoming().forEach(function (r) { var t = new Date(r.due_at).getTime(); if (t <= now + 1000 && now - t < 10 * 60000) ring(r); });
  }
  // Push habang bukas ang app (galing sa sw.js) → tumunog dito
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) {
    var d = e.data && e.data.type === "tmn-push" && e.data.data;
    if (d && (d.type === "alarm" || d.type === "reminder")) {
      var r = items.filter(function (x) { return x.id === d.id; })[0];
      ring(r || { id: d.id, kind: d.type, title: String(d.title || "").replace(/^\S+\s/, ""), note: d.body, due_at: new Date().toISOString() });
    }
  });

  function mount(node) {
    el = node;
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-r]"); if (!b) return;
      var li = b.closest("[data-id]"), r = li && items.filter(function (x) { return x.id === li.dataset.id; })[0];
      if (b.dataset.r === "add") sheet(null);
      if (b.dataset.r === "edit" && r) sheet(r);
      if (b.dataset.r === "done" && r) { try { await TMN_API.call("daily", "done", { id: r.id }); TMN_UI.toast(r.repeat !== "none" ? "Done ✓ Next: " + when((await TMN_API.call("daily", "list", {})).list.filter(function (x) { return x.id === r.id; })[0].due_at) : "Done ✓"); load(); } catch (er) { TMN_UI.toast(er.message); } }
    });
    paint(); load();
    clearInterval(timer); timer = setInterval(check, 10000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { load().then(check); } });
    // Binuksan mula sa notification: ?reminder=<id>
    var q = new URLSearchParams(location.search).get("reminder");
    if (q) load().then(function () { var r = items.filter(function (x) { return x.id === q; })[0]; if (r) ring(Object.assign({}, r)); history.replaceState(null, "", location.pathname); });
  }

  window.TMN_REMIND = { mount: mount, add: function (o) { sheet(null, o); }, list: function () { return items; }, reload: load };
})();
