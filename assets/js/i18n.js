/* TigoMeNote · i18n.js — wika ng site (language)
   English ang default. Pinapalitan sa Settings → Language (naka-save sa browser: "tmnLang").
   Paano gumagana:
     - Lahat ng text sa code ay English.
     - Kapag ibang wika ang pinili, nilo-load ang dictionary sa assets/js/lang/<code>.js
       at kusang isinasalin ang text sa page (pati mga bagong lumalabas: toast, modal, atbp).
     - Ang laman na gawa ng users (caption, comment, pangalan, bio) ay HINDI isinasalin.
   Para magdagdag ng wika: gumawa ng assets/js/lang/<code>.js (kopyahin ang ar.js) at idagdag sa LANGS sa baba.
   Gamit sa JS: TMN_I18N.t("Saved.")  ·  TMN_I18N.set("ar")  ·  TMN_I18N.lang  ·  TMN_I18N.locale
   Ilagay sa <head> pagkatapos ng config.js. */
(function () {
  var KEY = "tmnLang";
  var LANGS = [
    { code: "en",  name: "English",  native: "English",  locale: "en-US" },
    { code: "ar",  name: "Arabic",   native: "العربية",  locale: "ar-BH", dir: "rtl" },
    { code: "fil", name: "Filipino", native: "Filipino", locale: "fil-PH" }
  ];
  // Hindi isinasalin: laman ng users at mga input
  var SKIP = '[translate="no"], script, style, textarea, input, select option[data-user], code, pre, .avatar, ' +
    '.pc-caption, .pv-cap, .sx-cbody, .sx-bio, .profile-bio, .st-cap, .q-title, .vw-meta, .pc-who b, ' +
    '.sx-user b, .profile-name, #pName, #pUser, .st-item:not(.st-me) .st-name, .pv-author b, .brand, .sx-pname, .pc-repost button, .user-card, ' +
    '.pe-pic .thumb, .crop';
  var ATTRS = ["placeholder", "aria-label", "title"];

  function read() { try { return localStorage.getItem(KEY) || "en"; } catch (e) { return "en"; } }
  var lang = read();
  var info = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
  lang = info.code;
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", info.dir || "ltr");

  var exact = {}, patterns = [];
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  // dict: { "English text": "salin", "Saving {n} file(s)…": "…{n}…" }
  function register(code, dict) {
    if (code !== lang) return;
    Object.keys(dict).forEach(function (k) {
      if (/\{\w+\}/.test(k)) {
        var names = [];
        // {n} {m} {a} {b} = numero lang; ibang pangalan = kahit anong text
        var rx = esc(k).replace(/\\\{(\w+)\\\}/g, function (_, n) { names.push(n); return /^[nmab]$/.test(n) ? "([\\d.,]+)" : "(.+?)"; });
        patterns.push({ re: new RegExp("^" + rx + "$"), names: names, out: dict[k] });
      } else exact[k] = dict[k];
    });
    if (document.body) translateTree(document.body);
  }

  function t(s) {
    if (lang === "en" || s == null) return s;
    var str = String(s), m = str.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
    if (!core) return str;
    if (exact[core] !== undefined) return m[1] + exact[core] + m[3];
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i], r = core.match(p.re);
      if (r) {
        var out = p.out;
        p.names.forEach(function (n, k) { out = out.split("{" + n + "}").join(exact[r[k + 1]] !== undefined ? exact[r[k + 1]] : r[k + 1]); });
        return m[1] + out + m[3];
      }
    }
    return str;
  }

  function skip(el) { return !el || (el.closest && el.closest(SKIP)); }
  function translateNode(n) {
    if (n.nodeType === 3) {
      var p = n.parentElement;
      if (!p || skip(p) || !/[A-Za-z]/.test(n.nodeValue)) return;
      var v = t(n.nodeValue);
      if (v !== n.nodeValue) n.nodeValue = v;
    } else if (n.nodeType === 1) {
      if (skip(n)) { // ang input/textarea mismo: placeholder lang
        if (/^(INPUT|TEXTAREA)$/.test(n.tagName) && !n.closest('[translate="no"]')) translateAttrs(n);
        return;
      }
      translateAttrs(n);
    }
  }
  function translateAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (a && /[A-Za-z]/.test(a)) { var v = t(a); if (v !== a) el.setAttribute(ATTRS[i], v); }
    }
  }
  function translateTree(root) {
    if (lang === "en" || !root) return;
    translateNode(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n; while ((n = w.nextNode())) translateNode(n);
    var dt = t(document.title); if (dt !== document.title) document.title = dt;
  }

  if (lang !== "en") {
    var me = document.currentScript && document.currentScript.src;
    var base = me ? me.replace(/i18n\.js(\?.*)?$/, "") : "";
    // Synchronous para walang "flash" ng English bago maisalin
    var v = window.TMN_CONFIG && TMN_CONFIG.version ? "?v=" + TMN_CONFIG.version : "";
    document.write('<script src="' + base + "lang/" + lang + ".js" + v + '"><\/script>');
    var obs = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "characterData") translateNode(m.target);
        else if (m.type === "attributes") translateAttrs(m.target);
        else m.addedNodes.forEach(function (n) { if (n.nodeType === 3) translateNode(n); else translateTree(n); });
      });
    });
    var start = function () {
      translateTree(document.body);
      obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  }

  // Maliit na language dropdown (login at landing page): TMN_I18N.mountPicker(el)
  function mountPicker(el) {
    if (!el) return;
    el.setAttribute("translate", "no");
    el.innerHTML = '<label class="lang-mini"><span class="sr-only">Language</span>' +
      '<svg class="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.8 6 3.8 9.5s-1.2 6.9-3.8 9.5c-2.6-2.6-3.8-6-3.8-9.5S9.4 5.1 12 2.5z"/></svg>' +
      "<select>" + LANGS.map(function (l) { return '<option value="' + l.code + '"' + (l.code === lang ? " selected" : "") + ">" + l.native + "</option>"; }).join("") + "</select></label>";
    el.querySelector("select").addEventListener("change", function () { window.TMN_I18N.set(this.value); });
  }

  window.TMN_I18N = {
    lang: lang, dir: info.dir || "ltr", locale: info.locale, langs: LANGS,
    t: t, register: register, mountPicker: mountPicker,
    set: function (code) {
      try { localStorage.setItem(KEY, code); } catch (e) {}
      location.reload();
    }
  };
})();
