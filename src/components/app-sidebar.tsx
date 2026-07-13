import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Film,
  Package,
  Layers,
  Sparkles,
  BarChart3,
  Image as ImageIcon,
  Users,
  CreditCard,
  Settings,
  LifeBuoy,
  Bell,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useEffect, type ComponentType, type SVGProps } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfileStore } from "@/stores/profile-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const main: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Videos", url: "/videos", icon: Film },
  { title: "Products", url: "/products", icon: Package },
  { title: "Collections", url: "/collections", icon: Layers },
  { title: "Widgets", url: "/widgets", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Media Library", url: "/media", icon: ImageIcon },
  { title: "Customers", url: "/customers", icon: Users },
];

const account: Item[] = [
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
  const setMobileOpen = useUiStore((s) => s.setSidebarMobileOpen);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Body scroll lock while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Escape to close mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  return (
    <TooltipProvider delayDuration={100}>
      {/* Desktop / tablet — inline sidebar */}
      <aside
        aria-label="Primary"
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-white/[0.05] bg-background transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarInner collapsed={collapsed} pathname={pathname} onToggle={toggle} />
      </aside>

      {/* Mobile — overlay drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/70 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex w-60 max-w-[80vw] flex-col border-r border-white/[0.05] bg-background shadow-2xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarInner
            collapsed={false}
            pathname={pathname}
            mobileClose={() => setMobileOpen(false)}
          />
        </aside>
      </div>
    </TooltipProvider>
  );
}

function SidebarInner({
  collapsed,
  pathname,
  onToggle,
  mobileClose,
}: {
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
  mobileClose?: () => void;
}) {
  const profile = useProfileStore((s) => s.profile);
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <div className="flex h-full flex-col py-4">
      {/* Brand + toggle */}
      <div
        className={cn(
          "mb-6 flex h-8 items-center",
          collapsed ? "justify-center px-3" : "justify-between px-3",
        )}
      >
        <Link
          to="/"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[3px] bg-signal transition-transform hover:scale-105"
          aria-label="Videofy"
        >
          <span className="block h-2.5 w-2.5 rotate-45 bg-black" />
        </Link>
        {!collapsed && onToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.06] text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs uppercase tracking-wider">
              Collapse
            </TooltipContent>
          </Tooltip>
        )}
        {!collapsed && mobileClose && (
          <button
            type="button"
            onClick={mobileClose}
            aria-label="Close navigation"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.06] text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Expand toggle when collapsed (below brand, centered) */}
      {collapsed && onToggle && (
        <div className="mb-3 flex justify-center px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Expand sidebar"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.06] text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs uppercase tracking-wider">
              Expand
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Scrollable nav area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <nav className="flex flex-col gap-1 px-2">
          {main.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} collapsed={collapsed} />
          ))}
        </nav>

        <div className="mx-3 my-4 h-px shrink-0 bg-white/[0.06]" />

        <nav className="flex flex-col gap-1 px-2">
          {account.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      {/* Profile */}
      <div className="mt-4 shrink-0 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              aria-label={`${profile.firstName} ${profile.lastName} — profile`}
              data-active={pathname === "/profile"}
              className={cn(
                "flex h-11 items-center overflow-hidden rounded-[6px] border border-white/[0.06] bg-white/[0.02] text-white/80 transition-colors hover:border-white/20",
                collapsed ? "w-11 justify-center" : "w-full gap-3 px-2",
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-[#171717] text-[10px] font-medium uppercase tracking-wider">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : initials ? (
                  <span>{initials}</span>
                ) : (
                  <UserIcon className="h-3.5 w-3.5" />
                )}
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[12px] font-medium text-white/90">
                    {profile.firstName} {profile.lastName}
                  </span>
                  <span className="truncate text-[10px] uppercase tracking-wider text-white/40">
                    {profile.role}
                  </span>
                </span>
              )}
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="text-xs">
              {profile.firstName} {profile.lastName}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}

function RailLink({
  item,
  active,
  collapsed,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      to={item.url}
      className={cn(
        "rail-item",
        collapsed ? "w-11 justify-center px-0" : "w-full justify-start gap-3 px-3",
      )}
      data-active={active}
      aria-label={item.title}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      {!collapsed && (
        <span className="truncate text-[12px] font-medium tracking-tight">{item.title}</span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs uppercase tracking-wider">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}
