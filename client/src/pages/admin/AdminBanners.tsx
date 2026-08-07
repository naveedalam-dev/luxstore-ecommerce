import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon, Trash2, Pencil } from "lucide-react";
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

type BannerRow = {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  kind: string;
  ctaText: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
};

type BannerForm = {
  id?: number;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaHref: string;
  kind: "hero" | "promo";
  isActive: boolean;
};

const EMPTY: BannerForm = { title: "", subtitle: "", image: "", ctaText: "Shop Now", ctaHref: "/catalog", kind: "hero", isActive: true };

export default function AdminBanners() {
  const { data, isLoading, refetch } = trpc.admin.banners.useQuery();
  const upsert = trpc.admin.upsertBanner.useMutation();
  const del = trpc.admin.deleteBanner.useMutation();
  const [form, setForm] = useState<BannerForm>({ ...EMPTY });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Banners — Luxe Admin";
  }, []);

  const banners = (data ?? []) as BannerRow[];

  const submit = () => {
    if (!form.title.trim() || !form.image.trim()) {
      toast.error("Please provide a title and an image URL.");
      return;
    }
    upsert.mutate(
      {
        ...form,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        ctaText: form.ctaText.trim() || undefined,
        ctaHref: form.ctaHref.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(form.id ? "Banner updated" : "Banner created");
          refetch();
          setOpen(false);
        },
        onError: () => toast.error("Could not save banner"),
      },
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Banners</h1>
          <p className="text-sm text-muted-foreground">Hero carousel content</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
          className="press inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={15} /> New Banner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <ImageIcon size={30} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No banners yet. Add slides for the homepage carousel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
              <img src={b.image} alt={b.title} className="h-20 w-32 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.subtitle ?? "—"}</p>
                <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${b.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  {b.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                onClick={() => {
                  setForm({
                    id: b.id,
                    title: b.title,
                    subtitle: b.subtitle ?? "",
                    image: b.image,
                    ctaText: b.ctaText ?? "",
                    ctaHref: b.ctaHref ?? "",
                    kind: (b.kind as "hero" | "promo") ?? "hero",
                    isActive: b.isActive,
                  });
                  setOpen(true);
                }}
                className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-gold hover:border-gold"
                aria-label="Edit banner"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => del.mutate({ id: b.id }, { onSuccess: () => { toast.success("Banner deleted"); refetch(); }, onError: () => toast.error("Could not delete") })}
                className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                aria-label="Delete banner"
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
            <DialogTitle>{form.id ? "Edit Banner" : "New Banner"}</DialogTitle>
            <DialogDescription>Slides for the homepage hero carousel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Kind</span>
              <select
                value={form.kind}
                onChange={e => setForm(f => ({ ...f, kind: e.target.value as "hero" | "promo" }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                <option value="hero">Hero carousel</option>
                <option value="promo">Promotional</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</span>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Subtitle</span>
              <input
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Image URL</span>
              <input
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://…"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
              {form.image && (
                <img src={form.image} alt="Preview" className="mt-2 max-h-40 rounded-md object-cover" />
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">CTA text</span>
                <input
                  value={form.ctaText}
                  onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">CTA link</span>
                <input
                  value={form.ctaHref}
                  onChange={e => setForm(f => ({ ...f, ctaHref: e.target.value }))}
                  placeholder="/catalog"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-gold" />
              Active on homepage
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
              {upsert.isPending ? "Saving…" : "Save Banner"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
