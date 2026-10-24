/* TigoMeNote · stickers.js — sariling stickers ng TigoMeNote (si "Tigo", isang maliit na note na may mukha)
   Gawa sa SVG sa code (walang image file, walang copyright ng iba). Ang message ay may sticker id lang.
     TMN_STICKERS.list            → [{ id, label }]
     TMN_STICKERS.svg(id, size)   → "<svg …>" (o "" kung walang ganoong id)
   Bagong sticker: magdagdag sa LIST gamit ang mga piyesa sa ibaba (kulay, mata, bibig, extra, text). */
(function () {
  var INK = "#2b1d1a";
  var C = { coral: ["#ff7a59", "#e85d3c"], amber: ["#ffc04d", "#e9a21f"], mint: ["#3dd6c0", "#14b8a6"], sky: ["#7cc4ff", "#4a9fe8"],
            pink: ["#ff9ec7", "#f06aa7"], lilac: ["#b9a2ff", "#8f74f0"], lime: ["#b8e65c", "#8cc832"] };

  // id, label (para sa screen reader at preview), kulay, mata, bibig, extra, text sa ilalim
  var LIST = [
    ["tigo-hello", "Hello po!", "coral", "dot", "smile", "wave blush", "Hello po!"],
    ["tigo-love", "Love you", "pink", "heart", "smile", "hearts blush", "Love you"],
    ["tigo-haha", "Haha!", "amber", "happy", "laugh", "tears-joy", "Haha!"],
    ["tigo-salamat", "Salamat!", "mint", "happy", "smile", "blush sparkle", "Salamat!"],
    ["tigo-ingat", "Ingat!", "sky", "dot", "smile", "heart-hand", "Ingat!"],
    ["tigo-kain", "Kain na!", "amber", "wide", "o", "bowl", "Kain na!"],
    ["tigo-miss", "Miss you", "lilac", "sad", "frown", "tear", "Miss you"],
    ["tigo-sorry", "Sorry na", "sky", "sad", "flat", "sweat blush", "Sorry na"],
    ["tigo-wow", "Wow!", "lime", "star", "o", "sparkle", "Wow!"],
    ["tigo-galit", "Galit ako!", "coral", "angry", "frown", "steam", "Galit ako!"],
    ["tigo-sleep", "Good night", "lilac", "closed", "flat", "zzz", "Good night"],
    ["tigo-morning", "Good morning", "amber", "happy", "smile", "sun", "Good morning"],
    ["tigo-congrats", "Congrats!", "mint", "happy", "grin", "party", "Congrats!"],
    ["tigo-ok", "OK!", "lime", "wink", "smile", "thumb", "OK!"],
    ["tigo-tara", "Tara!", "coral", "wide", "grin", "go", "Tara!"],
    ["tigo-mabuhay", "Mabuhay!", "sky", "happy", "grin", "sparkle", "Mabuhay!"],
    ["tigo-yalla", "Yalla!", "mint", "wide", "grin", "go", "Yalla!"],
    ["tigo-shukran", "Shukran", "pink", "happy", "smile", "heart-hand blush", "Shukran"],
    ["tigo-hmm", "Hmm…", "lilac", "side", "flat", "think", "Hmm…"],
    ["tigo-cry", "Huhu", "sky", "closed", "cry", "tears", "Huhu"]
  ].map(function (r) { return { id: r[0], label: r[1], color: r[2], eyes: r[3], mouth: r[4], extra: r[5] ? r[5].split(" ") : [], text: r[6] }; });

  // ---------- piyesa ----------
  function body(col) {
    var c = C[col] || C.coral;
    return '<ellipse cx="80" cy="148" rx="44" ry="6" fill="#000" opacity=".12"/>' +
      '<path d="M34 22h72l22 22v70a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14V36a14 14 0 0 1 14-14z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="3"/>' +
      '<path d="M106 22v14a8 8 0 0 0 8 8h14z" fill="' + c[1] + '"/>' +
      '<path d="M38 104h44" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>';
  }
  function eyes(k) {
    var L = 58, R = 92, Y = 64;
    switch (k) {
      case "happy": return '<path d="M' + (L - 8) + " " + (Y + 3) + "q8-10 16 0M" + (R - 8) + " " + (Y + 3) + 'q8-10 16 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "closed": return '<path d="M' + (L - 8) + " " + Y + "q8 7 16 0M" + (R - 8) + " " + Y + 'q8 7 16 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "heart": return heart(L, Y, 9, "#e8264f") + heart(R, Y, 9, "#e8264f");
      case "star": return star(L, Y, 9) + star(R, Y, 9);
      case "wide": return '<circle cx="' + L + '" cy="' + Y + '" r="8" fill="' + INK + '"/><circle cx="' + R + '" cy="' + Y + '" r="8" fill="' + INK + '"/><circle cx="' + (L + 3) + '" cy="' + (Y - 3) + '" r="2.6" fill="#fff"/><circle cx="' + (R + 3) + '" cy="' + (Y - 3) + '" r="2.6" fill="#fff"/>';
      case "wink": return '<circle cx="' + L + '" cy="' + Y + '" r="5" fill="' + INK + '"/><path d="M' + (R - 8) + " " + (Y + 2) + 'q8-8 16 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "sad": return '<circle cx="' + L + '" cy="' + (Y + 2) + '" r="5" fill="' + INK + '"/><circle cx="' + R + '" cy="' + (Y + 2) + '" r="5" fill="' + INK + '"/>' +
        '<path d="M' + (L - 9) + " " + (Y - 8) + "l14-5M" + (R + 9) + " " + (Y - 8) + 'l-14-5" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/>';
      case "angry": return '<circle cx="' + L + '" cy="' + (Y + 2) + '" r="5" fill="' + INK + '"/><circle cx="' + R + '" cy="' + (Y + 2) + '" r="5" fill="' + INK + '"/>' +
        '<path d="M' + (L - 9) + " " + (Y - 12) + "l15 6M" + (R + 9) + " " + (Y - 12) + 'l-15 6" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "side": return '<circle cx="' + (L + 4) + '" cy="' + (Y - 2) + '" r="5" fill="' + INK + '"/><circle cx="' + (R + 4) + '" cy="' + (Y - 2) + '" r="5" fill="' + INK + '"/>';
      default: return '<circle cx="' + L + '" cy="' + Y + '" r="5.5" fill="' + INK + '"/><circle cx="' + R + '" cy="' + Y + '" r="5.5" fill="' + INK + '"/>';
    }
  }
  function mouth(k) {
    switch (k) {
      case "laugh": return '<path d="M60 82h40q-2 22-20 22t-20-22z" fill="' + INK + '"/><path d="M68 96q12-8 24 0q-4 8-12 8t-12-8z" fill="#ff6b81"/>';
      case "grin": return '<path d="M62 82h36q-2 16-18 16t-18-16z" fill="' + INK + '"/><path d="M66 84h28v4H66z" fill="#fff"/>';
      case "o": return '<ellipse cx="80" cy="90" rx="7" ry="9" fill="' + INK + '"/>';
      case "frown": return '<path d="M68 94q12-10 24 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "flat": return '<path d="M70 90h20" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case "cry": return '<path d="M66 96q14-14 28 0z" fill="' + INK + '"/>';
      default: return '<path d="M66 84q14 14 28 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
    }
  }
  function heart(x, y, r, fill) {
    return '<path transform="translate(' + (x - r) + " " + (y - r) + ") scale(" + (r / 12) + ')" d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="' + fill + '"/>';
  }
  function star(x, y, r) {
    var p = [];
    for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r; p.push((x + Math.cos(a) * rr).toFixed(1) + "," + (y + Math.sin(a) * rr).toFixed(1)); }
    return '<polygon points="' + p.join(" ") + '" fill="#ffd23f" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
  }
  function extra(k) {
    switch (k) {
      case "blush": return '<ellipse cx="46" cy="80" rx="7" ry="4" fill="#ff5a7a" opacity=".45"/><ellipse cx="114" cy="80" rx="7" ry="4" fill="#ff5a7a" opacity=".45"/>';
      case "wave": return '<g stroke="' + INK + '" stroke-width="3" stroke-linecap="round" fill="#fff"><circle cx="134" cy="70" r="11"/></g><path d="M146 56l6-6M150 66l8-2M148 77l7 3" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
      case "hearts": return heart(138, 34, 10, "#ff4d6d") + heart(22, 30, 7, "#ff4d6d") + heart(146, 64, 6, "#ff8fa3");
      case "tears-joy": return '<path d="M44 70q-6 10 0 14q6-4 0-14zM116 70q-6 10 0 14q6-4 0-14z" fill="#5ab8ff"/>';
      case "tear": return '<path d="M92 72q-5 9 0 13q5-4 0-13z" fill="#5ab8ff"/>';
      case "tears": return '<path d="M50 70v34M110 70v34" stroke="#5ab8ff" stroke-width="6" stroke-linecap="round" opacity=".85"/>';
      case "sparkle": return star(140, 30, 9) + star(20, 46, 6) + star(144, 74, 5);
      case "heart-hand": return '<circle cx="132" cy="96" r="10" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' + heart(140, 74, 9, "#ff4d6d");
      case "bowl": return '<path d="M112 92h40a20 20 0 0 1-40 0z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M122 84q4-8 0-14M132 84q4-8 0-14M142 84q4-8 0-14" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/>';
      case "sweat": return '<path d="M118 40q-7 11 0 15q7-4 0-15z" fill="#5ab8ff"/>';
      case "steam": return '<path d="M30 28q-6-6 0-12M42 22q-6-6 0-12M120 22q6-6 0-12M132 28q6-6 0-12" stroke="#9aa0a6" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      case "zzz": return '<text x="122" y="34" font-family="sans-serif" font-weight="800" font-size="20" fill="' + INK + '">z</text><text x="136" y="20" font-family="sans-serif" font-weight="800" font-size="14" fill="' + INK + '">z</text>';
      case "sun": return '<circle cx="138" cy="30" r="12" fill="#ffd23f" stroke="' + INK + '" stroke-width="2.5"/><path d="M138 8v6M138 46v6M116 30h6M154 30h6M122 14l4 4M150 42l4 4M154 14l-4 4M126 42l-4 4" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
      case "party": return '<path d="M44 24l22-20 6 30z" fill="#7c5cff" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/><circle cx="66" cy="4" r="5" fill="#ffd23f"/>' +
        '<g fill="#ff4d6d"><rect x="132" y="22" width="6" height="6" transform="rotate(20 135 25)"/><rect x="18" y="64" width="6" height="6" transform="rotate(-15 21 67)"/></g><g fill="#14b8a6"><circle cx="146" cy="56" r="3.5"/><circle cx="14" cy="38" r="3"/></g>';
      case "thumb": return '<path d="M124 104v-18l8-14q6 0 5 8l-2 6h12q6 0 5 7l-3 12q-1 5-7 5h-18z" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case "go": return '<path d="M128 70h22M140 58l12 12-12 12" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 60h10M4 74h12M8 88h10" stroke="' + INK + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>';
      case "think": return '<circle cx="132" cy="40" r="5" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/><circle cx="144" cy="24" r="8" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>';
      default: return "";
    }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function label(t) {
    var w = Math.min(148, 26 + t.length * 9.2), x = 80 - w / 2;
    return '<rect x="' + x.toFixed(1) + '" y="112" width="' + w.toFixed(1) + '" height="30" rx="15" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
      '<text x="80" y="133" text-anchor="middle" font-family="Bricolage Grotesque, Inter, system-ui, sans-serif" font-weight="800" font-size="16" fill="' + INK + '">' + esc(t) + "</text>";
  }
  function get(id) { return LIST.filter(function (s) { return s.id === id; })[0] || null; }
  function svg(id, size) {
    var s = get(id); if (!s) return "";
    return '<svg class="tmn-sticker" translate="no" role="img" aria-label="' + esc(s.label) + '" viewBox="0 0 160 160" width="' + (size || 120) + '" height="' + (size || 120) + '" xmlns="http://www.w3.org/2000/svg">' +
      body(s.color) + s.extra.map(extra).join("") + eyes(s.eyes) + mouth(s.mouth) + (s.text ? label(s.text) : "") + "</svg>";
  }

  window.TMN_STICKERS = { list: LIST.map(function (s) { return { id: s.id, label: s.label }; }), svg: svg, get: get };
})();
