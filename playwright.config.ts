import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright smoke suite — runs against the running dev server.
 * Assumes `bun run dev` is up on http://localhost:8080. In CI the
 * workflow starts it via `webServer` below.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.CI
    ? {
        command: "bun run build && bun run preview --port 8080",
        url: "http://localhost:8080",
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : undefined,
});
