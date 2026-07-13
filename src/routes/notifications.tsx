import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Info, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationsStore } from "@/stores/notifications-store";
import type { NotificationItem } from "@/lib/mock-data";

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
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAll = useNotificationsStore((s) => s.markAllRead);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const clearAll = useNotificationsStore((s) => s.clearAll);
  const unread = items.filter((n) => !n.read).length;

  return (
    <PageShell
      eyebrow="Inbox"
      title="Notifications"
      description={
        unread > 0
          ? `${unread} unread notification${unread === 1 ? "" : "s"}.`
          : "You're all caught up."
      }
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markAll();
              toast.success("All marked read");
            }}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAll();
              toast.success("Inbox cleared");
            }}
            disabled={items.length === 0}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border bg-card">
        {items.length === 0 ? (
          <div className="grid place-items-center p-12 text-center">
            <CheckCircle2 className="mb-3 h-8 w-8 text-signal" />
            <div className="font-display text-xl">Inbox zero</div>
            <p className="mt-1 text-sm text-muted-foreground">
              New alerts about uploads, billing, and widget performance will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n: NotificationItem) => {
              const { Icon, color } = iconMap[n.kind];
              return (
                <li
                  key={n.id}
                  className={`group flex gap-3 p-4 transition ${!n.read ? "bg-muted/30" : ""}`}
                >
                  <span className={`mt-0.5 shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <Badge variant="secondary" className="text-[10px]">
                            New
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">{n.time}</span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    <div className="mt-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                      {!n.read && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markRead(n.id)}>
                          Mark read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => dismiss(n.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
