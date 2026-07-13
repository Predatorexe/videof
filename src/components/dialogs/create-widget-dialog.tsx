import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWidgetsStore } from "@/stores/widgets-store";
import { useActivityStore } from "@/stores/activity-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { newId } from "@/lib/mock-api";
import type { Widget, WidgetType } from "@/lib/mock-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TYPES: { value: WidgetType; label: string }[] = [
  { value: "carousel", label: "Carousel" },
  { value: "floating", label: "Floating bubble" },
  { value: "story", label: "Story strip" },
  { value: "product", label: "Product reel" },
  { value: "collection", label: "Collection" },
  { value: "grid", label: "Grid" },
  { value: "hero", label: "Hero banner" },
  { value: "popup", label: "Popup" },
  { value: "instagram", label: "Instagram wall" },
  { value: "tiktok", label: "TikTok row" },
];

export function CreateWidgetDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WidgetType>("carousel");
  const [placement, setPlacement] = useState("Homepage");
  const [errors, setErrors] = useState<{ name?: string; placement?: string }>({});
  const items = useWidgetsStore((s) => s.items);
  const log = useActivityStore((s) => s.log);
  const notify = useNotificationsStore((s) => s.push);

  const isDupe = useMemo(
    () => items.some((w) => w.name.toLowerCase() === name.trim().toLowerCase()),
    [items, name],
  );

  const reset = () => {
    setName("");
    setType("carousel");
    setPlacement("Homepage");
    setErrors({});
  };

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length > 60) next.name = "Keep it under 60 characters";
    else if (isDupe) next.name = "A widget with this name already exists";
    if (!placement.trim()) next.placement = "Placement is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const w: Widget = {
      id: newId("wid"),
      name: name.trim(),
      type,
      enabled: false,
      placement: placement.trim(),
      impressions: 0,
      ctr: 0,
      updatedAt: new Date().toISOString(),
    };
    useWidgetsStore.setState((s) => ({ items: [w, ...s.items] }));
    log("create", "Widget created", w.name);
    notify({ kind: "success", title: "Widget created", body: `${w.name} is ready to publish.` });
    toast.success("Widget created");
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
          <DialogTitle className="font-display text-2xl">New widget</DialogTitle>
          <DialogDescription>
            Give your widget a name, pick a type, and choose where it renders.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homepage Reel Carousel"
              maxLength={80}
            />
            {errors.name && <div className="text-xs text-destructive">{errors.name}</div>}
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Placement</Label>
            <Textarea
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              placeholder="Homepage, Product pages, Collection: New Arrivals…"
              rows={2}
            />
            {errors.placement && (
              <div className="text-xs text-destructive">{errors.placement}</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
