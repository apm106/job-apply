const {
  ACCESS_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  parseCookies,
  serializeCookie,
  setCookies,
  supabaseRequest
} = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const cookies = parseCookies(req);

  if (!code || !state || !cookies[OAUTH_STATE_COOKIE] || !cookies[OAUTH_VERIFIER_COOKIE]) {
    clearAuthCookies(res);
    res.writeHead(302, { Location: "/auth.html?error=oauth" });
    return res.end();
  }

  if (state !== cookies[OAUTH_STATE_COOKIE]) {
    clearAuthCookies(res);
    res.writeHead(302, { Location: "/auth.html?error=oauth_state" });
    return res.end();
  }

  const exchange = await supabaseRequest("/auth/v1/token?grant_type=pkce", {
    method: "POST",
    body: {
      auth_code: code,
      code_verifier: cookies[OAUTH_VERIFIER_COOKIE]
    }
  });

  const clearOauthCookies = [
    serializeCookie(OAUTH_STATE_COOKIE, "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 0
    }),
    serializeCookie(OAUTH_VERIFIER_COOKIE, "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 0
    })
  ];

  if (!exchange.ok || !exchange.data?.access_token || !exchange.data?.refresh_token) {
    setCookies(res, clearOauthCookies);
    clearAuthCookies(res);
    res.writeHead(302, { Location: "/auth.html?error=oauth_exchange" });
    return res.end();
  }

  const authCookies = [
    serializeCookie(ACCESS_COOKIE, exchange.data.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60
    }),
    serializeCookie(REFRESH_COOKIE, exchange.data.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30
    })
  ];

  setCookies(res, [...clearOauthCookies, ...authCookies]);

  res.writeHead(302, { Location: "/account.html" });
  return res.end();
};
