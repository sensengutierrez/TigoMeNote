/* TigoMeNote · ui-prefs.js — Appearance ng app sa device na ito: theme color, laki ng text, UI style
   Ilagay sa <head> ng BAWAT page, kasunod ng theme.js (para walang "flash").
     TMN_UI_PREFS.get()            → { accent, size, style }
     TMN_UI_PREFS.apply(p)         → ilapat (preview lang, hindi naka-save)
     TMN_UI_PREFS.set(p)           → i-save sa device + ilapat
     TMN_UI_PREFS.OPTIONS          → { accent: [...], size: [...], style: [...] } (para sa Settings → Appearance)
   <html data-accent="…" data-ustyle="…">: ang kulay at kanto ay nasa assets/css/tokens.css.
   Laki ng text: sa APK, WebView textZoom ng Android (text lang ang lumalaki, hindi ang buong layout — TMNNative.setTextZoom);
   sa website, CSS zoom ng laman ng page (hindi ng menu). */
(function () {
  var KEY = "tmnUi";
  var OPTIONS = {
    accent: [
      { id: "coral", name: "Coral", color: "#ff5a36" },
      { id: "violet", name: "Violet", color: "#7b5cff" },
      { id: "blue", name: "Blue", color: "#2f7bff" },
      { id: "mint", name: "Mint", color: "#14b8a6" },
      { id: "amber", name: "Amber", color: "#f59e0b" },
      { id: "rose", name: "Rose", color: "#ff4d8d" },
    ],
    size: [
      { id: "s", name: "Small", pct: 90 },
      { id: "m", name: "Default", pct: 100 },
      { id: "l", name: "Large", pct: 112 },
      { id: "xl", name: "Extra large", pct: 125 },
    ],
    style: [
      { id: "rounded", name: "Rounded" },
      { id: "soft", name: "Soft" },
      { id: "crisp", name: "Crisp" },
      { id: "glossy", name: "Glossy" },
    ],
  };
  var DEF = { accent: "coral", size: "m", style: "rounded" };

  function valid(k, v) { return OPTIONS[k].some(function (o) { return o.id === v; }) ? v : DEF[k]; }
  function read() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
    return { accent: valid("accent", p.accent), size: valid("size", p.size), style: valid("style", p.style) };
  }
  function pct(size) { return OPTIONS.size.filter(function (o) { return o.id === size; })[0].pct; }
  function apply(p) {
    p = p || read();
    var h = document.documentElement;
    if (p.accent === DEF.accent) h.removeAttribute("data-accent"); else h.setAttribute("data-accent", p.accent);
    if (p.style === DEF.style) h.removeAttribute("data-ustyle"); else h.setAttribute("data-ustyle", p.style);
    var z = pct(p.size), N = window.TMNNative;
    if (N && N.setTextZoom) { try { N.setTextZoom(z); } catch (e) {} h.style.removeProperty("--tsize"); h.removeAttribute("data-tsize"); }
    else if (z === 100) { h.removeAttribute("data-tsize"); h.style.removeProperty("--tsize"); }
    else { h.setAttribute("data-tsize", p.size); h.style.setProperty("--tsize", String(z / 100)); }
    document.dispatchEvent(new CustomEvent("tmn:ui", { detail: p }));
  }
  function set(p) {
    var cur = read(); p = { accent: valid("accent", p.accent || cur.accent), size: valid("size", p.size || cur.size), style: valid("style", p.style || cur.style) };
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
    apply(p);
    return p;
  }
  window.TMN_UI_PREFS = { get: read, apply: apply, set: set, OPTIONS: OPTIONS, DEFAULT: DEF };
  apply(read());
})();
