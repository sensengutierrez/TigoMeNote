/* TigoMeNote · components/home-clock.js — dalawang orasan para sa pamilyang magkalayo (hal. "Philippines ⇄ Bahrain")
     TMN_HOMECLOCK.mount(el)
   Simula: 🇵🇭 Philippines at ang oras ng device mo (kung nasa Pinas ka, Bahrain).
   Puwedeng palitan: pindot sa orasan → pili ng bansa/lungsod; ⇄ = pagpalitin ang dalawa. Naka-save sa device (localStorage "tmnClocks").
   May hint kung magandang oras tumawag (8 AM – 10 PM sa kabila). */
(function () {
  var KEY = "tmnClocks", PH = "Asia/Manila";
  var ZONES = [
    ["Asia/Manila", "🇵🇭", "Philippines"], ["Asia/Bahrain", "🇧🇭", "Bahrain"], ["Asia/Riyadh", "🇸🇦", "Saudi Arabia"], ["Asia/Dubai", "🇦🇪", "UAE"],
    ["Asia/Qatar", "🇶🇦", "Qatar"], ["Asia/Kuwait", "🇰🇼", "Kuwait"], ["Asia/Muscat", "🇴🇲", "Oman"], ["Asia/Jerusalem", "🇮🇱", "Israel"],
    ["Asia/Singapore", "🇸🇬", "Singapore"], ["Asia/Kuala_Lumpur", "🇲🇾", "Malaysia"], ["Asia/Hong_Kong", "🇭🇰", "Hong Kong"], ["Asia/Taipei", "🇹🇼", "Taiwan"],
    ["Asia/Shanghai", "🇨🇳", "China"], ["Asia/Tokyo", "🇯🇵", "Japan"], ["Asia/Seoul", "🇰🇷", "South Korea"], ["Asia/Bangkok", "🇹🇭", "Thailand"],
    ["Asia/Jakarta", "🇮🇩", "Indonesia"], ["Asia/Ho_Chi_Minh", "🇻🇳", "Vietnam"], ["Asia/Kolkata", "🇮🇳", "India"], ["Asia/Karachi", "🇵🇰", "Pakistan"],
    ["Australia/Sydney", "🇦🇺", "Sydney"], ["Australia/Perth", "🇦🇺", "Perth"], ["Pacific/Auckland", "🇳🇿", "New Zealand"], ["Pacific/Guam", "🇬🇺", "Guam"],
    ["Europe/London", "🇬🇧", "UK"], ["Europe/Dublin", "🇮🇪", "Ireland"], ["Europe/Paris", "🇫🇷", "France"], ["Europe/Berlin", "🇩🇪", "Germany"],
    ["Europe/Rome", "🇮🇹", "Italy"], ["Europe/Madrid", "🇪🇸", "Spain"], ["Europe/Amsterdam", "🇳🇱", "Netherlands"], ["Europe/Athens", "🇬🇷", "Greece"],
    ["Europe/Istanbul", "🇹🇷", "Turkey"], ["Europe/Moscow", "🇷🇺", "Russia"], ["Africa/Cairo", "🇪🇬", "Egypt"], ["Africa/Johannesburg", "🇿🇦", "South Africa"],
    ["America/New_York", "🇺🇸", "New York"], ["America/Chicago", "🇺🇸", "Chicago"], ["America/Denver", "🇺🇸", "Denver"], ["America/Los_Angeles", "🇺🇸", "Los Angeles"],
    ["Pacific/Honolulu", "🇺🇸", "Hawaii"], ["America/Anchorage", "🇺🇸", "Alaska"], ["America/Toronto", "🇨🇦", "Toronto"], ["America/Vancouver", "🇨🇦", "Vancouver"],
    ["America/Mexico_City", "🇲🇽", "Mexico"], ["America/Sao_Paulo", "🇧🇷", "Brazil"],
  ];
  function info(tz) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i][0] === tz) return { tz: tz, flag: ZONES[i][1], name: ZONES[i][2] };
    return { tz: tz, flag: "🕒", name: tz.split("/").pop().replace(/_/g, " ") };
  }
  function valid(tz) { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch (e) { return false; } }
  function device() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bahrain"; } catch (e) { return "Asia/Bahrain"; } }
  function read() {
    var s = null; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    if (s && valid(s.a) && valid(s.b)) return s;
    var mine = device();
    return { a: PH, b: mine === PH ? "Asia/Bahrain" : mine };
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function hourIn(tz) { return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date())); }

  function mount(el) {
    var st = read(), loc = window.TMN_I18N ? TMN_I18N.locale : undefined;
    function t(tz) { return new Date().toLocaleTimeString(loc, { timeZone: tz, hour: "numeric", minute: "2-digit" }); }
    function d(tz) { return new Date().toLocaleDateString(loc, { timeZone: tz, weekday: "short" }); }
    function card(k) {
      var z = info(st[k]);
      return '<button type="button" class="hc-c" data-pick="' + k + '" aria-label="Change ' + z.name + '">' +
        '<span class="hc-f">' + z.flag + '</span><b translate="no">' + t(z.tz) + '</b><span class="faint small">' + z.name + " · " + d(z.tz) + "</span>" +
        '<span class="hc-edit" aria-hidden="true">✎</span></button>';
    }
    function paint() {
      var A = info(st.a), B = info(st.b), mine = device();
      // ang "kabila": ang orasang hindi sa device mo (kung pareho, ang pangalawa)
      var far = st.a === mine ? B : st.b === mine ? A : B, h = hourIn(far.tz), ok = h >= 8 && h < 22;
      el.innerHTML = '<h3 class="side-title hc-title"><span>' + A.name + " ⇄ " + B.name + "</span></h3>" +
        '<div class="hc">' + card("a") +
          '<button type="button" class="hc-swap" aria-label="Swap the two clocks" title="Swap">⇄</button>' + card("b") + "</div>" +
        '<p class="hc-hint small ' + (ok ? "ok" : "late") + '">' + (ok ? "📞 Good time to call " + far.name : "😴 It's late in " + far.name) + "</p>";
    }
    function pick(k) {
      var body = document.createElement("div"); body.className = "hc-pick";
      body.innerHTML = '<input class="input hc-q" type="search" placeholder="Search a country or city" aria-label="Search">' +
        '<div class="hc-list" role="listbox"></div>';
      var list = body.querySelector(".hc-list"), q = body.querySelector(".hc-q");
      function draw() {
        var f = q.value.trim().toLowerCase();
        list.innerHTML = ZONES.filter(function (z) { return !f || z[2].toLowerCase().indexOf(f) >= 0 || z[0].toLowerCase().indexOf(f) >= 0; }).map(function (z) {
          return '<button type="button" class="hc-opt" role="option" aria-selected="' + (z[0] === st[k]) + '" data-tz="' + z[0] + '"><span class="hc-f">' + z[1] + "</span><b>" + z[2] + '</b><span class="faint small" translate="no">' + t(z[0]) + "</span></button>";
        }).join("") || '<p class="faint small">No match.</p>';
      }
      draw(); q.addEventListener("input", draw);
      var m = TMN_MODAL.open({ title: k === "a" ? "First clock" : "Second clock", size: "sm", cls: "modal-sheet", body: body });
      list.addEventListener("click", function (e) {
        var b = e.target.closest("[data-tz]"); if (!b) return;
        st[k] = b.dataset.tz; save(st); paint(); m.close();
      });
    }
    el.addEventListener("click", function (e) {
      if (e.target.closest(".hc-swap")) { st = { a: st.b, b: st.a }; save(st); paint(); return; }
      var c = e.target.closest("[data-pick]"); if (c && window.TMN_MODAL) pick(c.dataset.pick);
    });
    paint();
    setInterval(paint, 30000);
  }
  window.TMN_HOMECLOCK = { mount: mount };
})();
