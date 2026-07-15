/**
 * Notifications store — backed by the `notifications` table.
 * Push/write operations are only wired for read/mark/dismiss — creating
 * arbitrary notifications from the client happens through the notifications
 * server function directly when a shop is connected.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { notifications as seed, type NotificationItem } from "@/lib/mock-data";
import { newId } from "@/lib/mock-api";
import { notificationFromRow, type NotificationRow } from "@/lib/adapters/notifications";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  clearAllNotifications,
  createNotification,
} from "@/lib/api/notifications.functions";

type State = {
  items: NotificationItem[];
  _shopId: string | null;
  _hydrated: boolean;
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  push: (n: Omit<NotificationItem, "id" | "time" | "read"> & { time?: string; read?: boolean }) => void;
  hydrate: (shopId: string) => Promise<void>;
};

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useNotificationsStore.getState().hydrate(shopId);
}

function reportError(scope: string, err: unknown) {
  toast.error(err instanceof Error ? err.message : `Failed to ${scope}`);
  void safeRehydrate();
}

export const useNotificationsStore = create<State>((set, get) => ({
  items: seed,
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const rows = (await listNotifications({ data: { shopId, limit: 50 } })) as NotificationRow[];
      set({ items: rows.map(notificationFromRow), _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load notifications");
    }
  },

  unreadCount: () => get().items.filter((n) => !n.read).length,

  markRead: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    if (get()._shopId && isUuid(id)) {
      markNotificationRead({ data: { id } }).catch((err) => {
        set({ items: prev });
        reportError("mark notification read", err);
      });
    }
  },

  markAllRead: () => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
    const shopId = get()._shopId;
    if (shopId) {
      markAllNotificationsRead({ data: { shopId } }).catch((err) => {
        set({ items: prev });
        reportError("mark all read", err);
      });
    }
  },

  dismiss: (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
    if (get()._shopId && isUuid(id)) {
      dismissNotification({ data: { id } }).catch((err) => {
        set({ items: prev });
        reportError("dismiss notification", err);
      });
    }
  },

  clearAll: () => {
    const prev = get().items;
    set({ items: [] });
    const shopId = get()._shopId;
    if (shopId) {
      clearAllNotifications({ data: { shopId } }).catch((err) => {
        set({ items: prev });
        reportError("clear notifications", err);
      });
    }
  },

  push: (n) => {
    const optimistic: NotificationItem = {
      id: newId("n"),
      time: n.time ?? "just now",
      read: n.read ?? false,
      title: n.title,
      body: n.body,
      kind: n.kind,
    };
    set((s) => ({ items: [optimistic, ...s.items] }));
    const shopId = get()._shopId;
    if (shopId) {
      createNotification({
        data: { shopId, kind: n.kind, title: n.title, body: n.body },
      }).then(() => safeRehydrate()).catch((err) => reportError("create notification", err));
    }
  },
}));

subscribeShopHydration({
  hydrate: (shopId) => useNotificationsStore.getState().hydrate(shopId),
  reset: () => useNotificationsStore.setState({ items: seed, _shopId: null, _hydrated: false }),
});
