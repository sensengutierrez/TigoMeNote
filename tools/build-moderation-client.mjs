#!/usr/bin/env node
// TigoMeNote · tools/build-moderation-client.mjs
// Isang trabaho lang: kopyahin ang "CORE" ng backend/moderation.ts papunta sa assets/js/moderation-check.js
// para pareho ang rules sa server at sa app/web (babala habang nagta-type, bago pa i-post).
// Gamit (sa root ng repo):  node tools/build-moderation-client.mjs   (Node 22.13+ dahil sa stripTypeScriptTypes)
import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "backend/moderation.ts"), "utf8");
const a = src.indexOf("// ---- CORE START ----"), b = src.indexOf("// ---- CORE END ----");
if (a < 0 || b < 0) throw new Error("Walang CORE markers sa moderation.ts");
let core = stripTypeScriptTypes(src.slice(a, b), { mode: "strip" });
core = core.replace(/^export\s+(?=function|const)/gm, "").replace(/^\s*\n(?=\s*\n)/gm, "");
const out = `/* TigoMeNote · moderation-check.js — GAWA NG tools/build-moderation-client.mjs, HUWAG I-EDIT DITO.
   Galing sa backend/moderation.ts (CORE). Para baguhin ang rules: i-edit ang moderation.ts, tapos patakbuhin ulit ang tool.
   TMN_MOD.checkText(text, { teen }) → { ok } o { ok:false, level:"block"|"flag", category, term }
   TMN_MOD.blockMessage(category) · TMN_MOD.isTeen(birthdate) */
(function () {
${core}
  window.TMN_MOD = { checkText: checkText, blockMessage: blockMessage, isTeen: isTeen, normalize: normalize };
})();
`;
writeFileSync(join(root, "assets/js/moderation-check.js"), out);
console.log("assets/js/moderation-check.js", out.length, "bytes");
