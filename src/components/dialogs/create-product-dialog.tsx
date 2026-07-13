import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductsStore } from "@/stores/products-store";
import { useActivityStore } from "@/stores/activity-store";
import type { Product } from "@/lib/mock-data";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function CreateProductDialog({ open, onOpenChange }: Props) {
  const add = useProductsStore((s) => s.add);
  const log = useActivityStore((s) => s.log);
  const [form, setForm] = useState({
    title: "",
    price: "",
    inventory: "",
    vendor: "Atelier North",
    status: "draft" as Product["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setForm({ title: "", price: "", inventory: "", vendor: "Atelier North", status: "draft" });
    setErrors({});
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) next.price = "Enter a valid price";
    const inv = Number(form.inventory);
    if (!Number.isInteger(inv) || inv < 0) next.inventory = "Enter a whole number ≥ 0";
    if (!form.vendor.trim()) next.vendor = "Vendor is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const p = add({
      title: form.title,
      price,
      inventory: inv,
      vendor: form.vendor,
      status: form.status,
    });
    log("create", "Product added", p.title);
    toast.success("Product created");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add product</DialogTitle>
          <DialogDescription>
            Manually create a product to attach videos to. Sync from your storefront when connected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              placeholder="Linen Overshirt"
            />
            {errors.title && <div className="text-xs text-destructive">{errors.title}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Price (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="129.00"
              />
              {errors.price && <div className="text-xs text-destructive">{errors.price}</div>}
            </div>
            <div className="grid gap-1.5">
              <Label>Inventory</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.inventory}
                onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                placeholder="0"
              />
              {errors.inventory && (
                <div className="text-xs text-destructive">{errors.inventory}</div>
              )}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Vendor</Label>
            <Input
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            {errors.vendor && <div className="text-xs text-destructive">{errors.vendor}</div>}
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as Product["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
