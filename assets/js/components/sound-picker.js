/* TigoMeNote · components/sound-picker.js — pumili ng sound para sa photo/video (parang TikTok/IG)
     TMN_SOUND_PICK.auto(src, { kind, filter })  → Promise<{ sound|null, list }>  (auto-pick, kung naka-on)
     TMN_SOUND_PICK.open({ src, kind, filter, current, onPick(sound|null) })  → listahan: "For you" + "All sounds"
     TMN_SOUND_PICK.row(el, { src, kind, filter, sound, autoplay, onChange(sound|null) })  → maliit na row: ♪ pangalan · ▶ · Change · ×
     TMN_SOUND_PICK.label(sound)  → "Golden Hour"
   sound = { id, vol (0–1, lakas ng music), orig (0–1, lakas ng sariling tunog ng video) }
   Kailangan: sounds.js, modal.js, icons.js */
(function () {
  var I = function (n, c) { return window.TMN_ICON ? window.TMN_ICON(n, c) : ""; };
  function S() { return window.TMN_SOUNDS; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }
  function autoOn() { try { return localStorage.getItem("tmnAutoSound") !== "0"; } catch (e) { return true; } }
  function setAuto(v) { try { localStorage.setItem("tmnAutoSound", v ? "1" : "0"); } catch (e) {} }
  function label(s) { var t = s && S() && S().get(s.id); return t ? t.name : ""; }
  function make(id, base, kind) { return { id: id, vol: base && base.vol != null ? base.vol : 0.8, orig: kind === "video" ? (base && base.orig != null ? base.orig : 0.4) : undefined }; }

  async function suggestFor(src, o) {
    var f = await S().analyze(src);
    f.kind = o.kind; f.filter = o.filter;
    return S().suggest(f);
  }
  async function auto(src, o) {
    o = o || {};
    if (!S()) return { sound: null, list: [] };
    var list = await suggestFor(src, o);
    return { sound: autoOn() && list[0] ? make(list[0].id, null, o.kind) : null, list: list };
  }

  function open(o) {
    o = o || {};
    if (!S()) return;
    var cur = o.current ? Object.assign({}, o.current) : null;
    var root = document.createElement("div");
    root.className = "sp";
    root.innerHTML =
      '<p class="sp-note small faint">' + I("sparkle", "ic-sm") + "Original TigoMeNote music, made on your device. Free to use, no copyright issues.</p>" +
      '<div class="sp-sec"><h4>For you</h4><div class="sp-list sp-for"><p class="faint small">Matching your photo…</p></div></div>' +
      '<div class="sp-sec sp-local-sec hidden"><h4 class="sp-local-h"></h4><div class="sp-list sp-local"></div></div>' +
      '<div class="sp-sec"><h4>All sounds</h4><div class="sp-list sp-all"></div></div>' +
      '<div class="sp-mix">' +
        '<label class="sp-vol">' + I("music", "ic-sm") + '<span>Music</span><input type="range" min="0" max="100" class="sp-vol-m"></label>' +
        (o.kind === "video" ? '<label class="sp-vol">' + I("volume", "ic-sm") + '<span>Video sound</span><input type="range" min="0" max="100" class="sp-vol-o"></label>' : "") +
        '<label class="sp-auto"><input type="checkbox" class="sp-auto-cb"' + (autoOn() ? " checked" : "") + "> <span>Auto-pick a sound for new photos and videos</span></label>" +
      "</div>";

    function rowHtml(t, top) {
      var on = cur && cur.id === t.id;
      return '<div class="sp-item' + (on ? " on" : "") + '" data-id="' + t.id + '">' +
        '<button type="button" class="sp-play" data-play="' + t.id + '" aria-label="Preview ' + esc(t.name) + '">' + I(S().playing() === t.id ? "pause" : "play", "ic-sm") + "</button>" +
        '<span class="sp-main"><b translate="no">' + esc(t.name) + "</b>" + (top ? ' <span class="sp-best">Best match</span>' : "") +
          '<span class="faint small">' + esc(t.mood) + " · " + t.bpm + " BPM</span></span>" +
        '<button type="button" class="btn btn-sm ' + (on ? "btn-primary" : "btn-ghost") + '" data-use="' + t.id + '">' + (on ? I("check", "ic-sm") + "Using" : "Use") + "</button></div>";
    }
    var forYou = [];
    function paint() {
      root.querySelector(".sp-for").innerHTML = forYou.length ? forYou.slice(0, 4).map(function (t, i) { return rowHtml(t, i === 0); }).join("") : '<p class="faint small">Matching your photo…</p>';
      var shown = forYou.slice(0, 4).map(function (t) { return t.id; });
      // Local sounds (Pilipinas / Gulf) ayon sa device; kung wala, makikita pa rin sa All sounds
      var loc = S().local ? S().local().filter(function (t) { return shown.indexOf(t.id) < 0; }) : [];
      var regs = S().region ? S().region() : [];
      root.querySelector(".sp-local-sec").classList.toggle("hidden", !loc.length);
      root.querySelector(".sp-local-h").textContent = "Local · " + regs.map(function (r) { return S().REGIONS[r]; }).join(" & ");
      root.querySelector(".sp-local").innerHTML = loc.map(function (t) { return rowHtml(t); }).join("");
      shown = shown.concat(loc.map(function (t) { return t.id; }));
      root.querySelector(".sp-all").innerHTML = S().list.filter(function (t) { return shown.indexOf(t.id) < 0; }).map(function (t) { return rowHtml(t); }).join("");
      var vm = root.querySelector(".sp-vol-m"), vo = root.querySelector(".sp-vol-o");
      vm.value = String(Math.round((cur ? cur.vol : 0.8) * 100)); vm.disabled = !cur;
      if (vo) { vo.value = String(Math.round((cur && cur.orig != null ? cur.orig : 1) * 100)); vo.disabled = !cur; }
      none.classList.toggle("btn-primary", !cur); none.classList.toggle("btn-ghost", !!cur);
    }
    suggestFor(o.src, o).then(function (l) { forYou = l; paint(); }).catch(function () { forYou = S().list.slice(); paint(); });

    root.addEventListener("click", function (e) {
      var p = e.target.closest("[data-play]"), u = e.target.closest("[data-use]");
      if (p) { if (S().playing() === p.dataset.play) S().stop(); else S().play(p.dataset.play, { vol: cur && cur.id === p.dataset.play ? cur.vol : 0.8 }); paint(); }
      if (u) { cur = make(u.dataset.use, cur, o.kind); if (S().playing() !== cur.id) S().play(cur.id, { vol: cur.vol }); paint(); }
    });
    root.addEventListener("input", function (e) {
      if (!cur) return;
      if (e.target.classList.contains("sp-vol-m")) { cur.vol = e.target.value / 100; S().setVolume(cur.vol); }
      if (e.target.classList.contains("sp-vol-o")) cur.orig = e.target.value / 100;
    });
    root.querySelector(".sp-auto-cb").addEventListener("change", function () { setAuto(this.checked); });

    var picked = false;
    var m = window.TMN_MODAL.open({
      title: "Sounds", size: "md", cls: "modal-sounds", body: root,
      actions: [
        { label: I("x", "ic-sm") + "No sound", cls: "btn-ghost sp-none", onClick: function () { picked = true; m.close(); if (o.onPick) o.onPick(null); } },
        { label: "Done", cls: "btn-primary", onClick: function () { picked = true; m.close(); if (o.onPick) o.onPick(cur); } }
      ],
      onClose: function () { if (!picked) S().stop(); }
    });
    var none = m.el.querySelector(".sp-none");
    paint();
    return m;
  }

  // Maliit na row (composer at review)
  function row(el, o) {
    o = o || {};
    if (!S()) { el.innerHTML = ""; return { get: function () { return null; }, destroy: function () {} }; }
    var sound = o.sound || null;
    function paint() {
      var t = sound && S().get(sound.id), playing = t && S().playing() === t.id;
      el.classList.add("sp-row"); el.classList.toggle("has", !!t);
      el.innerHTML = t
        ? '<button type="button" class="sp-row-play" data-r="play" aria-label="' + (playing ? "Pause" : "Play") + '">' + I(playing ? "pause" : "play", "ic-sm") + "</button>" +
          '<span class="sp-row-main"><span class="sp-eq' + (playing ? " on" : "") + '" aria-hidden="true"><i></i><i></i><i></i></span><b translate="no">' + esc(t.name) + '</b><span class="faint small">' + esc(t.mood) + "</span></span>" +
          '<button type="button" class="btn btn-ghost btn-sm" data-r="change">' + I("music", "ic-sm") + "Change</button>" +
          '<button type="button" class="icon-btn" data-r="remove" aria-label="Remove sound">' + I("x", "ic-sm") + "</button>"
        : '<button type="button" class="btn btn-ghost btn-sm sp-row-add" data-r="change">' + I("music", "ic-sm") + "Add sound</button>" +
          '<span class="faint small">Free music that fits your photo</span>';
    }
    function set(s) { sound = s; paint(); if (o.onChange) o.onChange(sound); }
    function onSound() { paint(); }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]"); if (!b) return;
      var a = b.dataset.r;
      if (a === "play") { if (S().playing() === sound.id) S().stop(); else S().play(sound.id, { vol: sound.vol }); }
      if (a === "remove") { S().stop(); set(null); }
      if (a === "change") open({ src: o.src, kind: o.kind, filter: o.filter, current: sound, onPick: function (s) { set(s); if (s && S().playing() !== s.id) S().play(s.id, { vol: s.vol }); } });
    });
    document.addEventListener("tmn:sound", onSound);
    paint();
    if (sound && o.autoplay) S().play(sound.id, { vol: sound.vol });
    return {
      get: function () { return sound; },
      set: set,
      destroy: function () { document.removeEventListener("tmn:sound", onSound); S().stop(); }
    };
  }

  window.TMN_SOUND_PICK = { auto: auto, open: open, row: row, label: label, autoOn: autoOn };
})();
