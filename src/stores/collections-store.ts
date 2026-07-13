import { create } from "zustand";
import { collections as seed, type Collection } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";

type State = {
  items: Collection[];
  add: (input: { title: string; cover?: string }) => Collection;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Collection>) => void;
  addVideos: (id: string, count: number) => void;
};

const fallback =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&auto=format&fit=crop&q=70";

export const useCollectionsStore = create<State>((set) => ({
  items: seed,
  add: ({ title, cover }) => {
    const c: Collection = {
      id: newId("col"),
      title: title.trim(),
      cover: cover || fallback,
      productCount: 0,
      videoCount: 0,
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ items: [c, ...s.items] }));
    return c;
  },
  remove: (id) => set((s) => ({ items: s.items.filter((c) => c.id !== id) })),
  update: (id, patch) =>
    set((s) => ({
      items: s.items.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      ),
    })),
  addVideos: (id, count) =>
    set((s) => ({
      items: s.items.map((c) =>
        c.id === id
          ? { ...c, videoCount: c.videoCount + count, updatedAt: new Date().toISOString() }
          : c,
      ),
    })),
}));
