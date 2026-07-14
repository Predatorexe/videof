/**
 * Public widget config endpoint.
 * Returns the published widget config so the storefront loader can render
 * without hitting Shopify. Sanitizes merchant-supplied CSS before serving
 * to prevent CSS-injection / data-exfil, and enables edge caching with
 * stale-while-revalidate.
 */
import { createFileRoute } from "@tanstack/react-router";
import { toErrorDTO, NotFoundError } from "@/lib/errors";
import { sanitizeWidgetCss } from "@/lib/security/css-sanitizer";
import { rateLimit } from "@/lib/security/rate-limit.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/widget/$id")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request, params }) => {
        try {
          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for") ??
            "unknown";
          // Cheap abuse cap. Real per-widget global limits belong in an edge KV / DO.
          rateLimit({ key: `widget:${ip}`, max: 600, windowMs: 60_000 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: widget, error } = await supabaseAdmin
            .from("widgets")
            .select(
              "id, shop_id, type, name, handle, status, config, custom_css, published_version_id",
            )
            .eq("id", params.id)
            .eq("status", "published")
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!widget) throw new NotFoundError("widget");

          const { data: videoJoins } = await supabaseAdmin
            .from("widget_videos")
            .select(
              "position, video:videos(id, title, hls_url, mp4_url, poster_url, thumbnail_url, duration_seconds)",
            )
            .eq("widget_id", widget.id)
            .order("position", { ascending: true });

          const sanitized = sanitizeWidgetCss(widget.custom_css as string | null);
          const safeWidget = { ...widget, custom_css: sanitized.css };

          return new Response(
            JSON.stringify({ widget: safeWidget, videos: videoJoins ?? [] }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                // Edge-cache 60s; serve stale up to 5 min while re-validating.
                "Cache-Control":
                  "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
                Vary: "Accept-Encoding",
              },
            },
          );
        } catch (err) {
          const dto = toErrorDTO(err);
          return new Response(JSON.stringify(dto), {
            status: dto.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
