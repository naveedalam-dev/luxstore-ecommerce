import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Star, Heart, SlidersHorizontal, X, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import CartDrawer from "@/components/storefront/CartDrawer";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";
import type { Product } from "../../../drizzle/schema";

type Filters = {
  search: string;
  categoryId: number | null;
  brandId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  colors: string[];
  sizes: string[];
  minRating: number | null;
  inStock: boolean;
  isFlashSale: boolean;
  sortBy: "featured" | "price_asc" | "price_desc" | "newest" | "rating" | "name";
  page: number;
};

const DEFAULT: Filters = {
  search: "",
  categoryId: null,
  brandId: null,
  minPrice: null,
  maxPrice: null,
  colors: [],
  sizes: [],
  minRating: null,
  inStock: false,
  isFlashSale: false,
  sortBy: "featured",
  page: 1,
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name" },
] as const;

const PRICE_PRESETS = [
  { label: "Under $100", min: null, max: 100 },
  { label: "$100 – $300", min: 100, max: 300 },
  { label: "$300 – $500", min: 300, max: 500 },
  { label: "$500+", min: 500, max: null },
] as const;

export default function Catalog() {
  const [location, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);

  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT,
    search: params.get("q") ?? "",
    categoryId: params.get("categoryId") ? Number(params.get("categoryId")) : null,
    isFlashSale: params.get("isFlashSale") === "1",
  }));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: params.get("q") ?? "",
      categoryId: params.get("categoryId") ? Number(params.get("categoryId")) : null,
      isFlashSale: params.get("isFlashSale") === "1",
    }));
  }, [location]);

  const { data: categories } = trpc.store.categories.useQuery();
  const { data: brands } = trpc.store.brands.useQuery();

  const queryInput = useMemo(
    () => ({
      search: filters.search || undefined,
      categoryId: filters.categoryId ?? undefined,
      brandId: filters.brandId ?? undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      colors: filters.colors.length > 0 ? filters.colors : undefined,
      sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
      minRating: filters.minRating ?? undefined,
      inStock: filters.inStock || undefined,
      sortBy: filters.sortBy,
      page: filters.page,
      pageSize: 12,
    }),
    [filters],
  );

  const { data, isLoading } = trpc.store.products.useQuery(queryInput);
  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  const setActive = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch, page: 1 }));

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.brandId ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    filters.colors.length +
    filters.sizes.length +
    (filters.minRating ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const clearAll = () => {
    setFilters({ ...DEFAULT, search: filters.search, isFlashSale: filters.isFlashSale });
    navigate("/catalog");
  };

  const activeCategory = categories?.find(c => c.id === filters.categoryId);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <CartDrawer />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            {activeCategory && <p className="text-xs tracking-luxe uppercase text-gold mb-2">Collection</p>}
            <h1 className="font-display text-3xl md:text-5xl font-semibold">
              {activeCategory?.name ?? filters.isFlashSale ? "Flash Sale" : "Shop All"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
              {filters.search && ` matching “${filters.search}”`}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-y border-border py-4 mb-8">
            <button
              onClick={() => setDrawerOpen(v => !v)}
              className={`press inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors lg:hidden ${activeFilterCount > 0 ? "border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <SlidersHorizontal size={15} /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort by
              <span className="relative">
                <select
                  value={filters.sortBy}
                  onChange={e => setActive({ sortBy: e.target.value as Filters["sortBy"] })}
                  className="appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm font-medium text-foreground outline-none focus:border-gold transition-colors"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block space-y-8">
              <FilterSidebar
                filters={filters}
                categories={categories ?? []}
                brands={brands ?? []}
                setActive={setActive}
                clearAll={clearAll}
                activeFilterCount={activeFilterCount}
              />
            </aside>

            {/* Results */}
            <div>
              {activeFilterCount > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {filters.categoryId && (
                    <FilterChip
                      label={categories?.find(c => c.id === filters.categoryId)?.name ?? ""}
                      onRemove={() => setActive({ categoryId: null })}
                    />
                  )}
                  {filters.brandId && (
                    <FilterChip
                      label={brands?.find(b => b.id === filters.brandId)?.name ?? ""}
                      onRemove={() => setActive({ brandId: null })}
                    />
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <FilterChip
                      label={`$${filters.minPrice ?? "0"} – ${filters.maxPrice ?? "+"}`}
                      onRemove={() => setActive({ minPrice: null, maxPrice: null })}
                    />
                  )}
                  {filters.colors.map(c => (
                    <FilterChip key={c} label={c} onRemove={() => setActive({ colors: filters.colors.filter(x => x !== c) })} />
                  ))}
                  {filters.sizes.map(s => (
                    <FilterChip key={s} label={`Size ${s}`} onRemove={() => setActive({ sizes: filters.sizes.filter(x => x !== s) })} />
                  ))}
                  {filters.minRating && (
                    <FilterChip label={`${filters.minRating}+ stars`} onRemove={() => setActive({ minRating: null })} />
                  )}
                  {filters.inStock && <FilterChip label="In stock" onRemove={() => setActive({ inStock: false })} />}
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/5] rounded-xl bg-muted" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
                      <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <p className="font-display text-2xl font-semibold">No products found</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Try adjusting your filters or search terms to discover more of the collection.
                  </p>
                  <button onClick={clearAll} className="press rounded-md border border-border px-5 py-2.5 text-sm">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((p, i) => (
                      <CatalogCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActive({ page: i + 1 })}
                          className={`press flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors ${filters.page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setDrawerOpen(false)} />
            <div className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-background shadow-2xl animate-slide-in-right">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-display text-lg font-semibold">Filters</h2>
                <button className="press p-2 text-muted-foreground" onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-6">
                <FilterSidebar
                  filters={filters}
                  categories={categories ?? []}
                  brands={brands ?? []}
                  setActive={setActive}
                  clearAll={() => {
                    clearAll();
                    setDrawerOpen(false);
                  }}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterSidebar(props: {
  filters: Filters;
  categories: { id: number; name: string; slug: string }[];
  brands: { id: number; name: string; slug: string }[];
  setActive: (patch: Partial<Filters>) => void;
  clearAll: () => void;
  activeFilterCount: number;
}) {
  const { filters, categories, brands, setActive, clearAll, activeFilterCount } = props;

  const section = (title: string, children: React.ReactNode, count?: number) => (
    <div className="border-b border-border pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-luxe uppercase">{title}</h3>
        {typeof count === "number" && count > 0 && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-gold transition-colors">
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-7">
      {categories.length > 0 &&
        section(
          "Category",
          <ul className="space-y-1.5">
            <li>
              <button
                onClick={() => setActive({ categoryId: null })}
                className={`w-full text-left text-sm py-1.5 transition-colors ${!filters.categoryId ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Collections
              </button>
            </li>
            {categories.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => setActive({ categoryId: filters.categoryId === c.id ? null : c.id })}
                  className={`w-full text-left text-sm py-1.5 transition-colors ${filters.categoryId === c.id ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>,
          filters.categoryId ? 1 : 0,
        )}

      {brands.length > 0 &&
        section(
          "Brand",
          <ul className="space-y-1.5">
            {brands.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => setActive({ brandId: filters.brandId === b.id ? null : b.id })}
                  className={`w-full text-left text-sm py-1.5 transition-colors ${filters.brandId === b.id ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>,
          filters.brandId ? 1 : 0,
        )}

      {section(
        "Price Range",
        <>
          <div className="grid grid-cols-2 gap-2">
            {PRICE_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setActive({ minPrice: p.min, maxPrice: p.max })}
                className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                  filters.minPrice === p.min && filters.maxPrice === p.max
                    ? "border-gold bg-gold/10 text-gold font-medium"
                    : "border-border text-muted-foreground hover:border-gold hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={e => setActive({ minPrice: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={e => setActive({ maxPrice: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </>,
        filters.minPrice || filters.maxPrice ? 1 : 0,
      )}

      {section(
        "Rating",
        <ul className="space-y-1.5">
          {[4, 3, 2].map(r => (
            <li key={r}>
              <button
                onClick={() => setActive({ minRating: filters.minRating === r ? null : r })}
                className={`flex w-full items-center gap-1.5 text-sm py-1.5 transition-colors ${filters.minRating === r ? "text-gold font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < r ? "fill-gold text-gold" : ""} />
                ))}
                <span className="ml-1">& up</span>
              </button>
            </li>
          ))}
        </ul>,
        filters.minRating ? 1 : 0,
      )}

      {section(
        "Availability",
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={e => setActive({ inStock: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-gold"
          />
          In stock only
        </label>,
        filters.inStock ? 1 : 0,
      )}

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="press w-full rounded-md border border-border py-2.5 text-sm hover:border-gold hover:text-gold transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs">
      {label}
      <button onClick={onRemove} className="press text-muted-foreground hover:text-foreground" aria-label={`Remove ${label} filter`}>
        <X size={11} />
      </button>
    </span>
  );
}

function CatalogCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [wishlisted, setWishlisted] = useState(false);
  const { isAuthenticated } = useAuth();
  const toggleWishlist = trpc.wishlist.toggle.useMutation();
  const images = useMemo(() => (Array.isArray(product.images) ? product.images : []), [product.images]);

  return (
    <div className="group reveal-on-scroll" style={{ animationDelay: `${(index % 6) * 60}ms` }}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <img
            src={images[0] ?? ""}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {product.compareAtPrice && (
            <span className="absolute top-3 left-3 rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground">
              Sale
            </span>
          )}
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              if (!isAuthenticated) return;
              toggleWishlist.mutate({ productId: product.id }, { onSuccess: res => setWishlisted(res) });
            }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 press transition-all duration-300"
            aria-label="Add to wishlist"
          >
            <Heart size={15} fill={wishlisted ? "currentColor" : "none"} className={wishlisted ? "text-destructive" : ""} />
          </button>
        </div>
        <div className="mt-3.5 px-0.5">
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm">
            <span className="font-medium">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star size={11} className="fill-gold text-gold" />
            <span>
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
