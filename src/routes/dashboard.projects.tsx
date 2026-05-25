import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsList,
});

const statusColors: Record<string, string> = {
  planning: "bg-blue-500/15 text-blue-700",
  in_progress: "bg-primary/15 text-primary",
  on_hold: "bg-amber-500/15 text-amber-700",
  completed: "bg-green-500/15 text-green-700",
};

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  owner_email: z.string().trim().email().optional().or(z.literal("")),
  budget: z.string().optional(),
});

function ProjectsList() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = role === "admin" || role === "contractor";

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, owner:profiles!projects_owner_id_fkey(full_name), contractor:profiles!projects_contractor_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd);
    const parsed = schema.safeParse(obj);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    let ownerId: string | null = null;
    if (parsed.data.owner_email) {
      // Find owner by email (look in profiles via auth.users? — only via profiles table). We'll search profiles by joining via user_roles using listed emails -- simplest: look up in auth.users not allowed; use a lookup table approach: ask user to share their account first. Skip silently if not found.
      const { data: prof } = await supabase.rpc("get_user_id_by_email" as never, { _email: parsed.data.owner_email }).maybeSingle?.() ?? { data: null };
      ownerId = (prof as { id?: string } | null)?.id ?? null;
      if (!ownerId) {
        toast.warning("Owner email not found — project created without owner. They can be assigned later.");
      }
    }

    const insert = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      budget: parsed.data.budget ? Number(parsed.data.budget) : null,
      contractor_id: role === "contractor" ? user!.id : null,
      owner_id: ownerId,
      created_by: user!.id,
      status: "planning" as const,
    };
    const { error } = await supabase.from("projects").insert(insert);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project created.");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-muted-foreground">All projects you have access to.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                <Plus className="mr-1.5 h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><Label htmlFor="p-name">Project name</Label><Input id="p-name" name="name" required maxLength={120} className="mt-1.5" /></div>
                <div><Label htmlFor="p-loc">Location</Label><Input id="p-loc" name="location" maxLength={200} className="mt-1.5" /></div>
                <div><Label htmlFor="p-desc">Description</Label><Textarea id="p-desc" name="description" rows={3} maxLength={2000} className="mt-1.5" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="p-budget">Budget</Label><Input id="p-budget" name="budget" type="number" step="0.01" min="0" className="mt-1.5" /></div>
                  <div><Label htmlFor="p-owner">Owner email (optional)</Label><Input id="p-owner" name="owner_email" type="email" className="mt-1.5" /></div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-amber text-secondary hover:opacity-90">
                  {submitting ? "Creating…" : "Create project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : !projects?.length ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          {canCreate && <p className="mt-1 text-sm text-muted-foreground">Click "New project" to get started.</p>}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to="/dashboard/projects/$projectId" params={{ projectId: p.id }}
              className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{p.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColors[p.status]}`}>{p.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.location ?? "Location not set"}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{p.progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-amber" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
