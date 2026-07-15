import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Download,
  Gauge,
  Info,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmt, type Invoice } from "@/lib/mock-data";
import {
  OVERAGE_BLOCK,
  OVERAGE_PRICE,
  computeUsage,
  plans,
  useBillingStore,
  type PlanId,
  type Usage,
} from "@/stores/billing-store";
import { useInvoicesStore } from "@/stores/invoices-store";
import { useActivityStore } from "@/stores/activity-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { exportCsv } from "@/lib/csv";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  const currentPlanId = useBillingStore((s) => s.currentPlanId);
  const usedThisMonth = useBillingStore((s) => s.usedThisMonth);
  const usedToday = useBillingStore((s) => s.usedToday);
  const usedYesterday = useBillingStore((s) => s.usedYesterday);
  const cycleEnd = useBillingStore((s) => s.cycleEnd);
  const setPlan = useBillingStore((s) => s.setPlan);
  const log = useActivityStore((s) => s.log);
  const notify = useNotificationsStore((s) => s.push);
  const invoices = useInvoicesStore((s) => s.items);

  const usage = computeUsage(currentPlanId, usedThisMonth);
  const renewal = fmt.date(cycleEnd);

  const scrollToPlans = () => {
    if (typeof document !== "undefined") {
      document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /**
   * Upgrade hand-off. Optimistically flips the local plan, then dispatches
   * `initiatePlanChange` (server-fn → Shopify `appSubscriptionCreate`). If a
   * `confirmationUrl` comes back, the billing store redirects the merchant
   * to Shopify's approval screen; the APP_SUBSCRIPTIONS_UPDATE webhook and
   * the return callback reconcile the row on activation.
   */
  const requestPlanChange = (id: PlanId) => {
    if (id === currentPlanId) return;
    const from = plans.find((p) => p.id === currentPlanId)!;
    const to = plans.find((p) => p.id === id)!;
    setPlan(id);
    const direction = to.price > from.price ? "Upgraded" : "Switched";
    log("billing", `${direction} to ${to.name}`);
    notify({
      kind: "success",
      title: `${direction} to ${to.name}`,
      body: `You now get ${fmt.n(to.impressions)} impressions per month.`,
    });
    toast.success(`${direction} to ${to.name}`);
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Billing & usage"
      description="Videofy bills by monthly widget impressions. Widgets keep running past your limit — overage is metered automatically."
      actions={
        <Button size="sm" onClick={scrollToPlans}>
          Upgrade plan <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
    >
      <ShopifyManagedNote />

      {usage.paused && <HardLimitBanner onUpgrade={scrollToPlans} />}
      {!usage.paused && usage.overage > 0 && (
        <OverageBanner overage={usage.overage} charge={usage.overageCharge} />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Current plan" value={usage.plan.name} hint={`Next reset ${renewal}`} />
        <Stat
          label="Monthly usage"
          value={fmt.compact(usedThisMonth)}
          hint={`of ${fmt.compact(usage.limit)} · ${usage.pct.toFixed(0)}%`}
        />
        <Stat
          label="Remaining"
          value={fmt.compact(usage.remaining)}
          hint={usage.remaining > 0 ? "Included in plan" : "Using overage"}
        />
        <Stat
          accent="ember"
          label={usage.overage > 0 ? "Overage usage" : "Overage"}
          value={usage.overage > 0 ? fmt.n(usage.overage) : "0"}
          hint={usage.overage > 0 ? `${fmt.money(usage.overageCharge)} metered` : "None this cycle"}
        />
      </div>

      <UsagePanel
        usage={usage}
        usedThisMonth={usedThisMonth}
        usedToday={usedToday}
        usedYesterday={usedYesterday}
        cycleEnd={cycleEnd}
      />

      <PlansSection currentPlanId={currentPlanId} onSelectPlan={requestPlanChange} />

      <InvoicesSection
        invoices={invoices}
        onDownloadAll={() => {
          exportCsv(
            "plan-history",
            invoices.map((i) => ({
              number: i.number,
              date: i.date,
              plan: i.plan,
              amount: i.amount,
              status: i.status,
            })),
          );
          log("export", "Plan history exported");
          toast.success("Plan history CSV downloaded");
        }}
      />
    </PageShell>
  );
}

function ShopifyManagedNote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--elevated)] px-4 py-3 text-sm">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Billing is securely managed by Shopify.</span>{" "}
        Subscription changes are processed through Shopify.
      </p>
    </div>
  );
}

function HardLimitBanner({ onUpgrade }: { onUpgrade: () => void }) {
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
            <Button size="sm" onClick={onUpgrade}>Upgrade plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverageBanner({ overage, charge }: { overage: number; charge: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 p-4">
      <div className="flex items-start gap-3">
        <div className="icon-tile shrink-0 bg-[color:var(--ember)]/15 text-[color:var(--ember)]">
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

function UsagePanel({
  usage,
  usedThisMonth,
  usedToday,
  usedYesterday,
  cycleEnd,
}: {
  usage: Usage;
  usedThisMonth: number;
  usedToday: number;
  usedYesterday: number;
  cycleEnd: string;
}) {
  const reset = fmt.date(cycleEnd);
  const dailyAvg = Math.max(1, Math.round(usedThisMonth / 18));
  const basePct = (Math.min(usedThisMonth, usage.limit) / usage.hardLimit) * 100;
  const overPct =
    (Math.max(0, Math.min(usedThisMonth, usage.hardLimit) - usage.limit) / usage.hardLimit) * 100;
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-tile bg-signal/10 text-signal">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-xl">Usage analytics</h3>
            <p className="text-xs text-muted-foreground">Next reset {reset} · hard limit at 200% of plan</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl tracking-tight">
            {fmt.n(usedThisMonth)}
            <span className="ml-1 text-sm text-muted-foreground">/ {fmt.n(usage.limit)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{usage.pct.toFixed(1)}% of plan used</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--border)]/60">
          <div
            className="absolute inset-y-0 left-0 bg-signal transition-[width] duration-500"
            style={{ width: `${basePct}%` }}
          />
          {overPct > 0 && (
            <div
              className="absolute inset-y-0 bg-[color:var(--ember)] transition-[width] duration-500"
              style={{ left: `${basePct}%`, width: `${overPct}%` }}
            />
          )}
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" aria-hidden />
        </div>

        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>0</span>
          <span>Plan limit · {fmt.compact(usage.limit)}</span>
          <span>Hard limit · {fmt.compact(usage.hardLimit)}</span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 md:grid-cols-4">
        <UsageMetric label="Used today" value={fmt.n(usedToday)} sub={`vs ${fmt.n(usedYesterday)} yesterday`} />
        <UsageMetric label="Used this month" value={fmt.n(usedThisMonth)} sub={`~${fmt.n(dailyAvg)} / day`} />
        <UsageMetric
          label="Remaining"
          value={usage.remaining > 0 ? fmt.n(usage.remaining) : "0"}
          sub={usage.remaining > 0 ? "included" : "using overage"}
        />
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

function UsageMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-2xl tracking-tight ${accent ? "text-[color:var(--ember)]" : ""}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function PlansSection({
  currentPlanId,
  onSelectPlan,
}: {
  currentPlanId: PlanId;
  onSelectPlan: (id: PlanId) => void;
}) {
  const currentPrice = plans.find((p) => p.id === currentPlanId)!.price;
  return (
    <section id="plans">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-2xl">Plan comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every plan includes unlimited videos. You only pay for the impressions your widgets deliver.
            Subscription changes redirect to Shopify for approval.
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
          const isDowngrade = p.price < currentPrice;
          const ctaLabel = isCurrent
            ? "Current plan"
            : p.price === 0
              ? "Switch to Free"
              : isDowngrade
                ? `Downgrade to ${p.name}`
                : `Upgrade to ${p.name}`;
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
                onClick={() => onSelectPlan(p.id)}
                data-shopify-billing-action={isCurrent ? undefined : "app-subscription-create"}
                data-shopify-plan={p.id}
              >
                {ctaLabel}
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

function InvoicesSection({
  invoices,
  onDownloadAll,
}: {
  invoices: Invoice[];
  onDownloadAll: () => void;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h3 className="font-display text-xl">Billing history</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan events only. Payment receipts live in your Shopify admin.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onDownloadAll}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5">Reference</th>
            <th className="px-5 py-2.5">Date</th>
            <th className="px-5 py-2.5">Plan</th>
            <th className="px-5 py-2.5">Amount</th>
            <th className="px-5 py-2.5">Status</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
