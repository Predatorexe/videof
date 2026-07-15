/**
 * Invoices store — backed by the `invoices` table (read-only from client).
 * Marking paid / creating invoices happens server-side via billing webhooks.
 * The `markPaid` and `add` actions therefore only update local state in
 * mock mode; in shop mode they are no-ops and log a toast for visibility.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { invoices as seed, type Invoice } from "@/lib/mock-data";
import { invoiceFromRow, subscriptionSnapshot, type InvoiceRow, type SubscriptionRow } from "@/lib/adapters/billing";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import { getBillingOverview } from "@/lib/api/billing.functions";

type State = {
  items: Invoice[];
  _shopId: string | null;
  _hydrated: boolean;
  markPaid: (id: string) => void;
  add: (inv: Invoice) => void;
  hydrate: (shopId: string) => Promise<void>;
};

export const useInvoicesStore = create<State>((set, get) => ({
  items: seed,
  _shopId: null,
  _hydrated: false,
  hydrate: async (shopId: string) => {
    try {
      const overview = await getBillingOverview({ data: { shopId } });
      const snap = subscriptionSnapshot(overview.subscription as SubscriptionRow | null);
      const plan = snap?.planId ?? "free";
      const invoices = ((overview.invoices ?? []) as InvoiceRow[]).map((r) => invoiceFromRow(r, plan));
      set({ items: invoices, _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load invoices");
    }
  },
  markPaid: (id) => {
    if (get()._shopId) {
      // Invoices become paid via the billing webhook, not client action.
      toast.message("Invoice status is updated automatically after payment.");
      return;
    }
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, status: "paid" } : i)) }));
  },
  add: (inv) => {
    if (get()._shopId) {
      toast.message("Invoices are created automatically by billing.");
      return;
    }
    set((s) => ({ items: [inv, ...s.items] }));
  },
}));

subscribeShopHydration({
  hydrate: (shopId) => useInvoicesStore.getState().hydrate(shopId),
  reset: () => useInvoicesStore.setState({ items: seed, _shopId: null, _hydrated: false }),
});
