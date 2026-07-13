import { create } from "zustand";
import { widgets as widgetsSeed, type Widget } from "@/lib/mock-data";

export type WidgetSettings = {
  accent: string;
  radius: number;
  spacing: number;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  font: string;
  customCss: string;
  aspectRatio: string;
  animation: string;
  placementSelector: string;
};

export const defaultWidgetSettings: WidgetSettings = {
  accent: "#c8f542",
  radius: 12,
  spacing: 16,
  autoplay: true,
  loop: true,
  muted: true,
  controls: false,
  font: "Geist",
  customCss: "",
  aspectRatio: "9:16",
  animation: "fade",
  placementSelector: "",
};

type WidgetsState = {
  items: Widget[];
  settings: Record<string, WidgetSettings>;
  toggle: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  publish: (id: string) => void;
  updateSettings: (id: string, next: WidgetSettings) => void;
  getSettings: (id: string) => WidgetSettings;
};

let idCounter = 100;
const nextId = () => `wid_c${++idCounter}`;

const touchUpdated = (w: Widget): Widget => ({ ...w, updatedAt: new Date().toISOString() });

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  items: widgetsSeed,
  settings: {},
  toggle: (id) =>
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, enabled: !w.enabled }) : w)),
    })),
  duplicate: (id) =>
    set((s) => {
      const src = s.items.find((w) => w.id === id);
      if (!src) return s;
      const copyId = nextId();
      const copy: Widget = { ...src, id: copyId, name: `${src.name} (copy)`, enabled: false, updatedAt: new Date().toISOString() };
      const nextSettings = { ...s.settings };
      if (s.settings[id]) nextSettings[copyId] = { ...s.settings[id] };
      return { items: [copy, ...s.items], settings: nextSettings };
    }),
  remove: (id) =>
    set((s) => {
      const nextSettings = { ...s.settings };
      delete nextSettings[id];
      return { items: s.items.filter((w) => w.id !== id), settings: nextSettings };
    }),
  rename: (id, name) =>
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, name }) : w)),
    })),
  publish: (id) =>
    set((s) => ({
      items: s.items.map((w) => (w.id === id ? touchUpdated({ ...w, enabled: true }) : w)),
    })),
  updateSettings: (id, next) =>
    set((s) => ({
      settings: { ...s.settings, [id]: next },
      items: s.items.map((w) => (w.id === id ? touchUpdated(w) : w)),
    })),
  getSettings: (id) => get().settings[id] ?? defaultWidgetSettings,
}));
