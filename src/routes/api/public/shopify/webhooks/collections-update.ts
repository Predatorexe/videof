import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";

interface CollectionPayload {
  id: number; title: string; handle: string; body_html?: string; image?: { src?: string };
}

export const Route = createFileRoute("/api/public/shopify/webhooks/collections-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse<CollectionPayload>(request);
        if (v instanceof Response) return v;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop } = await supabaseAdmin.from("shops").select("id").eq("shopify_domain", v.domain).maybeSingle();
        if (!shop) return ok({ ignored: true });
        await supabaseAdmin.from("collections").upsert({
          shop_id: shop.id,
          shopify_collection_id: String(v.payload.id),
          title: v.payload.title,
          handle: v.payload.handle,
          description: v.payload.body_html,
          image_url: v.payload.image?.src ?? null,
        } as never, { onConflict: "shop_id,shopify_collection_id" });
        return ok();
      },
    },
  },
});
