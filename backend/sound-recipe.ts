// TigoMeNote · sound-recipe.ts — linisin ang sound ng post/status at ang "recipe" ng sariling gawang tunog (Sound Maker)
// Isang trabaho lang: siguraduhing tama at ligtas ang sound bago i-save.
// Ginagamit ng posts-fast, social-fast at sounds-fast (kasama ang file na ito sa deploy).
//   cleanRecipe(r)        → recipe na pasok sa limit (o null kung sira)
//   resolveSound(db, s)   → { id, vol, orig?, recipe? } — kapag sariling tunog ("u-…"), kinukuha ang recipe sa user_sounds (hindi sa browser)
// Kapareho ng assets/js/sounds.js (SCALES, CHORDS, LEADS).

const SCALES = ["major", "minor", "dorian", "hijaz"];
const CHORDS = ["pad", "keys", "pluck", "marimba", "stab", "guitar", "drone"];
const LEADS = ["bell", "keys", "marimba", "pluck", "lead", "brass", "oud", "arp", "none"];
const ROWS = ["k", "s", "h", "p", "c", "d", "t"];
export const USER_SOUND_ID = /^u-[a-z0-9]{8}$/;
const BUILTIN_ID = /^[a-z0-9-]{2,30}$/;

const clampN = (v: unknown, lo: number, hi: number, d: number) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
const steps = (v: unknown) => typeof v === "string" && /^[x.]{16}$/.test(v) ? v : null;

// deno-lint-ignore no-explicit-any
export function cleanRecipe(r: any): Record<string, unknown> | null {
  if (!r || typeof r !== "object") return null;
  const name = String(r.name ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
  if (!name) return null;
  const drums: Record<string, string> = {};
  if (r.drums && typeof r.drums === "object") for (const k of ROWS) { const s = steps(r.drums[k]); if (s && s.includes("x")) drums[k] = s; }
  const prog = Array.isArray(r.prog) ? r.prog.slice(0, 4).map((x: unknown) => Math.round(clampN(x, 0, 6, 0))) : [0, 4, 5, 3];
  while (prog.length < 4) prog.push(0);
  return {
    v: 1, name,
    bpm: Math.round(clampN(r.bpm, 60, 160, 100)),
    root: Math.round(clampN(r.root, 48, 67, 60)),
    scale: SCALES.includes(r.scale) ? r.scale : "major",
    prog,
    drums: Object.keys(drums).length ? drums : null,
    bass: steps(r.bass) ?? "x.......x.......",
    chord: CHORDS.includes(r.chord) ? r.chord : "keys",
    lead: LEADS.includes(r.lead) ? r.lead : "bell",
    swing: Math.round(clampN(r.swing, 0, 0.3, 0) * 100) / 100,
    rain: !!r.rain, crackle: !!r.crackle,
    seed: String(r.seed ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 12) || "tigo",
    mood: String(r.mood ?? "").replace(/[<>]/g, "").slice(0, 30),
  };
}

// deno-lint-ignore no-explicit-any
export async function resolveSound(db: any, s: any): Promise<Record<string, unknown> | null> {
  if (!s || typeof s !== "object") return null;
  const id = String(s.id ?? "");
  const n = (v: unknown, d: number) => Math.round(clampN(v, 0, 1, d) * 100) / 100;
  const out: Record<string, unknown> = { id, vol: n(s.vol, 0.8) };
  if (s.orig != null) out.orig = n(s.orig, 0.4);
  if (USER_SOUND_ID.test(id)) {
    const { data } = await db.from("user_sounds").select("recipe").eq("id", id).maybeSingle();
    if (data && data.recipe) { out.recipe = data.recipe; return out; }
    // nabura na ang sound pero galing sa ibang post (may kopya ng recipe): linisin at gamitin
    const r = cleanRecipe(s.recipe);
    if (!r) return null;
    out.recipe = r; return out;
  }
  return BUILTIN_ID.test(id) ? out : null;
}
