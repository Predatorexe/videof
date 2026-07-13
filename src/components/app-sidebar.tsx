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
                Atelier North · Growth
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {account.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mx-3 mt-2 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
              Growth plan
            </div>
            <div className="mt-1.5 font-display text-lg leading-tight">
              128 <span className="text-sidebar-foreground/60 text-sm font-normal">/ 200 videos</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-sidebar-border/50">
              <div className="h-full w-[64%] rounded-full bg-signal" />
            </div>
            <Button size="sm" className="mt-3 w-full text-xs font-medium">
              Upgrade plan
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <Link to="/profile" className="flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=founder" />
            <AvatarFallback>MW</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">Mira Wren</div>
              <div className="truncate text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
                Owner
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
