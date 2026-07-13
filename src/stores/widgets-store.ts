import { create } from "zustand";
import { widgets as widgetsSeed, videos as videosSeed, products as productsSeed, type Widget } from "@/lib/mock-data";

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
  // Content
  videoIds: string[];
  productIds: string[];
  collectionIds: string[];
  // Layout / design (existing keys preserved for back-compat)
  accent: string;
  radius: number;
  spacing: number;
  aspectRatio: string;
  // Behavior
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  // Typography (legacy `font` kept)
  font: string;
  typography: WidgetTypography;
  // Extended
  colors: WidgetColors;
  position: WidgetPosition;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  cta: WidgetCta;
  productCard: WidgetProductCard;
  animation: string;
  animationDuration: number;
  // Advanced
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
  toggle: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  publish: (id: string) => PublishMeta;
  updateSettings: (id: string, next: WidgetSettings) => void;
  getSettings: (id: string) => WidgetSettings;
  getMeta: (id: string) => PublishMeta | undefined;
};

let idCounter = 100;
const nextId = () => `wid_c${++idCounter}`;

const touchUpdated = (w: Widget): Widget => ({ ...w, updatedAt: new Date().toISOString() });

// Deterministic-ish token: seeded from widget id + timestamp
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

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  items: widgetsSeed,
  settings: {},
  meta: {},
  toggle: (id) =>
    set((s) => {
      const nextItems = s.items.map((w) =>
        w.id === id ? touchUpdated({ ...w, enabled: !w.enabled }) : w,
      );
      const item = nextItems.find((w) => w.id === id);
      const existing = s.meta[id];
      const nextMeta = existing
        ? {
            ...s.meta,
            [id]: {
              ...existing,
              status: item?.enabled ? "live" : "paused",
              updatedAt: new Date().toISOString(),
            } as PublishMeta,
          }
        : s.meta;
      return { items: nextItems, meta: nextMeta };
    }),
  duplicate: (id) =>
    set((s) => {
      const src = s.items.find((w) => w.id === id);
      if (!src) return s;
      const copyId = nextId();
      const copy: Widget = {
        ...src,
        id: copyId,
        name: `${src.name} (copy)`,
        enabled: false,
        updatedAt: new Date().toISOString(),
      };
      const nextSettings = { ...s.settings };
      if (s.settings[id]) nextSettings[copyId] = { ...s.settings[id] };
      return { items: [copy, ...s.items], settings: nextSettings };
    }),
  remove: (id) =>
    set((s) => {
      const nextSettings = { ...s.settings };
      const nextMeta = { ...s.meta };
      delete nextSettings[id];
      delete nextMeta[id];
      return { items: s.items.filter((w) => w.id !== id), settings: nextSettings, meta: nextMeta };
    }),
  rename: (id, name) =>
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, name }) : w)),
    })),
  publish: (id) => {
    const state = get();
    const now = new Date().toISOString();
    const existing = state.meta[id];
    const token = existing?.embedToken ?? genToken(id);
    const nextMeta: PublishMeta = {
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
      meta: { ...s.meta, [id]: nextMeta },
    }));
    return nextMeta;
  },
  updateSettings: (id, next) =>
    set((s) => ({
      settings: { ...s.settings, [id]: next },
      items: s.items.map((w) => (w.id === id ? touchUpdated(w) : w)),
    })),
  getSettings: (id) => get().settings[id] ?? defaultWidgetSettings,
  getMeta: (id) => get().meta[id],
}));
