import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notifications as seed, type NotificationItem } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const iconMap = {
  success: { Icon: CheckCircle2, color: "text-signal" },
  info: { Icon: Info, color: "text-chart-3" },
  warning: { Icon: TriangleAlert, color: "text-ember" },
  error: { Icon: AlertCircle, color: "text-destructive" },
} as const;

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(seed);

  return (
    <PageShell
      eyebrow="Inbox"
      title="Notifications"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
        >
          Mark all as read
        </Button>
      }
    >
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y">
          {items.map((n) => {
            const { Icon, color } = iconMap[n.kind];
            return (
              <li key={n.id} className={`flex gap-3 p-4 ${!n.read ? "bg-muted/30" : ""}`}>
                <span className={`mt-0.5 shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    <div className="flex items-center gap-2">
                      {!n.read && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                      <span className="text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </PageShell>
  );
}
