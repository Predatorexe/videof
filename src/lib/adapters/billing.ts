/** DB row <-> mock Invoice / Subscription adapters. */
import type { Invoice } from "@/lib/mock-data";
import type { PlanId } from "@/stores/billing-store";

export type InvoiceRow = {
  id: string;
  shopify_invoice_id: string | null;
  amount: number | string | null;
  status: string | null;
  created_at: string;
  subscription_id: string | null;
};

export type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  impression_limit: number | null;
  impression_used: number | null;
};

function normalizeInvoiceStatus(s: string | null): Invoice["status"] {
  if (s === "paid") return "paid";
  if (s === "failed" || s === "void") return "failed";
  return "pending";
}

function planFromRow(p: string | null): PlanId {
  const map: Record<string, PlanId> = {
    starter: "starter",
    growth: "growth",
    scale: "scale",
    enterprise: "scale",
    free: "free",
  };
  return (p && map[p]) || "free";
}

export function invoiceFromRow(r: InvoiceRow, plan: PlanId): Invoice {
  const idx = r.id.slice(0, 4).toUpperCase();
  const number = r.shopify_invoice_id ?? `VF-${new Date(r.created_at).getUTCFullYear()}-${idx}`;
  const capitalize = (p: PlanId) => p.charAt(0).toUpperCase() + p.slice(1);
  return {
    id: r.id,
    number,
    date: r.created_at,
    amount: Number(r.amount ?? 0),
    status: normalizeInvoiceStatus(r.status),
    plan: capitalize(plan),
  };
}

export function subscriptionSnapshot(r: SubscriptionRow | null | undefined): {
  planId: PlanId;
  usedThisMonth: number;
  cycleStart: string;
  cycleEnd: string;
} | null {
  if (!r) return null;
  const now = new Date();
  const start = r.current_period_start ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = r.current_period_end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return {
    planId: planFromRow(r.plan),
    usedThisMonth: r.impression_used ?? 0,
    cycleStart: start,
    cycleEnd: end,
  };
}

export { planFromRow };
