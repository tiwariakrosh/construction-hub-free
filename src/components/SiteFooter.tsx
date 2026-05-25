import { Link } from "@tanstack/react-router";
import { HardHat } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary text-secondary-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-amber">
              <HardHat className="h-5 w-5 text-secondary" strokeWidth={2.5} />
            </span>
            BuildWorks
          </Link>
          <p className="mt-4 max-w-md text-sm text-secondary-foreground/70">
            Engineering and construction services with end-to-end project transparency for owners and contractors.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/70">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/projects" className="hover:text-primary">Projects</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Get in touch</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/70">
            <li><Link to="/contact" className="hover:text-primary">Contact us</Link></li>
            <li><Link to="/auth" className="hover:text-primary">Client portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/10 py-5 text-center text-xs text-secondary-foreground/50">
        © {new Date().getFullYear()} BuildWorks Engineering. All rights reserved.
      </div>
    </footer>
  );
}
