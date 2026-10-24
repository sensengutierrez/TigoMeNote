/* TigoMeNote · sounds.js — TigoMeNote Sounds: sariling music na ginagawa sa device (Web Audio)
   Walang download at walang copyright: bawat track ay "recipe" (tempo, chords, drums, instrument)
   na tinutugtog ng browser. Kaya libre, gumagana offline, at pareho ang tunog sa lahat ng device.
     TMN_SOUNDS.list                       → mga track { id, name, mood, bpm, tags }
     TMN_SOUNDS.play(id, { vol })          → tugtugin (paulit-ulit) · TMN_SOUNDS.stop()
     TMN_SOUNDS.playing()                  → id ng tumutugtog (o null)
     TMN_SOUNDS.suggest(features)          → mga track na pinakabagay, una ang pinakamahusay
     TMN_SOUNDS.analyze(blob|canvas|video) → { brightness, saturation, warmth, contrast, hue, hour, ... }
     TMN_SOUNDS.render(id|track, seconds)  → Promise<AudioBuffer> (hal. para isama sa video o i-download)
     TMN_SOUNDS.local() / region()         → Local sounds (Pilipinas / Gulf) ayon sa time zone at wika ng device
     TMN_SOUNDS.fresh()                    → mga bagong tunog ("New")
     TMN_SOUNDS.chip(sound)                → html ng "♪ Golden Hour" na button (tap = play/stop, sa kahit anong page)
     Sound Maker (sariling gawa ng user, id "u-xxxxxxxx"): ang sound ng post ay may kasamang recipe
     TMN_SOUNDS.ensure(sound)              → irehistro ang recipe (kung meron) bago i-play/get; ibinabalik ang track
     TMN_SOUNDS.fromRecipe(r, id)          → track mula sa recipe · TMN_SOUNDS.preview(track) → tugtugin ang ginagawa pa lang
     TMN_SOUNDS.position()                 → { bar, step } ng tumutugtog ngayon (para sa playhead ng Sound Maker)
     TMN_SOUNDS.SCALES / CHORDS / LEADS     → mga pagpipilian
   Kailangan ng tap muna ng user bago tumunog (patakaran ng browser). */
(function () {
  // ---------- mga track ----------
  // prog = chords bilang scale degree (0 = I); drums = 16 steps bawat bar (x = tama, . = wala)
  var TRACKS = [
    { id: "sunny-steps", name: "Sunny Steps", mood: "Happy · Pop", bpm: 112, root: 60, scale: "major", prog: [0, 4, 5, 3],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x." }, bass: "x..x..x.x..x..x.", chord: "pluck", lead: "bell", tags: { bright: 3, warm: 1, sat: 2, day: 2, happy: 3 } },
    { id: "golden-hour", name: "Golden Hour", mood: "Warm · Chill", bpm: 84, root: 57, scale: "minor", prog: [0, 5, 2, 6],
      drums: { k: "x......x..x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x.....x...x.....", chord: "keys", lead: "keys", swing: 0.12, tags: { warm: 3, evening: 3, mid: 2, chill: 2 } },
    { id: "night-drive", name: "Night Drive", mood: "Night · Synth", bpm: 96, root: 52, scale: "minor", prog: [0, 5, 6, 4],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx" }, bass: "xxxxxxxxxxxxxxxx", chord: "pad", lead: "arp", tags: { dark: 3, night: 3, cool: 2, sat: 1 } },
    { id: "island-breeze", name: "Island Breeze", mood: "Beach · Tropical", bpm: 104, root: 62, scale: "major", prog: [0, 3, 4, 3],
      drums: { k: "x..x..x.x..x..x.", s: "....x.......x...", h: "..x...x...x...x." }, bass: "x..x....x..x....", chord: "marimba", lead: "marimba", tags: { bright: 2, blue: 3, sat: 2, day: 2, happy: 2 } },
    { id: "soft-morning", name: "Soft Morning", mood: "Calm · Ambient", bpm: 70, root: 64, scale: "major", prog: [0, 3, 5, 4],
      drums: null, bass: "x...............", chord: "pad", lead: "bell", tags: { bright: 1, soft: 3, morning: 3, calm: 3, lowsat: 1 } },
    { id: "hype-up", name: "Hype Up", mood: "Energy · Trap", bpm: 140, root: 50, scale: "minor", prog: [0, 0, 5, 6],
      drums: { k: "x.....x...x.....", s: "........x.......", h: "x.x.xxx.x.x.x.xx" }, bass: "x.....x...x.....", chord: "pad", lead: "pluck", half: true, tags: { contrast: 3, sat: 2, energy: 3, dark: 1 } },
    { id: "lofi-notes", name: "Lofi Notes", mood: "Cozy · Lofi", bpm: 76, root: 55, scale: "dorian", prog: [0, 3, 6, 4],
      drums: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x.......x.......", chord: "keys", lead: "keys", swing: 0.18, crackle: true, tags: { warm: 2, indoor: 3, lowlight: 2, cozy: 3 } },
    { id: "city-lights", name: "City Lights", mood: "Party · House", bpm: 122, root: 53, scale: "minor", prog: [0, 6, 5, 6],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x.", c: "x..............." }, bass: "..x...x...x...x.", chord: "stab", lead: "arp", tags: { night: 2, sat: 3, energy: 2, party: 3 } },
    { id: "family-day", name: "Family Day", mood: "Sweet · Acoustic", bpm: 100, root: 62, scale: "major", prog: [0, 4, 5, 3],
      drums: { k: "x.......x.......", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x...x...x...x...", chord: "pluck", lead: "bell", tags: { warm: 2, soft: 2, happy: 2, day: 1 } },
    { id: "rain-window", name: "Rain Window", mood: "Sad · Piano", bpm: 68, root: 57, scale: "minor", prog: [0, 5, 3, 4],
      drums: null, bass: "x.......x.......", chord: "keys", lead: "keys", rain: true, tags: { lowsat: 3, mono: 3, blue: 1, dark: 1, calm: 2 } },
    { id: "dreamy", name: "Dreamy", mood: "Soft · Dream pop", bpm: 88, root: 65, scale: "major", prog: [0, 2, 5, 3],
      drums: { k: "x.......x.......", s: "....x.......x...", h: "..x...x...x...x." }, bass: "x.......x.......", chord: "pad", lead: "bell", tags: { pink: 3, soft: 2, bright: 1, pastel: 3 } },
    { id: "victory", name: "Victory", mood: "Epic · Anthem", bpm: 120, root: 55, scale: "major", prog: [0, 4, 5, 3],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", c: "x..............." }, bass: "x.x.x.x.x.x.x.x.", chord: "stab", lead: "lead", tags: { contrast: 2, bright: 2, energy: 2, green: 2 } },

    // ---------- Local: Pilipinas (region "ph") ----------
    { id: "harana", name: "Harana", mood: "Pinoy · Serenade", region: "ph", gain: 1.6, bpm: 72, root: 59, scale: "major", prog: [0, 5, 3, 4],
      drums: null, bass: "x.......x.......", chord: "guitar", lead: "bell", tags: { warm: 2, evening: 2, night: 1, soft: 2, calm: 1, pink: 1 } },
    { id: "jeepney-ride", name: "Jeepney Ride", mood: "Pinoy · OPM pop", region: "ph", bpm: 108, root: 62, scale: "major", prog: [3, 4, 2, 5],
      drums: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x..x....x..x....", chord: "guitar", lead: "pluck", tags: { bright: 2, day: 2, happy: 2, sat: 1 } },
    { id: "fiesta", name: "Fiesta", mood: "Pinoy · Festive", region: "ph", bpm: 124, root: 60, scale: "major", prog: [0, 3, 4, 4],
      drums: { k: "x...x...x...x...", s: "..x...x...x.x.x.", h: "x.x.x.x.x.x.x.x.", c: "x..............." }, bass: "x...x...x...x...", chord: "stab", lead: "brass", tags: { sat: 3, party: 2, energy: 2, happy: 2, contrast: 1 } },
    { id: "budots-bounce", name: "Budots Bounce", mood: "Pinoy · Dance", region: "ph", bpm: 130, root: 55, scale: "minor", prog: [0, 0, 5, 4],
      drums: { k: "x..x..x.x..x..x.", s: "....x.......x...", h: "..x...x...x...x.", p: "....x.......x..x" }, bass: "x..x..x.x..x..x.", chord: "stab", lead: "pluck", tags: { energy: 3, party: 2, sat: 1, contrast: 1 } },
    { id: "boracay-sunset", name: "Boracay Sunset", mood: "Pinoy · Beach house", region: "ph", bpm: 102, root: 64, scale: "major", prog: [0, 4, 5, 3],
      drums: { k: "x...x...x...x...", p: "....x.......x...", h: "..x...x...x...x." }, bass: "..x...x...x...x.", chord: "marimba", lead: "bell", tags: { blue: 2, warm: 2, evening: 2, bright: 1, happy: 1 } },

    { id: "kilig", name: "Kilig", mood: "Pinoy · Acoustic love", region: "ph", added: "2026-10-24", gain: 1.4, bpm: 90, root: 62, scale: "major", prog: [0, 4, 5, 3],
      drums: { k: "x.......x.......", p: "....x.......x...", h: "..x...x...x...x." }, bass: "x.....x.x.......", chord: "guitar", lead: "bell", tags: { pink: 3, soft: 2, warm: 2, happy: 1, evening: 1 } },
    { id: "habagat", name: "Habagat", mood: "Pinoy · Rainy lofi", region: "ph", added: "2026-10-24", bpm: 74, root: 57, scale: "dorian", prog: [0, 3, 4, 6],
      drums: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bass: "x.......x.......", chord: "keys", lead: "keys", swing: 0.16, rain: true, crackle: true, tags: { lowsat: 2, blue: 2, cozy: 2, calm: 2, indoor: 1 } },

    // ---------- Local: Gulf / Bahrain (region "gulf") ----------
    { id: "khaleeji-nights", name: "Khaleeji Nights", mood: "Gulf · Khaleeji", region: "gulf", gain: 1.25, bpm: 104, root: 57, scale: "hijaz", prog: [0, 0, 6, 0],
      drums: { d: "x.....x...x.....", t: "...x..x.x...x.x.", p: "....x.......x..." }, bass: "x.....x...x.....", chord: "drone", lead: "oud", tags: { night: 2, warm: 2, party: 1, sat: 1 } },
    { id: "desert-oud", name: "Desert Oud", mood: "Gulf · Oud", region: "gulf", gain: 1.6, bpm: 76, root: 52, scale: "hijaz", prog: [0, 0, 3, 0],
      drums: { d: "x.......x.......", t: "....x..x....x..." }, bass: "x...............", chord: "drone", lead: "oud", tags: { warm: 3, evening: 2, calm: 2, soft: 1 } },
    { id: "manama-skyline", name: "Manama Skyline", mood: "Gulf · Arabic pop", region: "gulf", bpm: 100, root: 55, scale: "hijaz", prog: [0, 6, 5, 6],
      drums: { k: "x...x...x...x...", p: "....x.......x...", t: "..x..x....x..x.." }, bass: "x..x....x..x....", chord: "pad", lead: "oud", tags: { night: 2, sat: 2, energy: 1, contrast: 1 } },
    { id: "corniche-walk", name: "Corniche Walk", mood: "Gulf · Chill", region: "gulf", added: "2026-10-24", gain: 1.3, bpm: 92, root: 55, scale: "hijaz", prog: [0, 5, 6, 0],
      drums: { k: "x.......x.......", t: "...x..x....x..x.", p: "....x.......x..." }, bass: "x.....x...x.....", chord: "pad", lead: "oud", tags: { evening: 3, blue: 2, warm: 1, calm: 1 } },

    // ---------- Bago (para sa lahat) ----------
    { id: "tigo-bounce", name: "Tigo Bounce", mood: "Cute · Kids pop", added: "2026-10-24", bpm: 118, root: 64, scale: "major", prog: [0, 3, 4, 0],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x." }, bass: "x..x..x.x..x..x.", chord: "pluck", lead: "marimba", tags: { happy: 3, bright: 2, sat: 2, day: 1 } },
    { id: "glow-up", name: "Glow Up", mood: "Trend · Dance pop", added: "2026-10-24", bpm: 126, root: 57, scale: "minor", prog: [0, 5, 2, 6],
      drums: { k: "x...x...x...x...", s: "....x.......x...", h: "..x...x...x...x.", c: "x..............." }, bass: "..x...x...x...x.", chord: "stab", lead: "arp", tags: { energy: 3, party: 2, sat: 2, contrast: 1, night: 1 } }
  ];
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], hijaz: [0, 1, 4, 5, 7, 8, 10] };
  var REGIONS = { ph: "Philippines", gulf: "Gulf" };

  var CUSTOM = {}; // sariling gawa (Sound Maker) at "draft" na ginagawa pa lang
  function get(id) { return TRACKS.filter(function (t) { return t.id === id; })[0] || CUSTOM[id] || null; }
  var CHORDS = ["pad", "keys", "pluck", "marimba", "stab", "guitar", "drone"], LEADS = ["bell", "keys", "marimba", "pluck", "lead", "brass", "oud", "arp", "none"];
  function fromRecipe(r, id) {
    r = r || {};
    var st = function (v) { return typeof v === "string" && /^[x.]{16}$/.test(v) ? v : null; }, dr = null;
    if (r.drums) ["k", "s", "h", "p", "c", "d", "t"].forEach(function (k) { var v = st(r.drums[k]); if (v) { dr = dr || {}; dr[k] = v; } });
    var n = function (v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    return {
      id: id || r.id || "draft", custom: true, by: r.by || "", name: String(r.name || "My sound").slice(0, 30),
      mood: r.mood ? String(r.mood).slice(0, 30) : r.by ? "Made by @" + r.by : "Made with Sound Maker",
      bpm: Math.round(n(r.bpm, 60, 160, 100)), root: Math.round(n(r.root, 48, 67, 60)), scale: SCALES[r.scale] ? r.scale : "major",
      prog: (Array.isArray(r.prog) ? r.prog : [0, 4, 5, 3]).slice(0, 4).map(function (x) { return Math.round(n(x, 0, 6, 0)); }),
      drums: dr, bass: st(r.bass) || "x.......x.......", chord: CHORDS.indexOf(r.chord) > -1 ? r.chord : "keys", lead: LEADS.indexOf(r.lead) > -1 ? r.lead : "bell",
      swing: n(r.swing, 0, 0.3, 0), rain: !!r.rain, crackle: !!r.crackle, seed: String(r.seed || "tigo"), tags: {}
    };
  }
  function ensure(sound) {
    if (!sound || !sound.id) return null;
    if (sound.recipe && /^u-[a-z0-9]{8}$/.test(sound.id) && !CUSTOM[sound.id]) CUSTOM[sound.id] = fromRecipe(sound.recipe, sound.id);
    return get(sound.id);
  }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function note(t, degree, octave) {
    var sc = SCALES[t.scale], n = sc.length, d = ((degree % n) + n) % n;
    return t.root + 12 * ((octave || 0) + Math.floor(degree / n)) + sc[d];
  }
  function chordNotes(t, deg) { return [note(t, deg), note(t, deg + 2), note(t, deg + 4)]; }
  // Seeded random (pareho ang melody tuwing tutugtugin)
  function rng(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---------- engine (isang graph para sa live at offline) ----------
  function Engine(ctx, dest, t) {
    var master = ctx.createGain(); master.gain.value = 0.5 * (t.gain || 1);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    // Limiter sa dulo para hindi "mag-crack" ang tunog sa phone speaker
    var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
    var verb = ctx.createConvolver(), wet = ctx.createGain(); wet.gain.value = 0.18;
    var len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    master.connect(comp); master.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(lim); lim.connect(dest);
    var noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = noise.getChannelData(0);
    for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;

    function env(g, at, a, peak, dec, sus, rel, end) {
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + a);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), at + a + dec);
      if (end) { g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel); }
    }
    function osc(type, f, at, stop, out, detune) {
      var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
      o.connect(out); o.start(at); o.stop(stop); return o;
    }
    function noiseSrc(at, dur, out) { var s = ctx.createBufferSource(); s.buffer = noise; s.connect(out); s.start(at, Math.random() * 0.5, dur); return s; }

    var I = {
      kick: function (at) {
        var g = ctx.createGain(); g.connect(master); env(g, at, 0.002, 0.9, 0.28, 0.001, 0, 0);
        var o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.18);
        o.connect(g); o.start(at); o.stop(at + 0.35);
      },
      snare: function (at) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.8;
        f.connect(g); g.connect(master); env(g, at, 0.001, 0.4, 0.16, 0.001, 0, 0); noiseSrc(at, 0.2, f);
        var g2 = ctx.createGain(); g2.connect(master); env(g2, at, 0.001, 0.25, 0.08, 0.001, 0, 0); osc("triangle", 190, at, at + 0.12, g2);
      },
      hat: function (at, open) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7500;
        f.connect(g); g.connect(master); env(g, at, 0.001, open ? 0.14 : 0.09, open ? 0.25 : 0.045, 0.001, 0, 0); noiseSrc(at, 0.3, f);
      },
      crash: function (at) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4000;
        f.connect(g); g.connect(master); env(g, at, 0.002, 0.12, 1.2, 0.001, 0, 0); noiseSrc(at, 1.3, f);
      },
      bass: function (at, m, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 520; f.Q.value = 4;
        f.connect(g); g.connect(master); env(g, at, 0.005, 0.38, 0.12, 0.6, 0.06, at + dur);
        osc("sawtooth", hz(m), at, at + dur + 0.1, f); osc("sine", hz(m - 12), at, at + dur + 0.1, g);
      },
      pad: function (at, notes, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1500;
        f.connect(g); g.connect(master); env(g, at, 0.4, 0.14, 0.6, 0.8, 0.5, at + dur);
        notes.forEach(function (m) { osc("sawtooth", hz(m), at, at + dur + 0.6, f, -7); osc("sawtooth", hz(m), at, at + dur + 0.6, f, 7); });
      },
      keys: function (at, notes, dur) {
        notes.forEach(function (m, i) {
          var g = ctx.createGain(); g.connect(master); env(g, at + i * 0.012, 0.004, 0.16, 0.9, 0.25, 0.3, at + dur);
          osc("sine", hz(m), at, at + dur + 0.4, g); var g2 = ctx.createGain(); g2.gain.value = 0.25; g2.connect(g); osc("triangle", hz(m) * 2, at, at + dur + 0.4, g2);
        });
      },
      pluck: function (at, notes) {
        notes.forEach(function (m, i) {
          var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(3200, at); f.frequency.exponentialRampToValueAtTime(600, at + 0.3);
          f.connect(g); g.connect(master); env(g, at + i * 0.01, 0.003, 0.13, 0.35, 0.001, 0, 0); osc("square", hz(m), at, at + 0.5, f);
        });
      },
      marimba: function (at, notes) {
        notes.forEach(function (m, i) {
          var g = ctx.createGain(); g.connect(master); env(g, at + i * 0.015, 0.002, 0.2, 0.32, 0.001, 0, 0);
          osc("sine", hz(m), at, at + 0.45, g); var g2 = ctx.createGain(); g2.gain.value = 0.15; g2.connect(g); osc("sine", hz(m) * 4, at, at + 0.2, g2);
        });
      },
      stab: function (at, notes) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2400;
        f.connect(g); g.connect(master); env(g, at, 0.003, 0.12, 0.18, 0.001, 0, 0);
        notes.forEach(function (m) { osc("sawtooth", hz(m + 12), at, at + 0.3, f, -9); osc("sawtooth", hz(m + 12), at, at + 0.3, f, 9); });
      },
      bell: function (at, m) {
        var g = ctx.createGain(); g.connect(master); env(g, at, 0.002, 0.09, 0.9, 0.001, 0, 0);
        osc("sine", hz(m), at, at + 1, g); var g2 = ctx.createGain(); g2.gain.value = 0.4; g2.connect(g); osc("sine", hz(m) * 2.76, at, at + 0.6, g2);
      },
      lead: function (at, m, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600;
        f.connect(g); g.connect(master); env(g, at, 0.01, 0.07, 0.2, 0.7, 0.1, at + dur);
        osc("square", hz(m), at, at + dur + 0.15, f, 4); osc("sawtooth", hz(m), at, at + dur + 0.15, f, -4);
      },
      // Gitara (strum): sunod-sunod na kuwerdas, malambot
      guitar: function (at, notes, down) {
        var ns = down ? notes.slice() : notes.slice().reverse();
        ns.concat([ns[0] + 12]).forEach(function (m, i) {
          var g = ctx.createGain(), f = ctx.createBiquadFilter(), t0 = at + i * 0.018;
          f.type = "lowpass"; f.frequency.setValueAtTime(2600, t0); f.frequency.exponentialRampToValueAtTime(700, t0 + 0.5);
          f.connect(g); g.connect(master); env(g, t0, 0.003, 0.09, 0.7, 0.001, 0, 0);
          osc("triangle", hz(m), t0, t0 + 0.9, f); osc("sawtooth", hz(m), t0, t0 + 0.4, f, 3);
        });
      },
      // Brass (pang-fiesta)
      brass: function (at, m, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2;
        f.frequency.setValueAtTime(500, at); f.frequency.exponentialRampToValueAtTime(3200, at + 0.06); f.frequency.exponentialRampToValueAtTime(1400, at + dur);
        f.connect(g); g.connect(master); env(g, at, 0.02, 0.08, 0.15, 0.75, 0.08, at + dur);
        osc("sawtooth", hz(m), at, at + dur + 0.12, f, -6); osc("sawtooth", hz(m), at, at + dur + 0.12, f, 6);
      },
      // Oud: maikling pluck na may konting "slide" sa simula
      oud: function (at, m, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = hz(m) * 2.2; f.Q.value = 1.2;
        f.connect(g); g.connect(master); env(g, at, 0.002, 0.28, Math.min(0.5, dur), 0.001, 0, 0);
        [["sawtooth", 1], ["triangle", 2]].forEach(function (x) {
          var o = ctx.createOscillator(); o.type = x[0];
          o.frequency.setValueAtTime(hz(m) * x[1] * 0.97, at); o.frequency.exponentialRampToValueAtTime(hz(m) * x[1], at + 0.04);
          o.connect(f); o.start(at); o.stop(at + 0.6);
        });
      },
      // Drone: root + fifth na mahaba (pang-Arabic)
      drone: function (at, root, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
        f.connect(g); g.connect(master); env(g, at, 0.5, 0.1, 0.6, 0.8, 0.6, at + dur);
        [root, root + 7, root + 12].forEach(function (m, i) { osc(i ? "triangle" : "sawtooth", hz(m), at, at + dur + 0.7, f, i * 4 - 4); });
      },
      // Darbuka: doum (mababa) at tak (matinis)
      doum: function (at) {
        var g = ctx.createGain(); g.connect(master); env(g, at, 0.002, 0.7, 0.22, 0.001, 0, 0);
        var o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(190, at); o.frequency.exponentialRampToValueAtTime(90, at + 0.15);
        o.connect(g); o.start(at); o.stop(at + 0.3);
      },
      tak: function (at) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3200; f.Q.value = 2;
        f.connect(g); g.connect(master); env(g, at, 0.001, 0.32, 0.06, 0.001, 0, 0); noiseSrc(at, 0.08, f);
        var g2 = ctx.createGain(); g2.connect(master); env(g2, at, 0.001, 0.12, 0.04, 0.001, 0, 0); osc("triangle", 640, at, at + 0.06, g2);
      },
      clap: function (at) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 0.9;
        f.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.0001, at);
        [0, 0.012, 0.024].forEach(function (d) { g.gain.setValueAtTime(0.3, at + d); g.gain.exponentialRampToValueAtTime(0.05, at + d + 0.01); });
        g.gain.setValueAtTime(0.25, at + 0.036); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
        noiseSrc(at, 0.22, f);
      },
      crackle: function (at, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500;
        g.gain.value = 0.025; f.connect(g); g.connect(master); noiseSrc(at, dur, f);
      },
      rain: function (at, dur) {
        var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
        g.gain.value = 0.05; f.connect(g); g.connect(master); noiseSrc(at, dur, f);
      }
    };

    var step = 60 / t.bpm / 4 * (t.half ? 2 : 1);
    var R = rng(t.seed || t.id), melody = [], walk = 4;
    // 2 bar na melody (paulit-ulit, may maliit na pagbabago sa ika-2 ulit)
    for (var b = 0; b < 4; b++) {
      var tones = chordNotes(t, t.prog[b]);
      for (var s = 0; s < 16; s++) {
        var on = s % 4 === 0 ? R() < 0.7 : s % 2 === 0 ? R() < 0.35 : R() < 0.12;
        if (t.scale === "hijaz") {
          // Arabic na himig: sunod-sunod na nota sa hijaz scale (hindi talon-talon sa chord)
          if (on) { walk = Math.max(0, Math.min(9, walk + [-2, -1, -1, 1, 1, 2][Math.floor(R() * 6)])); melody.push(note(t, walk, 1)); }
          else melody.push(null);
          continue;
        }
        melody.push(on ? tones[Math.floor(R() * 3)] + 12 + (R() < 0.2 ? 2 : 0) : null);
      }
    }
    // Isang 16th step (bar = 0..3, s = 0..15)
    function playStep(bar, s, at, loop) {
      if (t.swing && s % 2 === 1) at += step * t.swing;
      var deg = t.prog[bar], tones = chordNotes(t, deg), D = t.drums;
      if (D) {
        if (D.k && D.k[s] === "x") I.kick(at);
        if (D.s && D.s[s] === "x") I.snare(at);
        if (D.h && D.h[s] === "x") I.hat(at, s === 14 && bar === 3);
        if (D.c && D.c[s] === "x" && bar === 0 && loop % 2 === 0) I.crash(at);
        if (D.d && D.d[s] === "x") I.doum(at);
        if (D.t && D.t[s] === "x") I.tak(at);
        if (D.p && D.p[s] === "x") I.clap(at);
      }
      if (t.bass[s] === "x") I.bass(at, note(t, deg, -2), step * 1.8);
      if (t.chord === "guitar" && (s === 0 || s === 4 || s === 6 || s === 10 || s === 12 || s === 14)) I.guitar(at, [tones[0] - 12, tones[1] - 12, tones[2] - 12], s % 4 === 0);
      if (s === 0) {
        if (t.chord === "drone") I.drone(at, note(t, 0, -1), step * 16);
        if (t.chord === "pad") I.pad(at, tones, step * 16);
        if (t.chord === "keys") I.keys(at, tones, step * 15);
        if (t.crackle) I.crackle(at, step * 16);
        if (t.rain) I.rain(at, step * 16);
      }
      if (t.chord === "pluck" && (s === 0 || s === 6 || s === 10)) I.pluck(at, tones);
      if (t.chord === "marimba" && s % 4 === 2) I.marimba(at, [tones[s % 3], tones[(s + 1) % 3] + 12]);
      if (t.chord === "stab" && (s === 2 || s === 6 || s === 10 || s === 14)) I.stab(at, tones);
      if (t.chord === "keys" && s === 8 && t.bpm > 80) I.keys(at, [tones[1] + 12], step * 6);
      // lead
      if (t.lead === "none") return;
      if (t.lead === "arp") { I.pluck(at, [tones[s % 3] + 12]); return; }
      var mn = melody[bar * 16 + s];
      if (mn === null || mn === undefined) return;
      if (loop % 2 === 1 && s % 8 === 6) mn += 2;
      if (t.lead === "bell") I.bell(at, mn + 12);
      else if (t.lead === "keys") I.keys(at, [mn], step * 2);
      else if (t.lead === "marimba") I.marimba(at, [mn]);
      else if (t.lead === "pluck") I.pluck(at, [mn]);
      else if (t.lead === "lead") I.lead(at, mn, step * 1.6);
      else if (t.lead === "brass") I.brass(at, mn, step * 1.5);
      else if (t.lead === "oud") I.oud(at, mn - 12, step * 2);
    }
    return { master: master, step: step, playStep: playStep };
  }

  // ---------- live player ----------
  var ac = null, live = null;
  function context() {
    if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function play(id, o) {
    o = o || {};
    stop();
    var t = get(id), ctx = context();
    if (!t || !ctx) return false;
    var out = ctx.createGain(); out.gain.value = 0.0001; out.connect(ctx.destination);
    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol == null ? 0.8 : o.vol), ctx.currentTime + 0.4);
    var eng = Engine(ctx, out, t), n = 0, next = ctx.currentTime + 0.08, q = [];
    var timer = setInterval(function () {
      while (next < ctx.currentTime + 0.25) {
        var bar = Math.floor(n / 16) % 4, s = n % 16, loop = Math.floor(n / 64);
        eng.playStep(bar, s, next, loop);
        q.push([next, bar, s]); if (q.length > 24) q.shift();
        next += eng.step; n++;
      }
    }, 50);
    live = { id: id, out: out, timer: timer, q: q };
    document.dispatchEvent(new CustomEvent("tmn:sound", { detail: { id: id } }));
    return true;
  }
  function stop() {
    if (!live) return;
    var l = live; live = null;
    clearInterval(l.timer);
    try { l.out.gain.cancelScheduledValues(ac.currentTime); l.out.gain.setValueAtTime(l.out.gain.value, ac.currentTime); l.out.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25); } catch (e) {}
    setTimeout(function () { try { l.out.disconnect(); } catch (e) {} }, 1500);
    document.dispatchEvent(new CustomEvent("tmn:sound", { detail: { id: null } }));
  }
  function position() {
    if (!live || !ac) return null;
    var now = ac.currentTime, hit = null;
    for (var i = 0; i < live.q.length; i++) if (live.q[i][0] <= now) hit = live.q[i];
    return hit ? { bar: hit[1], step: hit[2] } : null;
  }
  function preview(track, o) { CUSTOM.draft = Object.assign({}, track, { id: "draft" }); return play("draft", o); }
  function setVolume(v) { if (live && ac) live.out.gain.setTargetAtTime(Math.max(0.0002, v), ac.currentTime, 0.05); }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") stop(); });

  // Offline (hal. para isama sa video o i-download)
  function render(id, seconds) {
    var t = typeof id === "object" ? id : get(id), O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!t || !O) return Promise.reject(new Error("Sound isn't available on this device."));
    var rate = 44100, ctx = new O(2, Math.ceil(rate * seconds), rate);
    var eng = Engine(ctx, ctx.destination, t), n = 0, at = 0.02;
    while (at < seconds) { eng.playStep(Math.floor(n / 16) % 4, n % 16, at, Math.floor(n / 64)); at += eng.step; n++; }
    return ctx.startRendering();
  }

  // ---------- auto-pick ----------
  // Kinukuha ang "itsura" ng photo/video: liwanag, kulay, init, contrast, oras
  function analyze(src) {
    return new Promise(function (resolve) {
      function measure(img) {
        var c = document.createElement("canvas"), W = 48, H = 48; c.width = W; c.height = H;
        var g = c.getContext("2d", { willReadFrequently: true });
        try { g.drawImage(img, 0, 0, W, H); } catch (e) { return resolve(base()); }
        var d = g.getImageData(0, 0, W, H).data, n = W * H, sl = 0, ss = 0, sw = 0, sl2 = 0, hues = { blue: 0, green: 0, pink: 0, warm: 0 };
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
          var mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = 0.2126 * r + 0.7152 * gg + 0.0722 * b, s = mx ? (mx - mn) / mx : 0;
          sl += l; sl2 += l * l; ss += s; sw += r - b;
          if (s > 0.25 && mx > 0.25) {
            if (b >= r && b >= gg) hues.blue++; else if (gg >= r && gg >= b) hues.green++;
            else if (r > gg && b > gg * 1.05) hues.pink++; else hues.warm++;
          }
        }
        var mean = sl / n, top = Object.keys(hues).sort(function (a, b) { return hues[b] - hues[a]; })[0];
        resolve(Object.assign(base(), {
          brightness: mean, saturation: ss / n, warmth: sw / n, contrast: Math.sqrt(Math.max(0, sl2 / n - mean * mean)),
          hue: hues[top] > n * 0.12 ? top : null
        }));
      }
      function base() { return { brightness: 0.5, saturation: 0.3, warmth: 0, contrast: 0.2, hue: null, hour: new Date().getHours() }; }
      if (!src) return resolve(base());
      if (src instanceof HTMLCanvasElement || src instanceof HTMLVideoElement || src instanceof HTMLImageElement) return measure(src);
      if (src instanceof Blob) {
        if (/^video/.test(src.type)) {
          var v = document.createElement("video"), u = URL.createObjectURL(src); v.muted = true; v.playsInline = true; v.src = u;
          v.onloadeddata = function () { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
          v.onseeked = function () { measure(v); URL.revokeObjectURL(u); };
          v.onerror = function () { resolve(base()); };
          setTimeout(function () { resolve(base()); }, 4000);
          return;
        }
        if (window.createImageBitmap) return createImageBitmap(src).then(measure, function () { resolve(base()); });
      }
      resolve(base());
    });
  }
  // Saan ang user (para sa Local sounds): wika ng app at time zone ng device
  function region() {
    var out = [];
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz === "Asia/Manila") out.push("ph");
      if (/^Asia\/(Bahrain|Riyadh|Qatar|Dubai|Kuwait|Muscat|Aden|Baghdad)$/.test(tz)) out.push("gulf");
    } catch (e) {}
    var lang = ((window.TMN_I18N && TMN_I18N.lang) || "") + " " + (navigator.languages || [navigator.language || ""]).join(" ");
    if (/\b(fil|tl)\b/i.test(lang) && out.indexOf("ph") < 0) out.push("ph");
    if (/\bar\b/i.test(lang) && out.indexOf("gulf") < 0) out.push("gulf");
    return out;
  }
  function local(regs) {
    regs = regs || region();
    return TRACKS.filter(function (t) { return t.region && regs.indexOf(t.region) > -1; });
  }
  // Iskor bawat track ayon sa itsura + oras + filter (+ kaunting dagdag sa Local sounds)
  function suggest(f) {
    f = f || {};
    var regs = f.regions || region();
    var h = f.hour == null ? new Date().getHours() : f.hour;
    var want = {
      bright: f.brightness > 0.6 ? 2 : f.brightness > 0.45 ? 1 : 0,
      dark: f.brightness < 0.3 ? 2 : f.brightness < 0.4 ? 1 : 0,
      lowlight: f.brightness < 0.42 ? 1 : 0,
      sat: f.saturation > 0.4 ? 2 : f.saturation > 0.28 ? 1 : 0,
      lowsat: f.saturation < 0.12 ? 2 : f.saturation < 0.2 ? 1 : 0,
      mono: f.filter === "mono" || f.filter === "noir" || f.saturation < 0.05 ? 3 : 0,
      warm: f.warmth > 0.08 ? 2 : f.warmth > 0.03 ? 1 : 0,
      cool: f.warmth < -0.05 ? 2 : 0,
      contrast: f.contrast > 0.28 ? 2 : f.contrast > 0.22 ? 1 : 0,
      soft: f.contrast < 0.16 ? 2 : 0,
      blue: f.hue === "blue" ? 2 : 0, green: f.hue === "green" ? 2 : 0, pink: f.hue === "pink" ? 2 : 0, pastel: f.hue === "pink" && f.saturation < 0.35 ? 1 : 0,
      morning: h >= 5 && h < 10 ? 2 : 0, day: h >= 10 && h < 17 ? 1 : 0, evening: h >= 16 && h < 19 ? 2 : 0, night: h >= 19 || h < 5 ? 2 : 0,
      happy: f.brightness > 0.5 && f.saturation > 0.25 ? 1 : 0, calm: f.contrast < 0.18 ? 1 : 0, energy: f.kind === "video" && f.contrast > 0.22 ? 1 : 0,
      cozy: f.warmth > 0.03 && f.brightness < 0.5 ? 1 : 0, indoor: f.brightness < 0.45 && f.warmth > 0 ? 1 : 0, chill: 0.5, party: f.brightness < 0.35 && f.saturation > 0.35 ? 2 : 0
    };
    var filt = { golden: "warm", warm: "warm", rose: "pink", mint: "green", night: "night", drama: "contrast", vivid: "sat", fade: "soft", retro: "cozy", cool: "cool" }[f.filter];
    if (filt) want[filt] = (want[filt] || 0) + 2;
    return TRACKS.map(function (t) {
      var score = 0;
      Object.keys(t.tags).forEach(function (k) { score += (want[k] || 0) * t.tags[k]; });
      if (t.region && regs.indexOf(t.region) > -1) score += 4; // local muna kapag bagay din
      return { track: t, score: score };
    }).sort(function (a, b) { return b.score - a.score; }).map(function (x) { return x.track; });
  }

  // ---------- ♪ chip sa post card / viewer ----------
  function esc(x) { return String(x).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function chip(sound) {
    var t = ensure(sound);
    if (!t) return "";
    var on = live && live.id === t.id;
    return '<button type="button" class="snd-chip' + (on ? " playing" : "") + '" data-snd="' + t.id + '" data-vol="' + (sound.vol == null ? 0.8 : sound.vol) + '" aria-pressed="' + on + '" aria-label="Play sound: ' + esc(t.name) + '">' +
      '<span class="snd-note" aria-hidden="true">♪</span><span class="snd-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="snd-name" translate="no">' + esc(t.name) + '</span><span class="snd-by">· TigoMeNote Sounds</span></button>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-snd]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (live && live.id === b.dataset.snd) stop(); else play(b.dataset.snd, { vol: Number(b.dataset.vol) || 0.8 });
  }, true);
  document.addEventListener("tmn:sound", function (e) {
    var id = e.detail && e.detail.id;
    document.querySelectorAll("[data-snd]").forEach(function (b) { var on = b.dataset.snd === id; b.classList.toggle("playing", on); b.setAttribute("aria-pressed", String(on)); });
  });

  // Bagong tunog (≤ 45 araw mula nang idagdag) — para sa "New" sa picker
  function fresh() { var now = Date.now(); return TRACKS.filter(function (t) { return t.added && now - new Date(t.added).getTime() < 45 * 86400000; }); }
  window.TMN_SOUNDS = {
    chip: chip, fresh: fresh, ensure: ensure, fromRecipe: fromRecipe, preview: preview, position: position,
    SCALES: Object.keys(SCALES), CHORDS: CHORDS, LEADS: LEADS,
    list: TRACKS, get: get, region: region, local: local, REGIONS: REGIONS, play: play, stop: stop, setVolume: setVolume,
    playing: function () { return live ? live.id : null; },
    render: render, analyze: analyze, suggest: suggest
  };
})();
