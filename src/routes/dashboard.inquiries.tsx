import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/inquiries")({
  component: Inquiries,
});

function Inquiries() {
  const { role } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (role !== "admin") return <p className="text-muted-foreground">Admin only.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Inquiries</h1>
      <p className="mt-1 text-muted-foreground">Contact-form submissions from the website.</p>
      {isLoading ? <p className="mt-8">Loading…</p> : !data?.length ? (
        <p className="mt-8 text-muted-foreground">No inquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((i) => (
            <article key={i.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{i.name}</h2>
                  <div className="mt-0.5 text-sm text-muted-foreground">{i.email} {i.phone && `• ${i.phone}`}</div>
                  {i.service && <div className="mt-1 text-xs text-muted-foreground">Service: {i.service}</div>}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{i.message}</p>
              <a href={`mailto:${i.email}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Reply by email →</a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
