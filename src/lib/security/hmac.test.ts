import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyShopifyWebhook, verifyShopifyQuery } from "./hmac.server";

const SECRET = "shpss_test_secret";

describe("verifyShopifyWebhook", () => {
  const body = JSON.stringify({ id: 1, title: "T" });
  const digest = createHmac("sha256", SECRET).update(body).digest("base64");

  it("accepts a valid signature", () => {
    expect(verifyShopifyWebhook(body, digest, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyShopifyWebhook(body + "x", digest, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyShopifyWebhook(body, digest, "other_secret")).toBe(false);
  });

  it("rejects missing header / secret", () => {
    expect(verifyShopifyWebhook(body, null, SECRET)).toBe(false);
    expect(verifyShopifyWebhook(body, digest, "")).toBe(false);
  });
});

describe("verifyShopifyQuery", () => {
  function sign(params: Record<string, string>) {
    const q = new URLSearchParams(params);
    const message = [...q.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return createHmac("sha256", SECRET).update(message).digest("hex");
  }

  it("accepts a valid query hmac", () => {
    const params = { code: "abc", shop: "demo.myshopify.com", timestamp: "1" };
    const hmac = sign(params);
    const query = new URLSearchParams({ ...params, hmac });
    expect(verifyShopifyQuery(query, SECRET)).toBe(true);
  });

  it("rejects a tampered parameter", () => {
    const params = { code: "abc", shop: "demo.myshopify.com", timestamp: "1" };
    const hmac = sign(params);
    const query = new URLSearchParams({ ...params, shop: "other.myshopify.com", hmac });
    expect(verifyShopifyQuery(query, SECRET)).toBe(false);
  });
});
