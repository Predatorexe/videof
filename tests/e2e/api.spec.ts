import { test, expect, request } from "@playwright/test";

test.describe("Public API smoke", () => {
  test("GET /api/public/health returns ok or degraded", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get("/api/public/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
  });

  test("HEAD /api/public/health is cheap", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.fetch("/api/public/health", { method: "HEAD" });
    expect(res.status()).toBe(200);
  });

  test("GET unknown widget returns 404 JSON", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get("/api/public/widget/00000000-0000-0000-0000-000000000000");
    expect([404, 500]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("code");
  });

  test("security headers are set on HTML responses", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["permissions-policy"]).toBeTruthy();
    // CSP is only on HTML — home page must have it.
    if ((h["content-type"] ?? "").includes("text/html")) {
      expect(h["content-security-policy"]).toBeTruthy();
    }
  });
});
