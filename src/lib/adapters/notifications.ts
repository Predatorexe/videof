/** DB row <-> mock Notification adapter. */
import type { NotificationItem } from "@/lib/mock-data";

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const KIND_MAP: Record<string, NotificationItem["kind"]> = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
};

export function notificationFromRow(r: NotificationRow): NotificationItem {
  return {
    id: r.id,
    title: r.title,
    body: r.body ?? "",
    time: relativeTime(r.created_at),
    kind: KIND_MAP[r.kind] ?? "info",
    read: r.read_at != null,
  };
}
