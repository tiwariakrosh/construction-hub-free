import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BuildWorks Engineering" },
      { name: "description", content: "Engineering-led construction firm with 18 years of on-site experience and a portfolio of 120+ projects." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">About</span>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">We build like engineers think.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          BuildWorks is an engineering-led construction firm. Founded in 2007 by two structural engineers, we've delivered over 120 commercial and residential projects across the region — on time, on budget, and built to spec.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { v: "2007", l: "Founded" },
            { v: "120+", l: "Projects" },
            { v: "45", l: "Engineers on staff" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="font-display text-3xl font-bold">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-14 text-2xl font-bold">Our principles</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li><strong className="text-foreground">Transparency.</strong> Every client gets dashboard access from day one.</li>
          <li><strong className="text-foreground">Safety first.</strong> Zero major incidents in our last 40 projects.</li>
          <li><strong className="text-foreground">No surprises.</strong> Weekly updates, weekly invoices, weekly reconciliation.</li>
        </ul>
      </section>
      <SiteFooter />
    </div>
  );
}
