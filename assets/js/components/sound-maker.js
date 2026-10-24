/* TigoMeNote · components/sound-maker.js — Sound Maker: gumawa ng sariling tunog (beat + bass + chords + melody)
     TMN_SOUND_MAKER.mount(el, { sound?, onSaved(sound), onClose })  → editor sa loob ng el (pang-page)
     TMN_SOUND_MAKER.open({ sound?, onSaved(sound) })                 → editor sa modal (hal. galing sa sound picker)
     TMN_SOUND_MAKER.mine(force) → Promise<[{ id, recipe }]>          → mga sariling tunog (naka-cache nang 5 min)
     TMN_SOUND_MAKER.toSound(id, recipe, base) → { id, vol, orig?, recipe } para sa post/status
   Grid na 16 hakbang (1 bar): 🥁 Kick · 👏 Snare · ✨ Hi-hat · 🙌 Clap · 🪘 Doum · Tak + Bass. Tap = on/off habang tumutugtog.
   Music: key, mood (Happy/Sad/Chill/Arabic), chords (4), instrument ng chords at melody, swing, ulan, vinyl.
   🎲 = bagong melody. Save → sounds-fast (recipe lang; tinutugtog ng device, walang file). ⬇ WAV = i-download (16 s).
   Kailangan: sounds.js (TMN_SOUNDS), api.js, modal.js (para sa open). */
(function () {
  function S() { return window.TMN_SOUNDS; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function toast(m) { if (window.TMN_UI) TMN_UI.toast(m); }
  var ROWS = [["k", "🥁", "Kick"], ["s", "👏", "Snare"], ["h", "✨", "Hi-hat"], ["p", "🙌", "Clap"], ["d", "🪘", "Doum"], ["t", "🥢", "Tak"]];
  var MOODS = [["major", "😊 Happy"], ["minor", "🌧️ Sad"], ["dorian", "😎 Chill"], ["hijaz", "🕌 Arabic"]];
  var KEYS = [["C", 60], ["D", 62], ["E", 64], ["F", 53], ["G", 55], ["A", 57], ["B", 59]];
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
  var CHORD_NAMES = { pad: "☁️ Pad", keys: "🎹 Piano", pluck: "🪕 Pluck", marimba: "🪵 Marimba", stab: "⚡ Synth stab", guitar: "🎸 Guitar", drone: "🕌 Drone" };
  var LEAD_NAMES = { bell: "🔔 Bell", keys: "🎹 Piano", marimba: "🪵 Marimba", pluck: "🪕 Pluck", lead: "🎛️ Synth", brass: "🎺 Brass", oud: "🪕 Oud", arp: "🌀 Arpeggio", none: "∅ No melody" };
  var PROGS = [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 3], [5, 3, 0, 4], [0, 0, 5, 6], [0, 6, 5, 6]];
  // Mabilis na simula (vibe)
  var VIBES = {
    pop: { name: "Pop", bpm: 112, scale: "major", root: 60, prog: [0, 4, 5, 3], chord: "pluck", lead: "bell", swing: 0, drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x." }, bass: "x..x..x.x..x..x." },
    lofi: { name: "Lofi", bpm: 76, scale: "dorian", root: 55, prog: [0, 3, 6, 4], chord: "keys", lead: "keys", swing: 0.18, crackle: true, drums: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x.......x......." },
    acoustic: { name: "Pinoy acoustic", bpm: 90, scale: "major", root: 62, prog: [0, 4, 5, 3], chord: "guitar", lead: "bell", swing: 0, drums: { k: "x.......x.......", p: "....x.......x...", h: "..x...x...x...x." }, bass: "x.....x.x......." },
    khaleeji: { name: "Khaleeji", bpm: 104, scale: "hijaz", root: 57, prog: [0, 0, 6, 0], chord: "drone", lead: "oud", swing: 0, drums: { d: "x.....x...x.....", t: "...x..x.x...x.x.", p: "....x.......x..." }, bass: "x.....x...x....." },
    trap: { name: "Trap", bpm: 140, scale: "minor", root: 50, prog: [0, 0, 5, 6], chord: "pad", lead: "pluck", swing: 0, drums: { k: "x.....x...x.....", s: "........x.......", h: "x.x.xxx.x.x.x.xx" }, bass: "x.....x...x....." },
    house: { name: "House", bpm: 122, scale: "minor", root: 53, prog: [0, 6, 5, 6], chord: "stab", lead: "arp", swing: 0, drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x." }, bass: "..x...x...x...x." },
    calm: { name: "Calm", bpm: 70, scale: "major", root: 64, prog: [0, 3, 5, 4], chord: "pad", lead: "bell", swing: 0, rain: true, drums: {}, bass: "x..............." },
  };
  var VIBE_ICON = { pop: "🎉", lofi: "☕", acoustic: "🎸", khaleeji: "🕌", trap: "🔥", house: "🪩", calm: "🌙" };

  function blank() { return { k: "................", s: "................", h: "................", p: "................", d: "................", t: "................" }; }
  function fromVibe(id, name) {
    var v = VIBES[id], d = blank();
    Object.keys(v.drums).forEach(function (k) { d[k] = v.drums[k]; });
    return { name: name || "", bpm: v.bpm, root: v.root, scale: v.scale, prog: v.prog.slice(), drums: d, bass: v.bass, chord: v.chord, lead: v.lead, swing: v.swing || 0, rain: !!v.rain, crackle: !!v.crackle, seed: Math.random().toString(36).slice(2, 8) };
  }
  function recipeOf(st) {
    var d = {};
    Object.keys(st.drums).forEach(function (k) { if (st.drums[k].indexOf("x") > -1) d[k] = st.drums[k]; });
    return { name: (st.name || "").trim(), bpm: st.bpm, root: st.root, scale: st.scale, prog: st.prog.slice(), drums: d, bass: st.bass, chord: st.chord, lead: st.lead, swing: st.swing, rain: st.rain, crackle: st.crackle, seed: st.seed };
  }
  function toSound(id, recipe, base) {
    var o = { id: id, vol: base && base.vol != null ? base.vol : 0.8, recipe: recipe };
    if (base && base.orig != null) o.orig = base.orig;
    return o;
  }
  // ---------- mga sariling tunog ----------
  var MINE_KEY = "tmnMySounds";
  function mine(force) {
    if (!force) { try { var c = JSON.parse(sessionStorage.getItem(MINE_KEY) || "null"); if (c && Date.now() - c.at < 300000) { reg(c.list); return Promise.resolve(c.list); } } catch (e) {} }
    if (!window.TMN_API || !navigator.onLine) return Promise.resolve([]);
    return TMN_API.call("sounds", "mine", {}).then(function (r) { var l = r.list || []; save(l); reg(l); return l; }, function () { return []; });
  }
  function save(l) { try { sessionStorage.setItem(MINE_KEY, JSON.stringify({ at: Date.now(), list: l })); } catch (e) {} }
  function reg(l) { if (S()) l.forEach(function (x) { S().ensure({ id: x.id, recipe: x.recipe }); }); }
  function forget(id) { try { var c = JSON.parse(sessionStorage.getItem(MINE_KEY) || "null"); if (c) { c.list = c.list.filter(function (x) { return x.id !== id; }); save(c.list); } } catch (e) {} }
  function remember(x) { try { var c = JSON.parse(sessionStorage.getItem(MINE_KEY) || "null"); if (c) { c.list = [x].concat(c.list.filter(function (y) { return y.id !== x.id; })); save(c.list); } } catch (e) {} }

  // ---------- WAV (pang-download) ----------
  function wav(buf) {
    var ch = buf.numberOfChannels, len = buf.length, rate = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + len * ch * 2));
    var w = function (o, s) { for (var i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); out.setUint32(4, 36 + len * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
    out.setUint32(24, rate, true); out.setUint32(28, rate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, len * ch * 2, true);
    var data = []; for (var c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    for (var i = 0, o = 44; i < len; i++) for (c = 0; c < ch; c++, o += 2) { var v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
    return new Blob([out], { type: "audio/wav" });
  }

  // ---------- editor ----------
  function mount(el, o) {
    o = o || {};
    var id = o.sound && o.sound.id && /^u-/.test(o.sound.id) ? o.sound.id : null;
    var st = o.sound && o.sound.recipe ? Object.assign(fromVibe("pop"), JSON.parse(JSON.stringify(o.sound.recipe))) : fromVibe("pop");
    st.drums = Object.assign(blank(), st.drums || {});
    var playing = false, raf = 0, busy = false, dirty = false;
    el.classList.add("sm");
    // phone: hinahati sa 2 (hakbang 1–8 at 9–16) para malaki ang kahon sa daliri
    var narrow = window.matchMedia ? matchMedia("(max-width: 600px)") : { matches: false };
    function cells(row, pat, a, b) {
      var h = "";
      for (var i = a || 0; i < (b || 16); i++) h += '<button type="button" class="sm-cell' + (pat[i] === "x" ? " on" : "") + (i % 4 === 0 ? " beat" : "") + '" data-row="' + row + '" data-i="' + i + '" aria-pressed="' + (pat[i] === "x") + '" aria-label="' + row + " step " + (i + 1) + '"></button>';
      return h;
    }
    function opt(list, cur) { return list.map(function (x) { return '<option value="' + x[0] + '"' + (String(x[0]) === String(cur) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join(""); }
    function render() {
      var keyNow = (KEYS.filter(function (k) { return k[1] === st.root || k[1] === st.root - 12 || k[1] === st.root + 12; })[0] || KEYS[0])[0];
      el.innerHTML =
        '<div class="sm-top">' +
          '<button type="button" class="sm-play" data-a="play" aria-label="' + (playing ? "Stop" : "Play") + '">' + (playing ? "⏸" : "▶") + "</button>" +
          '<label class="sm-name"><span class="sr-only">Sound name</span><input class="input" maxlength="30" placeholder="Name your sound" value="' + esc(st.name || "") + '"></label>' +
          '<button type="button" class="btn btn-primary btn-sm" data-a="save"' + (busy ? " disabled" : "") + ">" + (id ? "Save" : "Save sound") + "</button>" +
        "</div>" +
        '<div class="sm-vibes" role="group" aria-label="Start from a vibe">' + Object.keys(VIBES).map(function (k) { return '<button type="button" class="chip" data-vibe="' + k + '">' + VIBE_ICON[k] + " " + esc(VIBES[k].name) + "</button>"; }).join("") + "</div>" +
        '<section class="sm-sec"><div class="sm-h"><h4>Beat</h4><label class="sm-bpm">Tempo <input type="range" min="60" max="160" step="2" data-k="bpm" value="' + st.bpm + '"><b>' + st.bpm + "</b> BPM</label></div>" +
          (narrow.matches ? [[0, 8], [8, 16]] : [[0, 16]]).map(function (h) {
            return '<div class="sm-grid' + (h[1] - h[0] === 8 ? " sm-half" : "") + '">' + (h[1] - h[0] === 8 ? '<span class="sm-steps faint small">Steps ' + (h[0] + 1) + "–" + h[1] + "</span>" : "") +
              ROWS.map(function (r) { return '<div class="sm-row"><span class="sm-lab" title="' + r[2] + '">' + r[1] + "<small>" + r[2] + "</small></span>" + cells(r[0], st.drums[r[0]], h[0], h[1]) + "</div>"; }).join("") +
              '<div class="sm-row sm-bass"><span class="sm-lab">🎸<small>Bass</small></span>' + cells("bass", st.bass, h[0], h[1]) + "</div></div>";
          }).join("") +
          '<div class="sm-tools"><button type="button" class="btn btn-ghost btn-sm" data-a="clear">🧹 Clear beat</button><button type="button" class="btn btn-ghost btn-sm" data-a="randbeat">🎲 Random beat</button></div></section>' +
        '<section class="sm-sec"><div class="sm-h"><h4>Music</h4><button type="button" class="btn btn-ghost btn-sm" data-a="melody">🎲 New melody</button></div>' +
          '<div class="sm-seg" role="radiogroup" aria-label="Mood">' + MOODS.map(function (m) { return '<button type="button" role="radio" data-scale="' + m[0] + '" aria-checked="' + (st.scale === m[0]) + '">' + m[1] + "</button>"; }).join("") + "</div>" +
          '<div class="sm-fields">' +
            '<label class="field"><span class="pe-label">Key</span><select class="input" data-k="key">' + opt(KEYS.map(function (k) { return [k[0], k[0]]; }), keyNow) + "</select></label>" +
            '<label class="field"><span class="pe-label">Chords</span><select class="input" data-k="chord">' + opt(Object.keys(CHORD_NAMES).map(function (k) { return [k, CHORD_NAMES[k]]; }), st.chord) + "</select></label>" +
            '<label class="field"><span class="pe-label">Melody</span><select class="input" data-k="lead">' + opt(Object.keys(LEAD_NAMES).map(function (k) { return [k, LEAD_NAMES[k]]; }), st.lead) + "</select></label>" +
          "</div>" +
          '<div class="sm-prog"><span class="pe-label">Chord steps</span>' + st.prog.map(function (d, i) { return '<select class="input" data-prog="' + i + '" aria-label="Chord ' + (i + 1) + '">' + opt(ROMAN.map(function (r, j) { return [j, r]; }), d) + "</select>"; }).join("") +
            '<span class="sm-presets">' + PROGS.map(function (p, i) { return '<button type="button" class="chip" data-progset="' + i + '">' + p.map(function (d) { return ROMAN[d]; }).join("–") + "</button>"; }).join("") + "</span></div>" +
          '<div class="sm-extra">' +
            '<label class="sm-bpm">Swing <input type="range" min="0" max="30" step="2" data-k="swing" value="' + Math.round(st.swing * 100) + '"></label>' +
            '<label class="sm-tog"><input type="checkbox" data-k="rain"' + (st.rain ? " checked" : "") + "> 🌧️ Rain</label>" +
            '<label class="sm-tog"><input type="checkbox" data-k="crackle"' + (st.crackle ? " checked" : "") + "> 📻 Vinyl</label>" +
          "</div></section>" +
        '<div class="sm-foot"><button type="button" class="btn btn-ghost btn-sm" data-a="wav">⬇ Download WAV</button>' + (id ? '<button type="button" class="btn btn-ghost btn-sm sm-del" data-a="delete">🗑 Delete</button>' : "") +
          '<p class="faint small">Made on your device with TigoMeNote Sounds. Saved sounds can be used on your posts and status.</p></div>';
    }
    function track() { return S().fromRecipe(recipeOf(st), "draft"); }
    function live() { var d = S().get("draft"); if (!d || !playing) return; var t = track(); ["drums", "bass", "chord", "lead", "swing", "rain", "crackle", "prog"].forEach(function (k) { d[k] = t[k]; }); }
    function restart() { if (playing) { S().preview(track(), { vol: 0.85 }); } }
    function play(on) {
      playing = on;
      if (on) { S().preview(track(), { vol: 0.85 }); tick(); } else { S().stop(); cancelAnimationFrame(raf); el.querySelectorAll(".sm-cell.now").forEach(function (c) { c.classList.remove("now"); }); }
      var b = el.querySelector(".sm-play"); if (b) { b.textContent = on ? "⏸" : "▶"; b.setAttribute("aria-label", on ? "Stop" : "Play"); }
    }
    var lastStep = -1;
    function tick() {
      if (!playing) return;
      if (S().playing() !== "draft") { play(false); return; }
      var p = S().position();
      if (p && p.step !== lastStep) {
        lastStep = p.step;
        el.querySelectorAll(".sm-cell.now").forEach(function (c) { c.classList.remove("now"); });
        el.querySelectorAll('.sm-cell[data-i="' + p.step + '"]').forEach(function (c) { c.classList.add("now"); });
      }
      raf = requestAnimationFrame(tick);
    }
    function change(full) { dirty = true; if (full) restart(); else live(); }
    el.addEventListener("click", async function (e) {
      var c = e.target.closest(".sm-cell");
      if (c) {
        var row = c.dataset.row, i = +c.dataset.i, pat = row === "bass" ? st.bass : st.drums[row];
        pat = pat.slice(0, i) + (pat[i] === "x" ? "." : "x") + pat.slice(i + 1);
        if (row === "bass") st.bass = pat; else st.drums[row] = pat;
        c.classList.toggle("on", pat[i] === "x"); c.setAttribute("aria-pressed", pat[i] === "x");
        if (!playing) play(true); else change(false);
        return;
      }
      var v = e.target.closest("[data-vibe]");
      if (v) { var nm = st.name; st = fromVibe(v.dataset.vibe, nm); render(); if (playing) restart(); else play(true); dirty = true; return; }
      var sc = e.target.closest("[data-scale]");
      if (sc) { st.scale = sc.dataset.scale; el.querySelectorAll("[data-scale]").forEach(function (b) { b.setAttribute("aria-checked", b === sc); }); change(true); if (!playing) play(true); return; }
      var ps = e.target.closest("[data-progset]");
      if (ps) { st.prog = PROGS[+ps.dataset.progset].slice(); render(); change(true); if (!playing) play(true); return; }
      var a = e.target.closest("[data-a]"); if (!a) return;
      var act = a.dataset.a;
      if (act === "play") play(!playing);
      if (act === "melody") { st.seed = Math.random().toString(36).slice(2, 8); change(true); if (!playing) play(true); }
      if (act === "clear") { st.drums = blank(); st.bass = "................"; render(); change(false); }
      if (act === "randbeat") {
        var rnd = function (p) { var s = ""; for (var i = 0; i < 16; i++) s += Math.random() < p(i) ? "x" : "."; return s; };
        st.drums.k = rnd(function (i) { return i % 4 === 0 ? 0.85 : i % 2 === 0 ? 0.15 : 0.05; });
        st.drums.s = rnd(function (i) { return i % 8 === 4 ? 0.95 : 0.04; });
        st.drums.h = rnd(function (i) { return i % 2 === 0 ? 0.7 : 0.2; });
        st.drums.p = rnd(function (i) { return i % 8 === 4 ? 0.3 : 0.02; });
        st.bass = rnd(function (i) { return i % 4 === 0 ? 0.7 : 0.15; });
        render(); if (!playing) play(true); else change(false);
      }
      if (act === "save") return doSave();
      if (act === "wav") {
        a.disabled = true;
        try { var buf = await S().render(track(), 16); var url = URL.createObjectURL(wav(buf)), l = document.createElement("a"); l.href = url; l.download = ((st.name || "my-sound").replace(/[^\w-]+/g, "-").toLowerCase() || "my-sound") + ".wav"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); }
        catch (er) { toast(er.message || "Download failed."); }
        a.disabled = false;
      }
      if (act === "delete" && id) {
        // dalawang tap (walang browser dialog; hindi gumagana sa APK)
        if (!a.dataset.sure) { a.dataset.sure = "1"; a.textContent = "Tap again to delete"; setTimeout(function () { if (a.isConnected) { delete a.dataset.sure; a.textContent = "🗑 Delete"; } }, 3000); return; }
        try { await TMN_API.call("sounds", "remove", { id: id }); forget(id); play(false); toast("Sound deleted"); if (o.onDeleted) o.onDeleted(id); }
        catch (er) { toast(er.message); }
      }
    });
    el.addEventListener("input", function (e) {
      var k = e.target.dataset.k;
      if (e.target.matches(".sm-name input")) { st.name = e.target.value; dirty = true; return; }
      if (k === "bpm") { st.bpm = +e.target.value; e.target.nextElementSibling.textContent = st.bpm; return; }
      if (k === "swing") { st.swing = e.target.value / 100; change(false); }
    });
    el.addEventListener("change", function (e) {
      var k = e.target.dataset.k, pi = e.target.dataset.prog;
      if (k === "bpm") change(true);
      if (k === "key") { var kk = KEYS.filter(function (x) { return x[0] === e.target.value; })[0]; st.root = kk ? kk[1] : 60; change(true); }
      if (k === "chord" || k === "lead") { st[k] = e.target.value; change(false); }
      if (k === "rain" || k === "crackle") { st[k] = e.target.checked; change(true); }
      if (pi != null) { st.prog[+pi] = +e.target.value; change(true); }
      if ((k || pi != null) && !playing) play(true);
    });
    async function doSave() {
      var r = recipeOf(st);
      if (!r.name) { toast("Give your sound a name."); var inp = el.querySelector(".sm-name input"); if (inp) inp.focus(); return; }
      busy = true; render();
      try {
        var res = await TMN_API.call("sounds", "save", { id: id, recipe: r });
        id = res.sound.id; S().ensure({ id: id, recipe: res.sound.recipe }); remember(res.sound); dirty = false;
        toast("Sound saved 🎵");
        if (o.onSaved) o.onSaved(toSound(id, res.sound.recipe, o.sound));
      } catch (er) { toast(er.message); }
      busy = false; render();
    }
    function onNarrow() { var y = window.scrollY; render(); window.scrollTo(0, y); }
    if (narrow.addEventListener) narrow.addEventListener("change", onNarrow);
    render();
    return {
      stop: function () { play(false); },
      dirty: function () { return dirty; },
      destroy: function () { play(false); if (narrow.removeEventListener) narrow.removeEventListener("change", onNarrow); el.innerHTML = ""; el.classList.remove("sm"); },
    };
  }

  function open(o) {
    o = o || {};
    var body = document.createElement("div");
    var ed, m = TMN_MODAL.open({ title: o.sound && o.sound.recipe ? "Edit sound" : "Sound Maker", size: "lg", cls: "modal-sounds modal-sm", body: body,
      onClose: function () { if (ed) ed.destroy(); } });
    ed = mount(body, { sound: o.sound, onSaved: function (s) { m.close(); if (o.onSaved) o.onSaved(s); } });
    return m;
  }

  window.TMN_SOUND_MAKER = { mount: mount, open: open, mine: mine, toSound: toSound, VIBES: VIBES };
})();
