/** DB row <-> mock Customer adapter. */
import type { Customer } from "@/lib/mock-data";

export type CustomerRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  total_orders: number | null;
  total_spent: number | string | null;
  updated_at: string;
};

export function customerFromRow(r: CustomerRow): Customer {
  const first = r.first_name ?? "";
  const last = r.last_name ?? "";
  const name = `${first} ${last}`.trim() || r.email || "Unknown customer";
  const seed = encodeURIComponent(r.email ?? r.id);
  return {
    id: r.id,
    name,
    email: r.email ?? "",
    orders: r.total_orders ?? 0,
    spent: Number(r.total_spent ?? 0),
    lastSeen: r.updated_at,
    avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`,
  };
}
