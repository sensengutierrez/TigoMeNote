/* TigoMeNote · pages/login.js (login.html)
   Sign in / Create account gamit ang auth-fast. */
(function () {
  var C = window.TMN_CONFIG, K = C.storageKeys, I = window.TMN_ICON;
  var $ = function (id) { return document.getElementById(id); };

  var form = $("authForm"), btn = $("authBtn"), msg = $("authMsg");
  var fName = $("fName"), fUser = $("fUser"), fPass = $("fPass"), fRemember = $("fRemember");
  var params = new URLSearchParams(location.search);
  var mode = params.get("mode") === "register" ? "register" : "login";
  var busy = false;

  // Saan babalik pagka-login (same site lang, para walang open redirect)
  function nextUrl() {
    var n = params.get("next") || "";
    if (n && n.charAt(0) === "/" && n.charAt(1) !== "/" && n.indexOf("login.html") === -1) return n;
    return C.root + "app/home.html";
  }

  // Naka-login na? Diretso sa app.
  try {
    if (localStorage.getItem(K.token) || sessionStorage.getItem(K.token)) { location.replace(nextUrl()); return; }
  } catch (e) {}

  // Theme button
  var tBtn = document.querySelector(".js-theme");
  function paintTheme() { tBtn.innerHTML = I(window.TMN_THEME.current() === "dark" ? "sun" : "moon"); }
  tBtn.addEventListener("click", function () { window.TMN_THEME.toggle(); });
  document.addEventListener("tmn:theme", paintTheme);
  paintTheme();

  // Show / hide password
  var pBtn = $("togglePass");
  function paintEye() {
    var shown = fPass.type === "text";
    pBtn.innerHTML = I(shown ? "eyeOff" : "eye");
    pBtn.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  }
  pBtn.addEventListener("click", function () { fPass.type = fPass.type === "password" ? "text" : "password"; paintEye(); fPass.focus(); });
  paintEye();

  // Mode switch
  function setMode(m) {
    mode = m;
    var reg = m === "register";
    document.querySelectorAll(".reg-only").forEach(function (el) { el.classList.toggle("hidden", !reg); });
    $("tabLogin").setAttribute("aria-pressed", String(!reg));
    $("tabRegister").setAttribute("aria-pressed", String(reg));
    $("authTitle").textContent = reg ? "Create your account" : "Welcome back";
    $("authSub").textContent = reg ? "Libre. Ilang segundo lang." : "Mag-sign in para ituloy ang Daily mo.";
    btn.textContent = reg ? "Create account" : "Sign in";
    fPass.autocomplete = reg ? "new-password" : "current-password";
    document.title = (reg ? "Create account" : "Sign in") + " · " + C.appName;
    hideMsg();
    [fName, fUser, fPass].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var u = new URL(location.href);
    if (reg) u.searchParams.set("mode", "register"); else u.searchParams.delete("mode");
    history.replaceState(null, "", u);
  }
  document.querySelector(".auth-tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-mode]");
    if (b && !busy) setMode(b.dataset.mode);
  });

  // Username: lowercase, allowed chars lang
  fUser.addEventListener("input", function () {
    var clean = fUser.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    if (clean !== fUser.value) fUser.value = clean;
  });

  // Password strength (register)
  var meter = document.querySelector(".strength");
  fPass.addEventListener("input", function () {
    var v = fPass.value, s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    meter.dataset.level = v ? Math.max(1, s) : 0;
    $("passHint").textContent = !v ? "At least 8 characters." :
      v.length < 8 ? (8 - v.length) + " more character" + (8 - v.length === 1 ? "" : "s") + "." :
      ["Weak", "Weak", "Okay", "Good", "Strong"][s] + " password.";
  });

  function showMsg(text, ok) { msg.textContent = text; msg.classList.toggle("ok", !!ok); msg.classList.remove("hidden"); }
  function hideMsg() { msg.classList.add("hidden"); }
  function invalid(el, text) { el.setAttribute("aria-invalid", "true"); el.focus(); showMsg(text); return false; }

  function validate() {
    [fName, fUser, fPass].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    if (mode === "register" && !fName.value.trim()) return invalid(fName, "Ilagay ang display name mo.");
    if (!fUser.value) return invalid(fUser, "Ilagay ang username.");
    if (mode === "register" && !/^[a-z0-9_.]{3,24}$/.test(fUser.value)) return invalid(fUser, "Username: 3–24 letters, numbers, _ o . lang.");
    if (!fPass.value) return invalid(fPass, "Ilagay ang password.");
    if (mode === "register" && fPass.value.length < 8) return invalid(fPass, "Password: at least 8 characters.");
    return true;
  }

  function setBusy(b) {
    busy = b;
    btn.disabled = b;
    btn.innerHTML = b ? '<span class="spinner"></span>' + (mode === "register" ? "Creating…" : "Signing in…")
                      : (mode === "register" ? "Create account" : "Sign in");
  }

  function saveSession(res) {
    var keep = fRemember.checked;
    try {
      [localStorage, sessionStorage].forEach(function (s) { s.removeItem(K.token); s.removeItem(K.user); });
      var store = keep ? localStorage : sessionStorage;
      store.setItem(K.token, res.token);
      store.setItem(K.user, JSON.stringify(res.user));
      sessionStorage.setItem(K.checkedAt, String(Date.now()));
    } catch (e) {
      showMsg("Hindi ma-save ang login sa browser na ito (private mode?).");
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (busy || !validate()) return;
    hideMsg();
    setBusy(true);
    try {
      var payload = { username: fUser.value, password: fPass.value };
      if (mode === "register") payload.display_name = fName.value.trim();
      var res = await window.TMN_API.call("auth", mode, payload);
      if (res.pending) {
        setBusy(false);
        setMode("login");
        showMsg(res.message || "Account ginawa na. Hintayin ang approval.", true);
        return;
      }
      if (saveSession(res)) location.replace(nextUrl());
      else setBusy(false);
    } catch (err) {
      setBusy(false);
      var t = err.message;
      if (err.data && err.data.tries_left) t += " (" + err.data.tries_left + " tries left)";
      showMsg(t);
      if (err.status === 409) fUser.setAttribute("aria-invalid", "true");
    }
  });

  setMode(mode);
  (mode === "register" ? fName : fUser).focus();
})();
