import { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { trpc } from "@/lib/trpc";

type CouponRow = {
  id: number;
  code: string;
  description: string | null;
  type: string;
  value: string;
  minOrder: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

type CouponForm = {
  id?: number;
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: string;
  minOrder: string;
  expiresAt: Date | null;
};

const EMPTY: CouponForm = { code: "", description: "", type: "percent", value: "", minOrder: "", expiresAt: null };

export default function AdminCoupons() {
  const { data, isLoading, refetch } = trpc.admin.coupons.useQuery();
  const upsert = trpc.admin.upsertCoupon.useMutation();
  const del = trpc.admin.deleteCoupon.useMutation();
  const [form, setForm] = useState<CouponForm>({ ...EMPTY });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Coupons — Luxe Admin";
  }, []);

  const coupons = (data ?? []) as CouponRow[];

  const submit = () => {
    if (!form.code.trim() || !form.value) {
      toast.error("Please provide a code and a value.");
      return;
    }
    upsert.mutate(
      {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : undefined,
        expiresAt: form.expiresAt ?? undefined,
        description: form.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(form.id ? "Coupon updated" : "Coupon created");
          refetch();
          setOpen(false);
        },
        onError: () => toast.error("Could not save coupon"),
      },
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} coupons</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
          className="press inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={15} /> New Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Tag size={30} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No coupons yet. Create your first discount code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold/10">
                <Tag size={14} className="text-gold" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold tracking-wide">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.type === "percent" ? `${c.value}% off` : `$${c.value} off`}
                  {c.minOrder ? ` · min. order $${c.minOrder}` : ""}
                  {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : " · no expiry"}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => {
                  setForm({
                    id: c.id,
                    code: c.code,
                    description: c.description ?? "",
                    type: c.type as "percent" | "fixed",
                    value: c.value,
                    minOrder: c.minOrder ?? "",
                    expiresAt: c.expiresAt,
                  });
                  setOpen(true);
                }}
                className="press rounded-md border border-border px-3 py-2 text-xs hover:border-gold hover:text-gold transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => del.mutate({ id: c.id }, { onSuccess: () => { toast.success("Coupon deleted"); refetch(); }, onError: () => toast.error("Could not delete") })}
                className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                aria-label="Delete coupon"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Coupon" : "New Coupon"}</DialogTitle>
            <DialogDescription>Create discount codes for your customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Code</span>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</span>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as "percent" | "fixed" }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{form.type === "percent" ? "Percent" : "Amount ($)"}</span>
                <input
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Minimum order ($)</span>
              <input
                type="number"
                min={0}
                value={form.minOrder}
                onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Expires at (optional)</span>
              <input
                type="datetime-local"
                value={form.expiresAt ? new Date(form.expiresAt.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value ? new Date(e.target.value) : null }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Description (optional)</span>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="press rounded-md border border-border px-4 py-2.5 text-sm hover:border-gold hover:text-gold transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={upsert.isPending}
              className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {upsert.isPending ? "Saving…" : "Save Coupon"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
