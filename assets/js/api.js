/* TigoMeNote · api.js
   Isang paraan ng pagtawag sa edge functions:
     TMN_API.call("auth", "login", { username, password })
   Kusang dinadagdag ang session token kapag naka-login. */
(function () {
  var C = window.TMN_CONFIG;

  function ApiError(message, status, data) {
    var e = new Error(message);
    e.status = status; e.data = data || {};
    return e;
  }

  async function call(fnName, action, data, opts) {
    var url = C.fn[fnName];
    if (!url) throw ApiError("Unknown function: " + fnName, 0);
    opts = opts || {};
    var body = Object.assign({ action: action }, data || {});
    if (window.TMN_I18N && body.lang === undefined) body.lang = TMN_I18N.lang; // para sa email (code) sa tamang wika
    // "Simple request" (text/plain, token sa body): walang CORS preflight (OPTIONS) bago ang bawat tawag,
    // kaya isang biyahe lang papunta sa server imbes na dalawa. Ang functions ay nagbabasa ng p.token.
    var headers = { "Content-Type": "text/plain;charset=UTF-8" };
    if (window.TMN_TOKEN && body.token === undefined) body.token = window.TMN_TOKEN;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || 20000);
    var res, json;
    try {
      res = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: ctrl.signal });
    } catch (e) {
      throw ApiError(e.name === "AbortError" ? "The server took too long. Please try again." : "No internet, or the server can't be reached.", 0);
    } finally {
      clearTimeout(timer);
    }
    try { json = await res.json(); } catch (e) { json = {}; }
    if (!res.ok || json.ok === false) throw ApiError(json.error || ("Error " + res.status), res.status, json);
    return json;
  }

  window.TMN_API = { call: call };
})();
