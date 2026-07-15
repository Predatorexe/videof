import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";
import { logger } from "@/lib/logger";

/**
 * GDPR — customer requests a copy of their data.
 * Persists the request into `public.gdpr_requests` so we have an auditable
 * record for the merchant and for compliance evidence. The merchant remains
 * legally responsible for fulfilment.
 */
export const Route = createFileRoute("/api/public/shopify/webhooks/customers-data-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse<{ customer?: { id: number; email?: string } }>(request);
        if (v instanceof Response) return v;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("shopify_domain", v.domain)
          .maybeSingle();

        const { error } = await supabaseAdmin.from("gdpr_requests").insert({
          shop_id: shop?.id ?? null,
          shop_domain: v.domain,
          topic: "customers/data_request",
          customer_shopify_id: v.payload.customer?.id ? String(v.payload.customer.id) : null,
          customer_email: v.payload.customer?.email ?? null,
          payload: (v.payload ?? {}) as never,
          status: "received",
        });
        if (error) {
          logger.error("gdpr.customers_data_request.persist_failed", { message: error.message });
          // 500 tells Shopify to retry — we prefer that over dropping the record.
          return new Response("Persist failed", { status: 500 });
        }
        logger.info("gdpr.customers_data_request", {
          domain: v.domain, customer: v.payload.customer?.email,
        });
        return ok();
      },
    },
  },
});
