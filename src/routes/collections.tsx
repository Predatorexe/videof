import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
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
import { fmt, type Collection } from "@/lib/mock-data";
import { useCollectionsStore } from "@/stores/collections-store";
import { useUiStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  const items = useCollectionsStore((s) => s.items);
  const remove = useCollectionsStore((s) => s.remove);
  const addVideos = useCollectionsStore((s) => s.addVideos);
  const openCreate = useUiStore((s) => s.setCreateCollectionOpen);
  const log = useActivityStore((s) => s.log);
  const [confirmDelete, setConfirmDelete] = useState<Collection | null>(null);

  return (
    <PageShell
      eyebrow="Catalog"
      title="Collections"
      description="Group videos by campaign, season, or storefront category. Assign to carousels in one click."
      actions={
        <Button size="sm" onClick={() => openCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New collection
        </Button>
      }
    >
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <Layers className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No collections yet</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a collection to group videos by campaign or storefront category.
          </p>
          <Button size="sm" className="mt-4" onClick={() => openCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <article
              key={c.id}
              className="group overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={c.cover}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-2xl leading-tight text-white">{c.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-white/80">
                    <span>{c.productCount} products</span>
                    <span>·</span>
                    <span>{c.videoCount} videos</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
                <span>Updated {fmt.date(c.updatedAt)}</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      addVideos(c.id, 1);
                      log("update", "Video added to collection", c.title);
                      toast.success("Video added");
                    }}
                  >
                    Assign videos
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Delete collection"
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.title} will be removed. Videos stay in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) {
                  remove(confirmDelete.id);
                  log("delete", "Collection deleted", confirmDelete.title);
                  toast.success("Collection deleted");
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
