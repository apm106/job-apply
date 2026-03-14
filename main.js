const form = document.getElementById("waitlistForm");
const statusEl = document.getElementById("formStatus");

function isValidEmail(email) {
  return /.+@.+\..+/.test(email);
}

function setStatus(message, tone) {
  statusEl.textContent = message;
  statusEl.className = tone;
}

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

    if (data.alreadyVerified) {
      setStatus("This email is already verified and on the waitlist.", "success");
      return;
    }

    setStatus("Check your email to confirm your waitlist signup.", "success");
  } catch (error) {
    setStatus("Network error. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
