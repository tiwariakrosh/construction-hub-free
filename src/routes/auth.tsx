import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { HardHat } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — BuildWorks Portal" },
      { name: "description", content: "Sign in to access your project dashboard." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  role: z.enum(["owner", "contractor"]),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.full_name, role: parsed.data.role },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to confirm, then sign in.");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-amber shadow-amber">
            <HardHat className="h-5 w-5 text-secondary" strokeWidth={2.5} />
          </span>
          BuildWorks
        </Link>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="li-email">Email</Label>
                <Input id="li-email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="li-password">Password</Label>
                <Input id="li-password" name="password" type="password" required className="mt-1.5" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" name="full_name" required maxLength={100} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="su-password">Password (min 8)</Label>
                <Input id="su-password" name="password" type="password" required minLength={8} className="mt-1.5" />
              </div>
              <div>
                <Label>I am a</Label>
                <RadioGroup name="role" defaultValue="owner" className="mt-2 grid grid-cols-2 gap-3">
                  <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                    <RadioGroupItem value="owner" /> Property owner
                  </Label>
                  <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                    <RadioGroupItem value="contractor" /> Contractor
                  </Label>
                </RadioGroup>
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                {submitting ? "Creating…" : "Create account"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Admin access is granted by existing admins.</p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
