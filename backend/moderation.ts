// TigoMeNote · moderation.ts — automatic na pag-check ng TEXT (caption, comment, bio, pangalan)
// Isang trabaho lang: sabihin kung bawal ("block") o kailangang tingnan ng admin ("flag") ang isang text.
// Ginagamit ng posts-fast, social-fast, profile-fast at auth-fast (kasama ang file na ito sa deploy).
// Ang bahaging "CORE" ay kinokopya rin sa browser (assets/js/moderation-check.js) gamit ang
//   node tools/build-moderation-client.mjs   ← patakbuhin tuwing babaguhin ang rules dito.
// Mga kategorya: violence (banta), nudity, crime (droga, marijuana, atbp.), firearms, harassment, personal (teen).
//   block = hindi tatanggapin (malinaw na bawal)
//   flag  = tatanggapin pero ipapadala sa Reports ng admin para tingnan (puwedeng balita o biro)
// Nahuhuli rin: "G.U.N for s4le", "s h a b u", baliktad na salita ("ubahs", "elas rof nug"),
// pinagpalit na pantig ("busha" → shabu), accents at Arabic.
// Ang photo at video ay sa Report + admin review muna (walang AI na pang-image dito).

// ---- CORE START ----
export type Category = "violence" | "nudity" | "crime" | "firearms" | "harassment" | "personal";
export type Verdict = { ok: true } | { ok: false; level: "block" | "flag"; category: Category; term: string };
export type CheckOpts = { teen?: boolean };

// Ginagawang simple ang text para mahuli rin ang "f0r s4le", "S.H.A.B.U", accents, atbp.
export function normalize(s: string, leetspeak = true): string {
  const leet: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
  return String(s || "")
    .normalize("NFKD").replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => (leetspeak ? leet[c] ?? c : c))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// "killlll" → "kill"
function squeeze(s: string): string {
  return s.replace(/(\p{L})\1{2,}/gu, "$1$1");
}
// "s h a b u" → "shabu"
function joinSpaced(s: string): string {
  return s.replace(/\b(?:\p{L} ){2,}\p{L}\b/gu, (m) => m.replace(/ /g, ""));
}
// Baliktad: bawat salita ("ubahs" → "shabu") at buong text ("elas rof nug" → "gun for sale")
function reverseWords(s: string): string {
  return s.split(" ").map((w) => [...w].reverse().join("")).join(" ");
}
function reverseAll(s: string): string {
  return [...s].reverse().join("");
}
// Pinagpalit na pantig ("busha" → "shabu", "rilba" → "baril"): para lang sa mahahalagang salita
const KEYWORDS = ["shabu", "baril", "droga", "marijuana", "mariwana", "cocaine", "glock", "pistol", "rifle", "ganja", "tsongke", "chongke", "pistola"];
function unrotate(s: string): string {
  return s.split(" ").map((w) => {
    if (w.length < 5 || KEYWORDS.includes(w)) return w;
    for (const k of KEYWORDS) {
      if (k.length !== w.length) continue;
      for (let i = 1; i < w.length; i++) if (w.slice(i) + w.slice(0, i) === k) return k;
    }
    return w;
  }).join(" ");
}

type Rule = { level: "block" | "flag"; category: Category; re: RegExp; term: string };
const W = (p: string) => new RegExp("(?:^|\\s)(?:" + p.normalize("NFKD").replace(/\p{M}/gu, "") + ")(?=\\s|$)", "u");
const MODEL = "(?: [\\p{L}\\p{N}]+){0,2}"; // hal. "glock 19 for sale", "weed 1g available"
const R = (level: "block" | "flag", category: Category, term: string, p: string): Rule => ({ level, category, term, re: W(p) });

// Mga salita: English, Filipino at Arabic. Phrase ang karamihan para hindi mahuli ang normal na usapan.
const SALE = "for sale|fs|benta|binebenta|ibebenta|nagbebenta|selling|sell|pm for price|cash on delivery|cod|للبيع|بيع";
const DRUG_SALE = SALE + "|available|avail|may stock|in stock|stock|order|orders|deliver|delivery|meet up|meetup|pm me|dm me|hm|how much|magkano|hanap|need|looking for|buy|bili|bibili|kuha|kukuha";
const GUNS = "gun|guns|baril|pistol|pistola|rifle|revolver|glock|kalibre|caliber|ammo|ammunition|bala|bullets|magazine|shotgun|uzi|ar ?15|ak ?47|armalite|granada|grenade|سلاح|مسدس|رصاص";
// WEED = malinaw na marijuana (pang-block kapag may bentahan/gamit). Ang "damo" (damo rin sa hardin) ay flag lang.
const WEED = "marijuana|marihuana|mariwana|marijuwana|weed|ganja|kush|cannabis|hashish|thc|tsongke|chongke|jutes|زطلة|حشيش|بانجو|ماريجوانا|قنب";
const HARD = "shabu|meth|methamphetamine|cocaine|heroin|fentanyl|ecstasy|mdma|lsd|ketamine|captagon|crystal meth|كبتاجون|مخدرات|كوكايين|هيروين";
const DRUGS = WEED + "|" + HARD;
const FILL = "(?: (?:ng|nang|some|a|the|tayo|tayong|na|kami|ako|kayo|daw|lang|muna)){0,2}";
const USE = "smoke|smoking|smoked|hithit|humithit|hihithit|hitit|toke|blaze|blazing|roll|rolling|sesh|tira|tumira|titira|bumatak|batak|gamit|gumamit|try|high on|high sa|naka high sa|sniff|snort|dakdak";

const RULES: Rule[] = [
  // ---------- illegal firearms ----------
  R("block", "firearms", "firearm sale", `(?:${GUNS})${MODEL} (?:${SALE})`),
  R("block", "firearms", "firearm sale", `(?:${SALE}) (?:${GUNS})`),
  R("block", "firearms", "firearm sale", "(?:buy|bili|bibili|bumili|need|hanap|looking for) (?:ng |a |some )?(?:gun|guns|baril|pistol|ammo|bala|glock|granada)(?: without (?:license|papers))?"),
  R("block", "firearms", "illegal firearm", "paltik|sumpak|loose firearms?|unregistered (?:gun|guns|firearms?)|walang lisensya(?:ng)? baril|ghost gun|3d printed gun|glock switch|auto sear|full auto conversion|silencer for sale|suppressor for sale|how to make a gun|paano gumawa ng baril|سلاح غير مرخص"),
  R("flag", "firearms", "firearm", "gun|guns|baril|pistol|pistola|rifle|glock|ar ?15|ak ?47|armalite|bala ng baril|ammo|granada|grenade|سلاح|مسدس"),

  // ---------- drugs / marijuana / crime ----------
  R("block", "crime", "drug sale", `(?:${DRUGS})${MODEL} (?:${DRUG_SALE})`),
  R("block", "crime", "drug sale", `(?:${DRUG_SALE}) (?:ng |some |a |of )?(?:${DRUGS})`),
  R("block", "crime", "drug use", `(?:${USE})${FILL} (?:${DRUGS})`),
  R("block", "crime", "drug use", `(?:${DRUGS}) (?:session|sesh|tayo|party|time|na tayo)|420 (?:${WEED})|(?:${WEED}) 420|bangag|adik sa (?:${DRUGS})`),
  R("block", "crime", "drugs", "shabu|captagon|كبتاجون|fentanyl|tsongke|chongke|jutes|crystal meth"),
  R("block", "crime", "crime service", "hitman|hire (?:a )?killer|killer for hire|contract killing|fake (?:id|ids|passport|passports|visa|cpr)|pekeng (?:id|passport|pera)|counterfeit (?:money|bills|cash)|money laundering|carding|cvv for sale|stolen (?:phone|phones|cards?|car|cars) (?:for sale|benta)|nakaw na (?:cellphone|cp|phone|kotse) (?:for sale|benta)|human trafficking|تزوير|غسيل أموال"),
  R("flag", "crime", "drugs", WEED + "|damo|cocaine|heroin|meth|ecstasy|mdma|droga|drugs|مخدرات"),

  // ---------- violence / threats ----------
  R("block", "violence", "threat",
    "i (?:will|ll|am going to|m going to|gonna|want to) (?:kill|shoot|stab|murder|bomb|hurt|burn) (?:you|u|ya|him|her|them|everyone|y all)" +
    "|you (?:re|are) (?:gonna|going to) die|watch your back|i know where you live|your family (?:will|is gonna) (?:pay|die)" +
    "|(?:papatayin|patayin|ipapapatay|ipapatay|babarilin|barilin|sasaksakin|saksakin|tatagain|bubugbugin|sasaktan|gigilitan|susunugin) (?:kita|ka|ko kayo|ko kayong lahat|ko siya|ko sila|ko pamilya mo|ko ang pamilya mo|ko bahay mo|ko ang bahay mo|kayo)" +
    "|patay ka sa akin|patay ka saken|patay ka sakin|humanda ka sa akin|humanda ka saken|abangan kita|aabangan kita|alam ko (?:bahay mo|kung saan ka nakatira)|pasasabugin (?:ko )?(?:kayo|ang)|bomb threat" +
    "|سأقتلك|سوف اقتلك|راح اقتلك|بقتلك|راح اذبحك|بذبحك|أعرف وين ساكن|اعرف وين ساكن"),
  R("block", "violence", "violent attack", "school shooting|mass shooting plan|shoot up (?:the|a|my) (?:school|mall|church|mosque)|how to make a bomb|paano gumawa ng bomba"),
  R("flag", "violence", "violence", "kill|patayin|patay ka|barilin|saksakin|murder|behead|beheading|massacre|terrorist|gore|bloody|duguan|humanda ka|قتل|ذبح"),

  // ---------- harassment / self-harm encouragement ----------
  R("block", "harassment", "self-harm encouragement", "kill yourself|kys|go die|just die|magpakamatay ka na|mamatay ka na sana|sana mamatay ka na|اقتل نفسك|انتحر"),

  // ---------- nudity / sexual ----------
  R("block", "nudity", "sexual content", "porn|porno|pornhub|xvideos|xnxx|xxx|sex video|sex vid|sex scandal|nudes|send nudes|nude pics|naked pics|selling nudes|pic for sale|kantot|kantutan|jakol|chupa|سكس|نيك|افلام اباحية"),
  R("flag", "nudity", "nudity", "nude|naked|hubad|hubo t hubad|onlyfans|of link|spicy pics|18 only|for adults only|boobs|tits|عاري|عارية"),
];

// Para sa teen (13–17): bawal magbigay ng phone, email, address o ibang app para mag-usap nang pribado
const PERSONAL: Array<[RegExp, string]> = [
  [/(?:\+?\d[\s.-]?){8,}/, "phone number"],
  [/[^\s@]+@[^\s@]+\.[a-z]{2,}/i, "email"],
  [/\b(?:my address|home address|i live (?:at|in|on)|nakatira ako sa|address ko|bahay namin sa)\b/i, "address"],
  [/\b(?:add me on|text me on|message me on|chat me on|dm me on|pm me sa|i-add mo ako sa|whatsapp|telegram|snapchat|snap me|kik|wechat|viber)\b/i, "other app"],
];

export function checkText(text: string | Array<string | null | undefined>, opts: CheckOpts = {}): Verdict {
  const raw = (Array.isArray(text) ? text : [text]).filter(Boolean).join(" \n ");
  if (!raw.trim()) return { ok: true };
  if (opts.teen) {
    for (const [re, term] of PERSONAL) if (re.test(raw)) return { ok: false, level: "block", category: "personal", term };
  }
  const n = normalize(raw), plain = normalize(raw, false); // plain = walang leetspeak (para sa "420", "ak47")
  const forward = [n, plain, squeeze(n), joinSpaced(n), unrotate(n)];
  const backward = [reverseWords(n), reverseAll(n), reverseWords(plain), unrotate(reverseWords(n))];
  let flag: Verdict | null = null;
  for (const r of RULES) {
    // Block: lahat ng bersyon. Flag: kasama ang baliktad na bawat salita ("anaujiram"), pero hindi ang buong baliktad
    const vars = r.level === "block" ? forward.concat(backward) : forward.concat([backward[0]]);
    for (const v of vars) {
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
  personal: "personal contact details",
};
// Mensahe para sa user (English; isinasalin ng i18n sa browser)
export function blockMessage(category: Category): string {
  if (category === "personal") return "For your safety, teen accounts can't share phone numbers, emails, addresses or other chat apps.";
  return `This can't be posted. It looks like ${LABEL[category]}, which breaks our Community Guidelines.`;
}
// Teen ba (13–17) ang user? (birthdate na YYYY-MM-DD)
export function isTeen(birth: string | null | undefined, now = new Date()): boolean {
  if (!birth) return false;
  const b = new Date(birth + "T00:00:00Z");
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a >= 13 && a < 18;
}
// ---- CORE END ----

// Para sa server: check na kasama ang edad ng user
// deno-lint-ignore no-explicit-any
export function checkFor(user: any, ...parts: Array<string | null | undefined>): Verdict {
  return checkText(parts, { teen: isTeen(user?.birthdate) });
}

// ---------- para sa mga function (kailangan ang Supabase client ng caller) ----------
// deno-lint-ignore no-explicit-any
type DB = any;
// I-log na may hinarang (para makita ng admin ang paulit-ulit na lumalabag)
export async function logBlock(db: DB, userId: string, v: { category: Category; term: string }, field: string) {
  await db.from("moderation_log").insert({ actor_id: null, action: "auto_block", user_id: userId, reason: v.category, note: `${field}: ${v.term}` });
}
// Automatic na report para sa "flag" (tatanggapin ang content pero titingnan ng admin)
export async function autoFlag(db: DB, t: { type: "post" | "comment" | "user" | "story" | "message"; id: string; owner: string }, v: { category: Category; term: string }) {
  const reason = v.category === "personal" ? "other" : v.category;
  await db.from("reports").insert({ reporter_id: null, auto: true, target_type: t.type, target_id: t.id, owner_id: t.owner, reason, note: "Auto: " + v.term });
  await db.from("moderation_log").insert({ actor_id: null, action: "auto_flag", target_type: t.type, target_id: t.id, user_id: t.owner, reason: v.category, note: v.term });
}
