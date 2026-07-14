/**
 * Storefront analytics ingestion endpoint.
 * Called by the Theme App Extension loader. Anonymous; RLS lets anon
 * INSERT rows whose shop_id belongs to an installed shop.
 */
import { createFileRoute } from "@tanstack/react-router";
import { analyticsBatchSchema } from "@/lib/validation/schemas";
import { AnalyticsService } from "@/lib/services/analytics/analytics-service.server";
import { rateLimit } from "@/lib/security/rate-limit.server";
import { toErrorDTO } from "@/lib/errors";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/analytics/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
          rateLimit({ key: `track:${ip}`, max: 120, windowMs: 60_000 });

          const body = await request.json();
          const parsed = analyticsBatchSchema.parse(body);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const svc = new AnalyticsService(supabaseAdmin);
          const result = await svc.ingest(parsed.events);
          return new Response(JSON.stringify(result), {
            status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (err) {
          const dto = toErrorDTO(err);
          return new Response(JSON.stringify(dto), {
            status: dto.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
