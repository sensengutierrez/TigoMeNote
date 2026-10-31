/* TigoMeNote · components/music-native.js — "My music" sa APK (main at Messenger): native player
     TMN_MUSIC_NATIVE.available() → true kung nasa APK
     TMN_MUSIC_NATIVE.mount(el)   → pareho ng itsura ng music-player.js, pero ang tugtog ay nasa Android (TmnNative):
   • tuloy-tuloy kahit lumipat ng page, i-minimize, o naka-lock ang phone
   • notification + controls sa lock screen (MediaSession) at widget sa home screen (Prev / Play-Pause / Next)
   • ang mga kanta ay nasa phone (Music/TigoMeNote), hindi ina-upload; PAREHO ang playlist ng TigoMeNote at Chat
   Kailangan: modal.js */
(function () {
  var Cap = window.Capacitor;
  function plug() {
    if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return null;
    var p = (Cap.Plugins && Cap.Plugins.TmnNative) || (Cap.registerPlugin && Cap.registerPlugin("TmnNative"));
    return p || null;
  }
  function available() { return !!plug(); }
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function t2(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  function mount(el) {
    var N = plug(), UI = window.TMN_UI;
    var tracks = [], st = { id: "", playing: false, active: false, pos: 0, dur: 0, shuffle: false, repeat: "all" };
    var timer = 0, seeking = false, access = true;

    el.innerHTML =
      '<div class="mu-head"><h3>' + I("music", "ic-sm") + 'My music</h3>' +
        '<button type="button" class="btn btn-ghost btn-sm mu-addbtn">' + I("plus", "ic-sm") + 'Add songs</button></div>' +
      '<p class="faint small mu-note">Only you can hear this. Songs are saved on your phone (Music › TigoMeNote) and are not uploaded. TigoMeNote and Chat share the same playlist.</p>' +
      '<div class="mu-now hidden">' +
        '<div class="mu-now-info"><b class="mu-title"></b><span class="faint small mu-artist"></span></div>' +
        '<div class="mu-seek"><span class="faint small mu-cur" translate="no">0:00</span><input type="range" class="mu-bar" min="0" max="1000" value="0" aria-label="Seek"><span class="faint small mu-dur" translate="no">0:00</span></div>' +
        '<div class="mu-ctrls">' +
          '<button type="button" class="icon-btn mu-shuffle" aria-label="Shuffle" title="Shuffle">⤮</button>' +
          '<button type="button" class="icon-btn mu-prev" aria-label="Previous">' + I("chevronL") + "</button>" +
          '<button type="button" class="mu-play" aria-label="Play">' + I("play") + "</button>" +
          '<button type="button" class="icon-btn mu-next" aria-label="Next">' + I("chevronR") + "</button>" +
          '<button type="button" class="icon-btn mu-repeat" aria-label="Repeat" title="Repeat">↻<small></small></button>' +
        "</div></div>" +
      '<button type="button" class="btn btn-ghost btn-sm mu-access hidden">Show songs added in my other TigoMeNote app</button>' +
      '<ol class="mu-list"></ol>' +
      '<p class="faint small mu-empty">Add MP3 or other songs from your phone to make your playlist.</p>' +
      '<p class="faint small mu-tip">' + I("info", "ic-sm") + " Keeps playing on every page, when you minimize and when the phone is locked. Long-press your home screen → Widgets → Tigo music to add the player widget.</p>";
    var $ = function (s) { return el.querySelector(s); };
    var list = $(".mu-list"), bar = $(".mu-bar");

    function curIdx() { return tracks.findIndex(function (t) { return t.id === st.id; }); }
    function paintList() {
      $(".mu-empty").classList.toggle("hidden", !!tracks.length);
      var ci = curIdx();
      list.innerHTML = tracks.map(function (t, i) {
        return '<li class="mu-item' + (i === ci ? " on" : "") + '" data-i="' + i + '">' +
          '<button type="button" class="mu-pick" data-a="play">' + (i === ci && st.playing ? '<span class="mu-eq"><i></i><i></i><i></i></span>' : '<span class="mu-n" translate="no">' + (i + 1) + "</span>") +
          '<span class="mu-txt"><b>' + esc(t.name) + "</b>" + (t.artist ? '<span class="faint small">' + esc(t.artist) + "</span>" : "") + "</span></button>" +
          '<span class="faint small mu-len" translate="no">' + (t.dur ? t2(t.dur) : "") + "</span>" +
          '<button type="button" class="icon-btn mu-more" data-a="more" aria-label="More">' + I("more", "ic-sm") + "</button></li>";
      }).join("");
    }
    function paintNow() {
      var ci = curIdx(), t = tracks[ci];
      $(".mu-now").classList.toggle("hidden", !t);
      if (!t) return;
      $(".mu-title").textContent = t.name; $(".mu-artist").textContent = t.artist || "";
      $(".mu-play").innerHTML = I(st.playing ? "pause" : "play"); $(".mu-play").setAttribute("aria-label", st.playing ? "Pause" : "Play");
      $(".mu-shuffle").classList.toggle("on", !!st.shuffle);
      var rp = $(".mu-repeat"); rp.classList.toggle("on", st.repeat !== "off"); rp.querySelector("small").textContent = st.repeat === "one" ? "1" : "";
    }
    function paintTime() {
      if (!seeking && st.dur) bar.value = Math.round(st.pos / st.dur * 1000);
      $(".mu-cur").textContent = t2(st.pos / 1000); $(".mu-dur").textContent = t2(st.dur / 1000);
    }
    function paint() { paintList(); paintNow(); paintTime(); }

    async function refresh() {
      try { var r = await N.musicList(); tracks = r.tracks || []; st = r.state || st; access = r.access !== false; } catch (e) {}
      $(".mu-access").classList.toggle("hidden", access);
      paint();
    }
    async function poll() {
      if (!document.body.contains(el)) { clearInterval(timer); return; }
      if (document.hidden) return;
      try {
        var s = await N.musicState(), changed = s.id !== st.id || s.playing !== st.playing || s.shuffle !== st.shuffle || s.repeat !== st.repeat;
        st = s;
        if (changed) paint(); else paintTime();
      } catch (e) {}
    }
    timer = setInterval(poll, 700);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });

    bar.addEventListener("input", function () { seeking = true; });
    bar.addEventListener("change", function () { seeking = false; if (st.dur) N.musicSeek({ ms: Math.round(bar.value / 1000 * st.dur) }).then(poll); });

    async function act(fn) { try { await fn(); } catch (e) {} await poll(); await refresh(); }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("mu-addbtn")) return add();
      if (b.classList.contains("mu-access")) { N.musicRequest().then(refresh, refresh); return; }
      if (b.classList.contains("mu-play")) return act(function () { return N.musicToggle(); });
      if (b.classList.contains("mu-next")) return act(function () { return N.musicNext(); });
      if (b.classList.contains("mu-prev")) return act(function () { return N.musicPrev(); });
      if (b.classList.contains("mu-shuffle")) return act(function () { return N.musicSet({ shuffle: !st.shuffle }); });
      if (b.classList.contains("mu-repeat")) {
        var rp = st.repeat === "all" ? "one" : st.repeat === "one" ? "off" : "all";
        UI.toast(rp === "all" ? "Repeat playlist" : rp === "one" ? "Repeat this song" : "Repeat off");
        return act(function () { return N.musicSet({ repeat: rp }); });
      }
      var li = b.closest(".mu-item"); if (!li) return;
      var t = tracks[Number(li.dataset.i)]; if (!t) return;
      if (b.dataset.a === "play") return act(function () { return t.id === st.id ? N.musicToggle() : N.musicPlay({ id: t.id }); });
      if (b.dataset.a === "more") menu(t, Number(li.dataset.i));
    });

    function menu(t, i) {
      var body = document.createElement("div"); body.className = "mu-menu";
      body.innerHTML = '<button type="button" class="btn btn-ghost" data-m="up"' + (i === 0 ? " disabled" : "") + ">Move up</button>" +
        '<button type="button" class="btn btn-ghost" data-m="down"' + (i === tracks.length - 1 ? " disabled" : "") + ">Move down</button>" +
        '<button type="button" class="btn btn-ghost" data-m="rename">' + I("edit", "ic-sm") + "Rename</button>" +
        '<button type="button" class="btn btn-danger" data-m="del">' + I("trash", "ic-sm") + "Remove from playlist</button>";
      var m = TMN_MODAL.open({ title: t.name, size: "sm", cls: "modal-sheet", body: body });
      body.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-m]"); if (!b) return;
        m.close();
        if (b.dataset.m === "up" || b.dataset.m === "down") await N.musicMove({ id: t.id, dir: b.dataset.m === "up" ? -1 : 1 });
        if (b.dataset.m === "rename") { var nm = await TMN_MODAL.prompt("Song name", { value: t.name, okText: "Save" }); if (nm) await N.musicRename({ id: t.id, name: nm }); }
        if (b.dataset.m === "del") {
          if (!(await TMN_MODAL.confirm("Remove “" + t.name + "” from your playlist? It will be deleted from this app on this phone.", { okText: "Remove", danger: true }))) return;
          await N.musicRemove({ id: t.id });
        }
        await refresh();
      });
    }

    async function add() {
      // Android 13+: hingi muna ng permission para sa notification ng player (isang beses lang)
      try { if (window.TMN_APP && TMN_APP.pushToken) TMN_APP.pushToken({ ask: true }); } catch (e) {}
      try {
        var r = await N.musicPick();
        if (r && r.added) UI.toast(r.added + " song(s) added ✓" + (r.skipped ? " · " + r.skipped + " skipped" : ""));
        else if (r && r.skipped) UI.toast(r.skipped + " file(s) couldn't be added.");
      } catch (e) { UI.toast("Couldn't add the songs."); }
      await refresh();
    }

    refresh();
    return { toggle: function () { return N.musicToggle(); }, refresh: refresh };
  }

  window.TMN_MUSIC_NATIVE = { available: available, mount: mount };
})();
