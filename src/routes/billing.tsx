import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  Gauge,
  Info,
  Rocket,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fmt, invoices } from "@/lib/mock-data";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

type PlanId = "free" | "starter" | "growth" | "scale";

type Plan = {
  id: PlanId;
  name: string;
  price: number;
  impressions: number;
  tagline: string;
  Icon: typeof Sparkles;
  features: string[];
  cta?: string;
};

const plans: Plan[] = [
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

const OVERAGE_BLOCK = 10_000;
const OVERAGE_PRICE = 5;

// Mock live account state — swap for API when billing backend lands.
const account = {
  currentPlanId: "growth" as PlanId,
  usedThisMonth: 24_820,
  usedToday: 1_140,
  usedYesterday: 980,
  cycleStart: "2026-06-28T00:00:00.000Z",
  cycleEnd: "2026-07-28T00:00:00.000Z",
  paymentBrand: "Visa",
  paymentLast4: "4242",
};

function computeUsage(planId: PlanId, used: number) {
  const plan = plans.find((p) => p.id === planId)!;
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

function BillingPage() {
  const usage = computeUsage(account.currentPlanId, account.usedThisMonth);
  const renewal = fmt.date(account.cycleEnd);
  const monthlyCost = usage.plan.price + usage.overageCharge;

  return (
    <PageShell
      eyebrow="Account"
      title="Billing & usage"
      description="Videofy bills by monthly widget impressions. Widgets keep running past your limit — overage is metered automatically."
      actions={
        <>
          <Button variant="outline" size="sm">
            Contact sales
          </Button>
          <Button size="sm" onClick={() => toast.success("Opening plan picker")}>
            Upgrade plan <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      {usage.paused && <HardLimitBanner />}
      {!usage.paused && usage.overage > 0 && <OverageBanner overage={usage.overage} charge={usage.overageCharge} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Current plan" value={usage.plan.name} hint={`Renews ${renewal}`} />
        <Stat
          label="Monthly cost"
          value={fmt.money(monthlyCost)}
          hint={usage.overageCharge > 0 ? `${fmt.money(usage.plan.price)} base + ${fmt.money(usage.overageCharge)} overage` : "No overage this cycle"}
        />
        <Stat
          label="Impressions used"
          value={fmt.compact(account.usedThisMonth)}
          hint={`of ${fmt.compact(usage.limit)} · ${usage.pct.toFixed(0)}%`}
        />
        <Stat
          accent="ember"
          label={usage.overage > 0 ? "Estimated overage" : "Remaining"}
          value={usage.overage > 0 ? fmt.money(usage.overageCharge) : fmt.compact(usage.remaining)}
          hint={usage.overage > 0 ? `${fmt.n(usage.overage)} extra impressions` : "Included in plan"}
        />
      </div>

      <UsagePanel usage={usage} />

      <PlansSection currentPlanId={account.currentPlanId} />

      <BillingDetailsSection renewal={renewal} />

      <InvoicesSection />
    </PageShell>
  );
}

function HardLimitBanner() {
  return (
    <div className="rounded-xl border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 p-5">
      <div className="flex items-start gap-3">
        <div className="icon-tile shrink-0 bg-[color:var(--ember)]/15 text-[color:var(--ember)]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="font-display text-lg">Monthly impression limit reached</div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Your widgets are temporarily paused because your account exceeded the maximum monthly impressions.
            Upgrade your plan or wait until your billing cycle resets.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => toast.success("Opening plan picker")}>Upgrade plan</Button>
            <Button size="sm" variant="outline">View billing</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverageBanner({ overage, charge }: { overage: number; charge: number }) {
  return (
    <div className="rounded-xl border border-signal/30 bg-signal/5 p-4">
      <div className="flex items-start gap-3">
        <div className="icon-tile shrink-0 bg-signal/10 text-signal">
          <Info className="h-4 w-4" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-medium text-foreground">You've exceeded your monthly impressions.</span>{" "}
          <span className="text-muted-foreground">
            Additional usage will be billed automatically at {fmt.money(OVERAGE_PRICE)} per {fmt.n(OVERAGE_BLOCK)} impressions.
            Current overage: {fmt.n(overage)} impressions · {fmt.money(charge)}.
          </span>
        </div>
      </div>
    </div>
  );
}

function UsagePanel({ usage }: { usage: ReturnType<typeof computeUsage> }) {
  const reset = fmt.date(account.cycleEnd);
  const dailyAvg = Math.round(account.usedThisMonth / 18); // days into cycle
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-tile bg-signal/10 text-signal">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-xl">Monthly impressions</h3>
            <p className="text-xs text-muted-foreground">Resets {reset} · hard limit at 200% of plan</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl tracking-tight">
            {fmt.n(account.usedThisMonth)}
            <span className="ml-1 text-sm text-muted-foreground">/ {fmt.n(usage.limit)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{usage.pct.toFixed(1)}% of plan used</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--border)]/60">
          {(() => {
            const basePct = Math.min(account.usedThisMonth, usage.limit) / usage.hardLimit * 100;
            const overPct = Math.max(0, Math.min(account.usedThisMonth, usage.hardLimit) - usage.limit) / usage.hardLimit * 100;
            return (
              <>
                <div className="absolute inset-y-0 left-0 bg-signal transition-[width] duration-500" style={{ width: `${basePct}%` }} />
                {overPct > 0 && (
                  <div
                    className="absolute inset-y-0 bg-[color:var(--ember)] transition-[width] duration-500"
                    style={{ left: `${basePct}%`, width: `${overPct}%` }}
                  />
                )}
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" aria-hidden />
              </>
            );
          })()}
        </div>

        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>0</span>
          <span>Plan limit · {fmt.compact(usage.limit)}</span>
          <span>Hard limit · {fmt.compact(usage.hardLimit)}</span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 md:grid-cols-4">
        <UsageMetric label="Used today" value={fmt.n(account.usedToday)} sub={`vs ${fmt.n(account.usedYesterday)} yesterday`} />
        <UsageMetric label="Used this month" value={fmt.n(account.usedThisMonth)} sub={`~${fmt.n(dailyAvg)} / day`} />
        <UsageMetric label="Remaining" value={usage.remaining > 0 ? fmt.n(usage.remaining) : "0"} sub={usage.remaining > 0 ? "included" : "using overage"} />
        <UsageMetric
          label="Overage this cycle"
          value={usage.overage > 0 ? fmt.n(usage.overage) : "0"}
          sub={usage.overage > 0 ? `${fmt.money(usage.overageCharge)} billed` : "None"}
          accent={usage.overage > 0}
        />
      </dl>
    </section>
  );
}

function UsageMetric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-2xl tracking-tight ${accent ? "text-[color:var(--ember)]" : ""}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function PlansSection({ currentPlanId }: { currentPlanId: PlanId }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-2xl">Choose the right plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every plan includes unlimited videos. You only pay for the impressions your widgets deliver.
          </p>
        </div>
        <div className="hidden text-xs text-muted-foreground md:block">
          Overage · {fmt.money(OVERAGE_PRICE)} per {fmt.n(OVERAGE_BLOCK)} impressions
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const isRecommended = p.id === "growth";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-signal/40 ${
                isRecommended ? "border-signal/50 shadow-[0_20px_60px_-30px_var(--brand-glow)]" : ""
              }`}
            >
              {isRecommended && !isCurrent && (
                <div className="absolute -top-2.5 left-6 rounded-full bg-signal px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-foreground">
                  Recommended
                </div>
              )}
              {isCurrent && (
                <Badge className="absolute right-4 top-4 border-transparent bg-signal text-signal-foreground">
                  Current plan
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <div className="icon-tile bg-signal/10 text-signal">
                  <p.Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">{p.name}</div>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-4xl tracking-tight">{fmt.money(p.price)}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>

              <div className="mt-4 rounded-lg border bg-background/40 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Monthly impressions</div>
                <div className="mt-0.5 font-display text-lg">{fmt.n(p.impressions)}</div>
              </div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : isRecommended ? "default" : "outline"}
                disabled={isCurrent}
                onClick={() => toast.success(`${p.name} plan selected`)}
              >
                {isCurrent ? "Current plan" : p.price === 0 ? "Start free" : `Upgrade to ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Widgets keep serving past your plan limit. Extra usage is billed at {fmt.money(OVERAGE_PRICE)} per {fmt.n(OVERAGE_BLOCK)} impressions.
        At 200% of your plan limit, widgets pause until the cycle resets or you upgrade.
      </p>
    </section>
  );
}

function BillingDetailsSection({ renewal }: { renewal: string }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="icon-tile bg-signal/10 text-signal">
            <CreditCard className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg">Payment method</h3>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-background/40 px-4 py-3">
          <div>
            <div className="text-sm font-medium">{account.paymentBrand} •••• {account.paymentLast4}</div>
            <div className="text-xs text-muted-foreground">Expires 08 / 2028</div>
          </div>
          <Button size="sm" variant="outline">Update</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="icon-tile bg-signal/10 text-signal">
            <Gauge className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg">Billing cycle</h3>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Cycle</dt>
          <dd className="text-right">Monthly</dd>
          <dt className="text-muted-foreground">Next invoice</dt>
          <dd className="text-right">{renewal}</dd>
          <dt className="text-muted-foreground">Currency</dt>
          <dd className="text-right">USD</dd>
          <dt className="text-muted-foreground">Auto-renew</dt>
          <dd className="text-right">Enabled</dd>
        </dl>
      </div>
    </section>
  );
}

function InvoicesSection() {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <h3 className="font-display text-xl">Billing history</h3>
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-3.5 w-3.5" /> All PDFs
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5">Invoice</th>
            <th className="px-5 py-2.5">Date</th>
            <th className="px-5 py-2.5">Plan</th>
            <th className="px-5 py-2.5">Amount</th>
            <th className="px-5 py-2.5">Status</th>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t transition-colors hover:bg-background/40">
              <td className="px-5 py-3 font-mono">{inv.number}</td>
              <td className="px-5 py-3 text-muted-foreground">{fmt.date(inv.date)}</td>
              <td className="px-5 py-3">{inv.plan}</td>
              <td className="px-5 py-3 font-mono">{fmt.money(inv.amount)}</td>
              <td className="px-5 py-3">
                <Badge
                  variant={inv.status === "paid" ? "default" : inv.status === "pending" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {inv.status}
                </Badge>
              </td>
              <td className="px-5 py-3 text-right">
                <Button variant="ghost" size="sm">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
