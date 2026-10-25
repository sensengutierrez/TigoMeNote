/* TigoMeNote · tigo/photo.js — 📸 litrato ni Tigo (screenshot ng 3D) + I-share sa Explore
   import { takePhoto } from "./photo.js"
   takePhoto({ sc, stage, pet:{name,level}, friends:["Mochi"], level:N?, place:"house"|"island", toast })
     → kuha agad (flash), may frame (pangalan, level, petsa, TigoMeNote), tapos preview:
       ⬇ Save · 📤 Share to Explore (post-composer; ini-load lang kapag kailangan) · ↗ Share (share ng phone)
   level = N → may "🎉 Level N!" na banner (pang-share kapag nag-level up). Gumagana sa labas, sa loob ng bahay, at kahit may bisita. */
const V = () => (window.TMN_CONFIG || {}).version || "";
const loaded = {};
function script(src) {
  return loaded[src] || (loaded[src] = new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = "../assets/js/" + src + "?v=" + V(); s.onload = ok; s.onerror = () => { delete loaded[src]; no(new Error(src)); };
    document.head.appendChild(s);
  }));
}
function css(href) {
  if (document.querySelector('link[data-tmn="' + href + '"]')) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "../assets/css/" + href + "?v=" + V(); l.dataset.tmn = href; document.head.appendChild(l);
}
// Mga kailangan ng "Gumawa ng post" (wala sa tigo.html para mabilis ang page)
const NEEDS = [
  ["TMN_SOUNDS", "sounds.js"], ["TMN_MEDIA", "media-store.js"], ["TMN_ROUTE", "route.js"], ["TMN_EMOJI_DATA", "emoji-data.js"],
  ["TMN_EMOJI_PICK", "components/emoji-picker.js"], ["TMN_SOUND_MAKER", "components/sound-maker.js"],
  ["TMN_SOUND_PICK", "components/sound-picker.js"], ["TMN_COMPOSER", "components/post-composer.js"],
];
export async function loadComposer() {
  ["posts.css", "sounds.css", "sound-maker.css"].forEach(css);
  for (const [g, src] of NEEDS) if (!window[g]) await script(src);
  return window.TMN_COMPOSER;
}

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
const FONT = '"Bricolage Grotesque", "Inter", system-ui, sans-serif';

// Kopyahin ang 3D canvas + lagyan ng frame
export function frame(src, o) {
  const W = Math.min(1600, Math.max(720, src.width)), H = Math.round(W * src.height / src.width);
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const x = out.getContext("2d");
  x.fillStyle = "#cfe9ff"; x.fillRect(0, 0, W, H);
  x.drawImage(src, 0, 0, W, H);
  const u = W / 100 * (H > W ? 1.3 : 1); // mas malaking text sa patayong litrato
  // ibaba: pangalan · level · petsa
  const bh = Math.max(64, u * 11), g = x.createLinearGradient(0, H - bh * 1.6, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.62)");
  x.fillStyle = g; x.fillRect(0, H - bh * 1.6, W, bh * 1.6);
  x.fillStyle = "#fff"; x.textBaseline = "alphabetic"; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = u * 0.6;
  x.font = "800 " + Math.round(u * 4.2) + "px " + FONT;
  const who = "🐾 " + (o.name || "Tigo") + (o.level ? "  ·  Lv " + o.level : "");
  x.fillText(who, u * 3.5, H - bh * 0.62);
  const sub = [o.friends && o.friends.length ? "with " + o.friends.join(", ") : "", o.place === "house" ? "🏠 at home" : "",
    new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })].filter(Boolean).join("  ·  ");
  x.font = "600 " + Math.round(u * 2.5) + "px " + FONT; x.globalAlpha = 0.9;
  x.fillText(sub, u * 3.5, H - bh * 0.22);
  x.textAlign = "right"; x.font = "800 " + Math.round(u * 2.8) + "px " + FONT; x.globalAlpha = 0.95;
  x.fillText("TigoMeNote", W - u * 3.5, H - bh * 0.22);
  x.globalAlpha = 1; x.textAlign = "left"; x.shadowBlur = 0;
  // banner ng level up
  if (o.banner) {
    x.font = "800 " + Math.round(u * 5.4) + "px " + FONT;
    const t = o.banner, tw = x.measureText(t).width, pw = tw + u * 9, ph = u * 9.5, px = (W - pw) / 2, py = u * 4;
    const gg = x.createLinearGradient(px, py, px + pw, py + ph); gg.addColorStop(0, "#ffd23f"); gg.addColorStop(1, "#ff8a3d");
    x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = u * 1.5; x.shadowOffsetY = u * 0.5;
    roundRect(x, px, py, pw, ph, ph / 2); x.fillStyle = gg; x.fill();
    x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.fillStyle = "#3b1d00"; x.textAlign = "center"; x.fillText(t, W / 2, py + ph * 0.68); x.textAlign = "left";
  }
  return out;
}

function flash(stage) {
  const f = document.createElement("div"); f.className = "tg-flash"; stage.appendChild(f);
  setTimeout(() => f.remove(), 650);
}

const blobOf = (c) => new Promise((ok) => c.toBlob((b) => ok(b), "image/jpeg", 0.9));

export async function takePhoto(o) {
  const { sc, stage } = o;
  if (!sc || !sc.snapshot) { o.toast && o.toast("Photos need 3D (WebGL) on this device."); return null; }
  let shot;
  try { shot = frame(sc.snapshot(), { name: o.pet.name, level: o.pet.level, friends: o.friends, place: o.place, banner: o.level ? "🎉 Level " + o.level + "!" : "" }); }
  catch (e) { o.toast && o.toast("Couldn't take the photo. Try again."); return null; }
  flash(stage);
  try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  const blob = await blobOf(shot);
  if (!blob) { o.toast && o.toast("Couldn't take the photo. Try again."); return null; }
  const stamp = new Date().toISOString().slice(0, 10), fname = "tigo-" + stamp + "-" + Date.now().toString(36).slice(-4) + ".jpg";
  const file = new File([blob], fname, { type: "image/jpeg" });
  preview(file, o);
  return file;
}

function preview(file, o) {
  const UI = window.TMN_UI, url = URL.createObjectURL(file);
  const caption = o.level ? "🎉 " + o.pet.name + " reached Level " + o.level + "! #TigoMeNote"
    : o.friends && o.friends.length ? o.pet.name + " with " + o.friends.join(", ") + " 💕 #TigoMeNote" : "📸 " + o.pet.name + " #TigoMeNote";
  const body = document.createElement("div"); body.className = "tg-photo";
  body.innerHTML = '<img class="tg-photo-img" alt="">';
  body.querySelector("img").src = url;
  const canShare = !!(navigator.canShare && navigator.share && (() => { try { return navigator.canShare({ files: [file] }); } catch (e) { return false; } })());
  const actions = [
    { label: "⬇ Save", cls: "btn-ghost tg-photo-save", onClick() {
      const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      UI && UI.toast("Saved 📸");
    } },
  ];
  if (canShare) actions.push({ label: "↗ Share", cls: "btn-ghost tg-photo-native", async onClick() {
    try { await navigator.share({ files: [file], title: "TigoMeNote", text: caption }); } catch (e) {}
  } });
  actions.push({ label: "📤 Share to Explore", cls: "btn-primary tg-photo-post", async onClick(m, b) {
    b.disabled = true; const t = b.innerHTML; b.innerHTML = "Opening…";
    try {
      const C = await loadComposer();
      const items = await window.TMN_MEDIA.addFiles([file]);
      m.close();
      C.open(items, { onPosted() { UI && UI.toast("Posted to Explore 🎉"); } });
      setTimeout(() => { const ta = document.querySelector(".modal .pc-cap"); if (ta && !ta.value) { ta.value = caption; ta.dispatchEvent(new Event("input", { bubbles: true })); } }, 60);
    } catch (e) { b.disabled = false; b.innerHTML = t; UI && UI.toast("Can't open the post maker right now. Check your internet."); }
  } });
  const m = window.TMN_MODAL.open({ title: o.level ? "🎉 Level " + o.level + "!" : "📸 Photo", body, size: "md", cls: "tg-photo-modal", actions });
  const close0 = m.close; m.close = function () { setTimeout(() => URL.revokeObjectURL(url), 30000); return close0.apply(m, arguments); };
  return m;
}
