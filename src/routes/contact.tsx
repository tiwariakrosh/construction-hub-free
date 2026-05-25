import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BuildWorks" },
      { name: "description", content: "Request a quote or send a project inquiry. We respond within one business day." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  service: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more (10+ chars)").max(2000),
});

function ContactPage() {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      service: parsed.data.service || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send. Please try again.");
      return;
    }
    toast.success("Inquiry sent. We'll be in touch within one business day.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</span>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Let's build something.</h1>
          <p className="mt-4 text-muted-foreground">Tell us about your site, scope, and timeline. We'll respond within one business day.</p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> hello@buildworks.example</div>
            <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> +1 (555) 010-2200</div>
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> 220 Industry Way, Suite 400</div>
          </div>
        </div>
        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-7 shadow-elegant">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required maxLength={100} className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required maxLength={255} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" maxLength={30} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="service">Service interested in</Label>
              <Input id="service" name="service" placeholder="e.g. Commercial, Renovation" maxLength={80} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="message">Project details</Label>
              <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={5} className="mt-1.5" />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
              {loading ? "Sending…" : "Send inquiry"}
            </Button>
          </div>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
