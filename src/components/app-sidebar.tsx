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
  Plus,
} from "lucide-react";

import { fmt } from "@/lib/mock-data";
import { computeUsage, useBillingStore } from "@/stores/billing-store";
import { useProfileStore } from "@/stores/profile-store";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Videos", url: "/videos", icon: Film },
  { title: "Products", url: "/products", icon: Package },
  { title: "Collections", url: "/collections", icon: Layers },
  { title: "Widgets", url: "/widgets", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Media Library", url: "/media", icon: ImageIcon },
  { title: "Customers", url: "/customers", icon: Users },
];

const account = [
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Help Center", url: "/help", icon: LifeBuoy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  const currentPlanId = useBillingStore((s) => s.currentPlanId);
  const usedThisMonth = useBillingStore((s) => s.usedThisMonth);
  const cycleEnd = useBillingStore((s) => s.cycleEnd);
  const usage = computeUsage(currentPlanId, usedThisMonth);
  const profile = useProfileStore((s) => s.profile);
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const resetLabel = new Date(cycleEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const barPct = Math.min(usage.pct, 100);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-signal text-signal-foreground">
            <span className="font-display text-lg leading-none">V</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight tracking-tight">Videofy</div>
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Atelier North · {usage.plan.name}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-medium tracking-[0.2em]">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="group/mi h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-white/[0.04] hover:text-white data-[active=true]:bg-signal/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgba(160,242,0,0.25),0_0_24px_-8px_rgba(160,242,0,0.5)]"
                    >
                      <Link to={item.url} className="flex items-center gap-2.5">
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-signal" : "text-sidebar-foreground/60 group-hover/mi:text-white"}`} />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-medium tracking-[0.2em]">Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {account.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="group/mi h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-white/[0.04] hover:text-white data-[active=true]:bg-signal/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgba(160,242,0,0.25),0_0_24px_-8px_rgba(160,242,0,0.5)]"
                    >
                      <Link to={item.url} className="flex items-center gap-2.5">
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-signal" : "text-sidebar-foreground/60 group-hover/mi:text-white"}`} />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mx-3 mt-2 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4">
            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
              <span>{usage.plan.name} plan</span>
              <span className={usage.overage > 0 ? "text-[color:var(--ember)]" : "text-signal"}>
                {usage.pct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1.5 font-display text-lg leading-tight">
              {fmt.compact(usedThisMonth)}{" "}
              <span className="text-sidebar-foreground/60 text-sm font-normal">
                / {fmt.compact(usage.limit)} impressions
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-sidebar-border/50">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  usage.overage > 0 ? "bg-[color:var(--ember)]" : "bg-signal"
                }`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-sidebar-foreground/60">
              {usage.overage > 0 ? (
                <>
                  Overage <span className="text-foreground">{fmt.money(usage.overageCharge)}</span> ·
                  resets {resetLabel}
                </>
              ) : (
                <>Resets {resetLabel}</>
              )}
            </div>

            <Button size="sm" className="mt-3 w-full text-xs font-medium" asChild>
              <Link to="/billing">Upgrade plan</Link>
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <Link to="/profile" className="flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=founder" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="truncate text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
                {profile.role}
              </div>
            </div>
          )}
          {!collapsed && (
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
