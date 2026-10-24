/* TigoMeNote · tigo/journey-ui.js — Growth journey: paikot-ikot na daan mula Lv 1 hanggang Lv 10
   import { journeyNode } from "./journey-ui.js"
   journeyNode(pet, esc) → <div> na ilalagay sa modal. ✓ = naabot na, ★ = ngayon, 🔒 = susunod pa. */
import { JOURNEY } from "./catalog.js";

export function journeyNode(pet, esc) {
  const box = document.createElement("div");
  box.className = "tg-journey";
  const pct = Math.round(100 * (pet.xp - pet.prev) / Math.max(1, pet.next - pet.prev));
  box.innerHTML =
    '<div class="tg-jr-now"><b>Level ' + pet.level + "</b><span>" + esc((JOURNEY.find((j) => j.level === pet.level) || {}).title || "Tigo Master") + "</span>" +
    '<div class="tg-xp-line"><i style="width:' + Math.min(100, pct) + '%"></i></div><small class="faint">' + (pet.level >= 10 ? "Max level reached 🌟" : pet.xp + " / " + pet.next + " XP to Level " + (pet.level + 1)) + "</small></div>" +
    '<ol class="tg-path">' + JOURNEY.map((j, i) => {
      const st = j.level < pet.level ? "done" : j.level === pet.level ? "now" : "next";
      return '<li class="tg-step ' + st + (i % 2 ? " r" : " l") + '"><span class="tg-node">' + (st === "done" ? "✓" : st === "now" ? j.icon : "🔒") + '</span>' +
        '<div class="tg-step-txt"><small>Lv ' + j.level + "</small><b>" + esc(j.title) + "</b><span>" + esc(j.reward) + "</span></div></li>";
    }).join("") + "</ol>" +
    '<p class="faint small">Earn XP by feeding, playing, cleaning, writing in Daily, Coin Rush, and meeting friends nearby. Every new level also gives 🪙 coins.</p>';
  return box;
}
