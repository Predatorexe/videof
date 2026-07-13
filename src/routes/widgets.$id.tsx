import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmt } from "@/lib/mock-data";
import {
  defaultWidgetSettings,
  useWidgetsStore,
  type WidgetPosition,
  type WidgetSettings,
} from "@/stores/widgets-store";
import { useVideosStore } from "@/stores/videos-store";
import { useProductsStore } from "@/stores/products-store";
import { useCollectionsStore } from "@/stores/collections-store";
import { useActivityStore } from "@/stores/activity-store";
import { WidgetRenderer } from "@/components/widget/widget-renderer";
import { copyToClipboard } from "@/lib/clipboard";
import { WidgetPlayer } from "@/components/widget/widget-player";

export const Route = createFileRoute("/widgets/$id")({
  loader: ({ params }) => {
    const widget = useWidgetsStore.getState().items.find((w) => w.id === params.id);
    if (!widget) throw notFound();
    return { id: params.id };
  },
  component: WidgetBuilder,
  notFoundComponent: () => (
    <PageShell title="Widget not found">
      <Button asChild variant="outline">
        <Link to="/widgets">Back to widgets</Link>
      </Button>
    </PageShell>
  ),
});

type Device = "desktop" | "tablet" | "mobile";

function WidgetBuilder() {
  const { id } = Route.useLoaderData();
  const widget = useWidgetsStore((s) => s.items.find((w) => w.id === id));
  const stored = useWidgetsStore((s) => s.settings[id]);
  const meta = useWidgetsStore((s) => s.meta[id]);
  const updateSettings = useWidgetsStore((s) => s.updateSettings);
  const publish = useWidgetsStore((s) => s.publish);
  const log = useActivityStore((s) => s.log);

  const baseline = stored ?? defaultWidgetSettings;
  const [draft, setDraft] = useState<WidgetSettings>(baseline);
  const [device, setDevice] = useState<Device>("desktop");
  const [previewLive, setPreviewLive] = useState(false);

  useEffect(() => {
    setDraft(baseline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, stored]);

  if (!widget) return null;

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const set = <K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    updateSettings(id, draft);
    log("update", "Widget saved", widget.name);
    toast.success("Widget saved");
  };

  const handlePublish = () => {
    updateSettings(id, draft);
    const info = publish(id);
    log("publish", `Widget published · v${info.version}`, widget.name);
    toast.success(`${widget.name} published · v${info.version}`);
  };

  const handleCancel = () => {
    setDraft(baseline);
    toast("Changes discarded");
  };

  const previewW = device === "desktop" ? "100%" : device === "tablet" ? 720 : 380;

  return (
    <PageShell
      eyebrow={`Widget Builder · ${widget.type}${widget.enabled ? " · Live" : " · Paused"}`}
      title={widget.name}
      description="Compose content, tune every layer, and launch the exact experience your customers see."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/widgets">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Widgets
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewLive(true)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={!dirty}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!dirty}>
            Save draft
          </Button>
          <Button size="sm" onClick={handlePublish}>
            {widget.enabled ? "Republish" : "Publish"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card p-4">
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 space-y-5">
              <VideosPicker
                selected={draft.videoIds}
                onChange={(ids) => set("videoIds", ids)}
              />
              <ProductsPicker
                selected={draft.productIds}
                onChange={(ids) => set("productIds", ids)}
              />
              <CollectionsPicker
                selected={draft.collectionIds}
                onChange={(ids) => set("collectionIds", ids)}
              />
            </TabsContent>

            <TabsContent value="design" className="mt-4 space-y-5">
              <SubHeader>Colors</SubHeader>
              <ColorField label="Accent" value={draft.colors.accent} onChange={(v) => set("colors", { ...draft.colors, accent: v })} />
              <ColorField label="Background" value={draft.colors.background} onChange={(v) => set("colors", { ...draft.colors, background: v })} />
              <ColorField label="Text" value={draft.colors.text} onChange={(v) => set("colors", { ...draft.colors, text: v })} />
              <ColorField label="CTA background" value={draft.colors.cta} onChange={(v) => set("colors", { ...draft.colors, cta: v })} />
              <ColorField label="CTA text" value={draft.colors.ctaText} onChange={(v) => set("colors", { ...draft.colors, ctaText: v })} />

              <SubHeader>Typography</SubHeader>
              <Field label="Heading font">
                <Select
                  value={draft.typography.headingFont}
                  onValueChange={(v) => set("typography", { ...draft.typography, headingFont: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Geist", "Instrument Serif", "Inter", "System"].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Body font">
                <Select
                  value={draft.typography.bodyFont}
                  onValueChange={(v) => set("typography", { ...draft.typography, bodyFont: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Geist", "Instrument Serif", "Inter", "System"].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Heading size · ${draft.typography.headingSize}px`}>
                <Slider
                  value={[draft.typography.headingSize]}
                  min={12} max={48} step={1}
                  onValueChange={([v]) => set("typography", { ...draft.typography, headingSize: v })}
                />
              </Field>
              <Field label={`Body size · ${draft.typography.bodySize}px`}>
                <Slider
                  value={[draft.typography.bodySize]}
                  min={10} max={22} step={1}
                  onValueChange={([v]) => set("typography", { ...draft.typography, bodySize: v })}
                />
              </Field>

              <SubHeader>Layout</SubHeader>
              <Field label={`Corner radius · ${draft.radius}px`}>
                <Slider value={[draft.radius]} max={32} step={1} onValueChange={([v]) => set("radius", v)} />
              </Field>
              <Field label={`Spacing · ${draft.spacing}px`}>
                <Slider value={[draft.spacing]} max={48} step={2} onValueChange={([v]) => set("spacing", v)} />
              </Field>
              <Field label="Aspect ratio">
                <Select value={draft.aspectRatio} onValueChange={(v) => set("aspectRatio", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 · Portrait</SelectItem>
                    <SelectItem value="1:1">1:1 · Square</SelectItem>
                    <SelectItem value="4:5">4:5</SelectItem>
                    <SelectItem value="16:9">16:9 · Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            <TabsContent value="behavior" className="mt-4 space-y-5">
              <SubHeader>Playback</SubHeader>
              <Row label="Autoplay" checked={draft.autoplay} onChange={(v) => set("autoplay", v)} />
              <Row label="Loop" checked={draft.loop} onChange={(v) => set("loop", v)} />
              <Row label="Muted by default" checked={draft.muted} onChange={(v) => set("muted", v)} />
              <Row label="Show native controls" checked={draft.controls} onChange={(v) => set("controls", v)} />

              <SubHeader>Device visibility</SubHeader>
              <Row label="Show on desktop" checked={draft.desktopEnabled} onChange={(v) => set("desktopEnabled", v)} />
              <Row label="Show on mobile" checked={draft.mobileEnabled} onChange={(v) => set("mobileEnabled", v)} />

              <SubHeader>Position</SubHeader>
              <Field label="Widget position">
                <Select value={draft.position} onValueChange={(v) => set("position", v as WidgetPosition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inline">Inline (in-page)</SelectItem>
                    <SelectItem value="bottom-right">Floating · Bottom right</SelectItem>
                    <SelectItem value="bottom-left">Floating · Bottom left</SelectItem>
                    <SelectItem value="top-right">Floating · Top right</SelectItem>
                    <SelectItem value="top-left">Floating · Top left</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <SubHeader>CTA button</SubHeader>
              <Row label="Show CTA" checked={draft.cta.enabled} onChange={(v) => set("cta", { ...draft.cta, enabled: v })} />
              <Field label="CTA label">
                <Input value={draft.cta.label} onChange={(e) => set("cta", { ...draft.cta, label: e.target.value })} />
              </Field>
              <Field label="CTA style">
                <Select value={draft.cta.style} onValueChange={(v) => set("cta", { ...draft.cta, style: v as "solid" | "outline" | "ghost" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <SubHeader>Product card</SubHeader>
              <Row label="Show price" checked={draft.productCard.showPrice} onChange={(v) => set("productCard", { ...draft.productCard, showPrice: v })} />
              <Row label="Show vendor" checked={draft.productCard.showVendor} onChange={(v) => set("productCard", { ...draft.productCard, showVendor: v })} />
              <Row label="Show CTA on card" checked={draft.productCard.showCta} onChange={(v) => set("productCard", { ...draft.productCard, showCta: v })} />
              <Field label="Product card CTA">
                <Input value={draft.productCard.ctaLabel} onChange={(e) => set("productCard", { ...draft.productCard, ctaLabel: e.target.value })} />
              </Field>

              <SubHeader>Animations</SubHeader>
              <Field label="Transition">
                <Select value={draft.animation} onValueChange={(v) => set("animation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Duration · ${draft.animationDuration}ms`}>
                <Slider
                  value={[draft.animationDuration]}
                  min={0} max={1200} step={50}
                  onValueChange={([v]) => set("animationDuration", v)}
                />
              </Field>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-5">
              <Field label="Placement selector">
                <Input
                  value={draft.placementSelector}
                  onChange={(e) => set("placementSelector", e.target.value)}
                  placeholder="#hero, .product-form"
                  className="font-mono"
                />
              </Field>
              <Field label="Custom CSS">
                <textarea
                  value={draft.customCss}
                  onChange={(e) => set("customCss", e.target.value)}
                  className="h-40 w-full resize-none rounded-md border bg-background p-2 font-mono text-xs"
                  placeholder=".videofy-widget { ... }"
                />
              </Field>
            </TabsContent>
          </Tabs>
        </aside>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Live Store Preview
                {dirty && <Badge variant="secondary" className="ml-1 h-4 text-[9px]">Unsaved</Badge>}
              </div>
              <div className="flex overflow-hidden rounded-md border">
                {([
                  { v: "desktop", Icon: Monitor },
                  { v: "tablet", Icon: Tablet },
                  { v: "mobile", Icon: Smartphone },
                ] as const).map(({ v, Icon }) => (
                  <Button
                    key={v}
                    size="icon"
                    variant={device === v ? "secondary" : "ghost"}
                    onClick={() => setDevice(v as Device)}
                    className="h-8 w-8 rounded-none"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid min-h-[520px] place-items-center bg-elevated p-6">
              <div
                style={{
                  width: previewW,
                  maxWidth: "100%",
                  background: draft.colors.background,
                  color: draft.colors.text,
                  borderRadius: draft.radius,
                }}
                className="relative overflow-hidden p-6 shadow-2xl transition-all"
              >
                <StorefrontMock accent={draft.colors.accent} />
                <div className="mt-6">
                  <WidgetRenderer widget={widget} settings={draft} device={device} boxed={false} />
                </div>
              </div>
            </div>
          </div>

          <PublishPanel widgetId={id} meta={meta} onPreview={() => setPreviewLive(true)} />
        </div>
      </div>

      {previewLive && (
        <LivePreviewLauncher widgetId={id} onClose={() => setPreviewLive(false)} />
      )}
    </PageShell>
  );
}

/* ---------- Live preview launcher ---------- */

function LivePreviewLauncher({ widgetId, onClose }: { widgetId: string; onClose: () => void }) {
  const widget = useWidgetsStore((s) => s.items.find((w) => w.id === widgetId));
  const settings = useWidgetsStore((s) => s.settings[widgetId]) ?? defaultWidgetSettings;
  const videos = useVideosStore((s) => s.items);
  const products = useProductsStore((s) => s.items);

  const chosenVideos = useMemo(
    () =>
      settings.videoIds.length
        ? videos.filter((v) => settings.videoIds.includes(v.id))
        : videos.slice(0, 6),
    [videos, settings.videoIds],
  );
  const chosenProducts = useMemo(
    () =>
      settings.productIds.length
        ? products.filter((p) => settings.productIds.includes(p.id))
        : products.slice(0, 4),
    [products, settings.productIds],
  );

  if (!widget) return null;

  return (
    <WidgetPlayer
      widget={widget}
      settings={settings}
      videos={chosenVideos}
      products={chosenProducts}
      startIndex={0}
      onClose={onClose}
    />
  );
}

/* ---------- Publish panel ---------- */

function PublishPanel({
  widgetId,
  meta,
  onPreview,
}: {
  widgetId: string;
  meta: ReturnType<typeof useWidgetsStore.getState>["meta"][string] | undefined;
  onPreview: () => void;
}) {
  const copyField = async (label: string, value: string) => {
    await copyToClipboard(value, { successMessage: `${label} copied` });
  };

  if (!meta) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Publish
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          This widget has not been published yet. Click <span className="font-medium text-foreground">Publish</span> to generate a live URL, embed token, and version.
        </div>
      </div>
    );
  }

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Widget ID", value: meta.widgetId, mono: true },
    { label: "Version", value: `v${meta.version}` },
    { label: "Status", value: meta.status },
    { label: "Created", value: fmt.date(meta.createdAt) },
    { label: "Updated", value: fmt.date(meta.updatedAt) },
    { label: "Public URL", value: meta.publicUrl, mono: true },
    { label: "Preview URL", value: meta.previewUrl, mono: true },
    { label: "Embed token", value: meta.embedToken, mono: true },
  ];

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Publish
          </div>
          <div className="font-display mt-1 text-xl">Live · v{meta.version}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onPreview}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Launch preview
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={meta.previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in new tab
            </a>
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-2 rounded-md border bg-background px-3 py-2">
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{r.label}</dt>
              <dd className={`mt-0.5 truncate text-xs ${r.mono ? "font-mono" : ""}`}>{r.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => copyField(r.label, r.value)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label={`Copy ${r.label}`}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- Storefront mock chrome ---------- */

function StorefrontMock({ accent }: { accent: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3 opacity-80">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full" style={{ background: accent }} />
          <div className="text-sm font-medium">Your Store</div>
        </div>
        <div className="hidden gap-4 text-xs opacity-70 md:flex">
          <span>Shop</span>
          <span>Collections</span>
          <span>About</span>
        </div>
      </div>
      <div className="text-xs opacity-60">Storefront preview — the widget renders inline below as customers see it.</div>
    </div>
  );
}

/* ---------- Content pickers ---------- */

function VideosPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const videos = useVideosStore((s) => s.items);
  return (
    <div>
      <SubHeader>Videos · {selected.length} selected</SubHeader>
      <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
        {videos.map((v) => {
          const active = selected.includes(v.id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((id) => id !== v.id) : [...selected, v.id])
              }
              className={`group relative aspect-[9/16] overflow-hidden rounded-md border-2 transition ${
                active ? "border-signal" : "border-transparent hover:border-border"
              }`}
            >
              <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
              {active && (
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-signal text-signal-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white">
                {v.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const products = useProductsStore((s) => s.items);
  return (
    <div>
      <SubHeader>Products · {selected.length} selected</SubHeader>
      <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {products.map((p) => {
          const active = selected.includes(p.id);
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                active ? "border-signal bg-signal/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() =>
                  onChange(active ? selected.filter((id) => id !== p.id) : [...selected, p.id])
                }
                className="accent-signal"
              />
              <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="text-[10px] text-muted-foreground">{fmt.money(p.price)}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CollectionsPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const collections = useCollectionsStore((s) => s.items);
  return (
    <div>
      <SubHeader>Collections · {selected.length} selected</SubHeader>
      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
        {collections.map((c) => {
          const active = selected.includes(c.id);
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                active ? "border-signal bg-signal/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() =>
                  onChange(active ? selected.filter((id) => id !== c.id) : [...selected, c.id])
                }
                className="accent-signal"
              />
              <img src={c.cover} alt="" className="h-8 w-8 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {c.productCount} products · {c.videoCount} videos
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Field primitives ---------- */

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2">
      <span className="text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-24 font-mono text-xs"
        />
      </div>
    </div>
  );
}
