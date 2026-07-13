import { create } from "zustand";
import { products as seed, type Product } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";

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
  add: (input: NewProduct) => Product;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Product>) => void;
  assignVideos: (productId: string, videoIds: string[]) => void;
  bulkAssignVideos: (productIds: string[], videoIds: string[]) => void;
  importMany: (input: NewProduct[]) => Product[];
};

const fallbackImg =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&auto=format&fit=crop&q=70";

export const useProductsStore = create<State>((set, get) => ({
  items: seed,
  add: (input) => {
    const p: Product = {
      id: newId("prd"),
      title: input.title.trim(),
      image: input.image || fallbackImg,
      price: Number.isFinite(input.price) ? input.price : 0,
      inventory: Number.isFinite(input.inventory) ? input.inventory : 0,
      status: input.status ?? "draft",
      vendor: input.vendor.trim() || "Untitled vendor",
      videoIds: [],
    };
    set((s) => ({ items: [p, ...s.items] }));
    return p;
  },
  remove: (id) => set((s) => ({ items: s.items.filter((p) => p.id !== id) })),
  update: (id, patch) =>
    set((s) => ({ items: s.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  assignVideos: (productId, videoIds) =>
    set((s) => ({
      items: s.items.map((p) => (p.id === productId ? { ...p, videoIds } : p)),
    })),
  bulkAssignVideos: (productIds, videoIds) => {
    const ids = new Set(productIds);
    set((s) => ({
      items: s.items.map((p) =>
        ids.has(p.id) ? { ...p, videoIds: Array.from(new Set([...p.videoIds, ...videoIds])) } : p,
      ),
    }));
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
    return created;
  },
}));

export const productsStoreApi = { getState: () => useProductsStore.getState() };
