const form = document.getElementById("waitlistForm");
const statusEl = document.getElementById("formStatus");

function isValidEmail(email) {
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

  if (!fullName || !email) {
    setStatus("Please complete all fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    setStatus("Please enter a valid email address.", "error");
    return;
  }

  const entry = {
    fullName,
    email,
    createdAt: new Date().toISOString()
  };

  const raw = localStorage.getItem("waitlistEntries");
  const list = raw ? JSON.parse(raw) : [];
  list.push(entry);
  localStorage.setItem("waitlistEntries", JSON.stringify(list));

  form.reset();
  setStatus("You're on the list. We'll reach out before launch.", "success");
});
