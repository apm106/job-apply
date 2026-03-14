const {
  checkRateLimit,
  genericAuthError,
  readRequestBody,
  requireCsrf,
  setAuthCookies,
  supabaseRequest,
  validEmail
} = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rate = checkRateLimit(req, "login");
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

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, error: genericAuthError() });
  }

  const login = await supabaseRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  if (!login.ok || !login.data?.access_token || !login.data?.refresh_token) {
    return res.status(401).json({ ok: false, error: genericAuthError() });
  }

  const user = await supabaseRequest("/auth/v1/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${login.data.access_token}`
    }
  });

  if (!user.ok || !user.data?.email_confirmed_at) {
    return res
      .status(403)
      .json({ ok: false, error: "Please verify your email before logging in." });
  }

  setAuthCookies(res, login.data.access_token, login.data.refresh_token);
  return res.status(200).json({ ok: true });
};
