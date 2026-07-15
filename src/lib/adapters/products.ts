/** DB row <-> mock Product shape adapter. */
import type { Product } from "@/lib/mock-data";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&auto=format&fit=crop&q=70";

export type ProductRow = {
  id: string;
  title: string;
  image_url: string | null;
  price_min: number | string | null;
  inventory: number | null;
  status: string | null;
  vendor: string | null;
  video_products?: { video_id: string }[] | null;
};

export function productFromRow(r: ProductRow): Product {
  return {
    id: r.id,
    title: r.title,
    image: r.image_url ?? FALLBACK_IMG,
    price: r.price_min == null ? 0 : Number(r.price_min),
    inventory: r.inventory ?? 0,
    status: (r.status as Product["status"]) ?? "draft",
    vendor: r.vendor ?? "",
    videoIds: (r.video_products ?? []).map((v) => v.video_id),
  };
}
