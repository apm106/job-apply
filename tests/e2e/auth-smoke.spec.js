const { test, expect } = require("@playwright/test");

test("redirects unauthenticated user from account to login", async ({ page }) => {
  await page.route("**/api/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
      headers: {
        "set-cookie": "ocg_csrf_token=testcsrf; Path=/"
      }
    });
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: false })
    });
  });

  await page.goto("/account.html");
  await expect(page).toHaveURL(/auth\.html\?mode=login/);
});

test("login form redirects to account when API succeeds", async ({ page }) => {
  await page.route("**/api/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
      headers: {
        "set-cookie": "ocg_csrf_token=testcsrf; Path=/"
      }
    });
  });

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        user: {
          id: "user-1",
          email: "test@example.com",
          createdAt: "2026-01-01T00:00:00.000Z",
          providers: ["email"]
        }
      })
    });
  });

  await page.goto("/auth.html?mode=login");
  await page.fill("#loginEmail", "test@example.com");
  await page.fill("#loginPassword", "StrongPass!234");
  await page.click("#loginForm button[type='submit']");

  await expect(page).toHaveURL(/account\.html/);
  await expect(page.locator("#detailEmail")).toHaveText("test@example.com");
});
