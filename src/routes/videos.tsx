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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { fmt, type Video } from "@/lib/mock-data";
import { copyToClipboard } from "@/lib/clipboard";
import { useVideosStore } from "@/stores/videos-store";
import { useUiStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";
import { AssignProductsDialog } from "@/components/dialogs/assign-products-dialog";

export const Route = createFileRoute("/videos")({
  component: VideosPage,
});

const PAGE_SIZE = 24;

function VideosPage() {
  const videos = useVideosStore((s) => s.items);
  const removeMany = useVideosStore((s) => s.removeMany);
  const removeOne = useVideosStore((s) => s.remove);
  const duplicate = useVideosStore((s) => s.duplicate);
  const rename = useVideosStore((s) => s.rename);
  const addTag = useVideosStore((s) => s.addTag);
  const openUpload = useUiStore((s) => s.setUploadVideoOpen);
  const log = useActivityStore((s) => s.log);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Video | null>(null);
  const [page, setPage] = useState(1);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmSingleDelete, setConfirmSingleDelete] = useState<Video | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; value: string } | null>(null);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [assignFor, setAssignFor] = useState<Video | null>(null);

  const allTags = useMemo(() => Array.from(new Set(videos.flatMap((v) => v.tags))).sort(), [videos]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return videos.filter((v) => {
      const matchesQ =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q)) ||
        v.id.toLowerCase().includes(q);
      const matchesS = status === "all" || v.status === status;
      const matchesT = tagFilter === "all" || v.tags.includes(tagFilter);
      return matchesQ && matchesS && matchesT;
    });
  }, [videos, query, status, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const doBulkDelete = () => {
    const ids = Array.from(selected);
    removeMany(ids);
    log("delete", `${ids.length} videos deleted`);
    toast.success(`${ids.length} video${ids.length === 1 ? "" : "s"} deleted`);
    clearSelection();
    setConfirmBulkDelete(false);
  };

  const commitRename = () => {
    if (!renameTarget) return;
    const next = renameTarget.value.trim();
    if (!next) return toast.error("Title cannot be empty");
    if (next.length > 120) return toast.error("Keep it under 120 characters");
    rename(renameTarget.id, next);
    log("update", "Video renamed", next);
    toast.success("Renamed");
    setRenameTarget(null);
  };

  const commitTag = () => {
    const t = tagValue.trim();
    if (!t) return toast.error("Enter a tag");
    if (t.length > 24) return toast.error("Tag must be under 24 characters");
    addTag(Array.from(selected), t);
    log("update", `Tag added to ${selected.size} videos`, t);
    toast.success(`Tag “${t}” added`);
    setTagValue("");
    setTagOpen(false);
  };

  return (
    <PageShell
      eyebrow="Library"
      title="Videos"
      description="Everything you've uploaded, imported, or scheduled. Drag files anywhere to upload."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => openUpload(true)}>
            <FolderInput className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button size="sm" onClick={() => openUpload(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search videos, tags, or IDs…"
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
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
        <Select
          value={tagFilter}
          onValueChange={(v) => {
            setTagFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue>
              <span className="inline-flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" /> {tagFilter === "all" ? "Any tag" : tagFilter}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any tag</SelectItem>
            {allTags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md border">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setView("list")}
            aria-label="List view"
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
            <Button variant="outline" size="sm" onClick={() => setTagOpen(true)}>
              <Tag className="mr-1.5 h-3.5 w-3.5" /> Add tag
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <Play className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No videos match your filters</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing filters, or upload something new.
          </p>
          <Button size="sm" className="mt-4" onClick={() => openUpload(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload video
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((v) => (
            <VideoCard
              key={v.id}
              v={v}
              selected={selected.has(v.id)}
              onSelect={() => toggleSelect(v.id)}
              onOpen={() => setPreview(v)}
              onRename={() => setRenameTarget({ id: v.id, value: v.title })}
              onDuplicate={() => {
                duplicate(v.id);
                log("create", "Video duplicated", v.title);
                toast.success("Duplicated");
              }}
              onDelete={() => setConfirmSingleDelete(v)}
              onAssign={() => setAssignFor(v)}
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
              {visible.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggleSelect(v.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => setPreview(v)} className="flex items-center gap-3 text-left">
                      <div className="h-9 w-14 shrink-0 overflow-hidden rounded bg-muted">
                        <img loading="lazy" decoding="async" src={v.thumbnail} alt="" className="h-full w-full object-cover" />
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
                  <td className="px-3 py-2 font-mono">
                    {v.views > 0 ? fmt.pct((v.clicks / v.views) * 100) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{v.size}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmt.date(v.uploadedAt)}</td>
                  <td className="px-3 py-2">
                    <VideoActions
                      v={v}
                      onRename={() => setRenameTarget({ id: v.id, value: v.title })}
                      onDuplicate={() => {
                        duplicate(v.id);
                        toast.success("Duplicated");
                      }}
                      onDelete={() => setConfirmSingleDelete(v)}
                      onAssign={() => setAssignFor(v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}
          –{(page - 1) * PAGE_SIZE + visible.length} of {filtered.length}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <div className="grid h-8 min-w-8 place-items-center rounded-md border px-2 font-mono">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
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
                  <img loading="lazy" decoding="async" src={preview.thumbnail} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 grid place-items-center bg-black/30">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Meta label="Views" value={fmt.n(preview.views)} />
                  <Meta label="Clicks" value={fmt.n(preview.clicks)} />
                  <Meta
                    label="CTR"
                    value={preview.views > 0 ? fmt.pct((preview.clicks / preview.views) * 100) : "—"}
                  />
                  <Meta label="Duration" value={preview.duration} />
                  <Meta label="Size" value={preview.size} />
                  <Meta label="Status" value={preview.status} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.tags.length === 0 && (
                      <span className="text-xs text-muted-foreground">No tags yet</span>
                    )}
                    {preview.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setAssignFor(preview);
                      setPreview(null);
                    }}
                  >
                    Assign products
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRenameTarget({ id: preview.id, value: preview.title });
                      setPreview(null);
                    }}
                  >
                    Rename
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} videos?</AlertDialogTitle>
            <AlertDialogDescription>
              These videos will be permanently removed and any widgets referencing them will stop showing them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doBulkDelete}
            >
              Delete videos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmSingleDelete} onOpenChange={(o) => !o && setConfirmSingleDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete video?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmSingleDelete?.title} will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmSingleDelete) {
                  removeOne(confirmSingleDelete.id);
                  log("delete", "Video deleted", confirmSingleDelete.title);
                  toast.success("Deleted");
                  setConfirmSingleDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename video</DialogTitle>
            <DialogDescription>Shown across the library and analytics.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={renameTarget?.value ?? ""}
            onChange={(e) => setRenameTarget((r) => (r ? { ...r, value: e.target.value } : r))}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
            maxLength={120}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagOpen} onOpenChange={setTagOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add tag to {selected.size} videos</DialogTitle>
            <DialogDescription>Tags help you filter and group videos in widgets.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="e.g. campaign, hero, ss24"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitTag()}
            maxLength={24}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagOpen(false)}>
              Cancel
            </Button>
            <Button onClick={commitTag}>Add tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {assignFor && (
        <AssignProductsDialog
          open={!!assignFor}
          onOpenChange={(o) => !o && setAssignFor(null)}
          videoId={assignFor.id}
          videoTitle={assignFor.title}
        />
      )}
    </PageShell>
  );
}

function VideoCard({
  v,
  selected,
  onSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onAssign,
}: {
  v: Video;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card transition ${
        selected ? "ring-2 ring-signal" : ""
      }`}
    >
      <div className="relative aspect-[9/12] overflow-hidden bg-muted">
        <img src={v.thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
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
              <span>{v.views > 0 ? fmt.pct((v.clicks / v.views) * 100) : "—"} CTR</span>
            </div>
          </button>
          <VideoActions
            v={v}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onAssign={onAssign}
          />
        </div>
      </div>
    </div>
  );
}

function VideoActions({
  v,
  onRename,
  onDuplicate,
  onDelete,
  onAssign,
}: {
  v: Video;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            copyToClipboard(
              `${typeof window !== "undefined" ? window.location.origin : ""}/videos#${v.id}`,
              { successMessage: "URL copied" },
            )
          }
        >
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAssign}>Assign products</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
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
