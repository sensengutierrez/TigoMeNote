/* TigoMeNote · look-tigo.js — sariling backgrounds ng TigoMeNote (original, gawa dito, walang kinopya)
   TMN_LOOK_TIGO = [{ id, name, css, dark }]  (dark = madilim, kaya puti ang mga pamagat sa ibabaw)  ← ginagamit ng appearance.js (lalabas muna bago ang ibang kulay)
   Bawat isa ay maliit na SVG pattern na inuulit (magaan, walang file na dina-download) + kulay sa ilalim.
   Brand: itim na "note" na may orange na tuldok (#ff5a36), parang logo ng TigoMeNote. */
(function () {
  var O = "#ff5a36", INK = "#121212";
  function url(svg, size) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 0 0 / ' + size + " repeat"; }
  function svg(w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '">' + body + "</svg>"; }
  // Isang "Tigo note": bilugang parisukat na may orange na tuldok sa kanto (gaya ng logo)
  function note(x, y, s, rot, fill, dot, op) {
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')" opacity="' + op + '"><rect x="' + (-s / 2) + '" y="' + (-s / 2) + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.28) + '" fill="' + fill + '"/>' +
      '<circle cx="' + (s / 2 - s * 0.06) + '" cy="' + (-s / 2 + s * 0.06) + '" r="' + (s * 0.14) + '" fill="' + dot + '"/></g>';
  }
  // Sampaguita: limang talulot (sariling drawing)
  function flower(x, y, r, rot) {
    var p = "";
    for (var i = 0; i < 5; i++) p += '<ellipse cx="0" cy="' + (-r) + '" rx="' + (r * 0.55) + '" ry="' + r + '" transform="rotate(' + (i * 72) + ')" fill="#fff"/>';
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')" opacity=".9">' + p + '<circle r="' + (r * 0.38) + '" fill="#ffe08a"/></g>';
  }
  var LIST = [
    { id: "tigo-notes", name: "Tigo Notes", css: url(svg(260, 260,
        note(40, 46, 30, -12, INK, O, .1) + note(170, 30, 20, 14, INK, O, .08) + note(118, 128, 38, 6, O, INK, .1) +
        note(220, 168, 26, -20, INK, O, .1) + note(52, 206, 22, 18, O, INK, .09) + note(160, 228, 16, -6, INK, O, .08) +
        '<circle cx="96" cy="64" r="3" fill="' + O + '" opacity=".35"/><circle cx="232" cy="96" r="2.5" fill="' + INK + '" opacity=".2"/><circle cx="24" cy="140" r="2.5" fill="' + O + '" opacity=".3"/>'), "260px 260px") +
        ", linear-gradient(160deg,#fff7f0 0%,#ffe9dd 100%)" },
    { id: "tigo-journal", name: "Tigo Journal", css: url(svg(40, 32,
        '<line x1="0" y1="31.5" x2="40" y2="31.5" stroke="#7aa7d8" stroke-opacity=".35"/>'), "40px 32px") +
        ', linear-gradient(90deg,transparent 0 56px,rgba(255,90,54,.45) 56px 58px,transparent 58px), #fffdf6' },
    { id: "tigo-dots", name: "Tigo Dots", css: url(svg(24, 24, '<circle cx="12" cy="12" r="1.4" fill="' + INK + '" fill-opacity=".22"/>'), "24px 24px") + ", " +
        url(svg(168, 168, '<circle cx="84" cy="84" r="3" fill="' + O + '" fill-opacity=".55"/>'), "168px 168px") + ", #f7f5f0" },
    { id: "tigo-waves", name: "Tigo Waves", css: url(svg(200, 60,
        '<path d="M0 30 C 33 10, 67 10, 100 30 S 167 50, 200 30" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>' +
        '<path d="M0 50 C 33 30, 67 30, 100 50 S 167 70, 200 50" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>'), "200px 60px") +
        ", linear-gradient(170deg,#ff8a5c 0%,#ff5a36 45%,#c2185b 100%)" },
    { id: "tigo-pearls", name: "Tigo Pearls", dark: true, css: url(svg(220, 220,
        '<defs><radialGradient id="p" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e8eef5"/><stop offset="1" stop-color="#a9b8c9"/></radialGradient></defs>' +
        '<circle cx="50" cy="60" r="11" fill="url(#p)" opacity=".85"/><circle cx="160" cy="40" r="7" fill="url(#p)" opacity=".7"/><circle cx="120" cy="150" r="14" fill="url(#p)" opacity=".85"/>' +
        '<circle cx="30" cy="180" r="6" fill="url(#p)" opacity=".6"/><circle cx="196" cy="140" r="9" fill="url(#p)" opacity=".75"/>' +
        '<circle cx="90" cy="100" r="2" fill="#f4c76b"/><circle cx="200" cy="200" r="2" fill="#f4c76b"/><circle cx="12" cy="20" r="1.6" fill="#f4c76b"/>'), "220px 220px") +
        ", linear-gradient(170deg,#0b2a3c 0%,#114b5f 55%,#1a7f86 100%)" },
    { id: "tigo-sampaguita", name: "Tigo Sampaguita", css: url(svg(230, 230,
        flower(50, 60, 11, 10) + flower(170, 40, 8, -20) + flower(130, 150, 13, 30) + flower(30, 190, 7, 0) + flower(205, 190, 9, 45) +
        '<path d="M60 75 q 20 30 60 60" fill="none" stroke="#5e9c6a" stroke-opacity=".35" stroke-width="2"/>'), "230px 230px") +
        ", linear-gradient(160deg,#e3f3e4 0%,#c6e8cc 100%)" },
    { id: "tigo-confetti", name: "Tigo Confetti", css: url(svg(200, 200,
        '<rect x="30" y="30" width="10" height="10" rx="2" fill="' + O + '" transform="rotate(20 35 35)" opacity=".7"/>' +
        '<circle cx="150" cy="50" r="5" fill="#1a7f86" opacity=".6"/>' +
        '<path d="M90 110 q 8 -10 16 0 t 16 0" fill="none" stroke="' + INK + '" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="160" y="150" width="8" height="8" rx="2" fill="#f4b400" transform="rotate(-15 164 154)" opacity=".75"/>' +
        '<circle cx="40" cy="160" r="4" fill="' + O + '" opacity=".55"/><circle cx="110" cy="20" r="3" fill="#845ec2" opacity=".55"/>'), "200px 200px") +
        ", #fffaf5" },
    { id: "tigo-night", name: "Tigo Night", dark: true, css: url(svg(240, 240,
        '<circle cx="30" cy="40" r="1.2" fill="#fff" opacity=".8"/><circle cx="120" cy="20" r="1" fill="#fff" opacity=".6"/><circle cx="200" cy="70" r="1.4" fill="#fff" opacity=".9"/>' +
        '<circle cx="70" cy="150" r="1" fill="#fff" opacity=".5"/><circle cx="170" cy="200" r="1.3" fill="#fff" opacity=".7"/><circle cx="20" cy="220" r="1" fill="#fff" opacity=".6"/>' +
        '<polyline points="160,120 186,104 214,126 196,152" fill="none" stroke="#fff" stroke-opacity=".18"/>' +
        '<circle cx="160" cy="120" r="1.6" fill="#fff"/><circle cx="186" cy="104" r="1.6" fill="#fff"/><circle cx="214" cy="126" r="1.6" fill="#fff"/><circle cx="196" cy="152" r="1.6" fill="#fff"/>' +
        note(84, 84, 18, -10, "#ffffff", O, .12) + '<circle cx="94" cy="76" r="5" fill="' + O + '" opacity=".35"/>'), "240px 240px") +
        ", radial-gradient(circle at 80% 10%,#2b2440 0%,#141420 55%,#0b0b10 100%)" }
  ];
  window.TMN_LOOK_TIGO = LIST;
})();
