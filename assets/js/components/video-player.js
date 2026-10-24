/* TigoMeNote · components/video-player.js — play mode ng video (parang Facebook)
     TMN_PLAYER.open({ url, time, volume, onClose(time) })
   Buong-screen na player na may controls. Sa itaas: ✕ sara · ▭ minimize · ⛶ full screen (pahiga kung kaya ng phone).
   Minimize = maliit na lumulutang na player sa sulok; tuloy ang video habang nag-i-scroll ka. Puwedeng i-drag.
   Tap sa maliit na player = bumalik sa malaki. Back ng phone/APK o Esc = sara (o labas sa full screen). */
(function () {
  var cur = null;
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }

  function open(o) {
    o = o || {};
    if (!o.url) return null;
    if (cur) cur.close(true);
    document.querySelectorAll("video").forEach(function (v) { if (!v.paused) v.pause(); });
    var el = document.createElement("div");
    el.className = "vp";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Video player");
    el.innerHTML =
      '<div class="vp-top">' +
        '<button type="button" class="vp-btn" data-vp="close" aria-label="Close">' + I("x") + "</button>" +
        '<span class="vp-gap"></span>' +
        '<button type="button" class="vp-btn" data-vp="mini" aria-label="Minimize">' + I("pip") + "</button>" +
        '<button type="button" class="vp-btn" data-vp="full" aria-label="Full screen">' + I("expand") + "</button>" +
      "</div>" +
      '<div class="vp-stage"><video src="' + esc(o.url) + '" controls playsinline autoplay preload="auto"></video></div>' +
      '<div class="vp-mini-ui"><button type="button" class="vp-btn" data-vp="max" aria-label="Open player">' + I("expand") + '</button>' +
        '<button type="button" class="vp-btn" data-vp="close" aria-label="Close">' + I("x") + "</button></div>";
    document.body.appendChild(el);
    var v = el.querySelector("video");
    if (o.volume != null) v.volume = o.volume;
    v.addEventListener("loadedmetadata", function () {
      if (o.time) try { v.currentTime = o.time; } catch (e) {}
      el.style.setProperty("--vp-ar", (v.videoWidth / v.videoHeight) || 16 / 9);
    }, { once: true });
    v.play().catch(function () { v.muted = true; v.play().catch(function () {}); });

    var mini = false, pushed = false;
    function lock(on) { document.documentElement.classList.toggle("vp-open", on); }
    function setMini(on) {
      mini = on; el.classList.toggle("mini", on); lock(!on);
      el.style.transform = "";
      if (on) { pos = { x: 0, y: 0 }; if (pushed) { pushed = false; window.removeEventListener("popstate", onPop); try { history.back(); } catch (e) {} } }
      else push();
    }
    function push() { if (pushed) return; try { history.pushState({ tmnPlayer: 1 }, ""); pushed = true; window.addEventListener("popstate", onPop); } catch (e) {} }
    function onPop() { pushed = false; window.removeEventListener("popstate", onPop); close(true); }
    async function full() {
      try {
        if (document.fullscreenElement) { await document.exitFullscreen(); return; }
        var t = el.requestFullscreen ? el : v;
        if (t.requestFullscreen) await t.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
        if (screen.orientation && screen.orientation.lock && v.videoWidth > v.videoHeight) await screen.orientation.lock("landscape").catch(function () {});
      } catch (e) {}
    }
    function fsChange() {
      var on = document.fullscreenElement === el;
      el.classList.toggle("fs", on);
      var b = el.querySelector('[data-vp="full"]'); if (b) b.innerHTML = I(on ? "shrink" : "expand");
      if (!on && screen.orientation && screen.orientation.unlock) try { screen.orientation.unlock(); } catch (e) {}
    }
    document.addEventListener("fullscreenchange", fsChange);

    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-vp]");
      if (b) {
        var a = b.dataset.vp;
        if (a === "close") close();
        else if (a === "mini") { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); setMini(true); }
        else if (a === "max") setMini(false);
        else if (a === "full") full();
        return;
      }
      if (mini && !moved) setMini(false); // tap sa maliit na player = palakihin
    });
    function key(e) {
      if (e.key !== "Escape" || mini || document.fullscreenElement) return;
      e.stopPropagation(); close();
    }
    document.addEventListener("keydown", key, true);

    // drag ng maliit na player
    var pos = { x: 0, y: 0 }, drag = null, moved = false;
    el.addEventListener("pointerdown", function (e) {
      if (!mini || e.target.closest("[data-vp]")) return;
      drag = { sx: e.clientX - pos.x, sy: e.clientY - pos.y }; moved = false;
      try { el.setPointerCapture(e.pointerId); } catch (er) {}
    });
    el.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var nx = e.clientX - drag.sx, ny = e.clientY - drag.sy;
      if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 3) moved = true;
      pos = { x: nx, y: ny }; el.style.transform = "translate(" + nx + "px," + ny + "px)";
    });
    el.addEventListener("pointerup", function () {
      if (!drag) return; drag = null;
      // dikit sa pinakamalapit na gilid (kaliwa o kanan) at huwag lumabas sa screen
      var r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      var dx = r.left + r.width / 2 < W / 2 ? 12 - r.left : W - 12 - r.right;
      var dy = r.top < 70 ? 70 - r.top : r.bottom > H - 12 ? H - 12 - r.bottom : 0;
      pos = { x: pos.x + dx, y: pos.y + dy }; el.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
      setTimeout(function () { moved = false; }, 0);
    });

    function close(silent) {
      if (!el.isConnected) return;
      var t = v.currentTime || 0;
      if (document.fullscreenElement === el) document.exitFullscreen().catch(function () {});
      document.removeEventListener("fullscreenchange", fsChange);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("popstate", onPop);
      v.pause(); v.removeAttribute("src"); v.load();
      el.remove(); lock(false); cur = null;
      if (pushed && !silent) { pushed = false; try { history.back(); } catch (e) {} }
      if (o.onClose) o.onClose(t);
    }
    lock(true); push();
    setTimeout(function () { var b = el.querySelector('[data-vp="close"]'); if (b) b.focus(); }, 0);
    cur = { close: close, el: el, video: v, minimize: function () { setMini(true); }, maximize: function () { setMini(false); } };
    return cur;
  }

  window.TMN_PLAYER = { open: open, close: function () { if (cur) cur.close(); }, current: function () { return cur; } };
})();
