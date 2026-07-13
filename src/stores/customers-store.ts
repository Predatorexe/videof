import { create } from "zustand";
import { customers as seed, type Customer } from "@/lib/mock-data";

type State = {
  items: Customer[];
  remove: (id: string) => void;
};

export const useCustomersStore = create<State>((set) => ({
  items: seed,
  remove: (id) => set((s) => ({ items: s.items.filter((c) => c.id !== id) })),
}));
