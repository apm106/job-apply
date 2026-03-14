const accountMessage = document.getElementById("accountMessage");
const accountDetails = document.getElementById("accountDetails");
const logoutBtn = document.getElementById("logoutBtn");

function getCookie(name) {
  const parts = document.cookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

async function ensureCsrf() {
  await fetch("/api/auth/csrf", {
    method: "GET"
  });
}

function renderUser(user) {
  document.getElementById("detailId").textContent = user.id || "-";
  document.getElementById("detailEmail").textContent = user.email || "-";
  document.getElementById("detailCreatedAt").textContent = user.createdAt || "-";
  document.getElementById("detailProviders").textContent = Array.isArray(user.providers)
    ? user.providers.join(", ")
    : "-";

  accountMessage.textContent = "Authenticated user details:";
  accountDetails.classList.remove("hidden");
}

async function loadMe() {
  const response = await fetch("/api/auth/me", { method: "GET" });
  const data = await response.json().catch(() => ({}));

  if (!data.authenticated || !data.user) {
    window.location.assign("/auth.html?mode=login");
    return;
  }

  renderUser(data.user);
}

async function logout() {
  const csrfToken = getCookie("ocg_csrf_token");
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    accountMessage.textContent = "Logout failed. Try again.";
    return;
  }

  window.location.assign("/auth.html?mode=login");
}

ensureCsrf().catch(() => null);
loadMe().catch(() => {
  window.location.assign("/auth.html?mode=login");
});
logoutBtn.addEventListener("click", logout);
