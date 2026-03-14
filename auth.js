const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const authTitle = document.getElementById("authTitle");
const authSubtext = document.getElementById("authSubtext");
const authMessage = document.getElementById("authMessage");
const toggleLabel = document.getElementById("toggleLabel");
const toggleMode = document.getElementById("toggleMode");

let mode = new URLSearchParams(window.location.search).get("mode") === "login" ? "login" : "signup";

function getCookie(name) {
  const parts = document.cookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function setMessage(message, tone = "") {
  authMessage.textContent = message;
  authMessage.className = tone;
}

function applyMode() {
  const login = mode === "login";

  signupForm.classList.toggle("hidden", login);
  loginForm.classList.toggle("hidden", !login);

  authTitle.textContent = login ? "Log in" : "Create account";
  authSubtext.textContent = login
    ? "Log in to access your profile area."
    : "Sign up to access your profile area.";

  toggleLabel.textContent = login ? "Need an account?" : "Already have an account?";
  toggleMode.textContent = login ? "Sign up" : "Log in";

  const url = new URL(window.location.href);
  url.searchParams.set("mode", mode);
  window.history.replaceState({}, "", url.toString());
}

async function ensureCsrf() {
  await fetch("/api/auth/csrf", {
    method: "GET"
  });
}

async function postJson(url, body) {
  const csrfToken = getCookie("ocg_csrf_token");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function onSignup(event) {
  event.preventDefault();
  const email = String(new FormData(signupForm).get("email") || "").trim();
  const password = String(new FormData(signupForm).get("password") || "");

  setMessage("Creating account...");

  const { response, data } = await postJson("/api/auth/signup", { email, password });
  if (!response.ok || !data.ok) {
    setMessage(data.error || "Signup failed.", "error");
    return;
  }

  setMessage("Check your email to verify your account before logging in.", "success");
  mode = "login";
  applyMode();
}

async function onLogin(event) {
  event.preventDefault();
  const email = String(new FormData(loginForm).get("email") || "").trim();
  const password = String(new FormData(loginForm).get("password") || "");

  setMessage("Logging in...");

  const { response, data } = await postJson("/api/auth/login", { email, password });
  if (!response.ok || !data.ok) {
    setMessage(data.error || "Login failed.", "error");
    return;
  }

  window.location.assign("/account.html");
}

async function onGoogleAuthClick() {
  setMessage("Redirecting to Google...");
  const { response, data } = await postJson("/api/auth/oauth/start", {
    provider: "google"
  });

  if (!response.ok || !data.ok || !data.url) {
    setMessage(data.error || "Google login failed.", "error");
    return;
  }

  window.location.assign(data.url);
}

function handleQueryMessages() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("verified") === "1") {
    setMessage("Email verified. You can now log in.", "success");
    mode = "login";
  }

  if (params.get("error")) {
    setMessage("Authentication failed. Please try again.", "error");
    mode = "login";
  }
}

toggleMode.addEventListener("click", () => {
  mode = mode === "login" ? "signup" : "login";
  setMessage("");
  applyMode();
});

signupForm.addEventListener("submit", onSignup);
loginForm.addEventListener("submit", onLogin);
document.querySelectorAll("button[data-oauth='google']").forEach((button) => {
  button.addEventListener("click", onGoogleAuthClick);
});

ensureCsrf().catch(() => null);
handleQueryMessages();
applyMode();
