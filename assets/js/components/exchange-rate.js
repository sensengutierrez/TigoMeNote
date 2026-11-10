/* TigoMeNote · components/exchange-rate.js — "Exchange rate" sa Daily (hal. 1 BHD = ? USD), palitan ngayon
     Kusang naka-mount sa <section id="fx">.
     • Unang bukas: "From" = pera ng bansa mo (galing sa lugar ng Weather, o sa wika/timezone ng phone), "To" = USD (o PHP kung USD ka na).
     • Puwedeng palitan ang dalawang pera, baligtarin (⇄), at ilagay ang halaga. May listahan din ng ibang pera — pindutin para gawing "To".
     • Rates: open.er-api.com (libre, walang API key; isang beses bawat araw ang update). Reserba: currency-api sa jsDelivr.
     • Cache: 3 oras sa browser (localStorage "tmnFxRates"); gumagana offline gamit ang huling nakuha. Pinili: "tmnFx".
     Walang ipinapadala sa TigoMeNote server. Gabay lang ito — iba ang palitan sa bangko at remittance.
   Kailangan: icons.js (TMN_ICON), TMN_UI (esc) */
(function () {
  var API = "https://open.er-api.com/v6/latest/USD";
  var API2 = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json";
  var KEY = "tmnFx", RKEY = "tmnFxRates", TTL = 3 * 3600e3;
  var POPULAR = ["USD", "PHP", "EUR", "GBP", "SAR", "AED", "BHD", "KWD", "QAR", "JPY", "SGD", "HKD", "CAD", "AUD"];
  // Bansa → pera (ISO 3166 → ISO 4217). Euro area sa ibaba.
  var CC = { PH: "PHP", BH: "BHD", US: "USD", SA: "SAR", AE: "AED", KW: "KWD", QA: "QAR", OM: "OMR", JO: "JOD", GB: "GBP", JP: "JPY", SG: "SGD", HK: "HKD", CA: "CAD", AU: "AUD", NZ: "NZD",
    CN: "CNY", TW: "TWD", KR: "KRW", MY: "MYR", TH: "THB", ID: "IDR", VN: "VND", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", IL: "ILS", TR: "TRY", EG: "EGP", LB: "LBP",
    CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", RU: "RUB", UA: "UAH", ZA: "ZAR", NG: "NGN", KE: "KES", GH: "GHS", MA: "MAD",
    MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", BN: "BND", MO: "MOP", KH: "KHR", MM: "MMK", LA: "LAK", IQ: "IQD", IR: "IRR", KZ: "KZT", IS: "ISK" };
  "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" ").forEach(function (c) { CC[c] = "EUR"; });
  var TZ = { "Asia/Manila": "PH", "Asia/Bahrain": "BH", "Asia/Riyadh": "SA", "Asia/Dubai": "AE", "Asia/Kuwait": "KW", "Asia/Qatar": "QA", "Asia/Muscat": "OM", "Asia/Tokyo": "JP", "Asia/Singapore": "SG",
    "Asia/Hong_Kong": "HK", "Asia/Seoul": "KR", "Asia/Taipei": "TW", "Asia/Kuala_Lumpur": "MY", "Asia/Bangkok": "TH", "Asia/Jakarta": "ID", "Asia/Kolkata": "IN", "Europe/London": "GB" };
  var el = null, rates = null, at = 0, src = "", busy = false, failed = false;
  var st = { from: "", to: "", amt: 1 };

  function I(n, c) { return window.TMN_ICON ? TMN_ICON(n, c) : ""; }
  function esc(s) { return window.TMN_UI ? TMN_UI.esc(s) : String(s); }
  function loc() { return window.TMN_I18N && TMN_I18N.locale || undefined; }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Pera ng bansa mo: lugar ng Weather → timezone → wika ng phone
  function homeCurrency() {
    var cc = "";
    try { var w = read("tmnWeather"); cc = (w && w.place && w.place.cc) || ""; } catch (e) {}
    if (!cc) try { cc = TZ[Intl.DateTimeFormat().resolvedOptions().timeZone] || ""; } catch (e) {}
    if (!cc) { var m = /[-_]([A-Za-z]{2})\b/.exec(navigator.language || ""); cc = m ? m[1] : ""; }
    return CC[String(cc).toUpperCase()] || "USD";
  }
  var names = null;
  function name(code) {
    try { names = names || new Intl.DisplayNames([loc() || "en"], { type: "currency" }); var n = names.of(code); return n && n !== code ? n : ""; } catch (e) { return ""; }
  }
  function fmt(v) {
    if (!isFinite(v)) return "—";
    var d = v >= 100 ? 2 : v >= 1 ? 4 : v >= 0.01 ? 5 : 8;
    return v.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: v >= 100 ? 2 : 0 });
  }
  function rate(a, b) { return rates && rates[a] && rates[b] ? rates[b] / rates[a] : NaN; }
  function ago(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 2) return "just now"; if (m < 60) return m + " min ago";
    var h = Math.round(m / 60); return h < 48 ? h + " h ago" : Math.round(h / 24) + " days ago";
  }

  async function getJSON(url) {
    var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, 12000);
    try { var r = await fetch(url, { signal: ctrl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  async function fetchRates() {
    try {
      var a = await getJSON(API);
      if (a && a.result === "success" && a.rates && a.rates.USD) return { rates: a.rates, src: "open.er-api.com" };
    } catch (e) {}
    var b = await getJSON(API2), out = {};
    Object.keys((b && b.usd) || {}).forEach(function (k) { if (/^[a-z]{3}$/.test(k)) out[k.toUpperCase()] = b.usd[k]; });
    if (!out.USD) throw new Error("No rates");
    return { rates: out, src: "currency-api" };
  }
  async function load(force) {
    if (busy) return;
    var c = read(RKEY);
    if (c && c.rates && !rates) { rates = c.rates; at = c.at; src = c.src || ""; paint(); }
    if (!force && c && Date.now() - c.at < TTL) return;
    if (!navigator.onLine) { failed = !rates; paint(); return; }
    busy = true; paint();
    try { var r = await fetchRates(); rates = r.rates; src = r.src; at = Date.now(); failed = false; write(RKEY, { at: at, rates: rates, src: src }); }
    catch (e) { failed = !rates; }
    busy = false; paint();
  }

  function codes() {
    var all = Object.keys(rates || {}).filter(function (c) { return /^[A-Z]{3}$/.test(c) && (POPULAR.indexOf(c) >= 0 || name(c)); }).sort();
    var top = POPULAR.filter(function (c) { return all.indexOf(c) >= 0; });
    return { top: top, rest: all.filter(function (c) { return top.indexOf(c) < 0; }) };
  }
  function options(sel) {
    var c = codes(), o = function (x) { return '<option value="' + x + '"' + (x === sel ? " selected" : "") + ">" + x + (name(x) ? " · " + esc(name(x)) : "") + "</option>"; };
    return '<optgroup label="Popular">' + c.top.map(o).join("") + '</optgroup><optgroup label="All">' + c.rest.map(o).join("") + "</optgroup>";
  }
  function paintResult() {
    var r = rate(st.from, st.to), amt = st.amt > 0 ? st.amt : 1;
    var big = el.querySelector(".fx-big"); if (!big) return;
    big.innerHTML = '<span class="fx-a" translate="no">' + fmt(amt) + " " + st.from + '</span><span class="fx-eq">=</span><b class="fx-b" translate="no">' + fmt(amt * r) + " " + st.to + "</b>";
    el.querySelector(".fx-one").textContent = "1 " + st.from + " = " + fmt(r) + " " + st.to + " · 1 " + st.to + " = " + fmt(1 / r) + " " + st.from;
    el.querySelector(".fx-more").innerHTML = POPULAR.filter(function (c) { return c !== st.from && c !== st.to && rates[c]; }).slice(0, 4).map(function (c) {
      return '<button type="button" class="fx-chip" data-to="' + c + '" title="' + esc(name(c)) + '"><span>' + c + '</span><b translate="no">' + fmt(amt * rate(st.from, c)) + "</b></button>";
    }).join("");
  }
  function paint() {
    if (!el) return;
    var head = '<div class="rm-head"><h3 class="side-title">💱 Exchange rate</h3>' +
      '<button type="button" class="icon-btn fx-refresh' + (busy ? " spin" : "") + '" aria-label="Refresh rates" title="Refresh">' + I("refresh", "ic-sm") + "</button></div>";
    if (!rates) {
      el.innerHTML = head + '<p class="faint small rm-empty">' + (busy ? "Getting today’s rates…" : failed ? "Couldn’t get the rates. Check your internet, then tap refresh." : "Getting today’s rates…") + "</p>";
      return;
    }
    if (!rates[st.from]) st.from = "USD";
    if (!rates[st.to] || st.to === st.from) st.to = st.from === "USD" ? "PHP" : "USD";
    el.innerHTML = head +
      '<div class="fx-row">' +
        '<label class="fx-amt"><span class="sr-only">Amount</span><input class="input" type="number" inputmode="decimal" min="0" step="any" value="' + st.amt + '" aria-label="Amount"></label>' +
        '<select class="input fx-from" aria-label="From currency">' + options(st.from) + "</select>" +
        '<button type="button" class="icon-btn fx-swap" aria-label="Swap currencies" title="Swap">⇄</button>' +
        '<select class="input fx-to" aria-label="To currency">' + options(st.to) + "</select>" +
      "</div>" +
      '<div class="fx-big" aria-live="polite"></div>' +
      '<p class="faint small fx-one" translate="no"></p>' +
      '<div class="fx-more" role="group" aria-label="Other currencies"></div>' +
      '<p class="faint small fx-foot">Updated ' + ago(at) + (navigator.onLine ? "" : " · offline") + ". Mid-market rate, a guide only — banks and remittance centers use their own. <a href=\"https://www.exchangerate-api.com\" target=\"_blank\" rel=\"noopener\">Rates by Exchange Rate API</a></p>";
    paintResult();
  }
  function save() { write(KEY, { from: st.from, to: st.to, amt: st.amt }); }

  function mount(node) {
    el = node; if (!el) return;
    var s = read(KEY) || {};
    st.from = /^[A-Z]{3}$/.test(s.from || "") ? s.from : homeCurrency();
    st.to = /^[A-Z]{3}$/.test(s.to || "") ? s.to : (st.from === "USD" ? "PHP" : "USD");
    st.amt = s.amt > 0 ? Number(s.amt) : 1;
    el.addEventListener("click", function (e) {
      if (e.target.closest(".fx-refresh")) { load(true); return; }
      if (e.target.closest(".fx-swap")) { var t = st.from; st.from = st.to; st.to = t; save(); paint(); return; }
      var c = e.target.closest("[data-to]"); if (c) { st.to = c.dataset.to; save(); paint(); }
    });
    el.addEventListener("change", function (e) {
      if (e.target.classList.contains("fx-from")) { st.from = e.target.value; if (st.to === st.from) st.to = st.from === "USD" ? "PHP" : "USD"; save(); paint(); }
      if (e.target.classList.contains("fx-to")) { st.to = e.target.value; if (st.to === st.from) st.from = st.to === "USD" ? "PHP" : "USD"; save(); paint(); }
    });
    el.addEventListener("input", function (e) {
      if (!e.target.closest(".fx-amt")) return;
      var v = parseFloat(e.target.value); st.amt = v > 0 ? Math.min(v, 1e12) : 1; save(); paintResult();
    });
    paint(); load();
    window.addEventListener("online", function () { load(); });
  }
  window.TMN_FX = { mount: mount, _home: homeCurrency };
  var auto = document.getElementById("fx"); if (auto) mount(auto);
})();
