// TigoMeNote · moderation.ts — automatic na pag-check ng TEXT (caption, comment, bio, pangalan)
// Isang trabaho lang: sabihin kung bawal ("block") o kailangang tingnan ng admin ("flag") ang isang text.
// Ginagamit ng posts-fast, social-fast, profile-fast at auth-fast (kasama ang file na ito sa deploy).
// Mga kategorya: violence, nudity, crime, firearms, harassment.
//   block = hindi tatanggapin (malinaw na bawal: bentahan ng baril/droga, banta, porn)
//   flag  = tatanggapin pero ipapadala sa Reports ng admin para tingnan (puwedeng balita o biro)
// Ang photo at video ay sa Report + admin review muna (walang AI na pang-image dito).

export type Category = "violence" | "nudity" | "crime" | "firearms" | "harassment";
export type Verdict = { ok: true } | { ok: false; level: "block" | "flag"; category: Category; term: string };

// Ginagawang simple ang text para mahuli rin ang "g u n", "f0r s4le", "S.H.A.B.U", accents, atbp.
export function normalize(s: string): string {
  const leet: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
  return String(s || "")
    .normalize("NFKD").replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => leet[c] ?? c)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// "killlll" → "kill" (hiwalay na bersyon para hindi masira ang "xxx")
function squeeze(s: string): string {
  return s.replace(/(\p{L})\1{2,}/gu, "$1$1");
}
// Pinagdugtong ang magkakahiwalay na isang-letra ("s h a b u" → "shabu")
function joinSpaced(s: string): string {
  return s.replace(/\b(?:\p{L} ){2,}\p{L}\b/gu, (m) => m.replace(/ /g, ""));
}

type Rule = { level: "block" | "flag"; category: Category; re: RegExp; term: string };
const W = (p: string) => new RegExp("(?:^|\\s)(?:" + p.normalize("NFKD").replace(/\p{M}/gu, "") + ")(?=\\s|$)", "u");
const MODEL = "(?: [\\p{L}\\p{N}]+){0,2}"; // hal. "glock 19 for sale", "baril 9mm benta"
const R = (level: "block" | "flag", category: Category, term: string, p: string): Rule => ({ level, category, term, re: W(p) });

// Mga salita: English, Filipino at Arabic. Phrase ang karamihan para hindi mahuli ang normal na usapan.
const SALE = "for sale|fs|benta|binebenta|ibebenta|selling|sell|pm for price|cash on delivery|cod|للبيع|بيع";
const RULES: Rule[] = [
  // ---------- illegal firearms ----------
  R("block", "firearms", "firearm sale", `(?:gun|guns|baril|pistol|pistola|rifle|revolver|glock|kalibre|caliber|ammo|ammunition|bala|bullets|magazine|shotgun|uzi|ar ?15|ak ?47|armalite|سلاح|مسدس|رصاص)${MODEL} (?:${SALE})`),
  R("block", "firearms", "firearm sale", `(?:${SALE}) (?:gun|guns|baril|pistol|pistola|rifle|revolver|glock|ammo|ammunition|bala|bullets|shotgun|ar ?15|ak ?47|سلاح|مسدس|رصاص)`),
  R("block", "firearms", "firearm sale", "(?:buy|bili|bibili|bumili|need|hanap|looking for) (?:ng )?(?:gun|guns|baril|pistol|ammo|bala|glock)(?: without (?:license|papers))?"),
  R("block", "firearms", "illegal firearm", "paltik|sumpak|loose firearms?|unregistered (?:gun|guns|firearms?)|walang lisensya(?:ng)? baril|ghost gun|3d printed gun|glock switch|auto sear|full auto conversion|silencer for sale|suppressor for sale|سلاح غير مرخص"),
  R("flag", "firearms", "firearm", "gun|guns|baril|pistol|pistola|rifle|glock|ar ?15|ak ?47|armalite|bala ng baril|ammo|سلاح|مسدس"),

  // ---------- crime / drugs ----------
  R("block", "crime", "drug sale", `(?:shabu|meth|methamphetamine|cocaine|heroin|fentanyl|ecstasy|mdma|lsd|weed|marijuana|ketamine|captagon|كبتاجون|حشيش|مخدرات|كوكايين) (?:${SALE})`),
  R("block", "crime", "drug sale", `(?:${SALE}) (?:shabu|meth|cocaine|heroin|fentanyl|ecstasy|mdma|weed|marijuana|captagon|كبتاجون|حشيش|مخدرات)`),
  R("block", "crime", "drugs", "shabu|captagon|كبتاجون|fentanyl"),
  R("block", "crime", "crime service", "hitman|hire (?:a )?killer|killer for hire|contract killing|fake (?:id|ids|passport|passports|visa|cpr)|pekeng (?:id|passport|pera)|counterfeit (?:money|bills|cash)|money laundering|carding|cvv for sale|stolen (?:phone|phones|cards?|car|cars) (?:for sale|benta)|nakaw na (?:cellphone|cp|phone|kotse) (?:for sale|benta)|human trafficking|تزوير|غسيل أموال"),
  R("flag", "crime", "drugs", "cocaine|heroin|meth|ecstasy|mdma|weed|marijuana|damo|droga|drugs|مخدرات|حشيش"),

  // ---------- violence / threats ----------
  R("block", "violence", "threat", "i (?:will|ll|am going to|m going to|gonna) (?:kill|shoot|stab|murder|bomb) (?:you|u|ya|him|her|them|everyone|y all)|papatayin (?:kita|ka|ko kayo|ko kayong lahat|ko siya)|patayin (?:kita|ka)|babarilin (?:kita|ka|ko kayo)|sasaksakin (?:kita|ka)|pasasabugin (?:ko )?(?:kayo|ang)|bomb threat|سأقتلك|سوف اقتلك|راح اقتلك|بقتلك"),
  R("block", "violence", "violent attack", "school shooting|mass shooting plan|how to make a bomb|paano gumawa ng bomba"),
  R("flag", "violence", "violence", "kill|patayin|patay ka|barilin|saksakin|murder|behead|beheading|massacre|terrorist|gore|bloody|duguan|قتل|ذبح"),

  // ---------- harassment / self-harm encouragement ----------
  R("block", "harassment", "self-harm encouragement", "kill yourself|kys|go die|magpakamatay ka na|mamatay ka na sana|اقتل نفسك|انتحر"),

  // ---------- nudity / sexual ----------
  R("block", "nudity", "sexual content", "porn|porno|pornhub|xvideos|xnxx|xxx|sex video|sex vid|sex scandal|nudes|send nudes|nude pics|naked pics|selling nudes|pic for sale|kantot|kantutan|jakol|chupa|سكس|نيك|افلام اباحية"),
  R("flag", "nudity", "nudity", "nude|naked|hubad|hubo t hubad|onlyfans|of link|spicy pics|18 only|for adults only|boobs|tits|عاري|عارية"),
];

export function checkText(...parts: Array<string | null | undefined>): Verdict {
  const raw = parts.filter(Boolean).join(" \n ");
  if (!raw.trim()) return { ok: true };
  const n = normalize(raw);
  const variants = [n, squeeze(n), joinSpaced(n)];
  let flag: Verdict | null = null;
  for (const r of RULES) {
    for (const v of variants) {
      if (!r.re.test(v)) continue;
      if (r.level === "block") return { ok: false, level: "block", category: r.category, term: r.term };
      if (!flag) flag = { ok: false, level: "flag", category: r.category, term: r.term };
    }
  }
  return flag ?? { ok: true };
}

const LABEL: Record<Category, string> = {
  violence: "violence or threats",
  nudity: "nudity or sexual content",
  crime: "illegal drugs or crime",
  firearms: "illegal firearms",
  harassment: "harassment or self-harm encouragement",
};
// Mensahe para sa user (English; isinasalin ng i18n sa browser)
export function blockMessage(category: Category): string {
  return `This can't be posted. It looks like ${LABEL[category]}, which breaks our Community Guidelines.`;
}

// ---------- para sa mga function (kailangan ang Supabase client ng caller) ----------
// deno-lint-ignore no-explicit-any
type DB = any;
// I-log na may hinarang (para makita ng admin ang paulit-ulit na lumalabag)
export async function logBlock(db: DB, userId: string, v: { category: Category; term: string }, field: string) {
  await db.from("moderation_log").insert({ actor_id: null, action: "auto_block", user_id: userId, reason: v.category, note: `${field}: ${v.term}` });
}
// Automatic na report para sa "flag" (tatanggapin ang content pero titingnan ng admin)
export async function autoFlag(db: DB, t: { type: "post" | "comment" | "user" | "story"; id: string; owner: string }, v: { category: Category; term: string }) {
  await db.from("reports").insert({ reporter_id: null, auto: true, target_type: t.type, target_id: t.id, owner_id: t.owner, reason: v.category, note: "Auto: " + v.term });
  await db.from("moderation_log").insert({ actor_id: null, action: "auto_flag", target_type: t.type, target_id: t.id, user_id: t.owner, reason: v.category, note: v.term });
}
