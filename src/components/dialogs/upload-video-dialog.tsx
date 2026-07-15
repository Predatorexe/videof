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
import { useShopStore } from "@/stores/shop-store";
import { initiateVideoUpload, finalizeVideoUpload } from "@/lib/api/videos.functions";
import type { VideoRow } from "@/lib/adapters/videos";
import { withRetry } from "@/lib/retry";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPT = ["video/mp4", "video/quicktime", "video/webm"];

type Pending = {
  id: string;
  file: File;
  progress: number;
  done: boolean;
  error?: string;
  xhr?: XMLHttpRequest;
};

/** Upload a file to a presigned URL and report progress. */
function uploadToTicket(
  ticket: { uploadUrl: string; method: "POST" | "PUT"; fields?: Record<string, string>; headers?: Record<string, string> },
  file: File,
  onProgress: (pct: number) => void,
): { xhr: XMLHttpRequest; promise: Promise<void> } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    xhr.open(ticket.method, ticket.uploadUrl, true);
    if (ticket.method === "PUT" && ticket.headers) {
      for (const [k, v] of Object.entries(ticket.headers)) xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Cancelled"));

    if (ticket.method === "POST") {
      const form = new FormData();
      for (const [k, v] of Object.entries(ticket.fields ?? {})) form.append(k, v);
      form.append("file", file);
      xhr.send(form);
    } else {
      xhr.send(file);
    }
  });
  return { xhr, promise };
}

export function UploadVideoDialog() {
  const open = useUiStore((s) => s.uploadVideoOpen);
  const setOpen = useUiStore((s) => s.setUploadVideoOpen);
  const shopId = useShopStore((s) => s.shop?.id ?? null);
  const createFromUpload = useVideosStore((s) => s.createFromUpload);
  const applyServerRow = useVideosStore((s) => s.applyServerRow);
  const removeLocal = useVideosStore((s) => s.remove);
  const log = useActivityStore((s) => s.log);
  const notify = useNotificationsStore((s) => s.push);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  useEffect(() => {
    return () => {
      xhrsRef.current.forEach((x) => x.abort());
      xhrsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      xhrsRef.current.forEach((x) => x.abort());
      xhrsRef.current.clear();
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

  const setItem = (id: string, patch: Partial<Pending>) =>
    setPending((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const runRealUpload = async (item: Pending) => {
    if (!shopId) return;
    const title = item.file.name.replace(/\.[^.]+$/, "");
    let placeholderId: string | null = null;
    try {
      const { video, upload } = await initiateVideoUpload({
        data: {
          shopId,
          title,
          filename: item.file.name,
          contentType: item.file.type || "video/mp4",
          size: item.file.size,
        },
      });
      const row = video as VideoRow;
      placeholderId = row.id;
      applyServerRow(row);

      const { xhr, promise } = uploadToTicket(upload, item.file, (pct) =>
        setItem(item.id, { progress: Math.max(1, Math.min(99, pct)) }),
      );
      xhrsRef.current.set(item.id, xhr);
      setItem(item.id, { xhr });
      await promise;
      xhrsRef.current.delete(item.id);

      const finalized = (await withRetry(
        () => finalizeVideoUpload({ data: { id: row.id } }),
        { retries: 4, baseMs: 800, maxMs: 12_000 },
      )) as VideoRow;
      const v = applyServerRow(finalized, row.id);
      log("upload", "Video uploaded", v.title);
      notify({
        kind: "success",
        title: "Upload complete",
        body: `${v.title} finished processing.`,
      });
      setItem(item.id, { progress: 100, done: true });
    } catch (err) {
      xhrsRef.current.delete(item.id);
      if (placeholderId) removeLocal(placeholderId);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setItem(item.id, { done: true, error: msg });
      toast.error(`${item.file.name}: ${msg}`);
    }
  };

  const runPreviewUpload = (item: Pending) => {
    // Preview mode (no shop connected): create a local video record and
    // ramp progress to 100 without any network activity.
    const title = item.file.name.replace(/\.[^.]+$/, "");
    const duration = 20 + Math.round(Math.random() * 40);
    const v = createFromUpload({ title, size: item.file.size, durationSeconds: duration });
    log("upload", "Video uploaded", v.title);
    notify({ kind: "success", title: "Upload complete", body: `${v.title} added.` });
    setItem(item.id, { progress: 100, done: true });
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
    for (const item of created) {
      if (item.error) continue;
      if (shopId) void runRealUpload(item);
      else runPreviewUpload(item);
    }
  };

  const cancel = (id: string) => {
    const x = xhrsRef.current.get(id);
    if (x) {
      x.abort();
      xhrsRef.current.delete(id);
    }
    setItem(id, { done: true, error: "Cancelled" });
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
                          cancel(p.id);
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
