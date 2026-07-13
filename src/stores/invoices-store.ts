import { create } from "zustand";
import { invoices as seed, type Invoice } from "@/lib/mock-data";

type State = {
  items: Invoice[];
  markPaid: (id: string) => void;
  add: (inv: Invoice) => void;
};

export const useInvoicesStore = create<State>((set) => ({
  items: seed,
  markPaid: (id) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, status: "paid" } : i)) })),
  add: (inv) => set((s) => ({ items: [inv, ...s.items] })),
}));
