import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, LifeBuoy, MessageSquare, Search, Video } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

const topics = [
  { title: "Getting started", description: "Install the app, connect your storefront, and publish your first widget.", Icon: BookOpen },
  { title: "Uploading videos", description: "Supported formats, size limits, and how to import from social platforms.", Icon: Video },
  { title: "Widget customization", description: "Design tokens, custom CSS, and per-device layouts.", Icon: LifeBuoy },
  { title: "Analytics & reporting", description: "What each metric means and how attribution works.", Icon: MessageSquare },
];

const articles = [
  "Why do my views take a few minutes to appear?",
  "How do I schedule a widget to publish later?",
  "Bulk assigning videos to a collection",
  "Migrating from Whatmore or Videowise",
  "Enabling autoplay on mobile Safari",
  "Setting up webhooks for order-attribution",
];

function HelpPage() {
  return (
    <PageShell eyebrow="Support" title="Help Center" description="Docs, guides, and answers curated for shoppable video merchants.">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search 200+ articles…" className="h-12 pl-10 text-base" />
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <div key={t.title} className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition hover:-translate-y-0.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-signal/20 text-signal-foreground">
              <t.Icon className="h-5 w-5 text-signal" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h3 className="font-display text-xl">Popular articles</h3>
        </div>
        <ul className="divide-y">
          {articles.map((a) => (
            <li key={a} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
              <span className="text-sm">{a}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border bg-primary p-6 text-primary-foreground grain">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">Still stuck?</div>
            <div className="font-display mt-1 text-2xl">Talk to a human — usually within an hour.</div>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/notifications">Contact support</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
