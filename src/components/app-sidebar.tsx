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
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfileStore } from "@/stores/profile-store";

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
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="sticky top-0 z-40 flex h-screen w-14 shrink-0 flex-col items-center border-r border-white/[0.05] bg-background py-4">
        {/* Brand mark */}
        <Link
          to="/"
          className="mb-6 grid h-8 w-8 place-items-center rounded-[3px] bg-signal transition-transform hover:scale-105"
          aria-label="Videofy"
        >
          <span className="block h-2.5 w-2.5 rotate-45 bg-black" />
        </Link>

        {/* Main nav */}
        <nav className="flex flex-col items-center gap-1">
          {main.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} />
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 h-px w-6 bg-white/[0.06]" />

        {/* Account nav */}
        <nav className="flex flex-col items-center gap-1">
          {account.map((item) => (
            <RailLink key={item.url} item={item} active={isActive(item.url)} />
          ))}
        </nav>

        {/* Profile at bottom */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <span className="live-dot" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                aria-label="Profile"
                className="grid h-8 w-8 place-items-center overflow-hidden rounded-[3px] border border-white/10 bg-[#171717] text-[10px] font-medium uppercase tracking-wider text-white/80 transition-colors hover:border-white/25"
                data-active={pathname === "/profile"}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials || <UserIcon className="h-3.5 w-3.5" />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {profile.firstName} {profile.lastName}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function RailLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={item.url} className="rail-item" data-active={active} aria-label={item.title}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs uppercase tracking-wider">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}
