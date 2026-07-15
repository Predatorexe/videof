/**
 * Client-side TanStack functionMiddleware that attaches the current
 * Shopify App Bridge session token to every serverFn request as
 * `X-Shopify-Session-Token`. Runs alongside `attachSupabaseAuth`, which
 * owns the `Authorization` header — using a separate header prevents
 * either integration from clobbering the other.
 *
 * Outside the embedded Shopify admin, `getShopifySessionToken()` returns
 * null and the middleware is a no-op.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getShopifySessionToken } from "@/components/shopify-app-bridge";

export const attachShopifySessionToken = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await getShopifySessionToken();
    return next({
      headers: token ? { "X-Shopify-Session-Token": token } : {},
    });
  },
);
