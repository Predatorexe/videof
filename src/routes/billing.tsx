import { createFileRoute } from "@tanstack/react-router";
import { Check, Download } from "lucide-react";
import { toast } from "sonner";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fmt, invoices } from "@/lib/mock-data";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

const plans = [
  {
    name: "Starter",
    price: 19,
    features: ["Up to 20 videos", "3 widgets", "Basic analytics", "Community support"],
  },
  {
    name: "Growth",
    price: 49,
    highlight: true,
    features: [
      "Up to 200 videos",
      "Unlimited widgets",
      "Full analytics + exports",
      "Priority email support",
      "Instagram & TikTok import",
    ],
  },
  {
    name: "Professional",
    price: 149,
    features: [
      "Unlimited videos",
      "Team seats",
      "Custom CSS + advanced editor",
      "Dedicated success manager",
    ],
  },
];

function BillingPage() {
  return (
    <PageShell
      eyebrow="Account"
      title="Billing"
      description="Manage your plan, review invoices, and monitor usage. You're currently on the Growth plan."
      actions={
        <Button variant="outline" size="sm">
          Contact sales
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Current plan" value="Growth" hint="Renews Mar 12" />
        <Stat label="Videos" value="128 / 200" hint="72 remaining" />
        <Stat label="Storage" value="12.4 / 25 GB" hint="52% used" />
        <Stat accent="ember" label="Next invoice" value={fmt.money(49)} hint="in 12 days" />
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Plans</h2>
          <div className="text-xs text-muted-foreground">Billed monthly · switch anytime</div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-xl border bg-card p-6 ${
                p.highlight ? "ring-2 ring-signal" : ""
              }`}
            >
              {p.highlight && (
                <Badge className="absolute right-3 top-3 border-transparent bg-signal text-signal-foreground">
                  Current
                </Badge>
              )}
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl">{fmt.money(p.price)}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-signal" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                variant={p.highlight ? "outline" : "default"}
                onClick={() => toast.success(`${p.name} plan selected`)}
              >
                {p.highlight ? "Manage plan" : `Switch to ${p.name}`}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-display text-xl">Usage this month</h3>
        <div className="mt-4 space-y-4">
          <UsageBar label="Videos" value={128} max={200} />
          <UsageBar label="Storage" value={12.4} max={25} unit="GB" />
          <UsageBar label="Widget impressions" value={324120} max={500000} />
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-display text-xl">Invoices</h3>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> All PDFs
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2">Invoice</th>
              <th className="px-5 py-2">Date</th>
              <th className="px-5 py-2">Plan</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Status</th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-5 py-2 font-mono">{inv.number}</td>
                <td className="px-5 py-2 text-muted-foreground">{fmt.date(inv.date)}</td>
                <td className="px-5 py-2">{inv.plan}</td>
                <td className="px-5 py-2 font-mono">{fmt.money(inv.amount)}</td>
                <td className="px-5 py-2">
                  <Badge
                    variant={inv.status === "paid" ? "default" : inv.status === "pending" ? "secondary" : "destructive"}
                    className="capitalize"
                  >
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-5 py-2 text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  );
}

function UsageBar({ label, value, max, unit }: { label: string; value: number; max: number; unit?: string }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {unit ? `${value} / ${max} ${unit}` : `${fmt.n(value)} / ${fmt.n(max)}`}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
