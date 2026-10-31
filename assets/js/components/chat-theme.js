/* TigoMeNote · components/chat-theme.js — theme at wallpaper ng isang chat (pareho sa lahat ng nasa chat)
     TMN_CHAT_THEME.apply(root, chat)        → ilapat sa .ch (data-ctheme + wallpaper); chat = { theme, wallpaper: { key, url } | null }
     TMN_CHAT_THEME.picker(chatId, chat, onDone) → sheet: pumili ng theme, magpalit o mag-alis ng wallpaper
   Server: messages-fast (theme, wallpaper, upload kind "wallpaper"). Ang listahan ng theme ay kapareho ng THEMES sa backend.
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
  ];
  var MAX_SIDE = 1600;   // wallpaper: hanggang 1600 px, JPEG ~80% (mga 200–400 KB)

  // Ilapat sa chat. Hindi pinapalitan ang larawan kung pareho ang key (iwas kisap tuwing nire-refresh ang chat).
  function apply(root, chat) {
    if (!root || !chat) return;
    var t = chat.theme && THEMES.some(function (x) { return x.id === chat.theme; }) ? chat.theme : "";
    if (t) root.setAttribute("data-ctheme", t); else root.removeAttribute("data-ctheme");
    var wp = chat.wallpaper;
    if (wp && wp.url) {
      if (root._wpKey !== wp.key) { root._wpKey = wp.key; root.style.setProperty("--ct-wp", 'url("' + String(wp.url).replace(/["\\\n]/g, "") + '")'); }
      root.classList.add("has-wp");
    } else { root._wpKey = null; root.style.removeProperty("--ct-wp"); root.classList.remove("has-wp"); }
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
        return '<button type="button" class="ct-sw" role="radio" aria-checked="' + (t.id === cur) + '" data-t="' + t.id + '">' +
          '<span class="ct-prev" data-ctheme="' + (t.id === "default" ? "" : t.id) + '"><i class="ct-b1"></i><i class="ct-b2"></i></span>' +
          "<small>" + t.emoji + " " + t.name + "</small></button>";
      }).join("") + "</div>" +
      '<div class="ct-wp-row"><b>Wallpaper</b><span class="faint small">' + (chat.wallpaper ? "A photo is set." : "No photo.") + "</span></div>" +
      '<div class="ct-wp-acts"><label class="btn btn-ghost">' + I("image", "ic-sm") + (chat.wallpaper ? "Change photo" : "Choose photo") +
        '<input type="file" accept="image/*" class="sr-only ct-file"></label>' +
        (chat.wallpaper ? '<button type="button" class="btn btn-ghost" data-wp="remove">' + I("trash", "ic-sm") + "Remove</button>" : "") + "</div>" +
      '<p class="faint small ct-msg" aria-live="polite"></p>';
    var m = TMN_MODAL.open({ title: "Theme & wallpaper", size: "sm", cls: "modal-sheet", body: body });
    var msg = body.querySelector(".ct-msg"), busy = false;
    function done() { m.close(); if (onDone) onDone(); }
    body.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-t]");
      if (b && !busy) {
        if (b.dataset.t === cur) { m.close(); return; }
        busy = true; msg.textContent = "Saving…";
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

  window.TMN_CHAT_THEME = { THEMES: THEMES, apply: apply, picker: picker };
})();
