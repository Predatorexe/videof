import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { GlobalSearch } from "@/components/global-search";
import { UploadVideoDialog } from "@/components/dialogs/upload-video-dialog";
import { CreateWidgetDialog } from "@/components/dialogs/create-widget-dialog";
import { CreateProductDialog } from "@/components/dialogs/create-product-dialog";
import { CreateCollectionDialog } from "@/components/dialogs/create-collection-dialog";
import { UpdateCardDialog } from "@/components/dialogs/update-card-dialog";
import { useUiStore } from "@/stores/ui-store";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="hero-serif text-[7rem] leading-none">404</div>
      <h1 className="text-xl font-medium">This page is off-camera</h1>
      <p className="text-sm text-white/50">
        The screen you're looking for doesn't exist, moved, or is still in post-production.
      </p>
      <Button asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="hero-serif text-4xl">Something dropped a frame</h1>
      <p className="text-sm text-white/50">
        We logged the error. Try again or head back to the dashboard.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Videofy — Video Commerce Operating System" },
      {
        name: "description",
        content:
          "Videofy is the video commerce operating system for modern brands. Upload, tag, and publish shoppable reels to any storefront — a studio control room for your entire catalog.",
      },
      { property: "og:title", content: "Videofy — Video Commerce Operating System" },
      {
        property: "og:description",
        content:
          "The video commerce operating system for modern brands. Upload, tag, and publish shoppable reels to any storefront.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Videofy — Video Commerce Operating System" },
      { name: "twitter:description", content: "The video commerce operating system for modern brands." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ec96e621-0871-4504-ab3c-1c7d5f1e8385/id-preview-74024509--7feba8cc-051c-4099-a617-251ef709612c.lovable.app-1783976339809.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ec96e621-0871-4504-ab3c-1c7d5f1e8385/id-preview-74024509--7feba8cc-051c-4099-a617-251ef709612c.lovable.app-1783976339809.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const createWidgetOpen = useUiStore((s) => s.createWidgetOpen);
  const setCreateWidgetOpen = useUiStore((s) => s.setCreateWidgetOpen);
  const createProductOpen = useUiStore((s) => s.createProductOpen);
  const setCreateProductOpen = useUiStore((s) => s.setCreateProductOpen);
  const createCollectionOpen = useUiStore((s) => s.createCollectionOpen);
  const setCreateCollectionOpen = useUiStore((s) => s.setCreateCollectionOpen);
  const updateCardOpen = useUiStore((s) => s.updateCardOpen);
  const setUpdateCardOpen = useUiStore((s) => s.setUpdateCardOpen);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!useUiStore.getState().searchOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <UploadVideoDialog />
      <CreateWidgetDialog open={createWidgetOpen} onOpenChange={setCreateWidgetOpen} />
      <CreateProductDialog open={createProductOpen} onOpenChange={setCreateProductOpen} />
      <CreateCollectionDialog
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
      />
      <UpdateCardDialog open={updateCardOpen} onOpenChange={setUpdateCardOpen} />
    </QueryClientProvider>
  );
}
