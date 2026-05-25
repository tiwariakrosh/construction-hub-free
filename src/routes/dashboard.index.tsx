import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { FolderKanban, Activity, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user, role } = useAuth();
  const { data: projects } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = projects?.length ?? 0;
  const active = projects?.filter((p) => p.status === "in_progress").length ?? 0;
  const completed = projects?.filter((p) => p.status === "completed").length ?? 0;
  const avgProgress = total ? Math.round((projects!.reduce((s, p) => s + p.progress, 0) / total)) : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">
        You're signed in as <span className="font-medium capitalize text-foreground">{role ?? "user"}</span>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Projects", value: total, icon: FolderKanban, color: "bg-primary/15 text-primary" },
          { label: "In progress", value: active, icon: Activity, color: "bg-blue-500/15 text-blue-600" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "bg-green-500/15 text-green-600" },
          { label: "Avg progress", value: `${avgProgress}%`, icon: Clock, color: "bg-amber-500/15 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-md ${s.color}`}><s.icon className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link to="/dashboard/projects" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        {!projects?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {role === "owner"
              ? "No projects yet. Once a contractor creates a project and assigns you, it'll show here."
              : "No projects yet. Create your first project to get started."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id} className="py-3">
                <Link to="/dashboard/projects/$projectId" params={{ projectId: p.id }} className="flex items-center justify-between hover:opacity-80">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.location ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-muted sm:block">
                      <div className="h-full bg-gradient-amber" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold">{p.progress}%</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
