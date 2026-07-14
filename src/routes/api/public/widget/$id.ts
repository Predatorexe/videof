/**
 * Public widget config endpoint.
 * Returns the published version's config so the storefront loader can render
 * without hitting Shopify. Cached at the edge for 60s.
 */
import { createFileRoute } from "@tanstack/react-router";
import { toErrorDTO, NotFoundError } from "@/lib/errors";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/widget/$id")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: widget, error } = await supabaseAdmin.from("widgets")
            .select("id, shop_id, type, name, handle, status, config, custom_css, published_version_id")
            .eq("id", params.id).eq("status", "published").maybeSingle();
          if (error) throw new Error(error.message);
          if (!widget) throw new NotFoundError("widget");

          const { data: videoJoins } = await supabaseAdmin.from("widget_videos")
            .select("position, video:videos(id, title, hls_url, mp4_url, poster_url, thumbnail_url, duration_seconds)")
            .eq("widget_id", widget.id).order("position", { ascending: true });

          return new Response(JSON.stringify({ widget, videos: videoJoins ?? [] }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60, s-maxage=60",
            },
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
