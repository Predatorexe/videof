import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";
import { logger } from "@/lib/logger";

/**
 * GDPR — customer requests a copy of their data.
 * Compile any data we hold for this customer and either email it or make it
 * available via a support ticket. Merchant is legally responsible; we record
 * the request and (optionally) forward it.
 */
export const Route = createFileRoute("/api/public/shopify/webhooks/customers-data-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse<{ customer?: { id: number; email?: string } }>(request);
        if (v instanceof Response) return v;
        logger.info("gdpr.customers_data_request", {
          domain: v.domain, customer: v.payload.customer?.email,
        });
        return ok();
      },
    },
  },
});
