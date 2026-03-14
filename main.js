const form = document.getElementById("waitlistForm");
const statusEl = document.getElementById("formStatus");

const analytics = {
  enabled: false,
  publicKey: "",
  host: "",
  distinctId: ""
};

function isValidEmail(email) {
  return /.+@.+\..+/.test(email);
}

function setStatus(message, tone) {
  statusEl.textContent = message;
  statusEl.className = tone;
}

function getDistinctId() {
  const key = "ocg_analytics_distinct_id";

  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      return existing;
    }

    const created =
      globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(key, created);
    return created;
  } catch (_error) {
    return `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function normalizeHost(host) {
  return String(host || "")
    .trim()
    .replace(/\/+$/, "");
}

async function track(event, properties = {}) {
  if (!analytics.enabled) {
    return;
  }

  try {
    await fetch(`${analytics.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: analytics.publicKey,
        event,
        properties: {
          distinct_id: analytics.distinctId,
          source: "frontend",
          ...properties
        }
      })
    });
  } catch (_error) {
    // Keep app behavior independent from analytics network issues.
  }
}

async function initAnalytics() {
  try {
    const response = await fetch("/api/analytics-config", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json().catch(() => null);
    if (!data?.publicKey || !data?.host) {
      return;
    }

    analytics.publicKey = String(data.publicKey).trim();
    analytics.host = normalizeHost(data.host);
    analytics.distinctId = getDistinctId();
    analytics.enabled = Boolean(analytics.publicKey && analytics.host);

    if (analytics.enabled) {
      track("landing_page_view", { page: "landing" });
    }
  } catch (_error) {
    analytics.enabled = false;
  }
}

initAnalytics();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name || !email) {
    setStatus("Please complete all fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    setStatus("Please enter a valid email address.", "error");
    return;
  }

  track("waitlist_submit_started", { form: "waitlist" });

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setStatus("Submitting...", "");

  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || "Something went wrong. Please try again.", "error");
      return;
    }

    form.reset();
    track("waitlist_submit_succeeded", { form: "waitlist" });
    setStatus("You're on the list. We'll reach out before launch.", "success");
  } catch (error) {
    setStatus("Network error. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
