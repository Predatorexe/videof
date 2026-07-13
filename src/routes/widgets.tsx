import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fmt, type WidgetType } from "@/lib/mock-data";
import { useWidgetsStore } from "@/stores/widgets-store";
import { useVideosStore } from "@/stores/videos-store";
import { useUiStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";

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
  const openCreate = useUiStore((s) => s.setCreateWidgetOpen);
  const log = useActivityStore((s) => s.log);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);

  const handleToggle = (id: string, name: string, enabled: boolean) => {
    toggle(id);
    log("publish", enabled ? "Widget paused" : "Widget published", name);
    toast.success(enabled ? "Widget paused" : "Widget published");
  };

  const handleDuplicate = (id: string, name: string) => {
    duplicate(id);
    log("create", "Widget duplicated", name);
    toast.success("Duplicated");
  };

  const commitRename = () => {
    if (!renaming) return;
    const next = renaming.value.trim();
    if (!next) return toast.error("Name cannot be empty");
    if (next.length > 60) return toast.error("Keep it under 60 characters");
    rename(renaming.id, next);
    log("update", "Widget renamed", next);
    toast.success("Renamed");
    setRenaming(null);
  };

  return (
    <PageShell
      eyebrow="Storefront"
      title="Widgets"
      description="Every video surface running on your storefront — carousels, stories, popups, and floating reels."
      actions={
        <Button size="sm" onClick={() => openCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New widget
        </Button>
      }
    >
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No widgets yet</div>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Widgets are what your customers see. Create your first carousel, floating reel, or story strip.
          </p>
          <Button size="sm" className="mt-4" onClick={() => openCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create widget
          </Button>
        </div>
      ) : (
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
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{w.placement}</div>
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
                        <DropdownMenuItem onClick={() => setRenaming({ id: w.id, value: w.name })}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(w.id, w.name)}>
                          <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setPendingDelete({ id: w.id, name: w.name })}
                        >
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
                      <Switch
                        checked={w.enabled}
                        onCheckedChange={() => handleToggle(w.id, w.name, w.enabled)}
                      />
                      <span className="text-muted-foreground">{w.enabled ? "Live" : "Paused"}</span>
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
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete widget?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing <span className="font-medium text-foreground">{pendingDelete?.name}</span> will stop it from
              rendering on your storefront. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete.id);
                  log("delete", "Widget deleted", pendingDelete.name);
                  toast.success("Widget deleted");
                  setPendingDelete(null);
                }
              }}
            >
              Delete widget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename widget</AlertDialogTitle>
            <AlertDialogDescription>
              Widget names are shown in the editor and analytics — pick something clear.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            autoFocus
            value={renaming?.value ?? ""}
            onChange={(e) => setRenaming((r) => (r ? { ...r, value: e.target.value } : r))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={80}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={commitRename}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
