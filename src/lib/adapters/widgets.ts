/** DB row <-> mock Widget shape adapter. */
import type { Widget, WidgetType } from "@/lib/mock-data";
import type { PublishMeta } from "@/stores/widgets-store";

export type WidgetRow = {
  id: string;
  name: string;
  type: string;
  status: string | null;
  handle: string | null;
  updated_at: string;
  config?: Record<string, unknown> | null;
  publish_meta?: Record<string, unknown> | null;
};

/** Map DB widget type slug to the mock UI type. */
function normalizeType(t: string): WidgetType {
  const map: Record<string, WidgetType> = {
    homepage_carousel: "carousel",
    carousel: "carousel",
    story: "story",
    floating: "floating",
    product: "product",
    collection: "collection",
    popup: "popup",
    hero: "hero",
    grid: "grid",
    instagram_feed: "instagram",
    instagram: "instagram",
    tiktok_feed: "tiktok",
    tiktok: "tiktok",
  };
  return map[t] ?? "carousel";
}

/** Map mock UI type back to a DB-safe slug. */
export function toDbWidgetType(t: WidgetType): string {
  const map: Record<WidgetType, string> = {
    carousel: "homepage_carousel",
    story: "story",
    floating: "floating",
    product: "product",
    collection: "collection",
    popup: "popup",
    hero: "hero",
    grid: "grid",
    instagram: "instagram_feed",
    tiktok: "tiktok_feed",
  };
  return map[t];
}

export function widgetFromRow(r: WidgetRow): Widget {
  const cfg = (r.config ?? {}) as { placement?: string; impressions?: number; ctr?: number };
  return {
    id: r.id,
    name: r.name,
    type: normalizeType(r.type),
    enabled: r.status === "published",
    placement: cfg.placement ?? "",
    impressions: Number(cfg.impressions ?? 0),
    ctr: Number(cfg.ctr ?? 0),
    updatedAt: r.updated_at,
  };
}

export function publishMetaFromRow(r: WidgetRow): PublishMeta | undefined {
  const m = r.publish_meta as Partial<PublishMeta> | null | undefined;
  if (!m || !m.embedToken) return undefined;
  return {
    widgetId: r.id,
    embedToken: m.embedToken,
    publicUrl: m.publicUrl ?? "",
    previewUrl: m.previewUrl ?? "",
    createdAt: m.createdAt ?? r.updated_at,
    updatedAt: m.updatedAt ?? r.updated_at,
    version: m.version ?? 1,
    status: m.status ?? (r.status === "published" ? "live" : "draft"),
  };
}
