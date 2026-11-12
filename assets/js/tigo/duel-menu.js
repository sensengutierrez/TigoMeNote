/* TigoMeNote · tigo/duel-menu.js — 💎 Gem Duel: menu sa Games (ranked, practice, duel ng kaibigan, ranking)
   import { duelMenu } from "./duel-menu.js"
   duelMenu(box, { info:{ name, color }, onStart(opt), back() })
     ⚔️ Ranked: duel-fast "find" bawat 2 s hanggang ~12 s (tao na kalaban, malapit ang trophies); walang nahanap → bot (ranked pa rin, hanggang 20 bawat araw)
     🤖 Practice: laban sa bot (Easy / Normal / Hard), walang trophies · 👥 Friend: 5 titik na code (TMN_RT), walang trophies
     🏆 Ranking: World / Friends (ngayong season)
   onStart(opt) → { mode: "ranked"|"practice"|"friend", seed, net?, opp:{ name, bot, level }, match? }
   net (online): { me, host, send(ev, d), on(fn), leave() } mula sa room-lobby.js makeNet; host = nauuna. */
import { makeNet } from "./room-lobby.js";

const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s) : String(s));
const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", rid = (n) => Array.from({ length: n }, () => ABC[(Math.random() * ABC.length) | 0]).join("");
export const TIERS = [[4000, "Master", "👑"], [2500, "Diamond", "💎"], [1500, "Platinum", "🔷"], [800, "Gold", "🥇"], [300, "Silver", "🥈"], [0, "Bronze", "🥉"]];
export const tierOf = (t) => { const x = TIERS.find((q) => t >= q[0]); return { name: x[1], icon: x[2], min: x[0], next: (TIERS[TIERS.indexOf(x) - 1] || [null])[0] }; };

export function duelMenu(box, { info = {}, onStart, back }) {
  const me = { name: info.name || "friend", color: info.color || "coral" };
  let net = null, handed = false, poll = 0, stopFind = null;
  box._cleanup = () => { clearInterval(poll); if (stopFind) stopFind(); if (net && !handed) net.leave(); net = null; };
  const go = (opt) => { handed = true; clearInterval(poll); stopFind = null; onStart(Object.assign({ me }, opt)); };
  const toast = (m) => window.TMN_UI && TMN_UI.toast(m);

  async function home() {
    box._cleanup(); handed = false;
    box.innerHTML = '<div class="dl-hero"><span>💎</span><div><b>Gem Duel</b><small>1 vs 1 match-3 on the same board. 5 rounds, 2 moves a turn. Make specials for extra moves and fill 💥 Blast!</small></div></div>' +
      '<div class="dl-rank-card"><p class="faint small">Loading your rank…</p></div>' +
      '<button type="button" class="tg-game dl-go" data-x="ranked"><span class="tg-ic">⚔️</span><span><b>Ranked match</b><small>Win trophies and climb: Bronze → Silver → Gold → Platinum → Diamond → Master</small></span><span class="tg-go">Play</span></button>' +
      '<div class="tg-game dl-prac"><span class="tg-ic">🤖</span><span><b>Practice vs bot</b><small>No trophies — just for fun</small></span><span class="dl-lv">' +
      [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]].map(([k, l]) => '<button type="button" class="tg-go" data-bot="' + k + '">' + l + "</button>").join("") + "</span></div>" +
      '<button type="button" class="tg-game" data-x="host"><span class="tg-ic">👥</span><span><b>Duel a friend</b><small>Make a room code and share it</small></span><span class="tg-go">Create</span></button>' +
      '<button type="button" class="tg-game" data-x="join"><span class="tg-ic">🔑</span><span><b>Join a friend</b><small>Type their room code</small></span><span class="tg-go">Join</span></button>' +
      '<button type="button" class="tg-game" data-x="top"><span class="tg-ic">🏆</span><span><b>Ranking</b><small>Best players this season (world and friends)</small></span><span class="tg-go">View</span></button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-back>‹ All games</button>';
    try {
      const r = await TMN_API.call("duel", "me", {}), t = tierOf(r.trophies), el = box.querySelector(".dl-rank-card"); if (!el) return;
      const pct = t.next ? Math.round(((r.trophies - t.min) / (t.next - t.min)) * 100) : 100;
      el.innerHTML = '<span class="dl-tier">' + t.icon + '</span><div><b>' + t.name + " · " + r.trophies.toLocaleString() + ' 🏆</b><small class="faint">Season ' + esc(r.season) + " · #" + r.rank + " · " + r.wins + "W " + r.losses + "L" + (r.streak > 1 ? " · 🔥 " + r.streak : "") + "</small>" +
        '<i class="dl-tbar"><b style="width:' + pct + '%"></b></i><small class="faint">' + (t.next ? (t.next - r.trophies) + " to " + tierOf(t.next).name : "Top tier!") + "</small></div>";
    } catch (e) { const el = box.querySelector(".dl-rank-card"); if (el) el.innerHTML = '<p class="faint small">' + esc(e.message || "Rank unavailable right now.") + "</p>"; }
  }

  // ---------- ⚔️ ranked: hanap ng kalaban ----------
  function ranked() {
    box.innerHTML = '<div class="tg-lobby dl-find"><span class="dl-spin">💎</span><b>Finding an opponent…</b><small class="dl-find-s faint">0 s</small>' +
      '<p class="small faint">If nobody is free, you\'ll duel a ranked bot.</p><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancel</button></div>';
    let t = 0, busy = false, done = false;
    stopFind = () => { done = true; clearInterval(poll); TMN_API.call("duel", "cancel", {}).catch(() => {}); };
    const tick = async () => {
      if (done || busy) return; busy = true; t += 2; const s = box.querySelector(".dl-find-s"); if (s) s.textContent = t + " s";
      try {
        const r = t >= 12 ? await TMN_API.call("duel", "bot", {}) : await TMN_API.call("duel", "find", {});
        if (done) return;
        if (r.match) {
          done = true; clearInterval(poll); stopFind = null; const m = r.match;
          if (m.bot) { go({ mode: "ranked", match: m.id, seed: m.seed, unranked: !m.ranked, opp: { name: m.opp.name, bot: true, level: m.opp.level } }); return; }
          const pid = (window.TMN_USER && TMN_USER.id) || "p" + rid(8);
          net = makeNet("tmn-duel-" + m.code, pid); net.host = m.role === "a";
          go({ mode: "ranked", match: m.id, seed: m.seed, net, opp: { name: m.opp.username, trophies: m.opp.trophies } });
        }
      } catch (e) { if (!done) { done = true; clearInterval(poll); toast(e.message || "Couldn't find a match."); home(); } }
      busy = false;
    };
    poll = setInterval(tick, 2000); tick();
  }
  // ---------- 👥 kaibigan: room code ----------
  function host() {
    if (!window.TMN_RT) { toast("Online play isn't available here."); return; }
    const code = rid(5), seed = ((Math.random() * 2e9) | 0) + 1, pid = "h" + rid(6);
    box.innerHTML = '<div class="tg-lobby"><small>Room code</small><b class="tg-code" translate="no">' + code + '</b><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy code</button>' +
      '<p class="small">Your friend opens <b>Tigo → Games → Gem Duel → Join a friend</b> and types this code.</p><p class="tg-lobby-s small">Waiting for your friend…</p></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    net = makeNet("tmn-duelf-" + code, pid); net.host = true;
    net.on((ev, d, from) => { if (ev === "join" && from && !handed) { const opp = { name: String(d.name || "friend").slice(0, 30) }; net.send("start", { seed, to: from, name: me.name }); go({ mode: "friend", seed, net, opp }); } });
    box.querySelector("[data-copy]").onclick = () => { try { navigator.clipboard.writeText(code); } catch (e) {} toast("Code copied"); };
  }
  function join() {
    if (!window.TMN_RT) { toast("Online play isn't available here."); return; }
    box.innerHTML = '<div class="tg-lobby"><label class="field"><span>Room code</span><input type="text" maxlength="5" autocomplete="off" autocapitalize="characters" class="tg-code-in" placeholder="ABCDE"></label>' +
      '<button type="button" class="btn btn-primary" data-join>Join</button><p class="tg-lobby-s small"></p></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Back</button>';
    const inp = box.querySelector("input"); setTimeout(() => inp.focus(), 50);
    box.querySelector("[data-join]").onclick = () => {
      const code = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); if (code.length !== 5) { box.querySelector(".tg-lobby-s").textContent = "Type the 5-letter code."; return; }
      const pid = "g" + rid(6); if (net) net.leave(); net = makeNet("tmn-duelf-" + code, pid); net.host = false;
      box.querySelector(".tg-lobby-s").textContent = "Joining…";
      let tries = 0; const ask = setInterval(() => { if (handed || tries++ > 10) { clearInterval(ask); if (!handed) box.querySelector(".tg-lobby-s").textContent = "No room with that code. Check it and try again."; return; } net.send("join", { name: me.name }); }, 1000);
      net.send("join", { name: me.name });
      net.on((ev, d) => { if (ev === "start" && d.to === pid && !handed) { clearInterval(ask); go({ mode: "friend", seed: d.seed | 0, net, opp: { name: String(d.name || "friend").slice(0, 30) } }); } });
    };
  }
  // ---------- 🏆 ranking ----------
  async function top(scope = "world") {
    box.innerHTML = '<div class="tg-rk"><div class="segmented tg-rk-tabs"><button type="button" data-sc="world" aria-pressed="' + (scope === "world") + '">🌍 World</button><button type="button" data-sc="friends" aria-pressed="' + (scope === "friends") + '">👥 Friends</button></div><div class="tg-rk-list"><p class="faint small">Loading…</p></div></div><button type="button" class="btn btn-ghost btn-sm" data-menu>‹ Gem Duel</button>';
    try {
      const r = await TMN_API.call("duel", "top", { scope }), el = box.querySelector(".tg-rk-list"); if (!el) return;
      el.innerHTML = (r.list.map((x) => '<div class="tg-rk-row' + (x.me ? " me" : "") + '"><b class="tg-rk-n">' + (x.rank <= 3 ? ["🥇", "🥈", "🥉"][x.rank - 1] : x.rank) + '</b><span>' + tierOf(x.trophies).icon + ' <b translate="no">@' + esc(x.user.username) + '</b> <small class="faint">' + x.wins + "W " + x.losses + "L</small></span><b>" + x.trophies.toLocaleString() + " 🏆</b></div>").join("") || '<p class="faint small">No ranked duels yet this season. Be the first! 💎</p>') +
        '<p class="small tg-rk-mine">Season ' + esc(r.season) + " · You: " + tierOf(r.mine.trophies).icon + " " + r.mine.trophies + " 🏆</p>";
    } catch (e) { const el = box.querySelector(".tg-rk-list"); if (el) el.innerHTML = '<p class="faint small">' + esc(e.message || "Couldn't load the ranking.") + "</p>"; }
  }

  box.onclick = (e) => {
    const x = e.target.closest("[data-x]"), b = e.target.closest("[data-bot]"), sc = e.target.closest("[data-sc]");
    if (info.tired && (x || b) && x?.dataset.x !== "top" && info.tired()) { toast(info.tired()); return; }
    if (b) { go({ mode: "practice", seed: ((Math.random() * 2e9) | 0) + 1, opp: { name: { easy: "Sprout Bot", normal: "Bloom Bot", hard: "Thunder Bot" }[b.dataset.bot], bot: true, level: b.dataset.bot } }); return; }
    if (x) { const k = x.dataset.x; if (k === "ranked") ranked(); if (k === "host") host(); if (k === "join") join(); if (k === "top") top(); return; }
    if (sc) { top(sc.dataset.sc); return; }
    if (e.target.closest("[data-cancel]") || e.target.closest("[data-menu]")) { home(); return; }
    if (e.target.closest("[data-back]")) { box._cleanup(); box.onclick = null; back(); }
  };
  home();
}
