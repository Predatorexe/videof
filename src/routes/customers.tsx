import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Mail, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { fmt } from "@/lib/mock-data";
import { useCustomersStore } from "@/stores/customers-store";
import { useActivityStore } from "@/stores/activity-store";
import { exportCsv } from "@/lib/csv";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useCustomersStore((s) => s.items);
  const log = useActivityStore((s) => s.log);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return customers.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const doExport = () => {
    exportCsv(
      "customers",
      filtered.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        orders: c.orders,
        spent: c.spent,
        lastSeen: c.lastSeen,
      })),
    );
    log("export", `${filtered.length} customers exported`);
    toast.success("CSV downloaded");
  };

  const doEmail = () => {
    const to = filtered
      .map((c) => c.email)
      .slice(0, 50)
      .join(",");
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?bcc=${encodeURIComponent(to)}&subject=${encodeURIComponent(
        "News from Videofy",
      )}`;
    }
    log("update", `Email drafted to ${filtered.length} customers`);
  };

  return (
    <PageShell
      eyebrow="Audience"
      title="Customers"
      description="Shoppers who watched or interacted with your videos in the last 30 days."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={doExport} disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" onClick={doEmail} disabled={filtered.length === 0}>
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email segment
          </Button>
        </>
      }
    >
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers by name or email…"
          className="h-9 pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No matches</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different name or clear your search.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Orders</th>
                <th className="px-4 py-2">Spent</th>
                <th className="px-4 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono">{c.orders}</td>
                  <td className="px-4 py-2 font-mono">{fmt.money(c.spent)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{fmt.date(c.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {customers.length} customers
      </div>
    </PageShell>
  );
}
