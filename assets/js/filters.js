/* TigoMeNote · filters.js — libreng filters (iisang listahan para sa camera at photo editor)
   TMN_FILTERS.list            → [{ id, label, ops: [[name, value], …] }]
   TMN_FILTERS.css(id)         → "saturate(1.3) contrast(1.1)" (para sa CSS o ctx.filter)
   TMN_FILTERS.get(id)
   TMN_FILTERS.draw(ctx, src, w, h, id) → iguhit ang src (video/img/canvas) na may filter. ctx.filter kung meron,
                                          kung wala (hal. lumang Safari) pixel math, kaya laging naka-"bake" ang filter.
   Gawa lang sa CSS filters (brightness, contrast, saturate, sepia, hue-rotate, grayscale), kaya mabilis kahit live. */
(function () {
  var LIST = [
    { id: "none",   label: "Original", ops: [] },
    { id: "vivid",  label: "Vivid",    ops: [["saturate", 1.35], ["contrast", 1.1]] },
    { id: "warm",   label: "Warm",     ops: [["sepia", 0.25], ["saturate", 1.15], ["brightness", 1.03]] },
    { id: "cool",   label: "Cool",     ops: [["hue-rotate", 12], ["saturate", 1.05], ["brightness", 1.02]] },
    { id: "golden", label: "Golden",   ops: [["sepia", 0.35], ["saturate", 1.3], ["contrast", 1.05], ["brightness", 1.05]] },
    { id: "rose",   label: "Rose",     ops: [["hue-rotate", -12], ["saturate", 1.2], ["brightness", 1.06], ["contrast", 0.95]] },
    { id: "mint",   label: "Mint",     ops: [["hue-rotate", 24], ["saturate", 0.9], ["brightness", 1.06]] },
    { id: "drama",  label: "Drama",    ops: [["contrast", 1.35], ["saturate", 1.1], ["brightness", 0.94]] },
    { id: "retro",  label: "Retro",    ops: [["sepia", 0.45], ["contrast", 0.9], ["saturate", 0.85], ["brightness", 1.05]] },
    { id: "fade",   label: "Fade",     ops: [["contrast", 0.85], ["brightness", 1.08], ["saturate", 0.8]] },
    { id: "night",  label: "Night",    ops: [["hue-rotate", 190], ["saturate", 0.6], ["contrast", 1.15], ["brightness", 0.9]] },
    { id: "mono",   label: "Mono",     ops: [["grayscale", 1], ["contrast", 1.12]] },
    { id: "noir",   label: "Noir",     ops: [["grayscale", 1], ["contrast", 1.45], ["brightness", 0.9]] }
  ];
  function get(id) { return LIST.filter(function (f) { return f.id === id; })[0] || LIST[0]; }
  function css(id) {
    var ops = Array.isArray(id) ? id : get(id).ops;
    if (!ops.length) return "none";
    return ops.map(function (o) { return o[0] + "(" + o[1] + (o[0] === "hue-rotate" ? "deg" : "") + ")"; }).join(" ");
  }
  // Color matrices (W3C Filter Effects) para sa browsers na walang ctx.filter
  function matrixFor(op) {
    var n = op[0], v = op[1];
    if (n === "saturate") return [0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v];
    if (n === "grayscale") { var g = 1 - v; return [0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g]; }
    if (n === "sepia") { var q = 1 - v; return [0.393 + 0.607 * q, 0.769 - 0.769 * q, 0.189 - 0.189 * q, 0.349 - 0.349 * q, 0.686 + 0.314 * q, 0.168 - 0.168 * q, 0.272 - 0.272 * q, 0.534 - 0.534 * q, 0.131 + 0.869 * q]; }
    if (n === "hue-rotate") {
      var a = v * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
              0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
              0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
    }
    return null;
  }
  function pixels(ctx, w, h, ops) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data, ms = ops.map(matrixFor);
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      for (var k = 0; k < ops.length; k++) {
        var o = ops[k], m = ms[k];
        if (o[0] === "brightness") { r *= o[1]; g *= o[1]; b *= o[1]; }
        else if (o[0] === "contrast") { r = (r - 0.5) * o[1] + 0.5; g = (g - 0.5) * o[1] + 0.5; b = (b - 0.5) * o[1] + 0.5; }
        else if (m) { var nr = m[0] * r + m[1] * g + m[2] * b, ng = m[3] * r + m[4] * g + m[5] * b, nb = m[6] * r + m[7] * g + m[8] * b; r = nr; g = ng; b = nb; }
        r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; b = b < 0 ? 0 : b > 1 ? 1 : b;
      }
      d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  var native = null;
  function hasNative() {
    if (native === null) { try { var c = document.createElement("canvas").getContext("2d"); c.filter = "saturate(2)"; native = c.filter === "saturate(2)"; } catch (e) { native = false; } }
    return native;
  }
  // sx/sy/sw/sh (opsyonal): bahagi ng src na kukunin (pang-crop ng camera)
  function draw(ctx, src, w, h, id, crop) {
    var ops = Array.isArray(id) ? id : get(id).ops;
    if (ops.length && hasNative()) ctx.filter = css(ops);
    if (crop) ctx.drawImage(src, crop[0], crop[1], crop[2], crop[3], 0, 0, w, h); else ctx.drawImage(src, 0, 0, w, h);
    ctx.filter = "none";
    if (ops.length && !hasNative()) pixels(ctx, w, h, ops);
  }
  window.TMN_FILTERS = { list: LIST, get: get, css: css, draw: draw, native: hasNative };
})();
