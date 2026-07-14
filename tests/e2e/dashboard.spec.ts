import { test, expect } from "@playwright/test";

test.describe("Merchant dashboard smoke", () => {
  test("dashboard route renders shell", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Videofy/i);
    // App shell markers are always in the DOM regardless of auth state.
    await expect(page.locator("body")).toBeVisible();
  });

  test("videos, widgets, billing routes respond", async ({ page }) => {
    for (const path of ["/videos", "/widgets", "/billing"]) {
      const res = await page.goto(path);
      expect(res?.status(), `route ${path} should not 5xx`).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
