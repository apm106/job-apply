const {
  appBaseUrl,
  checkRateLimit,
  genericAuthError,
  readRequestBody,
  requireCsrf,
  supabaseRequest,
  validatePassword,
  validEmail
} = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rate = checkRateLimit(req, "signup");
  if (!rate.ok) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    return res.status(429).json({ ok: false, error: "Too many requests. Please try later." });
  }

  const csrf = requireCsrf(req);
  if (!csrf.ok) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const body = readRequestBody(req);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");

  if (!validEmail(email) || !validatePassword(password)) {
    return res.status(400).json({ ok: false, error: "Invalid signup input." });
  }

  const signup = await supabaseRequest("/auth/v1/signup", {
    method: "POST",
    body: {
      email,
      password,
      options: {
        emailRedirectTo: `${appBaseUrl(req)}/auth.html?verified=1`
      }
    }
  });

  if (!signup.ok) {
    return res.status(400).json({ ok: false, error: genericAuthError() });
  }

  return res.status(200).json({ ok: true });
};
