import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Copy,
  MoreHorizontal,
  Pencil,
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
import { fmt, type WidgetType } from "@/lib/mock-data";
import { useWidgetsStore } from "@/stores/widgets-store";

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
  const items = useWidgetsStore((s) => s.items);
  const toggle = useWidgetsStore((s) => s.toggle);
  const duplicate = useWidgetsStore((s) => s.duplicate);
  const remove = useWidgetsStore((s) => s.remove);
  const rename = useWidgetsStore((s) => s.rename);

  const handleToggle = (id: string) => {
    toggle(id);
    toast.success("Widget updated");
  };

  const handleDuplicate = (id: string) => {
    duplicate(id);
    toast.success("Duplicated");
  };

  const handleRemove = (id: string) => {
    remove(id);
    toast.success("Deleted");
  };

  const handleRename = (id: string, currentName: string) => {
    if (typeof window === "undefined") return;
    const next = window.prompt("Rename widget", currentName);
    if (next && next.trim() && next.trim() !== currentName) {
      rename(id, next.trim());
      toast.success("Renamed");
    }
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
                      <DropdownMenuItem onClick={() => handleRename(w.id, w.name)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(w.id)}>
                        <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(w.id)}>
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
                    <Switch checked={w.enabled} onCheckedChange={() => handleToggle(w.id)} />
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
