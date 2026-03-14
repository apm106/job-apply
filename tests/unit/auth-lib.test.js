const {
  serializeCookie,
  validatePassword,
  validEmail,
  genericAuthError
} = require("../../lib/auth");

describe("auth lib", () => {
  it("validates strong passwords", () => {
    expect(validatePassword("Weakpass1")).toBe(false);
    expect(validatePassword("StrongPass!234")).toBe(true);
  });

  it("validates email format", () => {
    expect(validEmail("user@example.com")).toBe(true);
    expect(validEmail("not-an-email")).toBe(false);
  });

  it("serializes secure cookie flags", () => {
    const cookie = serializeCookie("token", "abc", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60
    });

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=60");
  });

  it("returns generic auth error", () => {
    expect(genericAuthError()).toBe("Invalid credentials.");
  });
});
