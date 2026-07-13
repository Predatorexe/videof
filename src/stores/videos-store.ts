import { create } from "zustand";
import { videos as seed, type Video } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";

type State = {
  items: Video[];
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
};

export const useVideosStore = create<State>((set, get) => ({
  items: seed,
  add: (v) => set((s) => ({ items: [v, ...s.items] })),
  remove: (id) => set((s) => ({ items: s.items.filter((v) => v.id !== id) })),
  removeMany: (ids) => {
    const drop = new Set(ids);
    set((s) => ({ items: s.items.filter((v) => !drop.has(v.id)) }));
  },
  update: (id, patch) =>
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  rename: (id, title) =>
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, title } : v)) })),
  duplicate: (id) => {
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
    set((s) => ({
      items: s.items.map((v) =>
        idSet.has(v.id) && !v.tags.includes(t) ? { ...v, tags: [...v.tags, t] } : v,
      ),
    }));
  },
  assignProducts: (videoId, productIds) =>
    set((s) => ({
      items: s.items.map((v) => (v.id === videoId ? { ...v, productIds } : v)),
    })),
  trackView: (id) =>
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v)) })),
  trackClick: (id) =>
    set((s) => ({ items: s.items.map((v) => (v.id === id ? { ...v, clicks: v.clicks + 1 } : v)) })),
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
    // Move to published after a short delay to simulate processing.
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((s) => ({
          items: s.items.map((x) => (x.id === v.id ? { ...x, status: "published" } : x)),
        }));
      }, 2500);
    }
    return v;
  },
}));
