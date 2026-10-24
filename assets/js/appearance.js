/* TigoMeNote · appearance.js — background ng app sa LAHAT ng page (kulay, gradient o sariling picture)
   Ilagay sa <head> pagkatapos ng theme.js at look-tigo.js (para walang "flash"). Kasama ang assets/css/look.css.
     TMN_LOOK.get()                 → { use, preset, color, strength, panels, desktop, phone }
     TMN_LOOK.set(look)             → ilapat agad + i-save sa device (ang pag-save sa account ay sa appearance-settings.js)
     TMN_LOOK.PRESETS               → [{ id, name, css }]
   use: "none" | "preset" | "color" | "image". strength = gaano kakita ang background (10–100).
   panels = gaano kabuo ang cards (30 = halos see-through, 100 = buo).
   Picture: "desktop" para sa laptop/desktop, "phone" para sa phone (≤ 768 px); kung isa lang, iyon ang gamit sa pareho.
   Naka-save sa account (profile-fast: look / saveLook); kinukuha ulit bawat 10 minuto para pareho sa lahat ng device. */
(function () {
  var KEY = "tmnLook", SYNC = "tmnLookAt", EVERY = 10 * 60 * 1000;
  // Sariling TigoMeNote backgrounds muna (look-tigo.js), tapos mga kulay/gradient
  var COLORS = [
    { id: "sunrise", name: "Sunrise", css: "linear-gradient(135deg,#ffd3a5 0%,#fd6585 100%)" },
    { id: "ocean", name: "Ocean", css: "linear-gradient(135deg,#2193b0 0%,#6dd5ed 100%)" },
    { id: "forest", name: "Forest", dark: true, css: "linear-gradient(135deg,#134e5e 0%,#71b280 100%)" },
    { id: "lavender", name: "Lavender", css: "linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)" },
    { id: "desert", name: "Desert", css: "linear-gradient(135deg,#e6c79c 0%,#c08552 100%)" },
    { id: "mango", name: "Mango", css: "linear-gradient(135deg,#ffe259 0%,#ffa751 100%)" },
    { id: "mint", name: "Mint", css: "linear-gradient(135deg,#d4fc79 0%,#96e6a1 100%)" },
    { id: "sky", name: "Sky", css: "linear-gradient(180deg,#a1c4fd 0%,#c2e9fb 100%)" },
    { id: "rose", name: "Rose", css: "linear-gradient(135deg,#ffafbd 0%,#ffc3a0 100%)" },
    { id: "aurora", name: "Aurora", css: "linear-gradient(135deg,#00c9a7 0%,#845ec2 55%,#ff6f91 100%)" },
    { id: "night", name: "Night", dark: true, css: "linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" },
    { id: "manila-bay", name: "Manila Bay", css: "linear-gradient(180deg,#ff9a44 0%,#fc6076 45%,#3a1c71 100%)" }
  ];
  var TIGO = (window.TMN_LOOK_TIGO || []).map(function (p) { return Object.assign({ tigo: true }, p); });
  var PRESETS = TIGO.concat(COLORS);
  var mq = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || { use: "none" }; } catch (e) { return { use: "none" }; } }
  function cssUrl(u) { return 'url("' + String(u).replace(/["\\\n]/g, "") + '")'; }
  function layer(l) {
    if (l.use === "preset") { var p = PRESETS.filter(function (x) { return x.id === l.preset; })[0]; return p ? p.css : null; }
    if (l.use === "color") return /^#[0-9a-f]{6}$/i.test(l.color || "") ? l.color : null;
    if (l.use === "image") {
      var phone = mq && mq.matches, u = phone ? (l.phone || l.desktop) : (l.desktop || l.phone);
      return u ? cssUrl(u) + " center / cover no-repeat" : null;
    }
    return null;
  }
  function apply(l) {
    l = l || read();
    var root = document.documentElement, bg = layer(l);
    root.classList.toggle("has-bg", !!bg);
    root.classList.toggle("bg-photo", !!bg && l.use === "image");
    var pr = l.use === "preset" ? PRESETS.filter(function (x) { return x.id === l.preset; })[0] : null;
    root.classList.toggle("bg-dark", !!(bg && pr && pr.dark && Number(l.strength) >= 45));
    if (bg) {
      root.style.setProperty("--look-layer", bg);
      root.style.setProperty("--look-strength", String(Math.min(100, Math.max(10, Number(l.strength) || 60)) / 100));
      root.style.setProperty("--look-panel", Math.min(100, Math.max(30, Number(l.panels) || 88)) + "%");
    } else {
      ["--look-layer", "--look-strength", "--look-panel"].forEach(function (k) { root.style.removeProperty(k); });
    }
    document.dispatchEvent(new CustomEvent("tmn:look", { detail: l }));
  }
  function set(l, opts) {
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {}
    if (!(opts && opts.noApply)) apply(l);
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { apply(); });

  // Kunin sa account (para pareho sa lahat ng device), hindi hihigit sa bawat 10 minuto
  function sync(force) {
    var at = 0; try { at = Number(sessionStorage.getItem(SYNC) || 0); } catch (e) {}
    if (!force && Date.now() - at < EVERY) return;
    if (!window.TMN_TOKEN || !window.TMN_API || !navigator.onLine) return;
    try { sessionStorage.setItem(SYNC, String(Date.now())); } catch (e) {}
    TMN_API.call("profile", "look", {}).then(function (r) {
      if (r && r.look && JSON.stringify(r.look) !== JSON.stringify(read())) set(r.look);
    }, function () {});
  }

  apply();
  document.addEventListener("DOMContentLoaded", function () { setTimeout(sync, 1500); });

  window.TMN_LOOK = { get: read, set: set, apply: apply, sync: sync, PRESETS: PRESETS, layer: layer };
})();
