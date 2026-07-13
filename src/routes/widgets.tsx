import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  Play,
  Circle,
  Square,
  LayoutGrid,
  MessageSquare,
  Package,
  Layers,
  Instagram,
  Music2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmt, widgets as widgetsSeed, type Widget, type WidgetType } from "@/lib/mock-data";

export const Route = createFileRoute("/widgets")({
  component: WidgetsPage,
});

const typeIcon: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  carousel: Play,
  floating: Circle,
  story: Square,
  product: Package,
  collection: Layers,
  popup: MessageSquare,
  hero: ImageIcon,
  instagram: Instagram,
  tiktok: Music2,
  grid: LayoutGrid,
};

function WidgetsPage() {
  const [items, setItems] = useState<Widget[]>(widgetsSeed);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
    toast.success("Widget updated");
  };

  const duplicate = (w: Widget) => {
    const copy: Widget = { ...w, id: `wid_${Math.random().toString(36).slice(2, 8)}`, name: `${w.name} (copy)`, enabled: false };
    setItems((prev) => [copy, ...prev]);
    toast.success("Duplicated");
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((w) => w.id !== id));
    toast.success("Deleted");
  };

  return (
    <PageShell
      eyebrow="Storefront"
      title="Widgets"
      description="Every video surface running on your storefront — carousels, stories, popups, and floating reels."
      actions={
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New widget
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((w) => {
          const Icon = typeIcon[w.type];
          return (
            <div key={w.id} className="group relative overflow-hidden rounded-xl border bg-card">
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-muted to-elevated">
                <Icon className="h-16 w-16 text-muted-foreground/40" />
                <div className="absolute left-3 top-3">
                  <Badge variant="secondary" className="capitalize">
                    {w.type}
                  </Badge>
                </div>
                <div className="absolute right-3 top-3">
                  {w.enabled ? (
                    <Badge className="border-transparent bg-signal text-signal-foreground">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-signal-foreground" /> Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Paused</Badge>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{w.name}</h3>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {w.placement}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/widgets/$id" params={{ id: w.id }}>Customize</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(w)}>
                        <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => remove(w.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/50 px-2 py-1.5">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Impressions</div>
                    <div className="mt-0.5 font-mono">{fmt.compact(w.impressions)}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2 py-1.5">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">CTR</div>
                    <div className="mt-0.5 font-mono">{fmt.pct(w.ctr)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Switch checked={w.enabled} onCheckedChange={() => toggle(w.id)} />
                    <span className="text-muted-foreground">{w.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                    <Link to="/widgets/$id" params={{ id: w.id }}>
                      <Sparkles className="mr-1 h-3 w-3" /> Customize
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
