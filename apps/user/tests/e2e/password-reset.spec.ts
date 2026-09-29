import { expect, test } from "@playwright/test";

/**
 * Password reset flow.
 *
 * The half that needs a real inbox (clicking the emailed link) cannot be
 * automated here, so these cover everything up to and including the request, plus
 * the behaviour of the page when it is reached without a valid recovery session.
 */

test.describe("/auth/reset-password", () => {
  test("offers the request form when there is no recovery session", async ({ page }) => {
    await page.goto("/auth/reset-password");

    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("prefills the email passed from the sign-in form", async ({ page }) => {
    await page.goto("/auth/reset-password?email=someone%40example.com");
    await expect(page.getByLabel("Email address")).toHaveValue("someone@example.com");
  });

  test("gives the same confirmation for a registered and an unregistered address", async ({ page }) => {
    const messages: string[] = [];

    for (const email of ["admin@looplic.local", "definitely-not-registered-9f3a2b@looplic.local"]) {
      await page.goto(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      await page.getByRole("button", { name: /send reset link/i }).click();

      const panel = page.getByText(/check your inbox/i);
      await expect(panel).toBeVisible({ timeout: 20_000 });

      const body = await page.getByText(/has a Looplic account/i).innerText();
      // Strip the echoed address so only the wording is compared.
      messages.push(body.replace(email, "<address>"));
    }

    expect(messages[0]).toBe(messages[1]);
  });

  test("can get back to sign in", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await page.getByRole("link", { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/auth$/);
  });

  test("is reachable from the sign-in form", async ({ page }) => {
    await page.goto("/auth");

    const forgot = page.getByRole("link", { name: /forgot your password/i });
    await expect(forgot).toBeVisible();
    await forgot.click();
    await expect(page).toHaveURL(/\/auth\/reset-password/);
  });

  test("shows the request form (not a broken update form) when the link is invalid", async ({ page }) => {
    await page.goto("/auth/reset-password?error=access_denied&error_description=Email+link+is+invalid+or+has+expired");

    // Must fall back to asking for a new link rather than presenting a password
    // form that cannot possibly work.
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });
});
