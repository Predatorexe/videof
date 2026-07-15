/**
 * Small helper that subscribes a domain store to shop-context changes and
 * calls the store's `hydrate(shopId)` when a shop becomes available (or
 * `reset()` when it disappears). Extracted to avoid repeating the same
 * `useShopStore.subscribe(...)` block in every domain store.
 */
import { useShopStore } from "@/stores/shop-store";

export function subscribeShopHydration(opts: {
  hydrate: (shopId: string) => void | Promise<void>;
  reset: () => void;
}): void {
  if (typeof window === "undefined") return;
  // Fire once with the current shop if one is already resolved.
  const current = useShopStore.getState().shop?.id ?? null;
  if (current) void opts.hydrate(current);
  useShopStore.subscribe((state, prev) => {
    if (state.shop?.id === prev.shop?.id) return;
    if (state.shop?.id) void opts.hydrate(state.shop.id);
    else opts.reset();
  });
}
