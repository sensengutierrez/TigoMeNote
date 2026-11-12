/* TigoMeNote · tigo/room-ui.js — Decorate: ayusin ang loob ng bahay ni Tigo
   import { openRoomEditor } from "./room-ui.js"
   const ed = openRoomEditor({ host, stage, canvas, sc, pet, call, esc, onPet(pet), onClose })
   Panel (side): tabs Furniture / 🏡 House (upgrade: mas malaki, pamahal nang pamahal) / 🚲 Rides (nakaparada sa labas) / Walls / Floors. Tap = ilagay sa kwarto (o subukan ang dingding/sahig). Hindi pa nabibili → "Buy 🪙 N".
   Sa 3D: pindutin at hilahin ang gamit para ilipat; may bar sa ibaba: ⟳ Ikot · 🗑 Alisin · ✓ Tapos.
   Gamit sa dingding (painting, clock…) = kusang dumidikit sa pinakamalapit na dingding.
   Long-press sa gamit habang nasa bahay (pages/tigo.js) = bubukas ito na napili na ang gamit (ed.select).
   Kusang nase-save (pet-fast "room") ilang saglit pagkatapos ng bawat pagbabago.
   0.11.52: tab na 🛏️ Bedding (kumot at unan; subukan muna bago bilhin) · ang Decorate ay para sa palapag kung nasaan si Tigo (1F o 2F);
            sine-save ang buong bahay (sc.roomFull: 1F + 2F + kumot/unan). */
import { HOME_TABS, HOME_ITEMS, homeItem, HOUSES } from "./catalog.js";
import { DEF_BED } from "./bedding.js";

const MAX_COPIES = 4;
const maxItems = (pet) => 30 + 10 * Math.max(1, Math.min(4, pet.house || 1));   // kapareho ng pet-fast roomMax

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
  // ✥ manual na galaw (0.11.52): pindutin ang palaso (pindot nang matagal = tuloy-tuloy); ayon sa camera ang "taas" (palayo)
  bar.innerHTML = '<b class="tg-rb-name"></b><div class="tg-rb-pad" role="group" aria-label="Move">' +
    [["u", "▲", "Move away"], ["l", "◀", "Move left"], ["r", "▶", "Move right"], ["d", "▼", "Move closer"]].map(([k, t, l]) => '<button type="button" class="tg-rb-mv ' + k + '" data-mv="' + k + '" aria-label="' + l + '">' + t + "</button>").join("") + "</div>" +
    '<button type="button" data-rb="rotate" aria-label="Rotate">⟳<small>Rotate</small></button>' +
    '<button type="button" data-rb="remove" aria-label="Put away">🗑<small>Put away</small></button><button type="button" data-rb="done" aria-label="Done">✓<small>Done</small></button>';
  stage.appendChild(bar);

  let tab = "furn", buying = null, saving = "", timer = null, busy = false;
  const bed0 = () => Object.assign({}, DEF_BED, (pet.room && pet.room.bed) || {});
  let bed = bed0();
  const ext0 = () => (pet.room && pet.room.ext) || "ext-classic";
  let ext = ext0();
  const rideNow = () => { const own = HOME_ITEMS.filter((i) => i.slot === "ride" && owns(i.id)).map((i) => i.id), r = pet.room && pet.room.ride; return own.indexOf(r) >= 0 ? r : own[own.length - 1] || null; };
  const owns = (id) => { const it = homeItem(id); return !!it && pet.level >= it.level && (it.price === 0 || pet.owned.indexOf(id) >= 0); };
  const placed = (id) => room.list().filter((x) => x.id === id).length;
  const view0 = sc.rig.view(); sc.rig.setView("top");

  const houseGrid = () => {
    const cur = pet.house || 1, pr = pet.housePrices || [0, 0, 800, 2500, 7000];
    return HOUSES.slice(1).map((h, k) => {
      const lv = k + 1, now = lv === cur, next = lv === cur + 1, done = lv < cur;
      const tag = now ? "Your house" : done ? "✓" : next ? "Upgrade 🪙 " + pr[lv].toLocaleString() : "🔒 🪙 " + pr[lv].toLocaleString();
      return '<button type="button" class="tg-item' + (now ? " on" : "") + (!next && !now && !done ? " lock" : "") + (done ? " have" : "") + '" data-house="' + lv + '"><span class="tg-ic">' + h.icon + "</span><b>" + esc(h.name) + "</b><small>" + tag + "</small></button>";
    }).join("");
  };
  function render() {
    const st = room.style();
    const grid = tab === "house" ? houseGrid() : HOME_ITEMS.filter((i) => (tab === "bedding" ? i.slot === "blanket" || i.slot === "pillow" : i.slot === tab)).map((i) => {
      const lock = pet.level < i.level, have = owns(i.id), n = tab === "furn" ? placed(i.id) : 0;
      const on = tab === "wall" ? st.wall === i.id : tab === "floor" ? st.floor === i.id : tab === "bedding" ? bed[i.slot] === i.id : tab === "exterior" ? ext === i.id : tab === "ride" ? rideNow() === i.id : n > 0;
      const tag = lock ? "🔒 Lv " + i.level : !have ? "🪙 " + i.price : tab === "ride" ? (on ? "Outside now" : "Tap to use") : tab === "exterior" ? (on ? "Using" : "Tap to use") : tab === "furn" ? (n ? "In room ×" + n : "Add") : on ? "Using" : i.price ? "Owned" : "Free";
      const sw = i.color ? ' style="--sw:' + i.color + '"' : "";
      return '<button type="button" class="tg-item' + (on ? " on" : "") + (lock ? " lock" : "") + (have ? " have" : "") + (i.color ? " tg-swatch" : "") + (buying && buying.id === i.id ? " pick" : "") + '" data-id="' + i.id + '"' + sw + (lock ? ' aria-disabled="true"' : "") +
        '><span class="tg-ic">' + i.icon + "</span><b>" + esc(i.name) + "</b><small>" + tag + "</small></button>";
    }).join("");
    box.innerHTML =
      '<div class="tg-cl-head"><h3>🏠 Decorate' + (sc.floor && sc.floor() === 2 ? ' <small class="tg-floor">2F</small>' : "") + "</h3>" + '<span class="tg-save faint small">' + saving + '</span><span class="tg-coins">🪙 <b>' + pet.coins + '</b></span><button type="button" class="btn btn-ghost btn-sm" data-close>Done</button></div>' +
      '<div class="tg-tabs" role="tablist">' + HOME_TABS.map((t) => '<button type="button" role="tab" aria-selected="' + (t.id === tab) + '" data-tab="' + t.id + '"><span>' + t.icon + "</span><small>" + t.name + "</small></button>").join("") + "</div>" +
      '<p class="faint small tg-decor-tip">' + (({ furn: "Tap to add. In the house, press and hold a thing, then drag it.", house: "A bigger house outside and more room inside. Each upgrade costs more.", ride: "Only one ride is parked outside. Tap the one you want to use.", exterior: "Change how your house looks outside. Tap to try it.", bedding: "Tap a blanket or pillow to try it on the bed." })[tab] || "Tap to try it on the house.") + "</p>" +
      // Buy / try-on bar: nasa ITAAS ng listahan (dati nasa pinakababa, kailangang mag-scroll)
      (buying ? '<div class="tg-cl-buy"><span>' + buying.icon + " " + esc(buying.name) + '</span><button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancel</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-buy' + (buying.price > pet.coins ? " disabled" : "") + ">" + (buying.slot === "house" ? "Upgrade 🪙 " : "Buy 🪙 ") + buying.price.toLocaleString() + "</button>" +
        (buying.price > pet.coins ? '<p class="faint small">Need ' + (buying.price - pet.coins) + " more coins — play games to earn!</p>" : "") + "</div>" : "") +
      '<div class="tg-cl-body"><div class="tg-grid">' + grid + "</div></div>";

  }

  // ---------- save ----------
  function setSaving(t) { saving = t; const el = box.querySelector(".tg-save"); if (el) el.textContent = t; }
  function queueSave() { clearTimeout(timer); setSaving("Saving…"); timer = setTimeout(save, 900); }
  async function save() {
    clearTimeout(timer); timer = null;
    const st = room.style();
    if (!owns(st.wall) || !owns(st.floor) || !owns(bed.blanket) || !owns(bed.pillow) || !owns(ext)) { setSaving(""); return; } // sinusubukan pa lang (hindi pa nabibili)
    try { const r = await call("room", { room: sc.roomFull() }); pet = r.pet; onPet(pet); setSaving("Saved ✓"); }
    catch (e) { setSaving(""); toast(e.message); }
  }
  // ---------- pag-select at bar ----------
  function select(e) {
    room.select(e);
    bar.classList.toggle("hidden", !e);
    if (e) { const it = homeItem(e.id); bar.querySelector(".tg-rb-name").textContent = it ? it.icon + " " + it.name : e.id; }
  }
  function addItem(id) {
    if (room.list().length >= maxItems(pet)) { toast("The house is full (" + maxItems(pet) + " things)."); return; }
    if (placed(id) >= MAX_COPIES) { toast("Up to " + MAX_COPIES + " of each."); return; }
    const e = room.add(id); if (!e) return;
    select(e); queueSave(); render();
    if (sc.main) sc.main.jump();
  }
  function useBedding(id) {
    const it = homeItem(id); bed = Object.assign({}, bed, { [it.slot]: id }); sc.setBedding(bed);
    if (owns(id)) { buying = null; queueSave(); } else buying = it;
    render();
  }
  function useExterior(id) { ext = id; sc.setExterior(id); sc.setRoomExtra({ ext: id }); if (owns(id)) { buying = null; queueSave(); } else buying = homeItem(id); render(); }
  function revertExterior() { if (!owns(ext)) { ext = ext0(); sc.setExterior(ext); sc.setRoomExtra({ ext }); } }
  function useRide(id) { sc.setRoomExtra({ ride: id }); pet = Object.assign({}, pet, { room: Object.assign({}, pet.room || {}, { ride: id }) }); onPet(pet); queueSave(); render(); }
  function revertBedding() { const b = bed0(); bed = { blanket: owns(bed.blanket) ? bed.blanket : b.blanket, pillow: owns(bed.pillow) ? bed.pillow : b.pillow }; sc.setBedding(bed); }
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
    if (e.target.closest("[data-cancel]")) { if (buying && buying.slot === "exterior") revertExterior(); else if (buying && (buying.slot === "blanket" || buying.slot === "pillow")) revertBedding(); else if (buying && buying.slot !== "furn") { const s = (sc.floor && sc.floor() === 2 ? (pet.room || {}).up : pet.room) || {}; room.setStyle(owns(room.style().wall) ? room.style().wall : s.wall, owns(room.style().floor) ? room.style().floor : s.floor); } buying = null; render(); return; }
    if (e.target.closest("[data-buy]")) {
      busy = true;
      const it0 = buying;
      try { pet = (await call(it0.slot === "house" ? "house" : "buy", it0.slot === "house" ? {} : { id: it0.id })).pet; }
      catch (er) { busy = false; toast(er.message); render(); return; }
      busy = false; const it = buying; buying = null;
      if (it.slot === "house") { toast("🎉 Your house is now a " + it.name + "! More room inside."); close(); onPet(pet); return; }   // ang kwarto ay muling ginagawa (mas malaki)
      onPet(pet);
      if (it.slot === "ride") { useRide(it.id); toast(it.icon + " Your " + it.name.toLowerCase() + " is parked outside! Walk up and tap Ride."); return; }
      if (it.slot === "furn") addItem(it.id); else { queueSave(); render(); }   // dingding, sahig, kumot, unan
      return;
    }
    const hb = e.target.closest("[data-house]");
    if (hb) {
      const lv = +hb.dataset.house, cur = pet.house || 1, pr = pet.housePrices || [0, 0, 800, 2500, 7000];
      if (lv <= cur) return;
      if (lv > cur + 1) { toast("Upgrade to " + HOUSES[cur + 1].name + " first."); return; }
      buying = { id: "house-" + lv, slot: "house", name: HOUSES[lv].name, icon: HOUSES[lv].icon, price: pr[lv] }; render(); return;
    }
    if (b) {
      const it = homeItem(b.dataset.id); if (!it) return;
      if (pet.level < it.level) { toast(it.name + " unlocks at level " + it.level + "."); return; }
      if (it.slot === "ride") { if (!owns(it.id)) { buying = it; render(); } else { useRide(it.id); toast(it.icon + " " + it.name + " is now parked outside."); } return; }
      if (it.slot === "exterior") return useExterior(it.id);
      if (it.slot === "blanket" || it.slot === "pillow") return useBedding(it.id);
      if (it.slot !== "furn") return useStyle(it.id);
      if (!owns(it.id)) { buying = it; render(); return; }
      buying = null; addItem(it.id);
    }
  });
  // galaw gamit ang palaso: 0.1 bawat pindot; habang pinipindot, tuloy-tuloy
  function nudge(k) {
    const sel = room.selected(); if (!sel) return;
    const y = sc.rig.yaw ? sc.rig.yaw() : 0, f = { x: -Math.sin(y), z: -Math.cos(y) }, r = { x: Math.cos(y), z: -Math.sin(y) }, st = 0.1;
    const d = k === "u" ? f : k === "d" ? { x: -f.x, z: -f.z } : k === "r" ? r : { x: -r.x, z: -r.z };
    room.move(sel, sel.x + d.x * st, sel.z + d.z * st); queueSave();
  }
  let mvT = 0, mvI = 0;
  const mvStop = () => { clearTimeout(mvT); clearInterval(mvI); mvT = mvI = 0; };
  bar.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("[data-mv]"); if (!b) return; e.preventDefault(); e.stopPropagation(); mvStop();
    nudge(b.dataset.mv); mvT = setTimeout(() => { mvI = setInterval(() => nudge(b.dataset.mv), 70); }, 350);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((n) => bar.addEventListener(n, mvStop));
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rb]"), sel = room.selected(); if (!b || !sel) return;
    if (b.dataset.rb === "rotate") { room.rotate(sel); queueSave(); }
    if (b.dataset.rb === "remove") { room.remove(sel); select(null); queueSave(); render(); }
    if (b.dataset.rb === "done") select(null);
  });

  // ---------- hila ng gamit sa 3D ----------
  let drag = null;
  const lp = { t: 0, x: 0, y: 0, id: 0 };
  function lpEnd() { clearTimeout(lp.t); lp.t = 0; window.removeEventListener("pointermove", lpMove); window.removeEventListener("pointerup", lpEnd); window.removeEventListener("pointercancel", lpEnd); }
  function lpMove(ev) { if (ev.pointerId === lp.id && Math.hypot(ev.clientX - lp.x, ev.clientY - lp.y) > 10) lpEnd(); }
  const ndc = (ev) => { const r = canvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1)]; };
  function claim(ev) {
    if (!sc.room()) return false;
    const [x, y] = ndc(ev), ray = sc.ray(x, y), hit = room.pick(ray);
    if (!hit) { if (room.selected()) select(null); return false; }
    if (hit !== room.selected()) {   // hindi pa napili: kailangang pindutin nang matagal (isang tap = walang mangyayari; hila = ikot ng view)
      clearTimeout(lp.t); lp.x = ev.clientX; lp.y = ev.clientY; lp.id = ev.pointerId;
      lp.t = setTimeout(() => { lp.t = 0; if (sc.room()) { select(hit); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} } }, 400);
      window.addEventListener("pointermove", lpMove); window.addEventListener("pointerup", lpEnd); window.addEventListener("pointercancel", lpEnd);
      return false;
    }
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
    lpEnd(); sc.setClaim(null); select(null); bar.remove(); box.remove(); keep.forEach((el) => { el.hidden = false; });
    // ibalik ang hindi nabiling dingding/sahig
    const s = (sc.floor && sc.floor() === 2 ? (pet.room || {}).up : pet.room) || {}, st = room.style();
    if (!owns(st.wall) || !owns(st.floor)) room.setStyle(owns(st.wall) ? st.wall : s.wall, owns(st.floor) ? st.floor : s.floor);
    if (!owns(bed.blanket) || !owns(bed.pillow)) revertBedding();
    revertExterior();
    sc.rig.setView(view0 === "top" ? "follow" : view0);
    onClose && onClose(pet);
  }
  render();
  return { close, update(p) { pet = p; render(); }, select(e) { select(e || null); } };   // select: galing sa long-press sa gamit
}
