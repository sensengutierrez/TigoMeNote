/* TigoMeNote · components/schedule.js — "School & work" sa Daily: lingguhang schedule ng klase at trabaho
     Bawat item: pangalan, lugar, mga araw (Sun–Sat), simula–tapos, at paalala X minuto bago magsimula.
     Naka-save sa server (daily-fast: kind "class" | "work", repeat "days", sched) para may push sa phone kahit sarado ang app.
     Kusang naka-mount sa <section id="schedule">. Kinukuha ang listahan sa reminders.js (event "tmn:reminders").
   Kailangan: api.js, modal.js, components/reminders.js */
(function () {
  var DAYS = [["Sun", 0], ["Mon", 1], ["Tue", 2], ["Wed", 3], ["Thu", 4], ["Fri", 5], ["Sat", 6]];
  var ORDER = [1, 2, 3, 4, 5, 6, 0];   // Lunes muna
  var LEADS = [[0, "At start time"], [5, "5 min before"], [10, "10 min before"], [15, "15 min before"], [30, "30 min before"], [60, "1 hour before"], [120, "2 hours before"]];
  var KIND = { class: { ic: "📚", name: "School", ph: "e.g. Math 101, English", place: "e.g. Room 204" }, work: { ic: "💼", name: "Work", ph: "e.g. Morning shift, Office", place: "e.g. Main branch" } };
  var el = null, items = [], view = null;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } }
  function hm(s) {   // "13:30" → "1:30 PM" (ayon sa wika ng phone)
    if (!s) return "";
    var p = s.split(":"), d = new Date(2000, 0, 1, +p[0], +p[1]);
    return d.toLocaleTimeString(window.TMN_I18N ? TMN_I18N.locale : undefined, { hour: "numeric", minute: "2-digit" });
  }
  function dayList(ds) {
    var k = ds.slice().sort().join(",");
    if (k === "1,2,3,4,5") return "Weekdays";
    if (k === "0,6") return "Weekends";
    if (ds.length === 7) return "Every day";
    return ORDER.filter(function (d) { return ds.indexOf(d) >= 0; }).map(function (d) { return DAYS[d][0]; }).join(" · ");
  }
  function mine() { return items.filter(function (r) { return (r.kind === "class" || r.kind === "work") && r.sched; }); }

  function paint() {
    if (!el) return;
    var list = mine(), today = new Date().getDay();
    if (view === null) view = today;
    var day = list.filter(function (r) { return r.sched.days.indexOf(view) >= 0; }).sort(function (a, b) { return a.sched.start < b.sched.start ? -1 : 1; });
    var nowHm = String(new Date().getHours()).padStart(2, "0") + ":" + String(new Date().getMinutes()).padStart(2, "0");
    el.innerHTML = '<div class="rm-head"><h3 class="side-title">School &amp; work</h3>' +
      '<div class="sc-add"><button type="button" class="btn btn-ghost btn-sm" data-s="add" data-k="class">📚 Class</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-s="add" data-k="work">💼 Work</button></div></div>' +
      (list.length ? '<div class="sc-days" role="tablist" aria-label="Day">' + ORDER.map(function (d) {
          var has = list.some(function (r) { return r.sched.days.indexOf(d) >= 0; });
          return '<button type="button" role="tab" class="sc-day' + (d === today ? " today" : "") + (has ? " has" : "") + '" data-day="' + d + '" aria-selected="' + (d === view) + '">' + DAYS[d][0] + "</button>";
        }).join("") + "</div>" +
        (day.length ? '<ul class="sc-list">' + day.map(function (r) {
          var s = r.sched, k = KIND[r.kind], live = view === today && s.start <= nowHm && (!s.end || nowHm < s.end);
          return '<li class="sc-item ' + r.kind + (live ? " live" : "") + '" data-id="' + r.id + '"><button type="button" class="sc-main" data-s="edit">' +
            '<span class="sc-time" translate="no"><b>' + hm(s.start) + "</b>" + (s.end ? "<span>" + hm(s.end) + "</span>" : "") + "</span>" +
            '<span class="sc-txt"><b>' + k.ic + " " + esc(r.title) + "</b>" +
              '<span class="faint small">' + (r.note ? esc(r.note) + " · " : "") + dayList(s.days) + " · " + (s.lead ? "🔔 " + s.lead + " min before" : "🔔 at start") + "</span></span>" +
            (live ? '<span class="sc-now">Now</span>' : "") + "</button></li>";
        }).join("") + "</ul>"
          : '<p class="faint small rm-empty">Nothing on ' + DAYS[view][0] + ". " + (view === today ? "Free day ✨" : "") + "</p>")
      : '<p class="faint small rm-empty">Add your class or work schedule. You get a reminder on your phone before each one starts.</p>');
  }

  function sheet(r, kind) {
    var st = { kind: r ? r.kind : kind || "class", days: r ? r.sched.days.slice() : kind === "work" ? [1, 2, 3, 4, 5] : [] };
    var s = r ? r.sched : { start: st.kind === "work" ? "09:00" : "08:00", end: st.kind === "work" ? "18:00" : "09:00", lead: 15 };
    var body = document.createElement("form");
    body.className = "rm-form sc-form"; body.noValidate = true;
    body.innerHTML =
      '<div class="segmented rm-kind"><button type="button" data-k="class">📚 School</button><button type="button" data-k="work">💼 Work</button></div>' +
      '<label class="field"><span class="pe-label">Name</span><input class="input sc-title" maxlength="120" value="' + (r ? esc(r.title) : "") + '"></label>' +
      '<label class="field"><span class="pe-label">Place <span class="faint small">(optional)</span></span><input class="input sc-place" maxlength="120" value="' + (r && r.note ? esc(r.note) : "") + '"></label>' +
      '<div class="field"><span class="pe-label">Days</span><div class="sc-pick" role="group" aria-label="Days">' + ORDER.map(function (d) {
        return '<button type="button" class="chip" data-d="' + d + '">' + DAYS[d][0] + "</button>"; }).join("") + "</div>" +
        '<div class="sc-quick"><button type="button" class="btn btn-ghost btn-sm" data-q="1,2,3,4,5">Weekdays</button><button type="button" class="btn btn-ghost btn-sm" data-q="1,3,5">Mon·Wed·Fri</button><button type="button" class="btn btn-ghost btn-sm" data-q="2,4">Tue·Thu</button></div></div>' +
      '<div class="rm-row"><label class="field"><span class="pe-label">Starts</span><input type="time" class="input sc-start" value="' + s.start + '"></label>' +
        '<label class="field"><span class="pe-label">Ends</span><input type="time" class="input sc-end" value="' + (s.end || "") + '"></label></div>' +
      '<label class="field"><span class="pe-label">Remind me</span><select class="input sc-lead">' + LEADS.map(function (l) {
        return '<option value="' + l[0] + '"' + (l[0] === s.lead ? " selected" : "") + ">" + l[1] + "</option>"; }).join("") + "</select></label>" +
      '<p class="faint small rm-hint">Every week on the days you pick. Times follow your phone\'s time zone.</p>';
    function paintF() {
      body.querySelectorAll("[data-k]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.k === st.kind)); });
      body.querySelectorAll("[data-d]").forEach(function (b) { var on = st.days.indexOf(+b.dataset.d) >= 0; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
      body.querySelector(".sc-title").placeholder = KIND[st.kind].ph; body.querySelector(".sc-place").placeholder = KIND[st.kind].place;
    }
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-k],[data-d],[data-q]"); if (!b) return;
      if (b.dataset.k) st.kind = b.dataset.k;
      if (b.dataset.d) { var d = +b.dataset.d, i = st.days.indexOf(d); if (i >= 0) st.days.splice(i, 1); else st.days.push(d); }
      if (b.dataset.q) st.days = b.dataset.q.split(",").map(Number);
      paintF();
    });
    paintF();
    var actions = [{ label: "Cancel", cls: "btn-ghost", onClick: function () { m.close(); } }];
    if (r) actions.unshift({ label: I("trash", "ic-sm") + "Delete", cls: "btn-danger", onClick: async function () {
      try { await TMN_API.call("daily", "remove", { id: r.id }); m.close(); reload(); } catch (e) { TMN_UI.toast(e.message); }
    } });
    actions.push({ label: "Save", cls: "btn-primary", onClick: async function (a, btn) {
      var title = body.querySelector(".sc-title").value.trim(), start = body.querySelector(".sc-start").value, end = body.querySelector(".sc-end").value;
      if (!title) { TMN_UI.toast("Add a name."); body.querySelector(".sc-title").focus(); return; }
      if (!st.days.length) { TMN_UI.toast("Pick at least one day."); return; }
      if (!start) { TMN_UI.toast("Pick the start time."); return; }
      if (end && end <= start) { TMN_UI.toast("The end time should be after the start."); return; }
      btn.disabled = true;
      try {
        await TMN_API.call("daily", "save", { id: r ? r.id : undefined, kind: st.kind, title: title, note: body.querySelector(".sc-place").value,
          repeat: "days", sched: { days: st.days, start: start, end: end || null, lead: +body.querySelector(".sc-lead").value, tz: tz() } });
        m.close(); TMN_UI.toast(st.kind === "class" ? "Class saved 📚" : "Work schedule saved 💼"); reload();
        if (window.TMN_PUSH) try { if (await TMN_PUSH.status() === "off") await TMN_PUSH.enable(); } catch (e) {}
      } catch (e) { btn.disabled = false; TMN_UI.toast(e.message); }
    } });
    var m = TMN_MODAL.open({ title: r ? "Edit schedule" : st.kind === "work" ? "Add work schedule" : "Add a class", size: "sm", cls: "modal-sheet", body: body, actions: actions });
    body.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  function reload() { if (window.TMN_REMIND) TMN_REMIND.reload(); }

  function mount(node) {
    el = node;
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-s],[data-day]"); if (!b) return;
      if (b.dataset.day) { view = +b.dataset.day; paint(); return; }
      if (b.dataset.s === "add") sheet(null, b.dataset.k);
      if (b.dataset.s === "edit") { var li = b.closest("[data-id]"), r = mine().filter(function (x) { return x.id === li.dataset.id; })[0]; if (r) sheet(r); }
    });
    document.addEventListener("tmn:reminders", function (e) { items = e.detail || []; paint(); });
    if (window.TMN_REMIND) items = TMN_REMIND.list() || [];
    paint();
    setInterval(paint, 60000);   // "Now" na marka
  }
  window.TMN_SCHEDULE = { mount: mount, add: function (k) { sheet(null, k); } };
  function auto() { var n = document.getElementById("schedule"); if (n && !n._sc) { n._sc = 1; mount(n); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
