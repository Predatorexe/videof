import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { widgets, videos } from "@/lib/mock-data";

export const Route = createFileRoute("/widgets/$id")({
  loader: ({ params }) => {
    const widget = widgets.find((w) => w.id === params.id);
    if (!widget) throw notFound();
    return { widget };
  },
  component: WidgetCustomizer,
  notFoundComponent: () => (
    <PageShell title="Widget not found">
      <Button asChild variant="outline">
        <Link to="/widgets">Back to widgets</Link>
      </Button>
    </PageShell>
  ),
});

type Device = "desktop" | "tablet" | "mobile";

function WidgetCustomizer() {
  const { widget } = Route.useLoaderData();
  const [device, setDevice] = useState<Device>("desktop");
  const [accent, setAccent] = useState("#c8f542");
  const [radius, setRadius] = useState(12);
  const [spacing, setSpacing] = useState(16);
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(true);
  const [controls, setControls] = useState(false);
  const [font, setFont] = useState("Geist");
  const [customCss, setCustomCss] = useState("");

  const previewW = device === "desktop" ? "100%" : device === "tablet" ? 720 : 360;

  return (
    <PageShell
      eyebrow={`Widget · ${widget.type}`}
      title={widget.name}
      description="Live preview updates as you edit. Save to publish changes to your storefront."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/widgets"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Widgets</Link>
          </Button>
          <Button size="sm" onClick={() => toast.success("Widget saved")}>Save changes</Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card p-4">
          <Tabs defaultValue="design">
            <TabsList className="w-full">
              <TabsTrigger value="design" className="flex-1">Design</TabsTrigger>
              <TabsTrigger value="behavior" className="flex-1">Behavior</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="mt-4 space-y-5">
              <Field label="Accent color">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
                  />
                  <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="font-mono" />
                </div>
              </Field>
              <Field label={`Border radius · ${radius}px`}>
                <Slider value={[radius]} max={32} step={1} onValueChange={([v]) => setRadius(v)} />
              </Field>
              <Field label={`Spacing · ${spacing}px`}>
                <Slider value={[spacing]} max={48} step={2} onValueChange={([v]) => setSpacing(v)} />
              </Field>
              <Field label="Font">
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Instrument Serif">Instrument Serif</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="System">System UI</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Aspect ratio">
                <Select defaultValue="9:16">
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

            <TabsContent value="behavior" className="mt-4 space-y-4">
              <Row label="Autoplay" checked={autoplay} onChange={setAutoplay} />
              <Row label="Loop" checked={loop} onChange={setLoop} />
              <Row label="Muted by default" checked={muted} onChange={setMuted} />
              <Row label="Show native controls" checked={controls} onChange={setControls} />
              <Field label="Animation">
                <Select defaultValue="fade">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <Field label="Custom CSS">
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  className="h-36 w-full resize-none rounded-md border bg-background p-2 font-mono text-xs"
                  placeholder=".videofy-widget { ... }"
                />
              </Field>
              <Field label="Placement selector">
                <Input placeholder="#hero, .product-form" className="font-mono" />
              </Field>
            </TabsContent>
          </Tabs>
        </aside>

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Preview</div>
            <div className="flex overflow-hidden rounded-md border">
              {(
                [
                  { v: "desktop", Icon: Monitor },
                  { v: "tablet", Icon: Tablet },
                  { v: "mobile", Icon: Smartphone },
                ] as const
              ).map(({ v, Icon }) => (
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
              style={{ width: previewW, maxWidth: "100%" }}
              className="rounded-lg bg-background p-6 shadow-2xl transition-all"
            >
              <div style={{ fontFamily: font }} className="mb-4 flex items-baseline justify-between">
                <div className="font-display text-2xl leading-none">Shop the reels</div>
                <span className="text-xs text-muted-foreground">See all</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${device === "mobile" ? 2 : 4}, minmax(0, 1fr))`, gap: spacing }}>
                {videos.slice(0, device === "mobile" ? 4 : 4).map((v) => (
                  <div key={v.id} className="relative aspect-[9/16] overflow-hidden" style={{ borderRadius: radius, border: `2px solid ${accent}` }}>
                    <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="line-clamp-1 text-[10px] font-medium text-white">{v.title}</div>
                    </div>
                    <div
                      className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ background: accent }}
                    />
                  </div>
                ))}
              </div>
              <style>{customCss}</style>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
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
