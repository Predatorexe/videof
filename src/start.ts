import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { attachShopifySessionToken } from "@/lib/services/shopify/session-token-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Attach production security headers to every response.
 *
 * - CSP is tuned for the merchant dashboard (React + Google Fonts + Supabase
 *   REST/Realtime + Lovable AI). It is intentionally permissive on `img-src`
 *   and `media-src` because merchants upload videos and posters from any
 *   storage provider.
 * - Storefront widget/api/public/* responses are cross-origin JSON/beacon
 *   targets — CSP does not apply to them (no HTML), only the generic
 *   hardening headers (Referrer-Policy, X-Content-Type-Options, etc.) do.
 * - `frame-ancestors` allows Shopify admin embedding when the app is loaded
 *   inside App Bridge; adjust when the real Shopify domains are wired.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 'unsafe-inline' is required by React 19's inlined boot script emitted by TSS.
  "script-src 'self' 'unsafe-inline' https://cdn.shopify.com",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=(self)",
  "camera=()",
  "clipboard-read=(self)",
  "clipboard-write=(self)",
  "display-capture=()",
  "encrypted-media=(self)",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=(self)",
  "picture-in-picture=(self)",
  "usb=()",
].join(", ");

const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  const res = (result as { response?: Response }).response;
  if (!res || !(res instanceof Response)) return result;

  const ct = res.headers.get("content-type") ?? "";
  const url = new URL(request.url);
  const isPublicApi = url.pathname.startsWith("/api/public/");

  // Baseline headers applied to every response.
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // X-Frame-Options is a legacy header — CSP frame-ancestors below is the
  // modern equivalent and Shopify requires the app to be embeddable inside
  // https://admin.shopify.com and https://*.myshopify.com. Setting
  // X-Frame-Options: SAMEORIGIN here would block that embed in some
  // browsers, so we intentionally omit it and rely on frame-ancestors.
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  // Embedded apps share a top-level browsing context with Shopify Admin.
  // same-origin-allow-popups preserves that relationship while allowing
  // Shopify-owned OAuth and billing confirmation windows to communicate.
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.headers.set("Permissions-Policy", PERMISSIONS_POLICY);

  // CSP only makes sense on HTML documents. JSON/beacon endpoints don't
  // execute markup, and setting CSP on them can confuse crawlers.
  if (!isPublicApi && ct.includes("text/html")) {
    res.headers.set("Content-Security-Policy", CSP);
  }
  return result;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, attachShopifySessionToken],
  requestMiddleware: [errorMiddleware, securityHeadersMiddleware],
}));
