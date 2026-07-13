import { create } from "zustand";
import { Sparkles, Zap, Rocket, Star, type LucideIcon } from "lucide-react";

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
    id: "free",
    name: "Free",
    price: 0,
    impressions: 2_000,
    tagline: "For merchants exploring shoppable video.",
    Icon: Sparkles,
    features: [
      "2,000 monthly impressions",
      "Unlimited video uploads",
      "Unlimited products",
      "Homepage carousel, product & story widgets",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 15,
    impressions: 5_000,
    tagline: "Launch social-to-storefront in minutes.",
    Icon: Zap,
    features: [
      "5,000 monthly impressions",
      "Unlimited video uploads",
      "Unlimited widgets",
      "Instagram & TikTok import",
      "Product matching",
      "Advanced analytics",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 25,
    impressions: 20_000,
    tagline: "Scale conversion across every surface.",
    Icon: Rocket,
    features: [
      "20,000 monthly impressions",
      "Unlimited videos & widgets",
      "AI product matching",
      "Priority support",
      "Advanced analytics",
      "Report export",
      "Widget customization",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 60,
    impressions: 60_000,
    tagline: "Everything unlocked for high-volume brands.",
    Icon: Star,
    features: [
      "60,000 monthly impressions",
      "Unlimited everything",
      "Team members",
      "White label",
      "API access",
      "Premium analytics",
      "Dedicated support",
      "Custom branding",
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
  setPlan: (id: PlanId) => void;
  setAutoRenew: (v: boolean) => void;
  setUsage: (used: number) => void;
  addImpressions: (delta: number) => void;
  updatePayment: (input: { brand: string; last4: string }) => void;
};

export const useBillingStore = create<BillingState>((set) => ({
  currentPlanId: "growth",
  usedThisMonth: 24_820,
  usedToday: 1_140,
  usedYesterday: 980,
  cycleStart: "2026-06-28T00:00:00.000Z",
  cycleEnd: "2026-07-28T00:00:00.000Z",
  paymentBrand: "Visa",
  paymentLast4: "4242",
  autoRenew: true,
  setPlan: (id) => set({ currentPlanId: id }),
  setAutoRenew: (v) => set({ autoRenew: v }),
  setUsage: (used) => set({ usedThisMonth: used }),
}));

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
