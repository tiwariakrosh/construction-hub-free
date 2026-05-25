import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — BuildWorks" },
      { name: "description", content: "Selected work: commercial towers, residential complexes, and infrastructure builds." },
    ],
  }),
  component: ProjectsPage,
});

const portfolio = [
  { name: "Riverside Tower", type: "Mixed-use, 24 floors", year: "2024", color: "from-primary/30 to-secondary" },
  { name: "Oakwood Residences", type: "Residential, 48 units", year: "2024", color: "from-accent to-primary/20" },
  { name: "Civic Plaza Retrofit", type: "Seismic upgrade", year: "2023", color: "from-secondary to-primary/30" },
  { name: "Harbor Logistics Hub", type: "Warehouse, 80,000 sq ft", year: "2023", color: "from-primary/40 to-accent" },
  { name: "North Bridge Office Park", type: "Commercial campus", year: "2022", color: "from-secondary to-accent" },
  { name: "Elm Street Townhomes", type: "Residential, 12 units", year: "2022", color: "from-accent to-secondary" },
];

function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Selected work</span>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Recent projects</h1>
          <p className="mt-4 text-muted-foreground">A snapshot of what we've delivered in the past few years.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((p) => (
            <article key={p.name} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-elegant">
              <div className={`relative h-48 bg-gradient-to-br ${p.color}`}>
                <div className="absolute inset-0 grid-pattern opacity-40" />
                <div className="absolute bottom-3 left-3 rounded bg-background/90 px-2 py-1 text-xs font-semibold">{p.year}</div>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.type}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Button asChild size="lg" className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
            <Link to="/contact">Start your project</Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
