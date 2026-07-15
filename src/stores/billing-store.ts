/**
 * Billing store.
 *
 * Plan / usage / cycle come from the `subscriptions` table via the
 * getBillingOverview server function. Payment brand/last4 are not
 * persisted server-side (Shopify Billing owns the payment method); they
 * remain local-only display state. `setPlan` dispatches
 * `initiatePlanChange`; local mock mode continues to work when there is
 * no shop context.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { Sparkles, Zap, Rocket, Star, type LucideIcon } from "lucide-react";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import { getBillingOverview, initiatePlanChange } from "@/lib/api/billing.functions";
import { subscriptionSnapshot, type SubscriptionRow } from "@/lib/adapters/billing";

export type PlanId = "free" | "starter" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  impressions: number;
  tagline: string;
  Icon: LucideIcon;
  features: string[];
};

export const OVERAGE_BLOCK = 10_000;
export const OVERAGE_PRICE = 5;

export const plans: Plan[] = [
  {
    id: "free", name: "Free", price: 0, impressions: 2_000,
    tagline: "For merchants exploring shoppable video.", Icon: Sparkles,
    features: [
      "2,000 monthly impressions", "Unlimited video uploads", "Unlimited products",
      "Homepage carousel, product & story widgets", "Basic analytics", "Community support",
    ],
  },
  {
    id: "starter", name: "Starter", price: 15, impressions: 5_000,
    tagline: "Launch social-to-storefront in minutes.", Icon: Zap,
    features: [
      "5,000 monthly impressions", "Unlimited video uploads", "Unlimited widgets",
      "Instagram & TikTok import", "Product matching", "Advanced analytics", "Email support",
    ],
  },
  {
    id: "growth", name: "Growth", price: 25, impressions: 20_000,
    tagline: "Scale conversion across every surface.", Icon: Rocket,
    features: [
      "20,000 monthly impressions", "Unlimited videos & widgets", "AI product matching",
      "Priority support", "Advanced analytics", "Report export", "Widget customization",
    ],
  },
  {
    id: "scale", name: "Scale", price: 60, impressions: 60_000,
    tagline: "Everything unlocked for high-volume brands.", Icon: Star,
    features: [
      "60,000 monthly impressions", "Unlimited everything", "Team members",
      "White label", "API access", "Premium analytics", "Dedicated support", "Custom branding",
    ],
  },
];

export type BillingState = {
  currentPlanId: PlanId;
  usedThisMonth: number;
  usedToday: number;
  usedYesterday: number;
  cycleStart: string;
  cycleEnd: string;
  paymentBrand: string;
  paymentLast4: string;
  autoRenew: boolean;
  _shopId: string | null;
  _hydrated: boolean;
  setPlan: (id: PlanId) => void;
  setAutoRenew: (v: boolean) => void;
  setUsage: (used: number) => void;
  addImpressions: (delta: number) => void;
  
  hydrate: (shopId: string) => Promise<void>;
};

const DEFAULT: Omit<BillingState,
  "setPlan" | "setAutoRenew" | "setUsage" | "addImpressions" | "updatePayment" | "hydrate"
> = {
  currentPlanId: "growth",
  usedThisMonth: 24_820,
  usedToday: 1_140,
  usedYesterday: 980,
  cycleStart: "2026-06-28T00:00:00.000Z",
  cycleEnd: "2026-07-28T00:00:00.000Z",
  paymentBrand: "Visa",
  paymentLast4: "4242",
  autoRenew: true,
  _shopId: null,
  _hydrated: false,
};

const PLAN_TO_SERVER: Partial<Record<PlanId, "starter" | "growth" | "scale">> = {
  starter: "starter",
  growth: "growth",
  scale: "scale",
};

export const useBillingStore = create<BillingState>((set, get) => ({
  ...DEFAULT,

  hydrate: async (shopId: string) => {
    try {
      const overview = await getBillingOverview({ data: { shopId } });
      const snap = subscriptionSnapshot(overview.subscription as SubscriptionRow | null);
      if (snap) {
        set({
          currentPlanId: snap.planId,
          usedThisMonth: snap.usedThisMonth,
          cycleStart: snap.cycleStart,
          cycleEnd: snap.cycleEnd,
          _shopId: shopId,
          _hydrated: true,
        });
      } else {
        set({ _shopId: shopId, _hydrated: true });
      }
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load billing");
    }
  },

  setPlan: (id) => {
    const prev = get().currentPlanId;
    set({ currentPlanId: id });
    const shopId = getShopId();
    const serverPlan = PLAN_TO_SERVER[id];
    if (shopId && serverPlan) {
      initiatePlanChange({ data: { shopId, plan: serverPlan } })
        .then((res) => {
          if (res.confirmationUrl) window.location.assign(res.confirmationUrl);
        })
        .catch((err) => {
          set({ currentPlanId: prev });
          toast.error(err instanceof Error ? err.message : "Failed to change plan");
        });
    }
  },
  setAutoRenew: (v) => set({ autoRenew: v }),
  setUsage: (used) => set({ usedThisMonth: used }),
  addImpressions: (delta) =>
    set((s) => ({ usedThisMonth: s.usedThisMonth + delta, usedToday: s.usedToday + delta })),
  updatePayment: ({ brand, last4 }) => set({ paymentBrand: brand, paymentLast4: last4 }),
}));

subscribeShopHydration({
  hydrate: (shopId) => useBillingStore.getState().hydrate(shopId),
  reset: () => useBillingStore.setState({ ...DEFAULT }),
});

export type Usage = {
  plan: Plan;
  limit: number;
  hardLimit: number;
  remaining: number;
  overage: number;
  billedBlocks: number;
  overageCharge: number;
  pct: number;
  paused: boolean;
};

export function computeUsage(planId: PlanId, used: number): Usage {
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const limit = plan.impressions;
  const hardLimit = limit * 2;
  const remaining = Math.max(limit - used, 0);
  const overage = Math.max(used - limit, 0);
  const billedBlocks = Math.floor(overage / OVERAGE_BLOCK);
  const overageCharge = billedBlocks * OVERAGE_PRICE;
  const pct = Math.min((used / limit) * 100, 200);
  const paused = used >= hardLimit;
  return { plan, limit, hardLimit, remaining, overage, billedBlocks, overageCharge, pct, paused };
}
