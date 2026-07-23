/**
 * Videos store.
 *
 * Public API unchanged; internally hydrates from the database when a shop
 * is active and dispatches server functions for mutations. Falls back to
 * the original in-memory mock when no shop is set (Lovable preview).
 */
import { create } from "zustand";
import { toast } from "sonner";
import type { Video } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";
import { useShopStore, getShopId } from "@/stores/shop-store";
import { videoFromRow, type VideoRow } from "@/lib/adapters/videos";
import {
  listVideos,
  updateVideo,
  deleteVideo,
  assignProductsToVideo,
  trackVideoClick,
  addTagToVideos,
} from "@/lib/api/videos.functions";

type State = {
  items: Video[];
  _shopId: string | null;
  _hydrated: boolean;
  add: (v: Video) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  update: (id: string, patch: Partial<Video>) => void;
  rename: (id: string, title: string) => void;
  duplicate: (id: string) => Video | null;
  addTag: (ids: string[], tag: string) => void;
  assignProducts: (videoId: string, productIds: string[]) => void;
  trackView: (id: string) => void;
  trackClick: (id: string) => void;
  createFromUpload: (input: { title: string; size: number; durationSeconds: number }) => Video;
  applyServerRow: (row: VideoRow, replaceId?: string) => Video;
  hydrate: (shopId: string) => Promise<void>;
};

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useVideosStore.getState().hydrate(shopId);
}

function reportError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : `Failed to ${scope}`;
  toast.error(msg);
  void safeRehydrate();
}

export const useVideosStore = create<State>((set, get) => ({
  items: [],
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const res = await listVideos({ data: { shopId, page: 1, pageSize: 100 } });
      const items = (res.items as VideoRow[]).map(videoFromRow);
      set({ items, _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      const msg = err instanceof Error ? err.message : "Failed to load videos";
      toast.error(msg);
    }
  },

  add: (v) => set((s) => ({ items: [v, ...s.items] })),

  remove: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((v) => v.id !== id) }));
    if (get()._shopId && isUuid(id)) {
      deleteVideo({ data: { id } }).catch((err) => {
        set({ items: prev });
        reportError("delete video", err);
      });
    }
  },

  removeMany: (ids) => {
    const drop = new Set(ids);
    const prev = get().items;
    set((s) => ({ items: s.items.filter((v) => !drop.has(v.id)) }));
    if (get()._shopId) {
      Promise.all(ids.filter(isUuid).map((id) => deleteVideo({ data: { id } })))
        .catch((err) => {
          set({ items: prev });
          reportError("delete videos", err);
        });
    }
  },

  update: (id, patch) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
    if (get()._shopId && isUuid(id)) {
      updateVideo({
        data: {
          id,
          title: patch.title,
          tags: patch.tags,
        },
      }).catch((err) => {
        set({ items: prev });
        reportError("update video", err);
      });
    }
  },

  rename: (id, title) => get().update(id, { title }),

  duplicate: (id) => {
    // Local-only for now — a durable duplicate requires storage-level cloning
    // of the source asset, which is done during upload, not here.
    const src = get().items.find((v) => v.id === id);
    if (!src) return null;
    const copy: Video = {
      ...src,
      id: newId("vid"),
      title: `${src.title} (copy)`,
      status: "draft",
      views: 0,
      clicks: 0,
      uploadedAt: new Date().toISOString(),
    };
    set((s) => ({ items: [copy, ...s.items] }));
    return copy;
  },

  addTag: (ids, tag) => {
    const t = tag.trim();
    if (!t) return;
    const idSet = new Set(ids);
    const prev = get().items;
    set((s) => ({
      items: s.items.map((v) =>
        idSet.has(v.id) && !v.tags.includes(t) ? { ...v, tags: [...v.tags, t] } : v,
      ),
    }));
    const targets = ids.filter(isUuid);
    if (get()._shopId && targets.length > 0) {
      addTagToVideos({ data: { ids: targets, tag: t } }).catch((err) => {
        set({ items: prev });
        reportError("add tag", err);
      });
    }
  },

  assignProducts: (videoId, productIds) => {
    set((s) => ({
      items: s.items.map((v) => (v.id === videoId ? { ...v, productIds } : v)),
    }));
    if (get()._shopId && isUuid(videoId) && productIds.every(isUuid)) {
      assignProductsToVideo({ data: { videoId, productIds } })
        .catch((err) => reportError("assign products", err));
    }
  },

  trackView: (id) =>
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v)) })),

  trackClick: (id) => {
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, clicks: v.clicks + 1 } : v)) }));
    if (get()._shopId && isUuid(id)) {
      // Fire-and-forget; ignore errors on analytics increments.
      trackVideoClick({ data: { id } }).catch(() => {});
    }
  },

  createFromUpload: ({ title, size, durationSeconds }) => {
    const mins = Math.floor(durationSeconds / 60);
    const secs = Math.floor(durationSeconds % 60);
    const v: Video = {
      id: newId("vid"),
      title,
      thumbnail:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&auto=format&fit=crop&q=70",
      duration: `${mins}:${String(secs).padStart(2, "0")}`,
      views: 0,
      clicks: 0,
      status: "processing",
      uploadedAt: new Date().toISOString(),
      size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
      tags: ["new"],
      productIds: [],
    };
    set((s) => ({ items: [v, ...s.items] }));
    // Simulated processing transition preserved for mock-mode UX.
    if (typeof window !== "undefined" && !get()._shopId) {
      window.setTimeout(() => {
        set((s) => ({
          items: s.items.map((x) => (x.id === v.id ? { ...x, status: "published" } : x)),
        }));
      }, 2500);
    }
    return v;
  },

  applyServerRow: (row, replaceId) => {
    const v = videoFromRow(row);
    set((s) => {
      const filtered = replaceId ? s.items.filter((x) => x.id !== replaceId) : s.items;
      const without = filtered.filter((x) => x.id !== v.id);
      return { items: [v, ...without] };
    });
    return v;
  },
}));

if (typeof window !== "undefined") {
  useShopStore.subscribe((state, prev) => {
    if (state.shop?.id !== prev.shop?.id) {
      if (state.shop?.id) void useVideosStore.getState().hydrate(state.shop.id);
      else useVideosStore.setState({ _shopId: null, _hydrated: false, items: [] });
    }
  });
}
