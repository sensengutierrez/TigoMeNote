/* TigoMeNote · pages/sound-maker.js (app/sound-maker.html) — Sound Maker page: editor + listahan ng sariling tunog
   Editor: components/sound-maker.js (TMN_SOUND_MAKER). Listahan: sounds-fast "mine" (▶ tugtog · tap = i-edit).
   ?id=u-xxxxxxxx sa URL = buksan agad ang tunog na iyon. */
(function () {
  var UI = window.TMN_UI, $ = function (id) { return document.getElementById(id); };
  var list = [], ed = null, cur = null;
  function esc(s) { return UI ? UI.esc(s) : String(s); }

  function edit(item) {
    if (ed) ed.destroy();
    cur = item ? item.id : null;
    ed = TMN_SOUND_MAKER.mount($("smpEditor"), {
      sound: item ? { id: item.id, recipe: item.recipe } : null,
      onSaved: function (s) {
        var x = { id: s.id, recipe: s.recipe };
        list = [x].concat(list.filter(function (y) { return y.id !== s.id; }));
        cur = s.id; paint();
        try { history.replaceState(null, "", "?id=" + s.id); } catch (e) {}
      },
      onDeleted: function (id) { list = list.filter(function (y) { return y.id !== id; }); paint(); edit(null); try { history.replaceState(null, "", location.pathname); } catch (e) {} },
    });
    paint();
  }
  function paint() {
    var S = window.TMN_SOUNDS;
    $("smpList").innerHTML = list.length ? list.map(function (x) {
      var r = x.recipe || {}, on = S && S.playing() === x.id;
      return '<div class="smp-item' + (x.id === cur ? " on" : "") + '" data-id="' + x.id + '">' +
        '<button type="button" class="sp-play" data-play="' + x.id + '" aria-label="Play ' + esc(r.name || "") + '">' + (window.TMN_ICON ? TMN_ICON(on ? "pause" : "play", "ic-sm") : on ? "⏸" : "▶") + "</button>" +
        '<span><b translate="no">' + esc(r.name || "My sound") + '</b><span class="faint small">' + (r.bpm || "") + " BPM · " + esc(r.scale || "") + "</span></span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + x.id + '">Edit</button></div>';
    }).join("") : '<p class="faint small">No sounds yet. Make one on the left — tap the squares to build a beat!</p>';
  }
  $("smpList").addEventListener("click", function (e) {
    var p = e.target.closest("[data-play]"), d = e.target.closest("[data-edit]"), S = window.TMN_SOUNDS;
    if (p) { if (ed) ed.stop(); if (S.playing() === p.dataset.play) S.stop(); else S.play(p.dataset.play, { vol: 0.85 }); paint(); return; }
    if (d) { S.stop(); edit(list.filter(function (x) { return x.id === d.dataset.edit; })[0]); try { history.replaceState(null, "", "?id=" + d.dataset.edit); } catch (er) {} if (matchMedia("(max-width: 999px)").matches) $("smpEditor").scrollIntoView({ behavior: "smooth" }); }
  });
  document.addEventListener("tmn:sound", paint);
  $("smpNew").addEventListener("click", function () { if (window.TMN_SOUNDS) TMN_SOUNDS.stop(); edit(null); try { history.replaceState(null, "", location.pathname); } catch (e) {} });

  edit(null);
  TMN_SOUND_MAKER.mine(true).then(function (l) {
    list = l;
    var want = new URLSearchParams(location.search).get("id"), hit = want && list.filter(function (x) { return x.id === want; })[0];
    if (hit) edit(hit); else paint();
  });
})();
