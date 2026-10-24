/* TigoMeNote · pages/login.js (login.html)
   Screens: Sign in / Create account (authView), Verify email (verifyView), Forgot password (resetView).
   Daloy ng bagong user: Create account → 6-digit code sa email → Verify → pasok sa app.
   Forgot password: username/email → code sa email → code + bagong password → pasok sa app. */
(function () {
  if (window.TMN_I18N) TMN_I18N.mountPicker(document.getElementById("langMini"));
  var C = window.TMN_CONFIG, K = C.storageKeys, I = window.TMN_ICON;
  var $ = function (id) { return document.getElementById(id); };
  var VERIFY_KEY = "tmnVerify"; // naaalala ang verify screen kahit i-refresh

  var form = $("authForm"), btn = $("authBtn"), msg = $("authMsg");
  var fName = $("fName"), fEmail = $("fEmail"), fBirth = $("fBirth"), fUser = $("fUser"), fPass = $("fPass"), fRemember = $("fRemember");
  var params = new URLSearchParams(location.search);
  var mode = params.get("mode") === "register" ? "register" : "login";
  var busy = false;
  var card = document.querySelector(".auth-card"), swapTimer = 0;
  var views = { auth: $("authView"), verify: $("verifyView"), reset: $("resetView") };

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

  // ================= Shared helpers =================
  var tBtn = document.querySelector(".js-theme");
  function paintTheme() { tBtn.innerHTML = I(window.TMN_THEME.current() === "dark" ? "sun" : "moon"); }
  tBtn.addEventListener("click", function () { window.TMN_THEME.toggle(); });
  document.addEventListener("tmn:theme", paintTheme);
  paintTheme();

  // Show / hide password button
  function eye(button, input) {
    function paint() {
      var shown = input.type === "text";
      button.innerHTML = I(shown ? "eyeOff" : "eye");
      button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
    }
    button.addEventListener("click", function () { input.type = input.type === "password" ? "text" : "password"; paint(); input.focus(); });
    paint();
  }

  // Password strength meter
  function strength(input, meter, hint) {
    input.addEventListener("input", function () {
      var v = input.value, s = 0;
      if (v.length >= 8) s++;
      if (v.length >= 12) s++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
      if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
      meter.dataset.level = v ? Math.max(1, s) : 0;
      hint.textContent = !v ? "At least 8 characters." :
        v.length < 8 ? (8 - v.length) + " more character" + (8 - v.length === 1 ? "" : "s") + "." :
        ["Weak", "Weak", "Okay", "Good", "Strong"][s] + " password.";
    });
  }

  // 6 na code boxes: auto-next, backspace, arrows, paste ng buong code
  function makeOtp(container, onFull) {
    var boxes = [].slice.call(container.querySelectorAll("input"));
    function code() { return boxes.map(function (b) { return b.value; }).join(""); }
    function clear() { boxes.forEach(function (b) { b.value = ""; b.classList.remove("bad"); }); }
    function spread(digits, from) {
      digits = digits.replace(/\D/g, "").slice(0, 6 - from);
      for (var i = 0; i < digits.length; i++) boxes[from + i].value = digits[i];
      boxes[Math.min(from + digits.length, 5)].focus();
      if (code().length === 6) onFull();
    }
    boxes.forEach(function (b, i) {
      b.addEventListener("input", function () {
        var v = b.value.replace(/\D/g, "");
        b.classList.remove("bad");
        if (v.length > 1) { b.value = ""; spread(v, i); return; }   // autofill / paste sa isang box
        b.value = v;
        if (v && i < 5) boxes[i + 1].focus();
        if (code().length === 6) onFull();
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
    return {
      code: code,
      clear: clear,
      focus: function () { var c = code().length; boxes[Math.min(c, 5)].focus({ preventScroll: true }); },
      bad: function () {
        boxes.forEach(function (b) { b.classList.add("bad"); });
        container.classList.remove("shake"); void container.offsetWidth; container.classList.add("shake");
        clear(); boxes[0].focus();
      }
    };
  }

  // Resend button na may countdown
  function makeCountdown(button) {
    var timer = 0, until = 0;
    function tick() {
      var left = Math.ceil((until - Date.now()) / 1000);
      if (left > 0) { button.disabled = true; button.textContent = "Resend code (" + left + "s)"; }
      else { button.disabled = false; button.textContent = "Resend code"; clearInterval(timer); }
    }
    return {
      start: function (seconds) { until = Date.now() + Math.max(0, seconds || 0) * 1000; clearInterval(timer); tick(); timer = setInterval(tick, 1000); },
      stop: function () { clearInterval(timer); },
      until: function () { return until; }
    };
  }

  function alertBox(el) {
    return {
      show: function (text, ok) { el.textContent = text; el.classList.toggle("ok", !!ok); el.classList.remove("hidden"); },
      hide: function () { el.classList.add("hidden"); }
    };
  }

  function busyBtn(button, on, label, busyLabel) {
    button.disabled = on;
    button.innerHTML = on ? '<span class="spinner"></span>' + busyLabel : label;
  }

  function errText(err) {
    var t = err.message;
    if (err.data && err.data.tries_left) t += " (" + err.data.tries_left + " tries left)";
    return t;
  }

  // Email na nakalimutan ang @ (hal. "juangmail.com") → paalala bago ipadala
  function missingAt(v) { return v.indexOf("@") === -1 && /\.(com|net|org|ph|sa|co)$/i.test(v); }

  // Fade-out ng card, palit ng laman, fade-in
  function swap(fn) {
    clearTimeout(swapTimer);
    card.classList.add("swap-out");
    swapTimer = setTimeout(function () { fn(); card.classList.remove("swap-out"); }, 260);
  }

  function showView(name, instant, after) {
    var go = function () {
      Object.keys(views).forEach(function (k) { views[k].classList.toggle("hidden", k !== name); });
      if (after) after();
    };
    instant ? go() : swap(go);
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

  // ================= Sign in ↔ Create account =================
  var main = alertBox(msg);
  eye($("togglePass"), fPass);
  strength(fPass, document.querySelector("#authView .strength"), $("passHint"));

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
    swap(function () { fill(reg); (reg ? fName : fUser).focus({ preventScroll: true }); });
  }

  function fill(reg) {
    document.querySelectorAll(".reg-only").forEach(function (el) { el.classList.toggle("hidden", !reg); });
    document.querySelectorAll(".login-only").forEach(function (el) { el.classList.toggle("hidden", reg); });
    $("authTitle").textContent = reg ? "Create your account" : "Welcome back";
    $("authSub").textContent = reg ? "Free. Takes only a few seconds." : "Sign in to continue your Daily.";
    // Sign in: username O email. Create account: username lang (may @ sa harap)
    $("fUserLabel").textContent = reg ? "Username" : "Username or email";
    $("userWrap").classList.toggle("no-at", !reg);
    fUser.maxLength = reg ? 24 : 254;
    fUser.placeholder = reg ? "yourname" : "yourname or you@gmail.com";
    if (reg) fUser.value = fUser.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24);
    btn.textContent = reg ? "Create account" : "Sign in";
    fPass.autocomplete = reg ? "new-password" : "current-password";
    document.title = (reg ? "Create account" : "Sign in") + " · " + C.appName;
    main.hide();
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

  function age(iso) {
    var b = new Date(iso + "T00:00:00"), n = new Date(), a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  function invalid(el, text) { el.setAttribute("aria-invalid", "true"); el.focus(); main.show(text); return false; }

  function validate() {
    [fName, fEmail, fBirth, fUser, fPass].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var reg = mode === "register";
    if (reg && !fName.value.trim()) return invalid(fName, "Enter your display name.");
    if (reg && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fEmail.value.trim())) return invalid(fEmail, "Enter a valid email address.");
    if (reg && !fBirth.value) return invalid(fBirth, "Enter your birthdate.");
    if (reg && age(fBirth.value) < 13) return invalid(fBirth, "TigoMeNote is for ages 13 and up.");
    if (!fUser.value) return invalid(fUser, reg ? "Enter a username." : "Enter your username or email.");
    if (!reg && missingAt(fUser.value)) return invalid(fUser, "This looks like an email but has no @. Example: name@gmail.com");
    if (reg && !/^[a-z0-9_.]{3,24}$/.test(fUser.value)) return invalid(fUser, "Username: 3–24 letters, numbers, _ or . only.");
    if (!fPass.value) return invalid(fPass, "Enter your password.");
    if (reg && fPass.value.length < 8) return invalid(fPass, "Password: at least 8 characters.");
    return true;
  }

  function setBusy(b) {
    busy = b;
    busyBtn(btn, b, mode === "register" ? "Create account" : "Sign in", mode === "register" ? "Creating…" : "Signing in…");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (busy || !validate()) return;
    main.hide();
    setBusy(true);
    try {
      var payload = { username: fUser.value.trim(), password: fPass.value };
      if (mode === "register") { payload.display_name = fName.value.trim(); payload.email = fEmail.value.trim(); payload.birthdate = fBirth.value; }
      var res = await window.TMN_API.call("auth", mode, payload);
      setBusy(false);
      if (res.verify) { openVerify(res); return; }
      if (res.pending) { setMode("login", true); main.show(res.message || "Please wait for admin approval.", true); return; }
      if (saveSession(res)) location.replace(nextUrl());
      else main.show("Can't save your sign-in in this browser (private mode?).");
    } catch (err) {
      setBusy(false);
      main.show(errText(err));
      if (err.status === 409) (err.data.field === "email" ? fEmail : fUser).setAttribute("aria-invalid", "true");
      if (err.data && err.data.field === "birthdate") fBirth.setAttribute("aria-invalid", "true");
    }
  });

  function backToSignIn(prefill) {
    showView("auth", false, function () {
      if (mode === "register") setMode("login", true); else fill(false);
      if (prefill) fUser.value = prefill;
      fPass.value = "";
      (prefill ? fPass : fUser).focus({ preventScroll: true });
    });
  }

  // ================= Verify email =================
  var vMsg = alertBox($("vMsg")), vBtn = $("vBtn");
  var vCd = makeCountdown($("vResend"));
  var vOtp = makeOtp($("otp"), function () { submitVerify(); });
  var pending = null; // { username, email_masked, until }
  var vBusy = false;

  function remember() { try { sessionStorage.setItem(VERIFY_KEY, JSON.stringify({ username: pending.username, email_masked: pending.email_masked, until: vCd.until() })); } catch (e) {} }

  function openVerify(res, instant) {
    pending = { username: res.username, email_masked: res.email_masked };
    showView("verify", instant, function () {
      $("vEmail").textContent = pending.email_masked || "your email";
      document.title = "Verify email · " + C.appName;
      vOtp.clear(); vMsg.hide();
      if (res.warning) vMsg.show(res.warning);
      else if (res.sent === false && !instant) vMsg.show("We already sent you a code. Check your email.", true);
      vCd.start(res.resend_in || 0);
      remember();
      vOtp.focus();
    });
  }

  function closeVerify() {
    pending = null;
    vCd.stop();
    try { sessionStorage.removeItem(VERIFY_KEY); } catch (e) {}
    backToSignIn();
  }

  async function submitVerify() {
    if (vBusy || !pending) return;
    var c = vOtp.code();
    if (c.length !== 6) { vMsg.show("Enter the 6-digit code."); vOtp.focus(); return; }
    vMsg.hide();
    vBusy = true; busyBtn(vBtn, true, "Verify email", "Verifying…");
    try {
      var res = await window.TMN_API.call("auth", "verifyEmail", { username: pending.username, code: c });
      if (res.pending) {
        vBusy = false; busyBtn(vBtn, false, "Verify email");
        try { sessionStorage.removeItem(VERIFY_KEY); } catch (e) {}
        vMsg.show(res.message || "Verified! Please wait for admin approval.", true);
        return;
      }
      if (saveSession(res)) { vMsg.show("Verified! Signing you in…", true); location.replace(nextUrl()); }
      else { vBusy = false; busyBtn(vBtn, false, "Verify email"); vMsg.show("Verified! But your sign-in can't be saved in this browser. Please sign in again."); }
    } catch (err) {
      vBusy = false; busyBtn(vBtn, false, "Verify email");
      if (err.data && err.data.already) { vMsg.show(err.message, true); setTimeout(closeVerify, 1500); return; }
      vMsg.show(errText(err));
      vOtp.bad();
      if (err.data && err.data.expired) { vCd.start(0); remember(); }
    }
  }

  $("verifyForm").addEventListener("submit", function (e) { e.preventDefault(); submitVerify(); });

  $("vResend").addEventListener("click", async function () {
    var b = this;
    if (!pending || b.disabled) return;
    b.disabled = true; b.textContent = "Sending…";
    try {
      var res = await window.TMN_API.call("auth", "resendCode", { username: pending.username });
      vCd.start(res.resend_in || 60);
      if (res.email_masked) { pending.email_masked = res.email_masked; $("vEmail").textContent = res.email_masked; }
      vMsg.show("We sent a new code.", true);
      vOtp.clear(); vOtp.focus();
    } catch (err) {
      vCd.start((err.data && err.data.resend_in) || 0);
      vMsg.show(err.message);
    }
    remember();
  });

  $("vBack").addEventListener("click", closeVerify);

  // ================= Forgot password =================
  var rId = $("rId"), rPass = $("rPass");
  var rMsg1 = alertBox($("rMsg1")), rMsg2 = alertBox($("rMsg2"));
  var rBtn1 = $("rBtn1"), rBtn2 = $("rBtn2");
  var rCd = makeCountdown($("rResend"));
  var rOtp = makeOtp($("otp2"), function () { rPass.focus(); });
  var rIdentifier = "", rBusy = false;
  eye($("rEye"), rPass);
  rPass.addEventListener("input", function () { rMsg2.hide(); });
  strength(rPass, $("rStrength"), $("rHint"));

  function resetStep(step) {
    var two = step === 2;
    $("rForm1").classList.toggle("hidden", two);
    $("rForm2").classList.toggle("hidden", !two);
    $("rResend").classList.toggle("hidden", !two);
    $("rDot").classList.toggle("hidden", !two);
    $("rTitle").textContent = two ? "Enter the code" : "Forgot password?";
    $("rSub").textContent = two
      ? "If an account matches “" + rIdentifier + "”, we sent a 6-digit code to its email. Enter the code and your new password."
      : "Enter your username or email. We'll send you a 6-digit code.";
  }

  $("forgotLink").addEventListener("click", function () {
    var pre = fUser.value.trim();
    showView("reset", false, function () {
      document.title = "Reset password · " + C.appName;
      rMsg1.hide(); rMsg2.hide();
      rId.value = pre;
      resetStep(1);
      rId.focus({ preventScroll: true });
    });
  });

  $("rForm1").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (rBusy) return;
    var id = rId.value.trim().toLowerCase();
    if (!id) { rMsg1.show("Enter your username or email."); rId.focus(); return; }
    if (missingAt(id)) { rMsg1.show("This looks like an email but has no @. Example: name@gmail.com"); rId.focus(); return; }
    rMsg1.hide();
    rBusy = true; busyBtn(rBtn1, true, "Send code", "Sending…");
    try {
      var res = await window.TMN_API.call("auth", "forgotPassword", { identifier: id });
      rIdentifier = id;
      swap(function () {
        resetStep(2);
        rOtp.clear(); rPass.value = ""; rMsg2.hide();
        rCd.start(res.resend_in || 60);
        rOtp.focus();
      });
    } catch (err) {
      rMsg1.show(err.message);
    }
    rBusy = false; busyBtn(rBtn1, false, "Send code");
  });

  $("rForm2").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (rBusy) return;
    var c = rOtp.code();
    if (c.length !== 6) { rMsg2.show("Enter the 6-digit code."); rOtp.focus(); return; }
    if (rPass.value.length < 8) { rMsg2.show("New password: at least 8 characters."); rPass.focus(); return; }
    rMsg2.hide();
    rBusy = true; busyBtn(rBtn2, true, "Change password", "Saving…");
    try {
      var res = await window.TMN_API.call("auth", "resetPassword", { identifier: rIdentifier, code: c, password: rPass.value });
      if (res.token && saveSession(res)) { rMsg2.show("Password changed! Signing you in…", true); location.replace(nextUrl()); return; }
      rBusy = false; busyBtn(rBtn2, false, "Change password");
      rCd.stop();
      backToSignIn(rIdentifier);
      setTimeout(function () { main.show(res.message || "Password changed. Please sign in.", true); }, 300);
    } catch (err) {
      rBusy = false; busyBtn(rBtn2, false, "Change password");
      rMsg2.show(errText(err));
      if (err.status === 401 || (err.data && err.data.expired)) rOtp.bad();
      if (err.data && err.data.expired) rCd.start(0);
    }
  });

  $("rResend").addEventListener("click", async function () {
    var b = this;
    if (b.disabled || !rIdentifier) return;
    b.disabled = true; b.textContent = "Sending…";
    try {
      var res = await window.TMN_API.call("auth", "forgotPassword", { identifier: rIdentifier });
      rCd.start(res.resend_in || 60);
      rMsg2.show("We sent a new code.", true);
      rOtp.clear(); rOtp.focus();
    } catch (err) {
      rCd.start((err.data && err.data.resend_in) || 0);
      rMsg2.show(err.message);
    }
  });

  $("rBack").addEventListener("click", function () { rCd.stop(); backToSignIn(rIdentifier || rId.value.trim()); });

  // ================= Start =================
  setMode(mode, true);
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(VERIFY_KEY) || "null"); } catch (e) {}
  if (saved && saved.username) {
    openVerify({ username: saved.username, email_masked: saved.email_masked, resend_in: Math.max(0, ((saved.until || 0) - Date.now()) / 1000) }, true);
  } else {
    (mode === "register" ? fName : fUser).focus();
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.remove("no-anim"); }); });
})();
