import { createFileRoute } from "@tanstack/react-router";
import { Download, Mail } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { customers, fmt } from "@/lib/mock-data";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <PageShell
      eyebrow="Audience"
      title="Customers"
      description="Shoppers who watched or interacted with your videos in the last 30 days."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm">
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email segment
          </Button>
        </>
      }
    >
      <Input placeholder="Search customers…" className="max-w-md" />

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
            {customers.map((c) => (
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
    </PageShell>
  );
}
