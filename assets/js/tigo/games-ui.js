/* TigoMeNote · tigo/games-ui.js — listahan ng laro at ang HUD (3-2-1, oras, coins, ✕ quit)
   import { gamesNode, runGame } from "./games-ui.js"
   gamesNode(onPick) → <div> para sa modal: Coin Rush, Pac-Tigo, Tigo Racing (Racing: pipili muna ng track → onPick("race", { track }))
   const r = await runGame(kind, { sc, stage, voice, seconds, track, onJump(fn) })  → { score, ms, ... }  (ang page ang nagpapadala sa server)
   Racing: may Brake (pindot nang matagal) at Turbo (may hintay) na pedal sa kanan.
   Habang naglalaro: ang Space / jump button ay para sa laro (onJump ay binibigyan ng handler ng laro). */
import { startCoinGame } from "./coin-game.js";
const TRACK_LIST = [["easy", "🟢", "Easy loop", "Wide, round track. Slower rivals."], ["classic", "🟡", "Classic", "Curves and a hairpin."], ["twisty", "🔴", "Twisty hills", "Zig-zags and tight turns. Fast rivals."]];

export const GAMES = [
  { id: "coins", icon: "🪙", name: "Coin Rush", text: "Grab coins in 30 seconds. Jump for the floating ones!" },
  { id: "pac", icon: "👾", name: "Pac-Tigo", text: "Eat all the dots in the maze. Mangoes make the Gloomies run away!" },
  { id: "race", icon: "🏁", name: "Tigo Racing", text: "3 laps against 3 Tigos. Hit ⚡ pads to go faster!" },
];
export function gamesNode(onPick) {
  const box = document.createElement("div"); box.className = "tg-games";
  box.innerHTML = GAMES.map((g) => '<button type="button" class="tg-game" data-g="' + g.id + '"><span class="tg-ic">' + g.icon + "</span><span><b>" + g.name + "</b><small>" + g.text + '</small></span><span class="tg-go">Play</span></button>').join("") +
    '<p class="faint small">Controls: <b>W A S D</b> or arrow keys, <b>Space</b> to jump. On phone: joystick + jump button, or swipe. Racing drives by itself — just steer.</p>';
  box.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-track]");
    if (tb) { try { localStorage.setItem("tmnRaceTrack", tb.dataset.track); } catch (x) {} onPick("race", { track: tb.dataset.track }); return; }
    if (e.target.closest("[data-back]")) { box.replaceWith(gamesNode(onPick)); return; }
    const b = e.target.closest("[data-g]"); if (!b) return;
    if (b.dataset.g !== "race") { onPick(b.dataset.g); return; }
    // Racing: pumili ng track
    let last = "easy"; try { last = localStorage.getItem("tmnRaceTrack") || "easy"; } catch (x) {}
    box.innerHTML = '<p class="faint small" style="margin:0">Choose a race track</p>' + TRACK_LIST.map((t) =>
      '<button type="button" class="tg-game' + (t[0] === last ? " last" : "") + '" data-track="' + t[0] + '"><span class="tg-ic">' + t[1] + "</span><span><b>" + t[2] + "</b><small>" + t[3] + '</small></span><span class="tg-go">Race</span></button>').join("") +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  });
  return box;
}

export async function runGame(kind, { sc, stage, voice, seconds, track, onJump }) {
  const hud = document.createElement("div"); hud.className = "tg-hud";
  const big = document.createElement("div"); big.className = "tg-count";
  const quit = document.createElement("button"); quit.type = "button"; quit.className = "tg-quit"; quit.setAttribute("aria-label", "Quit game"); quit.textContent = "✕";
  stage.append(hud, big, quit); stage.classList.add("playing", "game-" + kind);
  const pop = (txt) => { big.textContent = txt; big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop"); };
  const show = (parts) => { hud.innerHTML = parts.map((p) => "<span>" + p + "</span>").join(""); };

  let game = null, t0 = 0, quitNow = false;
  const result = new Promise((done) => {
    const end = (res) => {
      pop(res.label || "🪙 " + res.score);
      setTimeout(() => { hud.remove(); big.remove(); quit.remove(); stage.classList.remove("playing", "game-" + kind); }, 1500);
      onJump(null);
      done(Object.assign({ kind, ms: Math.round(performance.now() - t0), quit: quitNow }, res));
    };
    if (kind === "pac") {
      const m = import("./pac-game.js");
      m.then((x) => {
        game = x.startPac(sc, { voice, onHud: (h) => show(["❤️".repeat(Math.max(0, h.lives)) || "💔", "• " + h.dots, "🪙 " + h.coins, (h.power ? "🥭 " : "⏱ ") + h.time]),
          onEnd: (r) => end(Object.assign(r, { label: r.win ? "🎉 Cleared! 🪙 " + r.score : "🪙 " + r.score })) });
        countdown();
      });
    } else if (kind === "race") {
      // pedals: Brake (hawak) at Turbo (may hintay; napupuno ang bilog kapag handa na ulit)
      const pedals = document.createElement("div"); pedals.className = "tg-pedals";
      pedals.innerHTML = '<button type="button" class="tg-pedal brake" aria-label="Brake">🛑<small>Brake</small></button>' +
        '<button type="button" class="tg-pedal turbo" aria-label="Turbo">🔥<small>Turbo</small></button>';
      stage.append(pedals);
      const bk = pedals.querySelector(".brake"), tb = pedals.querySelector(".turbo");
      const hold = (on) => (e) => { e.preventDefault(); if (game && game.brake) game.brake(on); bk.classList.toggle("on", on); };
      bk.addEventListener("pointerdown", hold(true)); ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => bk.addEventListener(ev, hold(false)));
      tb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game && game.turbo && game.turbo()) { tb.classList.remove("fire"); void tb.offsetWidth; tb.classList.add("fire"); } });
      const keys = (e) => { if (e.repeat) return; if (e.key === "Shift" || e.key === "e" || e.key === "E") { if (game && game.turbo) game.turbo(); } };
      window.addEventListener("keydown", keys);
      import("./race-game.js").then((x) => {
        game = x.startRace(sc, { track, voice, onHud: (h) => { show(["🏁 " + h.lap + "/" + h.laps, h.place, "🪙 " + h.coins]); tb.style.setProperty("--ready", h.turbo); tb.classList.toggle("ready", h.turbo >= 1); },
          onEnd: (r) => { pedals.remove(); window.removeEventListener("keydown", keys); end(Object.assign(r, { label: r.placeText + "! 🪙 " + r.score })); } });
        onJump(() => game.jump());
        countdown();
      });
    } else {
      game = { go() {
        game = startCoinGame(sc, { seconds: seconds || 30,
          onScore(s, left) { show(["⏱ " + left, "🪙 " + s]); },
          onEnd: (s) => end({ score: s }) });
      }, stop() { end({ score: 0 }); } };
      show(["⏱ " + (seconds || 30), "🪙 0"]);
      countdown();
    }
  });
  function countdown() {
    let n = 3;
    const step = () => {
      if (quitNow) return;
      pop(n > 0 ? n : "Go!"); voice && voice.sfx(n > 0 ? "tick" : "go");
      if (n-- > 0) return setTimeout(step, 700);
      setTimeout(() => { if (big.textContent === "Go!") big.textContent = ""; }, 600);
      t0 = performance.now(); game.go();
    };
    step();
  }
  quit.addEventListener("click", () => { quitNow = true; if (game) game.stop(); });
  return result;
}
