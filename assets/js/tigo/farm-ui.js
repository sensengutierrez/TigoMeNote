/* TigoMeNote · tigo/farm-ui.js — sa labas (isla): taniman 🌱, bunga ng puno 🍎, pangingisda 🎣
   import { farmView, openGarden, startFishing } from "./farm-ui.js"
   farmView(pet) → { plots:[{ seed, stage 0–3, left ms }×10], trees:[bool×7], ready, fruit }   (para sa sc.setFarm at sa listahan)
   openGarden({ getPet, call(body) → pet-fast "farm", onPet(pet) })  → modal: pumili ng buto (Seed store), itanim sa bakanteng taniman, anihin kapag ✅
   startFishing({ sc, call, onPet, voice, say, onState(txt, canPull) }) → { pull(), stop() }
     Uupo si Tigo sa upuan sa tabi ng lawa at maghahagis. Kapag gumalaw ang palutang ("‼️ Pull!") pindutin sa loob ng 1.4 s → pet-fast "farm" { do: "fish" }.
   Ang presyo, tagal at kita ay galing sa server (pet.farm.seeds); ang oras ay sa server binibilang (hindi madadaya sa orasan ng phone). */
const SEED_UI = { carrot: ["🥕", "Carrot"], tomato: ["🍅", "Tomato"], corn: ["🌽", "Corn"], strawberry: ["🍓", "Strawberry"], pumpkin: ["🎃", "Pumpkin"] };
const esc = (s) => (window.TMN_UI ? TMN_UI.esc(s) : String(s));
const toast = (m) => { if (window.TMN_UI) TMN_UI.toast(m); };
function dur(ms) { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : m + "m"; }

export function farmView(pet) {
  const f = (pet && pet.farm) || {}, seeds = f.seeds || {}, n = f.plots_n || 10, tn = f.trees_n || 7;
  const skew = f.now ? Date.now() - f.now : 0, now = Date.now() - (pet && pet._at ? 0 : 0);   // oras ng server noong kinuha
  const plots = [], trees = []; let ready = 0, fruit = 0;
  for (let i = 0; i < n; i++) {
    const p = f.plots && f.plots[i], sd = p && seeds[p.s];
    if (!p || !sd) { plots.push({ seed: null, stage: 0, left: 0 }); continue; }
    const total = sd[1] * 60000, el = now - skew - new Date(p.t).getTime(), k = el / total;
    const stage = k >= 1 ? 3 : k >= 0.4 ? 2 : 1; if (stage === 3) ready++;
    plots.push({ seed: p.s, stage, left: Math.max(0, total - el) });
  }
  for (let i = 0; i < tn; i++) { const last = f.trees && f.trees[i] ? new Date(f.trees[i]).getTime() : 0, on = now - skew - last >= (f.treeMs || 14400000); trees.push(on); if (on) fruit++; }
  return { plots, trees, ready, fruit, seeds, treeCoins: f.treeCoins || 8 };
}

export function openGarden({ getPet, call, onPet }) {
  let seed = null, busy = false, timer = 0;
  try { seed = localStorage.getItem("tmnSeed"); } catch (e) {}
  const body = document.createElement("div"); body.className = "tg-farm";
  const m = TMN_MODAL.open({ title: "🌱 Garden", size: "md", body, onClose: () => clearInterval(timer) });
  function render() {
    const pet = getPet(), v = farmView(pet);
    if (!v.seeds[seed]) seed = Object.keys(v.seeds)[0] || null;
    body.innerHTML =
      '<div class="tg-farm-top"><span class="tg-coins">🪙 <b>' + (pet.coins || 0) + "</b></span>" +
        '<button type="button" class="btn btn-primary btn-sm" data-f="all"' + (v.ready ? "" : " disabled") + ">Harvest all" + (v.ready ? " (" + v.ready + ")" : "") + "</button>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-f="pick"' + (v.fruit ? "" : " disabled") + ">🍎 Pick fruit" + (v.fruit ? " (" + v.fruit + ")" : "") + "</button></div>" +
      '<p class="tg-av-l">Seed store — tap a seed, then tap an empty plot</p>' +
      '<div class="tg-seeds" role="group">' + Object.keys(v.seeds).map((k) => { const s = v.seeds[k], u = SEED_UI[k] || ["🌱", k];
        return '<button type="button" class="tg-seed' + (k === seed ? " on" : "") + '" data-seed="' + k + '" aria-pressed="' + (k === seed) + '"><span>' + u[0] + "</span><b>" + u[1] + "</b><small>🪙 " + s[0] + " · " + dur(s[1] * 60000) + '</small><small class="tg-seed-sell">sells 🪙 ' + s[2] + "</small></button>"; }).join("") + "</div>" +
      '<p class="tg-av-l">Your plots</p>' +
      '<div class="tg-plots">' + v.plots.map((p, i) => {
        const u = p.seed ? SEED_UI[p.seed] || ["🌱", p.seed] : null;
        return '<button type="button" class="tg-plot s' + p.stage + '" data-plot="' + i + '">' +
          (p.stage === 0 ? "<span>➕</span><small>Plant</small>" : p.stage === 3 ? "<span>" + u[0] + '</span><small class="ok">✅ Harvest</small>' : "<span>" + (p.stage === 1 ? "🌱" : "🌿") + "</span><small>" + u[0] + " " + dur(p.left) + "</small>") + "</button>";
      }).join("") + "</div>" +
      '<p class="faint small">Plants keep growing while you are away. Trees give fruit every 4 hours (🪙 ' + v.treeCoins + " each).</p>";
  }
  async function act(b, okMsg) {
    if (busy) return; busy = true;
    try { const r = await call(b); onPet(r.pet); if (okMsg) toast(okMsg(r)); }
    catch (e) { toast(e.message || "Couldn't do that. Try again."); }
    busy = false; render();
  }
  body.addEventListener("click", (e) => {
    const sd = e.target.closest("[data-seed]"), pl = e.target.closest("[data-plot]"), f = e.target.closest("[data-f]");
    if (sd) { seed = sd.dataset.seed; try { localStorage.setItem("tmnSeed", seed); } catch (x) {} render(); return; }
    if (f) { if (f.dataset.f === "all") act({ do: "harvest", all: true }, (r) => "Harvested " + r.n + " · +🪙 " + r.got); else act({ do: "pick", all: true }, (r) => "Picked " + r.n + " · +🪙 " + r.got); return; }
    if (!pl) return;
    const i = +pl.dataset.plot, p = farmView(getPet()).plots[i];
    if (p.stage === 3) act({ do: "harvest", plot: i }, (r) => "+🪙 " + r.got);
    else if (p.stage === 0) { if (!seed) return; act({ do: "plant", plot: i, seed }, () => (SEED_UI[seed] || ["🌱"])[0] + " Planted!"); }
    else toast("Still growing — " + dur(p.left) + " left.");
  });
  timer = setInterval(() => { if (!busy) render(); }, 20000);
  render();
  return m;
}

export function startFishing({ sc, call, onPet, voice, onState, onStop }) {
  let alive = true, state = "walk", t1 = 0, t2 = 0, lastCatch = 0;
  if (!sc.fish(true)) return null;
  const set = (txt, pull) => { if (alive && onState) onState(txt, pull); };
  function cast() {
    if (!alive) return;
    state = "wait"; sc.bite(false); set("🎣 Waiting for a bite…", false);
    const gap = Math.max(3500 + Math.random() * 5000, 12600 - (Date.now() - lastCatch));
    t1 = setTimeout(() => {
      if (!alive) return;
      state = "bite"; sc.bite(true); voice && voice.sfx && voice.sfx("pop"); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
      set("‼️ Pull!", true);
      t2 = setTimeout(() => { if (!alive || state !== "bite") return; sc.bite(false); set("It got away…", false); state = "miss"; t1 = setTimeout(cast, 1400); }, 1500);
    }, gap);
  }
  // hintayin munang makaupo
  const w = setInterval(() => {
    if (!alive) { clearInterval(w); return; }
    if (sc.fishing()) { clearInterval(w); cast(); }
    else if (sc.pose() !== "sit" && !sc.walking()) { clearInterval(w); api.stop(); }
  }, 200);
  const watch = setInterval(() => { if (alive && state !== "walk" && !sc.fishing()) api.stop(); }, 300);   // tumayo / lumakad = tapos
  const api = {
    async pull() {
      if (!alive || state !== "bite") return;
      clearTimeout(t2); state = "reel"; sc.bite(false); set("Reeling in…", false);
      try {
        const r = await call({ do: "fish" }); lastCatch = Date.now(); onPet(r.pet);
        const c = r.catch; voice && voice.sfx && voice.sfx(c.coins ? "coin" : "hit");
        if (c.coins) sc.effect("sparkle", { x: sc.main.group.position.x, y: 1, z: sc.main.group.position.z });
        set(c.icon + " " + c.name + (c.coins ? " · +🪙 " + c.coins : " · oops!"), false);
      } catch (e) { set(e.message || "The fish slipped away.", false); if (/tomorrow/i.test(e.message || "")) { t1 = setTimeout(() => api.stop(), 1800); return; } }
      t1 = setTimeout(cast, 1700);
    },
    stop() { if (!alive) return; alive = false; clearTimeout(t1); clearTimeout(t2); clearInterval(w); clearInterval(watch); sc.bite(false); sc.fish(false); onStop && onStop(); },
  };
  set("Walking to the bench…", false);
  return api;
}
