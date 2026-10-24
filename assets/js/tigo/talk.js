/* TigoMeNote · tigo/talk.js — nagsasalita si Tigo: speech bubble sa ibabaw ng ulo + boses (voice.js)
   import { createTalk } from "./talk.js"
   const tk = createTalk({ stage, sc, voice, getPet })
     tk.say("feed")        → random na linya para sa event (o diretsong text)
     tk.idle(on)           → paminsan-minsang nagsasalita ayon sa pangangailangan (kung "chatty")
   Ang mga linya ay English sa code; isinasalin ng i18n (lang/fil.js = baby Taglish). */
const LINES = {
  hello: ["Hi hi!", "Yay, you're back!", "I missed you!"],
  morning: ["Good morning!", "Morning hugs!"],
  night: ["Nini na…", "Good night…", "Sleepy time…"],
  feed: ["Yummy yummy!", "Nom nom nom!", "So good!", "More please!"],
  full: ["I'm full!", "Tummy full!"],
  play: ["Wheee!", "Again again!", "So fun!"],
  clean: ["So fresh!", "Bubbles!", "I smell nice!"],
  pet: ["Hehe!", "That tickles!", "I love you!", "Hug me!"],
  level: ["I'm bigger now!", "Level up! Yay!"],
  friend: ["Hi friend!", "Let's play!", "Yay, a friend!"],
  dance: ["Dance dance!", "La la la!"],
  win: ["I did it!", "Yay! We won!"],
  lose: ["Aww… again?", "Let's try again!"],
  hungry: ["I'm hungry…", "Food please?"],
  bored: ["Play with me?", "Let's walk!"],
  sleepy: ["So sleepy…", "Can I nap?"],
  icky: ["I feel icky…", "Bath time?"],
  happy: ["La la la~", "I love you!", "Today is fun!", "Hehe!"],
  home: ["Home sweet home!", "My bahay!", "Welcome to my house!"],
  jump: ["Hop!", "Boing!"],
};
const pick = (a) => a[(Math.random() * a.length) | 0];

export function createTalk({ stage, sc, voice, getPet }) {
  const el = document.createElement("div"); el.className = "tg-bubble"; el.setAttribute("aria-live", "polite"); stage.appendChild(el);
  let hideT = 0, idleT = 0, last = 0;
  const off = sc ? sc.onTick(() => {
    if (!el.classList.contains("show")) return;
    const p = sc.headScreen(); if (!p) return;
    el.style.transform = "translate(" + Math.round(p.x) + "px," + Math.round(p.y) + "px) translate(-50%,-100%)";
  }) : null;
  if (!sc) el.classList.add("flat");
  function say(what, o = {}) {
    const pet = getPet() || {};
    const txt = LINES[what] ? pick(LINES[what]) : String(what || "");
    if (!txt) return;
    last = Date.now();
    el.textContent = txt; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
    const shown = window.TMN_I18N && TMN_I18N.t ? TMN_I18N.t(txt) : txt;
    const ms = voice ? voice.say(shown, { mood: o.mood || pet.mood }) : 0;
    clearTimeout(hideT); hideT = setTimeout(() => el.classList.remove("show"), Math.max(1800, ms + 900));
    if (sc && !sc.isInside() && !o.still) sc.main.wiggle();
  }
  function chatter() {
    const pet = getPet(); if (!pet || document.hidden || stage.classList.contains("playing")) return;
    if (!voice || !voice.get().chatty || Date.now() - last < 25000) return;
    if (pet.asleep) return;
    say(pet.hunger < 35 ? "hungry" : pet.energy < 25 ? "sleepy" : pet.clean < 30 ? "icky" : pet.joy < 40 ? "bored" : "happy");
  }
  return {
    say,
    idle(on) { clearInterval(idleT); if (on) idleT = setInterval(chatter, 20000 + Math.random() * 15000); },
    dispose() { clearInterval(idleT); clearTimeout(hideT); if (off) off(); el.remove(); },
  };
}
