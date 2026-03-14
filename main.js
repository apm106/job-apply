const form = document.getElementById("waitlistForm");
const statusEl = document.getElementById("formStatus");

function isValidEmail(email) {
  return /.+@.+\..+/.test(email);
}

function setStatus(message, tone) {
  statusEl.textContent = message;
  statusEl.className = tone;
}

function track(event, properties) {
  if (globalThis.Analytics && typeof globalThis.Analytics.capture === "function") {
    globalThis.Analytics.capture(event, properties);
  }
}

function classifyError(status) {
  if (globalThis.Analytics && typeof globalThis.Analytics.classifyApiError === "function") {
    return globalThis.Analytics.classifyApiError(status);
  }

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name || !email) {
    track("waitlist_submit_failed", {
      form: "waitlist",
      error_type: "validation_missing_fields"
    });
    setStatus("Please complete all fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    track("waitlist_submit_failed", {
      form: "waitlist",
      error_type: "validation_invalid_email"
    });
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
      track("waitlist_submit_failed", {
        form: "waitlist",
        error_type: classifyError(response.status)
      });
      setStatus(data.error || "Something went wrong. Please try again.", "error");
      return;
    }

    form.reset();
    track("waitlist_submit_succeeded", { form: "waitlist" });
    setStatus("You're on the list. We'll reach out before launch.", "success");
  } catch (error) {
    track("waitlist_submit_failed", {
      form: "waitlist",
      error_type: "network_error"
    });
    setStatus("Network error. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
