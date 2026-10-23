/* TigoMeNote · pages/login.js (login.html)
   Sign in / Create account / Verify email gamit ang auth-fast.
   Daloy: Create account → 6-digit code sa email → Verify → pasok sa app. */
(function () {
  var C = window.TMN_CONFIG, K = C.storageKeys, I = window.TMN_ICON;
  var $ = function (id) { return document.getElementById(id); };
  var VERIFY_KEY = "tmnVerify"; // naaalala ang verify screen kahit i-refresh

  var form = $("authForm"), btn = $("authBtn"), msg = $("authMsg");
  var fName = $("fName"), fEmail = $("fEmail"), fUser = $("fUser"), fPass = $("fPass"), fRemember = $("fRemember");
  var params = new URLSearchParams(location.search);
  var mode = params.get("mode") === "register" ? "register" : "login";
  var busy = false;
  var card = document.querySelector(".auth-card"), swapTimer = 0;

  // Icons sa page: <i data-icon="mail">
  document.querySelectorAll("[data-icon]").forEach(function (el) {
    el.outerHTML = I(el.dataset.icon, el.dataset.size ? "ic-" + el.dataset.size : "");
  });

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

  // ================= Sign in ↔ Create account =================
  function setMode(m, instant) {
    mode = m;
    var reg = m === "register";
    // Panels nagpapalit ng puwesto (CSS: .is-register)
    document.body.classList.toggle("is-register", reg);
    $("tabLogin").setAttribute("aria-pressed", String(!reg));
    $("tabRegister").setAttribute("aria-pressed", String(reg));
    var u = new URL(location.href);
    if (reg) u.searchParams.set("mode", "register"); else u.searchParams.delete("mode");
    history.replaceState(null, "", u);

    if (instant) { fill(reg); return; }
    // Fade-out ng form, palit ng laman, fade-in
    swap(function () { fill(reg); (reg ? fName : fUser).focus({ preventScroll: true }); });
  }

  function swap(fn) {
    clearTimeout(swapTimer);
    card.classList.add("swap-out");
    swapTimer = setTimeout(function () { fn(); card.classList.remove("swap-out"); }, 260);
  }

  function fill(reg) {
    document.querySelectorAll(".reg-only").forEach(function (el) { el.classList.toggle("hidden", !reg); });
    $("authTitle").textContent = reg ? "Create your account" : "Welcome back";
    $("authSub").textContent = reg ? "Libre. Ilang segundo lang." : "Mag-sign in para ituloy ang Daily mo.";
    // Sign in: username O email. Create account: username lang (may @ sa harap)
    $("fUserLabel").textContent = reg ? "Username" : "Username o email";
    $("userWrap").classList.toggle("no-at", !reg);
    fUser.maxLength = reg ? 24 : 254;
    fUser.placeholder = reg ? "yourname" : "yourname o you@gmail.com";
    if (reg) fUser.value = fUser.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24);
    btn.textContent = reg ? "Create account" : "Sign in";
    fPass.autocomplete = reg ? "new-password" : "current-password";
    document.title = (reg ? "Create account" : "Sign in") + " · " + C.appName;
    hideMsg();
    [fName, fEmail, fUser, fPass].forEach(function (el) { el.removeAttribute("aria-invalid"); });
  }
  document.querySelector(".auth-tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-mode]");
    if (b && !busy && b.dataset.mode !== mode) setMode(b.dataset.mode);
  });

  // Username: lowercase; sa Create account letters/numbers/_/. lang
  fUser.addEventListener("input", function () {
    var v = fUser.value.toLowerCase();
    var clean = mode === "register" ? v.replace(/[^a-z0-9_.]/g, "") : v.replace(/\s/g, "");
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
    [fName, fEmail, fUser, fPass].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var reg = mode === "register";
    if (reg && !fName.value.trim()) return invalid(fName, "Ilagay ang display name mo.");
    if (reg && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fEmail.value.trim())) return invalid(fEmail, "Ilagay ang tamang email address.");
    if (!fUser.value) return invalid(fUser, reg ? "Ilagay ang username." : "Ilagay ang username o email.");
    if (reg && !/^[a-z0-9_.]{3,24}$/.test(fUser.value)) return invalid(fUser, "Username: 3–24 letters, numbers, _ o . lang.");
    if (!fPass.value) return invalid(fPass, "Ilagay ang password.");
    if (reg && fPass.value.length < 8) return invalid(fPass, "Password: at least 8 characters.");
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
      sessionStorage.removeItem(VERIFY_KEY);
    } catch (e) {
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
      var payload = { username: fUser.value.trim(), password: fPass.value };
      if (mode === "register") { payload.display_name = fName.value.trim(); payload.email = fEmail.value.trim(); }
      var res = await window.TMN_API.call("auth", mode, payload);
      setBusy(false);
      if (res.verify) { openVerify(res); return; }
      if (res.pending) { setMode("login", true); showMsg(res.message || "Hintayin ang approval ng admin.", true); return; }
      if (saveSession(res)) location.replace(nextUrl());
      else showMsg("Hindi ma-save ang login sa browser na ito (private mode?).");
    } catch (err) {
      setBusy(false);
      var t = err.message;
      if (err.data && err.data.tries_left) t += " (" + err.data.tries_left + " tries left)";
      showMsg(t);
      if (err.status === 409) (err.data.field === "email" ? fEmail : fUser).setAttribute("aria-invalid", "true");
    }
  });

  // ================= Verify email =================
  var vView = $("verifyView"), aView = $("authView");
  var vForm = $("verifyForm"), vBtn = $("vBtn"), vMsg = $("vMsg"), vResend = $("vResend");
  var boxes = [].slice.call(document.querySelectorAll("#otp input"));
  var pending = null;      // { username, email_masked, until }
  var cdTimer = 0, vBusy = false;

  function vShow(text, ok) { vMsg.textContent = text; vMsg.classList.toggle("ok", !!ok); vMsg.classList.remove("hidden"); }
  function vHide() { vMsg.classList.add("hidden"); }

  function remember() { try { sessionStorage.setItem(VERIFY_KEY, JSON.stringify(pending)); } catch (e) {} }

  function openVerify(res, instant) {
    pending = {
      username: res.username,
      email_masked: res.email_masked,
      until: Date.now() + (res.resend_in || 0) * 1000
    };
    remember();
    var go = function () {
      aView.classList.add("hidden");
      vView.classList.remove("hidden");
      $("vEmail").textContent = pending.email_masked || "email mo";
      document.title = "Verify email · " + C.appName;
      clearBoxes(); vHide();
      if (res.warning) vShow(res.warning);
      else if (res.sent === false && !instant) vShow("May code na kaming naipadala kanina. Tingnan ang email mo.", true);
      countdown();
      boxes[0].focus({ preventScroll: true });
    };
    instant ? go() : swap(go);
  }

  function closeVerify() {
    pending = null;
    try { sessionStorage.removeItem(VERIFY_KEY); } catch (e) {}
    clearInterval(cdTimer);
    swap(function () {
      vView.classList.add("hidden");
      aView.classList.remove("hidden");
      fill(mode === "register");
      if (mode === "register") setMode("login", true);
      fPass.value = "";
      fUser.focus({ preventScroll: true });
    });
  }

  function countdown() {
    clearInterval(cdTimer);
    function tick() {
      var left = Math.ceil(((pending && pending.until) - Date.now()) / 1000);
      if (left > 0) { vResend.disabled = true; vResend.textContent = "Resend code (" + left + "s)"; }
      else { vResend.disabled = false; vResend.textContent = "Resend code"; clearInterval(cdTimer); }
    }
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  // OTP boxes: auto-next, backspace, paste ng buong code
  function code() { return boxes.map(function (b) { return b.value; }).join(""); }
  function clearBoxes() { boxes.forEach(function (b) { b.value = ""; b.classList.remove("bad"); }); }
  function spread(digits, from) {
    digits = digits.replace(/\D/g, "").slice(0, 6 - from);
    for (var i = 0; i < digits.length; i++) boxes[from + i].value = digits[i];
    var next = Math.min(from + digits.length, 5);
    boxes[next].focus();
    if (code().length === 6) submitCode();
  }
  boxes.forEach(function (b, i) {
    b.addEventListener("input", function () {
      var v = b.value.replace(/\D/g, "");
      b.classList.remove("bad");
      if (v.length > 1) { b.value = ""; spread(v, i); return; }   // autofill / paste sa isang box
      b.value = v;
      if (v && i < 5) boxes[i + 1].focus();
      if (code().length === 6) submitCode();
    });
    b.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !b.value && i > 0) { boxes[i - 1].value = ""; boxes[i - 1].focus(); e.preventDefault(); }
      else if (e.key === "ArrowLeft" && i > 0) { boxes[i - 1].focus(); e.preventDefault(); }
      else if (e.key === "ArrowRight" && i < 5) { boxes[i + 1].focus(); e.preventDefault(); }
    });
    b.addEventListener("paste", function (e) {
      var t = (e.clipboardData || window.clipboardData).getData("text");
      if (t) { e.preventDefault(); spread(t, i); }
    });
    b.addEventListener("focus", function () { b.select(); });
  });

  function setVBusy(b) {
    vBusy = b;
    vBtn.disabled = b;
    vBtn.innerHTML = b ? '<span class="spinner"></span>Verifying…' : "Verify email";
  }

  async function submitCode() {
    if (vBusy || !pending) return;
    var c = code();
    if (c.length !== 6) { vShow("Ilagay ang 6-digit code."); boxes[c.length].focus(); return; }
    vHide();
    setVBusy(true);
    try {
      var res = await window.TMN_API.call("auth", "verifyEmail", { username: pending.username, code: c });
      if (res.pending) {
        setVBusy(false);
        try { sessionStorage.removeItem(VERIFY_KEY); } catch (e) {}
        vShow(res.message || "Verified! Hintayin ang approval ng admin.", true);
        return;
      }
      if (saveSession(res)) {
        vShow("Verified! Papasok na…", true);
        location.replace(nextUrl());
      } else {
        setVBusy(false);
        vShow("Verified na! Pero hindi ma-save ang login sa browser na ito. Mag-sign in ulit.");
      }
    } catch (err) {
      setVBusy(false);
      if (err.data && err.data.already) { vShow(err.message, true); setTimeout(closeVerify, 1500); return; }
      var t = err.message;
      if (err.data && err.data.tries_left) t += " (" + err.data.tries_left + " tries left)";
      vShow(t);
      boxes.forEach(function (b) { b.classList.add("bad"); });
      vView.querySelector(".otp").classList.remove("shake"); void vView.offsetWidth;
      vView.querySelector(".otp").classList.add("shake");
      clearBoxes();
      boxes[0].focus();
      if (err.data && err.data.expired) { pending.until = 0; remember(); countdown(); }
    }
  }

  vForm.addEventListener("submit", function (e) { e.preventDefault(); submitCode(); });

  vResend.addEventListener("click", async function () {
    if (!pending || vResend.disabled) return;
    vResend.disabled = true;
    vResend.textContent = "Sending…";
    try {
      var res = await window.TMN_API.call("auth", "resendCode", { username: pending.username });
      pending.until = Date.now() + (res.resend_in || 60) * 1000;
      if (res.email_masked) { pending.email_masked = res.email_masked; $("vEmail").textContent = res.email_masked; }
      vShow("Nagpadala ulit ng bagong code.", true);
      clearBoxes(); boxes[0].focus();
    } catch (err) {
      pending.until = Date.now() + ((err.data && err.data.resend_in) || 0) * 1000;
      vShow(err.message);
    }
    remember();
    countdown();
  });

  $("vBack").addEventListener("click", closeVerify);

  // ================= Start =================
  setMode(mode, true);
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(VERIFY_KEY) || "null"); } catch (e) {}
  if (saved && saved.username) {
    openVerify({ username: saved.username, email_masked: saved.email_masked, resend_in: Math.max(0, (saved.until - Date.now()) / 1000) }, true);
  } else {
    (mode === "register" ? fName : fUser).focus();
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.remove("no-anim"); }); });
})();
