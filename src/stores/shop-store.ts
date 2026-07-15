/**
 * Current Shopify shop context on the client.
 *
 * When the app runs standalone (Lovable preview, no App Bridge, or the
 * signed-in user is not yet mapped to a shop), `shopId` stays null and the
 * domain stores fall back to their in-memory mock seed data. When an
 * authenticated shop is resolved, the domain stores hydrate from the
 * database and route writes through the corresponding server functions.
 */
import { create } from "zustand";

type ShopSummary = { id: string; name: string; domain: string } | null;

type State = {
  shop: ShopSummary;
  status: "idle" | "resolving" | "ready" | "unavailable";
  setShop: (shop: ShopSummary) => void;
  setStatus: (status: State["status"]) => void;
};

export const useShopStore = create<State>((set) => ({
  shop: null,
  status: "idle",
  setShop: (shop) => set({ shop, status: shop ? "ready" : "unavailable" }),
  setStatus: (status) => set({ status }),
}));

export const getShopId = (): string | null => useShopStore.getState().shop?.id ?? null;
