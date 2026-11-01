/* TigoMeNote · components/chat-theme.js — theme at wallpaper ng isang chat (pareho sa lahat ng nasa chat)
     TMN_CHAT_THEME.apply(root, chat)        → ilapat sa .ch (data-ctheme + wallpaper + bubble); chat = { theme, wallpaper: { key, url } | null, bubble: { alpha, gloss } }
     TMN_CHAT_THEME.picker(chatId, chat, onDone) → sheet: pumili ng theme, magpalit o mag-alis ng wallpaper
   Bubble: gaano kalinaw (alpha 15–100, para kita ang wallpaper) at glossy — pareho sa lahat; messages-fast "bubble".
   Server: messages-fast (theme, wallpaper, bubble, upload kind "wallpaper"). Ang listahan ng theme ay kapareho ng THEMES sa backend.
   Ang kulay ng bawat theme ay nasa assets/css/pages/messages.css (.ch[data-ctheme="…"]). */
(function () {
  var THEMES = [
    { id: "default", name: "Default", emoji: "💬" },
    { id: "tigo", name: "Tigo", emoji: "🧡" },
    { id: "ocean", name: "Ocean", emoji: "🌊" },
    { id: "sunset", name: "Sunset", emoji: "🌅" },
    { id: "forest", name: "Forest", emoji: "🌿" },
    { id: "lavender", name: "Lavender", emoji: "💜" },
    { id: "candy", name: "Candy", emoji: "🍬" },
    { id: "night", name: "Night", emoji: "🌙" },
    { id: "sampaguita", name: "Sampaguita", emoji: "🌼" },
    // seasonal: may gumagalaw na epekto (season-fx.js) at tunog kapag pinili (season-sound.js)
    { id: "christmas", name: "Christmas", emoji: "🎄", fx: "snow" },
    { id: "newyear", name: "New Year", emoji: "🎆", fx: "fireworks" },
    { id: "halloween", name: "Halloween", emoji: "🎃", fx: "bats" },
    { id: "valentine", name: "Valentine's", emoji: "💘", fx: "hearts" },
  ];
  function fxOf(id) { var t = THEMES.filter(function (x) { return x.id === id; })[0]; return (t && t.fx) || ""; }
  // Epekto sa ibabaw ng listahan ng messages (sumusunod sa laki at puwesto ng .ch-list)
  function fx(root, kind) {
    var list = root.querySelector(".ch-list"), box = root.querySelector(":scope > .ch-fx");
    if (!kind || !window.TMN_FX || !list) { if (box) { if (window.TMN_FX) TMN_FX.attach(box, ""); box.remove(); } root.classList.remove("has-fx"); return; }
    root.classList.add("has-fx");
    if (!box) {
      box = document.createElement("div"); box.className = "ch-fx"; box.setAttribute("aria-hidden", "true"); root.appendChild(box);
      var pos = function () { var l = root.querySelector(".ch-list"); if (l) { box.style.top = l.offsetTop + "px"; box.style.height = l.offsetHeight + "px"; } };
      pos(); if (window.ResizeObserver) new ResizeObserver(pos).observe(list); window.addEventListener("resize", pos);
    }
    TMN_FX.attach(box, kind);
  }
  var MAX_SIDE = 1600;   // wallpaper: hanggang 1600 px, JPEG ~80% (mga 200–400 KB)

  // Ilapat sa chat. Hindi pinapalitan ang larawan kung pareho ang key (iwas kisap tuwing nire-refresh ang chat).
  function apply(root, chat) {
    if (!root || !chat) return;
    var t = chat.theme && THEMES.some(function (x) { return x.id === chat.theme; }) ? chat.theme : "";
    if (t) root.setAttribute("data-ctheme", t); else root.removeAttribute("data-ctheme");
    fx(root, fxOf(t));
    var wp = chat.wallpaper;
    if (wp && wp.url) {
      if (root._wpKey !== wp.key) { root._wpKey = wp.key; root.style.setProperty("--ct-wp", 'url("' + String(wp.url).replace(/["\\\n]/g, "") + '")'); }
      root.classList.add("has-wp");
    } else { root._wpKey = null; root.style.removeProperty("--ct-wp"); root.classList.remove("has-wp"); }
    bubble(root, chat.bubble);
  }
  function bubble(root, b) {
    var a = b && b.alpha != null ? Math.max(15, Math.min(100, Number(b.alpha) || 100)) : 100;
    root.classList.toggle("ct-alpha", a < 100);
    root.classList.toggle("ct-gloss", !!(b && b.gloss));
    if (a < 100) root.style.setProperty("--ct-ba", String(a / 100)); else root.style.removeProperty("--ct-ba");
  }

  function shrink(file) {
    return new Promise(function (ok, bad) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : bad(new Error("Couldn't read the photo.")); }, "image/jpeg", 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); bad(new Error("Couldn't read the photo.")); };
      img.src = url;
    });
  }

  function picker(chatId, chat, onDone) {
    var UI = window.TMN_UI, I = window.TMN_ICON, cur = chat.theme || "default";
    var body = document.createElement("div"); body.className = "ct-pick";
    body.innerHTML =
      '<p class="faint small ct-note">Everyone in this chat sees the same theme and wallpaper.</p>' +
      '<div class="ct-grid" role="radiogroup" aria-label="Chat theme">' + THEMES.map(function (t) {
        return '<button type="button" class="ct-sw' + (t.fx ? " ct-season" : "") + '" role="radio" aria-checked="' + (t.id === cur) + '" data-t="' + t.id + '">' +
          '<span class="ct-prev" data-ctheme="' + (t.id === "default" ? "" : t.id) + '"><i class="ct-b1"></i><i class="ct-b2"></i></span>' +
          "<small>" + t.emoji + " " + t.name + "</small></button>";
      }).join("") + "</div>" +
      '<div class="ct-wp-row"><b>Wallpaper</b><span class="faint small">' + (chat.wallpaper ? "A photo is set." : "No photo.") + "</span></div>" +
      '<div class="ct-wp-acts"><label class="btn btn-ghost">' + I("image", "ic-sm") + (chat.wallpaper ? "Change photo" : "Choose photo") +
        '<input type="file" accept="image/*" class="sr-only ct-file"></label>' +
        (chat.wallpaper ? '<button type="button" class="btn btn-ghost" data-wp="remove">' + I("trash", "ic-sm") + "Remove</button>" : "") + "</div>" +
      '<div class="ct-bub"><div class="ct-bub-row"><b>Bubbles</b><span class="faint small ct-bub-val"></span></div>' +
        '<div class="ct-bub-prev ch"><div class="ch-row"><span class="ch-bubble"><span class="ch-text">Hi! 👋</span></span></div>' +
          '<div class="ch-row mine"><span class="ch-bubble"><span class="ch-text">Kita na ang wallpaper ✨</span></span></div></div>' +
        '<input type="range" class="ct-alpha-in" min="15" max="100" step="5" aria-label="Bubble see-through">' +
        '<div class="ct-bub-ends faint small"><span>See-through</span><span>Solid</span></div>' +
        '<div class="ct-bub-row"><span>✨ Glossy</span><button type="button" class="set-switch ct-gloss-sw" role="switch" aria-label="Glossy bubbles"><i></i></button></div></div>' +
      '<p class="faint small ct-msg" aria-live="polite"></p>';
    var m = TMN_MODAL.open({ title: "Theme & wallpaper", size: "sm", cls: "modal-sheet", body: body });
    var msg = body.querySelector(".ct-msg"), busy = false;
    // Bubbles: preview agad (dito at sa chat sa likod), save pagkatapos ng 600 ms
    var b0 = chat.bubble || { alpha: 100, gloss: false }, bs = { alpha: b0.alpha != null ? b0.alpha : 100, gloss: !!b0.gloss };
    var prev = body.querySelector(".ct-bub-prev"), rng = body.querySelector(".ct-alpha-in"), gsw = body.querySelector(".ct-gloss-sw"), live = document.querySelector(".ch:not(.ct-bub-prev)");
    if (chat.theme && chat.theme !== "default") prev.setAttribute("data-ctheme", chat.theme);
    if (chat.wallpaper && chat.wallpaper.url) { prev.classList.add("has-photo"); prev.style.setProperty("--ct-wp", 'url("' + String(chat.wallpaper.url).replace(/["\\\n]/g, "") + '")'); }
    var saveT = 0;
    function paintBub() {
      rng.value = bs.alpha; gsw.setAttribute("aria-checked", String(bs.gloss));
      body.querySelector(".ct-bub-val").textContent = (bs.alpha >= 100 ? "Solid" : bs.alpha + "%") + (bs.gloss ? " · Glossy" : "");
      bubble(prev, bs); if (live) bubble(live, bs);
    }
    function saveBub() {
      clearTimeout(saveT);
      saveT = setTimeout(async function () {
        try { await TMN_API.call("messages", "bubble", { id: chatId, alpha: bs.alpha, gloss: bs.gloss }); chat.bubble = { alpha: bs.alpha, gloss: bs.gloss }; msg.textContent = "Bubbles saved for everyone in this chat."; }
        catch (err) { msg.textContent = err.message; }
      }, 600);
    }
    rng.addEventListener("input", function () { bs.alpha = Number(rng.value); paintBub(); saveBub(); });
    gsw.addEventListener("click", function () { bs.gloss = !bs.gloss; paintBub(); saveBub(); });
    paintBub();
    function done() { m.close(); if (onDone) onDone(); }
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-t]");
      if (b && !busy) {
        if (b.dataset.t === cur) { m.close(); return; }
        busy = true; msg.textContent = "Saving…";
        if (fxOf(b.dataset.t) && window.TMN_SEASON_SOUND) TMN_SEASON_SOUND.play(b.dataset.t);   // maikling kanta ng theme
        try { await TMN_API.call("messages", "theme", { id: chatId, theme: b.dataset.t }); UI.toast("Theme changed for everyone in this chat."); done(); }
        catch (err) { msg.textContent = err.message; busy = false; }
        return;
      }
      if (e.target.closest('[data-wp="remove"]') && !busy) {
        busy = true; msg.textContent = "Removing…";
        try { await TMN_API.call("messages", "wallpaper", { id: chatId, path: null }); UI.toast("Wallpaper removed."); done(); }
        catch (err) { msg.textContent = err.message; busy = false; }
      }
    });
    body.querySelector(".ct-file").addEventListener("change", async function () {
      var f = this.files && this.files[0]; this.value = "";
      if (!f || busy) return;
      if (!/^image\//.test(f.type)) { msg.textContent = "Choose a photo."; return; }
      busy = true; msg.textContent = "Uploading…";
      try {
        var blob = await shrink(f);
        var up = await TMN_API.call("messages", "upload", { id: chatId, kind: "wallpaper", size: blob.size, mime: "image/jpeg" });
        var res = await fetch(up.url, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: blob });
        if (!res.ok) throw new Error("Upload failed. Please try again.");
        await TMN_API.call("messages", "wallpaper", { id: chatId, path: up.path });
        UI.toast("Wallpaper set for everyone in this chat."); done();
      } catch (err) { msg.textContent = err.message; busy = false; }
    });
  }

  window.TMN_CHAT_THEME = { THEMES: THEMES, apply: apply, bubble: bubble, picker: picker };
})();
