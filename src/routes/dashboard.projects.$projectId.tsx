import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Upload, Calendar, DollarSign, MapPin } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projects/$projectId")({
  component: ProjectDetail,
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [progressVal, setProgressVal] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: updates } = useQuery({
    queryKey: ["updates", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_updates")
        .select("*, author:profiles!progress_updates_author_id_fkey(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const canEdit = role === "admin" || (project && user?.id === project.contractor_id);

  const handlePostUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project || !user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = updateSchema.safeParse({ title: fd.get("title"), description: fd.get("description") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const files = (fd.get("photos") as File | null) ? Array.from((e.currentTarget.elements.namedItem("photos") as HTMLInputElement).files ?? []) : [];
    const photoUrls: string[] = [];
    for (const file of files) {
      if (file.size === 0) continue;
      const path = `${user.id}/${projectId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("project-photos").upload(path, file);
      if (upErr) { toast.error(`Upload failed: ${upErr.message}`); continue; }
      const { data: pub } = supabase.storage.from("project-photos").getPublicUrl(path);
      photoUrls.push(pub.publicUrl);
    }

    const newProgress = progressVal ?? project.progress;
    const { error } = await supabase.from("progress_updates").insert({
      project_id: projectId,
      author_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      progress_percent: newProgress,
      photo_urls: photoUrls,
    });
    if (error) { toast.error(error.message); return; }

    if (newProgress !== project.progress) {
      await supabase.from("projects").update({ progress: newProgress }).eq("id", projectId);
    }
    toast.success("Update posted.");
    (e.target as HTMLFormElement).reset();
    setProgressVal(null);
    queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    const { error } = await supabase.from("projects").update({ status: status as "planning" | "in_progress" | "on_hold" | "completed" }).eq("id", projectId);
    setStatusUpdating(false);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    toast.success("Status updated.");
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    const file = e.target.files[0];
    const path = `${user.id}/${projectId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("project-documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { error } = await supabase.from("documents").insert({
      project_id: projectId,
      uploader_id: user.id,
      file_name: file.name,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Document uploaded.");
    queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    e.target.value = "";
  };

  const downloadDoc = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("project-documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Could not get download link"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  };

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div>
      <Link to="/dashboard/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {project.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{project.location}</span>}
              {project.budget && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />${Number(project.budget).toLocaleString()}</span>}
              {project.start_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Start {project.start_date}</span>}
            </div>
            {project.description && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
          </div>
          {canEdit && (
            <Select value={project.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="mt-6">
          <div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Overall progress</span><span className="font-semibold">{project.progress}%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-amber" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="updates" className="mt-8">
        <TabsList>
          <TabsTrigger value="updates">Progress updates</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="mt-5 space-y-6">
          {canEdit && (
            <form onSubmit={handlePostUpdate} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">Post a progress update</h2>
              <div className="mt-4 space-y-3">
                <div><Label htmlFor="u-title">Title</Label><Input id="u-title" name="title" required maxLength={200} className="mt-1.5" placeholder="e.g. Foundation pour complete" /></div>
                <div><Label htmlFor="u-desc">Notes</Label><Textarea id="u-desc" name="description" rows={3} maxLength={2000} className="mt-1.5" /></div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><Label>Update overall progress</Label><span className="font-semibold">{progressVal ?? project.progress}%</span></div>
                  <Slider value={[progressVal ?? project.progress]} max={100} step={1} onValueChange={(v) => setProgressVal(v[0])} />
                </div>
                <div><Label htmlFor="u-photos">Photos (optional, multiple)</Label><Input id="u-photos" name="photos" type="file" accept="image/*" multiple className="mt-1.5" /></div>
                <Button type="submit" className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">Post update</Button>
              </div>
            </form>
          )}

          {!updates?.length ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : updates.map((u) => (
            <article key={u.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{u.title}</h3>
                <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">by {(u.author as { full_name?: string } | null)?.full_name || "Team"}{u.progress_percent != null && ` • progress ${u.progress_percent}%`}</p>
              {u.description && <p className="mt-3 whitespace-pre-wrap text-sm">{u.description}</p>}
              {u.photo_urls?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {u.photo_urls.map((url: string) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border border-border">
                      <img src={url} alt="progress photo" className="h-full w-full object-cover transition hover:scale-105" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-5">
          {canEdit && (
            <label className="mb-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-8 transition hover:border-primary hover:bg-accent/40">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload document</span>
              <input type="file" className="hidden" onChange={handleDocUpload} />
            </label>
          )}
          {!documents?.length ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{d.file_name}</div>
                      <div className="text-xs text-muted-foreground">{(d.size_bytes! / 1024).toFixed(1)} KB • {new Date(d.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadDoc(d.storage_path, d.file_name)}>Download</Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
