/* TigoMeNote · components/wellbeing-settings.js — sa Settings: Sleep & breaks, Privacy (private account + follow requests),
   at Parental supervision (teen ↔ parent).
   TMN_WB_SETTINGS.mount(el)  → gumagawa ng mga card sa loob ng el
   Kailangan: api.js, modal.js (para sa confirm), wellbeing.js (opsyonal, para ma-refresh agad) */
(function () {
  var UI = window.TMN_UI, I = window.TMN_ICON, esc = UI.esc;
  var el, st = null;

  var BREAKS = [30, 45, 60, 90, 120];
  var LIMITS = [0, 30, 60, 90, 120, 180, 240];
  function minLabel(m) { return !m ? "Off" : m < 60 ? m + " min" : (m % 60 ? (m / 60).toFixed(1) : m / 60) + " h"; }
  function opts(list, cur) { return list.map(function (m) { return '<option value="' + m + '"' + (Number(cur || 0) === m ? " selected" : "") + ">" + minLabel(m) + "</option>"; }).join(""); }
  function avatar(u, size) { return '<span class="avatar" style="--size:' + (size || 36) + 'px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc(UI.initials(u.display_name || u.username))) + "</span>"; }
  function who(u) { return '<div class="sf-who"><b translate="no">' + esc(u.display_name || u.username) + '</b><span class="faint small" translate="no">@' + esc(u.username) + "</span></div>"; }

  // Mga row ng settings (para sa sarili o sa teen). uid = kanino (wala = sarili)
  function settingsRows(s, locked, uid, usedSec) {
    var dis = locked ? " disabled" : "";
    var u = uid ? ' data-uid="' + uid + '"' : "";
    return '<div class="rows wb-rows"' + u + ">" +
      (usedSec != null ? '<div class="row"><div class="row-main"><div class="row-title">Today</div><div class="row-sub">' + Math.round(usedSec / 60) + " min on TigoMeNote</div></div></div>" : "") +
      '<div class="row set-row"><div class="row-main"><div class="row-title">' + I("moon", "ic-sm") + " Sleep time</div><div class=\"row-sub\">The app rests at night. SOS and Family still work.</div></div>" +
        '<label class="switch"><input type="checkbox" data-f="sleep_on"' + (s.sleep_on ? " checked" : "") + dis + ' aria-label="Sleep time"><span></span></label>' +
        '<div class="wb-times"><label>From <input class="input" type="time" data-f="sleep_start" value="' + esc(s.sleep_start) + '"' + dis + "></label>" +
        '<label>To <input class="input" type="time" data-f="sleep_end" value="' + esc(s.sleep_end) + '"' + dis + "></label></div></div>" +
      '<div class="row"><div class="row-main"><div class="row-title">' + I("coffee", "ic-sm") + " Break reminder</div><div class=\"row-sub\">A gentle reminder after using the app nonstop.</div></div>" +
        '<label class="switch"><input type="checkbox" data-f="break_on"' + (s.break_on ? " checked" : "") + dis + ' aria-label="Break reminder"><span></span></label>' +
        '<select class="input wb-sel" data-f="break_min"' + dis + ' aria-label="Remind after">' + opts(BREAKS, s.break_min) + "</select></div>" +
      '<div class="row"><div class="row-main"><div class="row-title">' + I("hourglass", "ic-sm") + " Daily limit</div><div class=\"row-sub\">After this, the app closes for the day (except SOS and Family).</div></div>" +
        '<select class="input wb-sel" data-f="daily_limit_min"' + dis + ' aria-label="Daily limit">' + opts(LIMITS, s.daily_limit_min) + "</select></div>" +
    "</div>";
  }

  function render() {
    var me = st.me;
    var supervisedBy = st.guardians.filter(function (g) { return g.status === "accepted"; });
    var h = "";
    // Sleep & breaks
    h += '<section class="card"><h3 class="set-title">Sleep &amp; breaks</h3>' +
      (me.supervised ? '<p class="wb-note small">' + I("lock", "ic-sm") + "<span>Managed by your parent: " + supervisedBy.map(function (g) { return '<b translate="no">' + esc(g.user.display_name || g.user.username) + "</b>"; }).join(", ") + "</span></p>" : "") +
      settingsRows(st.settings, me.supervised, null, st.state.used_seconds) + "</section>";
    // Privacy
    h += '<section class="card"><h3 class="set-title">Privacy</h3><div class="rows">' +
      '<div class="row"><div class="row-main"><div class="row-title">Private account</div><div class="row-sub">' +
        (me.teen ? "Teen accounts stay private. Only approved followers see your posts." : "Only followers you approve can see your posts.") + "</div></div>" +
        '<label class="switch"><input type="checkbox" id="wbPrivate"' + (me.private_account ? " checked" : "") + (me.teen ? " disabled" : "") + ' aria-label="Private account"><span></span></label></div>' +
      '<div class="row hidden" id="wbReqRow"><div class="row-main"><div class="row-title">Follow requests</div><div class="sf-list" id="wbReqs"></div></div></div>' +
      "</div></section>";
    // Parental
    h += '<section class="card"><h3 class="set-title">Parental supervision</h3>';
    if (me.teen) {
      h += '<p class="row-sub wb-intro">A parent or guardian can help keep you safe: they can see your location (Family), set sleep time and a daily limit, and approve new followers. You always see who supervises you.</p><div class="sf-list">' +
        (st.guardians.length ? st.guardians.map(function (g) {
          return '<div class="sf-row" data-gid="' + g.id + '">' + avatar(g.user) + '<div class="sf-row-main">' + who(g.user) +
            '<span class="small">' + (g.status === "accepted" ? "Supervises your account until you turn 18" : "wants to supervise your account") + "</span></div>" +
            (g.status === "pending" ? '<div class="sf-row-act"><button type="button" class="btn btn-primary btn-sm" data-g="accept">Accept</button><button type="button" class="btn btn-ghost btn-sm" data-g="decline">Decline</button></div>' : "") + "</div>";
        }).join("") : '<p class="faint small">No parent linked yet. Ask your parent to open Settings → Parental supervision and add your username.</p>') + "</div>";
    } else if (me.age === null) {
      h += '<p class="faint small">Add your birthdate first.</p>';
    } else {
      h += '<p class="row-sub wb-intro">Supervise your child\'s account (ages 13–17). They must accept, and they\'ll always see that you supervise them.</p>' +
        '<form class="wb-add" id="wbAdd"><input class="input" placeholder="Teen\'s @username" maxlength="30" aria-label="Teen username" autocapitalize="none" spellcheck="false"><button class="btn btn-primary" type="submit">' + I("userPlus", "ic-sm") + "Invite</button></form>" +
        '<div class="wb-wards">' + st.wards.map(function (w) {
          if (w.status !== "accepted") return '<div class="sf-row" data-wid="' + w.id + '">' + avatar(w.user) + '<div class="sf-row-main">' + who(w.user) + '<span class="faint small">Invite sent · waiting for them to accept</span></div><div class="sf-row-act"><button type="button" class="btn btn-ghost btn-sm" data-w="remove">Cancel</button></div></div>';
          return '<div class="wb-ward" data-wid="' + w.id + '" data-uid="' + w.user.id + '"><div class="sf-row">' + avatar(w.user, 44) + '<div class="sf-row-main">' + who(w.user) +
            '<span class="small">' + (w.age != null ? "Age " + w.age + " · " : "") + Math.round((w.state && w.state.used_seconds || 0) / 60) + " min today" + (w.state && w.state.sleep ? " · sleeping" : "") + "</span></div>" +
            '<div class="sf-row-act"><a class="btn btn-ghost btn-sm" href="safety.html">' + I("map", "ic-sm") + "Locate</a><button type=\"button\" class=\"icon-btn\" data-w=\"remove\" aria-label=\"Stop supervising\">" + I("x") + "</button></div></div>" +
            settingsRows(w.settings, false, w.user.id, null) +
            '<div class="rows"><div class="row"><div class="row-main"><div class="row-title">Follow requests</div><div class="sf-list wb-wreqs" data-for="' + w.user.id + '"><span class="faint small">Loading…</span></div></div></div></div>' +
          "</div>";
        }).join("") + "</div>";
    }
    h += "</section>";
    el.innerHTML = h;
    loadRequests(null);
    st.wards.forEach(function (w) { if (w.status === "accepted") loadRequests(w.user.id); });
  }

  async function loadRequests(forId) {
    var box = forId ? el.querySelector('.wb-wreqs[data-for="' + forId + '"]') : el.querySelector("#wbReqs");
    if (!box) return;
    if (!forId && !st.me.private_account) { el.querySelector("#wbReqRow").classList.add("hidden"); return; }
    try {
      var r = await TMN_API.call("social", "requests", forId ? { for: forId } : {});
      if (!forId) el.querySelector("#wbReqRow").classList.toggle("hidden", !r.list.length);
      box.innerHTML = r.list.length ? r.list.map(function (u) {
        return '<div class="sf-row" data-ruid="' + u.id + '"' + (forId ? ' data-rfor="' + forId + '"' : "") + ">" + avatar(u, 32) + '<div class="sf-row-main">' + who(u) + "</div>" +
          '<div class="sf-row-act"><button type="button" class="btn btn-primary btn-sm" data-r="approve">Approve</button><button type="button" class="btn btn-ghost btn-sm" data-r="decline">Decline</button></div></div>';
      }).join("") : '<span class="faint small">No requests.</span>';
    } catch (e) { box.innerHTML = '<span class="faint small">' + esc(e.message) + "</span>"; }
  }

  async function save(rows, field, value) {
    var body = {}; body[field] = value;
    if (rows.dataset.uid) body.user_id = rows.dataset.uid;
    try { await TMN_API.call("wellbeing", "save", body); UI.toast("Saved."); if (window.TMN_WELLBEING && !rows.dataset.uid) TMN_WELLBEING.refresh(); }
    catch (e) { UI.toast(e.message); load(); }
  }

  function bind() {
    el.addEventListener("change", function (e) {
      var t = e.target, rows = t.closest(".wb-rows");
      if (rows && t.dataset.f) {
        var v = t.type === "checkbox" ? t.checked : t.tagName === "SELECT" ? Number(t.value) : t.value;
        if (t.dataset.f === "daily_limit_min" && !v) v = null;
        save(rows, t.dataset.f, v);
      }
      if (t.id === "wbPrivate") {
        TMN_API.call("wellbeing", "save", { private_account: t.checked }).then(function () { st.me.private_account = t.checked; UI.toast(t.checked ? "Your account is private." : "Your account is public."); loadRequests(null); })
          .catch(function (err) { t.checked = !t.checked; UI.toast(err.message); });
      }
    });
    el.addEventListener("submit", async function (e) {
      if (e.target.id !== "wbAdd") return;
      e.preventDefault();
      var inp = e.target.querySelector("input"), btn = e.target.querySelector("button");
      var name = inp.value.trim().replace(/^@/, "");
      if (!name) return;
      btn.disabled = true;
      try { await TMN_API.call("wellbeing", "guardianInvite", { username: name }); UI.toast("Invite sent. They need to accept it in Settings."); inp.value = ""; load(); }
      catch (err) { UI.toast(err.message); }
      btn.disabled = false;
    });
    el.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-g], [data-w], [data-r]"); if (!b) return;
      if (b.dataset.g) {
        var gid = b.closest("[data-gid]").dataset.gid, accept = b.dataset.g === "accept";
        if (accept && !(await TMN_MODAL.confirm("Your parent will be able to see your location, set sleep time and a daily limit, and approve new followers until you turn 18.", { title: "Accept supervision?", okText: "Accept" }))) return;
        try { await TMN_API.call("wellbeing", "guardianRespond", { id: gid, accept: accept }); UI.toast(accept ? "Your parent now supervises your account." : "Declined."); load(); if (window.TMN_SAFETY_WATCH) TMN_SAFETY_WATCH.refresh(); }
        catch (err) { UI.toast(err.message); }
      }
      if (b.dataset.w === "remove") {
        var wid = b.closest("[data-wid]").dataset.wid;
        if (!(await TMN_MODAL.confirm("Stop supervising this account?", { okText: "Stop", danger: true }))) return;
        try { await TMN_API.call("wellbeing", "guardianRemove", { id: wid }); load(); } catch (err) { UI.toast(err.message); }
      }
      if (b.dataset.r) {
        var row = b.closest("[data-ruid]"), body = { user_id: row.dataset.ruid };
        if (row.dataset.rfor) body.for = row.dataset.rfor;
        try { await TMN_API.call("social", b.dataset.r === "approve" ? "approveRequest" : "declineRequest", body); row.remove(); UI.toast(b.dataset.r === "approve" ? "Approved." : "Declined."); }
        catch (err) { UI.toast(err.message); }
      }
    });
  }

  async function load() {
    try { st = await TMN_API.call("wellbeing", "status", {}); render(); }
    catch (e) { el.innerHTML = '<section class="card"><p class="faint small">' + esc(e.message) + "</p></section>"; }
  }
  function mount(target) {
    el = target; el.innerHTML = '<section class="card"><p class="faint small">Loading…</p></section>';
    bind(); load();
  }
  window.TMN_WB_SETTINGS = { mount: mount, reload: load };
})();
