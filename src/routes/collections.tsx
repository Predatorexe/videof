import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { collections, fmt } from "@/lib/mock-data";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <PageShell
      eyebrow="Catalog"
      title="Collections"
      description="Group videos by campaign, season, or storefront category. Assign to carousels in one click."
      actions={
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New collection
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
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
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  Assign videos
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Open
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
