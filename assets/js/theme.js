/* TigoMeNote · theme.js
   Ilagay sa <head> ng BAWAT page (bago ang CSS) para walang "flash" ng maling kulay.
   Modes: "light" | "dark" | "system". */
(function () {
  var KEY = "tmnTheme";
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function read() {
    try { return localStorage.getItem(KEY) || "light"; } catch (e) { return "light"; }
  }
  function resolve(mode) {
    if (mode === "system") return mq && mq.matches ? "dark" : "light";
    return mode === "dark" ? "dark" : "light";
  }
  function apply(mode) {
    var t = resolve(mode);
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0e0e10" : "#ffffff");
    document.dispatchEvent(new CustomEvent("tmn:theme", { detail: { mode: mode, theme: t } }));
  }

  window.TMN_THEME = {
    get: read,
    current: function () { return resolve(read()); },
    set: function (mode) {
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      apply(mode);
    },
    toggle: function () { this.set(this.current() === "dark" ? "light" : "dark"); }
  };

  apply(read());
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (read() === "system") apply("system"); });
  document.addEventListener("DOMContentLoaded", function () { apply(read()); });
})();
