/** DB row <-> mock Video shape adapter. */
import type { Video } from "@/lib/mock-data";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&auto=format&fit=crop&q=70";

export type VideoRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | string | null;
  status: string | null;
  size_bytes: number | string | null;
  tags: string[] | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  click_count?: number | null;
  video_products?: { product_id: string }[] | null;
};

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeStatus(s: string | null): Video["status"] {
  switch (s) {
    case "ready":
    case "published":
      return "published";
    case "uploading":
    case "processing":
    case "transcoding":
      return "processing";
    default:
      return "draft";
  }
}

export function videoFromRow(r: VideoRow): Video {
  const meta = (r.metadata ?? {}) as { view_count?: number };
  return {
    id: r.id,
    title: r.title,
    thumbnail: r.thumbnail_url ?? FALLBACK_THUMB,
    duration: formatDuration(Number(r.duration_seconds ?? 0)),
    views: Number(meta.view_count ?? 0),
    clicks: Number(r.click_count ?? 0),
    status: normalizeStatus(r.status),
    uploadedAt: r.created_at,
    size: formatSize(Number(r.size_bytes ?? 0)),
    tags: r.tags ?? [],
    productIds: (r.video_products ?? []).map((p) => p.product_id),
  };
}
