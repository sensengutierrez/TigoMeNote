/* TigoMeNote · components/music-player.js — "My music" sa sariling profile: playlist galing sa phone/computer
     TMN_MUSIC.mount(el)
   Ikaw lang ang nakakarinig. Ang mga kanta ay nasa device mo lang (music-store.js), hindi ina-upload.
   May Play/Pause, Next/Previous, Shuffle, Repeat, seek, at controls sa lock screen / notification ng phone (Media Session).
   Sa website: tuloy-tuloy kahit i-minimize, pero humihinto kapag lumipat ng page. Sa TigoMeNote app (APK, susunod):
   tuloy-tuloy kahit saang page o naka-lock ang phone.
   Kailangan: music-store.js, modal.js */
(function () {
  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI.esc(s); }
  function t2(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  var PREF = "tmnMusicPrefs";

  function mount(el) {
    var DB = window.TMN_MUSICDB, UI = window.TMN_UI;
    var audio = new Audio(); audio.preload = "auto";
    var tracks = [], cur = -1, url = null, order = [];
    var pref = { shuffle: false, repeat: "all", vol: 1 };
    try { pref = Object.assign(pref, JSON.parse(localStorage.getItem(PREF) || "{}")); } catch (e) {}
    audio.volume = pref.vol;
    function savePref() { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) {} }

    el.innerHTML =
      '<div class="mu-head"><h3>' + I("music", "ic-sm") + 'My music</h3>' +
        '<label class="btn btn-ghost btn-sm">' + I("plus", "ic-sm") + 'Add songs<input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac" multiple class="sr-only mu-add"></label></div>' +
      '<p class="faint small mu-note">Only you can hear this. Songs stay on this device and are not uploaded.</p>' +
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
      '<ol class="mu-list"></ol>' +
      '<p class="faint small mu-empty">Add MP3 or other songs from your phone or computer to make your playlist.</p>' +
      '<p class="faint small mu-tip">' + I("info", "ic-sm") + " Keeps playing when you minimize. On the website it stops if you open another page; in the TigoMeNote app it will keep playing everywhere.</p>";
    var $ = function (s) { return el.querySelector(s); };
    var list = $(".mu-list"), bar = $(".mu-bar");

    function paintList() {
      $(".mu-empty").classList.toggle("hidden", !!tracks.length);
      list.innerHTML = tracks.map(function (t, i) {
        return '<li class="mu-item' + (i === cur ? " on" : "") + '" data-i="' + i + '">' +
          '<button type="button" class="mu-pick" data-a="play">' + (i === cur && !audio.paused ? '<span class="mu-eq"><i></i><i></i><i></i></span>' : '<span class="mu-n" translate="no">' + (i + 1) + "</span>") +
          '<span class="mu-txt"><b>' + esc(t.name) + "</b>" + (t.artist ? '<span class="faint small">' + esc(t.artist) + "</span>" : "") + "</span></button>" +
          '<span class="faint small mu-len" translate="no">' + (t.duration ? t2(t.duration) : "") + "</span>" +
          '<button type="button" class="icon-btn mu-more" data-a="more" aria-label="More">' + I("more", "ic-sm") + "</button></li>";
      }).join("");
    }
    function paintNow() {
      var t = tracks[cur];
      $(".mu-now").classList.toggle("hidden", !t);
      if (!t) return;
      $(".mu-title").textContent = t.name; $(".mu-artist").textContent = t.artist || "";
      $(".mu-play").innerHTML = I(audio.paused ? "play" : "pause"); $(".mu-play").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
      $(".mu-shuffle").classList.toggle("on", pref.shuffle);
      var rp = $(".mu-repeat"); rp.classList.toggle("on", pref.repeat !== "off"); rp.querySelector("small").textContent = pref.repeat === "one" ? "1" : "";
    }
    function paint() { paintList(); paintNow(); }

    async function load() { tracks = await DB.list(); if (cur >= tracks.length) cur = -1; paint(); }
    async function play(i) {
      if (!tracks[i]) return;
      cur = i;
      var b = await DB.blob(tracks[i].id);
      if (!b) { UI.toast("This song is missing on this device."); return; }
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(b);
      audio.src = url;
      try { await audio.play(); } catch (e) { /* kailangan ng tap muna */ }
      session(); paint();
    }
    function nextIndex(dir) {
      if (!tracks.length) return -1;
      if (pref.shuffle && dir > 0) { if (tracks.length === 1) return 0; var r; do { r = Math.floor(Math.random() * tracks.length); } while (r === cur); return r; }
      var n = cur + dir;
      if (n >= tracks.length) return pref.repeat === "all" ? 0 : -1;
      if (n < 0) return pref.repeat === "all" ? tracks.length - 1 : 0;
      return n;
    }
    function next() { var n = nextIndex(1); if (n >= 0) play(n); else { audio.pause(); paint(); } }
    function prev() { if (audio.currentTime > 3) { audio.currentTime = 0; return; } var n = nextIndex(-1); if (n >= 0) play(n); }
    function toggle() { if (cur < 0) return play(0); if (audio.paused) audio.play().catch(function () {}); else audio.pause(); }

    audio.addEventListener("ended", function () { if (pref.repeat === "one") { audio.currentTime = 0; audio.play(); } else next(); });
    audio.addEventListener("play", paint); audio.addEventListener("pause", paint);
    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      if (!bar.matches(":active")) bar.value = Math.round(audio.currentTime / audio.duration * 1000);
      $(".mu-cur").textContent = t2(audio.currentTime); $(".mu-dur").textContent = t2(audio.duration);
      if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) {
        try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: 1 }); } catch (e) {}
      }
    });
    bar.addEventListener("input", function () { if (audio.duration) audio.currentTime = bar.value / 1000 * audio.duration; });

    // Lock screen / notification controls ng phone
    function session() {
      if (!("mediaSession" in navigator) || !tracks[cur]) return;
      var t = tracks[cur];
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t.name, artist: t.artist || "My music", album: "TigoMeNote", artwork: [{ src: (window.TMN_CONFIG.root || "/") + "assets/img/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] });
        navigator.mediaSession.setActionHandler("play", function () { audio.play(); });
        navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); });
        navigator.mediaSession.setActionHandler("previoustrack", prev);
        navigator.mediaSession.setActionHandler("nexttrack", next);
        navigator.mediaSession.setActionHandler("seekto", function (d) { if (d.seekTime != null) audio.currentTime = d.seekTime; });
      } catch (e) {}
    }

    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("mu-play")) return toggle();
      if (b.classList.contains("mu-next")) return next();
      if (b.classList.contains("mu-prev")) return prev();
      if (b.classList.contains("mu-shuffle")) { pref.shuffle = !pref.shuffle; savePref(); paintNow(); return; }
      if (b.classList.contains("mu-repeat")) { pref.repeat = pref.repeat === "all" ? "one" : pref.repeat === "one" ? "off" : "all"; savePref(); paintNow(); UI.toast(pref.repeat === "all" ? "Repeat playlist" : pref.repeat === "one" ? "Repeat this song" : "Repeat off"); return; }
      var li = b.closest(".mu-item"); if (!li) return;
      var i = Number(li.dataset.i);
      if (b.dataset.a === "play") { if (i === cur) toggle(); else play(i); }
      if (b.dataset.a === "more") menu(i);
    });
    function menu(i) {
      var t = tracks[i], body = document.createElement("div");
      body.className = "mu-menu";
      body.innerHTML = '<button type="button" class="btn btn-ghost" data-m="up"' + (i === 0 ? " disabled" : "") + ">Move up</button>" +
        '<button type="button" class="btn btn-ghost" data-m="down"' + (i === tracks.length - 1 ? " disabled" : "") + ">Move down</button>" +
        '<button type="button" class="btn btn-ghost" data-m="rename">' + I("edit", "ic-sm") + "Rename</button>" +
        '<button type="button" class="btn btn-danger" data-m="del">' + I("trash", "ic-sm") + "Remove from playlist</button>";
      var m = TMN_MODAL.open({ title: t.name, size: "sm", cls: "modal-sheet", body: body });
      body.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-m]"); if (!b) return;
        var playingId = tracks[cur] && tracks[cur].id;
        m.close();
        if (b.dataset.m === "up" || b.dataset.m === "down") await DB.move(t.id, b.dataset.m === "up" ? -1 : 1);
        if (b.dataset.m === "rename") { var nm = await TMN_MODAL.prompt("Song name", { value: t.name, okText: "Save" }); if (nm) await DB.rename(t.id, nm); }
        if (b.dataset.m === "del") {
          if (!(await TMN_MODAL.confirm("Remove “" + t.name + "” from your playlist? It will be deleted from this app on this device.", { okText: "Remove", danger: true }))) return;
          if (playingId === t.id) { audio.pause(); audio.removeAttribute("src"); playingId = null; }
          await DB.remove(t.id);
        }
        await load();
        cur = playingId ? tracks.findIndex(function (x) { return x.id === playingId; }) : -1;
        paint();
      });
    }
    $(".mu-add").addEventListener("change", async function () {
      var files = [].slice.call(this.files || []); this.value = ""; if (!files.length) return;
      UI.toast("Adding " + files.length + " song(s)…", 1500);
      try {
        var added = await DB.add(files);
        if (added.skipped) UI.toast(added.skipped + " file(s) skipped (not audio, or larger than 60 MB).", 3500);
        else UI.toast(added.length + " song(s) added ✓");
        await load();
      } catch (e) { UI.toast(e.message || "Couldn't add the songs."); }
    });
    window.addEventListener("pagehide", function () { if (url) URL.revokeObjectURL(url); });
    load().catch(function () { $(".mu-empty").textContent = "Music isn't available in this browser."; });
    return { play: play, toggle: toggle, audio: audio };
  }

  window.TMN_MUSIC = { mount: mount };
})();
