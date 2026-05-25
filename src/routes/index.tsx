import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, HardHat, Ruler, ShieldCheck, Activity, Users } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuildWorks — Engineering & Construction" },
      { name: "description", content: "Full-service construction management with real-time progress tracking for property owners and contractors." },
    ],
  }),
  component: HomePage,
});

const services = [
  { icon: Building2, title: "Commercial Construction", desc: "Office buildings, retail, warehouses — end to end." },
  { icon: HardHat, title: "Residential Builds", desc: "Custom homes and multi-unit residential developments." },
  { icon: Ruler, title: "Structural Engineering", desc: "Design, analysis, and supervision by licensed engineers." },
  { icon: ShieldCheck, title: "Renovations & Retrofit", desc: "Safe upgrades to existing structures, on schedule." },
];

const stats = [
  { value: "120+", label: "Projects delivered" },
  { value: "18", label: "Years on site" },
  { value: "98%", label: "On-time completion" },
  { value: "24/7", label: "Project visibility" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-secondary-foreground">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Now booking 2026 builds
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] md:text-6xl">
              Engineering excellence,<br />
              <span className="text-primary">delivered on site.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-secondary-foreground/75 md:text-lg">
              From foundation to finishing — we build commercial, residential, and infrastructure projects with a live progress dashboard your team can trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                <Link to="/contact">Request a quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10">
                <Link to="/projects">View projects</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-amber opacity-20 blur-2xl" />
            <img src={heroImage} alt="Construction site at golden hour with engineers reviewing plans" className="relative rounded-2xl shadow-elegant" loading="eager" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-px overflow-hidden bg-border/60 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-6 py-8 text-center">
              <div className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">What we do</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Built for every stage of the project</h2>
          <p className="mt-3 text-muted-foreground">Engineering, construction, and project management under one roof.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="group rounded-xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition group-hover:bg-gradient-amber">
                <s.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal feature */}
      <section className="bg-accent/40">
        <div className="container mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Client portal</span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Track every milestone, in real time.</h2>
            <p className="mt-4 text-muted-foreground">
              Property owners log in to see live progress, photos, documents, and contractor updates. Contractors push updates from the field. Admins oversee everything.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3"><Activity className="mt-0.5 h-5 w-5 text-primary" /><span><strong>Live progress %</strong> — see exactly where each build stands.</span></li>
              <li className="flex items-start gap-3"><Users className="mt-0.5 h-5 w-5 text-primary" /><span><strong>Role-based access</strong> — admin, contractor, owner.</span></li>
              <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary" /><span><strong>Secure documents</strong> — uploads visible only to your team.</span></li>
            </ul>
            <Button asChild size="lg" className="mt-8 bg-secondary text-secondary-foreground hover:opacity-90">
              <Link to="/auth">Open the portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Riverside Tower — Phase 2</div>
                <div className="text-xs text-muted-foreground">Last update 2 hours ago</div>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">In progress</span>
            </div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Overall progress</span><span className="font-semibold text-foreground">68%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-amber" style={{ width: "68%" }} />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { t: "Slab pour level 6", p: "Completed", c: "text-green-600" },
                { t: "Curtain wall install", p: "60%", c: "text-primary" },
                { t: "MEP rough-in", p: "Scheduled", c: "text-muted-foreground" },
              ].map((row) => (
                <div key={row.t} className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span>{row.t}</span><span className={`font-medium ${row.c}`}>{row.p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-secondary-foreground md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Have a project in mind?</h2>
          <p className="mx-auto mt-3 max-w-xl text-secondary-foreground/75">Tell us about your site, scope, and timeline. We'll get back within one business day.</p>
          <Button asChild size="lg" className="mt-7 bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
            <Link to="/contact">Start a conversation <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
