import { useEffect, useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/mock-data";
import { fmt } from "@/lib/mock-data";
import { useCartStore } from "@/stores/cart-store";
import type { WidgetSettings } from "@/stores/widgets-store";

type Props = {
  product: Product | null;
  settings: WidgetSettings;
  onClose: () => void;
};

const SIZES = ["XS", "S", "M", "L", "XL"];

// Derive up to 4 gallery images from the single product image + related fallbacks.
const galleryFor = (p: Product): string[] => {
  const base = p.image;
  const variants = [
    base,
    `${base}${base.includes("?") ? "&" : "?"}sat=-40`,
    `${base}${base.includes("?") ? "&" : "?"}hue=20`,
    `${base}${base.includes("?") ? "&" : "?"}fit=crop&crop=faces`,
  ];
  return Array.from(new Set(variants));
};

export function ProductDrawer({ product, settings, onClose }: Props) {
  const addToCart = useCartStore((s) => s.addToCart);
  const wishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState(0);

  useEffect(() => {
    if (product) {
      setSize("M");
      setQty(1);
      setGallery(0);
    }
  }, [product]);

  const images = useMemo(() => (product ? galleryFor(product) : []), [product]);
  const inWishlist = product ? wishlist.includes(product.id) : false;
  const outOfStock = product ? product.inventory <= 0 : false;

  const handleAdd = (buyNow = false) => {
    if (!product) return;
    if (outOfStock) {
      toast.error("Out of stock");
      return;
    }
    addToCart({ productId: product.id, qty, size });
    toast.success(
      buyNow ? `Proceeding to checkout · ${product.title}` : `Added to cart · ${product.title}`,
    );
    if (buyNow) onClose();
  };

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium">Quick shop</SheetTitle>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {product && (
          <div className="flex-1 overflow-y-auto">
            {/* Gallery */}
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              <img
                key={images[gallery]}
                src={images[gallery]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
                  inWishlist ? "bg-red-500 text-white" : "bg-white/90 text-black hover:bg-white"
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setGallery(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    gallery === i ? "border-foreground" : "border-transparent opacity-70"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Details */}
            <div className="space-y-4 px-4 pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {product.vendor}
                </div>
                <h2 className="mt-1 text-lg font-semibold">{product.title}</h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums">
                    {fmt.money(product.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {outOfStock ? "Out of stock" : `${product.inventory} in stock`}
                  </span>
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="mb-2 text-xs font-medium">Size · {size}</div>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`h-9 min-w-9 rounded-md border px-3 text-xs font-medium transition ${
                        size === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="mb-2 text-xs font-medium">Quantity</div>
                <div className="inline-flex items-center rounded-md border">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center hover:bg-muted"
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(product.inventory || 99, q + 1))}
                    className="grid h-9 w-9 place-items-center hover:bg-muted"
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Free shipping over $75 · 30-day returns · Ships from Portland.
              </p>
            </div>
          </div>
        )}

        {product && (
          <div
            className="border-t bg-background p-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleAdd(false)}
                disabled={outOfStock}
                className="h-11"
              >
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                Add to cart
              </Button>
              <Button
                onClick={() => handleAdd(true)}
                disabled={outOfStock}
                className="h-11"
                style={{
                  background: settings.colors.cta,
                  color: settings.colors.ctaText,
                }}
              >
                <Zap className="mr-1.5 h-4 w-4" />
                Buy now
              </Button>
            </div>
            <div className="mt-2 text-center text-[11px] text-muted-foreground">
              {cartCount > 0 ? `${cartCount} item${cartCount === 1 ? "" : "s"} in cart` : "Your cart is empty"}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
