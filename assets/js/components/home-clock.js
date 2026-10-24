/* TigoMeNote · components/home-clock.js — "Pinas ⇄ dito": dalawang orasan para sa pamilyang magkalayo
     TMN_HOMECLOCK.mount(el)
   Laging may 🇵🇭 Philippines. Ang isa: oras ng device mo (hal. 🇧🇭 Bahrain); kung nasa Pinas ka, Bahrain ang ipapakita.
   May hint kung magandang oras tumawag (8 AM – 10 PM sa kabila). */
(function () {
  var PH = "Asia/Manila";
  var NAMES = { "Asia/Bahrain": ["🇧🇭", "Bahrain"], "Asia/Riyadh": ["🇸🇦", "Saudi Arabia"], "Asia/Dubai": ["🇦🇪", "UAE"], "Asia/Qatar": ["🇶🇦", "Qatar"],
    "Asia/Kuwait": ["🇰🇼", "Kuwait"], "Asia/Muscat": ["🇴🇲", "Oman"], "Asia/Singapore": ["🇸🇬", "Singapore"], "Asia/Hong_Kong": ["🇭🇰", "Hong Kong"],
    "Asia/Tokyo": ["🇯🇵", "Japan"], "Europe/London": ["🇬🇧", "UK"], "America/New_York": ["🇺🇸", "New York"], "America/Los_Angeles": ["🇺🇸", "Los Angeles"], "Asia/Manila": ["🇵🇭", "Philippines"] };
  function hourIn(tz) { return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date())); }
  function mount(el) {
    var mine = "Asia/Bahrain";
    try { mine = Intl.DateTimeFormat().resolvedOptions().timeZone || mine; } catch (e) {}
    var other = mine === PH ? "Asia/Bahrain" : mine;
    var on = NAMES[other] || ["🕒", other.split("/").pop().replace(/_/g, " ")];
    var loc = window.TMN_I18N ? TMN_I18N.locale : undefined;
    function t(tz) { return new Date().toLocaleTimeString(loc, { timeZone: tz, hour: "numeric", minute: "2-digit" }); }
    function d(tz) { return new Date().toLocaleDateString(loc, { timeZone: tz, weekday: "short" }); }
    function paint() {
      var far = mine === PH ? other : PH, h = hourIn(far);
      var ok = h >= 8 && h < 22;
      el.innerHTML = '<h3 class="side-title">Pinas ⇄ ' + (mine === PH ? "abroad" : "here") + "</h3>" +
        '<div class="hc">' +
          '<div class="hc-c"><span class="hc-f">🇵🇭</span><b translate="no">' + t(PH) + '</b><span class="faint small">Philippines · ' + d(PH) + "</span></div>" +
          '<div class="hc-c"><span class="hc-f">' + on[0] + '</span><b translate="no">' + t(other) + '</b><span class="faint small">' + on[1] + " · " + d(other) + "</span></div></div>" +
        '<p class="hc-hint small ' + (ok ? "ok" : "late") + '">' + (ok ? "📞 Good time to call " + (mine === PH ? "them" : "home") : "😴 It's late " + (mine === PH ? "there" : "in the Philippines")) + "</p>";
    }
    paint();
    setInterval(paint, 30000);
  }
  window.TMN_HOMECLOCK = { mount: mount };
})();
