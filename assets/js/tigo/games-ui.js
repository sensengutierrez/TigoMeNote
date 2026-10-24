/* TigoMeNote · tigo/games-ui.js — listahan ng laro at ang HUD (3-2-1, oras, coins, ✕ quit)
   import { gamesNode, runGame } from "./games-ui.js"
   gamesNode(onPick) → <div> para sa modal: Coin Rush, Pac-Tigo, Tigo Racing
   const r = await runGame(kind, { sc, stage, voice, seconds, onJump(fn) })  → { score, ms, ... }  (ang page ang nagpapadala sa server)
   Habang naglalaro: ang Space / jump button ay para sa laro (onJump ay binibigyan ng handler ng laro). */
import { startCoinGame } from "./coin-game.js";

export const GAMES = [
  { id: "coins", icon: "🪙", name: "Coin Rush", text: "Grab coins in 30 seconds. Jump for the floating ones!" },
  { id: "pac", icon: "👾", name: "Pac-Tigo", text: "Eat all the dots in the maze. Mangoes make the Gloomies run away!" },
  { id: "race", icon: "🏁", name: "Tigo Racing", text: "3 laps against 3 Tigos. Hit ⚡ pads to go faster!" },
];
export function gamesNode(onPick) {
  const box = document.createElement("div"); box.className = "tg-games";
  box.innerHTML = GAMES.map((g) => '<button type="button" class="tg-game" data-g="' + g.id + '"><span class="tg-ic">' + g.icon + "</span><span><b>" + g.name + "</b><small>" + g.text + '</small></span><span class="tg-go">Play</span></button>').join("") +
    '<p class="faint small">Controls: <b>W A S D</b> or arrow keys, <b>Space</b> to jump. On phone: joystick + jump button, or swipe. Racing drives by itself — just steer.</p>';
  box.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b) onPick(b.dataset.g); });
  return box;
}

export async function runGame(kind, { sc, stage, voice, seconds, onJump }) {
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
      import("./race-game.js").then((x) => {
        game = x.startRace(sc, { voice, onHud: (h) => show(["🏁 " + h.lap + "/" + h.laps, h.place, "🪙 " + h.coins]),
          onEnd: (r) => end(Object.assign(r, { label: r.placeText + "! 🪙 " + r.score })) });
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
