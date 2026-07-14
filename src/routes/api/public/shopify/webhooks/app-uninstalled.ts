import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";
import { logger } from "@/lib/logger";

export const Route = createFileRoute("/api/public/shopify/webhooks/app-uninstalled")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const verified = await verifyAndParse(request);
        if (verified instanceof Response) return verified;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("shops")
          .update({ uninstalled_at: new Date().toISOString(), access_token_encrypted: null } as never)
          .eq("shopify_domain", verified.domain);
        logger.info("shopify.webhook.app_uninstalled", { domain: verified.domain });
        return ok();
      },
    },
  },
});
