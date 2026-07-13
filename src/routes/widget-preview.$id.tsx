import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { defaultWidgetSettings, useWidgetsStore } from "@/stores/widgets-store";
import { useVideosStore } from "@/stores/videos-store";
import { useProductsStore } from "@/stores/products-store";
import { WidgetPlayer } from "@/components/widget/widget-player";
import { WidgetRenderer } from "@/components/widget/widget-renderer";

export const Route = createFileRoute("/widget-preview/$id")({
  head: () => ({
    meta: [
      { title: "Widget preview — Videofy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const widget = useWidgetsStore.getState().items.find((w) => w.id === params.id);
    if (!widget) throw notFound();
    return { id: params.id };
  },
  component: WidgetPreviewPage,
  notFoundComponent: () => (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="font-display text-3xl">Widget not found</div>
      <Button asChild variant="outline">
        <Link to="/widgets">Back to widgets</Link>
      </Button>
    </div>
  ),
});

function WidgetPreviewPage() {
  const { id } = Route.useLoaderData();
  const widget = useWidgetsStore((s) => s.items.find((w) => w.id === id));
  const settings = useWidgetsStore((s) => s.settings[id]) ?? defaultWidgetSettings;
  const meta = useWidgetsStore((s) => s.meta[id]);
  const videos = useVideosStore((s) => s.items);
  const products = useProductsStore((s) => s.items);
  const [launch, setLaunch] = useState(true);

  const chosenVideos = useMemo(
    () =>
      settings.videoIds.length
        ? videos.filter((v) => settings.videoIds.includes(v.id))
        : videos.slice(0, 6),
    [videos, settings.videoIds],
  );
  const chosenProducts = useMemo(
    () =>
      settings.productIds.length
        ? products.filter((p) => settings.productIds.includes(p.id))
        : products.slice(0, 4),
    [products, settings.productIds],
  );

  if (!widget) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: settings.colors.background, color: settings.colors.text }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
        <Link to="/widgets/$id" params={{ id }} className="flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>
        <div className="text-xs opacity-70">
          {widget.name}
          {meta ? ` · v${meta.version}` : ""}
        </div>
        <Button size="sm" onClick={() => setLaunch(true)}>
          <Play className="mr-1 h-3.5 w-3.5" /> Launch
        </Button>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-4 text-xs uppercase tracking-[0.18em] opacity-60">
          Storefront preview
        </div>
        <WidgetRenderer widget={widget} settings={settings} boxed={false} />
      </main>

      {launch && (
        <WidgetPlayer
          widget={widget}
          settings={settings}
          videos={chosenVideos}
          products={chosenProducts}
          startIndex={0}
          onClose={() => setLaunch(false)}
        />
      )}
    </div>
  );
}
