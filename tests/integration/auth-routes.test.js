const signup = require("../../api/auth/signup");
const login = require("../../api/auth/login");
const me = require("../../api/auth/me");
const logout = require("../../api/auth/logout");
const { createReq, createRes } = require("../helpers/http");

function csrfHeaders() {
  return {
    host: "localhost:3000",
    cookie: "ocg_csrf_token=testcsrf",
    "x-csrf-token": "testcsrf",
    origin: "http://localhost:3000"
  };
}

describe("auth route integration", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.NODE_ENV = "production";
    global.fetch = vi.fn();
  });

  it("rejects weak signup password", async () => {
    const req = createReq({
      method: "POST",
      headers: csrfHeaders(),
      body: { email: "user@example.com", password: "weak" }
    });
    const res = createRes();

    await signup(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("sets auth cookies on login success", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "access", refresh_token: "refresh" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "u1", email_confirmed_at: "2026-01-01" })
      });

    const req = createReq({
      method: "POST",
      headers: csrfHeaders(),
      body: { email: "user@example.com", password: "StrongPass!234" }
    });
    const res = createRes();

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.headers["Set-Cookie"])).toBe(true);
  });

  it("returns unauthenticated when no tokens", async () => {
    const req = createReq({ method: "GET", headers: { host: "localhost:3000" } });
    const res = createRes();

    await me(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ authenticated: false });
  });

  it("clears auth cookies on logout", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });

    const req = createReq({
      method: "POST",
      headers: {
        ...csrfHeaders(),
        cookie: "ocg_csrf_token=testcsrf; ocg_access_token=abc"
      }
    });
    const res = createRes();

    await logout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.headers["Set-Cookie"])).toBe(true);
  });
});
