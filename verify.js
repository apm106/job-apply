const messageEl = document.getElementById("verifyMessage");

function setMessage(text, tone) {
  messageEl.textContent = text;
  messageEl.className = tone;
}

async function runVerification() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token") || "";
  const email = url.searchParams.get("email") || "";

  if (!token || !email) {
    setMessage("Verification link is incomplete.", "error");
    return;
  }

  try {
    const response = await fetch("/api/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token, email })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error || "Verification failed. Please request a new link.", "error");
      return;
    }

    if (data.alreadyVerified) {
      setMessage("Your email is already verified.", "success");
      return;
    }

    setMessage("Email verified. You are confirmed on the waitlist.", "success");
  } catch (error) {
    setMessage("Network error. Please try again.", "error");
  }
}

runVerification();
