/**
 * Collections store.
 *
 * Public API unchanged. Hydrates from `collections` when a shop is
 * connected and dispatches server functions on writes. Falls back to the
 * in-memory mock seed in Lovable preview.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { collections as seed, type Collection } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";
import { collectionFromRow, type CollectionRow } from "@/lib/adapters/collections";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/lib/api/collections.functions";

type State = {
  items: Collection[];
  _shopId: string | null;
  _hydrated: boolean;
  add: (input: { title: string; cover?: string }) => Collection;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Collection>) => void;
  addVideos: (id: string, count: number) => void;
  hydrate: (shopId: string) => Promise<void>;
};

const fallback =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&auto=format&fit=crop&q=70";

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useCollectionsStore.getState().hydrate(shopId);
}

function reportError(scope: string, err: unknown) {
  toast.error(err instanceof Error ? err.message : `Failed to ${scope}`);
  void safeRehydrate();
}

export const useCollectionsStore = create<State>((set, get) => ({
  items: seed,
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const rows = (await listCollections({ data: { shopId } })) as CollectionRow[];
      set({ items: rows.map((r) => collectionFromRow(r)), _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load collections");
    }
  },

  add: ({ title, cover }) => {
    const optimistic: Collection = {
      id: newId("col"),
      title: title.trim(),
      cover: cover || fallback,
      productCount: 0,
      videoCount: 0,
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ items: [optimistic, ...s.items] }));
    const shopId = get()._shopId;
    if (shopId) {
      createCollection({
        data: { shopId, title: optimistic.title, imageUrl: optimistic.cover },
      }).then(() => safeRehydrate()).catch((err) => reportError("create collection", err));
    }
    return optimistic;
  },

  remove: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    if (get()._shopId && isUuid(id)) {
      deleteCollection({ data: { id } }).catch((err) => {
        set({ items: prev });
        reportError("delete collection", err);
      });
    }
  },

  update: (id, patch) => {
    const prev = get().items;
    set((s) => ({
      items: s.items.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      ),
    }));
    if (get()._shopId && isUuid(id)) {
      updateCollection({
        data: { id, title: patch.title, imageUrl: patch.cover },
      }).catch((err) => {
        set({ items: prev });
        reportError("update collection", err);
      });
    }
  },

  addVideos: (id, count) =>
    // Client-only counter — the durable link is a separate widget_videos
    // relation which is managed via the widgets/videos flows.
    set((s) => ({
      items: s.items.map((c) =>
        c.id === id
          ? { ...c, videoCount: c.videoCount + count, updatedAt: new Date().toISOString() }
          : c,
      ),
    })),
}));

subscribeShopHydration({
  hydrate: (shopId) => useCollectionsStore.getState().hydrate(shopId),
  reset: () => useCollectionsStore.setState({ items: seed, _shopId: null, _hydrated: false }),
});
