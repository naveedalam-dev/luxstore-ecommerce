import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Star, X, Image as ImageIcon, Sparkles } from "lucide-react";
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
import { formatPrice } from "@/lib/storefront";
const FORGE_URL = (import.meta.env.VITE_FRONTEND_FORGE_API_URL as string) ?? "";
const FORGE_KEY = (import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string) ?? "";

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  categoryId: number;
  brandId: number;
  images: unknown;
  stockBySize: unknown;
  colors: unknown;
  sizes: unknown;
  isFeatured: boolean;
  isFlashSale: boolean;
  rating: string;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  categoryId: number | null;
  brandId: number | null;
  images: string[];
  price: string;
  compareAtPrice: string;
  stockBySize: Record<string, number>;
  colors: { name: string; swatch: string }[];
  sizes: string[];
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt: Date | null;
  tags: string[];
};

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  description: "",
  categoryId: null,
  brandId: null,
  images: [],
  price: "",
  compareAtPrice: "",
  stockBySize: {},
  colors: [],
  sizes: [],
  isFeatured: false,
  isFlashSale: false,
  flashSaleEndsAt: null,
  tags: [],
};

export default function AdminProducts() {
  const { data, isLoading, refetch } = trpc.admin.products.useQuery({});
  const { data: categories } = trpc.admin.categories.useQuery();
  const { data: brands } = trpc.admin.brands.useQuery();

  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    document.title = "Products — Luxe Admin";
  }, []);

  const products = (data?.products ?? []) as AdminProduct[];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products in catalog</p>
        </div>
        <div className="flex-1" />
        <button onClick={openCreate} className="press inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const images = Array.isArray(p.images) ? (p.images as string[]) : [];
            const totalStock = Object.values((p.stockBySize as Record<string, number>) ?? {}).reduce((a, b) => a + b, 0);
            return (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-3.5 md:p-4">
                <img src={images[0] ?? ""} alt={p.name} className="h-16 w-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${p.slug}`} className="line-clamp-1 font-medium hover:text-gold transition-colors">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{formatPrice(p.price)}</span>
                    {p.compareAtPrice && <span className="line-through">{formatPrice(p.compareAtPrice)}</span>}
                    <span>· Stock {totalStock}</span>
                    {p.isFeatured && <span className="flex items-center gap-1 text-gold"><Star size={11} /> Featured</span>}
                    {p.isFlashSale && <span className="flex items-center gap-1 text-destructive"><Sparkles size={11} /> Flash sale</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => openEdit(p)} className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-gold hover:border-gold" aria-label="Edit">
                    <Pencil size={13} />
                  </button>
                  <DeleteProductButton id={p.id} onDone={() => refetch()} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories ?? []}
        brands={brands ?? []}
        onDone={() => refetch()}
        generating={generating}
        setGenerating={setGenerating}
      />
    </AdminLayout>
  );
}

function DeleteProductButton({ id, onDone }: { id: number; onDone: () => void }) {
  const del = trpc.admin.deleteProduct.useMutation();
  return (
    <button
      onClick={() => del.mutate({ id }, { onSuccess: () => { toast.success("Product deleted"); onDone(); }, onError: () => toast.error("Could not delete") })}
      className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
      aria-label="Delete"
    >
      <Trash2 size={13} />
    </button>
  );
}

function ProductDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AdminProduct | null;
  categories: { id: number; name: string; slug: string }[];
  brands: { id: number; name: string; slug: string }[];
  onDone: () => void;
  generating: boolean;
  setGenerating: (v: boolean) => void;
}) {
  const { open, onOpenChange, editing, categories, brands, onDone, generating, setGenerating } = props;
  const create = trpc.admin.createProduct.useMutation();
  const update = trpc.admin.updateProduct.useMutation();
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });
  const [newSize, setNewSize] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const images = Array.isArray(editing.images) ? (editing.images as string[]) : [];
      const colors = Array.isArray(editing.colors) ? (editing.colors as { name: string; swatch: string }[]) : [];
      const sizes = Array.isArray(editing.sizes) ? (editing.sizes as string[]) : [];
      const stockBySize = typeof editing.stockBySize === "object" && editing.stockBySize ? (editing.stockBySize as Record<string, number>) : {};
      setForm({
        name: editing.name,
        slug: editing.slug,
        description: "",
        categoryId: editing.categoryId,
        brandId: editing.brandId,
        images,
        price: editing.price,
        compareAtPrice: editing.compareAtPrice ?? "",
        stockBySize,
        colors,
        sizes,
        isFeatured: editing.isFeatured,
        isFlashSale: editing.isFlashSale,
        flashSaleEndsAt: null,
        tags: [],
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setNewSize("");
  }, [open, editing]);

  const submit = () => {
    if (!form.name.trim() || !form.price || form.images.length === 0 || !form.categoryId || !form.brandId || form.sizes.length === 0 || form.colors.length === 0) {
      toast.error("Please fill in name, price, images, category, brand, sizes, and colors.");
      return;
    }
    const slug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || "A premium piece from the Luxe collection.",
      categoryId: form.categoryId!,
      brandId: form.brandId!,
      images: form.images,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stockBySize: form.stockBySize,
      colors: form.colors,
      sizes: form.sizes,
      rating: 4.6,
      reviewCount: 0,
      isFeatured: form.isFeatured,
      isFlashSale: form.isFlashSale,
      flashSaleEndsAt: form.isFlashSale && form.flashSaleEndsAt ? form.flashSaleEndsAt : null,
      tags: form.tags.filter(Boolean),
      sortOrder: 0,
    };

    if (editing) {
      update.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => {
          toast.success("Product updated");
          onDone();
          onOpenChange(false);
        },
        onError: () => toast.error("Could not save product"),
      });
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("Product created");
          onDone();
          onOpenChange(false);
        },
        onError: () => toast.error("Could not save product"),
      });
    }
  };

  const set = (patch: Partial<ProductForm>) => setForm(f => ({ ...f, ...patch }));

  const addSize = () => {
    const s = newSize.trim();
    if (!s || form.sizes.includes(s)) return;
    set({ sizes: [...form.sizes, s], stockBySize: { ...form.stockBySize, [s]: 10 } });
    setNewSize("");
  };

  const addColor = () => set({ colors: [...form.colors, { name: "New Color", swatch: "#C9A227" }] });

  const generateImages = async () => {
    if (!form.name.trim() || generating) return;
    setGenerating(true);
    try {
      const results: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${FORGE_URL}/api/forge/image/generation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FORGE_KEY}`,
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash-image",
            prompt: `Premium luxury product photography for "${form.name}", studio shot, soft gradient background, centered composition, high-end editorial style, photorealistic.`,
          }),
        });
        const json = await res.json();
        const url = json?.content?.[0]?.image_url || json?.data?.[0]?.url;
        if (url) results.push(url);
        else break;
      }
      if (results.length === 0) throw new Error("no image");
      set({ images: [...form.images, ...results] });
      toast.success(`Generated ${results.length} image${results.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Could not generate images. You can paste image URLs manually instead.");
    } finally {
      setGenerating(false);
    }
  };

  const fields: [string, string, (v: string) => void][] = useMemo(
    () => [
      ["Product name", form.name, v => set({ name: v })],
      ["Slug (optional)", form.slug, v => set({ slug: v })],
      ["Price", form.price, v => set({ price: v })],
      ["Compare-at price (optional)", form.compareAtPrice, v => set({ compareAtPrice: v })],
    ],
    [form.name, form.slug, form.price, form.compareAtPrice],
  );

  return (
        <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the details of this product." : "Create a new catalog product."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map(([label, value, onChange]) => (
            <Field key={label} label={label} value={value} onChange={onChange} />
          ))}

          <Field
            label="Description"
            value={form.description}
            onChange={v => set({ description: v })}
            multiline
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={form.categoryId ?? ""}
                onChange={e => set({ categoryId: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                <option value="">Select…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</label>
              <select
                value={form.brandId ?? ""}
                onChange={e => set({ brandId: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                <option value="">Select…</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Images (URLs)</label>
            <textarea
              value={form.images.join("\n")}
              onChange={e => set({ images: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
              rows={3}
              placeholder="Paste image URLs, one per line"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
            <button
              onClick={generateImages}
              disabled={generating || !form.name.trim()}
              className="press mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs disabled:opacity-50 hover:border-gold hover:text-gold transition-colors"
            >
              <ImageIcon size={13} />
              {generating ? "Generating…" : "Generate AI images from name"}
            </button>
            {form.images.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {form.images.map((img, i) => (
                  <div key={img} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => set({ images: form.images.filter((_, j) => j !== i) })}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                      aria-label="Remove image"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes + stock */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sizes & Stock</label>
            <div className="flex flex-wrap gap-2">
              {form.sizes.map(s => (
                <div key={s} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-xs">
                  <span>{s}</span>
                  <input
                    type="number"
                    min={0}
                    value={form.stockBySize[s] ?? 0}
                    onChange={e => set({ stockBySize: { ...form.stockBySize, [s]: Math.max(0, Number(e.target.value) || 0) } })}
                    className="w-10 rounded border border-transparent bg-background px-1 py-0.5 text-xs outline-none focus:border-gold"
                    aria-label={`Stock for ${s}`}
                  />
                  <button onClick={() => set({ sizes: form.sizes.filter(x => x !== s), stockBySize: Object.fromEntries(Object.entries(form.stockBySize).filter(([k]) => k !== s)) })} className="text-muted-foreground hover:text-destructive" aria-label="Remove size">
                    <X size={11} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  placeholder="Size"
                  className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-gold"
                />
                <button onClick={addSize} className="press rounded-md border border-border px-2 py-1 text-xs hover:border-gold hover:text-gold">Add</button>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Colors</label>
              <button onClick={addColor} className="press rounded-md border border-border px-2 py-1 text-xs hover:border-gold hover:text-gold">Add color</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-xs">
                  <input
                    type="color"
                    value={c.swatch}
                    onChange={e => set({ colors: form.colors.map((x, j) => (j === i ? { ...x, swatch: e.target.value } : x)) })}
                    className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent"
                    aria-label="Color swatch"
                  />
                  <input
                    value={c.name}
                    onChange={e => set({ colors: form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                    className="w-20 rounded border border-transparent bg-background px-1.5 py-0.5 text-xs outline-none focus:border-gold"
                    aria-label="Color name"
                  />
                  <button onClick={() => set({ colors: form.colors.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive" aria-label="Remove color">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={e => set({ isFeatured: e.target.checked })} className="h-4 w-4 accent-gold" />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFlashSale} onChange={e => set({ isFlashSale: e.target.checked })} className="h-4 w-4 accent-gold" />
              Flash sale
            </label>
            {form.isFlashSale && (
              <input
                type="datetime-local"
                value={form.flashSaleEndsAt ? new Date(form.flashSaleEndsAt.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={e => set({ flashSaleEndsAt: e.target.value ? new Date(e.target.value) : null })}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-gold"
                aria-label="Flash sale end time"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="press rounded-md border border-border px-4 py-2.5 text-sm hover:border-gold hover:text-gold transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={create.isPending || update.isPending}
            className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {(create.isPending || update.isPending) ? "Saving…" : editing ? "Save Changes" : "Create Product"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      )}
    </label>
  );
}
