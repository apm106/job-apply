const {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  appBaseUrl,
  createCodeChallenge,
  createRandomToken,
  readRequestBody,
  requireCsrf,
  serializeCookie,
  setCookies
} = require("../../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const csrf = requireCsrf(req);
  if (!csrf.ok) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const body = readRequestBody(req);
  const provider = String(body.provider || "").toLowerCase();
  if (provider !== "google") {
    return res.status(400).json({ ok: false, error: "Unsupported provider" });
  }

  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!base || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ ok: false, error: "Auth is not configured" });
  }

  const state = createRandomToken(24);
  const verifier = createRandomToken(48);
  const challenge = createCodeChallenge(verifier);

  const cookieCommon = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 10
  };

  setCookies(res, [
    serializeCookie(OAUTH_STATE_COOKIE, state, cookieCommon),
    serializeCookie(OAUTH_VERIFIER_COOKIE, verifier, cookieCommon)
  ]);

  const params = new URLSearchParams({
    provider,
    redirect_to: `${appBaseUrl(req)}/api/auth/callback`,
    code_challenge: challenge,
    code_challenge_method: "s256",
    state
  });

  return res.status(200).json({
    ok: true,
    url: `${base}/auth/v1/authorize?${params.toString()}`
  });
};
