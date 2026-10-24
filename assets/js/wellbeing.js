/* TigoMeNote · wellbeing.js — sa bawat page ng app: oras ng paggamit, sleep time, break, daily limit, at birthdate (13+)
   - Bawat ~60 s habang nakikita ang page: ipinapadala ang oras sa wellbeing-fast ("tick"), binabalik ang estado.
   - Sleep time / daily limit → buong screen. Adult: puwedeng "Use anyway". Teen na may parent: hindi.
   - Break: paalala kapag tuloy-tuloy nang ginagamit nang lampas sa itinakdang minuto.
   - Walang birthdate (lumang account) → hihingin muna (13+ lang).
   - Ang Safety page (SOS) ay HINDI kailanman bina-block.
   TMN_WELLBEING.refresh() · TMN_WELLBEING.state */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; };
  var TICK = 120000, IDLE_RESET = 5 * 60000; // tick bawat 2 min (hanggang 120 s bawat tawag ang tinatanggap ng server)
  var SESS = "tmnSess", SNOOZE = "tmnWbSnooze", BREAK_SNOOZE = "tmnBreakSnooze";
  var page = document.body.dataset.page || "";
  var exempt = page === "safety";
  var lastTick = Date.now(), st = null, ov = null, sheet = null;

  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return undefined; } }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function root() { return (window.TMN_CONFIG && TMN_CONFIG.root) || "../"; }

  // Tuloy-tuloy na session (para sa break): nire-reset kapag 5 min na hindi ginamit
  function session() {
    var s = get(SESS) || {}, now = Date.now();
    if (!s.start || now - (s.seen || 0) > IDLE_RESET) s = { start: now };
    s.seen = now; put(SESS, s);
    return s;
  }

  // count = bilangin kahit nakatago na (tawag sa sandaling itinago ang page)
  async function tick(count) {
    if (!window.TMN_TOKEN || !navigator.onLine) return;
    var now = Date.now(), sec = document.hidden && !count ? 0 : Math.min(120, Math.round((now - lastTick) / 1000));
    lastTick = now;
    try {
      var r = await TMN_API.call("wellbeing", "tick", { seconds: sec, tz: tz() }, { timeout: 15000 });
      st = r; keep(); apply();
    } catch (e) {}
  }

  function keep() { try { sessionStorage.setItem("tmnWbState", JSON.stringify({ at: Date.now(), st: st })); } catch (e) {} }

  function apply() {
    if (!st || !st.state) return;
    if (st.needs_birthdate) { birthGate(); return; }
    if (exempt) { closeOv(); return; }
    var s = st.state, snooze = get(SNOOZE) || {};
    var canSkip = !st.supervised;
    if (s.sleep && !(canSkip && snooze.sleep === s.day)) {
      overlay("night", "moon", "It's sleep time",
        "Sleep time is " + st.settings.sleep_start + "–" + st.settings.sleep_end + ". Rest well — see you tomorrow.",
        canSkip ? { label: "Use anyway", key: "sleep" } : null);
      return;
    }
    if (s.limit_reached && !(canSkip && snooze.limit === s.day)) {
      overlay("", "hourglass", "Daily limit reached",
        "You've used TigoMeNote for " + Math.round(s.used_seconds / 60) + " minutes today. Come back tomorrow.",
        canSkip ? { label: "Ignore for today", key: "limit" } : null);
      return;
    }
    closeOv();
    maybeBreak();
  }

  // ---------- buong screen ----------
  function overlay(kind, icon, title, text, skip) {
    if (!ov) { ov = document.createElement("div"); document.body.appendChild(ov); ov.addEventListener("click", ovClick); }
    ov.className = "wb-ov" + (kind ? " " + kind : "");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = '<div class="wb-in"><div class="wb-art">' + I(icon) + "</div><h2>" + title + "</h2><p>" + text + "</p>" +
      '<div class="wb-btns">' +
        '<a class="btn btn-lg btn-block wb-sos" href="' + root() + 'app/safety.html">' + I("sos", "ic-sm") + "SOS &amp; Family</a>" +
        (skip ? '<button type="button" class="btn btn-ghost btn-block" data-skip="' + skip.key + '">' + skip.label + "</button>" : '<p class="small">Your parent set this limit.</p>') +
      "</div></div>";
    document.documentElement.classList.add("wb-open");
  }
  function ovClick(e) {
    var b = e.target.closest("[data-skip]"); if (!b) return;
    var sn = get(SNOOZE) || {}; sn[b.dataset.skip] = st.state.day; put(SNOOZE, sn);
    closeOv();
  }
  function closeOv() { if (ov) { ov.remove(); ov = null; } document.documentElement.classList.remove("wb-open"); }

  // ---------- break ----------
  function maybeBreak() {
    if (!st.settings.break_on || sheet || document.hidden) return;
    var s = session(), mins = (Date.now() - s.start) / 60000;
    var snoozeUntil = Number(get(BREAK_SNOOZE) || 0);
    if (mins < st.settings.break_min || Date.now() < snoozeUntil) return;
    sheet = document.createElement("div");
    sheet.className = "modal-backdrop";
    sheet.innerHTML = '<div class="modal modal-sm" role="dialog" aria-modal="true"><div class="modal-body"><div class="wb-in">' +
      '<div class="wb-art">' + I("coffee") + "</div><h2>Time for a break?</h2>" +
      "<p>You've been on TigoMeNote for " + Math.round(mins) + " minutes. Stretch, drink water, rest your eyes.</p>" +
      '<div class="wb-btns"><button type="button" class="btn btn-primary btn-block" data-b="break">Take a break</button>' +
      '<button type="button" class="btn btn-ghost btn-block" data-b="snooze">Remind me in 15 min</button></div></div></div></div>';
    document.body.appendChild(sheet);
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest("[data-b]"); if (!b) return;
      if (b.dataset.b === "break") { put(SESS, { start: Date.now(), seen: Date.now() }); put(BREAK_SNOOZE, Date.now() + 15 * 60000); if (window.TMN_UI) TMN_UI.toast("Enjoy your break 🌿"); }
      else put(BREAK_SNOOZE, Date.now() + 15 * 60000);
      sheet.remove(); sheet = null;
    });
  }

  // ---------- birthdate (13+) ----------
  var gate = null;
  function birthGate() {
    if (gate) return;
    closeOv();
    var max = new Date(); max.setFullYear(max.getFullYear() - 1);
    gate = document.createElement("div");
    gate.className = "wb-ov";
    gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true");
    gate.innerHTML = '<form class="wb-in" novalidate><div class="wb-art">' + I("cake") + "</div><h2>When's your birthday?</h2>" +
      "<p>TigoMeNote is for ages 13 and up. Teen accounts (13–17) get extra protection.</p>" +
      '<label class="field"><span class="pe-label">Birthdate</span><input class="input" type="date" required max="' + max.toISOString().slice(0, 10) + '" min="1900-01-01"></label>' +
      '<p class="err hidden" role="alert"></p>' +
      '<div class="wb-btns"><button type="submit" class="btn btn-primary btn-lg btn-block">Continue</button>' +
      '<a class="btn btn-ghost btn-block wb-sos" href="' + root() + 'app/safety.html">' + I("sos", "ic-sm") + "Emergency SOS</a></div>" +
      '<p class="faint small">You can set this only once.</p></form>';
    document.body.appendChild(gate);
    document.documentElement.classList.add("wb-open");
    if (exempt) gate.querySelector(".wb-sos").classList.add("hidden");
    var form = gate.querySelector("form"), err = gate.querySelector(".err");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var v = form.querySelector("input").value, btn = form.querySelector("[type=submit]");
      err.classList.add("hidden");
      if (!v) { err.textContent = "Enter your birthdate."; err.classList.remove("hidden"); return; }
      btn.disabled = true;
      try {
        var r = await TMN_API.call("wellbeing", "setBirthdate", { birthdate: v, tz: tz() });
        if (window.TMN_AUTH && TMN_AUTH.setUser) TMN_AUTH.setUser(Object.assign({}, window.TMN_USER || {}, { birthdate: v, private_account: r.teen || (window.TMN_USER || {}).private_account }));
        gate.remove(); gate = null; document.documentElement.classList.remove("wb-open");
        if (r.teen && window.TMN_UI) TMN_UI.toast("Teen account: your profile is private.");
        tick();
      } catch (x) {
        btn.disabled = false;
        err.textContent = x.message; err.classList.remove("hidden");
        if (x.data && x.data.too_young) {
          form.querySelector(".wb-btns").innerHTML = '<button type="button" class="btn btn-ghost btn-block" data-out>Log out</button>';
          form.querySelector("[data-out]").addEventListener("click", function () { if (window.TMN_AUTH) TMN_AUTH.logout(); });
        }
      }
    });
  }

  function start() {
    if (!window.TMN_TOKEN) return;
    session();
    lastTick = Date.now();
    // Paglipat ng page: gamitin muna ang huling sagot kung bago pa (< 60 s), para walang dagdag na tawag sa server
    var cached = null; try { cached = JSON.parse(sessionStorage.getItem("tmnWbState") || "null"); } catch (e) {}
    if (cached && Date.now() - cached.at < 60000) { st = cached.st; apply(); }
    else TMN_API.call("wellbeing", "tick", { seconds: 0, tz: tz() }, { timeout: 15000 }).then(function (r) { st = r; keep(); apply(); }).catch(function () {});
    setInterval(function () { if (!document.hidden) { session(); tick(); } }, TICK);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { lastTick = Date.now(); session(); if (st) apply(); } else tick(true); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.TMN_WELLBEING = { refresh: tick, get state() { return st; } };
})();
