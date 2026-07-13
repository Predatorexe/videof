import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Pause,
  Play,
  Share2,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { Product, Video, Widget } from "@/lib/mock-data";
import type { WidgetSettings } from "@/stores/widgets-store";
import { useCartStore } from "@/stores/cart-store";
import { useVideosStore } from "@/stores/videos-store";
import { ProductDrawer } from "./product-drawer";
import { fmt } from "@/lib/mock-data";

type Props = {
  widget: Widget;
  settings: WidgetSettings;
  videos: Video[];
  products: Product[];
  startIndex?: number;
  onClose: () => void;
};

const SEGMENT_MS = 6000;

export function WidgetPlayer({
  widget,
  settings,
  videos,
  products,
  startIndex = 0,
  onClose,
}: Props) {
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, videos.length - 1)));
  const [playing, setPlaying] = useState(settings.autoplay);
  const [muted, setMuted] = useState(settings.muted);
  const [progress, setProgress] = useState(0);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [mounted, setMounted] = useState(false);

  const liked = useCartStore((s) => s.liked);
  const toggleLike = useCartStore((s) => s.toggleLike);
  const trackView = useVideosStore((s) => s.trackView);
  const trackClick = useVideosStore((s) => s.trackClick);

  const current = videos[index];
  const touchStartY = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const goto = useCallback(
    (nextIdx: number) => {
      if (videos.length === 0) return;
      let n = nextIdx;
      if (settings.loop) {
        n = ((nextIdx % videos.length) + videos.length) % videos.length;
      } else {
        n = Math.max(0, Math.min(videos.length - 1, nextIdx));
      }
      setIndex(n);
      setProgress(0);
    },
    [videos.length, settings.loop],
  );

  const next = useCallback(() => goto(index + 1), [goto, index]);
  const prev = useCallback(() => goto(index - 1), [goto, index]);

  // Track view once per video shown
  useEffect(() => {
    if (current) trackView(current.id);
  }, [current, trackView]);

  // Progress ticker
  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = null;
    const tick = (t: number) => {
      if (lastTickRef.current == null) lastTickRef.current = t;
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      setProgress((p) => {
        const np = p + (dt / SEGMENT_MS) * 100;
        if (np >= 100) {
          // Advance
          queueMicrotask(() => next());
          return 0;
        }
        return np;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, next, index]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") next();
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") prev();
      else if (e.key === " " || e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const productsForVideo = useMemo(() => {
    if (!current) return [] as Product[];
    const linked = products.filter((p) => current.productIds.includes(p.id));
    return linked.length ? linked : products.slice(0, 3);
  }, [current, products]);

  const featured = productsForVideo[0];

  const share = async (channel: "native" | "whatsapp" | "copy") => {
    if (!current) return;
    trackClick(current.id);
    const shareUrl = `https://cdn.videofy.app/w/${widget.id}?v=${current.id}`;
    const text = `Check out "${current.title}"`;
    if (channel === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    if (channel === "native" && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: current.title, text, url: shareUrl });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  if (!mounted || typeof document === "undefined") return null;
  if (!current) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 50) {
      if (dy < 0) next();
      else prev();
    }
    touchStartY.current = null;
  };

  const isLiked = liked.includes(current.id);

  const player = (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onWheel={(e) => {
        if (Math.abs(e.deltaY) < 30) return;
        if (e.deltaY > 0) next();
        else prev();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 items-center pl-4 md:flex">
        <button
          type="button"
          onClick={prev}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Previous"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 items-center justify-end pr-4 md:flex">
        <button
          type="button"
          onClick={next}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Next"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setPlaying((p) => !p)}
        className="relative flex h-[92vh] max-h-[900px] w-[min(430px,92vw)] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
        style={{
          fontFamily: settings.typography.bodyFont,
          transitionDuration: `${settings.animationDuration}ms`,
        }}
      >
        {/* Segment progress */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {videos.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{
                  width: `${i < index ? 100 : i === index ? progress : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Poster (video stand-in) */}
        <img
          key={current.id}
          src={current.thumbnail}
          alt={current.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity`}
          style={{
            animation: playing ? "kb 12s ease-out both" : undefined,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* Mute indicator overlay */}
        {!playing && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur">
              <Play className="h-7 w-7 fill-white text-white" />
            </div>
          </div>
        )}

        {/* Right actions */}
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-4 text-white">
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(current.id);
              trackClick(current.id);
            }}
            label="Like"
            active={isLiked}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              share("native");
            }}
            label="Share"
          >
            <Share2 className="h-5 w-5" />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              share("whatsapp");
            }}
            label="WhatsApp"
          >
            <WhatsAppIcon />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              setPlaying((p) => !p);
            }}
            label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </ActionButton>
        </div>

        {/* Bottom info + product card */}
        <div className="relative z-10 mt-auto p-4 text-white">
          <div className="mb-2 text-sm font-medium">{current.title}</div>
          {featured && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                trackClick(current.id);
                setDrawerProduct(featured);
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-white/95 p-2 text-left text-black transition hover:bg-white"
              style={{
                borderRadius: settings.radius,
              }}
            >
              <img
                src={featured.image}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{featured.title}</div>
                {settings.productCard.showVendor && (
                  <div className="truncate text-[11px] text-black/60">{featured.vendor}</div>
                )}
                {settings.productCard.showPrice && (
                  <div className="text-sm font-semibold">{fmt.money(featured.price)}</div>
                )}
              </div>
              {settings.productCard.showCta && (
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: settings.colors.cta,
                    color: settings.colors.ctaText,
                  }}
                >
                  {settings.productCard.ctaLabel}
                </span>
              )}
            </button>
          )}
          {productsForVideo.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {productsForVideo.slice(1).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerProduct(p);
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-2 py-1 text-xs text-white backdrop-blur transition hover:bg-white/25"
                >
                  <img src={p.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="max-w-[100px] truncate">{p.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductDrawer
        product={drawerProduct}
        settings={settings}
        onClose={() => setDrawerProduct(null)}
      />

      <style>{`
        @keyframes kb {
          0% { transform: scale(1) }
          100% { transform: scale(1.08) }
        }
      `}</style>
    </div>
  );

  return createPortal(player, document.body);
}

function ActionButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur transition ${
        active ? "bg-red-500/90 text-white" : "bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      {children}
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1s-.5-.1-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4c0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.2 2.8 1.2 2.8.8 3.3.8s1.7-.7 1.9-1.4c.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.9-1.5c1.5.8 3.3 1.3 5.1 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}
