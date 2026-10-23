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
    var headers = { "Content-Type": "application/json" };
    if (window.TMN_TOKEN) headers["x-session-token"] = window.TMN_TOKEN;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || 20000);
    var res, json;
    try {
      res = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: ctrl.signal });
    } catch (e) {
      throw ApiError(e.name === "AbortError" ? "Matagal sumagot ang server. Subukan ulit." : "Walang internet o hindi maabot ang server.", 0);
    } finally {
      clearTimeout(timer);
    }
    try { json = await res.json(); } catch (e) { json = {}; }
    if (!res.ok || json.ok === false) throw ApiError(json.error || ("Error " + res.status), res.status, json);
    return json;
  }

  window.TMN_API = { call: call };
})();
