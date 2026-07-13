import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Upload } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { useVideosStore } from "@/stores/videos-store";
import { useUiStore } from "@/stores/ui-store";

export const Route = createFileRoute("/media")({
  component: MediaLibrary,
});

function MediaLibrary() {
  const videos = useVideosStore((s) => s.items);
  const openUpload = useUiStore((s) => s.setUploadVideoOpen);

  return (
    <PageShell
      eyebrow="Assets"
      title="Media Library"
      description="Every thumbnail, poster, and image your videos reference — organized in one place."
      actions={
        <Button size="sm" onClick={() => openUpload(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload asset
        </Button>
      }
    >
      {videos.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No assets yet</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Thumbnails from uploaded videos will appear here.
          </p>
          <Button size="sm" className="mt-4" onClick={() => openUpload(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {videos.map((v, i) => (
            <div key={v.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                loading="lazy"
                decoding="async"
                src={v.thumbnail}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="line-clamp-1 text-[10px] text-white">thumb-{i + 1}.jpg</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
