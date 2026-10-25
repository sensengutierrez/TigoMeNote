/* TigoMeNote · pages/tigo.js (app/tigo.html) — alagaan si Tigo (3D), lakad/takbo, closet, laro, journey, at kaibigang malapit
   3D: tigo/pet-scene.js (+ pet-model, backdrops, buddies, outfit, camera-rig, sky-dome, room, furniture).
   Kontrol: tigo/controls.js — joystick = lakad; ⤒ Jump · 🏃 Run · ✋ Stop · 🎥 Camera (Follow → Wide → Top → Close-up);
            swipe sa gitna = ikot 360° / tingala (camera-rig.js); pinch = zoom.
   Game UI (phone/tablet, "ui-game"): menu (dock), mini stats at sheet (Closet, Decorate) ay nasa LOOB ng laro;
            landscape sa phone/APK o Full screen = buong screen na laro ("game").
   Bahay: lumakad sa pinto o 🏠 House → loob ng bahay; 🛠 Decorate = tigo/room-ui.js.
   UI: tigo/closet-ui.js, tigo/games-ui.js (Coin Rush, Pac-Tigo, Racing), tigo/journey-ui.js. Walang WebGL → 2D na sticker.
   Boses: tigo/voice.js + tigo/talk.js (nagsasalita parang baby; ⚙️ = Sound settings, naka-save sa device).
   Server: pet-fast (get, act, style, wear, buy, game, nearby, gather, visits). Stats: kinukuwenta rin dito para gumalaw ang bars. */
(function () {
  var UI = window.TMN_UI, $ = function (id) { return document.getElementById(id); };
  var pet = null, sc = null, ctl = null, decor = null, busy = false, nearTimer = null, visitors = {}, firstNight = true, closet = null, playing = false, mods = {}, voice = null, talk = null, gameJump = null;
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
    var ds = $("tgDockSleep"); ds.innerHTML = p.asleep ? "☀️<small>Wake</small>" : "🌙<small>Sleep</small>"; ds.dataset.a = p.asleep ? "wake" : "sleep";
    document.querySelectorAll(".tg-act, .tg-dbtn[data-a]").forEach(function (b) { if (["feed", "play", "games"].indexOf(b.dataset.a) >= 0) b.disabled = !!p.asleep; });
    document.querySelectorAll("#tgMini [data-s]").forEach(function (m) { var v = p[m.dataset.s]; m.querySelector("b").style.width = v + "%"; m.classList.toggle("low", v < 25); m.title = m.title.split(" ")[0] + " " + v + "%"; });
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
      sc = m.createScene($("tgCanvas"), { reduced: reduced, pet: { color: pet.color }, backdrop: (pet.outfit || {}).backdrop, el: $("stage"), onDoor: doorBar, size: loadSize(),
        onRoom: function (on) { $("stage").classList.toggle("in-room", on); if (!on && decor) decor.close(); if (on) say("home", { still: true }); },
        onPose: function (p) {
          var st = $("stage"), j = $("tgJump");
          st.classList.toggle("pose-sit", p === "sit"); st.classList.toggle("pose-bed", p === "bed");
          j.textContent = p === "stand" ? "⤒" : "⬆ Tayo"; j.setAttribute("aria-label", p === "stand" ? "Jump" : "Stand up");
        } });
      paintSize(loadSize());
      sc.setRoom(pet.room);
      dress(pet.outfit, pet.color); paint();
      var cv = $("tgCanvas");
      ctl = c.createControls({
        stage: $("stage"), pad: $("tgPad"), jumpBtn: $("tgJump"), runBtn: $("tgRun"), stopBtn: $("tgStop"),
        onStop: function () { if (gameJump) return; sc.stop(); },
        onJump: function () {
          if (gameJump) return gameJump();
          var ps = sc.pose();
          if (ps === "bed") { if ((live() || {}).asleep) act("wake"); else sc.standUp(); return; } // ⬆ Tayo = gising
          if (ps === "sit") { sc.standUp(); return; }
          if (!sc.isInside()) { sc.jump(); if (voice) voice.sfx("jump"); }
        },
        onTap: function (e) {
          var r = cv.getBoundingClientRect();
          if (!playing && sc.pick(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))) act("pet");
        },
      });
      sc.setInput(ctl.state); sc.setRun(ctl.running);
      cv.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = cv.getBoundingClientRect();
        sc.main.lookAt(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      });
      $("stage").classList.add("live"); $("stage").tigo = sc; // para sa tests
    } catch (e) { console.warn("3D off", e); fallback(); }
    startVoice();
  }
  // ---------- camera: View at Zoom ----------
  // ---------- sa loob ng bahay: 🪑 Sit at 🛏️ Sleep ----------
  $("tgSit").addEventListener("click", function () {
    if (!sc) return;
    if (sc.pose() === "sit") { sc.standUp(); return; }
    if (sc.pose() === "bed") { toast("Tigo is in bed 🛏️ Tap ⬆ Tayo first."); return; }
    if (sc.sit()) say("Sit down!", { still: true });
  });
  $("tgBed").addEventListener("click", function () {
    var p = live() || {};
    if (p.asleep) { toast("Tigo is already sleeping 🌙"); return; }
    act("sleep");
  });
  // ---------- 💃 Dance: pindot → 3 sayaw (Groove · Budots · Robot) ----------
  var DANCE_NAME = { dance: "🪩 Groove", budots: "🕺 Budots", robot: "🤖 Robot" };
  function danceRow(open) {
    $("tgDanceRow").classList.toggle("hidden", !open); $("tgDance").setAttribute("aria-expanded", String(!!open)); $("tgDance").classList.toggle("on", !!open);
  }
  $("tgDance").addEventListener("click", function () { danceRow($("tgDanceRow").classList.contains("hidden")); });
  $("tgDanceRow").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dance]"); if (!b || !sc) return;
    if ((live() || {}).asleep) { toast("Shh… Tigo is sleeping. Wake Tigo first."); return; }
    if (playing) return;
    var sec = sc.dance(b.dataset.dance); if (!sec) return;
    danceRow(false); toast(DANCE_NAME[b.dataset.dance] + "! 🎶"); say("dance");
    if (voice) voice.sfx("go");
  });
  // ---------- laki ni Tigo (naka-save sa device) ----------
  var SIZE_KEY = "tmnTigoSize";
  function loadSize() { try { var v = parseFloat(localStorage.getItem(SIZE_KEY)); return v >= 0.5 && v <= 1.3 ? v : 1; } catch (e) { return 1; } }
  function paintSize(k) {
    var f = (k - 0.5) / 0.8, el = $("tgSize");
    el.querySelector(".tg-size-fill").style.height = Math.round(f * 100) + "%";
    el.querySelector(".tg-size-thumb").style.bottom = Math.round(f * 100) + "%";
    el.setAttribute("aria-valuenow", String(Math.round(k * 100))); el.title = "Size " + Math.round(k * 100) + "%";
  }
  function setSize(k, save) {
    k = Math.max(0.5, Math.min(1.3, Math.round(k * 100) / 100));
    if (sc) sc.setSize(k); paintSize(k);
    if (save) try { localStorage.setItem(SIZE_KEY, String(k)); } catch (e) {}
    return k;
  }
  (function () {
    var el = $("tgSize"), tr = el.querySelector(".tg-size-track"), id = null;
    function at(e) { var r = tr.getBoundingClientRect(); return 0.5 + 0.8 * Math.max(0, Math.min(1, (r.bottom - e.clientY) / r.height)); }
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); id = e.pointerId; try { el.setPointerCapture(id); } catch (er) {} setSize(at(e)); });
    el.addEventListener("pointermove", function (e) { if (e.pointerId === id) setSize(at(e)); });
    function end(e) { if (e.pointerId !== id) return; id = null; setSize(at(e), true); }
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", function () { id = null; });
    el.addEventListener("keydown", function (e) {
      var k = loadSize(), d = e.key === "ArrowUp" || e.key === "ArrowRight" ? 0.05 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -0.05 : 0;
      if (d) { e.preventDefault(); e.stopPropagation(); setSize(k + d, true); }
    });
    paintSize(loadSize());
  })();
  // isang button lang (parang MIR4): Follow → Wide → Top → Close-up
  var VIEW = { follow: ["🎥", "Follow view"], wide: ["🔭", "Wide view"], top: ["🗺️", "Top view"], close: ["🔍", "Close-up"] };
  $("tgView").addEventListener("click", function () {
    if (!sc) return; var v = sc.rig.next(), x = VIEW[v];
    this.textContent = x[0]; this.setAttribute("aria-label", "Camera: " + x[1]); toast(x[0] + " " + x[1]);
  });
  // ---------- game UI: phone/tablet (lahat nasa loob ng laro) at landscape (buong screen) ----------
  var mqUI = matchMedia("(max-width: 999px), (pointer: coarse)"), mqLand = matchMedia("(pointer: coarse) and (orientation: landscape)");
  function uiGame() { return mqUI.matches || $("stage").classList.contains("full"); }
  function layout() {
    var st = $("stage"), g = mqLand.matches || st.classList.contains("full");
    st.classList.toggle("ui-game", mqUI.matches || g); st.classList.toggle("game", g); document.body.classList.toggle("tg-game", g);
  }
  [mqUI, mqLand].forEach(function (m) { if (m.addEventListener) m.addEventListener("change", layout); });
  layout();
  $("tgDockMin").addEventListener("click", function () {
    var on = $("stage").classList.toggle("dock-min"); this.setAttribute("aria-expanded", String(!on)); this.setAttribute("aria-label", on ? "Show menu" : "Hide menu");
  });
  $("tgDock").addEventListener("click", function (e) { var b = e.target.closest(".tg-dbtn[data-a]"); if (b && !b.disabled) doAction(b.dataset.a); });
  // Sheet sa loob ng laro (Closet, Decorate): ▾ = minimize, ✕ = sara
  var sheetClose = null;
  function openSheet(title, onClose) {
    var sh = $("tgSheet"); if (sheetClose) sheetClose();
    $("tgSheetTitle").textContent = title; sh.classList.remove("hidden", "min"); $("stage").classList.add("sheet-open");
    sheetClose = onClose; return $("tgSheetBody");
  }
  function closeSheet() { $("tgSheet").classList.add("hidden"); $("tgSheet").classList.remove("min"); $("stage").classList.remove("sheet-open"); $("tgSheetBody").innerHTML = ""; sheetClose = null; }
  $("tgSheet").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sheet]"); if (!b) return;
    if (b.dataset.sheet === "min") { var m = $("tgSheet").classList.toggle("min"); b.setAttribute("aria-label", m ? "Expand" : "Minimize"); }
    else if (sheetClose) sheetClose();
  });
  // ---------- bahay: pasok, labas, Decorate ----------
  function doorBar(st) {
    var bar = $("tgDoorBar");
    bar.innerHTML = playing ? "" : st === "near" ? '<button type="button" class="tg-dbtn wide go" data-door="in">🏠 Go inside</button>'
      : st === "room" ? '<button type="button" class="tg-dbtn wide" data-door="out">🚪 Go outside</button><button type="button" class="tg-dbtn wide go" data-door="decor">🛠 Decorate</button>' : "";
  }
  $("tgDoorBar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-door]"); if (!b || !sc) return;
    var d = b.dataset.door;
    if (d === "in") goHome();
    if (d === "out") { if ((live() || {}).asleep) { toast("Shh… Tigo is sleeping. Wake Tigo first."); return; } sc.leaveRoom(); }
    if (d === "decor") openDecor();
  });
  function goHome() {
    if (!sc) { toast("The house needs 3D (WebGL) on this device."); return; }
    if (sc.inRoom()) return;
    if ((live() || {}).asleep) { toast("Tigo is already sleeping inside 🌙"); return; }
    sc.enterRoom();
    if (uiGame()) $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function openDecor() {
    if (decor || !sc || !sc.inRoom()) return;
    if (closet) closet.close();
    var r = await mod("room-ui");
    document.body.classList.add("tg-closet-on");
    var inGame = uiGame();
    decor = r.openRoomEditor({
      host: inGame ? openSheet("🏠 Decorate", function () { if (decor) decor.close(); }) : $("tgSide"), stage: $("stage"), canvas: $("tgCanvas"), sc: sc, pet: pet, esc: UI.esc,
      call: function (a, b) { return TMN_API.call("pet", a, b); },
      onPet: function (p) { pet = p; paint(); },
      onClose: function () { decor = null; document.body.classList.remove("tg-closet-on"); if (inGame) closeSheet(); },
    });
    if (inGame) $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- boses ni Tigo ----------
  async function startVoice() {
    try {
      var v = await mod("voice"), t = await mod("talk");
      voice = v.createVoice(); talk = t.createTalk({ stage: $("stage"), sc: sc, voice: voice, getPet: live });
      $("stage").voice = voice;
      var unlock = function () { voice.unlock(); };
      document.addEventListener("pointerdown", unlock, { once: true }); document.addEventListener("keydown", unlock, { once: true });
      var p = live(), h = new Date().getHours();
      setTimeout(function () { if (!p.asleep) say(h < 11 ? "morning" : "hello"); }, 1400);
      talk.idle(true);
    } catch (e) { console.warn("voice off", e); }
  }
  function say(k, o) { if (talk && !playing) talk.say(k, o); }
  async function soundSheet() {
    var v = await mod("voice"), S = voice ? voice.get() : v.loadSound();
    var body = document.createElement("div"); body.className = "tg-sound";
    var row = function (id, label, val) { return '<label class="tg-range"><span>' + label + '</span><input type="range" min="0" max="100" step="5" data-k="' + id + '" value="' + Math.round(val * 100) + '"><b>' + Math.round(val * 100) + "</b></label>"; };
    body.innerHTML =
      '<label class="tg-sw"><span><b>Tigo talks</b><small class="faint">Baby voice when you play and care</small></span><label class="switch"><input type="checkbox" data-k="voice"' + (S.voice ? " checked" : "") + "><span></span></label></label>" +
      '<div class="tg-seg" role="radiogroup" aria-label="Voice style">' + [["babble", "👶 Baby babble"], ["words", "🗣️ Baby words"]].map(function (x) { return '<button type="button" role="radio" data-style="' + x[0] + '" aria-checked="' + (S.style === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      row("voiceVol", "🔊 Voice volume", S.voiceVol) + row("pitch", "🎵 Voice pitch (low → high)", S.pitch) + row("sfxVol", "🎮 Game sounds", S.sfxVol) +
      '<label class="tg-sw"><span><b>Chatty Tigo</b><small class="faint">Talks now and then (hungry, sleepy, bored)</small></span><label class="switch"><input type="checkbox" data-k="chatty"' + (S.chatty ? " checked" : "") + "><span></span></label></label>" +
      '<button type="button" class="btn btn-ghost btn-sm" data-test>▶ Test voice</button>' +
      '<p class="faint small">"Baby words" uses your phone or computer\'s speech voice. Saved on this device.</p>';
    function save(ch) { S = Object.assign(S, ch); v.saveSound(S); if (voice) voice.set(S); }
    body.addEventListener("input", function (e) {
      var k = e.target.dataset.k; if (!k) return;
      if (e.target.type === "range") { e.target.nextElementSibling.textContent = e.target.value; save(Object.fromEntries([[k, e.target.value / 100]])); }
      else save(Object.fromEntries([[k, e.target.checked]]));
    });
    body.addEventListener("change", function (e) { if (e.target.type === "range" && e.target.dataset.k !== "sfxVol") say("happy", { still: true }); if (e.target.dataset.k === "sfxVol" && voice) voice.sfx("coin"); });
    body.addEventListener("click", function (e) {
      var st = e.target.closest("[data-style]");
      if (st) { save({ style: st.dataset.style }); body.querySelectorAll("[data-style]").forEach(function (b) { b.setAttribute("aria-checked", b === st); }); say("hello", { still: true }); }
      if (e.target.closest("[data-test]")) { if (voice) voice.unlock(); say("pet", { still: true }); }
    });
    TMN_MODAL.open({ title: "Sound", size: "sm", cls: "modal-sheet", body: body });
  }
  function fallback() {
    sc = null; $("tgCanvas").classList.add("hidden"); $("stage").classList.remove("live");
    var f = $("tgFallback"); f.classList.remove("hidden");
    var p = live() || {}, id = p.asleep ? "tigo-sleep" : p.mood === "sad" || p.mood === "sick" ? "tigo-miss" : "tigo-hello";
    f.innerHTML = window.TMN_STICKERS ? TMN_STICKERS.svg(id, 220) : "";
    f.onclick = function () { act("pet"); };
    dress(pet.outfit);
    if (!talk) startVoice();
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
      say(r.msg === "full" ? "full" : r.msg === "clean" ? "clean" : what === "wake" ? "morning" : what === "sleep" ? "night" : what);
      if (voice) voice.sfx(what === "feed" ? "eat" : what === "pet" ? "pop" : what === "play" ? "jump" : "pop");
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
  // ---------- 📸 litrato (tigo/photo.js) ----------
  function photo(level) {
    if (!sc) { toast("Photos need 3D (WebGL) on this device."); return; }
    if (playing) { toast("Finish the game first 🎮"); return; }
    var p = live() || pet, names = Object.keys(visitors).map(function (k) { return visitors[k].petName; }).filter(Boolean);
    if (voice) voice.sfx("pop");
    mod("photo").then(function (P) { return P.takePhoto({ sc: sc, stage: $("stage"), pet: { name: p.name, level: p.level }, friends: names, place: sc.inRoom() ? "house" : "island", level: level || 0, toast: toast }); })
      .then(function (f) { if (f && level) shareLevelChip(0); })
      .catch(function () { toast("Couldn't take the photo. Try again."); });
  }
  // pagka-level up: ang 📸 button ay nagiging "🎉 Lv N" (mga 45s) → tap = litrato na may Level banner, pang-share
  var lvPending = 0, lvTimer = null;
  function photoBtns() { return [$("tgPhoto")].concat([].slice.call(document.querySelectorAll('.tg-act[data-a="photo"]'))); }
  function shareLevelChip(n) {
    lvPending = n || 0; clearTimeout(lvTimer);
    photoBtns().forEach(function (b) {
      var side = b.classList.contains("tg-act");
      b.classList.toggle("lvshare", !!n);
      b.innerHTML = n ? (side ? "<span>🎉</span>Share Lv " + n : "🎉<small>Lv " + n + "</small>") : (side ? "<span>📸</span>Photo" : "📸<small>Photo</small>");
      b.setAttribute("aria-label", n ? "Share Level " + n + " photo" : "Photo");
    });
    if (n) {
      var d = $("tgPhoto"); try { d.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) {}
      lvTimer = setTimeout(function () { shareLevelChip(0); }, 45000);
    }
  }
  function levelUp(n) {
    shareLevelChip(n);
    if (sc) { sc.effect("stars"); sc.main.spin(); sc.main.setGlow(!!pet.glow); }
    if (navigator.vibrate) try { navigator.vibrate([80, 60, 80]); } catch (e) {}
 say("level"); if (voice) voice.sfx("level");
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
    if (decor) decor.close();
    var c = await mod("closet-ui");
    document.body.classList.add("tg-closet-on");
    var inGame = uiGame();
    closet = c.openCloset({
      host: inGame ? openSheet("👗 Closet", function () { if (closet) closet.close(); }) : $("tgSide"), pet: pet, esc: UI.esc,
      call: function (a, b) { return TMN_API.call("pet", a, b); },
      onPreview: function (o, color) { dress(o, color); if (sc) sc.jump(); },
      onPet: function (p) { pet = p; paint(); },
      onClose: function () { closet = null; document.body.classList.remove("tg-closet-on"); if (inGame) closeSheet(); },
    });
    if (inGame) $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function openJourney() {
    var j = await mod("journey-ui");
    TMN_MODAL.open({ title: "Growth journey", size: "sm", cls: "modal-sheet", body: j.journeyNode(live(), UI.esc) });
  }
  async function openGames() {
    var g = await mod("games-ui");
    var m = TMN_MODAL.open({ title: "Games", size: "sm", cls: "modal-sheet", body: g.gamesNode(function (id) { m.close(); playGame(id); }) });
  }
  async function playGame(kind) {
    if (!sc) { toast("Games need 3D (WebGL) on this device."); return; }
    if (playing) return;
    var p = live();
    if (p.asleep) { toast("Shh… Tigo is sleeping."); return; }
    if (p.energy < 12) { toast("Tigo is too tired to play. Let Tigo sleep."); return; }
    playing = true;
    if (decor) decor.close();
    if (closet) closet.close();
    $("tgDoorBar").innerHTML = "";
    $("stage").scrollIntoView({ behavior: "smooth", block: "center" });
    var g = await mod("games-ui");
    if (talk) talk.idle(false);
    var res = await g.runGame(kind, { sc: sc, stage: $("stage"), voice: voice, seconds: kind === "coins" ? Number($("stage").dataset.rush) || 30 : undefined, // data-rush = mas maikli sa tests
      onJump: function (fn) { gameJump = fn; } });
    gameJump = null; playing = false; if (talk) talk.idle(true);
    say(res.win || res.place === 1 || res.score >= 10 ? "win" : "lose");
    if (res.quit && !res.score) return;
    try {
      var r = await TMN_API.call("pet", "game", { kind: kind, score: res.score, ms: res.ms });
      pet = r.pet; paint();
      toast(r.capped ? "Great run! Coin limit for today reached — come back tomorrow 🌙" : r.coins ? "+" + r.coins + " coins! 🪙" : "No coins this time — try again!");
      if (r.coins) sc.effect("stars");
      if (r.levelUp) levelUp(r.levelUp);
    } catch (e) { toast(e.message); }
  }
  function doAction(a) {
    if (a === "feed") return feedMenu();
    if (a === "closet") return openCloset();
    if (a === "games") return openGames();
    if (a === "journey") return openJourney();
    if (a === "house") return goHome();
    if (a === "photo") return photo(lvPending);
    act(a);
  }
  $("tgSide").addEventListener("click", function (e) { var b = e.target.closest(".tg-act[data-a]"); if (b && !b.disabled) doAction(b.dataset.a); });
  $("tgName").addEventListener("click", openCloset);
  $("tgCoinsBtn").addEventListener("click", openGames);
  $("tgSound").addEventListener("click", soundSheet);

  // ---------- full screen / landscape ----------
  $("tgFull").addEventListener("click", async function () {
    var st = $("stage"), on = !st.classList.contains("full");
    st.classList.toggle("full", on); document.body.classList.toggle("tg-full", on); layout();
    this.setAttribute("aria-pressed", on);
    try {
      // buong page ang full screen (hindi lang ang stage) para makita pa rin ang mga sheet at menu (Feed, Games, Sound)
      var de = document.documentElement;
      if (on) { if (de.requestFullscreen) await de.requestFullscreen(); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); }
      else { if (document.fullscreenElement) await document.exitFullscreen(); if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
    } catch (e) { /* ok lang kung hindi suportado */ }
  });
  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement && $("stage").classList.contains("full")) { $("stage").classList.remove("full"); document.body.classList.remove("tg-full"); $("tgFull").setAttribute("aria-pressed", "false"); layout(); }
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
        if (sc.inRoom() && !(live() || {}).asleep) sc.leaveRoom();
        if (!visitors[b.dataset.gather]) {
          var v0 = visitors[b.dataset.gather] = sc.add({ color: f.pet.color }); v0.petName = f.pet.name;
          var o = f.pet.outfit || (f.pet.gear && f.pet.gear !== "none" ? { hat: f.pet.gear } : {});
          ["hat", "face", "body", "hand"].forEach(function (s) { if (o[s]) v0.wear(s, o[s]); });
          v0.setGlow(!!f.pet.glow);
        }
        var v = visitors[b.dataset.gather];
        sc.effect("hearts"); sc.effect("hearts", v.group); sc.jump(); setTimeout(function () { v.jump(); sc.main.spin(); }, 500); say("friend");
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
    if (sc.inRoom()) { toast("Go outside to play together 🏝️"); return; }
    var sec = sc.together(kind); if (!sec) return;
    say(kind === "dance" ? "dance" : kind === "bow" ? "Thank you, friend!" : kind === "highfive" ? "High five!" : kind === "chase" ? "Catch me!" : "Wheee!");
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
    setTimeout(function () { toast(touch ? "Tip: stick = walk · swipe = look around 👀" : "Tip: W A S D to walk · Shift to run · drag to look around"); }, 4200);
  }
  init();
})();
