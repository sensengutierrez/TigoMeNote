/* TigoMeNote · tigo/room-lobby.js — menu ng larong pang-marami (2–4 na player): Solo · Create a room · Join a room · Ranking
   import { gameMenu } from "./room-lobby.js"
   gameMenu(box, { id, icon, title, blurb, info:{name,color}, max: 4, soloOpts, rank, onStart(opt), back() })
     soloOpts: [{ label, sub, opt }] (hal. Sudoku: Easy/Medium/Hard) — kung wala, iisang "Play solo"
     rank: { node(box, back) } — ipinapakita ang ranking
     onStart(opt): { mode: "solo"|"multi", net?, seed, ...soloOpt }
   Room: 5 titik na code; ang host ang gumagawa; hanggang 4. Ang listahan ng kasali (roster) ay galing sa host.
   net (para sa laro): { me: pid, host: bool, roster: [{ p, name, color, av }], send(ev, data), on(fn(ev, data, from)), leave() }
     Bawat message ay may kasamang "p" (pid ng nagpadala). Gamit ang TMN_RT (Supabase Realtime broadcast). */
const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s) : String(s));
const rid = (n) => Array.from({ length: n }, () => ABC[(Math.random() * ABC.length) | 0]).join("");

export function makeNet(topic, me) {
  const fns = [];
  const ch = window.TMN_RT.join(topic, (ev, d) => { const from = d && d.p; fns.forEach((f) => { try { f(ev, d || {}, from); } catch (e) {} }); });
  return {
    me, host: false, roster: [],
    send: (ev, d) => ch.send(ev, Object.assign({ p: me }, d || {})),
    on: (fn) => { fns.push(fn); },
    off: (fn) => { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); },
    leave: () => { try { ch.send("bye", { p: me }); } catch (e) {} ch.leave(); },
  };
}

export function gameMenu(box, o) {
  const max = o.max || 4, me = { name: (o.info && o.info.name) || "friend", color: (o.info && o.info.color) || "coral", av: (o.info && o.info.av) || null };
  const here = (r) => { if (window.TMN_HERE) TMN_HERE.set(r); };   // ipakita sa mga follower na may bukas kang room (o wala na)
  let net = null, handed = false, timer = null, lobbyFn = null;
  box._cleanup = () => { clearInterval(timer); if (net && !handed) net.leave(); net = null; here(null); };
  const go = (opt) => { handed = true; here(null); clearInterval(timer); if (net && lobbyFn) net.off(lobbyFn); o.onStart(Object.assign({ me }, opt)); };
  function menu() {
    box._cleanup(); handed = false;
    const solos = o.soloOpts || [{ label: "Play solo", sub: o.soloSub || "Practice and set your best", opt: {} }];
    box.innerHTML = '<div class="tg-gh-hero rl-hero ' + o.id + '"><span>' + o.icon + "</span><div><b>" + esc(o.title) + "</b><small>" + esc(o.blurb) + "</small></div></div>" +
      solos.map((s, i) => '<button type="button" class="tg-game" data-solo="' + i + '"><span class="tg-ic">🎮</span><span><b>' + esc(s.label) + "</b><small>" + esc(s.sub || "") + '</small></span><span class="tg-go">Play</span></button>').join("") +
      '<button type="button" class="tg-game" data-x="host"><span class="tg-ic">👥</span><span><b>Create a room</b><small>Up to ' + max + ' players · share the code with friends</small></span><span class="tg-go">Create</span></button>' +
      '<button type="button" class="tg-game" data-x="join"><span class="tg-ic">🔑</span><span><b>Join a room</b><small>Type your friend\'s room code</small></span><span class="tg-go">Join</span></button>' +
      (o.rank ? '<button type="button" class="tg-game" data-x="rank"><span class="tg-ic">🏆</span><span><b>Ranking</b><small>' + esc(o.rankSub || "The best players") + '</small></span><span class="tg-go">View</span></button>' : "") +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
  }
  const stat = () => box.querySelector(".tg-lobby-s");
  function rosterHtml(r) { return '<div class="rl-roster">' + r.map((x, i) => '<span class="rl-p"><i class="rl-dot ' + esc(x.color) + '"></i>@' + esc(x.name) + (i === 0 ? " 👑" : "") + "</span>").join("") + "</div>"; }
  function host() {
    if (!window.TMN_RT) { menu(); if (window.TMN_UI) TMN_UI.toast("Online play isn't available here."); return; }
    const code = rid(5), seed = (Math.random() * 1e9) | 0, pid = "h" + rid(6);
    let roster = [{ p: pid, name: me.name, color: me.color, av: me.av }], extra = (o.hostOpts && o.hostOpts[0] && o.hostOpts[0].opt) || {};
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><b class="tg-code" translate="no">' + code + '</b><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy code</button>' +
      '<p class="small">Friends open <b>Tigo → Games → ' + esc(o.title) + " → Join a room</b> and type this code. Up to " + max + " players.</p>" +
      (o.hostOpts ? '<div class="segmented rl-opts">' + o.hostOpts.map((h, i) => '<button type="button" data-ho="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(h.label) + "</button>").join("") + "</div>" : "") +
      '<div class="rl-list"></div><p class="tg-lobby-s small">Waiting for friends…</p>' +
      '<button type="button" class="btn btn-primary" data-start disabled>Start</button></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    net = makeNet("tmn-" + o.id + "-" + code, pid); net.host = true;
    const paint = () => {
      box.querySelector(".rl-list").innerHTML = rosterHtml(roster);
      stat().textContent = roster.length > 1 ? roster.length + " / " + max + " players" : "Waiting for friends…";
      box.querySelector("[data-start]").disabled = roster.length < 2;
      net.send("roster", { roster, extra });
      here({ game: o.id, code, players: roster.length, max });
    };
    lobbyFn = (ev, d, from) => {
      if (ev === "join" && from && d.name) {
        if (!roster.some((x) => x.p === from)) {
          if (roster.length >= max) { net.send("full", { to: from }); return; }
          roster.push({ p: from, name: String(d.name).slice(0, 30), color: String(d.color || "sky").slice(0, 12), av: d.av && typeof d.av === "object" ? d.av : null });
        }
        paint();
      }
      if (ev === "bye" && roster.some((x) => x.p === from)) { roster = roster.filter((x) => x.p !== from); paint(); }
    };
    net.on(lobbyFn); paint();
    box.querySelector("[data-copy]").onclick = () => { try { navigator.clipboard.writeText(code); } catch (e) {} if (window.TMN_UI) TMN_UI.toast("Code copied"); };
    box.querySelectorAll("[data-ho]").forEach((b) => { b.onclick = () => { extra = o.hostOpts[+b.dataset.ho].opt; box.querySelectorAll("[data-ho]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); net.send("roster", { roster, extra }); }; });
    box.querySelector("[data-start]").onclick = () => {
      if (roster.length < 2) return;
      net.roster = roster; net.send("start", { seed, roster, extra });
      go(Object.assign({ mode: "multi", net, seed }, extra));
    };
  }
  function join(auto) {
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><input class="input tg-code-in" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC12" aria-label="Room code">' +
      '<button type="button" class="btn btn-primary" data-join>Join</button><div class="rl-list"></div><p class="tg-lobby-s small"></p></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    const inp = box.querySelector(".tg-code-in"); setTimeout(() => inp.focus(), 50);
    inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); };
    box.querySelector("[data-join]").onclick = () => {
      const code = inp.value.trim();
      if (code.length !== 5) { stat().textContent = "The code has 5 letters/numbers."; return; }
      if (!window.TMN_RT) { stat().textContent = "Online play isn't available here."; return; }
      box._cleanup(); stat().textContent = "Joining…";
      const pid = "g" + rid(6); let inRoom = false, tries = 0;
      net = makeNet("tmn-" + o.id + "-" + code, pid);
      lobbyFn = (ev, d) => {
        if (ev === "roster" && Array.isArray(d.roster)) {
          if (d.roster.some((x) => x.p === pid)) { inRoom = true; net.roster = d.roster; box.querySelector(".rl-list").innerHTML = rosterHtml(d.roster); stat().textContent = "✅ You're in! Waiting for @" + d.roster[0].name + " to start…" + (d.extra && d.extra.label ? " (" + d.extra.label + ")" : ""); }
        }
        if (ev === "full" && d.to === pid) { clearInterval(timer); stat().textContent = "This room is full."; }
        if (ev === "start" && Array.isArray(d.roster) && d.roster.some((x) => x.p === pid)) { net.roster = d.roster; go(Object.assign({ mode: "multi", net, seed: d.seed }, d.extra || {})); }
        if (ev === "bye" && inRoom && net.roster[0] && d.p === net.roster[0].p) { stat().textContent = "The host closed the room."; inRoom = false; }
      };
      net.on(lobbyFn);
      timer = setInterval(() => { if (inRoom) return; if (++tries > 8) { clearInterval(timer); stat().textContent = "No room with that code. Check the code and try again."; return; } net.send("join", { name: me.name, color: me.color, av: me.av }); }, 1200);
      net.send("join", { name: me.name, color: me.color, av: me.av });
    };
    if (auto) { inp.value = auto; box.querySelector("[data-join]").click(); }   // galing sa "Friends playing → Join"
  }
  // pagod o tulog si Tigo: huwag pumasok sa room (para hindi maiwan ang mga kaibigan)
  const tired = () => { const t = o.info && o.info.tired && o.info.tired(); if (t && window.TMN_UI) TMN_UI.toast(t); return !!t; };
  const onMenu = (e) => {
    if (e.target.closest("[data-solo], [data-x=host], [data-x=join]") && tired()) return;
    const so = e.target.closest("[data-solo]");
    if (so) { const s = (o.soloOpts || [{ opt: {} }])[+so.dataset.solo]; go(Object.assign({ mode: "solo", seed: (Math.random() * 1e9) | 0 }, s.opt)); return; }
    const x = e.target.closest("[data-x]");
    if (x) { const k = x.dataset.x; if (k === "host") host(); if (k === "join") join(); if (k === "rank" && o.rank) o.rank(box, () => { box.onclick = onMenu; menu(); }); return; }
    if (e.target.closest("[data-menu]")) { menu(); return; }
    if (e.target.closest("[data-back]")) { box._cleanup(); box.onclick = null; o.back(); }
  };
  box.onclick = onMenu;
  menu();
  if (o.joinCode && !tired()) join(o.joinCode);
}

// Ranking (pare-pareho sa lahat ng laro): tabs ng "level" (opsyonal) at panahon
export function rankingView(box, back, { game, levels, metric }) {
  let level = levels ? levels[0][0] : null, period = "week";
  const fmtT = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  async function paint() {
    box.innerHTML = '<div class="tg-rk">' + (levels ? '<div class="segmented tg-rk-tabs">' + levels.map((l) => '<button type="button" data-l="' + l[0] + '" aria-pressed="' + (l[0] === level) + '">' + l[1] + "</button>").join("") + "</div>" : "") +
      '<div class="segmented tg-rk-tabs"><button type="button" data-p="week" aria-pressed="' + (period === "week") + '">This week</button><button type="button" data-p="all" aria-pressed="' + (period === "all") + '">All time</button></div><div class="tg-rk-list"><p class="faint small">Loading…</p></div></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ Back</button>';
    try {
      const r = await TMN_API.call("games", "top", { game, level, period });
      const val = (x) => (metric === "score" ? x.score.toLocaleString() + " pts" : fmtT(x.ms));
      const rows = (r.list || []).map((x) => '<div class="tg-rk-row' + (x.me ? " me" : "") + '"><b class="tg-rk-n">' + (x.rank <= 3 ? ["🥇", "🥈", "🥉"][x.rank - 1] : x.rank) + "</b><span>" +
        x.users.map((u) => "@" + esc(u.username)).join(" + ") + '</span><b translate="no">' + val(x) + "</b></div>").join("");
      box.querySelector(".tg-rk-list").innerHTML = (rows || '<p class="faint small">No scores yet. Be the first! 🏆</p>') +
        (r.mine ? '<p class="small tg-rk-mine">Your best: <b>' + val(r.mine) + "</b> · #" + r.mine.rank + " of " + r.total + "</p>" : '<p class="faint small tg-rk-mine">Play to get on the board.</p>');
    } catch (e) { box.querySelector(".tg-rk-list").innerHTML = '<p class="faint small">' + esc(e.message || "Couldn't load the ranking.") + "</p>"; }
  }
  box.onclick = (e) => {
    const l = e.target.closest("[data-l]"), p = e.target.closest("[data-p]");
    if (l) { level = l.dataset.l; paint(); } else if (p) { period = p.dataset.p; paint(); } else if (e.target.closest("[data-back]")) { box.onclick = null; back(); }
  };
  paint();
}
