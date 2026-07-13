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
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfileStore } from "@/stores/profile-store";
import { useUIStore } from "@/stores/ui-store";
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
  const profile = useProfileStore((s) => s.profile);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/[0.05] bg-background py-4 transition-[width] duration-200",
          collapsed ? "w-14 items-center" : "w-56",
        )}
      >
        {/* Brand + toggle */}
        <div
          className={cn(
            "mb-6 flex items-center",
            collapsed ? "w-full flex-col gap-3" : "w-full justify-between px-3",
          )}
        >
          <Link
            to="/"
            className="grid h-8 w-8 place-items-center rounded-[3px] bg-signal transition-transform hover:scale-105"
            aria-label="Videofy"
          >
            <span className="block h-2.5 w-2.5 rotate-45 bg-black" />
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.06] text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs uppercase tracking-wider">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main nav */}
        <nav className={cn("flex flex-col gap-1", collapsed ? "items-center" : "px-2")}>
          {main.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} collapsed={collapsed} />
          ))}
        </nav>

        {/* Divider */}
        <div className={cn("my-4 h-px bg-white/[0.06]", collapsed ? "w-6" : "mx-3")} />

        {/* Account nav */}
        <nav className={cn("flex flex-col gap-1", collapsed ? "items-center" : "px-2")}>
          {account.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} collapsed={collapsed} />
          ))}
        </nav>

        {/* Profile at bottom */}
        <div
          className={cn(
            "mt-auto flex gap-3",
            collapsed ? "flex-col items-center" : "items-center px-3",
          )}
        >
          <span className="live-dot" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                aria-label="Profile"
                className="flex items-center gap-2 overflow-hidden rounded-[3px] border border-white/10 bg-[#171717] text-[10px] font-medium uppercase tracking-wider text-white/80 transition-colors hover:border-white/25"
                data-active={pathname === "/profile"}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || <UserIcon className="h-3.5 w-3.5" />
                  )}
                </span>
                {!collapsed && (
                  <span className="pr-3 normal-case tracking-normal text-white/80">
                    {profile.firstName} {profile.lastName}
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
      </aside>
    </TooltipProvider>
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
      className={cn("rail-item", !collapsed && "w-full justify-start gap-3 px-2")}
      data-active={active}
      aria-label={item.title}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      {!collapsed && (
        <span className="text-[12px] font-medium tracking-tight text-white/80">{item.title}</span>
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
