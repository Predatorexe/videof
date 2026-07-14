import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";

interface ProductPayload {
  id: number; title: string; handle: string; vendor?: string; product_type?: string;
  status?: string; tags?: string; image?: { src?: string };
  variants?: Array<{ price?: string }>;
}

export const Route = createFileRoute("/api/public/shopify/webhooks/products-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const v = await verifyAndParse<ProductPayload>(request);
        if (v instanceof Response) return v;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop } = await supabaseAdmin.from("shops")
          .select("id, currency").eq("shopify_domain", v.domain).maybeSingle();
        if (!shop) return ok({ ignored: true });
        const prices = (v.payload.variants ?? []).map((x) => Number(x.price ?? 0)).filter(Number.isFinite);
        await supabaseAdmin.from("products").upsert({
          shop_id: shop.id,
          shopify_product_id: String(v.payload.id),
          title: v.payload.title,
          handle: v.payload.handle,
          vendor: v.payload.vendor,
          product_type: v.payload.product_type,
          status: v.payload.status,
          tags: v.payload.tags ? v.payload.tags.split(",").map((t) => t.trim()) : [],
          image_url: v.payload.image?.src ?? null,
          price_min: prices.length ? Math.min(...prices) : null,
          price_max: prices.length ? Math.max(...prices) : null,
          currency: shop.currency,
        } as never, { onConflict: "shop_id,shopify_product_id" });
        return ok();
      },
    },
  },
});
