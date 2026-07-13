import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CreditCard,
  Film,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useVideosStore } from "@/stores/videos-store";
import { useProductsStore } from "@/stores/products-store";
import { useWidgetsStore } from "@/stores/widgets-store";
import { useCustomersStore } from "@/stores/customers-store";

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NAV = [
  { path: "/", label: "Dashboard", Icon: LayoutDashboard },
  { path: "/videos", label: "Videos", Icon: Film },
  { path: "/products", label: "Products", Icon: Package },
  { path: "/collections", label: "Collections", Icon: Layers },
  { path: "/widgets", label: "Widgets", Icon: Sparkles },
  { path: "/analytics", label: "Analytics", Icon: BarChart3 },
  { path: "/media", label: "Media Library", Icon: ImageIcon },
  { path: "/customers", label: "Customers", Icon: Users },
  { path: "/billing", label: "Billing", Icon: CreditCard },
  { path: "/settings", label: "Settings", Icon: Settings },
  { path: "/notifications", label: "Notifications", Icon: Bell },
  { path: "/help", label: "Help Center", Icon: LifeBuoy },
] as const;

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const videos = useVideosStore((s) => s.items);
  const products = useProductsStore((s) => s.items);
  const widgets = useWidgetsStore((s) => s.items);
  const customers = useCustomersStore((s) => s.items);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) {
      return {
        videos: videos.slice(0, 4),
        products: products.slice(0, 4),
        widgets: widgets.slice(0, 4),
        customers: [] as typeof customers,
      };
    }
    return {
      videos: videos
        .filter((v) => v.title.toLowerCase().includes(q) || v.tags.some((t) => t.includes(q)))
        .slice(0, 6),
      products: products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6),
      widgets: widgets
        .filter((w) => w.name.toLowerCase().includes(q) || w.placement.toLowerCase().includes(q))
        .slice(0, 6),
      customers: customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .slice(0, 6),
    };
  }, [q, videos, products, widgets, customers]);

  const go = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search videos, products, widgets, customers, pages…"
      />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {NAV.filter((n) => !q || n.label.toLowerCase().includes(q)).map((n) => (
            <CommandItem
              key={n.path}
              value={`nav-${n.label}`}
              onSelect={() => go(() => navigate({ to: n.path }))}
            >
              <n.Icon className="mr-2 h-3.5 w-3.5" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {results.videos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Videos">
              {results.videos.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`vid-${v.title}`}
                  onSelect={() => go(() => navigate({ to: "/videos" }))}
                >
                  <Film className="mr-2 h-3.5 w-3.5" />
                  <span className="truncate">{v.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Products">
              {results.products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`prd-${p.title}`}
                  onSelect={() => go(() => navigate({ to: "/products" }))}
                >
                  <Package className="mr-2 h-3.5 w-3.5" />
                  <span className="truncate">{p.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.widgets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Widgets">
              {results.widgets.map((w) => (
                <CommandItem
                  key={w.id}
                  value={`wid-${w.name}`}
                  onSelect={() =>
                    go(() => navigate({ to: "/widgets/$id", params: { id: w.id } }))
                  }
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  <span className="truncate">{w.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.customers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Customers">
              {results.customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`cus-${c.name}`}
                  onSelect={() => go(() => navigate({ to: "/customers" }))}
                >
                  <Users className="mr-2 h-3.5 w-3.5" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">{c.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
