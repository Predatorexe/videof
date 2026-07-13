import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Command, Search, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { useNotificationsStore } from "@/stores/notifications-store";
import { useProfileStore } from "@/stores/profile-store";
import { useUiStore } from "@/stores/ui-store";

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
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const profile = useProfileStore((s) => s.profile);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const setUploadOpen = useUiStore((s) => s.setUploadVideoOpen);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

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
        <button
          onClick={() => setSearchOpen(true)}
          className="relative hidden md:block"
          aria-label="Open search"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Search videos, products, widgets…"
            className="h-9 w-[260px] cursor-pointer pl-8 pr-16 text-sm lg:w-[340px]"
            onFocus={(e) => {
              e.target.blur();
              setSearchOpen(true);
            }}
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <Button size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => setUploadOpen(true)}>
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
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
            {items.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nothing new right now.
              </div>
            )}
            {items.slice(0, 5).map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => markRead(n.id)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
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
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 hover:bg-accent" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=founder" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              {profile.firstName} {profile.lastName}
            </DropdownMenuLabel>
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
