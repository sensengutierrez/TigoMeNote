/* TigoMeNote · tigo/games-ui.js — listahan ng laro at ang HUD (3-2-1, oras, coins, ✕ quit)
   import { gamesNode, runGame } from "./games-ui.js"
   gamesNode(onPick, info) → <div> para sa modal: Lights Out, Coin Rush, Pac-Tigo, Tigo Racing (Racing: pipili muna ng track → onPick("race", { track }))
     Lights Out: Solo · Create a room (code para sa kaibigan) · Join a room · Ranking  → onPick("ghost", { mode, role, seed, net, partner })
     info = { name, color } (para makilala ka ng kasama). box._cleanup() = umalis sa room kapag isinara ang modal nang hindi naglaro.
   const r = await runGame(kind, { sc, stage, voice, seconds, track, onJump(fn) })  → { score, ms, ... }  (ang page ang nagpapadala sa server)
   Racing: may Brake (pindot nang matagal) at Turbo (may hintay) na pedal sa kanan.
   Habang naglalaro: ang Space / jump button ay para sa laro (onJump ay binibigyan ng handler ng laro). */
import { startCoinGame } from "./coin-game.js";
const TRACK_LIST = [["easy", "🟢", "Easy loop", "Wide, round track. Slower rivals."], ["classic", "🟡", "Classic", "Curves and a hairpin."], ["twisty", "🔴", "Twisty hills", "Zig-zags and tight turns. Fast rivals."]];

export const GAMES = [
  { id: "ghost", icon: "👻", name: "Lights Out", text: "Escape the dark school before the Hush finds you. Play solo or with a friend!", tag: "NEW" },
  { id: "coins", icon: "🪙", name: "Coin Rush", text: "Grab coins in 30 seconds. Jump for the floating ones!" },
  { id: "pac", icon: "👾", name: "Pac-Tigo", text: "Eat all the dots in the maze. Mangoes make the Gloomies run away!" },
  { id: "race", icon: "🏁", name: "Tigo Racing", text: "3 laps against 3 Tigos. Hit ⚡ pads to go faster!" },
];
// ---------- Lights Out: lobby (online duo gamit ang TMN_RT) at ranking ----------
const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s) : String(s));
function makeNet(code, lobby) {
  const fns = [lobby];
  const ch = window.TMN_RT.join("tmn-lo-" + code, (ev, d) => fns.forEach((f) => { try { f(ev, d); } catch (e) {} }));
  return { send: (ev, d) => ch.send(ev, d || {}), on: (fn) => { fns.push(fn); }, leave: () => { try { ch.send("bye", {}); } catch (e) {} ch.leave(); }, code };
}
function fmt(ms) { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
async function rankingNode(box, back) {
  let mode = "solo", period = "week";
  async function paint() {
    box.innerHTML = '<div class="tg-rk"><div class="segmented tg-rk-tabs"><button type="button" data-m="solo">Solo</button><button type="button" data-m="duo">Duo</button></div>' +
      '<div class="segmented tg-rk-tabs"><button type="button" data-p="week">This week</button><button type="button" data-p="all">All time</button></div><div class="tg-rk-list"><p class="faint small">Loading…</p></div></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ Lights Out</button>';
    box.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === mode)));
    box.querySelectorAll("[data-p]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === period)));
    try {
      const r = await TMN_API.call("games", "top", { game: "ghost", mode, period });
      const rows = (r.list || []).map((x) => '<div class="tg-rk-row' + (x.me ? " me" : "") + '"><b class="tg-rk-n">' + (x.rank <= 3 ? ["🥇", "🥈", "🥉"][x.rank - 1] : x.rank) + "</b><span>" +
        x.users.map((u) => "@" + esc(u.username)).join(" + ") + '</span><b translate="no">' + fmt(x.ms) + "</b></div>").join("");
      box.querySelector(".tg-rk-list").innerHTML = (rows || '<p class="faint small">No escapes yet. Be the first! 👻</p>') +
        (r.mine ? '<p class="small tg-rk-mine">Your best: <b>' + fmt(r.mine.ms) + "</b> · #" + r.mine.rank + " of " + r.total + "</p>" : '<p class="faint small tg-rk-mine">Escape once to get on the board.</p>');
    } catch (e) { box.querySelector(".tg-rk-list").innerHTML = '<p class="faint small">' + esc(e.message || "Couldn't load the ranking.") + "</p>"; }
  }
  box.onclick = (e) => {
    const m = e.target.closest("[data-m]"), p = e.target.closest("[data-p]");
    if (m) { mode = m.dataset.m; paint(); } else if (p) { period = p.dataset.p; paint(); } else if (e.target.closest("[data-back]")) { box.onclick = null; back(); }
  };
  paint();
}
function ghostMenu(box, onPick, info, back) {
  let net = null, handed = false, timer = null;
  box._cleanup = () => { clearInterval(timer); if (net && !handed) net.leave(); net = null; };
  const me = { name: (info && info.name) || "friend", color: (info && info.color) || "coral" };
  const go = (opt) => { handed = true; clearInterval(timer); onPick("ghost", opt); };
  function menu() {
    box._cleanup(); handed = false;
    box.innerHTML = '<div class="tg-gh-hero"><span>👻</span><div><b>Lights Out</b><small>Find the 🔑 keys, then reach the EXIT. Hide in lockers 🚪, flash the Hush 🔦.</small></div></div>' +
      '<button type="button" class="tg-game" data-x="solo"><span class="tg-ic">🔦</span><span><b>Play solo</b><small>3 keys · 2 lives · 5 minutes</small></span><span class="tg-go">Play</span></button>' +
      '<button type="button" class="tg-game" data-x="host"><span class="tg-ic">👥</span><span><b>Create a room</b><small>Get a code and play with a friend online (4 keys)</small></span><span class="tg-go">Create</span></button>' +
      '<button type="button" class="tg-game" data-x="join"><span class="tg-ic">🔑</span><span><b>Join a room</b><small>Type your friend\'s room code</small></span><span class="tg-go">Join</span></button>' +
      '<button type="button" class="tg-game" data-x="rank"><span class="tg-ic">🏆</span><span><b>Ranking</b><small>Fastest escapes · solo and duo</small></span><span class="tg-go">View</span></button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  }
  function needRt() { if (!window.TMN_RT) { box.querySelector(".tg-lobby-s").textContent = "Online play isn't available here."; return false; } return true; }
  function host() {
    const code = Array.from({ length: 5 }, () => ABC[(Math.random() * ABC.length) | 0]).join(""), seed = (Math.random() * 1e9) | 0;
    let mate = null;
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><b class="tg-code" translate="no">' + code + '</b><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy code</button>' +
      '<p class="small">Your friend opens <b>Tigo → Games → Lights Out → Join a room</b> and types this code.</p><p class="tg-lobby-s small">Waiting for your friend…</p>' +
      '<button type="button" class="btn btn-primary" data-start disabled>Start game</button></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    if (!needRt()) return;
    net = makeNet(code, (ev, d) => {
      if (ev === "join" && d && d.name) {
        mate = { name: String(d.name).slice(0, 30), color: String(d.color || "sky").slice(0, 12) };
        net.send("welcome", { name: me.name, color: me.color, seed });
        box.querySelector(".tg-lobby-s").innerHTML = "✅ <b>@" + esc(mate.name) + "</b> joined!"; box.querySelector("[data-start]").disabled = false;
      }
      if (ev === "bye" && mate) { mate = null; box.querySelector(".tg-lobby-s").textContent = "Your friend left. Waiting…"; box.querySelector("[data-start]").disabled = true; }
    });
    box.querySelector("[data-copy]").onclick = () => { try { navigator.clipboard.writeText(code); } catch (e) {} if (window.TMN_UI) TMN_UI.toast("Code copied"); };
    box.querySelector("[data-start]").onclick = () => { if (!mate) return; net.send("start", { seed }); go({ mode: "duo", role: "host", seed, net, partner: mate, me }); };
  }
  function join() {
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><input class="input tg-code-in" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC12" aria-label="Room code">' +
      '<button type="button" class="btn btn-primary" data-join>Join</button><p class="tg-lobby-s small"></p></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    const inp = box.querySelector(".tg-code-in"); setTimeout(() => inp.focus(), 50);
    inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); };
    box.querySelector("[data-join]").onclick = () => {
      const code = inp.value.trim(); const st = box.querySelector(".tg-lobby-s");
      if (code.length !== 5) { st.textContent = "The code has 5 letters/numbers."; return; }
      if (!needRt()) return;
      box._cleanup(); st.textContent = "Joining…"; let host = null, tries = 0;
      net = makeNet(code, (ev, d) => {
        if (ev === "welcome" && !host) { host = { name: String(d.name || "friend").slice(0, 30), color: String(d.color || "coral").slice(0, 12) }; clearInterval(timer); st.innerHTML = "✅ Joined <b>@" + esc(host.name) + "</b>'s room. Waiting for them to start…"; }
        if (ev === "start" && host) go({ mode: "duo", role: "guest", seed: d.seed, net, partner: host, me });
        if (ev === "bye" && host) { st.textContent = "The host left the room."; host = null; }
      });
      timer = setInterval(() => { if (host) return; if (++tries > 8) { clearInterval(timer); st.textContent = "No room with that code. Check the code and try again."; return; } net.send("join", { name: me.name, color: me.color }); }, 1200);
    };
  }
  const onMenu = (e) => {
    const x = e.target.closest("[data-x]");
    if (x) { const k = x.dataset.x; if (k === "solo") go({ mode: "solo" }); if (k === "host") host(); if (k === "join") join(); if (k === "rank") rankingNode(box, () => { box.onclick = onMenu; menu(); }); return; }
    if (e.target.closest("[data-menu]")) { menu(); return; }
    if (e.target.closest("[data-back]")) { box._cleanup(); box.onclick = null; back(); }
  };
  box.onclick = onMenu;
  menu();
}

export function gamesNode(onPick, info) {
  const box = document.createElement("div"); box.className = "tg-games";
  box._cleanup = () => {};
  box.innerHTML = GAMES.map((g) => '<button type="button" class="tg-game" data-g="' + g.id + '"><span class="tg-ic">' + g.icon + "</span><span><b>" + g.name + (g.tag ? ' <i class="tg-new">' + g.tag + "</i>" : "") + "</b><small>" + g.text + '</small></span><span class="tg-go">Play</span></button>').join("") +
    '<p class="faint small">Controls: <b>W A S D</b> or arrow keys, <b>Space</b> to jump. On phone: joystick + jump button, or swipe. Racing drives by itself — just steer.</p>';
  box.addEventListener("click", (e) => {
    if (box.onclick) return;   // nasa Lights Out menu
    const tb = e.target.closest("[data-track]");
    if (tb) { try { localStorage.setItem("tmnRaceTrack", tb.dataset.track); } catch (x) {} onPick("race", { track: tb.dataset.track }); return; }
    if (e.target.closest("[data-back]")) { const n = gamesNode(onPick, info); box._cleanup = n._cleanup; box.replaceChildren(...n.childNodes); return; }
    const b = e.target.closest("[data-g]"); if (!b) return;
    if (b.dataset.g === "ghost") { ghostMenu(box, onPick, info, () => { const n = gamesNode(onPick, info); box.replaceChildren(...n.childNodes); box._cleanup = () => {}; }); return; }
    if (b.dataset.g !== "race") { onPick(b.dataset.g); return; }
    // Racing: pumili ng track
    let last = "easy"; try { last = localStorage.getItem("tmnRaceTrack") || "easy"; } catch (x) {}
    box.innerHTML = '<p class="faint small" style="margin:0">Choose a race track</p>' + TRACK_LIST.map((t) =>
      '<button type="button" class="tg-game' + (t[0] === last ? " last" : "") + '" data-track="' + t[0] + '"><span class="tg-ic">' + t[1] + "</span><span><b>" + t[2] + "</b><small>" + t[3] + '</small></span><span class="tg-go">Race</span></button>').join("") +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  });
  return box;
}

export async function runGame(kind, { sc, stage, voice, seconds, track, onJump, ghost: gopt }) {
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
    } else if (kind === "ghost") {
      // Lights Out: 🚪 Hide at 🔦 Flash sa kanan; H = hide, F / Space = flash
      const o = gopt || { mode: "solo" };
      const btns = document.createElement("div"); btns.className = "tg-pedals tg-gbtns";
      btns.innerHTML = '<button type="button" class="tg-pedal hide" aria-label="Hide">🚪<small>Hide</small></button><button type="button" class="tg-pedal flash" aria-label="Flash">🔦<small>Flash</small></button>';
      stage.append(btns); stage.classList.add("dark");
      const hb = btns.querySelector(".hide"), fb = btns.querySelector(".flash");
      hb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game) game.hide(); });
      fb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game) game.flash(); });
      const keys = (e) => { if (e.repeat || !game) return; const k = e.key.toLowerCase(); if (k === "h") game.hide(); if (k === "f") game.flash(); };
      window.addEventListener("keydown", keys);
      import("./ghost-game.js").then((x) => {
        game = x.startGhost(sc, { voice, mode: o.mode, role: o.role, seed: o.seed || ((Math.random() * 1e9) | 0), net: o.net || null, me: o.me, partner: o.partner,
          onHud: (h) => {
            if (h.note) { pop(h.note.length > 24 ? "⚠️" : h.note); if (window.TMN_UI) TMN_UI.toast(h.note); return; }
            const t = Math.floor(h.time / 60) + ":" + String(h.time % 60).padStart(2, "0");
            show(["🔑 " + h.keys + "/" + h.need + (h.exitOpen ? " 🚪" : ""), "⏱ " + t, "🔦 " + h.flashes,
              h.duo ? (h.down ? "💤 Down — wait for help" : h.mateDown ? "🆘 Help your friend!" : "👥 OK") : "❤️".repeat(Math.max(0, h.lives)) || "💔"]);
            stage.classList.toggle("chased", !!h.chase);
            if (h.hidden) pop("🚪 " + h.hidden);
          },
          onButtons: (b) => { hb.disabled = !b.hide; hb.classList.toggle("on", !!b.hidden); hb.querySelector("small").textContent = b.hidden ? "Leave" : "Hide"; fb.disabled = !b.flash; },
          onEnd: (r) => {
            btns.remove(); window.removeEventListener("keydown", keys); stage.classList.remove("dark", "chased");
            if (o.net) setTimeout(() => o.net.leave(), 1500);
            if (!quitNow && window.TMN_API) TMN_API.call("games", "finish", { game: "ghost", mode: o.mode === "duo" ? "duo" : "solo", ms: r.ms, keys: r.keys, win: !!r.win, partner: o.partner && o.partner.name }).catch(() => {});
            end(r);
          } });
        stage._game = game;   // para sa tests
        onJump(() => game.flash());
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
