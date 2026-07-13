import { create } from "zustand";

export type CartItem = {
  productId: string;
  qty: number;
  size?: string;
};

type State = {
  items: CartItem[];
  wishlist: string[];
  liked: string[]; // video IDs
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size?: string) => void;
  setQty: (productId: string, size: string | undefined, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleLike: (videoId: string) => void;
};

const sameLine = (a: CartItem, b: CartItem) =>
  a.productId === b.productId && (a.size ?? "") === (b.size ?? "");

export const useCartStore = create<State>((set) => ({
  items: [],
  wishlist: [],
  liked: [],
  addToCart: (item) =>
    set((s) => {
      const existing = s.items.find((i) => sameLine(i, item));
      if (existing) {
        return {
          items: s.items.map((i) =>
            sameLine(i, item) ? { ...i, qty: i.qty + item.qty } : i,
          ),
        };
      }
      return { items: [...s.items, item] };
    }),
  removeFromCart: (productId, size) =>
    set((s) => ({
      items: s.items.filter(
        (i) => !(i.productId === productId && (i.size ?? "") === (size ?? "")),
      ),
    })),
  setQty: (productId, size, qty) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.productId === productId && (i.size ?? "") === (size ?? "")
            ? { ...i, qty: Math.max(0, qty) }
            : i,
        )
        .filter((i) => i.qty > 0),
    })),
  clearCart: () => set({ items: [] }),
  toggleWishlist: (productId) =>
    set((s) => ({
      wishlist: s.wishlist.includes(productId)
        ? s.wishlist.filter((id) => id !== productId)
        : [...s.wishlist, productId],
    })),
  toggleLike: (videoId) =>
    set((s) => ({
      liked: s.liked.includes(videoId)
        ? s.liked.filter((id) => id !== videoId)
        : [...s.liked, videoId],
    })),
}));
