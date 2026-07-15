/**
 * Widgets store.
 *
 * Public API unchanged. Persists per-widget settings and publish metadata
 * server-side when a shop is active; falls back to in-memory mock in the
 * Lovable preview.
 */
import { create } from "zustand";
import { toast } from "sonner";
import {
  widgets as widgetsSeed,
  videos as videosSeed,
  products as productsSeed,
  type Widget,
} from "@/lib/mock-data";
import { useShopStore, getShopId } from "@/stores/shop-store";
import {
  widgetFromRow,
  publishMetaFromRow,
  toDbWidgetType,
  type WidgetRow,
} from "@/lib/adapters/widgets";
import {
  listWidgets,
  toggleWidget as toggleWidgetFn,
  renameWidget as renameWidgetFn,
  publishWidget as publishWidgetFn,
  deleteWidget as deleteWidgetFn,
  duplicateWidget as duplicateWidgetFn,
  updateWidget as updateWidgetFn,
} from "@/lib/api/widgets.functions";

export type WidgetColors = {
  accent: string;
  background: string;
  text: string;
  cta: string;
  ctaText: string;
};

export type WidgetTypography = {
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
};

export type WidgetPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "inline";

export type WidgetCta = {
  enabled: boolean;
  label: string;
  style: "solid" | "outline" | "ghost";
};

export type WidgetProductCard = {
  showPrice: boolean;
  showVendor: boolean;
  showCta: boolean;
  ctaLabel: string;
};

export type WidgetSettings = {
  videoIds: string[];
  productIds: string[];
  collectionIds: string[];
  accent: string;
  radius: number;
  spacing: number;
  aspectRatio: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  font: string;
  typography: WidgetTypography;
  colors: WidgetColors;
  position: WidgetPosition;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  cta: WidgetCta;
  productCard: WidgetProductCard;
  animation: string;
  animationDuration: number;
  customCss: string;
  placementSelector: string;
};

export type PublishMeta = {
  widgetId: string;
  publicUrl: string;
  previewUrl: string;
  embedToken: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: "live" | "paused" | "draft";
};

const seedVideoIds = videosSeed.slice(0, 6).map((v) => v.id);
const seedProductIds = productsSeed.slice(0, 4).map((p) => p.id);

export const defaultWidgetSettings: WidgetSettings = {
  videoIds: seedVideoIds,
  productIds: seedProductIds,
  collectionIds: [],
  accent: "#c8f542",
  radius: 12,
  spacing: 16,
  aspectRatio: "9:16",
  autoplay: true,
  loop: true,
  muted: true,
  controls: false,
  font: "Geist",
  typography: { headingFont: "Geist", bodyFont: "Geist", headingSize: 20, bodySize: 14 },
  colors: {
    accent: "#c8f542",
    background: "#0b0b0b",
    text: "#ffffff",
    cta: "#c8f542",
    ctaText: "#0b0b0b",
  },
  position: "inline",
  desktopEnabled: true,
  mobileEnabled: true,
  cta: { enabled: true, label: "Shop now", style: "solid" },
  productCard: { showPrice: true, showVendor: false, showCta: true, ctaLabel: "Add to cart" },
  animation: "fade",
  animationDuration: 400,
  customCss: "",
  placementSelector: "",
};

type WidgetsState = {
  items: Widget[];
  settings: Record<string, WidgetSettings>;
  meta: Record<string, PublishMeta>;
  _shopId: string | null;
  _hydrated: boolean;
  toggle: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  publish: (id: string) => PublishMeta;
  updateSettings: (id: string, next: WidgetSettings) => void;
  getSettings: (id: string) => WidgetSettings;
  getMeta: (id: string) => PublishMeta | undefined;
  hydrate: (shopId: string) => Promise<void>;
};

let idCounter = 100;
const nextId = () => `wid_c${++idCounter}`;

const touchUpdated = (w: Widget): Widget => ({ ...w, updatedAt: new Date().toISOString() });

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const genToken = (widgetId: string) => {
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `wgt_${widgetId.replace(/[^a-z0-9]/gi, "")}_${stamp}_${rand}`;
};

const buildPublicUrl = (id: string, token: string) =>
  `https://cdn.videofy.app/w/${id}?t=${token}`;

const buildPreviewUrl = (id: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/widget-preview/${id}`
    : `/widget-preview/${id}`;

async function safeRehydrate() {
  const shopId = getShopId();
  if (!shopId) return;
  await useWidgetsStore.getState().hydrate(shopId);
}

function reportError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : `Failed to ${scope}`;
  toast.error(msg);
  void safeRehydrate();
}

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  items: widgetsSeed,
  settings: {},
  meta: {},
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const rows = (await listWidgets({ data: { shopId } })) as WidgetRow[];
      const items = rows.map(widgetFromRow);
      const settings: Record<string, WidgetSettings> = {};
      const meta: Record<string, PublishMeta> = {};
      for (const row of rows) {
        const cfg = (row.config ?? {}) as Partial<WidgetSettings>;
        settings[row.id] = { ...defaultWidgetSettings, ...cfg };
        const pm = publishMetaFromRow(row);
        if (pm) meta[row.id] = pm;
      }
      set({ items, settings, meta, _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      const msg = err instanceof Error ? err.message : "Failed to load widgets";
      toast.error(msg);
    }
  },

  toggle: (id) => {
    let nextEnabled = false;
    set((s) => {
      const nextItems = s.items.map((w) => {
        if (w.id !== id) return w;
        nextEnabled = !w.enabled;
        return touchUpdated({ ...w, enabled: nextEnabled });
      });
      const existing = s.meta[id];
      const nextMeta = existing
        ? {
            ...s.meta,
            [id]: {
              ...existing,
              status: nextEnabled ? "live" as const : "paused" as const,
              updatedAt: new Date().toISOString(),
            },
          }
        : s.meta;
      return { items: nextItems, meta: nextMeta };
    });
    if (get()._shopId && isUuid(id)) {
      toggleWidgetFn({ data: { id, enabled: nextEnabled } })
        .catch((err) => reportError("toggle widget", err));
    }
  },

  duplicate: (id) => {
    const src = get().items.find((w) => w.id === id);
    if (!src) return;
    const copyId = nextId();
    const copy: Widget = {
      ...src,
      id: copyId,
      name: `${src.name} (copy)`,
      enabled: false,
      updatedAt: new Date().toISOString(),
    };
    set((s) => {
      const nextSettings = { ...s.settings };
      if (s.settings[id]) nextSettings[copyId] = { ...s.settings[id] };
      return { items: [copy, ...s.items], settings: nextSettings };
    });
    if (get()._shopId && isUuid(id)) {
      duplicateWidgetFn({ data: { id } })
        .then(() => safeRehydrate())
        .catch((err) => reportError("duplicate widget", err));
    }
  },

  remove: (id) => {
    const prev = { items: get().items, settings: get().settings, meta: get().meta };
    set((s) => {
      const nextSettings = { ...s.settings };
      const nextMeta = { ...s.meta };
      delete nextSettings[id];
      delete nextMeta[id];
      return { items: s.items.filter((w) => w.id !== id), settings: nextSettings, meta: nextMeta };
    });
    if (get()._shopId && isUuid(id)) {
      deleteWidgetFn({ data: { id } }).catch((err) => {
        set(prev);
        reportError("delete widget", err);
      });
    }
  },

  rename: (id, name) => {
    const prev = get().items;
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, name }) : w)),
    }));
    if (get()._shopId && isUuid(id)) {
      renameWidgetFn({ data: { id, name } }).catch((err) => {
        set({ items: prev });
        reportError("rename widget", err);
      });
    }
  },

  publish: (id) => {
    const state = get();
    const now = new Date().toISOString();
    const existing = state.meta[id];
    const token = existing?.embedToken ?? genToken(id);
    const optimistic: PublishMeta = {
      widgetId: id,
      embedToken: token,
      publicUrl: buildPublicUrl(id, token),
      previewUrl: buildPreviewUrl(id),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      version: (existing?.version ?? 0) + 1,
      status: "live",
    };
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, enabled: true }) : w)),
      meta: { ...s.meta, [id]: optimistic },
    }));
    if (get()._shopId && isUuid(id)) {
      publishWidgetFn({ data: { id } })
        .then((res) => {
          if (res?.meta) {
            set((s) => ({ meta: { ...s.meta, [id]: { widgetId: id, ...res.meta } } }));
          }
        })
        .catch((err) => reportError("publish widget", err));
    }
    return optimistic;
  },

  updateSettings: (id, next) => {
    const prev = get().settings[id];
    set((s) => ({
      settings: { ...s.settings, [id]: next },
      items: s.items.map((w) => (w.id === id ? touchUpdated(w) : w)),
    }));
    if (get()._shopId && isUuid(id)) {
      const type = get().items.find((w) => w.id === id)?.type;
      updateWidgetFn({
        data: {
          id,
          config: next as unknown as Record<string, unknown>,
          ...(type ? { type: toDbWidgetType(type) as never } : {}),
        },
      }).catch((err) => {
        set((s) => ({ settings: { ...s.settings, [id]: prev ?? defaultWidgetSettings } }));
        reportError("save widget settings", err);
      });
    }
  },

  getSettings: (id) => get().settings[id] ?? defaultWidgetSettings,
  getMeta: (id) => get().meta[id],
}));

if (typeof window !== "undefined") {
  useShopStore.subscribe((state, prev) => {
    if (state.shop?.id !== prev.shop?.id) {
      if (state.shop?.id) void useWidgetsStore.getState().hydrate(state.shop.id);
      else useWidgetsStore.setState({ _shopId: null, _hydrated: false, items: widgetsSeed, settings: {}, meta: {} });
    }
  });
}
