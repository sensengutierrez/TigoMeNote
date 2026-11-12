/* TigoMeNote · tigo/pet-sounds.js — may tunog ang mga alaga: 🐶 tahol · 🐱 ngiyaw · 🐦 huni · 🐥 siyap · 🐇 tili · 🐢 "blip"
   import { createPetSounds } from "./pet-sounds.js"
   const ps = createPetSounds({ sc, voice, busy })   ps.now() → tunog agad (pindot sa alaga, Come/Stay/Free, nabasa) · ps.dispose()
   Kusang tumutunog paminsan-minsan (bawat ~10–20 s) kapag malapit kay Tigo, hindi tulog at walang laro. busy() = true kapag naglalaro. */
export const PET_SFX = { puppy: "bark", kitty: "meow", birdie: "tweet", chick: "peep", bunbun: "squeak", turtle: "blip" };

export function createPetSounds({ sc, voice, busy }) {
  let last = 0, timer = 0;
  function now() {
    const id = sc && sc.buddyId && sc.buddyId(); if (!id || !voice || !PET_SFX[id]) return false;
    last = Date.now(); voice.sfx(PET_SFX[id]); return true;
  }
  function tick() {
    clearTimeout(timer); timer = setTimeout(tick, 10000 + Math.random() * 10000);
    if (document.hidden || !sc || (busy && busy()) || sc.inGame() || sc.isInside() || Date.now() - last < 8000) return;
    if (sc.buddyNear && sc.buddyNear(4.5)) now();
  }
  timer = setTimeout(tick, 6000);
  return { now, dispose() { clearTimeout(timer); } };
}
