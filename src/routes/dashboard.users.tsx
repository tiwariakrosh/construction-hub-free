import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { adminCreateUser, adminDeleteUser } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/users")({
  component: Users,
});

type Role = "admin" | "contractor" | "owner";

function Users() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const createUser = useServerFn(adminCreateUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRole, setNewRole] = useState<Role>("owner");

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
        role: (roles.find((r) => r.user_id === p.id)?.role ?? "owner") as Role,
      }));
    },
  });

  const changeRole = async (userId: string, value: Role) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: value });
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated.");
    queryClient.invalidateQueries({ queryKey: ["users-roles"] });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createUser({
        data: {
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          full_name: String(fd.get("full_name")),
          company: (fd.get("company") as string) || null,
          phone: (fd.get("phone") as string) || null,
          role: newRole,
        },
      });
      toast.success("User created.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users-roles"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete user ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser({ data: { user_id: userId } });
      toast.success("User deleted.");
      queryClient.invalidateQueries({ queryKey: ["users-roles"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (role !== "admin") return <p className="text-muted-foreground">Admin only.</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users & roles</h1>
          <p className="mt-1 text-muted-foreground">Create, assign roles, or remove users.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-amber text-secondary shadow-amber hover:opacity-90">
              <Plus className="mr-1.5 h-4 w-4" /> New user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label htmlFor="u-name">Full name</Label><Input id="u-name" name="full_name" required maxLength={120} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="u-email">Email</Label><Input id="u-email" name="email" type="email" required className="mt-1.5" /></div>
                <div><Label htmlFor="u-pass">Password</Label><Input id="u-pass" name="password" type="password" required minLength={8} className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="u-company">Company</Label><Input id="u-company" name="company" className="mt-1.5" /></div>
                <div><Label htmlFor="u-phone">Phone</Label><Input id="u-phone" name="phone" className="mt-1.5" /></div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner (property/client)</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-amber text-secondary hover:opacity-90">
                {submitting ? "Creating…" : "Create user"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="mt-8">Loading…</p> : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-4">Name</th><th className="p-4">Company</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-medium">{u.full_name || "—"}{u.id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                  <td className="p-4 text-muted-foreground">{u.company || "—"}</td>
                  <td className="p-4">
                    <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as Role)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-right">
                    {u.id !== user?.id && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id, u.full_name || "user")}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
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
