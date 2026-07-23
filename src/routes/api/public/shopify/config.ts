/**
 * GET /api/public/shopify/config
 *
 * Exposes only the public Shopify API key so the browser can bootstrap
 * App Bridge. Never returns the secret. Cached at the edge because the
 * value is stable for the lifetime of the deployment.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/shopify/config")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env.SHOPIFY_API_KEY ?? "";
        return new Response(JSON.stringify({ apiKey }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control":
              "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        });
      },
    },
  },
});
