/* TigoMeNote · tigo/games-ui.js — listahan ng laro at ang Coin Rush HUD (3-2-1, oras, coins)
   import { gamesNode, runCoinRush } from "./games-ui.js"
   gamesNode(onPick) → <div> para sa modal (Coin Rush; Pac-Tigo at Racing = malapit na)
   await runCoinRush(sc, stage) → { score, ms }  (ang page ang nagpapadala sa server) */
import { startCoinGame } from "./coin-game.js";

export const GAMES = [
  { id: "coins", icon: "🪙", name: "Coin Rush", text: "Run around and grab coins in 30 seconds. Jump for the floating ones!", ready: true },
  { id: "pac", icon: "👾", name: "Pac-Tigo", text: "Maze chase — coming soon", ready: false },
  { id: "race", icon: "🏁", name: "Tigo Racing", text: "Race your friends' Tigos — coming soon", ready: false },
];
export function gamesNode(onPick) {
  const box = document.createElement("div"); box.className = "tg-games";
  box.innerHTML = GAMES.map((g) => '<button type="button" class="tg-game" data-g="' + g.id + '"' + (g.ready ? "" : " disabled") + '><span class="tg-ic">' + g.icon + "</span><span><b>" + g.name + "</b><small>" + g.text + "</small></span>" + (g.ready ? '<span class="tg-go">Play</span>' : '<span class="tg-soon">Soon</span>') + "</button>").join("") +
    '<p class="faint small">Controls: <b>W A S D</b> or arrow keys to run, <b>Space</b> to jump. On phone: joystick + jump button, or swipe.</p>';
  box.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b && !b.disabled) onPick(b.dataset.g); });
  return box;
}
export function runCoinRush(sc, stage, seconds = 30) {
  return new Promise((done) => {
    const hud = document.createElement("div"); hud.className = "tg-hud"; hud.innerHTML = '<span class="tg-hud-time">⏱ ' + seconds + '</span><span class="tg-hud-coins">🪙 0</span>';
    const big = document.createElement("div"); big.className = "tg-count"; stage.append(hud, big);
    stage.classList.add("playing");
    let n = 3;
    const tick = () => {
      big.textContent = n > 0 ? n : "Go!"; big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
      if (n-- > 0) return setTimeout(tick, 700);
      setTimeout(() => (big.textContent = ""), 600);
      const t0 = performance.now();
      startCoinGame(sc, {
        seconds,
        onScore(s, left) { hud.firstChild.textContent = "⏱ " + left; hud.lastChild.textContent = "🪙 " + s; },
        onEnd(s) {
          big.textContent = "🪙 " + s; big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
          setTimeout(() => { hud.remove(); big.remove(); stage.classList.remove("playing"); }, 1400);
          done({ score: s, ms: Math.round(performance.now() - t0) });
        },
      });
    };
    tick();
  });
}
