/**
 * Activity store — backed by the `activity_logs` table.
 * Preserves the same in-memory API used by dashboard/status widgets.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { newId } from "@/lib/mock-api";
import { supabase } from "@/integrations/supabase/client";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";

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
  at: string;
};

type State = {
  entries: ActivityEntry[];
  _shopId: string | null;
  _hydrated: boolean;
  log: (kind: ActivityKind, title: string, detail?: string) => void;
  clear: () => void;
  hydrate: (shopId: string) => Promise<void>;
};

const SEED_EPOCH = Date.UTC(2026, 6, 13);
const SEED: ActivityEntry[] = [
  { id: newId("act"), kind: "auth", title: "Signed in", detail: "Chrome · macOS", at: new Date(SEED_EPOCH - 3600_000).toISOString() },
  { id: newId("act"), kind: "publish", title: "Widget published", detail: "Homepage Reel Carousel", at: new Date(SEED_EPOCH - 7200_000).toISOString() },
];

type ActivityRow = {
  id: number;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function rowToEntry(r: ActivityRow): ActivityEntry {
  const meta = r.metadata ?? {};
  return {
    id: String(r.id),
    kind: (r.action as ActivityKind) ?? "update",
    title: (meta.title as string | undefined) ?? r.resource_type ?? r.action,
    detail: (meta.detail as string | undefined) ?? undefined,
    at: r.created_at,
  };
}

export const useActivityStore = create<State>((set, get) => ({
  entries: SEED,
  _shopId: null,
  _hydrated: false,
  hydrate: async (shopId: string) => {
    try {
      const { data, error } = await supabase.from("activity_logs")
        .select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      set({ entries: (data as ActivityRow[]).map(rowToEntry), _shopId: shopId, _hydrated: true });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load activity");
    }
  },
  log: (kind, title, detail) => {
    const entry: ActivityEntry = { id: newId("act"), kind, title, detail, at: new Date().toISOString() };
    set((s) => ({ entries: [entry, ...s.entries].slice(0, 200) }));
    const shopId = getShopId();
    if (!shopId) return;
    void supabase.from("activity_logs").insert({
      shop_id: shopId,
      action: kind,
      resource_type: null,
      resource_id: null,
      metadata: { title, detail } as never,
    } as never).then((res) => {
      if (res.error) toast.error(`Failed to record activity: ${res.error.message}`);
    });
  },
  clear: () => set({ entries: [] }),
}));

subscribeShopHydration({
  hydrate: (shopId) => useActivityStore.getState().hydrate(shopId),
  reset: () => useActivityStore.setState({ entries: SEED, _shopId: null, _hydrated: false }),
});
