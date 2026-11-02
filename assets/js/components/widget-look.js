/* TigoMeNote · components/widget-look.js — Settings → Appearance → "Home screen widgets" (APK lang)
     Gaano ka-solid ang background ng widgets sa home screen (Music at Messages): 0% = see-through, 100% = buo.
     Mga mabilis na pili: Solid / Glass / Clear + slider. Agad na nag-a-update ang widget (walang "Save").
   Native: window.TMNWidget.look() / setLook(0–100) (apk/patch-android.py → MessagesWidget.bgAlpha). */
(function () {
  var W = window.TMNWidget;
  var PRESETS = [["Solid", 100], ["Glass", 45], ["Clear", 0]];
  function mount() {
    var el = document.getElementById("widgetLook");
    if (!el || !W || !W.setLook) return;
    var cur = 100; try { cur = Number(W.look()); if (!isFinite(cur)) cur = 100; } catch (e) {}
    el.hidden = false;
    el.innerHTML = '<p class="set-group">Home screen widgets <span class="set-val wl-v"></span></p>' +
      '<div class="set-card wl">' +
        '<div class="wl-pv" aria-hidden="true"><div class="wl-box"><b>12:44</b><span>34° Cloudy</span></div></div>' +
        '<div class="wl-chips" role="radiogroup" aria-label="Widget background">' + PRESETS.map(function (p) {
          return '<button type="button" class="chip" role="radio" data-v="' + p[1] + '">' + p[0] + "</button>"; }).join("") + "</div>" +
        '<label class="lk-slider"><span>Background <b class="wl-n"></b></span><input type="range" min="0" max="100" step="5" class="wl-r" aria-label="Widget background"></label>' +
        '<p class="faint small wl-tip">Applies to the Music and Messages widgets. Lower = see-through, so your wallpaper shows.</p>' +
      "</div>";
    var r = el.querySelector(".wl-r"), t = null;
    function paint(v) {
      r.value = v;
      el.querySelector(".wl-n").textContent = v + "%";
      el.querySelector(".wl-v").textContent = v >= 100 ? "Solid" : v <= 0 ? "Clear" : v + "%";
      el.querySelector(".wl-box").style.setProperty("--wl-a", v / 100);
      el.querySelectorAll(".wl-chips [data-v]").forEach(function (b) { b.setAttribute("aria-checked", String(Number(b.dataset.v) === v)); b.classList.toggle("on", Number(b.dataset.v) === v); });
    }
    function save(v) { clearTimeout(t); t = setTimeout(function () { try { W.setLook(v); } catch (e) {} }, 200); }
    r.addEventListener("input", function () { var v = Number(r.value); paint(v); save(v); });
    el.querySelector(".wl-chips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return;
      var v = Number(b.dataset.v); paint(v); save(v);
    });
    paint(Math.max(0, Math.min(100, Math.round(cur))));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
