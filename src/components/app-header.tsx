import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Command, Moon, Search, Sun, Upload } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import { notifications } from "@/lib/mock-data";

const labels: Record<string, string> = {
  "": "Dashboard",
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
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger className="shrink-0" />
      <Separator orientation="vertical" className="mx-1 h-5" />

      <nav className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Videofy
        </Link>
        {parts.length === 0 ? (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-medium">Dashboard</span>
          </>
        ) : (
          parts.map((p, i) => (
            <span key={p + i} className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground/50">/</span>
              <span className="truncate font-medium">{labels[p] ?? p}</span>
            </span>
          ))
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search videos, products, widgets…"
            className="h-9 w-[260px] pl-8 pr-16 text-sm lg:w-[340px]"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        <Button size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>

        <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ember" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="rounded-sm text-[10px]">
                {unread} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full text-center text-sm">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=founder" />
                <AvatarFallback>MW</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mira Wren</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
