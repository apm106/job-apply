const ANALYTICS_DISTINCT_ID_KEY = "ocg_analytics_distinct_id";

const analyticsState = {
  enabled: false,
  publicKey: "",
  host: "",
  distinctId: ""
};

function normalizeHost(host) {
  return String(host || "")
    .trim()
    .replace(/\/+$/, "");
}

function generateDistinctId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateDistinctId() {
  try {
    const existing = localStorage.getItem(ANALYTICS_DISTINCT_ID_KEY);
    if (existing) {
      return existing;
    }

    const created = generateDistinctId();
    localStorage.setItem(ANALYTICS_DISTINCT_ID_KEY, created);
    return created;
  } catch (_error) {
    return generateDistinctId();
  }
}

function classifyApiError(status) {
  if (status === 400) {
    return "validation_error";
  }

  if (status === 409) {
    return "duplicate_email";
  }

  if (status >= 500) {
    return "server_error";
  }

  return "unknown_error";
}

async function capture(event, properties = {}) {
  if (!analyticsState.enabled) {
    return;
  }

  try {
    await fetch(`${analyticsState.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: analyticsState.publicKey,
        event,
        properties: {
          distinct_id: analyticsState.distinctId,
          source: "frontend",
          ...properties
        }
      })
    });
  } catch (_error) {
    // Intentionally swallow analytics failures.
  }
}

function registerCtaTracking() {
  const ctas = document.querySelectorAll("[data-cta-location]");

  ctas.forEach((element) => {
    element.addEventListener("click", () => {
      const ctaLocation = element.getAttribute("data-cta-location") || "unknown";
      capture("cta_click", { cta_location: ctaLocation });
    });
  });
}

async function init() {
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

    analyticsState.publicKey = String(data.publicKey).trim();
    analyticsState.host = normalizeHost(data.host);
    analyticsState.distinctId = getOrCreateDistinctId();
    analyticsState.enabled = Boolean(analyticsState.publicKey && analyticsState.host);

    if (!analyticsState.enabled) {
      return;
    }

    registerCtaTracking();
    capture("landing_page_view", { page: "landing" });
  } catch (_error) {
    analyticsState.enabled = false;
  }
}

globalThis.Analytics = {
  init,
  capture,
  classifyApiError
};

init();
