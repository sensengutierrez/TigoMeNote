/* TigoMeNote · tigo/voice.js — boses ni Tigo (parang baby) at mga tunog ng laro, gawa sa WebAudio (walang audio file)
   import { createVoice, loadSound, saveSound, SOUND_DEFAULT } from "./voice.js"
   const v = createVoice()
     v.say("Yummy!", { mood })   → "babble" na boses (parang baby na nagdadaldal) o "words" (totoong salita, speech ng device)
     v.sfx("coin"|"jump"|"eat"|"pop"|"level"|"hit"|"win"|"go")
     v.set(settings) · v.unlock()  (tawagin sa unang tap/key para payagan ng browser ang tunog)
   Settings (naka-save sa device): { voice: true, style: "babble"|"words", voiceVol 0..1, pitch 0..1, sfxVol 0..1, chatty: true }
   Sariling tunog (synth), hindi kinopya sa ibang laro. */
const KEY = "tmnTigoSound";
export const SOUND_DEFAULT = { voice: true, style: "babble", voiceVol: 0.7, pitch: 0.6, sfxVol: 0.6, chatty: true };
export function loadSound() {
  try { return Object.assign({}, SOUND_DEFAULT, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return Object.assign({}, SOUND_DEFAULT); }
}
export function saveSound(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

export function createVoice(initial) {
  let S = Object.assign({}, initial || loadSound());
  let ac = null, master = null;
  function ctx() {
    if (ac) return ac;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null; // hintayin ang unang tap/key (patakaran ng browser)
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C(); master = ac.createDynamicsCompressor(); master.connect(ac.destination);
    return ac;
  }
  function live() { const a = ctx(); if (!a) return null; if (a.state === "suspended") a.resume().catch(() => {}); return document.hidden ? null : a; }

  // ---------- baby babble: maiikling pantig na may "formant" para parang boses ----------
  const VOWELS = [[800, 1200], [400, 2300], [300, 2600], [500, 900], [350, 800]]; // a e i o u
  function syllables(text) {
    const n = (String(text).toLowerCase().match(/[aeiouy]+/g) || []).length;
    return Math.max(2, Math.min(9, n || 2));
  }
  function babble(text, mood) {
    const a = live(); if (!a || S.voiceVol <= 0) return 0;
    const n = syllables(text), q = /\?\s*$/.test(text), ex = /!/.test(text);
    const base = 330 + S.pitch * 420 + (mood === "happy" ? 40 : mood === "sad" || mood === "sick" ? -60 : mood === "sleepy" ? -40 : 0);
    const slow = mood === "sleepy" ? 1.5 : 1;
    let t = a.currentTime + 0.02;
    const out = a.createGain(); out.gain.value = S.voiceVol * 0.55; out.connect(master);
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, dur = (0.075 + Math.random() * 0.05) * slow * (last ? 1.5 : 1);
      const f0 = base * (1 + (Math.random() - 0.5) * 0.25) * (last && q ? 1.3 : 1) * (ex && i === 0 ? 1.12 : 1);
      const o = a.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(f0, t);
      o.frequency.linearRampToValueAtTime(f0 * (last ? (q ? 1.35 : mood === "sad" ? 0.8 : 0.9) : 1.04), t + dur);
      const vib = a.createOscillator(), vg = a.createGain(); vib.frequency.value = 18; vg.gain.value = f0 * 0.02; vib.connect(vg); vg.connect(o.frequency);
      const v = VOWELS[(Math.random() * VOWELS.length) | 0];
      const env = a.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1, t + 0.015); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const mix = a.createGain(); mix.gain.value = 0.6; o.connect(mix);
      v.forEach((fq, k) => { const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fq * (1 + S.pitch * 0.25); bp.Q.value = 6; const g = a.createGain(); g.gain.value = k ? 0.9 : 1.6; o.connect(bp); bp.connect(g); g.connect(env); });
      mix.connect(env); env.connect(out);
      o.start(t); vib.start(t); o.stop(t + dur + 0.02); vib.stop(t + dur + 0.02);
      t += dur + 0.025 + Math.random() * 0.03;
    }
    return (t - a.currentTime) * 1000;
  }
  // ---------- totoong salita (speech ng device), mataas na boses ----------
  function words(text, mood) {
    const sp = window.speechSynthesis; if (!sp || S.voiceVol <= 0) return babble(text, mood);
    try {
      sp.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const loc = (window.TMN_I18N && TMN_I18N.locale) || "en-US";
      u.lang = loc; u.pitch = 1.4 + S.pitch * 0.6; u.rate = mood === "sleepy" ? 0.8 : 1.08; u.volume = S.voiceVol;
      const vs = sp.getVoices().filter((v) => v.lang && v.lang.slice(0, 2) === loc.slice(0, 2));
      if (vs.length) u.voice = vs.find((v) => /female|child|kid/i.test(v.name)) || vs[0];
      sp.speak(u);
    } catch (e) { return babble(text, mood); }
    return 300 + String(text).length * 70;
  }

  // ---------- sound effects ----------
  function tone(type, f1, f2, dur, vol, at = 0) {
    const a = live(); if (!a || S.sfxVol <= 0) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * S.sfxVol * 0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    coin() { tone("square", 988, 988, 0.07, 0.35); tone("square", 1319, 1319, 0.16, 0.35, 0.07); },
    jump() { tone("sine", 300, 720, 0.18, 0.6); },
    eat() { tone("triangle", 220, 140, 0.08, 0.7); tone("triangle", 240, 150, 0.08, 0.7, 0.12); },
    pop() { tone("sine", 600, 1200, 0.08, 0.5); },
    hit() { tone("sawtooth", 300, 60, 0.35, 0.45); },
    go() { tone("square", 784, 784, 0.25, 0.35); },
    tick() { tone("square", 523, 523, 0.12, 0.3); },
    level() { [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.16, 0.5, i * 0.1)); },
    win() { [659, 784, 988, 1319, 988, 1319].forEach((f, i) => tone("square", f, f, 0.12, 0.3, i * 0.1)); },
    power() { tone("sawtooth", 200, 900, 0.4, 0.3); },
  };

  return {
    say(text, o = {}) { if (!S.voice || !text) return 0; return S.style === "words" ? words(text, o.mood) : babble(text, o.mood); },
    sfx(k) { if (SFX[k]) SFX[k](); },
    set(s) { S = Object.assign({}, S, s); },
    get() { return Object.assign({}, S); },
    unlock() { const a = ctx(); if (a && a.state === "suspended") a.resume().catch(() => {}); },
  };
}
