/* TigoMeNote · pages/tigo.js (app/tigo.html) — alagaan si Tigo (3D) at makipaglaro sa Tigo ng kaibigang malapit
   3D: tigo/pet-scene.js + tigo/pet-model.js (three.js, ini-load lang dito). Walang WebGL → 2D na sticker.
   Server: pet-fast (get, act, style, nearby, gather, visits). Stats: bumababa habang lumilipas ang oras (kinukuwenta rin dito
   para gumalaw ang bars kahit hindi tumatawag sa server). Sa APK: parehong page; may vibrate kapag nag-level up. */
(function () {
  var UI = window.TMN_UI, $ = function (id) { return document.getElementById(id); };
  var pet = null, sc = null, busy = false, nearTimer = null, visitors = {};
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SNACKS = [["🥖", "Pandesal"], ["🥭", "Mango"], ["🍚", "Rice"], ["🌴", "Dates"], ["🍧", "Halo-halo"], ["🍌", "Banana"]];
  var MOOD = { happy: ["😄", "Happy"], ok: ["🙂", "Okay"], sad: ["😢", "Sad"], sleepy: ["😴", "Sleepy"], sick: ["🤒", "Not well"] };
  var COLORS = { coral: "#ff7a59", amber: "#ffc04d", mint: "#3dd6c0", sky: "#7cc4ff", pink: "#ff9ec7", lilac: "#b9a2ff", lime: "#b8e65c", ink: "#3a3a40" };
  var GEAR = [["none", "None", 1], ["sprout", "🌱 Sprout", 2], ["bow", "🎀 Bow", 3], ["cap", "🧢 Cap", 4], ["headphones", "🎧 Headphones", 5], ["crown", "👑 Crown", 7]];

  function toast(t) {
    var el = $("tgToast"); el.textContent = t; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  }
  // Stats ngayon (kinukuwenta mula sa huling save + rates ng server)
  function live() {
    if (!pet) return null;
    var hrs = Math.max(0, (Date.now() - new Date(pet.stats_at).getTime()) / 3600000), k = pet.asleep ? 1 : 0, out = Object.assign({}, pet);
    ["hunger", "joy", "energy", "clean"].forEach(function (s) { out[s] = Math.max(0, Math.min(100, Math.round(pet[s] - pet.rates[s][k] * hrs))); });
    return out;
  }
  function paint() {
    var p = live(); if (!p) return;
    $("tgNameTxt").textContent = p.name; $("tgLvl").textContent = "Lv " + p.level;
    var m = MOOD[p.mood] || MOOD.ok; $("tgMood").textContent = m[0] + " " + m[1];
    $("tgXp").style.width = Math.round(100 * (p.xp - p.prev) / Math.max(1, p.next - p.prev)) + "%";
    document.querySelectorAll(".tg-stat").forEach(function (s) {
      var v = p[s.dataset.s], bar = s.querySelector("i");
      bar.style.width = v + "%"; s.classList.toggle("low", v < 25); s.setAttribute("aria-label", s.textContent.trim() + " " + v + "%");
    });
    var sb = $("sleepBtn"); sb.innerHTML = p.asleep ? "<span>☀️</span>Wake up" : "<span>🌙</span>Sleep"; sb.dataset.a = p.asleep ? "wake" : "sleep";
    document.querySelectorAll('.tg-act:not([data-a="wake"]):not([data-a="sleep"]):not([data-a="style"])').forEach(function (b) { b.disabled = p.asleep && b.dataset.a !== "clean"; });
    $("stage").classList.toggle("night", !!p.asleep);
    if (sc) { sc.main.setMood(p.mood); sc.main.sleep(p.asleep); sc.night(p.asleep); }
  }
  function applyStyle() { if (sc) { sc.main.setColor(pet.color); sc.main.setGear(pet.gear); } else fallback(); }

  // ---------- 3D ----------
  async function start3d() {
    try {
      var mod = await import("../tigo/pet-scene.js");
      sc = mod.createScene($("tgCanvas"), { reduced: reduced, pet: { color: pet.color, gear: pet.gear } });
      paint();
      var cv = $("tgCanvas");
      cv.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect();
        sc.main.lookAt(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      });
      cv.addEventListener("click", function (e) {
        var r = cv.getBoundingClientRect();
        if (sc.pick(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))) act("pet");
      });
    } catch (e) { console.warn("3D off", e); fallback(); }
  }
  function fallback() {
    $("tgCanvas").classList.add("hidden");
    var f = $("tgFallback"); f.classList.remove("hidden");
    var p = live() || {}, id = p.asleep ? "tigo-sleep" : p.mood === "sad" || p.mood === "sick" ? "tigo-miss" : "tigo-hello";
    f.innerHTML = window.TMN_STICKERS ? TMN_STICKERS.svg(id, 220) : "";
    f.onclick = function () { act("pet"); };
  }

  // ---------- pag-aalaga ----------
  async function act(what, label) {
    if (busy) return;
    if (!navigator.onLine) { toast("Tigo needs internet right now."); return; }
    busy = true;
    // animation agad (hindi na hinihintay ang server)
    if (sc) {
      if (what === "feed") { sc.effect("food"); setTimeout(function () { sc.main.eat(); }, 450); }
      if (what === "play") { sc.effect("ball"); sc.main.jump(); setTimeout(function () { sc.main.jump(); }, 800); setTimeout(function () { sc.main.spin(); }, 1500); }
      if (what === "clean") { sc.effect("bubbles"); sc.main.wiggle(); }
      if (what === "pet") { sc.effect("hearts"); sc.main.wiggle(); }
      if (what === "wake") sc.main.jump();
    }
    try {
      var r = await TMN_API.call("pet", "act", { do: what });
      pet = r.pet; paint();
      if (r.msg === "full") toast("Tigo is full! 😋");
      else if (r.msg === "clean") toast("Tigo is already clean ✨");
      else if (what === "feed") toast("Yum! " + (label || "") + " 😋");
      else if (what === "play") toast("Wheee! ⚽");
      else if (what === "clean") toast("Squeaky clean! 🫧");
      else if (what === "sleep") toast("Good night, " + pet.name + " 🌙");
      else if (what === "wake") toast("Good morning! ☀️");
      if (r.levelUp) levelUp(r.levelUp);
    } catch (e) { toast(e.message); }
    finally { busy = false; }
  }
  function levelUp(n) {
    if (sc) { sc.effect("stars"); sc.main.spin(); }
    if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
    var g = GEAR.filter(function (x) { return x[2] === n; })[0];
    UI.toast("🎉 Level " + n + "!" + (g ? " New: " + g[1] : ""), 4000);
  }
  function feedMenu() {
    var body = document.createElement("div");
    body.className = "tg-snacks";
    body.innerHTML = SNACKS.map(function (s) { return '<button type="button" data-s="' + s[1] + '"><span>' + s[0] + "</span>" + s[1] + "</button>"; }).join("");
    var m = TMN_MODAL.open({ title: "Feed " + pet.name, size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", function (e) { var b = e.target.closest("[data-s]"); if (b) { m.close(); act("feed", b.dataset.s); } });
  }
  function styleSheet() {
    var body = document.createElement("div");
    body.className = "tg-style";
    body.innerHTML =
      '<label class="field"><span class="pe-label">Name</span><input class="input tg-in-name" maxlength="20" value="' + UI.esc(pet.name) + '"></label>' +
      '<div class="field"><span class="pe-label">Color</span><div class="tg-colors">' + Object.keys(COLORS).map(function (c) {
        return '<button type="button" class="tg-color' + (c === pet.color ? " on" : "") + '" data-c="' + c + '" style="background:' + COLORS[c] + '" aria-label="' + c + '"></button>'; }).join("") + "</div></div>" +
      '<div class="field"><span class="pe-label">Wear</span><div class="tg-gear">' + GEAR.map(function (g) {
        var locked = pet.gear_unlocked.indexOf(g[0]) < 0;
        return '<button type="button" class="chip' + (g[0] === pet.gear ? " active" : "") + '" data-g="' + g[0] + '"' + (locked ? " disabled" : "") + ">" + g[1] + (locked ? " 🔒 Lv " + g[2] : "") + "</button>"; }).join("") + "</div></div>" +
      '<p class="faint small">Level up by caring for ' + UI.esc(pet.name) + ", writing in Daily, and playing with friends' Tigos.</p>";
    var m = TMN_MODAL.open({
      title: "Style", size: "sm", cls: "modal-sheet", body: body,
      actions: [{ label: "Done", cls: "btn-primary", onClick: async function () {
        var n = body.querySelector(".tg-in-name").value.trim();
        if (n && n !== pet.name) { try { pet = (await TMN_API.call("pet", "style", { name: n })).pet; paint(); } catch (e) { UI.toast(e.message); return; } }
        m.close();
      } }]
    });
    body.addEventListener("click", async function (e) {
      var c = e.target.closest("[data-c]"), g = e.target.closest("[data-g]");
      if (!c && !g) return;
      try {
        pet = (await TMN_API.call("pet", "style", c ? { color: c.dataset.c } : { gear: g.dataset.g })).pet;
        body.querySelectorAll("[data-c]").forEach(function (x) { x.classList.toggle("on", x.dataset.c === pet.color); });
        body.querySelectorAll("[data-g]").forEach(function (x) { x.classList.toggle("active", x.dataset.g === pet.gear); });
        applyStyle(); if (sc) sc.main.jump();
      } catch (er) { UI.toast(er.message); }
    });
  }
  document.querySelector(".tg-actions").addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
    if (b.dataset.a === "feed") return feedMenu();
    if (b.dataset.a === "style") return styleSheet();
    act(b.dataset.a);
  });
  $("tgName").addEventListener("click", styleSheet);

  // ---------- magkakalapit na kaibigan ----------
  function av(u) { return '<span class="avatar" style="--size:38px">' + (u && u.avatar_url ? '<img alt="" src="' + UI.esc(u.avatar_url) + '">' : UI.esc(UI.initials((u && (u.display_name || u.username)) || "?"))) + "</span>"; }
  function paintNear(list, msg) {
    var box = $("nearList");
    if (msg) { box.innerHTML = '<p class="faint small">' + UI.esc(msg) + "</p>"; return; }
    if (!list.length) { box.innerHTML = '<p class="faint small">No friends nearby right now. When a friend turns this on near you, they show up here.</p>'; return; }
    box.innerHTML = list.map(function (x) {
      var u = x.user || {};
      return '<div class="tg-friend">' + av(u) + '<div class="tg-friend-main"><b>' + UI.esc(u.display_name || u.username || "") + '</b><span class="faint small">' +
        UI.esc(x.pet.name) + " · Lv " + x.pet.level + " · " + (x.dist === "very close" ? "📍 Very close" : "📍 Nearby") + "</span></div>" +
        '<button type="button" class="btn btn-primary btn-sm" data-gather="' + u.id + '">' + (x.met_today ? "Play again" : "🎉 Gather") + "</button></div>";
    }).join("");
    box._list = list;
  }
  async function findNear() {
    if (!$("nearOn").checked) return;
    paintNear(null, "Looking for friends nearby…");
    try {
      var loc = await TMN_NATIVE.getLocation({ high: false, maxAge: 60000 });
      var r = await TMN_API.call("pet", "nearby", { on: true, lat: loc.lat, lng: loc.lng });
      paintNear(r.list || []);
    } catch (e) { paintNear(null, e.message); }
  }
  $("nearOn").addEventListener("change", async function () {
    clearInterval(nearTimer);
    if (this.checked) { findNear(); nearTimer = setInterval(function () { if (!document.hidden) findNear(); }, 60000); }
    else { paintNear([]); try { await TMN_API.call("pet", "nearby", { on: false }); } catch (e) {} }
  });
  $("nearList").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-gather]"); if (!b) return;
    b.disabled = true;
    try {
      var r = await TMN_API.call("pet", "gather", { user_id: b.dataset.gather });
      pet = r.pet; paint();
      var f = r.friend;
      if (sc) {
        if (!visitors[b.dataset.gather]) visitors[b.dataset.gather] = sc.add({ color: f.pet.color, gear: f.pet.gear });
        var v = visitors[b.dataset.gather];
        sc.effect("hearts"); sc.effect("hearts", v.group); sc.main.jump(); setTimeout(function () { v.jump(); sc.main.spin(); }, 500);
      }
      toast(r.first ? "🎉 " + pet.name + " played with " + f.pet.name + "! +15 fun" : pet.name + " and " + f.pet.name + " are playing 💕");
      loadVisits(); findNear();
    } catch (er) { toast(er.message); b.disabled = false; }
  });
  async function loadVisits() {
    try {
      var r = await TMN_API.call("pet", "visits", {});
      var loc = window.TMN_I18N ? TMN_I18N.locale : undefined;
      $("visits").innerHTML = r.list.length ? r.list.map(function (v) {
        var u = v.user || {};
        return '<div class="tg-friend">' + av(u) + '<div class="tg-friend-main"><b>' + UI.esc((v.pet && v.pet.name) || "Tigo") + '</b><span class="faint small">' +
          UI.esc(u.display_name || u.username || "") + " · " + new Date(v.at).toLocaleDateString(loc, { weekday: "short", month: "short", day: "numeric" }) + "</span></div>" +
          '<span class="tg-dot" style="background:' + (COLORS[(v.pet || {}).color] || COLORS.coral) + '"></span></div>';
      }).join("") : '<p class="faint small">No playdates yet. Turn on "Meet nearby friends" when you are with a friend.</p>';
    } catch (e) {}
  }

  // ---------- simula ----------
  async function init() {
    try { pet = (await TMN_API.call("pet", "get", {})).pet; }
    catch (e) { $("tgToast").textContent = e.message; $("tgToast").classList.add("show"); return; }
    paint();
    $("nearOn").checked = !!pet.near_on;
    if (pet.near_on) { findNear(); nearTimer = setInterval(function () { if (!document.hidden) findNear(); }, 60000); } else paintNear([]);
    var canGL = (function () { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
    if (canGL) start3d(); else fallback();
    loadVisits();
    setInterval(paint, 30000);
    // Binati ka ni Tigo
    var h = new Date().getHours();
    setTimeout(function () { toast((h < 12 ? "Good morning" : h < 18 ? "Hi" : "Good evening") + "! " + pet.name + " missed you 💛"); }, 900);
  }
  init();
})();
