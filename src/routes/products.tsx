import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search, Plus, Film } from "lucide-react";
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
import { fmt, products, videos, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) &&
          (status === "all" || p.status === status),
      ),
    [query, status],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <PageShell
      eyebrow="Catalog"
      title="Products"
      description="Assign videos to products. Sync happens automatically from your storefront."
      actions={
        <>
          <Button variant="outline" size="sm">Sync catalog</Button>
          <Button size="sm">
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
            placeholder="Search products…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Filters
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-elevated px-4 py-2 text-sm">
          <span className="font-mono text-xs">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("Videos assigned")}>Bulk assign videos</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="cursor-pointer border-b last:border-b-0 hover:bg-muted/30" onClick={() => setActive(p)}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Assigned videos ({active.videoIds.length})
                    </div>
                    <Button size="sm" variant="outline">Add videos</Button>
                  </div>
                  <ul className="space-y-1.5">
                    {videos
                      .filter((v) => active.videoIds.includes(v.id))
                      .map((v) => (
                        <li key={v.id} className="flex items-center gap-3 rounded-md border p-2">
                          <div className="h-9 w-14 overflow-hidden rounded bg-muted">
                            <img loading="lazy" decoding="async" src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{v.title}</div>
                            <div className="text-[11px] text-muted-foreground">{v.duration} · {fmt.compact(v.views)} views</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => toast("Removed")}>Remove</Button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
