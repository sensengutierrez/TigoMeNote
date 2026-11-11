/* TigoMeNote · tigo/games-ui.js — listahan ng laro at ang HUD (3-2-1, oras, coins, ✕ quit)
   import { gamesNode, runGame } from "./games-ui.js"
   gamesNode(onPick, info) → <div> para sa modal: Lights Out, Coin Rush, Pac-Tigo, Tigo Racing (Racing: pipili muna ng track → onPick("race", { track }))
     Lights Out: Solo · Create a room (code para sa kaibigan) · Join a room · Ranking  → onPick("ghost", { mode, role, seed, net, partner })
     info = { name, color } (para makilala ka ng kasama). box._cleanup() = umalis sa room kapag isinara ang modal nang hindi naglaro.
   const r = await runGame(kind, { sc, stage, voice, seconds, track, onJump(fn) })  → { score, ms, ... }  (ang page ang nagpapadala sa server)
   Racing: may Brake (pindot nang matagal) at Turbo (may hintay) na pedal sa kanan.
   Habang naglalaro: ang Space / jump button ay para sa laro (onJump ay binibigyan ng handler ng laro). */
import { startCoinGame } from "./coin-game.js";
import { gameMenu, rankingView } from "./room-lobby.js";
import { touchLook } from "./touch-look.js";
// Mga mapa ng karera (bawat isa ay may sariling itsura: parang, gubat, disyerto, niyebe)
const TRACK_LIST = [["easy", "🌼", "Sunny meadow", "Wide, round track. Slower rivals."], ["classic", "🌲", "Pine forest", "Curves and a hairpin."], ["twisty", "🌵", "Desert canyon", "Zig-zags and tight turns. Fast rivals."], ["grand", "❄️", "Snow tour", "A long road: big straights and sweeping bends. 2 laps."]];

export const GAMES = [
  { id: "dash", icon: "🏃", name: "Sky Dash", text: "Race on a sky track! Switch lanes, jump, grab coins, ride the slipstream. Up to 4 friends.", tag: "NEW" },
  { id: "siege", icon: "💦", name: "Gloom Siege", text: "Wave after wave of Gloomies! Bubble them away together. Co-op up to 4.", tag: "NEW" },
  { id: "sudoku", icon: "🧩", name: "Sudoku", text: "Easy, Medium or Hard. Race your friends to solve the same puzzle.", tag: "NEW" },
  { id: "ghost", icon: "👻", name: "Lights Out", text: "Escape the dark school before the Hush finds you. Play solo or with a friend!" },
  { id: "coins", icon: "🪙", name: "Coin Rush", text: "Grab coins in 30 seconds. Jump for the floating ones!" },
  { id: "pac", icon: "👾", name: "Pac-Tigo", text: "Eat all the dots in the maze. Mangoes make the Gloomies run away!" },
  { id: "race", icon: "🏁", name: "Tigo Racing", text: "Buggy race on 4 maps! Grab ❓ boxes for 🚀 🛡️ 🧲, and hit ⚡ pads." },
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
  let mode = "solo", period = "week", level = "easy";
  async function paint() {
    box.innerHTML = '<div class="tg-rk"><div class="segmented tg-rk-tabs"><button type="button" data-m="solo">Solo</button><button type="button" data-m="duo">Duo</button></div>' +
      '<div class="segmented tg-rk-tabs"><button type="button" data-l="easy">🟢 Easy</button><button type="button" data-l="medium">🟡 Medium</button><button type="button" data-l="hard">🔴 Hard</button></div>' +
      '<div class="segmented tg-rk-tabs"><button type="button" data-p="week">This week</button><button type="button" data-p="all">All time</button></div><div class="tg-rk-list"><p class="faint small">Loading…</p></div></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ Lights Out</button>';
    box.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === mode)));
    box.querySelectorAll("[data-p]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === period)));
    box.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === level)));
    try {
      const r = await TMN_API.call("games", "top", { game: "ghost", mode, period, level });
      const rows = (r.list || []).map((x) => '<div class="tg-rk-row' + (x.me ? " me" : "") + '"><b class="tg-rk-n">' + (x.rank <= 3 ? ["🥇", "🥈", "🥉"][x.rank - 1] : x.rank) + "</b><span>" +
        x.users.map((u) => "@" + esc(u.username)).join(" + ") + '</span><b translate="no">' + fmt(x.ms) + "</b></div>").join("");
      box.querySelector(".tg-rk-list").innerHTML = (rows || '<p class="faint small">No escapes yet. Be the first! 👻</p>') +
        (r.mine ? '<p class="small tg-rk-mine">Your best: <b>' + fmt(r.mine.ms) + "</b> · #" + r.mine.rank + " of " + r.total + "</p>" : '<p class="faint small tg-rk-mine">Escape once to get on the board.</p>');
    } catch (e) { box.querySelector(".tg-rk-list").innerHTML = '<p class="faint small">' + esc(e.message || "Couldn't load the ranking.") + "</p>"; }
  }
  box.onclick = (e) => {
    const m = e.target.closest("[data-m]"), p = e.target.closest("[data-p]"), l = e.target.closest("[data-l]");
    if (l) { level = l.dataset.l; paint(); } else if (m) { mode = m.dataset.m; paint(); } else if (p) { period = p.dataset.p; paint(); } else if (e.target.closest("[data-back]")) { box.onclick = null; back(); }
  };
  paint();
}
function ghostMenu(box, onPick, info, back, joinCode) {
  const here = (r) => { if (window.TMN_HERE) TMN_HERE.set(r); };
  let net = null, handed = false, timer = null;
  box._cleanup = () => { clearInterval(timer); if (net && !handed) net.leave(); net = null; here(null); };
  const me = { name: (info && info.name) || "friend", color: (info && info.color) || "coral", av: (info && info.av) || null };
  const go = (opt) => { handed = true; here(null); clearInterval(timer); onPick("ghost", opt); };
  // Antas: Easy (isang palapag) · Medium (buong bahay) · Hard (malaking bahay). Tanda ang huling pinili.
  const LV = [["easy", "🟢", "Easy", "One floor · 3 keys · 5 min"], ["medium", "🟡", "Medium", "Whole house · 5 keys · 7 min"], ["hard", "🔴", "Hard", "Big house · 7 keys · 9 min"]];
  let level = "easy"; try { level = localStorage.getItem("tmnGhostLevel") || "easy"; } catch (e) {}
  if (!LV.some((l) => l[0] === level)) level = "easy";
  const lvChips = () => '<div class="segmented tg-lv" role="group" aria-label="Level">' + LV.map((l) => '<button type="button" data-lv="' + l[0] + '" aria-pressed="' + (l[0] === level) + '">' + l[1] + " " + l[2] + "</button>").join("") + '</div><p class="faint small tg-lv-t" style="margin:0">' + LV.find((l) => l[0] === level)[3] + "</p>";
  const setLv = (v) => { level = v; try { localStorage.setItem("tmnGhostLevel", v); } catch (e) {} box.querySelectorAll("[data-lv]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lv === v))); const t = box.querySelector(".tg-lv-t"); if (t) t.textContent = LV.find((l) => l[0] === v)[3]; };
  function menu() {
    box._cleanup(); handed = false;
    box.innerHTML = '<div class="tg-gh-hero"><span>👻</span><div><b>Lights Out</b><small>Find the 🔑 keys, then reach the EXIT. Hide in lockers 🚪, flash the Hush 🔦.</small></div></div>' +
      lvChips() +
      '<button type="button" class="tg-game" data-x="solo"><span class="tg-ic">🔦</span><span><b>Play solo</b><small>2 lives · find every key, then the EXIT</small></span><span class="tg-go">Play</span></button>' +
      '<button type="button" class="tg-game" data-x="host"><span class="tg-ic">👥</span><span><b>Create a room</b><small>Get a code and play with a friend online (one more key)</small></span><span class="tg-go">Create</span></button>' +
      '<button type="button" class="tg-game" data-x="join"><span class="tg-ic">🔑</span><span><b>Join a room</b><small>Type your friend\'s room code</small></span><span class="tg-go">Join</span></button>' +
      '<button type="button" class="tg-game" data-x="rank"><span class="tg-ic">🏆</span><span><b>Ranking</b><small>Fastest escapes · solo and duo</small></span><span class="tg-go">View</span></button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  }
  function needRt() { if (!window.TMN_RT) { box.querySelector(".tg-lobby-s").textContent = "Online play isn't available here."; return false; } return true; }
  function host() {
    const code = Array.from({ length: 5 }, () => ABC[(Math.random() * ABC.length) | 0]).join(""), seed = (Math.random() * 1e9) | 0;
    let mate = null;
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><b class="tg-code" translate="no">' + code + '</b><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy code</button>' +
      '<p class="small">Your friend opens <b>Tigo → Games → Lights Out → Join a room</b> and types this code.</p>' + lvChips() + '<p class="tg-lobby-s small">Waiting for your friend…</p>' +
      '<button type="button" class="btn btn-primary" data-start disabled>Start game</button></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    if (!needRt()) return;
    here({ game: "ghost", code, players: 1, max: 2 });
    net = makeNet(code, (ev, d) => {
      if (ev === "join" && d && d.name) {
        mate = { name: String(d.name).slice(0, 30), color: String(d.color || "sky").slice(0, 12), av: d.av && typeof d.av === "object" ? d.av : null };
        here({ game: "ghost", code, players: 2, max: 2 });
        net.send("welcome", { name: me.name, color: me.color, av: me.av, seed });
        box.querySelector(".tg-lobby-s").innerHTML = "✅ <b>@" + esc(mate.name) + "</b> joined!"; box.querySelector("[data-start]").disabled = false;
      }
      if (ev === "bye" && mate) { mate = null; here({ game: "ghost", code, players: 1, max: 2 }); box.querySelector(".tg-lobby-s").textContent = "Your friend left. Waiting…"; box.querySelector("[data-start]").disabled = true; }
    });
    box.querySelector("[data-copy]").onclick = () => { try { navigator.clipboard.writeText(code); } catch (e) {} if (window.TMN_UI) TMN_UI.toast("Code copied"); };
    box.querySelector("[data-start]").onclick = () => { if (!mate) return; net.send("start", { seed, level }); go({ mode: "duo", role: "host", level, seed, net, partner: mate, me }); };
  }
  function join(auto) {
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
        if (ev === "welcome" && !host) { host = { name: String(d.name || "friend").slice(0, 30), color: String(d.color || "coral").slice(0, 12), av: d.av && typeof d.av === "object" ? d.av : null }; clearInterval(timer); st.innerHTML = "✅ Joined <b>@" + esc(host.name) + "</b>'s room. Waiting for them to start…"; }
        if (ev === "start" && host) go({ mode: "duo", role: "guest", level: LV.some((l) => l[0] === d.level) ? d.level : "easy", seed: d.seed, net, partner: host, me });
        if (ev === "bye" && host) { st.textContent = "The host left the room."; host = null; }
      });
      timer = setInterval(() => { if (host) return; if (++tries > 8) { clearInterval(timer); st.textContent = "No room with that code. Check the code and try again."; return; } net.send("join", { name: me.name, color: me.color, av: me.av }); }, 1200);
    };
    if (auto) { inp.value = auto; box.querySelector("[data-join]").click(); }   // galing sa "Friends playing → Join"
  }
  const onMenu = (e) => {
    const lv = e.target.closest("[data-lv]"); if (lv) { setLv(lv.dataset.lv); return; }
    const x = e.target.closest("[data-x]");
    if (x && x.dataset.x !== "rank" && info && info.tired && info.tired()) { if (window.TMN_UI) TMN_UI.toast(info.tired()); return; }
    if (x) { const k = x.dataset.x; if (k === "solo") go({ mode: "solo", level }); if (k === "host") host(); if (k === "join") join(); if (k === "rank") rankingNode(box, () => { box.onclick = onMenu; menu(); }); return; }
    if (e.target.closest("[data-menu]")) { menu(); return; }
    if (e.target.closest("[data-back]")) { box._cleanup(); box.onclick = null; back(); }
  };
  box.onclick = onMenu;
  menu();
  if (joinCode && !(info && info.tired && info.tired())) join(joinCode);
}


// Sky Dash, Gloom Siege, Sudoku: Solo · Create a room (hanggang 4) · Join · Ranking (room-lobby.js)
const SDK_LV = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]];
const MULTI = {
  dash: { title: "Sky Dash", blurb: "Switch lanes, jump the bars, dodge the boxes. Stay behind a rival to ride the slipstream!", soloSub: "Race 3 Tigo bots", rankSub: "Fastest races",
    rank: (box, back) => rankingView(box, back, { game: "dash", metric: "ms" }) },
  siege: { title: "Gloom Siege", blurb: "Tigo bubbles the nearest Gloomy by itself. Drag the screen to look around, grab power-ups (⚡🔱💥🛡️❄️❤️), and 💦 Splash when they crowd you.", soloSub: "How many waves can you last?", rankSub: "Highest scores",
    rank: (box, back) => rankingView(box, back, { game: "siege", metric: "score" }) },
  sudoku: { title: "Sudoku", blurb: "Fill every row, column and box with 1–9. 3 mistakes and you're out.", rankSub: "Fastest solves",
    soloOpts: SDK_LV.map(([k, l]) => ({ label: l, sub: { easy: "Relaxed · 41 clues", medium: "A real puzzle · 32 clues", hard: "For experts · 26 clues" }[k], opt: { level: k, label: l } })),
    hostOpts: SDK_LV.map(([k, l]) => ({ label: l, opt: { level: k, label: l } })),
    rank: (box, back) => rankingView(box, back, { game: "sudoku", metric: "ms", levels: SDK_LV }) },
};

// Mga fina-follow mo na nasa Tigo ngayon (games-fast "friends"): may bukas na room = Join
const GNAME = { ghost: "Lights Out", dash: "Sky Dash", siege: "Gloom Siege", sudoku: "Sudoku" };
function friendsHtml(list) {
  if (!list.length) return "";
  return '<div class="tg-fr"><p class="tg-fr-h">Friends playing</p>' + list.slice(0, 8).map((f, i) => {
    const u = f.user || {}, nm = esc(u.display_name || u.username || "friend");
    return '<div class="tg-fr-row"><span class="avatar" style="--size:30px">' + (u.avatar_url ? '<img alt="" src="' + esc(u.avatar_url) + '">' : esc((u.display_name || u.username || "?").slice(0, 1).toUpperCase())) + "</span>" +
      "<span><b>" + nm + "</b><small>" + (f.game ? "🎮 " + GNAME[f.game] + " room · " + f.players + "/" + f.max : "🟢 In Tigo now") + "</small></span>" +
      (f.joinable ? '<button type="button" class="tg-go" data-fj="' + i + '">Join</button>' : f.game ? '<span class="tg-soon">Full</span>' : "") + "</div>";
  }).join("") + "</div>";
}
export function gamesNode(onPick, info) {
  const box = document.createElement("div"); box.className = "tg-games";
  box._cleanup = () => {};
  const home = () => { const n = gamesNode(onPick, info); box.replaceChildren(...n.childNodes); box._cleanup = () => {}; box._friends = n._friends; n._adopt(box); };
  const openGame = (id, joinCode) => {
    if (MULTI[id]) { const m = MULTI[id], g = GAMES.find((x) => x.id === id); gameMenu(box, Object.assign({ id, icon: g.icon, info, joinCode, onStart: (opt) => onPick(id, opt), back: home }, m)); return true; }
    if (id === "ghost") { ghostMenu(box, onPick, info, home, joinCode); return true; }
    return false;
  };
  box.innerHTML = '<div class="tg-fr-slot"></div>' + GAMES.map((g) => '<button type="button" class="tg-game" data-g="' + g.id + '"><span class="tg-ic">' + g.icon + "</span><span><b>" + g.name + (g.tag ? ' <i class="tg-new">' + g.tag + "</i>" : "") + "</b><small>" + g.text + '</small></span><span class="tg-go">Play</span></button>').join("") +
    '<p class="faint small">Controls: <b>W A S D</b> or arrow keys, <b>Space</b> to jump. On phone: joystick + jump button, or swipe. Racing drives by itself — just steer.</p>';
  // listahan ng mga kaibigang naglalaro (kinukuha kada bukas; target = ang box na nakikita)
  box._friends = [];
  box._adopt = (target) => {
    if (!window.TMN_API || !navigator.onLine) return;
    TMN_API.call("games", "friends", {}).then((r) => { target._friends = r.list || []; const slot = target.querySelector(".tg-fr-slot"); if (slot) slot.innerHTML = friendsHtml(target._friends); }).catch(() => {});
  };
  box._adopt(box);
  box.addEventListener("click", (e) => {
    if (box.onclick) return;   // nasa menu ng isang laro
    const fj = e.target.closest("[data-fj]");
    if (fj) { const f = box._friends[+fj.dataset.fj]; if (f && f.joinable) openGame(f.game, f.code); return; }
    const tb = e.target.closest("[data-track]");
    if (tb) { try { localStorage.setItem("tmnRaceTrack", tb.dataset.track); } catch (x) {} onPick("race", { track: tb.dataset.track }); return; }
    if (e.target.closest("[data-back]")) { home(); return; }
    const b = e.target.closest("[data-g]"); if (!b) return;
    if (openGame(b.dataset.g)) return;
    if (b.dataset.g !== "race") { onPick(b.dataset.g); return; }
    // Racing: pumili ng track
    let last = "easy"; try { last = localStorage.getItem("tmnRaceTrack") || "easy"; } catch (x) {}
    box.innerHTML = '<p class="faint small" style="margin:0">Choose a map</p>' + TRACK_LIST.map((t) =>
      '<button type="button" class="tg-game' + (t[0] === last ? " last" : "") + '" data-track="' + t[0] + '"><span class="tg-ic">' + t[1] + "</span><span><b>" + t[2] + "</b><small>" + t[3] + '</small></span><span class="tg-go">Race</span></button>').join("") +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  });
  return box;
}

export async function runGame(kind, { sc, stage, voice, seconds, track, onJump, ghost: gopt, opt: mopt }) {
  const hud = document.createElement("div"); hud.className = "tg-hud";
  const big = document.createElement("div"); big.className = "tg-count";
  const quit = document.createElement("button"); quit.type = "button"; quit.className = "tg-quit"; quit.setAttribute("aria-label", "Quit game"); quit.textContent = "✕";
  stage.append(hud, big, quit); stage.classList.add("playing", "game-" + kind);
  const pop = (txt) => { big.textContent = txt; big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop"); };
  const show = (parts) => { hud.innerHTML = parts.map((p) => "<span>" + p + "</span>").join(""); };
  // maliit na anunsyo na kusang nawawala (hal. "Wave 3"); small = mas maliit pa (napulot na item)
  const note = document.createElement("div"); note.className = "tg-flash"; stage.append(note);
  const flash = (txt, sub, small) => { note.innerHTML = "<b>" + txt + "</b>" + (sub ? "<small>" + sub + "</small>" : ""); note.classList.toggle("sm", !!small); note.classList.remove("on"); void note.offsetWidth; note.classList.add("on"); };

  let game = null, t0 = 0, quitNow = false;
  const result = new Promise((done) => {
    const end = (res) => {
      pop(res.label || "🪙 " + res.score);
      setTimeout(() => { hud.remove(); big.remove(); quit.remove(); note.remove(); stage.classList.remove("playing", "game-" + kind); }, 1500);
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
    } else if (kind === "dash" || kind === "siege" || kind === "sudoku") {
      const o = mopt || { mode: "solo" }, net = o.mode === "multi" ? o.net : null;
      const send = (r) => { if (!quitNow && window.TMN_API) TMN_API.call("games", "finish", { game: kind, mode: net ? "multi" : "solo", ms: r.ms, score: r.score || 0, win: !!(r.finished !== undefined ? r.finished : r.solved !== undefined ? r.solved : true), level: o.level }).catch(() => {}); };
      const done = (r) => { if (net) setTimeout(() => net.leave(), 1500); send(r); end(r); };
      if (kind === "sudoku") {
        hud.remove(); quit.classList.add("sdk-quit");
        import("./sudoku-game.js").then((x) => { game = x.startSudoku(stage, { voice, seed: o.seed, level: o.level || "easy", net, me: o.me, onEnd: done }); stage._game = game; t0 = performance.now(); game.go = () => {}; });
      } else if (kind === "dash") {
        stage.classList.add("sky");
        import("./dash-game.js").then((x) => {
          game = x.startDash(sc, { voice, seed: o.seed, net, me: o.me,
            onHud: (h) => { show(["🏁 " + h.pct + "%", h.place + " / " + h.of, "🪙 " + h.coins].concat(h.boost ? ["⚡"] : h.slip ? ["💨 Slipstream"] : [])); },
            onEnd: (r) => { offSwipe(); stage.classList.remove("sky", "swipe-only"); done(r); } });
          const offSwipe = touchLook(stage, { onSwipe: (d) => game.swipe(d) });
          stage.classList.add("swipe-only");   // swipe lang ang kontrol: walang joystick at jump button (mas kita ang daan)   // swipe: kaliwa/kanan = lane, pataas = talon
          stage._game = game; onJump(() => game.jump()); countdown();
        });
      } else {
        const btns = document.createElement("div"); btns.className = "tg-pedals tg-gbtns";
        btns.innerHTML = '<button type="button" class="tg-pedal splash" aria-label="Splash">💦<small>Splash</small></button>';
        stage.append(btns); stage.classList.add("dusk");
        const sb = btns.querySelector(".splash");
        sb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game) game.splash(); });
        import("./siege-game.js").then((x) => {
          game = x.startSiege(sc, { voice, seed: o.seed, net, me: o.me,
            onHud: (h) => {
              if (h.note) { if (window.TMN_UI) TMN_UI.toast(h.note); return; }
              if (h.banner) { flash(h.banner, h.sub); return; }          // "Wave 3 · ❄️ Snow": lalabas tapos kusang mawawala
              if (h.toast) { flash(h.toast, "", true); return; }         // napulot: "⚡ Rapid"
              const BI = { rapid: "⚡", triple: "🔱", big: "💥" };
              show(["❤️ " + h.hp, "🌊 " + h.wave, "⭐ " + h.score].concat(h.team ? ["👥 " + h.team] : []).concat(h.buff ? [BI[h.buff[0]] + " " + h.buff[1]] : []).concat(h.shield ? ["🛡️ " + h.shield] : []).concat(h.freeze ? ["❄️ " + h.freeze] : [])
                .concat(h.breakT ? ["⏳ " + h.breakT] : []).concat(h.down ? ["💤 Wait for help"] : h.help ? ["🆘 Help!"] : []));
            },
            onButtons: (b) => { sb.disabled = !b.splash; sb.querySelector("small").textContent = b.cd ? b.cd + " s" : "Splash"; },
            onEnd: (r) => { offLook(); btns.remove(); stage.classList.remove("dusk"); done(r); } });
          // hila sa screen = ikot ng view; pinch / wheel = lapit-layo
          const offLook = touchLook(stage, { onDrag: (dx, dy) => game.look(dx, dy), onPinch: (k) => game.zoom(k), onWheel: (dy) => game.zoom(Math.exp(-dy * 0.0012)) });
          stage._game = game; onJump(() => game.splash()); countdown();
        });
      }
    } else if (kind === "ghost") {
      // Lights Out: 🚪 Hide at 🔦 Flash sa kanan; H = hide, F / Space = flash
      const o = gopt || { mode: "solo" };
      const btns = document.createElement("div"); btns.className = "tg-pedals tg-gbtns";
      btns.innerHTML = '<button type="button" class="tg-pedal view" aria-label="Camera">🎥<small>Top</small></button><button type="button" class="tg-pedal hide" aria-label="Hide">🚪<small>Hide</small></button><button type="button" class="tg-pedal flash" aria-label="Flash">🔦<small>Flash</small></button>';
      stage.append(btns); stage.classList.add("dark");
      const hb = btns.querySelector(".hide"), fb = btns.querySelector(".flash");
      hb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game) game.hide(); });
      fb.addEventListener("pointerdown", (e) => { e.preventDefault(); if (game) game.flash(); });
      // 🎥 camera: Top (mula sa itaas) ↔ Close (sa likod ni Tigo; hilahin ang screen para umikot). Tanda ang huling pinili.
      const vb = btns.querySelector(".view");
      const setView = (m) => { if (!game || !game.view) return; const v = game.view(m); vb.querySelector("small").textContent = v === "close" ? "Close" : "Top"; try { localStorage.setItem("tmnGhostView", v); } catch (e) {} };
      vb.addEventListener("pointerdown", (e) => { e.preventDefault(); setView(); });
      const offLook = touchLook(stage, { onDrag: (dx, dy) => { if (game && game.look) game.look(dx, dy); } });
      const keys = (e) => { if (e.repeat || !game) return; const k = e.key.toLowerCase(); if (k === "h") game.hide(); if (k === "f") game.flash(); };
      window.addEventListener("keydown", keys);
      import("./ghost-game.js").then((x) => {
        game = x.startGhost(sc, { voice, mode: o.mode, role: o.role, level: o.level || "easy", seed: o.seed || ((Math.random() * 1e9) | 0), net: o.net || null, me: o.me, partner: o.partner,
          onHud: (h) => {
            if (h.note) { pop(h.note.length > 24 ? "⚠️" : h.note); if (window.TMN_UI) TMN_UI.toast(h.note); return; }
            const t = Math.floor(h.time / 60) + ":" + String(h.time % 60).padStart(2, "0");
            show(["🔑 " + h.keys + "/" + h.need + (h.exitOpen ? " 🚪" : ""), "⏱ " + t, "🔦 " + h.flashes,
              h.duo ? (h.down ? "💤 Down — wait for help" : h.mateDown ? "🆘 Help your friend!" : "👥 OK") : "❤️".repeat(Math.max(0, h.lives)) || "💔"].concat(h.hidden ? ['<b class="tg-hidec">🚪 ' + h.hidden + "</b>"] : []));
            stage.classList.toggle("chased", !!h.chase);
          },
          onButtons: (b) => { hb.disabled = !b.hide; hb.classList.toggle("on", !!b.hidden); hb.querySelector("small").textContent = b.hidden ? "Leave" : "Hide"; fb.disabled = !b.flash; },
          onEnd: (r) => {
            offLook(); btns.remove(); window.removeEventListener("keydown", keys); stage.classList.remove("dark", "chased");
            if (o.net) setTimeout(() => o.net.leave(), 1500);
            if (!quitNow && window.TMN_API) TMN_API.call("games", "finish", { game: "ghost", level: r.level || "easy", mode: o.mode === "duo" ? "duo" : "solo", ms: r.ms, keys: r.keys, win: !!r.win, partner: o.partner && o.partner.name }).catch(() => {});
            end(r);
          } });
        stage._game = game;   // para sa tests
        try { if (localStorage.getItem("tmnGhostView") === "close") setView("close"); } catch (e) {}
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
        game = x.startRace(sc, { track, voice, onHud: (h) => { if (h.toast) { flash(h.toast, "", true); return; } show(["🏁 " + h.lap + "/" + h.laps, h.place, "🪙 " + h.coins].concat(h.fx ? [h.fx] : [])); tb.style.setProperty("--ready", h.turbo); tb.classList.toggle("ready", h.turbo >= 1); },
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
