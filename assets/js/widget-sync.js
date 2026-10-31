/* TigoMeNote · widget-sync.js — APK ng TigoMeNote Chat lang (isinisingit ng apk/build-web.py)
   Isang trabaho lang: ibigay sa Messages widget ang session token at link ng inbox (TMNWidget.setAuth),
   at sabihing mag-refresh kapag binuksan o iniwan ang app. Ang widget mismo ang kumukuha ng messages (MessagesWidget.java).
   Kapag nag-sign out (walang token), "Sign in" ang ipinapakita ng widget. */
(function () {
  if (!window.TMN_IN_APP || window.TMN_APP_ID !== "chat" || !window.TMNWidget) return;
  var W = window.TMNWidget, last = null;
  function sync(refresh) {
    var tok = "";
    try { tok = window.TMN_TOKEN || localStorage.getItem("tmnToken") || ""; } catch (e) {}
    var url = (window.TMN_CONFIG && TMN_CONFIG.fn && TMN_CONFIG.fn.messages) || "";
    try {
      if (tok + "|" + url !== last) { W.setAuth(tok, url); last = tok + "|" + url; refresh = true; }
      if (refresh) W.refresh();
    } catch (e) {}
  }
  sync(true);
  document.addEventListener("visibilitychange", function () { sync(document.hidden); });   // umalis sa app → update ang widget
  window.addEventListener("storage", function () { sync(true); });                        // sign in / sign out sa ibang page
})();
