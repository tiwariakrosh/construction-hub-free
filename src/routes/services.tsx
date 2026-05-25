import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Building2, HardHat, Ruler, ShieldCheck, Hammer, Wrench } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — BuildWorks Engineering" },
      { name: "description", content: "Commercial, residential, structural engineering, renovations, and project management." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Building2, title: "Commercial Construction", desc: "Office towers, retail centers, mixed-use developments. We handle permits, scheduling, and turnkey delivery." },
  { icon: HardHat, title: "Residential Builds", desc: "From custom homes to multi-unit apartments. Modern design, durable materials." },
  { icon: Ruler, title: "Structural Engineering", desc: "Licensed engineers for new builds, retrofits, seismic analysis, and load assessments." },
  { icon: ShieldCheck, title: "Renovations & Retrofit", desc: "Modernize and reinforce existing buildings — minimal disruption, maximum safety." },
  { icon: Hammer, title: "Site Preparation", desc: "Demolition, excavation, grading, and utility coordination." },
  { icon: Wrench, title: "Project Management", desc: "Live progress dashboards, document control, vendor coordination, budget oversight." },
];

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Our services</span>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Engineering and construction, end to end</h1>
          <p className="mt-4 text-muted-foreground">Six core service lines covering every phase from design to handover.</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-amber">
                <s.icon className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:opacity-90">
            <Link to="/contact">Discuss your project</Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
