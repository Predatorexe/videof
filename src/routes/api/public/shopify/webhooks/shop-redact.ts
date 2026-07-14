import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";

/**
 * GDPR — erase all shop data 48h after uninstall.
 * Cascades from `shops` delete take care of every child table.
 */
export const Route = createFileRoute("/api/public/shopify/webhooks/shop-redact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse(request);
        if (v instanceof Response) return v;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("shops").delete().eq("shopify_domain", v.domain);
        return ok();
      },
    },
  },
});
