import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  Gauge,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useUiStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { downloadText } from "@/lib/mock-api";
import { exportCsv } from "@/lib/csv";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function invoiceText(inv: Invoice, planName: string) {
  return [
    `Videofy Invoice ${inv.number}`,
    `Date: ${fmt.date(inv.date)}`,
    `Plan: ${planName}`,
    `Amount: ${fmt.money(inv.amount)}`,
    `Status: ${inv.status.toUpperCase()}`,
    `---`,
    `Thank you for using Videofy.`,
  ].join("\n");
}

function BillingPage() {
  const currentPlanId = useBillingStore((s) => s.currentPlanId);
  const usedThisMonth = useBillingStore((s) => s.usedThisMonth);
  const usedToday = useBillingStore((s) => s.usedToday);
  const usedYesterday = useBillingStore((s) => s.usedYesterday);
  const cycleEnd = useBillingStore((s) => s.cycleEnd);
  const paymentBrand = useBillingStore((s) => s.paymentBrand);
  const paymentLast4 = useBillingStore((s) => s.paymentLast4);
  const autoRenew = useBillingStore((s) => s.autoRenew);
  const setPlan = useBillingStore((s) => s.setPlan);
  const setAutoRenew = useBillingStore((s) => s.setAutoRenew);
  const openCard = useUiStore((s) => s.setUpdateCardOpen);
  const log = useActivityStore((s) => s.log);
  const notify = useNotificationsStore((s) => s.push);
  const invoices = useInvoicesStore((s) => s.items);

  const usage = computeUsage(currentPlanId, usedThisMonth);
  const renewal = fmt.date(cycleEnd);
  const monthlyCost = usage.plan.price + usage.overageCharge;

  const scrollToPlans = () => {
    if (typeof document !== "undefined") {
      document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const contactSales = () => {
    if (typeof window !== "undefined") {
      window.location.href = "mailto:sales@videofy.app?subject=Enterprise%20plan";
    }
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Billing & usage"
      description="Videofy bills by monthly widget impressions. Widgets keep running past your limit — overage is metered automatically."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={contactSales}>
            Contact sales
          </Button>
          <Button size="sm" onClick={scrollToPlans}>
            Change plan <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      {usage.paused && <HardLimitBanner onUpgrade={scrollToPlans} />}
      {!usage.paused && usage.overage > 0 && (
        <OverageBanner overage={usage.overage} charge={usage.overageCharge} />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Current plan" value={usage.plan.name} hint={`Renews ${renewal}`} />
        <Stat
          label="Monthly cost"
          value={fmt.money(monthlyCost)}
          hint={
            usage.overageCharge > 0
              ? `${fmt.money(usage.plan.price)} base + ${fmt.money(usage.overageCharge)} overage`
              : "No overage this cycle"
          }
        />
        <Stat
          label="Impressions used"
          value={fmt.compact(usedThisMonth)}
          hint={`of ${fmt.compact(usage.limit)} · ${usage.pct.toFixed(0)}%`}
        />
        <Stat
          accent="ember"
          label={usage.overage > 0 ? "Estimated overage" : "Remaining"}
          value={usage.overage > 0 ? fmt.money(usage.overageCharge) : fmt.compact(usage.remaining)}
          hint={usage.overage > 0 ? `${fmt.n(usage.overage)} extra impressions` : "Included in plan"}
        />
      </div>

      <UsagePanel
        usage={usage}
        usedThisMonth={usedThisMonth}
        usedToday={usedToday}
        usedYesterday={usedYesterday}
        cycleEnd={cycleEnd}
      />

      <PlansSection
        currentPlanId={currentPlanId}
        onSelectPlan={(id) => {
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
        }}
      />

      <BillingDetailsSection
        renewal={renewal}
        paymentBrand={paymentBrand}
        paymentLast4={paymentLast4}
        autoRenew={autoRenew}
        onUpdateCard={() => openCard(true)}
        onToggleAutoRenew={(v) => {
          setAutoRenew(v);
          log("billing", v ? "Auto-renew enabled" : "Auto-renew disabled");
          toast.success(v ? "Auto-renew enabled" : "Auto-renew disabled");
        }}
      />

      <InvoicesSection
        invoices={invoices}
        onDownload={(inv) => {
          downloadText(`${inv.number}.txt`, invoiceText(inv, inv.plan));
          log("export", "Invoice downloaded", inv.number);
          toast.success(`Downloaded ${inv.number}`);
        }}
        onDownloadAll={() => {
          exportCsv(
            "invoices",
            invoices.map((i) => ({
              number: i.number,
              date: i.date,
              plan: i.plan,
              amount: i.amount,
              status: i.status,
            })),
          );
          log("export", "All invoices exported");
          toast.success("Invoice history CSV downloaded");
        }}
      />
    </PageShell>
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
            <h3 className="font-display text-xl">Monthly impressions</h3>
            <p className="text-xs text-muted-foreground">Resets {reset} · hard limit at 200% of plan</p>
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

function BillingDetailsSection({
  renewal,
  paymentBrand,
  paymentLast4,
  autoRenew,
  onUpdateCard,
  onToggleAutoRenew,
}: {
  renewal: string;
  paymentBrand: string;
  paymentLast4: string;
  autoRenew: boolean;
  onUpdateCard: () => void;
  onToggleAutoRenew: (v: boolean) => void;
}) {
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
            <div className="text-sm font-medium">
              {paymentBrand} •••• {paymentLast4}
            </div>
            <div className="text-xs text-muted-foreground">Expires 08 / 2028</div>
          </div>
          <Button size="sm" variant="outline" onClick={onUpdateCard}>
            Update
          </Button>
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
          <dd className="flex items-center justify-end">
            <Switch checked={autoRenew} onCheckedChange={onToggleAutoRenew} />
          </dd>
        </dl>
      </div>
    </section>
  );
}

function InvoicesSection({
  invoices,
  onDownload,
  onDownloadAll,
}: {
  invoices: Invoice[];
  onDownload: (inv: Invoice) => void;
  onDownloadAll: () => void;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <h3 className="font-display text-xl">Billing history</h3>
        <Button variant="outline" size="sm" onClick={onDownloadAll}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
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
                <Button variant="ghost" size="sm" onClick={() => onDownload(inv)} aria-label="Download invoice">
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
