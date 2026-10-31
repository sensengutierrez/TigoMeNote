/* TigoMeNote · components/tigo-login.js — si Tigo (2D, magaan) sa itaas ng sign in card
   Kumakaway pagbukas, kumukurap, sumisilip kapag nagta-type, natutuwa sa "Create account" at pag-submit.
   Mga larawan: assets/img/tigo2d/<frame>.svg (gawa ng tools/make-widget-art.py). Walang galaw kung "reduce motion". */
(function () {
  var card = document.querySelector(".auth-card");
  if (!card) return;
  var FR = ["idle", "blink", "wave", "look", "excited"];
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var box = document.createElement("div");
  box.className = "tl-tigo"; box.setAttribute("aria-hidden", "true");
  box.innerHTML = FR.map(function (f) { return '<img src="assets/img/tigo2d/' + f + '.svg" alt="" data-f="' + f + '" draggable="false">'; }).join("") +
    '<span class="tl-bubble">Hi! 👋</span>';
  card.insertBefore(box, card.firstChild);
  var imgs = {}; box.querySelectorAll("img").forEach(function (i) { imgs[i.dataset.f] = i; });
  var now = "", mood = "idle", t1 = 0, t2 = 0;

  function show(f) { if (f === now) return; if (imgs[now]) imgs[now].classList.remove("on"); imgs[f].classList.add("on"); now = f; }
  function setMood(m, ms) {          // ms: babalik sa idle pagkatapos
    clearTimeout(t2); mood = m; show(m);
    if (ms) t2 = setTimeout(function () { mood = "idle"; show("idle"); }, ms);
  }
  function blink() {
    clearTimeout(t1);
    t1 = setTimeout(function () {
      if (mood === "idle" && !document.hidden) { show("blink"); setTimeout(function () { if (mood === "idle") show("idle"); }, 160); }
      blink();
    }, 2600 + Math.random() * 2600);
  }
  function wave(times) {
    var n = 0; mood = "wave"; setTimeout(function () { box.classList.add("tl-said"); }, 500);
    (function step() {
      if (mood !== "wave") return;
      show(n % 2 ? "idle" : "wave");
      if (++n < times * 2) setTimeout(step, 340); else { mood = "idle"; show("idle"); }
    })();
  }

  show("idle");
  if (still) { box.classList.add("tl-still", "tl-said"); return; }
  setTimeout(function () { var a = document.activeElement; if (!(a && a.matches && a.matches(".auth-card input"))) wave(3); else box.classList.add("tl-said"); }, 350);
  blink();

  document.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches(".auth-card input")) setMood("look", e.target.type === "password" ? 0 : 1800);
  });
  document.addEventListener("focusout", function (e) {
    if (e.target.matches && e.target.matches(".auth-card input")) setTimeout(function () {
      var a = document.activeElement;
      if (mood === "look" && !(a && a.matches && a.matches(".auth-card input"))) setMood("idle");
    }, 0);
  });
  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-mode]");
    if (tab && card.contains(tab)) { setMood("excited", 1400); box.classList.remove("tl-hop"); void box.offsetWidth; box.classList.add("tl-hop"); }
  });
  document.addEventListener("submit", function (e) { if (card.contains(e.target)) setMood("excited", 2200); }, true);
})();
