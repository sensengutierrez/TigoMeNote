/* TigoMeNote · moderation-check.js — GAWA NG tools/build-moderation-client.mjs, HUWAG I-EDIT DITO.
   Galing sa backend/moderation.ts (CORE). Para baguhin ang rules: i-edit ang moderation.ts, tapos patakbuhin ulit ang tool.
   TMN_MOD.checkText(text, { teen }) → { ok } o { ok:false, level:"block"|"flag", category, term }
   TMN_MOD.blockMessage(category) · TMN_MOD.isTeen(birthdate) */
(function () {
// ---- CORE START ----

// Ginagawang simple ang text para mahuli rin ang "f0r s4le", "S.H.A.B.U", accents, atbp.
function normalize(s        , leetspeak = true)         {
  const leet                         = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
  return String(s || "")
    .normalize("NFKD").replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => (leetspeak ? leet[c] ?? c : c))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// "killlll" → "kill"
function squeeze(s        )         {
  return s.replace(/(\p{L})\1{2,}/gu, "$1$1");
}
// "s h a b u" → "shabu"
function joinSpaced(s        )         {
  return s.replace(/\b(?:\p{L} ){2,}\p{L}\b/gu, (m) => m.replace(/ /g, ""));
}
// Baliktad: bawat salita ("ubahs" → "shabu") at buong text ("elas rof nug" → "gun for sale")
function reverseWords(s        )         {
  return s.split(" ").map((w) => [...w].reverse().join("")).join(" ");
}
function reverseAll(s        )         {
  return [...s].reverse().join("");
}
// Pinagpalit na pantig ("busha" → "shabu", "rilba" → "baril"): para lang sa mahahalagang salita
const KEYWORDS = ["shabu", "baril", "droga", "marijuana", "mariwana", "cocaine", "glock", "pistol", "rifle", "ganja", "tsongke", "chongke", "pistola"];
function unrotate(s        )         {
  return s.split(" ").map((w) => {
    if (w.length < 5 || KEYWORDS.includes(w)) return w;
    for (const k of KEYWORDS) {
      if (k.length !== w.length) continue;
      for (let i = 1; i < w.length; i++) if (w.slice(i) + w.slice(0, i) === k) return k;
    }
    return w;
  }).join(" ");
}
                                                                                      
const W = (p        ) => new RegExp("(?:^|\\s)(?:" + p.normalize("NFKD").replace(/\p{M}/gu, "") + ")(?=\\s|$)", "u");
const MODEL = "(?: [\\p{L}\\p{N}]+){0,2}"; // hal. "glock 19 for sale", "weed 1g available"
const R = (level                  , category          , term        , p        )       => ({ level, category, term, re: W(p) });

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

const RULES         = [
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
const PERSONAL                          = [
  [/(?:\+?\d[\s.-]?){8,}/, "phone number"],
  [/[^\s@]+@[^\s@]+\.[a-z]{2,}/i, "email"],
  [/\b(?:my address|home address|i live (?:at|in|on)|nakatira ako sa|address ko|bahay namin sa)\b/i, "address"],
  [/\b(?:add me on|text me on|message me on|chat me on|dm me on|pm me sa|i-add mo ako sa|whatsapp|telegram|snapchat|snap me|kik|wechat|viber)\b/i, "other app"],
];

function checkText(text                                           , opts            = {})          {
  const raw = (Array.isArray(text) ? text : [text]).filter(Boolean).join(" \n ");
  if (!raw.trim()) return { ok: true };
  if (opts.teen) {
    for (const [re, term] of PERSONAL) if (re.test(raw)) return { ok: false, level: "block", category: "personal", term };
  }
  const n = normalize(raw), plain = normalize(raw, false); // plain = walang leetspeak (para sa "420", "ak47")
  const forward = [n, plain, squeeze(n), joinSpaced(n), unrotate(n)];
  const backward = [reverseWords(n), reverseAll(n), reverseWords(plain), unrotate(reverseWords(n))];
  let flag                 = null;
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

const LABEL                           = {
  violence: "violence or threats",
  nudity: "nudity or sexual content",
  crime: "illegal drugs or crime",
  firearms: "illegal firearms",
  harassment: "harassment or self-harm encouragement",
  personal: "personal contact details",
};
// Mensahe para sa user (English; isinasalin ng i18n sa browser)
function blockMessage(category          )         {
  if (category === "personal") return "For your safety, teen accounts can't share phone numbers, emails, addresses or other chat apps.";
  return `This can't be posted. It looks like ${LABEL[category]}, which breaks our Community Guidelines.`;
}
// Teen ba (13–17) ang user? (birthdate na YYYY-MM-DD)
function isTeen(birth                           , now = new Date())          {
  if (!birth) return false;
  const b = new Date(birth + "T00:00:00Z");
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a >= 13 && a < 18;
}

  window.TMN_MOD = { checkText: checkText, blockMessage: blockMessage, isTeen: isTeen, normalize: normalize };
})();
