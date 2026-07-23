/**
 * Products store.
 *
 * Public API is unchanged so components keep working. Internally:
 * - When `useShopStore.shop` becomes set, `hydrate(shopId)` replaces `items`
 *   with rows from the database (mapped via the products adapter).
 * - Every mutation updates local state optimistically. If a shop is active,
 *   the corresponding server function is dispatched; on failure the store
 *   is re-hydrated from the server and a toast is shown.
 * - When no shop is active (Lovable preview), behavior collapses to the
 *   original in-memory mock (seed + local IDs only).
 */
import { create } from "zustand";
import { toast } from "sonner";
import { products as seed, type Product } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";
import { useShopStore, getShopId } from "@/stores/shop-store";
import { productFromRow, type ProductRow } from "@/lib/adapters/products";
import {
  listProducts,
  upsertProduct,
  updateProduct,
  deleteProduct,
  assignVideosToProduct,
  bulkAssignVideos as bulkAssignVideosFn,
} from "@/lib/api/products.functions";

type NewProduct = {
  title: string;
  price: number;
  inventory: number;
  vendor: string;
  status?: Product["status"];
  image?: string;
};

type State = {
  items: Product[];
  _shopId: string | null;
  _hydrated: boolean;
  add: (input: NewProduct) => Product;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Product>) => void;
  assignVideos: (productId: string, videoIds: string[]) => void;
  bulkAssignVideos: (productIds: string[], videoIds: string[]) => void;
  importMany: (input: NewProduct[]) => Product[];
  hydrate: (shopId: string) => Promise<void>;
};

const fallbackImg =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&auto=format&fit=crop&q=70";

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useProductsStore.getState().hydrate(shopId);
}

function reportError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : `Failed to ${scope}`;
  toast.error(msg);
  void safeRehydrate();
}

export const useProductsStore = create<State>((set, get) => ({
  items: [],
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const res = await listProducts({ data: { shopId, page: 1, pageSize: 100 } });
      const items = (res.items as ProductRow[]).map(productFromRow);
      set({ items, _shopId: shopId, _hydrated: true });
    } catch (err) {
      // Leave seed in place; surface once.
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      const msg = err instanceof Error ? err.message : "Failed to load products";
      toast.error(msg);
    }
  },

  add: (input) => {
    const optimistic: Product = {
      id: newId("prd"),
      title: input.title.trim(),
      image: input.image || fallbackImg,
      price: Number.isFinite(input.price) ? input.price : 0,
      inventory: Number.isFinite(input.inventory) ? input.inventory : 0,
      status: input.status ?? "draft",
      vendor: input.vendor.trim() || "Untitled vendor",
      videoIds: [],
    };
    set((s) => ({ items: [optimistic, ...s.items] }));
    const shopId = get()._shopId;
    if (shopId) {
      // Best-effort create in DB. shopify_product_id is a required field on
      // products; use the optimistic client id as a stable placeholder so
      // the row can round-trip until Shopify sync assigns the real one.
      upsertProduct({
        data: {
          shopId,
          shopifyProductId: optimistic.id,
          title: optimistic.title,
          status: optimistic.status,
          priceMin: optimistic.price,
          currency: "USD",
          vendor: optimistic.vendor,
          imageUrl: optimistic.image,
          inventory: optimistic.inventory,
        },
      }).then(() => safeRehydrate()).catch((err) => reportError("create product", err));
    }
    return optimistic;
  },

  remove: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((p) => p.id !== id) }));
    const shopId = get()._shopId;
    if (shopId && isUuid(id)) {
      deleteProduct({ data: { id } }).catch((err) => {
        set({ items: prev });
        reportError("delete product", err);
      });
    }
  },

  update: (id, patch) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const shopId = get()._shopId;
    if (shopId && isUuid(id)) {
      updateProduct({
        data: {
          id,
          title: patch.title,
          status: patch.status,
          inventory: patch.inventory,
          priceMin: patch.price,
          vendor: patch.vendor,
          imageUrl: patch.image,
        },
      }).catch((err) => {
        set({ items: prev });
        reportError("update product", err);
      });
    }
  },

  assignVideos: (productId, videoIds) => {
    set((s) => ({
      items: s.items.map((p) => (p.id === productId ? { ...p, videoIds } : p)),
    }));
    const shopId = get()._shopId;
    if (shopId && isUuid(productId) && videoIds.every(isUuid)) {
      assignVideosToProduct({ data: { productId, videoIds } })
        .catch((err) => reportError("assign videos", err));
    }
  },

  bulkAssignVideos: (productIds, videoIds) => {
    const ids = new Set(productIds);
    set((s) => ({
      items: s.items.map((p) =>
        ids.has(p.id) ? { ...p, videoIds: Array.from(new Set([...p.videoIds, ...videoIds])) } : p,
      ),
    }));
    const shopId = get()._shopId;
    if (shopId && productIds.every(isUuid) && videoIds.every(isUuid)) {
      bulkAssignVideosFn({ data: { productIds, videoIds } })
        .catch((err) => reportError("bulk assign", err));
    }
  },

  importMany: (rows) => {
    const created: Product[] = rows.map((r) => ({
      id: newId("prd"),
      title: r.title,
      image: r.image || fallbackImg,
      price: r.price,
      inventory: r.inventory,
      status: r.status ?? "active",
      vendor: r.vendor,
      videoIds: [],
    }));
    set((s) => ({ items: [...created, ...s.items] }));
    const shopId = get()._shopId;
    if (shopId) {
      Promise.all(created.map((p) =>
        upsertProduct({
          data: {
            shopId,
            shopifyProductId: p.id,
            title: p.title,
            status: p.status,
            priceMin: p.price,
            currency: "USD",
            vendor: p.vendor,
            imageUrl: p.image,
            inventory: p.inventory,
          },
        }),
      )).then(() => safeRehydrate()).catch((err) => reportError("import products", err));
    }
    return created;
  },
}));

// Auto-hydrate whenever the current shop changes.
if (typeof window !== "undefined") {
  useShopStore.subscribe((state, prev) => {
    if (state.shop?.id !== prev.shop?.id) {
      if (state.shop?.id) void useProductsStore.getState().hydrate(state.shop.id);
      else useProductsStore.setState({ _shopId: null, _hydrated: false, items: [] });
    }
  });
}

export const productsStoreApi = { getState: () => useProductsStore.getState() };
