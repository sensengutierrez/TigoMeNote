/* TigoMeNote · season-sound.js — maikling tunog ng mga seasonal theme (Web Audio, walang audio file)
     TMN_SEASON_SOUND.play("christmas" | "newyear" | "halloween" | "valentine")   → maikling kanta
     TMN_SEASON_SOUND.tap(kind, "open" | "pick")                                  → maikling tunog (menu)
     TMN_SEASON_SOUND.volume() / .volume(0–100)                                    → lakas (0 = walang tunog); naka-save sa device ("tmnFxVol")
   Menu: kapag seasonal ang Background (html[data-fx]), may tunog ang ☰ (bukas ng menu) at ang pagpindot sa loob nito.
   Christmas: "Jingle Bells" (J. Pierpont, 1857 — public domain) na may kampanilya.
   New Year:  "Auld Lang Syne" (tradisyonal — public domain) at mga paputok.
   Halloween at Valentine's: sariling himig. Tumutunog lang kapag pinili ang theme o pinindot ang ▶. */
(function () {
  var ac = null, cur = [], VKEY = "tmnFxVol";
  function vol() { var v = 70; try { var x = localStorage.getItem(VKEY); if (x !== null && x !== "") v = Number(x); } catch (e) {} return isFinite(v) ? Math.max(0, Math.min(100, v)) : 70; }
  function setVol(v) { v = Math.max(0, Math.min(100, Math.round(Number(v) || 0))); try { localStorage.setItem(VKEY, String(v)); } catch (e) {} return v; }
  function ctx() { if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === "suspended") ac.resume(); return ac; }
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) { var m = /^([A-G])(#|b)?(\d)$/.exec(n); var s = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) + 1) * 12; return 440 * Math.pow(2, (s - 69) / 12); }
  function stop() { cur.forEach(function (n) { try { n.stop(); } catch (e) {} }); cur = []; }
  function tone(a, out, f, t, d, type, vol, decay) {
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (decay || d));
    o.connect(g); g.connect(out); o.start(t); o.stop(t + (decay || d) + 0.05); cur.push(o);
  }
  function bell(a, out, f, t, vol) { tone(a, out, f, t, 0.9, "sine", vol || 0.16, 1.1); tone(a, out, f * 2.76, t, 0.4, "sine", (vol || 0.16) * 0.35, 0.5); }
  function noise(a, out, t, d, vol, hp) {
    var len = Math.round(a.sampleRate * d), b = a.createBuffer(1, len, a.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; f.type = "highpass"; f.frequency.value = hp || 1000; g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(out); s.start(t); cur.push(s);
  }
  function seq(a, out, t0, beat, notes, voice) {
    var t = t0;
    notes.forEach(function (n) { var p = n.split(":"), d = Number(p[1] || 1) * beat; if (p[0] !== "-") voice(hz(p[0]), t, d); t += d; });
    return t;
  }
  var SONGS = {
    christmas: function (a, out, t) {
      var b = 0.2;
      var end = seq(a, out, t, b, ["E5", "E5", "E5:2", "E5", "E5", "E5:2", "E5", "G5", "C5:1.5", "D5:0.5", "E5:4", "F5", "F5", "F5:1.5", "F5:0.5", "F5", "E5", "E5", "E5:0.5", "E5:0.5", "E5", "D5", "D5", "E5", "D5:2", "G5:2"],
        function (f, tt, d) { bell(a, out, f, tt, 0.17); });
      for (var x = t; x < end; x += b) noise(a, out, x, 0.07, 0.05, 6000);   // sleigh bells
    },
    newyear: function (a, out, t) {
      var b = 0.32;
      var end = seq(a, out, t, b, ["G4", "C5:1.5", "C5:0.5", "C5", "E5", "D5:1.5", "C5:0.5", "D5", "E5:0.5", "D5:0.5", "C5:1.5", "C5:0.5", "E5", "G5", "A5:3"],
        function (f, tt, d) { tone(a, out, f, tt, d, "triangle", 0.18, d * 1.1); tone(a, out, f / 2, tt, d, "sine", 0.07, d); });
      [0, 0.35, 0.6, 1.0, 1.25].forEach(function (k) { noise(a, out, end + k, 0.5, 0.28, 400); bell(a, out, 1400 + Math.random() * 900, end + k + 0.05, 0.05); });
    },
    halloween: function (a, out, t) {
      var b = 0.24;
      tone(a, out, hz("D3"), t, 3.4, "sawtooth", 0.05, 3.6);
      seq(a, out, t, b, ["D5", "F5", "A5", "G#5", "-", "A5", "F5", "D5", "C#5:2", "-", "D5", "A4", "Bb4", "A4:3"],
        function (f, tt, d) { tone(a, out, f, tt, d, "square", 0.07, d * 1.2); tone(a, out, f * 1.005, tt, d, "triangle", 0.08, d * 1.2); });
      noise(a, out, t + 3.3, 0.6, 0.12, 200);   // "woosh"
    },
    valentine: function (a, out, t) {
      var b = 0.22;
      seq(a, out, t, b, ["C5", "E5", "G5", "C6:2", "B5", "G5", "A5:2", "F5", "A5", "C6", "E6:2", "D6", "C6:3"],
        function (f, tt, d) { bell(a, out, f, tt, 0.13); tone(a, out, f / 2, tt, d, "sine", 0.05, d * 1.5); });
    },
  };
  function master(a) { var g = a.createGain(); g.gain.value = 0.9 * Math.pow(vol() / 100, 1.6); g.connect(a.destination); return g; }
  function play(kind) {
    if (!vol()) return false;
    var a = ctx(), song = SONGS[kind]; if (!a || !song) return false;
    stop();
    song(a, master(a), a.currentTime + 0.05);
    return true;
  }
  // Maikling tunog sa menu: "open" = bukas ng ☰, "pick" = pindot sa loob
  var TAPS = {
    christmas: { open: function (a, o, t) { bell(a, o, hz("E6"), t, 0.14); bell(a, o, hz("G6"), t + 0.09, 0.14); noise(a, o, t, 0.12, 0.05, 6500); },
                 pick: function (a, o, t) { bell(a, o, hz("C6"), t, 0.13); noise(a, o, t, 0.08, 0.04, 7000); } },
    newyear: { open: function (a, o, t) { noise(a, o, t, 0.28, 0.24, 500); bell(a, o, hz("A6"), t + 0.05, 0.06); bell(a, o, hz("E7"), t + 0.12, 0.05); },
               pick: function (a, o, t) { noise(a, o, t, 0.12, 0.16, 900); bell(a, o, hz("G6"), t + 0.03, 0.05); } },
    halloween: { open: function (a, o, t) {
                   var s = a.createOscillator(), g = a.createGain(); s.type = "sawtooth"; s.frequency.setValueAtTime(330, t); s.frequency.exponentialRampToValueAtTime(140, t + 0.45);
                   g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
                   s.connect(g); g.connect(o); s.start(t); s.stop(t + 0.55); cur.push(s); },
                 pick: function (a, o, t) { tone(a, o, hz("D4"), t, 0.16, "square", 0.05, 0.18); tone(a, o, hz("A3"), t + 0.08, 0.16, "triangle", 0.07, 0.2); } },
    valentine: { open: function (a, o, t) { bell(a, o, hz("E6"), t, 0.11); bell(a, o, hz("C7"), t + 0.1, 0.09); },
                 pick: function (a, o, t) { bell(a, o, hz("A5"), t, 0.1); } },
  };
  function tap(kind, what) {
    if (!vol()) return false;
    var a = ctx(), f = TAPS[kind] && TAPS[kind][what]; if (!a || !f) return false;
    f(a, master(a), a.currentTime + 0.01);
    return true;
  }
  var FX2SEASON = { snow: "christmas", fireworks: "newyear", bats: "halloween", hearts: "valentine" };
  function current() { return FX2SEASON[document.documentElement.getAttribute("data-fx") || ""] || ""; }
  // ☰ at mga link sa loob ng menu (pati sidebar sa desktop). Ang link: hinihintay sandali para marinig ang tunog bago lumipat.
  document.addEventListener("click", function (e) {
    var k = current(); if (!k || !vol() || e.defaultPrevented) return;
    var T = window.TMN_SEASON_SOUND;
    if (e.target.closest(".js-open-drawer")) { T.tap(k, "open"); return; }
    var a = e.target.closest(".drawer a[href], .drawer button, .sidebar a[href], .sidebar button");
    if (!a) return;
    T.tap(k, "pick");
    if (a.tagName === "A" && !a.target && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      var href = a.href; if (!href || href === location.href || /^javascript:/i.test(a.getAttribute("href"))) return;
      e.preventDefault(); setTimeout(function () { location.href = href; }, 220);
    }
  }, true);
  window.TMN_SEASON_SOUND = { play: play, tap: tap, stop: stop, current: current, has: function (k) { return !!SONGS[k]; },
    volume: function (v) { return v === undefined ? vol() : setVol(v); } };
})();
