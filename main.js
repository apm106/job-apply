const form = document.getElementById("waitlistForm");
const statusEl = document.getElementById("formStatus");

function isUniversityEmail(email) {
  return /.+@.+\..+/.test(email);
}

function setStatus(message, tone) {
  statusEl.textContent = message;
  statusEl.className = tone;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const university = String(formData.get("university") || "").trim();
  const gradYear = Number(formData.get("gradYear"));

  if (!fullName || !email || !university || !gradYear) {
    setStatus("Please complete all fields.", "error");
    return;
  }

  if (!isUniversityEmail(email)) {
    setStatus("Please enter a valid email address.", "error");
    return;
  }

  if (gradYear < 2026 || gradYear > 2040) {
    setStatus("Graduation year must be between 2026 and 2040.", "error");
    return;
  }

  const entry = {
    fullName,
    email,
    university,
    gradYear,
    createdAt: new Date().toISOString()
  };

  const raw = localStorage.getItem("waitlistEntries");
  const list = raw ? JSON.parse(raw) : [];
  list.push(entry);
  localStorage.setItem("waitlistEntries", JSON.stringify(list));

  form.reset();
  setStatus("You're on the list. We'll reach out before launch.", "success");
});
