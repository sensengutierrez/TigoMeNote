/* TigoMeNote · pages/tigo.js (app/tigo.html) — alagaan si Tigo (3D), lakad/takbo, closet, laro, journey, at kaibigang malapit
   3D: tigo/pet-scene.js (+ pet-model, backdrops, buddies, outfit). Kontrol: tigo/controls.js (WASD/arrows + Space, joystick, swipe).
   UI: tigo/closet-ui.js, tigo/games-ui.js (Coin Rush), tigo/journey-ui.js. Walang WebGL → 2D na sticker.
   Server: pet-fast (get, act, style, wear, buy, game, nearby, gather, visits). Stats: kinukuwenta rin dito para gumalaw ang bars. */
(function () {
  var UI = window.TMN_UI, $ = function (id) { return document.getElementById(id); };
  var pet = null, sc = null, ctl = null, busy = false, nearTimer = null, visitors = {}, firstNight = true, closet = null, playing = false, mods = {};
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SNACKS = [["🥖", "Pandesal"], ["🥭", "Mango"], ["🍚", "Rice"], ["🌴", "Dates"], ["🍧", "Halo-halo"], ["🍌", "Banana"]];
  var MOOD = { happy: ["😄", "Happy"], ok: ["🙂", "Okay"], sad: ["😢", "Sad"], sleepy: ["😴", "Sleepy"], sick: ["🤒", "Not well"] };
  var COLORS = { coral: "#ff7a59", amber: "#ffc04d", mint: "#3dd6c0", sky: "#7cc4ff", pink: "#ff9ec7", lilac: "#b9a2ff", lime: "#b8e65c", ink: "#3a3a40" };
  var NIGHT = "radial-gradient(120% 90% at 50% 0%, #2a2f5a 0%, #1a1d3a 55%, #0f1024 100%)";
  var LV_NEW = { 2: "🌱 Sprout", 3: "🎀 Bow", 4: "🧢 Cap", 5: "🎧 Headphones", 6: "new shop items", 7: "👑 Crown", 8: "+100 coins", 9: "+150 coins", 10: "Golden glow 🌟" };
  var mod = function (name) { return mods[name] || (mods[name] = import("../tigo/" + name + ".js?v=" + ((window.TMN_CONFIG || {}).version || ""))); };

  function toast(t) { var el = $("tgToast"); el.textContent = t; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); }
  function live() {
    if (!pet) return null;
    var hrs = Math.max(0, (Date.now() - new Date(pet.stats_at).getTime()) / 3600000), k = pet.asleep ? 1 : 0, out = Object.assign({}, pet);
    ["hunger", "joy", "energy", "clean"].forEach(function (s) { out[s] = Math.max(0, Math.min(100, Math.round(pet[s] - pet.rates[s][k] * hrs))); });
    return out;
  }
  var sky = "";
  function paintSky(p) { $("stage").style.background = p.asleep ? NIGHT : sky || ""; }
  function paint() {
    var p = live(); if (!p) return;
    $("tgNameTxt").textContent = p.name; $("tgLvl").textContent = "Lv " + p.level; $("tgCoins").textContent = p.coins;
    var m = MOOD[p.mood] || MOOD.ok; $("tgMood").innerHTML = m[0] + ' <span class="tg-mood-t">' + m[1] + "</span>"; $("tgMood").title = m[1];
    $("tgXp").style.width = Math.round(100 * (p.xp - p.prev) / Math.max(1, p.next - p.prev)) + "%";
    document.querySelectorAll(".tg-stat").forEach(function (s) {
      var v = p[s.dataset.s], bar = s.querySelector("i");
      bar.style.width = v + "%"; s.classList.toggle("low", v < 25); s.setAttribute("aria-label", s.textContent.trim() + " " + v + "%");
    });
    var sb = $("sleepBtn"); sb.innerHTML = p.asleep ? "<span>☀️</span>Wake up" : "<span>🌙</span>Sleep"; sb.dataset.a = p.asleep ? "wake" : "sleep";
    document.querySelectorAll(".tg-act").forEach(function (b) { if (["feed", "play", "games"].indexOf(b.dataset.a) >= 0) b.disabled = !!p.asleep; });
    $("stage").classList.toggle("night", !!p.asleep); paintSky(p);
    if (sc) { sc.main.setMood(p.mood); sc.main.sleep(p.asleep); sc.night(p.asleep, !firstNight); firstNight = false; }
  }
  // Isuot sa 3D (o sa 2D fallback: langit lang)
  function dress(o, color) {
    o = o || {};
    if (!sc) { mod("backdrops").then(function (b) { sky = b.SKY[o.backdrop || "island"]; paintSky(live() || {}); }); return; }
    sc.main.setColor(color || pet.color);
    ["hat", "face", "body", "hand"].forEach(function (s) { if ((sc.main.worn[s] || null) !== (o[s] || null)) sc.main.wear(s, o[s] || null); });
    sc.setBuddy(o.buddy || null);
    sky = sc.setBackdrop(o.backdrop || "island"); paintSky(live() || {});
    sc.main.setGlow(!!pet.glow);
  }

  // ---------- 3D ----------
  async function start3d() {
    try {
      var m = await mod("pet-scene"), c = await mod("controls");
      sc = m.createScene($("tgCanvas"), { reduced: reduced, pet: { color: pet.color }, backdrop: (pet.outfit || {}).backdrop });
      dress(pet.outfit, pet.color); paint();
      var cv = $("tgCanvas");
      ctl = c.createControls({
        stage: $("stage"), pad: $("tgPad"), jumpBtn: $("tgJump"),
        onJump: function () { sc.jump(); },
        onTap: function (e) {
          var r = cv.getBoundingClientRect();
          if (!playing && sc.pick(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))) act("pet");
        },
      });
      sc.setInput(ctl.state);
      cv.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = cv.getBoundingClientRect();
        sc.main.lookAt(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      });
      $("stage").classList.add("live"); $("stage").tigo = sc; // para sa tests
    } catch (e) { console.warn("3D off", e); fallback(); }
  }
  function fallback() {
    sc = null; $("tgCanvas").classList.add("hidden"); $("stage").classList.remove("live");
    var f = $("tgFallback"); f.classList.remove("hidden");
    var p = live() || {}, id = p.asleep ? "tigo-sleep" : p.mood === "sad" || p.mood === "sick" ? "tigo-miss" : "tigo-hello";
    f.innerHTML = window.TMN_STICKERS ? TMN_STICKERS.svg(id, 220) : "";
    f.onclick = function () { act("pet"); };
    dress(pet.outfit);
  }

  // ---------- pag-aalaga ----------
  async function act(what, label) {
    if (busy) return;
    if (!navigator.onLine) { toast("Tigo needs internet right now."); return; }
    busy = true;
    if (sc) {
      if (what === "feed") { sc.effect("food"); setTimeout(function () { sc.main.eat(); }, 450); }
      if (what === "play") { sc.effect("ball"); sc.jump(); setTimeout(function () { sc.jump(); }, 800); setTimeout(function () { sc.main.spin(); }, 1500); }
      if (what === "clean") { sc.effect("bubbles"); sc.main.wiggle(); }
      if (what === "pet") { sc.effect("hearts"); sc.main.wiggle(); }
    }
    try {
      var r = await TMN_API.call("pet", "act", { do: what });
      pet = r.pet; paint();
      if (r.msg === "full") toast("Tigo is full! 😋");
      else if (r.msg === "clean") toast("Tigo is already clean ✨");
      else if (what === "feed") toast("Yum! " + (label || "") + " 😋");
      else if (what === "play") toast("Wheee! ⚽");
      else if (what === "clean") toast("Squeaky clean! 🫧");
      else if (what === "sleep") toast("Good night, " + pet.name + " 🌙 Going home to the bahay kubo…");
      else if (what === "wake") toast("Good morning! ☀️");
      if (r.levelUp) levelUp(r.levelUp);
    } catch (e) { toast(e.message); }
    finally { busy = false; }
  }
  function levelUp(n) {
    if (sc) { sc.effect("stars"); sc.main.spin(); sc.main.setGlow(!!pet.glow); }
    if (navigator.vibrate) try { navigator.vibrate([80, 60, 80]); } catch (e) {}
    UI.toast("🎉 Level " + n + "!" + (LV_NEW[n] ? " New: " + LV_NEW[n] : "") + " +🪙", 4000);
  }
  function feedMenu() {
    var body = document.createElement("div"); body.className = "tg-snacks";
    body.innerHTML = SNACKS.map(function (s) { return '<button type="button" data-s="' + s[1] + '"><span>' + s[0] + "</span>" + s[1] + "</button>"; }).join("");
    var m = TMN_MODAL.open({ title: "Feed " + pet.name, size: "sm", cls: "modal-sheet", body: body });
    body.addEventListener("click", function (e) { var b = e.target.closest("[data-s]"); if (b) { m.close(); act("feed", b.dataset.s); } });
  }
  async function openCloset() {
    if (closet) return;
    var c = await mod("closet-ui");
    document.body.classList.add("tg-closet-on");
    closet = c.openCloset({
      host: $("tgSide"), pet: pet, esc: UI.esc,
      call: function (a, b) { return TMN_API.call("pet", a, b); },
      onPreview: function (o, color) { dress(o, color); if (sc) sc.jump(); },
      onPet: function (p) { pet = p; paint(); },
      onClose: function () { closet = null; document.body.classList.remove("tg-closet-on"); },
    });
    if (matchMedia("(max-width: 999px)").matches) $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function openJourney() {
    var j = await mod("journey-ui");
    TMN_MODAL.open({ title: "Growth journey", size: "sm", cls: "modal-sheet", body: j.journeyNode(live(), UI.esc) });
  }
  async function openGames() {
    var g = await mod("games-ui");
    var m = TMN_MODAL.open({ title: "Games", size: "sm", cls: "modal-sheet", body: g.gamesNode(function (id) { m.close(); if (id === "coins") coinRush(); }) });
  }
  async function coinRush() {
    if (!sc) { toast("Games need 3D (WebGL) on this device."); return; }
    if (playing) return;
    var p = live();
    if (p.asleep) { toast("Shh… Tigo is sleeping."); return; }
    if (p.energy < 12) { toast("Tigo is too tired to play. Let Tigo sleep."); return; }
    playing = true;
    $("stage").scrollIntoView({ behavior: "smooth", block: "center" });
    var g = await mod("games-ui");
    var res = await g.runCoinRush(sc, $("stage"), Number($("stage").dataset.rush) || 30); // data-rush = mas maikli sa tests
    try {
      var r = await TMN_API.call("pet", "game", { score: res.score, ms: res.ms });
      pet = r.pet; paint();
      toast(r.capped ? "Great run! Coin limit for today reached — come back tomorrow 🌙" : r.coins ? "+" + r.coins + " coins! 🪙" : "No coins this time — try again!");
      if (r.coins) sc.effect("stars");
      if (r.levelUp) levelUp(r.levelUp);
    } catch (e) { toast(e.message); }
    playing = false;
  }
  $("tgSide").addEventListener("click", function (e) {
    var b = e.target.closest(".tg-act[data-a]"); if (!b || b.disabled) return;
    var a = b.dataset.a;
    if (a === "feed") return feedMenu();
    if (a === "closet") return openCloset();
    if (a === "games") return openGames();
    if (a === "journey") return openJourney();
    act(a);
  });
  $("tgName").addEventListener("click", openCloset);
  $("tgCoinsBtn").addEventListener("click", openGames);

  // ---------- full screen / landscape ----------
  $("tgFull").addEventListener("click", async function () {
    var st = $("stage"), on = !st.classList.contains("full");
    st.classList.toggle("full", on); document.body.classList.toggle("tg-full", on);
    this.setAttribute("aria-pressed", on);
    try {
      if (on) { if (st.requestFullscreen) await st.requestFullscreen(); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); }
      else { if (document.fullscreenElement) await document.exitFullscreen(); if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
    } catch (e) { /* ok lang kung hindi suportado */ }
  });
  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement && $("stage").classList.contains("full")) { $("stage").classList.remove("full"); document.body.classList.remove("tg-full"); $("tgFull").setAttribute("aria-pressed", "false"); }
  });

  // ---------- magkakalapit na kaibigan ----------
  function av(u) { return '<span class="avatar" style="--size:38px">' + (u && u.avatar_url ? '<img alt="" src="' + UI.esc(u.avatar_url) + '">' : UI.esc(UI.initials((u && (u.display_name || u.username)) || "?"))) + "</span>"; }
  var DIST = { "right here": "📍 Right here", "very close": "📍 Very close", nearby: "📍 Nearby" };
  function paintNear(list, msg) {
    var box = $("nearList");
    if (msg) { box.innerHTML = '<p class="faint small">' + UI.esc(msg) + "</p>"; return; }
    if (!list.length) { box.innerHTML = '<p class="faint small">No friends nearby right now. You need to be close together (about 200 m) with both switches on.</p>'; return; }
    box.innerHTML = list.map(function (x) {
      var u = x.user || {};
      return '<div class="tg-friend">' + av(u) + '<div class="tg-friend-main"><b>' + UI.esc(u.display_name || u.username || "") + '</b><span class="faint small">' +
        UI.esc(x.pet.name) + " · Lv " + x.pet.level + " · " + (DIST[x.dist] || DIST.nearby) + "</span></div>" +
        '<button type="button" class="btn btn-primary btn-sm" data-gather="' + u.id + '">' + (x.met_today ? "Play again" : "🎉 Gather") + "</button></div>";
    }).join("");
  }
  async function findNear() {
    if (!$("nearOn").checked) return;
    paintNear(null, "Looking for friends nearby…");
    try {
      var loc = await TMN_NATIVE.getLocation({ high: true, maxAge: 30000, timeout: 15000 });
      var r = await TMN_API.call("pet", "nearby", { on: true, lat: loc.lat, lng: loc.lng, acc: loc.acc });
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
        if (!visitors[b.dataset.gather]) {
          var v0 = visitors[b.dataset.gather] = sc.add({ color: f.pet.color });
          var o = f.pet.outfit || (f.pet.gear && f.pet.gear !== "none" ? { hat: f.pet.gear } : {});
          ["hat", "face", "body", "hand"].forEach(function (s) { if (o[s]) v0.wear(s, o[s]); });
          v0.setGlow(!!f.pet.glow);
        }
        var v = visitors[b.dataset.gather];
        sc.effect("hearts"); sc.effect("hearts", v.group); sc.jump(); setTimeout(function () { v.jump(); sc.main.spin(); }, 500);
        $("tgTogether").classList.remove("hidden");
        setTimeout(function () { together("dance"); }, 1400); // sayaw agad pagdating ng kaibigan
      }
      toast(r.first ? "🎉 " + pet.name + " played with " + f.pet.name + "! +15 fun" : pet.name + " and " + f.pet.name + " are playing 💕");
      loadVisits(); findNear();
    } catch (er) { toast(er.message); b.disabled = false; }
  });
  // sabay na galaw: sayaw, high five, habulan, ikot, bow (sa 3D lang)
  var TOG = { dance: "💃 Dance party!", highfive: "🙌 High five!", chase: "🏃 Habulan! Catch them!", spin: "🔄 Ikot-ikot!", bow: "🙇 Thank you, friend!" };
  function together(kind) {
    if (!sc || playing || sc.isShowing()) return;
    var sec = sc.together(kind); if (!sec) return;
    toast(TOG[kind] || "");
    var bar = $("tgTogether"); bar.querySelectorAll("button").forEach(function (b) { b.disabled = true; b.classList.toggle("on", b.dataset.t === kind); });
    setTimeout(function () { bar.querySelectorAll("button").forEach(function (b) { b.disabled = false; b.classList.remove("on"); }); }, sec * 1000);
  }
  $("tgTogether").addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (b && !b.disabled) together(b.dataset.t); });

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
    var h = new Date().getHours(), touch = matchMedia("(pointer: coarse)").matches;
    setTimeout(function () { toast((h < 12 ? "Good morning" : h < 18 ? "Hi" : "Good evening") + "! " + pet.name + " missed you 💛"); }, 900);
    if (!touch) setTimeout(function () { toast("Tip: W A S D / arrow keys to walk, Space to jump"); }, 4200);
  }
  init();
})();
