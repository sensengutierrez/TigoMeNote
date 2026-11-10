/* TigoMeNote · tigo/avatar-ui.js — "Avatar": pumili kung Tigo (note) o Kid (parang tao), at ayusin ang itsura ng Kid
   import { openAvatar } from "./avatar-ui.js"
   const a = openAvatar({ host, pet, call, onPreview(avatar), onPet(pet), onClose })     a.close()
     host      = paglalagyan (side panel o sheet sa loob ng laro); itinatago ang dating laman habang bukas
     onPreview = live na palit sa 3D habang pumipili (hindi pa naka-save); Save = pet-fast "avatar"; isara nang hindi nag-save = balik sa dati
   Mga pagpipilian: KID sa human-model.js (ready-made looks, balat, buhok, kulay ng buhok, pang-itaas, pang-ibaba, sapatos). Libre lahat.
   Ang sumbrero, salamin at hawak sa Closet ay naisusuot din ng Kid. */
import { KID } from "./human-model.js";

const HAIR_N = { short: "Short", bob: "Bob", long: "Long", pony: "Ponytail", spiky: "Spiky", buns: "Buns", curly: "Curly", none: "None" };
const TOP_N = { tee: "T-shirt", stripe: "Stripes", hoodie: "Hoodie", jacket: "Jacket", overall: "Overalls", dress: "Dress" };
const BOT_N = { pants: "Pants", shorts: "Shorts", skirt: "Skirt" };

export function openAvatar({ host, pet, call, onPreview, onPet, onClose }) {
  const keep = [...host.children].filter((el) => !el.hidden);
  keep.forEach((el) => { el.hidden = true; });
  const box = document.createElement("section"); box.className = "card tg-closet tg-av"; box.setAttribute("aria-label", "Avatar");
  host.appendChild(box);
  const saved = pet.avatar && pet.avatar.kind === "kid" ? Object.assign({}, pet.avatar) : { kind: "tigo" };
  let av = Object.assign({}, KID.PRESETS[0], saved), busy = false, done = false;
  delete av.id; delete av.name; delete av.icon;
  av.kind = saved.kind;
  const dirty = () => JSON.stringify(clean(av)) !== JSON.stringify(clean(saved.kind === "kid" ? saved : { kind: "tigo" }));
  function clean(a) { if (a.kind !== "kid") return { kind: "tigo" }; const o = { kind: "kid" }; ["skin", "hair", "hairColor", "top", "topColor", "bottom", "bottomColor", "shoes"].forEach((k) => { if (a[k]) o[k] = a[k]; }); return o; }

  const sw = (key, map) => '<div class="tg-av-sw" role="group">' + Object.keys(map).map((k) => '<button type="button" class="tg-av-c' + (av[key] === k ? " on" : "") + '" data-k="' + key + '" data-v="' + k + '" style="background:' + map[k] + '" aria-label="' + k + '" aria-pressed="' + (av[key] === k) + '"></button>').join("") + "</div>";
  const chips = (key, list, names) => '<div class="chips tg-av-chips" role="group">' + list.map((k) => '<button type="button" class="chip' + (av[key] === k ? " active" : "") + '" data-k="' + key + '" data-v="' + k + '" aria-pressed="' + (av[key] === k) + '">' + names[k] + "</button>").join("") + "</div>";
  function render() {
    const kid = av.kind === "kid";
    box.innerHTML =
      '<div class="tg-cl-head"><h3 style="margin:0;flex:1">Avatar</h3><button type="button" class="btn btn-ghost btn-sm" data-x="close">Close</button></div>' +
      '<div class="segmented tg-av-kind"><button type="button" data-kind="tigo" aria-pressed="' + !kid + '">📝 Tigo</button><button type="button" data-kind="kid" aria-pressed="' + kid + '">🧒 Kid</button></div>' +
      (kid
        ? '<p class="tg-av-l">Ready-made looks</p><div class="tg-av-pre">' + KID.PRESETS.map((p) => '<button type="button" data-pre="' + p.id + '"' + (av.preset === p.id ? ' class="on"' : "") + "><span>" + p.icon + "</span>" + p.name + "</button>").join("") + "</div>" +
          '<p class="tg-av-l">Skin</p>' + sw("skin", KID.SKIN) +
          '<p class="tg-av-l">Hair</p>' + chips("hair", KID.HAIR, HAIR_N) + sw("hairColor", KID.HAIRC) +
          '<p class="tg-av-l">Top</p>' + chips("top", KID.TOP, TOP_N) + sw("topColor", KID.CLOTH) +
          (av.top === "dress" ? "" : '<p class="tg-av-l">Bottom</p>' + chips("bottom", KID.BOTTOM, BOT_N) + sw("bottomColor", KID.CLOTH)) +
          '<p class="tg-av-l">Shoes</p>' + sw("shoes", KID.CLOTH) +
          '<p class="faint small">Hats, glasses and hand items from the Closet fit the Kid too.</p>'
        : '<p class="faint small">Tigo is the little note you know. Pick <b>Kid</b> to play as a person and choose hair, clothes and colors. You can switch any time.</p>') +
      '<div class="tg-av-foot"><button type="button" class="btn btn-primary" data-x="save"' + (dirty() ? "" : " disabled") + ">Save</button></div>";
  }
  function preview() { onPreview && onPreview(av.kind === "kid" ? Object.assign({}, av) : null); }
  box.addEventListener("click", async (e) => {
    if (busy) return;
    const kd = e.target.closest("[data-kind]"), pr = e.target.closest("[data-pre]"), kv = e.target.closest("[data-k]"), x = e.target.closest("[data-x]");
    if (kd) { av.kind = kd.dataset.kind; render(); preview(); return; }
    if (pr) { const p = KID.PRESETS.find((q) => q.id === pr.dataset.pre); Object.assign(av, p, { kind: "kid", preset: p.id }); delete av.id; delete av.name; delete av.icon; render(); preview(); return; }
    if (kv) { av[kv.dataset.k] = kv.dataset.v; delete av.preset; render(); preview(); return; }
    if (!x) return;
    if (x.dataset.x === "close") { api.close(); return; }
    if (x.dataset.x === "save") {
      busy = true; x.disabled = true;
      try { const r = await call("avatar", { avatar: clean(av) }); done = true; onPet && onPet(r.pet); api.close(); if (window.TMN_UI) TMN_UI.toast("Avatar saved ✓"); }
      catch (err) { busy = false; x.disabled = false; if (window.TMN_UI) TMN_UI.toast(err.message || "Couldn't save."); }
    }
  });
  const api = {
    close() {
      if (!box.isConnected) return;
      if (!done) onPreview && onPreview(saved.kind === "kid" ? saved : null);   // hindi nai-save: ibalik ang dati
      box.remove(); keep.forEach((el) => { el.hidden = false; }); onClose && onClose();
    },
  };
  render();
  return api;
}
