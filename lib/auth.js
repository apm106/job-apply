const crypto = require("crypto");

const ACCESS_COOKIE = "ocg_access_token";
const REFRESH_COOKIE = "ocg_refresh_token";
const CSRF_COOKIE = "ocg_csrf_token";
const OAUTH_STATE_COOKIE = "ocg_oauth_state";
const OAUTH_VERIFIER_COOKIE = "ocg_oauth_verifier";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_ATTEMPTS = 10;
const rateStore = new Map();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function supabaseUrl() {
  return requireEnv("SUPABASE_URL").replace(/\/+$/, "");
}

function anonKey() {
  return requireEnv("SUPABASE_ANON_KEY");
}

function serviceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function cookieDomain() {
  return process.env.AUTH_COOKIE_DOMAIN || undefined;
}

function appBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }

  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }

  parts.push(`Path=${options.path || "/"}`);

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  return parts.join("; ");
}

function setCookies(res, cookies) {
  res.setHeader("Set-Cookie", cookies);
}

function setAuthCookies(res, accessToken, refreshToken) {
  const common = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    domain: cookieDomain()
  };

  setCookies(res, [
    serializeCookie(ACCESS_COOKIE, accessToken, {
      ...common,
      maxAge: 60 * 60
    }),
    serializeCookie(REFRESH_COOKIE, refreshToken, {
      ...common,
      maxAge: 60 * 60 * 24 * 30
    })
  ]);
}

function clearAuthCookies(res) {
  const common = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    domain: cookieDomain(),
    maxAge: 0
  };

  setCookies(res, [
    serializeCookie(ACCESS_COOKIE, "", common),
    serializeCookie(REFRESH_COOKIE, "", common)
  ]);
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const parsed = {};

  raw.split(";").forEach((pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (!key) {
      return;
    }

    parsed[key] = decodeURIComponent(rest.join("="));
  });

  return parsed;
}

function createRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function createCsrfToken() {
  return createRandomToken(24);
}

function setCsrfCookie(res, token) {
  const cookie = serializeCookie(CSRF_COOKIE, token, {
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "Lax",
    domain: cookieDomain(),
    maxAge: 60 * 60 * 2
  });

  setCookies(res, [cookie]);
}

function readRequestBody(req) {
  return req.body || {};
}

function requestOriginMatches(req) {
  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }

  const host = req.headers.host;
  return origin.includes(host);
}

function requireCsrf(req) {
  const cookies = parseCookies(req);
  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = cookies[CSRF_COOKIE];

  if (!requestOriginMatches(req)) {
    return { ok: false, error: "Invalid origin" };
  }

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return { ok: false, error: "Invalid CSRF token" };
  }

  return { ok: true };
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(req, routeKey) {
  const now = Date.now();
  const key = `${routeKey}:${clientIp(req)}`;
  const current = rateStore.get(key);

  if (!current || current.resetAt < now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }

  if (current.count >= RATE_LIMIT_ATTEMPTS) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  rateStore.set(key, current);
  return { ok: true };
}

function validEmail(email) {
  return /.+@.+\..+/.test(email);
}

function validatePassword(password) {
  const longEnough = password.length >= 12;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z\d]/.test(password);

  return longEnough && hasLower && hasUpper && hasDigit && hasSpecial;
}

function genericAuthError() {
  return "Invalid credentials.";
}

function toUserSummary(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    providers: user.app_metadata?.providers || []
  };
}

async function supabaseRequest(path, options = {}) {
  const url = `${supabaseUrl()}${path}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: options.useServiceRole ? serviceRoleKey() : anonKey(),
    ...options.headers
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function createCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CSRF_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  appBaseUrl,
  checkRateLimit,
  clearAuthCookies,
  createCodeChallenge,
  createCsrfToken,
  createRandomToken,
  genericAuthError,
  parseCookies,
  readRequestBody,
  requireCsrf,
  serializeCookie,
  setAuthCookies,
  setCsrfCookie,
  setCookies,
  supabaseRequest,
  toUserSummary,
  validatePassword,
  validEmail
};
