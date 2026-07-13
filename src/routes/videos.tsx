import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Filter,
  Grid3x3,
  List,
  Play,
  Search,
  Trash2,
  Upload,
  MoreHorizontal,
  Tag,
  FolderInput,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { fmt, videos, type Video } from "@/lib/mock-data";

export const Route = createFileRoute("/videos")({
  component: VideosPage,
});

function VideosPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Video | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const matchesQ = v.title.toLowerCase().includes(query.toLowerCase());
      const matchesS = status === "all" || v.status === status;
      return matchesQ && matchesS;
    });
  }, [query, status]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <PageShell
      eyebrow="Library"
      title="Videos"
      description="Everything you've uploaded, imported, or scheduled. Drag files anywhere to upload."
      actions={
        <>
          <Button variant="outline" size="sm">
            <FolderInput className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
            </DialogTrigger>
            <UploadDialog onDone={() => setUploadOpen(false)} />
          </Dialog>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, tags, or products…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Filters
        </Button>
        <div className="flex overflow-hidden rounded-md border">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setView("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-elevated px-4 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs">{selected.size} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Tag className="mr-1.5 h-3.5 w-3.5" /> Add tag
            </Button>
            <Button variant="outline" size="sm">
              <FolderInput className="mr-1.5 h-3.5 w-3.5" /> Move
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                toast.success(`${selected.size} videos deleted`);
                clearSelection();
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((v) => (
            <VideoCard
              key={v.id}
              v={v}
              selected={selected.has(v.id)}
              onSelect={() => toggleSelect(v.id)}
              onOpen={() => setPreview(v)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">CTR</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggleSelect(v.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setPreview(v)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="h-9 w-14 shrink-0 overflow-hidden rounded bg-muted">
                        <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                      </div>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{v.title}</span>
                        <span className="text-[11px] text-muted-foreground">{v.duration}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-3 py-2 font-mono">{fmt.compact(v.views)}</td>
                  <td className="px-3 py-2 font-mono">{fmt.pct((v.clicks / v.views) * 100)}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{v.size}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmt.date(v.uploadedAt)}</td>
                  <td className="px-3 py-2">
                    <VideoActions v={v} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filtered.length} of {videos.length}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>

      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{preview.title}</SheetTitle>
                <SheetDescription>{fmt.date(preview.uploadedAt)}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="relative aspect-[9/16] max-h-[420px] overflow-hidden rounded-lg bg-muted">
                  <img src={preview.thumbnail} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 grid place-items-center bg-black/30">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Meta label="Views" value={fmt.n(preview.views)} />
                  <Meta label="Clicks" value={fmt.n(preview.clicks)} />
                  <Meta label="CTR" value={fmt.pct((preview.clicks / preview.views) * 100)} />
                  <Meta label="Duration" value={preview.duration} />
                  <Meta label="Size" value={preview.size} />
                  <Meta label="Status" value={preview.status} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Tags
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    Assign products
                  </Button>
                  <Button size="sm" variant="outline">
                    Rename
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function VideoCard({
  v,
  selected,
  onSelect,
  onOpen,
}: {
  v: Video;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card transition ${
        selected ? "ring-2 ring-signal" : ""
      }`}
    >
      <div className="relative aspect-[9/12] overflow-hidden bg-muted">
        <img
          src={v.thumbnail}
          alt=""
          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="bg-background/80 backdrop-blur"
          />
          <StatusBadge status={v.status} />
        </div>
        <button
          onClick={onOpen}
          className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100"
        >
          <Play className="h-10 w-10 text-white" />
        </button>
        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
          {v.duration}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-medium">{v.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{fmt.compact(v.views)} views</span>
              <span>·</span>
              <span>{fmt.pct((v.clicks / v.views) * 100)} CTR</span>
            </div>
          </button>
          <VideoActions v={v} />
        </div>
      </div>
    </div>
  );
}

function VideoActions({ v }: { v: Video }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast(`Editing ${v.title}`)}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Duplicated")}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(v.id).then(() => toast("URL copied"))}>
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuItem>Assign products</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => toast.success("Deleted")}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: Video["status"] }) {
  const map: Record<Video["status"], { label: string; className: string }> = {
    published: { label: "Live", className: "bg-signal text-signal-foreground border-transparent" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground border-transparent" },
    processing: { label: "Processing", className: "bg-ember/20 text-ember border-transparent" },
  };
  const s = map[status];
  return (
    <Badge className={`h-5 rounded-sm px-1.5 text-[10px] font-medium ${s.className}`}>{s.label}</Badge>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-xs capitalize">{value}</div>
    </div>
  );
}

function UploadDialog({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const start = () => {
    setUploading(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setUploading(false);
          toast.success("Upload complete");
          onDone();
          return 100;
        }
        return p + 6;
      });
    }, 120);
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">Upload video</DialogTitle>
        <DialogDescription>MP4, MOV, or WebM. Up to 500 MB per file.</DialogDescription>
      </DialogHeader>
      <div className="mt-2 grid place-items-center rounded-lg border-2 border-dashed p-10 text-center">
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-medium">Drop files here</div>
        <div className="text-xs text-muted-foreground">or click to browse from your device</div>
        {uploading && (
          <div className="mt-4 w-full">
            <Progress value={progress} />
            <div className="mt-1 text-right font-mono text-[11px] text-muted-foreground">
              {progress}%
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={start} disabled={uploading}>
          {uploading ? "Uploading…" : "Start upload"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
