/* TigoMeNote · tigo/room-ui.js — Decorate: ayusin ang loob ng bahay ni Tigo
   import { openRoomEditor } from "./room-ui.js"
   const ed = openRoomEditor({ host, stage, canvas, sc, pet, call, esc, onPet(pet), onClose })
   Panel (side): tabs Furniture / Walls / Floors. Tap = ilagay sa kwarto (o subukan ang dingding/sahig). Hindi pa nabibili → "Buy 🪙 N".
   Sa 3D: pindutin at hilahin ang gamit para ilipat; may bar sa ibaba: ⟳ Ikot · 🗑 Alisin · ✓ Tapos.
   Gamit sa dingding (painting, clock…) = kusang dumidikit sa pinakamalapit na dingding.
   Kusang nase-save (pet-fast "room") ilang saglit pagkatapos ng bawat pagbabago. */
import { HOME_TABS, HOME_ITEMS, homeItem } from "./catalog.js";

const MAX_COPIES = 4, MAX_ITEMS = 40;

export function openRoomEditor({ host, stage, canvas, sc, pet, call, esc, onPet, onClose }) {
  const room = sc.room(); if (!room) return null;
  const toast = (m) => window.TMN_UI && TMN_UI.toast(m);
  const keep = [...host.children].filter((el) => !el.hidden);
  keep.forEach((el) => { el.hidden = true; });
  const box = document.createElement("section");
  box.className = "card tg-closet tg-decor"; box.setAttribute("aria-label", "Decorate the house");
  host.appendChild(box);
  const bar = document.createElement("div");
  bar.className = "tg-room-bar hidden"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Selected item");
  bar.innerHTML = '<b class="tg-rb-name"></b><button type="button" data-rb="rotate" aria-label="Rotate">⟳<small>Rotate</small></button>' +
    '<button type="button" data-rb="remove" aria-label="Put away">🗑<small>Put away</small></button><button type="button" data-rb="done" aria-label="Done">✓<small>Done</small></button>';
  stage.appendChild(bar);

  let tab = "furn", buying = null, saving = "", timer = null, busy = false;
  const owns = (id) => { const it = homeItem(id); return !!it && pet.level >= it.level && (it.price === 0 || pet.owned.indexOf(id) >= 0); };
  const placed = (id) => room.list().filter((x) => x.id === id).length;
  const view0 = sc.rig.view(); sc.rig.setView("top");

  function render() {
    const st = room.style();
    const grid = HOME_ITEMS.filter((i) => i.slot === tab).map((i) => {
      const lock = pet.level < i.level, have = owns(i.id), n = tab === "furn" ? placed(i.id) : 0;
      const on = tab === "wall" ? st.wall === i.id : tab === "floor" ? st.floor === i.id : n > 0;
      const tag = lock ? "🔒 Lv " + i.level : !have ? "🪙 " + i.price : tab === "furn" ? (n ? "In room ×" + n : "Add") : on ? "Using" : i.price ? "Owned" : "Free";
      const sw = i.color ? ' style="--sw:' + i.color + '"' : "";
      return '<button type="button" class="tg-item' + (on ? " on" : "") + (lock ? " lock" : "") + (have ? " have" : "") + (i.color ? " tg-swatch" : "") + '" data-id="' + i.id + '"' + sw + (lock ? ' aria-disabled="true"' : "") +
        '><span class="tg-ic">' + i.icon + "</span><b>" + esc(i.name) + "</b><small>" + tag + "</small></button>";
    }).join("");
    box.innerHTML =
      '<div class="tg-cl-head"><h3>🏠 Decorate</h3><span class="tg-save faint small">' + saving + '</span><span class="tg-coins">🪙 <b>' + pet.coins + '</b></span><button type="button" class="btn btn-ghost btn-sm" data-close>Done</button></div>' +
      '<div class="tg-tabs" role="tablist">' + HOME_TABS.map((t) => '<button type="button" role="tab" aria-selected="' + (t.id === tab) + '" data-tab="' + t.id + '"><span>' + t.icon + "</span><small>" + t.name + "</small></button>").join("") + "</div>" +
      '<p class="faint small tg-decor-tip">' + (tab === "furn" ? "Tap to add. In the house, drag a thing to move it." : "Tap to try it on the house.") + "</p>" +
      '<div class="tg-cl-body"><div class="tg-grid">' + grid + "</div></div>" +
      (buying ? '<div class="tg-cl-buy"><span>' + buying.icon + " " + esc(buying.name) + '</span><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancel</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-buy' + (buying.price > pet.coins ? " disabled" : "") + ">Buy 🪙 " + buying.price + "</button>" +
        (buying.price > pet.coins ? '<p class="faint small">Need ' + (buying.price - pet.coins) + " more coins — play games to earn!</p>" : "") + "</div>" : "");
  }

  // ---------- save ----------
  function setSaving(t) { saving = t; const el = box.querySelector(".tg-save"); if (el) el.textContent = t; }
  function queueSave() { clearTimeout(timer); setSaving("Saving…"); timer = setTimeout(save, 900); }
  async function save() {
    clearTimeout(timer); timer = null;
    const st = room.style();
    if (!owns(st.wall) || !owns(st.floor)) { setSaving(""); return; } // sinusubukan pa lang (hindi pa nabibili)
    try { const r = await call("room", { room: { wall: st.wall, floor: st.floor, items: room.list() } }); pet = r.pet; onPet(pet); setSaving("Saved ✓"); }
    catch (e) { setSaving(""); toast(e.message); }
  }
  // ---------- pag-select at bar ----------
  function select(e) {
    room.select(e);
    bar.classList.toggle("hidden", !e);
    if (e) { const it = homeItem(e.id); bar.querySelector(".tg-rb-name").textContent = it ? it.icon + " " + it.name : e.id; }
  }
  function addItem(id) {
    if (room.list().length >= MAX_ITEMS) { toast("The house is full (" + MAX_ITEMS + " things)."); return; }
    if (placed(id) >= MAX_COPIES) { toast("Up to " + MAX_COPIES + " of each."); return; }
    const e = room.add(id); if (!e) return;
    select(e); queueSave(); render();
    if (sc.main) sc.main.jump();
  }
  function useStyle(id) {
    const it = homeItem(id), st = room.style();
    room.setStyle(it.slot === "wall" ? id : st.wall, it.slot === "floor" ? id : st.floor);
    if (owns(id)) { buying = null; queueSave(); } else buying = it;
    render();
  }

  box.addEventListener("click", async (e) => {
    if (busy) return;
    const t = e.target.closest("[data-tab]"), b = e.target.closest("[data-id]");
    if (e.target.closest("[data-close]")) return close();
    if (t) { tab = t.dataset.tab; render(); return; }
    if (e.target.closest("[data-cancel]")) { if (buying && buying.slot !== "furn") { const s = pet.room || {}; room.setStyle(owns(room.style().wall) ? room.style().wall : s.wall, owns(room.style().floor) ? room.style().floor : s.floor); } buying = null; render(); return; }
    if (e.target.closest("[data-buy]")) {
      busy = true;
      try { pet = (await call("buy", { id: buying.id })).pet; onPet(pet); }
      catch (er) { busy = false; toast(er.message); render(); return; }
      busy = false; const it = buying; buying = null;
      if (it.slot === "furn") addItem(it.id); else { queueSave(); render(); }
      return;
    }
    if (b) {
      const it = homeItem(b.dataset.id); if (!it) return;
      if (pet.level < it.level) { toast(it.name + " unlocks at level " + it.level + "."); return; }
      if (it.slot !== "furn") return useStyle(it.id);
      if (!owns(it.id)) { buying = it; render(); return; }
      buying = null; addItem(it.id);
    }
  });
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rb]"), sel = room.selected(); if (!b || !sel) return;
    if (b.dataset.rb === "rotate") { room.rotate(sel); queueSave(); }
    if (b.dataset.rb === "remove") { room.remove(sel); select(null); queueSave(); render(); }
    if (b.dataset.rb === "done") select(null);
  });

  // ---------- hila ng gamit sa 3D ----------
  let drag = null;
  const ndc = (ev) => { const r = canvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1)]; };
  function claim(ev) {
    if (!sc.room()) return false;
    const [x, y] = ndc(ev), ray = sc.ray(x, y), hit = room.pick(ray);
    if (!hit) { if (room.selected()) select(null); return false; }
    select(hit);
    const p = room.floorPoint(ray) || { x: hit.x, z: hit.z };
    drag = { id: ev.pointerId, e: hit, dx: hit.x - p.x, dz: hit.z - p.z, moved: false };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    return true;
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const [x, y] = ndc(ev), p = room.floorPoint(sc.ray(x, y)); if (!p) return;
    room.move(drag.e, p.x + drag.dx, p.z + drag.dz); drag.moved = true;
  }
  function onUp(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    if (drag.moved) queueSave();
    drag = null;
    window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
  }
  sc.setClaim(claim);

  function close() {
    if (timer) save();
    sc.setClaim(null); select(null); bar.remove(); box.remove(); keep.forEach((el) => { el.hidden = false; });
    // ibalik ang hindi nabiling dingding/sahig
    const s = pet.room || {}, st = room.style();
    if (!owns(st.wall) || !owns(st.floor)) room.setStyle(owns(st.wall) ? st.wall : s.wall, owns(st.floor) ? st.floor : s.floor);
    sc.rig.setView(view0 === "top" ? "follow" : view0);
    onClose && onClose(pet);
  }
  render();
  return { close, update(p) { pet = p; render(); } };
}
