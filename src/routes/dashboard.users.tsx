import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/users")({
  component: Users,
});

function Users() {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users-roles"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      if (rErr) throw rErr;
      return profiles.map((p) => ({
        ...p,
        role: roles.find((r) => r.user_id === p.id)?.role ?? "owner",
      }));
    },
  });

  const changeRole = async (userId: string, newRole: "admin" | "contractor" | "owner") => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated.");
    queryClient.invalidateQueries({ queryKey: ["users-roles"] });
  };

  if (role !== "admin") return <p className="text-muted-foreground">Admin only.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Users & roles</h1>
      <p className="mt-1 text-muted-foreground">Assign roles to control access across the platform.</p>
      {isLoading ? <p className="mt-8">Loading…</p> : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-4">Name</th><th className="p-4">Company</th><th className="p-4">Role</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-medium">{u.full_name || "—"}</td>
                  <td className="p-4 text-muted-foreground">{u.company || "—"}</td>
                  <td className="p-4">
                    <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as "admin" | "contractor" | "owner")}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
