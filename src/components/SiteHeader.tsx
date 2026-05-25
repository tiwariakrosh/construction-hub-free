import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { HardHat, LogOut, LayoutDashboard } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-amber shadow-amber">
            <HardHat className="h-5 w-5 text-secondary" strokeWidth={2.5} />
          </span>
          <span>BuildWorks</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link to="/" className="text-foreground/70 transition hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/services" className="text-foreground/70 transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>Services</Link>
          <Link to="/projects" className="text-foreground/70 transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>Projects</Link>
          <Link to="/about" className="text-foreground/70 transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>About</Link>
          <Link to="/contact" className="text-foreground/70 transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
