import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Filter, Search, Plus, Film, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { fmt, type Product } from "@/lib/mock-data";
import { useProductsStore } from "@/stores/products-store";
import { useVideosStore } from "@/stores/videos-store";
import { useUiStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";
import { apiCall, withRetry } from "@/lib/mock-api";
import { exportCsv } from "@/lib/csv";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const products = useProductsStore((s) => s.items);
  const videos = useVideosStore((s) => s.items);
  const removeProduct = useProductsStore((s) => s.remove);
  const assignVideos = useProductsStore((s) => s.assignVideos);
  const bulkAssign = useProductsStore((s) => s.bulkAssignVideos);
  const importMany = useProductsStore((s) => s.importMany);
  const openCreate = useUiStore((s) => s.setCreateProductOpen);
  const log = useActivityStore((s) => s.log);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Product | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedVideos, setBulkSelectedVideos] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.vendor.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase())) &&
          (status === "all" || p.status === status),
      ),
    [products, query, status],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const doSync = async () => {
    setSyncing(true);
    try {
      await withRetry(() => apiCall({ minDelay: 600, maxDelay: 1400, failureRate: 0.15 }), {
        retries: 2,
      });
      log("import", "Catalog synced");
      toast.success("Catalog synced");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [] as ReturnType<typeof importMany>;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = {
      title: header.indexOf("title"),
      price: header.indexOf("price"),
      inventory: header.indexOf("inventory"),
      vendor: header.indexOf("vendor"),
    };
    if (idx.title < 0) throw new Error("CSV must include a 'title' column");
    const rows = lines.slice(1).map((l) => {
      const cells = l.split(",");
      return {
        title: (cells[idx.title] ?? "").trim() || "Untitled",
        price: Number(cells[idx.price] ?? 0) || 0,
        inventory: Number(cells[idx.inventory] ?? 0) || 0,
        vendor: (cells[idx.vendor] ?? "Untitled vendor").trim(),
        status: "active" as const,
      };
    });
    return importMany(rows);
  };

  const onImportChange = async (file: File) => {
    try {
      const text = await file.text();
      const created = parseCsv(text);
      log("import", `${created.length} products imported`, file.name);
      toast.success(`${created.length} product${created.length === 1 ? "" : "s"} imported`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  const doExport = () => {
    exportCsv(
      "products",
      filtered.map((p) => ({
        id: p.id,
        title: p.title,
        vendor: p.vendor,
        price: p.price,
        inventory: p.inventory,
        status: p.status,
        videos: p.videoIds.length,
      })),
    );
    log("export", `${filtered.length} products exported to CSV`);
    toast.success("CSV downloaded");
  };

  const doBulkAssign = () => {
    const vids = Array.from(bulkSelectedVideos);
    if (vids.length === 0) return toast.error("Pick at least one video");
    bulkAssign(Array.from(selected), vids);
    toast.success(
      `${vids.length} video${vids.length === 1 ? "" : "s"} assigned to ${selected.size} product${
        selected.size === 1 ? "" : "s"
      }`,
    );
    log("update", `${vids.length} videos assigned to ${selected.size} products`);
    setBulkSelectedVideos(new Set());
    setBulkAssignOpen(false);
    setSelected(new Set());
  };

  return (
    <PageShell
      eyebrow="Catalog"
      title="Products"
      description="Assign videos to products. Sync happens automatically from your storefront."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Download className="mr-1.5 h-3.5 w-3.5 rotate-180" /> Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportChange(f);
              e.currentTarget.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={doSync} disabled={syncing}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync catalog"}
          </Button>
          <Button size="sm" onClick={() => openCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add product
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, vendors, or IDs…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={doExport}>
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-elevated px-4 py-2 text-sm">
          <span className="font-mono text-xs">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkAssignOpen(true)}>
              Bulk assign videos
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-12 text-center">
          <Film className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-display text-xl">No products yet</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a product manually, import a CSV, or sync your storefront.
          </p>
          <Button size="sm" className="mt-4" onClick={() => openCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add product
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Inventory</th>
                <th className="px-3 py-2">Videos</th>
                <th className="px-3 py-2">Status</th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer border-b last:border-b-0 hover:bg-muted/30"
                  onClick={() => setActive(p)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img loading="lazy" decoding="async" src={p.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.vendor}</td>
                  <td className="px-3 py-2 font-mono">{fmt.money(p.price)}</td>
                  <td className="px-3 py-2 font-mono">{p.inventory}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
                      <Film className="h-3 w-3" /> {p.videoIds.length}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Delete product"
                      onClick={() => setConfirmDelete(p)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{active.title}</SheetTitle>
                <SheetDescription>
                  {active.vendor} · {fmt.money(active.price)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                <img loading="lazy" decoding="async" src={active.image} alt="" className="h-56 w-full rounded-lg object-cover" />
                <ProductVideoManager
                  productId={active.id}
                  assignedIds={active.videoIds}
                  allVideos={videos}
                  onChange={(ids) => {
                    assignVideos(active.id, ids);
                    setActive({ ...active, videoIds: ids });
                    toast.success("Assignments saved");
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.title} will be removed. Videos will remain but lose this assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) {
                  removeProduct(confirmDelete.id);
                  log("delete", "Product deleted", confirmDelete.title);
                  toast.success("Product deleted");
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Assign videos to {selected.size} products</AlertDialogTitle>
            <AlertDialogDescription>
              Pick videos to attach to every selected product. Existing assignments are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-1 overflow-auto rounded-md border p-2">
            {videos.map((v) => (
              <label key={v.id} className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-muted">
                <Checkbox
                  checked={bulkSelectedVideos.has(v.id)}
                  onCheckedChange={() =>
                    setBulkSelectedVideos((prev) => {
                      const next = new Set(prev);
                      if (next.has(v.id)) next.delete(v.id);
                      else next.add(v.id);
                      return next;
                    })
                  }
                />
                <span className="truncate text-sm">{v.title}</span>
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doBulkAssign}>Assign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ProductVideoManager({
  productId: _productId,
  assignedIds,
  allVideos,
  onChange,
}: {
  productId: string;
  assignedIds: string[];
  allVideos: ReturnType<typeof useVideosStore.getState>["items"];
  onChange: (ids: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState<Set<string>>(new Set());
  const assigned = allVideos.filter((v) => assignedIds.includes(v.id));
  const available = allVideos.filter((v) => !assignedIds.includes(v.id));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Assigned videos ({assigned.length})
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add videos"}
        </Button>
      </div>
      {adding && (
        <div className="mb-3 rounded-md border p-2">
          <div className="max-h-40 space-y-1 overflow-auto">
            {available.length === 0 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                All videos already assigned.
              </div>
            )}
            {available.map((v) => (
              <label
                key={v.id}
                className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-muted"
              >
                <Checkbox
                  checked={pick.has(v.id)}
                  onCheckedChange={() =>
                    setPick((prev) => {
                      const next = new Set(prev);
                      if (next.has(v.id)) next.delete(v.id);
                      else next.add(v.id);
                      return next;
                    })
                  }
                />
                <span className="truncate text-sm">{v.title}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPick(new Set())}>
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (pick.size === 0) return;
                onChange([...assignedIds, ...Array.from(pick)]);
                setPick(new Set());
                setAdding(false);
              }}
            >
              Add {pick.size || ""}
            </Button>
          </div>
        </div>
      )}
      <ul className="space-y-1.5">
        {assigned.length === 0 && (
          <li className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No videos assigned yet.
          </li>
        )}
        {assigned.map((v) => (
          <li key={v.id} className="flex items-center gap-3 rounded-md border p-2">
            <div className="h-9 w-14 overflow-hidden rounded bg-muted">
              <img loading="lazy" decoding="async" src={v.thumbnail} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{v.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {v.duration} · {fmt.compact(v.views)} views
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(assignedIds.filter((id) => id !== v.id))}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
