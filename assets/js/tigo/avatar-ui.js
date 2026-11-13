/* TigoMeNote · tigo/avatar-ui.js — "Avatar" editor: 📝 Tigo (note) · 🧒 Kid (parang tao) · 🧱 Block (parang laruang kahon, 0.11.54)
   import { openAvatar } from "./avatar-ui.js"
   const a = openAvatar({ host, pet, call, onPreview(avatar), onPet(pet), onClose })     a.close()
     host      = paglalagyan (side panel o sheet sa loob ng laro); itinatago ang dating laman habang bukas
     onPreview = live na palit sa 3D habang pumipili (hindi pa naka-save); Save = pet-fast "avatar"; isara nang hindi nag-save = balik sa dati
   Itaas: umiikot na silip (avatar-preview.js; hilahin para paikutin). Tabs: Avatars · Body · Face · Clothing · Accessories.
   Mga pagpipilian: KID (human-model.js) at BLOCK (block-model.js). Libre lahat. Sumbrero, salamin at hawak: sa Closet. */
import { KID } from "./human-model.js";
import { BLOCK } from "./block-model.js";
import { avatarPreview } from "./avatar-preview.js";

const N = {
  hair: { short: "Short", bob: "Bob", long: "Long", pony: "Ponytail", spiky: "Spiky", buns: "Buns", curly: "Curly", anime: "✨ Anime spikes", twintails: "✨ Twin tails", hime: "✨ Hime cut", wolf: "✨ Wolf cut", ahoge: "✨ Ahoge", none: "None", bun: "Bun", mohawk: "Mohawk", cap: "🧢 Cap" },
  top: { tee: "T-shirt", stripe: "Stripes", hoodie: "Hoodie", jacket: "Jacket", overall: "Overalls", dress: "Dress", sailor: "✨ Sailor", gakuran: "✨ Gakuran", yukata: "✨ Yukata", hero: "✨ Hero suit", suit: "💼 Suit", jersey: "🏀 Jersey", armor: "🛡️ Armor" },
  bottom: { pants: "Pants", shorts: "Shorts", skirt: "Skirt", pleated: "✨ Pleated skirt", jeans: "Jeans" },
  eyes: { round: "Round", anime: "✨ Anime" },
  face: { smile: "🙂 Smile", grin: "😁 Grin", cool: "😎 Cool", wink: "😉 Wink", cute: "🥺 Cute", brave: "😤 Brave", sleepy: "😌 Chill", wow: "😮 Wow" },
  body: { classic: "Classic", slim: "Slim", chunky: "Chunky", mini: "Mini" },
};
const TABS = [["avatars", "🧑", "Avatars"], ["body", "🧍", "Body"], ["face", "🙂", "Face"], ["clothing", "👕", "Clothing"], ["acc", "💇", "Accessories"]];
const KEYS = {
  kid: ["skin", "hair", "hairColor", "top", "topColor", "bottom", "bottomColor", "shoes", "eyes", "eyeColor"],
  block: ["skin", "body", "face", "hair", "hairColor", "top", "topColor", "bottom", "bottomColor", "shoes"],
};
const BASE = (kind) => { const p = Object.assign({}, (kind === "block" ? BLOCK : KID).PRESETS[0]); delete p.id; delete p.name; delete p.icon; return p; };

export function openAvatar({ host, pet, call, onPreview, onPet, onClose }) {
  const keep = [...host.children].filter((el) => !el.hidden);
  keep.forEach((el) => { el.hidden = true; });
  const box = document.createElement("section"); box.className = "card tg-closet tg-av"; box.setAttribute("aria-label", "Avatar");
  host.appendChild(box);
  const k0 = pet.avatar && (pet.avatar.kind === "kid" || pet.avatar.kind === "block") ? pet.avatar.kind : "tigo";
  const saved = k0 === "tigo" ? { kind: "tigo" } : Object.assign({}, pet.avatar);
  // hiwalay na pinipili para sa Kid at Block (hindi nawawala kapag nagpalit)
  const looks = { kid: Object.assign(BASE("kid"), k0 === "kid" ? saved : {}), block: Object.assign(BASE("block"), k0 === "block" ? saved : {}) };
  let kind = k0, tab = "avatars", busy = false, done = false;
  const cur = () => looks[kind];
  function clean(k, a) { if (k === "tigo") return { kind: "tigo" }; const o = { kind: k }; KEYS[k].forEach((x) => { if (a[x]) o[x] = a[x]; }); return o; }
  const now = () => clean(kind, cur() || {});
  const dirty = () => JSON.stringify(now()) !== JSON.stringify(clean(k0, saved));

  box.innerHTML = '<div class="tg-cl-head"><h3 style="margin:0;flex:1">Avatar</h3><button type="button" class="btn btn-ghost btn-sm" data-x="close">Close</button></div>' +
    '<div class="tg-av-top"></div><div class="tg-tabs tg-av-tabs" role="tablist"></div><div class="tg-av-body"></div>' +
    '<div class="tg-av-foot"><button type="button" class="btn btn-primary" data-x="save" disabled>Save</button></div>';
  const view = avatarPreview(box.querySelector(".tg-av-top"), { avatar: kind === "tigo" ? null : now(), outfit: pet.outfit });

  const sw = (key, map) => '<div class="tg-av-sw" role="group">' + Object.keys(map).map((k) => '<button type="button" class="tg-av-c' + (cur()[key] === k ? " on" : "") + '" data-k="' + key + '" data-v="' + k + '" style="background:' + map[k] + '" aria-label="' + k + '" aria-pressed="' + (cur()[key] === k) + '"></button>').join("") + "</div>";
  const chips = (key, list) => '<div class="chips tg-av-chips" role="group">' + list.map((k) => '<button type="button" class="chip' + (cur()[key] === k ? " active" : "") + '" data-k="' + key + '" data-v="' + k + '" aria-pressed="' + (cur()[key] === k) + '">' + (N[key === "hairColor" ? "hair" : key][k] || k) + "</button>").join("") + "</div>";
  const L = (t) => '<p class="tg-av-l">' + t + "</p>";
  function body() {
    if (tab === "avatars") {
      const P = kind === "kid" ? KID.PRESETS : kind === "block" ? BLOCK.PRESETS : [];
      return '<div class="segmented tg-av-kind"><button type="button" data-kind="tigo" aria-pressed="' + (kind === "tigo") + '">📝 Tigo</button><button type="button" data-kind="kid" aria-pressed="' + (kind === "kid") + '">🧒 Kid</button><button type="button" data-kind="block" aria-pressed="' + (kind === "block") + '">🧱 Block</button></div>' +
        (P.length ? L("Ready-made looks") + '<div class="tg-av-pre">' + P.map((p) => '<button type="button" data-pre="' + p.id + '"' + (cur().preset === p.id ? ' class="on"' : "") + "><span>" + p.icon + "</span>" + p.name + "</button>").join("") + "</div>"
          : '<p class="faint small">Tigo is the little note you know. Pick <b>Kid</b> (a little person) or <b>Block</b> (a blocky toy buddy) to make your own look. You can switch any time.</p>');
    }
    if (kind === "tigo") return '<p class="faint small tg-av-none">Pick <b>🧒 Kid</b> or <b>🧱 Block</b> in Avatars to change this.</p>';
    const B = kind === "block", D = B ? BLOCK : KID, a = cur();
    if (tab === "body") return L("Skin") + sw("skin", D.SKIN) + (B ? L("Body") + chips("body", BLOCK.BODY) : "");
    if (tab === "face") return B ? L("Face") + chips("face", BLOCK.FACE) : L("Eyes") + chips("eyes", KID.EYES) + (a.eyes === "anime" ? L("Eye color") + sw("eyeColor", KID.EYEC) : "");
    if (tab === "clothing") return L("Top") + chips("top", D.TOP) + sw("topColor", D.CLOTH) +
      (!B && a.top === "dress" ? "" : L("Bottom") + chips("bottom", D.BOTTOM) + sw("bottomColor", D.CLOTH)) + L("Shoes") + sw("shoes", D.CLOTH);
    return L("Hair") + chips("hair", D.HAIR) + (a.hair === "none" ? "" : L("Hair color") + sw("hairColor", D.HAIRC)) +
      '<p class="faint small">🎩 Hats, 👓 glasses and ✋ hand items are in the <b>Closet</b> — they fit every avatar.</p>';
  }
  function render() {
    box.querySelector(".tg-av-tabs").innerHTML = TABS.map(([id, ic, nm]) => '<button type="button" role="tab" aria-selected="' + (id === tab) + '" data-tab="' + id + '"><span>' + ic + "</span><small>" + nm + "</small></button>").join("");
    box.querySelector(".tg-av-body").innerHTML = body();
    box.querySelector('[data-x="save"]').disabled = !dirty() || busy;
  }
  function preview() { const a = kind === "tigo" ? null : now(); view.set(a); onPreview && onPreview(a); }
  box.addEventListener("click", async (e) => {
    if (busy) return;
    const tb = e.target.closest("[data-tab]"), kd = e.target.closest("[data-kind]"), pr = e.target.closest("[data-pre]"), kv = e.target.closest("[data-k]"), x = e.target.closest("[data-x]");
    if (tb) { tab = tb.dataset.tab; render(); const v = box.querySelector(".tg-av-top"); if (v && v.scrollIntoView) v.scrollIntoView({ block: "nearest" }); return; }
    if (kd) { kind = kd.dataset.kind; render(); preview(); return; }
    if (pr) { const p = (kind === "block" ? BLOCK : KID).PRESETS.find((q) => q.id === pr.dataset.pre); looks[kind] = Object.assign(BASE(kind), p, { preset: p.id }); delete looks[kind].id; delete looks[kind].name; delete looks[kind].icon; render(); preview(); return; }
    if (kv) { cur()[kv.dataset.k] = kv.dataset.v; delete cur().preset; render(); preview(); return; }
    if (!x) return;
    if (x.dataset.x === "close") { api.close(); return; }
    if (x.dataset.x === "save") {
      busy = true; x.disabled = true;
      try { const r = await call("avatar", { avatar: now() }); done = true; onPet && onPet(r.pet); api.close(); if (window.TMN_UI) TMN_UI.toast("Avatar saved ✓"); }
      catch (err) { busy = false; x.disabled = false; if (window.TMN_UI) TMN_UI.toast(err.message || "Couldn't save."); }
    }
  });
  const api = {
    close() {
      if (!box.isConnected) return;
      if (!done) onPreview && onPreview(k0 === "tigo" ? null : saved);   // hindi nai-save: ibalik ang dati
      view.dispose(); box.remove(); keep.forEach((el) => { el.hidden = false; }); onClose && onClose();
    },
  };
  render();
  return api;
}
