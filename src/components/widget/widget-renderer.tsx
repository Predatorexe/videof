import { useMemo, useState } from "react";
import { Play, ShoppingBag } from "lucide-react";
import { useVideosStore } from "@/stores/videos-store";
import { useProductsStore } from "@/stores/products-store";
import type { WidgetSettings } from "@/stores/widgets-store";
import type { Widget } from "@/lib/mock-data";
import { WidgetPlayer } from "./widget-player";

type Props = {
  widget: Widget;
  settings: WidgetSettings;
  device?: "desktop" | "tablet" | "mobile";
  // When true, the widget renders in a boxed preview panel (dashboard).
  // When false, it renders as if embedded on a real storefront.
  boxed?: boolean;
};

const aspectMap: Record<string, string> = {
  "9:16": "9 / 16",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "16:9": "16 / 9",
};

export function WidgetRenderer({ widget, settings, device = "desktop", boxed = true }: Props) {
  const allVideos = useVideosStore((s) => s.items);
  const allProducts = useProductsStore((s) => s.items);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);

  const videos = useMemo(() => {
    const chosen = settings.videoIds.length
      ? allVideos.filter((v) => settings.videoIds.includes(v.id))
      : allVideos.slice(0, 6);
    return chosen.length ? chosen : allVideos.slice(0, 6);
  }, [allVideos, settings.videoIds]);

  const products = useMemo(() => {
    return settings.productIds.length
      ? allProducts.filter((p) => settings.productIds.includes(p.id))
      : allProducts.slice(0, 4);
  }, [allProducts, settings.productIds]);

  const cols = device === "mobile" ? 2 : device === "tablet" ? 3 : 4;
  const ratio = aspectMap[settings.aspectRatio] ?? "9 / 16";

  const isFloating = widget.type === "floating" && !boxed;
  const wrapperStyle: React.CSSProperties = {
    fontFamily: settings.typography.bodyFont,
    color: settings.colors.text,
    background: boxed ? "transparent" : settings.colors.background,
    padding: boxed ? 0 : settings.spacing,
    borderRadius: settings.radius,
  };

  const positionClass = (() => {
    if (!isFloating) return "";
    switch (settings.position) {
      case "bottom-left":
        return "fixed bottom-4 left-4 z-40";
      case "top-right":
        return "fixed top-4 right-4 z-40";
      case "top-left":
        return "fixed top-4 left-4 z-40";
      case "bottom-right":
      default:
        return "fixed bottom-4 right-4 z-40";
    }
  })();

  // Floating: render a bubble that opens the player
  if (widget.type === "floating" && !boxed) {
    const first = videos[0];
    return (
      <>
        <button
          type="button"
          onClick={() => setPlayerIndex(0)}
          className={`${positionClass} grid h-20 w-20 place-items-center overflow-hidden shadow-xl transition hover:scale-105`}
          style={{ borderRadius: 999, border: `3px solid ${settings.colors.accent}` }}
          aria-label="Open shoppable video"
        >
          {first ? (
            <img src={first.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <Play className="h-6 w-6" style={{ color: settings.colors.accent }} />
          )}
        </button>
        {playerIndex !== null && (
          <WidgetPlayer
            widget={widget}
            settings={settings}
            videos={videos}
            products={products}
            startIndex={playerIndex}
            onClose={() => setPlayerIndex(null)}
          />
        )}
      </>
    );
  }

  return (
    <div style={wrapperStyle} className={boxed ? "" : "w-full"}>
      <div
        style={{
          fontFamily: settings.typography.headingFont,
          fontSize: settings.typography.headingSize,
          color: settings.colors.text,
        }}
        className="mb-3 flex items-baseline justify-between"
      >
        <div className="leading-none">Shop the reels</div>
        <span
          className="text-xs opacity-60"
          style={{ fontSize: Math.max(11, settings.typography.bodySize - 2) }}
        >
          {videos.length} videos
        </span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: settings.spacing,
        }}
      >
        {videos.slice(0, cols * 2).map((v, i) => (
          <button
            type="button"
            key={v.id}
            onClick={() => setPlayerIndex(i)}
            className="group relative overflow-hidden text-left transition hover:opacity-95"
            style={{
              aspectRatio: ratio,
              borderRadius: settings.radius,
              border: `2px solid ${settings.colors.accent}`,
              transitionDuration: `${settings.animationDuration}ms`,
            }}
          >
            <img
              src={v.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span
              className="absolute inset-x-0 bottom-0 p-2 text-white"
              style={{ fontSize: Math.max(10, settings.typography.bodySize - 3) }}
            >
              <span className="line-clamp-1 block font-medium">{v.title}</span>
            </span>
            <span
              className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full"
              style={{ background: settings.colors.accent, color: settings.colors.ctaText }}
            >
              <Play className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      {settings.cta.enabled && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPlayerIndex(0)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition"
            style={{
              borderRadius: settings.radius,
              background:
                settings.cta.style === "solid" ? settings.colors.cta : "transparent",
              color:
                settings.cta.style === "solid" ? settings.colors.ctaText : settings.colors.cta,
              border:
                settings.cta.style === "outline"
                  ? `1.5px solid ${settings.colors.cta}`
                  : "none",
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {settings.cta.label}
          </button>
        </div>
      )}

      {settings.customCss && <style>{settings.customCss}</style>}

      {playerIndex !== null && (
        <WidgetPlayer
          widget={widget}
          settings={settings}
          videos={videos}
          products={products}
          startIndex={playerIndex}
          onClose={() => setPlayerIndex(null)}
        />
      )}
    </div>
  );
}
