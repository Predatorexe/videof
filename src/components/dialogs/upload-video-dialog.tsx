import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useVideosStore } from "@/stores/videos-store";
import { useActivityStore } from "@/stores/activity-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useUiStore } from "@/stores/ui-store";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPT = ["video/mp4", "video/quicktime", "video/webm"];

type Pending = {
  id: string;
  file: File;
  progress: number;
  done: boolean;
  error?: string;
};

export function UploadVideoDialog() {
  const open = useUiStore((s) => s.uploadVideoOpen);
  const setOpen = useUiStore((s) => s.setUploadVideoOpen);
  const createFromUpload = useVideosStore((s) => s.createFromUpload);
  const log = useActivityStore((s) => s.log);
  const notify = useNotificationsStore((s) => s.push);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const timersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
      setPending([]);
      setDragOver(false);
    }
  }, [open]);

  const validate = (f: File): string | null => {
    if (f.size > MAX_BYTES) return "File exceeds the 500 MB limit";
    if (ACCEPT.length && !ACCEPT.includes(f.type) && !/\.(mp4|mov|webm)$/i.test(f.name)) {
      return "Unsupported format. Use MP4, MOV, or WebM.";
    }
    return null;
  };

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const created: Pending[] = [];
    for (const f of arr) {
      const err = validate(f);
      const id = `${f.name}-${f.size}-${Date.now()}-${Math.random()}`;
      created.push({ id, file: f, progress: err ? 100 : 0, done: !!err, error: err ?? undefined });
      if (err) toast.error(`${f.name}: ${err}`);
    }
    if (created.length === 0) return;
    setPending((p) => [...p, ...created]);
    // Simulate progress + creation for valid files.
    created
      .filter((p) => !p.error)
      .forEach((p) => {
        const step = () => {
          const t = window.setTimeout(() => {
            timersRef.current.delete(t);
            setPending((prev) =>
              prev.map((x) => {
                if (x.id !== p.id || x.done) return x;
                const next = Math.min(100, x.progress + Math.round(8 + Math.random() * 14));
                if (next >= 100) {
                  const duration = 20 + Math.round(Math.random() * 40);
                  const title = p.file.name.replace(/\.[^.]+$/, "");
                  const v = createFromUpload({
                    title,
                    size: p.file.size,
                    durationSeconds: duration,
                  });
                  log("upload", "Video uploaded", v.title);
                  notify({
                    kind: "success",
                    title: "Upload complete",
                    body: `${v.title} finished processing.`,
                  });
                  return { ...x, progress: 100, done: true };
                }
                step();
                return { ...x, progress: next };
              }),
            );
          }, 140);
          timersRef.current.add(t);
        };
        step();
      });
  };

  const allDone = pending.length > 0 && pending.every((p) => p.done);
  const successCount = pending.filter((p) => p.done && !p.error).length;

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Upload videos</DialogTitle>
          <DialogDescription>MP4, MOV, or WebM. Up to 500 MB per file.</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`grid cursor-pointer place-items-center rounded-lg border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-signal bg-signal/5" : ""
          }`}
        >
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium">Drop files here</div>
          <div className="text-xs text-muted-foreground">
            or click to browse from your device
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            hidden
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {pending.length > 0 && (
          <ul className="max-h-56 space-y-2 overflow-auto">
            {pending.map((p) => (
              <li key={p.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{p.file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {(p.file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    {!p.done && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPending((prev) =>
                            prev.map((x) => (x.id === p.id ? { ...x, done: true, error: "Cancelled" } : x)),
                          );
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <Progress
                  value={p.progress}
                  className={`mt-1.5 h-1 ${p.error ? "opacity-60" : ""}`}
                />
                <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>{p.error ? p.error : p.done ? "Ready" : "Uploading…"}</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {allDone ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={() => {
              if (allDone) {
                if (successCount > 0) toast.success(`${successCount} video${successCount === 1 ? "" : "s"} added`);
                setOpen(false);
              } else {
                inputRef.current?.click();
              }
            }}
          >
            {allDone ? "Done" : pending.length > 0 ? "Add more" : "Choose files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
