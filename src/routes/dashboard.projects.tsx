import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Trash2, Pencil } from "lucide-react";
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
  owner_id: z.string().uuid().optional().or(z.literal("")),
  budget: z.string().optional(),
});

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  budget: number | null;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  progress: number;
  contractor_id: string | null;
  owner_id: string | null;
  created_by: string;
};

function ProjectsList() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);

  const canCreate = role === "admin" || role === "contractor";

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  const { data: owners } = useQuery({
    queryKey: ["owner-profiles"],
    enabled: canCreate,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "owner");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, company").in("id", ids);
      return profs ?? [];
    },
  });

  const reset = () => { setEditing(null); setOpen(false); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd);
    const parsed = schema.safeParse(obj);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      budget: parsed.data.budget ? Number(parsed.data.budget) : null,
      owner_id: parsed.data.owner_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Project updated.");
    } else {
      const { error } = await supabase.from("projects").insert({
        ...payload,
        contractor_id: role === "contractor" ? user!.id : null,
        created_by: user!.id,
        status: "planning" as const,
      });
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Project created.");
    }
    reset();
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleDelete = async (p: ProjectRow) => {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Project deleted.");
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
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
                <Plus className="mr-1.5 h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit project" : "Create project"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label htmlFor="p-name">Project name</Label><Input id="p-name" name="name" required maxLength={120} defaultValue={editing?.name} className="mt-1.5" /></div>
                <div><Label htmlFor="p-loc">Location</Label><Input id="p-loc" name="location" maxLength={200} defaultValue={editing?.location ?? ""} className="mt-1.5" /></div>
                <div><Label htmlFor="p-desc">Description</Label><Textarea id="p-desc" name="description" rows={3} maxLength={2000} defaultValue={editing?.description ?? ""} className="mt-1.5" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="p-budget">Budget</Label><Input id="p-budget" name="budget" type="number" step="0.01" min="0" defaultValue={editing?.budget ?? ""} className="mt-1.5" /></div>
                  <div>
                    <Label htmlFor="p-owner">Property owner</Label>
                    <select id="p-owner" name="owner_id" defaultValue={editing?.owner_id ?? ""} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">— None —</option>
                      {owners?.map((o) => (
                        <option key={o.id} value={o.id}>{o.full_name}{o.company ? ` (${o.company})` : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-amber text-secondary hover:opacity-90">
                  {submitting ? "Saving…" : editing ? "Save changes" : "Create project"}
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
          {projects.map((p) => {
            const canManage = role === "admin" || user?.id === p.contractor_id;
            return (
              <div key={p.id} className="group relative rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
                <Link to="/dashboard/projects/$projectId" params={{ projectId: p.id }} className="block">
                  <div className="flex items-start justify-between gap-3 pr-8">
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
                {canManage && (
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        {role === "admin" && (
                          <DropdownMenuItem onClick={() => handleDelete(p)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
