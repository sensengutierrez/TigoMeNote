/* TigoMeNote · components/mod-guard.js — babala sa app bago pa i-post (Community Guidelines)
   Gamit ang TMN_MOD (moderation-check.js, parehong rules ng server).
   TMN_GUARD.check(text)       → verdict (kasama ang teen rules kung 13–17 ang user)
   TMN_GUARD.ok(text)          → true kung puwede; kung bawal: toast + false
   TMN_GUARD.watch(field)      → pulang babala sa ilalim ng field habang nagta-type
   Ang server pa rin ang huling nagpapasya (hindi ito madadaya sa pag-edit ng code). */
(function () {
  function teen() { var u = window.TMN_USER || {}; return !!(window.TMN_MOD && TMN_MOD.isTeen(u.birthdate)); }
  function check(text) {
    if (!window.TMN_MOD || !text || !String(text).trim()) return { ok: true };
    return TMN_MOD.checkText(String(text), { teen: teen() });
  }
  function msg(v) { return TMN_MOD.blockMessage(v.category); }
  function tr(s) { return window.TMN_I18N ? TMN_I18N.t(s) : s; }
  function ok() {
    var v = check([].slice.call(arguments).filter(Boolean).join("\n"));
    if (v.ok || v.level !== "block") return true;
    if (window.TMN_UI) TMN_UI.toast(tr(msg(v)));
    return false;
  }
  function watch(field) {
    if (!field || field.dataset.guard) return;
    field.dataset.guard = "1";
    var hint = document.createElement("div");
    hint.className = "mod-hint hidden";
    hint.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", hint);
    var t = null;
    function run() {
      var v = check(field.value);
      var bad = !v.ok && v.level === "block";
      hint.classList.toggle("hidden", !bad);
      field.toggleAttribute("aria-invalid", bad);
      if (bad) {
        var L = (window.TMN_CONFIG && TMN_CONFIG.legal) || {};
        hint.innerHTML = '<span class="mod-hint-text"></span>' + (L.guidelines ? ' <a href="' + L.guidelines + '" target="_blank" rel="noopener">Learn more</a>' : "");
        hint.querySelector(".mod-hint-text").textContent = msg(v);
      }
    }
    field.addEventListener("input", function () { clearTimeout(t); t = setTimeout(run, 350); });
    run();
  }
  window.TMN_GUARD = { check: check, ok: ok, watch: watch };
})();
