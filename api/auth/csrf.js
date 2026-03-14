const { createCsrfToken, setCsrfCookie } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = createCsrfToken();
  setCsrfCookie(res, token);
  return res.status(200).json({ ok: true });
};
