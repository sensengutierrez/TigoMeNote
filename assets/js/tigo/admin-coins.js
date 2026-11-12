/* TigoMeNote · tigo/admin-coins.js — 🪙 Give coins (Admin lang; ang server ang tunay na nagbabantay: pet-fast "grant")
   import { openGiveCoins } from "./admin-coins.js"
   openGiveCoins({ me, onPet(pet) })  → modal: sa sarili (mabilis na +1,000 / +10,000) o sa ibang user (@username), hanggang 1,000,000 bawat bigay. */
export function openGiveCoins({ me, onPet }) {
  const box = document.createElement("div"); box.className = "tg-give";
  box.innerHTML = '<p class="faint small">Admin only. Coins go straight to the player\'s Tigo.</p>' +
    '<div class="tg-give-quick">' + [100, 1000, 10000].map((n) => '<button type="button" class="btn btn-ghost btn-sm" data-q="' + n + '">Me +🪙 ' + n.toLocaleString() + "</button>").join("") + "</div>" +
    '<label class="field"><span>Player</span><input type="text" name="u" autocomplete="off" placeholder="@username (empty = me)" maxlength="40"></label>' +
    '<label class="field"><span>Coins</span><input type="number" name="n" min="1" max="1000000" step="1" value="500" inputmode="numeric"></label>' +
    '<button type="button" class="btn btn-primary" data-give>🪙 Give coins</button><p class="tg-give-s small" aria-live="polite"></p>';
  const m = TMN_MODAL.open({ title: "🪙 Give coins", size: "sm", cls: "modal-sheet", body: box });
  const st = box.querySelector(".tg-give-s");
  async function give(username, coins) {
    const n = Math.floor(Number(coins) || 0); if (n < 1 || n > 1_000_000) { st.textContent = "Enter 1 to 1,000,000 coins."; return; }
    box.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    try {
      const r = await TMN_API.call("pet", "grant", { username: username || "", coins: n });
      st.textContent = "✓ Gave 🪙 " + n.toLocaleString() + " to @" + r.username + " (now 🪙 " + Number(r.coins).toLocaleString() + ")";
      if (r.pet && onPet) onPet(r.pet);
    } catch (e) { st.textContent = e.message || "Couldn't give coins."; }
    box.querySelectorAll("button").forEach((b) => { b.disabled = false; });
  }
  box.addEventListener("click", (e) => {
    const q = e.target.closest("[data-q]"); if (q) { give("", q.dataset.q); return; }
    if (e.target.closest("[data-give]")) give(box.querySelector("[name=u]").value.replace(/^@/, "").trim(), box.querySelector("[name=n]").value);
  });
  return m;
}
export const isAdmin = () => !!(window.TMN_USER && TMN_USER.role === "Admin");
