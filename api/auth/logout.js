const {
  ACCESS_COOKIE,
  clearAuthCookies,
  parseCookies,
  requireCsrf,
  supabaseRequest
} = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const csrf = requireCsrf(req);
  if (!csrf.ok) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const cookies = parseCookies(req);
  const accessToken = cookies[ACCESS_COOKIE];

  if (accessToken) {
    await supabaseRequest("/auth/v1/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).catch(() => null);
  }

  clearAuthCookies(res);
  return res.status(200).json({ ok: true });
};
