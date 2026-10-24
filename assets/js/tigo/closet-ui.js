/* TigoMeNote · tigo/closet-ui.js — Closet ni Tigo: tabs (Tigo, Sets, Hats, Face, Clothes, Hand, Buddies, Places) + item grid
   import { openCloset } from "./closet-ui.js"
   const c = openCloset({ host, pet, call, esc, onPreview(outfit, color), onPet(pet), onClose })
     host     = elementong paglalagyan (side panel); itinatago ang dating laman habang bukas
     call     = (action, body) => Promise (TMN_API.call("pet", …))
     onPreview = live try-on sa 3D (hindi pa naka-save)
   Libre/pag-aari → isusuot agad (save). Hindi pa nabibili → try-on muna, tapos "Buy 🪙 N". */
import { SLOTS, ITEMS, SETS, item } from "./catalog.js";

const COLORS = { coral: "#ff7a59", amber: "#ffc04d", mint: "#3dd6c0", sky: "#7cc4ff", pink: "#ff9ec7", lilac: "#b9a2ff", lime: "#b8e65c", ink: "#3a3a40" };
const TABS = [{ id: "me", name: "Tigo", icon: "🎨" }].concat(SLOTS);

export function openCloset({ host, pet, call, esc, onPreview, onPet, onClose }) {
  const keep = [...host.children].filter((el) => !el.hidden);
  keep.forEach((el) => { el.hidden = true; }); // itago lang (hindi alisin) para gumagana pa rin ang ibang bahagi ng page
  const box = document.createElement("section");
  box.className = "card tg-closet"; box.setAttribute("aria-label", "Closet");
  host.appendChild(box);
  let tab = "hat", trying = null, busy = false; // trying = { outfit, need: [ids] }

  const owns = (id) => { const it = item(id); return !!it && pet.level >= it.level && (it.price === 0 || pet.owned.indexOf(id) >= 0); };
  const wornNow = () => Object.assign({}, pet.outfit || {});
  const shown = () => (trying ? trying.outfit : wornNow());

  function render() {
    const o = shown();
    let grid = "";
    if (tab === "me") {
      grid = '<label class="field tg-cl-name"><span class="pe-label">Name</span><input class="input" maxlength="20" value="' + esc(pet.name) + '"></label>' +
        '<div class="tg-colors">' + Object.keys(COLORS).map((c) => '<button type="button" class="tg-color' + (c === pet.color ? " on" : "") + '" data-c="' + c + '" style="background:' + COLORS[c] + '" aria-label="' + c + '"></button>').join("") + "</div>";
    } else if (tab === "set") {
      grid = '<div class="tg-grid">' + SETS.map((s) => {
        const need = Object.values(s.wear).filter((id) => !owns(id));
        const on = Object.keys(s.wear).every((k) => o[k] === s.wear[k]);
        return '<button type="button" class="tg-item tg-set' + (on ? " on" : "") + '" data-set="' + s.id + '"><span class="tg-ic">' + s.icon + '</span><b>' + esc(s.name) +
          '</b><small>' + (need.length ? need.length + " to get" : "✓ Ready") + "</small></button>";
      }).join("") + "</div>";
    } else {
      const none = tab === "backdrop" ? "" : '<button type="button" class="tg-item' + (!o[tab] ? " on" : "") + '" data-id=""><span class="tg-ic">∅</span><b>None</b><small>&nbsp;</small></button>';
      grid = '<div class="tg-grid">' + none + ITEMS.filter((i) => i.slot === tab).map((i) => {
        const lock = pet.level < i.level, have = owns(i.id), on = o[tab] === i.id || (tab === "backdrop" && !o.backdrop && i.id === "island");
        const tag = lock ? "🔒 Lv " + i.level : have ? (on ? "Wearing" : i.price ? "Owned" : "Free") : "🪙 " + i.price;
        return '<button type="button" class="tg-item' + (on ? " on" : "") + (lock ? " lock" : "") + (have ? " have" : "") + '" data-id="' + i.id + '"' + (lock ? ' aria-disabled="true"' : "") +
          '><span class="tg-ic">' + i.icon + "</span><b>" + esc(i.name) + "</b><small>" + tag + "</small></button>";
      }).join("") + "</div>";
    }
    const cost = trying ? trying.need.reduce((n, id) => n + item(id).price, 0) : 0;
    box.innerHTML =
      '<div class="tg-cl-head"><h3>Closet</h3><span class="tg-coins">🪙 <b>' + pet.coins + '</b></span><button type="button" class="btn btn-ghost btn-sm" data-close>Done</button></div>' +
      '<div class="tg-tabs" role="tablist">' + TABS.map((t) => '<button type="button" role="tab" aria-selected="' + (t.id === tab) + '" data-tab="' + t.id + '" title="' + t.name + '"><span>' + t.icon + "</span><small>" + t.name + "</small></button>").join("") + "</div>" +
      '<div class="tg-cl-body">' + grid + "</div>" +
      (trying ? '<div class="tg-cl-buy"><span>Trying on: ' + trying.need.map((id) => item(id).icon).join(" ") + "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancel</button><button type="button" class="btn btn-primary btn-sm" data-buy' + (cost > pet.coins ? " disabled" : "") + ">Buy 🪙 " + cost + "</button>" +
        (cost > pet.coins ? '<p class="faint small">Need ' + (cost - pet.coins) + " more coins — play Coin Rush!</p>" : "") + "</div>" : "");
  }
  function preview() { onPreview(shown(), pet.color); }

  async function save(outfit) {
    busy = true;
    try { const r = await call("wear", { outfit }); pet = r.pet; trying = null; onPet(pet); }
    catch (e) { window.TMN_UI && TMN_UI.toast(e.message); }
    busy = false; render(); preview();
  }
  function tryOn(outfit) {
    const need = Object.values(outfit).filter((id) => id && !owns(id));
    if (!need.length) return save(outfit);
    trying = { outfit, need }; render(); preview();
  }

  box.addEventListener("click", async (e) => {
    if (busy) return;
    const t = e.target.closest("[data-tab]"), it = e.target.closest("[data-id]"), st = e.target.closest("[data-set]"), c = e.target.closest("[data-c]");
    if (e.target.closest("[data-close]")) return close();
    if (t) { tab = t.dataset.tab; render(); return; }
    if (c) {
      busy = true;
      try { pet = (await call("style", { color: c.dataset.c })).pet; onPet(pet); } catch (er) { TMN_UI.toast(er.message); }
      busy = false; render(); preview(); return;
    }
    if (e.target.closest("[data-cancel]")) { trying = null; render(); preview(); return; }
    if (e.target.closest("[data-buy]")) {
      busy = true;
      try { for (const id of trying.need) pet = (await call("buy", { id })).pet; onPet(pet); }
      catch (er) { busy = false; TMN_UI.toast(er.message); render(); return; }
      busy = false; return save(trying.outfit);
    }
    if (st) {
      const s = SETS.find((x) => x.id === st.dataset.set);
      const lock = Object.values(s.wear).find((id) => item(id).level > pet.level);
      if (lock) { TMN_UI.toast(item(lock).name + " unlocks at level " + item(lock).level + "."); return; }
      return tryOn(Object.assign({}, wornNow(), s.wear));
    }
    if (it) {
      const id = it.dataset.id, x = item(id);
      if (x && pet.level < x.level) { TMN_UI.toast(x.name + " unlocks at level " + x.level + "."); return; }
      const base = Object.assign({}, trying ? trying.outfit : wornNow());
      if (id) base[tab] = id; else delete base[tab];
      return tryOn(base);
    }
  });
  box.addEventListener("change", async (e) => {
    if (!e.target.matches(".tg-cl-name input")) return;
    const n = e.target.value.trim(); if (!n || n === pet.name) return;
    try { pet = (await call("style", { name: n })).pet; onPet(pet); } catch (er) { TMN_UI.toast(er.message); }
  });

  function close() {
    box.remove(); keep.forEach((el) => { el.hidden = false; });
    trying = null; onPreview(wornNow(), pet.color); onClose && onClose(pet);
  }
  render();
  return { close, update(p) { pet = p; render(); } };
}
