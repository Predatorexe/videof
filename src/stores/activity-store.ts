import { create } from "zustand";
import { newId } from "@/lib/mock-api";

export type ActivityKind =
  | "upload"
  | "delete"
  | "create"
  | "update"
  | "publish"
  | "billing"
  | "import"
  | "export"
  | "auth";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: string; // ISO
};

type State = {
  entries: ActivityEntry[];
  log: (kind: ActivityKind, title: string, detail?: string) => void;
  clear: () => void;
};

const SEED_EPOCH = Date.UTC(2026, 6, 13);

export const useActivityStore = create<State>((set) => ({
  entries: [
    { id: newId("act"), kind: "auth", title: "Signed in", detail: "Chrome · macOS", at: new Date(SEED_EPOCH - 3600_000).toISOString() },
    { id: newId("act"), kind: "publish", title: "Widget published", detail: "Homepage Reel Carousel", at: new Date(SEED_EPOCH - 7200_000).toISOString() },
  ],
  log: (kind, title, detail) =>
    set((s) => ({
      entries: [
        { id: newId("act"), kind, title, detail, at: new Date().toISOString() },
        ...s.entries,
      ].slice(0, 200),
    })),
  clear: () => set({ entries: [] }),
}));
