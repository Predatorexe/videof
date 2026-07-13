import { create } from "zustand";
import { notifications as seed, type NotificationItem } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";

type State = {
  items: NotificationItem[];
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  push: (n: Omit<NotificationItem, "id" | "time" | "read"> & { time?: string; read?: boolean }) => void;
};

export const useNotificationsStore = create<State>((set, get) => ({
  items: seed,
  unreadCount: () => get().items.filter((n) => !n.read).length,
  markRead: (id) =>
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
  clearAll: () => set({ items: [] }),
  push: (n) =>
    set((s) => ({
      items: [
        {
          id: newId("n"),
          time: n.time ?? "just now",
          read: n.read ?? false,
          title: n.title,
          body: n.body,
          kind: n.kind,
        },
        ...s.items,
      ],
    })),
}));
