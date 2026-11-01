/* TigoMeNote · season-sound.js — maikling tunog ng mga seasonal theme (Web Audio, walang audio file)
     TMN_SEASON_SOUND.play("christmas" | "newyear" | "halloween" | "valentine")
   Christmas: "Jingle Bells" (J. Pierpont, 1857 — public domain) na may kampanilya.
   New Year:  "Auld Lang Syne" (tradisyonal — public domain) at mga paputok.
   Halloween at Valentine's: sariling himig. Tumutunog lang kapag pinili ang theme o pinindot ang ▶. */
(function () {
  var ac = null, cur = [];
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
  function play(kind) {
    var a = ctx(), song = SONGS[kind]; if (!a || !song) return false;
    stop();
    var out = a.createGain(); out.gain.value = 0.9; out.connect(a.destination);
    song(a, out, a.currentTime + 0.05);
    return true;
  }
  window.TMN_SEASON_SOUND = { play: play, stop: stop, has: function (k) { return !!SONGS[k]; } };
})();
