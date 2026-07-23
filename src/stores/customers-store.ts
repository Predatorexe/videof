/**
 * Customers store — read-heavy list backed by the `customers` table.
 * Falls back to seed data in Lovable preview.
 */
import { create } from "zustand";
import { toast } from "sonner";
import type { Customer } from "@/lib/mock-data";
import { customerFromRow, type CustomerRow } from "@/lib/adapters/customers";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import { listCustomers, deleteCustomer } from "@/lib/api/customers.functions";

type State = {
  items: Customer[];
  _shopId: string | null;
  _hydrated: boolean;
  remove: (id: string) => void;
  hydrate: (shopId: string) => Promise<void>;
};

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useCustomersStore.getState().hydrate(shopId);
}

export const useCustomersStore = create<State>((set, get) => ({
  items: seed,
  _shopId: null,
  _hydrated: false,
  hydrate: async (shopId: string) => {
    try {
      const res = await listCustomers({ data: { shopId, page: 1, pageSize: 100 } });
      set({
        items: (res.items as CustomerRow[]).map(customerFromRow),
        _shopId: shopId,
        _hydrated: true,
      });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load customers");
    }
  },
  remove: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    if (get()._shopId && isUuid(id)) {
      deleteCustomer({ data: { id } }).catch((err) => {
        set({ items: prev });
        toast.error(err instanceof Error ? err.message : "Failed to delete customer");
        void safeRehydrate();
      });
    }
  },
}));

subscribeShopHydration({
  hydrate: (shopId) => useCustomersStore.getState().hydrate(shopId),
  reset: () => useCustomersStore.setState({ items: seed, _shopId: null, _hydrated: false }),
});
