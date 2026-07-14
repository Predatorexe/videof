import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";

/** GDPR — erase customer data. */
export const Route = createFileRoute("/api/public/shopify/webhooks/customers-redact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse<{ customer?: { id: number } }>(request);
        if (v instanceof Response) return v;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop } = await supabaseAdmin.from("shops").select("id").eq("shopify_domain", v.domain).maybeSingle();
        if (shop && v.payload.customer?.id) {
          await supabaseAdmin.from("customers").delete()
            .eq("shop_id", shop.id).eq("shopify_customer_id", String(v.payload.customer.id));
        }
        return ok();
      },
    },
  },
});
