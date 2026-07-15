/** DB row <-> mock Collection adapter. */
import type { Collection } from "@/lib/mock-data";

const FALLBACK =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&auto=format&fit=crop&q=70";

export type CollectionRow = {
  id: string;
  title: string;
  image_url: string | null;
  updated_at: string;
  collection_products?: { count: number }[] | null;
};

export function collectionFromRow(r: CollectionRow, videoCount = 0): Collection {
  const productCount = Array.isArray(r.collection_products) && r.collection_products.length > 0
    ? Number(r.collection_products[0]?.count ?? 0)
    : 0;
  return {
    id: r.id,
    title: r.title,
    cover: r.image_url ?? FALLBACK,
    productCount,
    videoCount,
    updatedAt: r.updated_at,
  };
}
