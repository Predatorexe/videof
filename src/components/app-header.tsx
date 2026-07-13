import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Command, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmt } from "@/lib/mock-data";
import { computeUsage, useBillingStore } from "@/stores/billing-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProfileStore } from "@/stores/profile-store";
import { useUiStore } from "@/stores/ui-store";
import { useWidgetsStore } from "@/stores/widgets-store";

const labels: Record<string, string> = {
  "": "Overview",
  videos: "Videos",
  products: "Products",
  collections: "Collections",
  widgets: "Widgets",
  analytics: "Analytics",
  media: "Media Library",
  customers: "Customers",
  billing: "Billing",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
  help: "Help Center",
};

export function AppHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const currentLabel = parts.length === 0 ? "Overview" : labels[parts[0]] ?? parts[0];
  const widgetName = useWidgetsStore((s) =>
    parts[0] === "widgets" && parts[1] ? s.items.find((w) => w.id === parts[1])?.name : undefined,
  );
  const isWidgetChild = parts[0] === "widgets" && parts.length > 1;

  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const profile = useProfileStore((s) => s.profile);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const setUploadOpen = useUiStore((s) => s.setUploadVideoOpen);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  const currentPlanId = useBillingStore((s) => s.currentPlanId);
  const usedThisMonth = useBillingStore((s) => s.usedThisMonth);
  const usage = computeUsage(currentPlanId, usedThisMonth);
  const pct = Math.min(100, Math.round(usage.pct));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.05] bg-background/85 px-5 backdrop-blur-md">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="eyebrow hidden sm:block">System · v3</span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <div className="flex min-w-0 items-baseline gap-2 font-display text-sm">
          <Link to="/" className="text-white/40 hover:text-white/80">Videofy</Link>
          <span className="text-white/20">/</span>
          <span className="truncate text-white">{currentLabel}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-[3px] border border-white/[0.06] bg-white/[0.02] px-3 text-xs text-white/50 transition-colors hover:border-white/[0.12] hover:text-white/80 md:flex"
          aria-label="Open search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="w-[180px] text-left lg:w-[220px]">Search everything…</span>
          <kbd className="ml-1 flex items-center gap-0.5 rounded-sm border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/50">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Plan chip */}
        <Link
          to="/billing"
          className="hidden h-9 items-center gap-2 rounded-[3px] border border-white/[0.06] bg-white/[0.02] px-3 text-[11px] transition-colors hover:border-white/[0.12] lg:flex"
          aria-label="Plan usage"
        >
          <span className="eyebrow">{usage.plan.name}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="tabular-nums text-white/80">
            {fmt.compact(usedThisMonth)}
          </span>
          <span className="text-white/30">/</span>
          <span className="tabular-nums text-white/50">{fmt.compact(usage.limit)}</span>
          <span
            className={`tabular-nums text-[10px] ${
              pct > 90 ? "text-[color:var(--ember)]" : "text-signal"
            }`}
          >
            {pct}%
          </span>
        </Link>

        {/* Upload */}
        <Button
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="hidden h-9 rounded-[3px] px-3 text-xs font-medium sm:inline-flex"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative grid h-9 w-9 place-items-center rounded-[3px] border border-white/[0.06] bg-white/[0.02] text-white/60 transition-colors hover:border-white/[0.12] hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_2px_var(--brand-glow)]" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-[6px] border-white/10 bg-[#0d0d0d] p-1">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
              <span className="eyebrow-lg">Notifications</span>
              <Badge variant="secondary" className="rounded-[2px] text-[10px]">
                {unread} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            {items.length === 0 && (
              <div className="p-6 text-center text-xs text-white/40">Nothing new right now.</div>
            )}
            {items.slice(0, 5).map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => markRead(n.id)}
                className="flex flex-col items-start gap-1 rounded-[3px] py-2.5"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-medium">{n.title}</span>
                  <span className="font-mono text-[10px] text-white/40">{n.time}</span>
                </div>
                <span className="line-clamp-2 text-[11px] text-white/60">{n.body}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full justify-center text-center text-xs">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-[3px] border border-white/10 bg-[#171717] text-[10px] font-medium uppercase tracking-wider text-white/80 transition-colors hover:border-white/25"
              aria-label="Account menu"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[6px] border-white/10 bg-[#0d0d0d] p-1">
            <DropdownMenuLabel className="px-2 py-2">
              <div className="text-sm font-medium">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="eyebrow mt-1">{profile.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => {
                toast.success("Signed out");
                navigate({ to: "/" });
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
