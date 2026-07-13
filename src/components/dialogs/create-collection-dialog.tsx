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
import { useCollectionsStore } from "@/stores/collections-store";
import { useActivityStore } from "@/stores/activity-store";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function CreateCollectionDialog({ open, onOpenChange }: Props) {
  const add = useCollectionsStore((s) => s.add);
  const log = useActivityStore((s) => s.log);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (title.trim().length > 60) {
      setError("Keep it under 60 characters");
      return;
    }
    const c = add({ title });
    log("create", "Collection created", c.title);
    toast.success("Collection created");
    setTitle("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setTitle("");
          setError(null);
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New collection</DialogTitle>
          <DialogDescription>
            Group videos and products. Assign to carousels or grids from the widget editor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Spring Essentials"
            autoFocus
          />
          {error && <div className="text-xs text-destructive">{error}</div>}
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
