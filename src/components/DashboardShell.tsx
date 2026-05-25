import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { HardHat, LayoutDashboard, FolderKanban, MessageSquare, Users, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardShell() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();

  const nav = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    ...(role === "admin"
      ? [
          { to: "/dashboard/inquiries", label: "Inquiries", icon: MessageSquare },
          { to: "/dashboard/users", label: "Users & roles", icon: Users },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border p-5 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-amber"><HardHat className="h-5 w-5 text-secondary" strokeWidth={2.5} /></span>
          BuildWorks
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-sm">
          <div className="px-3 pb-2">
            <div className="truncate font-medium">{user?.email}</div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">{role ?? "—"}</div>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Home className="h-4 w-4" /> Back to site
          </Link>
          <button
            onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <Link to="/" className="font-display font-bold">BuildWorks</Link>
          <Button size="sm" variant="ghost" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-accent text-foreground" }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
