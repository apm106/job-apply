const {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  parseCookies,
  setAuthCookies,
  supabaseRequest,
  toUserSummary
} = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookies = parseCookies(req);
  let accessToken = cookies[ACCESS_COOKIE];
  const refreshToken = cookies[REFRESH_COOKIE];

  if (!accessToken) {
    return res.status(200).json({ authenticated: false });
  }

  let user = await supabaseRequest("/auth/v1/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!user.ok && refreshToken) {
    const refresh = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: refreshToken }
    });

    if (refresh.ok && refresh.data?.access_token && refresh.data?.refresh_token) {
      setAuthCookies(res, refresh.data.access_token, refresh.data.refresh_token);
      accessToken = refresh.data.access_token;
      user = await supabaseRequest("/auth/v1/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }
  }

  if (!user.ok || !user.data?.id) {
    clearAuthCookies(res);
    return res.status(200).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: toUserSummary(user.data)
  });
};
