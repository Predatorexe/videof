import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fmt } from "@/lib/mock-data";
import { useProductsStore } from "@/stores/products-store";
import { useVideosStore } from "@/stores/videos-store";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  videoId: string;
  videoTitle: string;
};

export function AssignProductsDialog({ open, onOpenChange, videoId, videoTitle }: Props) {
  const products = useProductsStore((s) => s.items);
  const assignVideos = useProductsStore((s) => s.assignVideos);
  const assignVideoProducts = useVideosStore((s) => s.assignProducts);
  const video = useVideosStore((s) => s.items.find((v) => v.id === videoId));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(video?.productIds ?? []),
  );

  const filtered = useMemo(
    () => products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    const ids = Array.from(selected);
    assignVideoProducts(videoId, ids);
    // Reflect on product side too.
    products.forEach((p) => {
      const shouldContain = selected.has(p.id);
      const has = p.videoIds.includes(videoId);
      if (shouldContain && !has) {
        assignVideos(p.id, [...p.videoIds, videoId]);
      } else if (!shouldContain && has) {
        assignVideos(
          p.id,
          p.videoIds.filter((v) => v !== videoId),
        );
      }
    });
    toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} assigned`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Assign products</DialogTitle>
          <DialogDescription>
            Link products to <span className="font-medium text-foreground">{videoTitle}</span>. Shoppers can tap to
            view them in-stream.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9"
        />
        <ScrollArea className="h-72 rounded-md border">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No products match “{query}”.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <Checkbox
                    checked={selected.has(p.id)}
                    onCheckedChange={() => toggle(p.id)}
                  />
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.vendor} · {fmt.money(p.price)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save assignments</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
