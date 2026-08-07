import { useEffect } from "react";
import { UserCog, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { trpc } from "@/lib/trpc";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  loginMethod: string | null;
  createdAt: Date;
  lastSignedIn: Date;
};

export default function AdminUsers() {
  const { data, isLoading, refetch } = trpc.admin.users.useQuery();

  useEffect(() => {
    document.title = "Users — Luxe Admin";
  }, []);

  const users = (data ?? []) as UserRow[];
  const utils = trpc.useUtils();
  const setRole = trpc.admin.setUserRole.useMutation({ onSuccess: () => utils.admin.users.invalidate() });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered customers</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <UserIcon size={30} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No users yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-display font-semibold text-gold">
                {(u.name ?? u.email ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 font-medium">{u.name ?? "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email ?? "—"} · signed in {new Date(u.lastSignedIn).toLocaleDateString()}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${u.role === "admin" ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"}`}>
                {u.role === "admin" ? <Shield size={11} /> : <UserIcon size={11} />}
                {u.role}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger className="press inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:border-gold hover:text-gold transition-colors">
                  <UserCog size={12} /> Role
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRole.mutate({ id: u.id, role: "user" }, { onSuccess: () => toast.success(`${u.name ?? "User"} is now a customer`) })}>
                    Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRole.mutate({ id: u.id, role: "admin" }, { onSuccess: () => toast.success(`${u.name ?? "User"} is now an admin`) })}>
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
