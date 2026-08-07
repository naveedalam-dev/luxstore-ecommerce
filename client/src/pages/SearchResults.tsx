import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, TrendingUp } from "lucide-react";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";
import type { Product } from "../../../drizzle/schema";

function getQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
}

export default function SearchResults() {
  const [location] = useLocation();
  const [query] = useState(() => getQuery());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const input = useMemo(() => ({ search: query || undefined, page: 1, pageSize: 24 }), [query]);
  const { data, isLoading } = trpc.store.products.useQuery(input, { enabled: query.trim().length > 0 });

  const suggestions = [
    { label: "Watches", href: "/catalog?category=watches-jewelry" },
    { label: "Leather goods", href: "/catalog?category=leather-goods" },
    { label: "Apparel", href: "/catalog?category=apparel" },
    { label: "Fragrance", href: "/catalog?category=fragrance" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gold" />
            <h1 className="font-display text-3xl md:text-4xl font-semibold">
              {isLoading ? "Searching…" : query ? `Results for "${query}"` : "Search our collection"}
            </h1>
          </div>

          {isLoading ? (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : query && data && data.products.length === 0 ? (
            <div className="mt-16 text-center border border-dashed border-border rounded-2xl py-20 px-6">
              <p className="text-lg font-medium">No products match your search.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try broader terms or browse our curated categories.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                {suggestions.map(s => (
                  <Link key={s.href} href={s.href} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:border-gold hover:text-gold transition-colors">
                    <TrendingUp size={13} /> {s.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {!query && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {suggestions.map(s => (
                    <Link key={s.href} href={s.href} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:border-gold hover:text-gold transition-colors">
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
              {query && data && <p className="mt-4 text-sm text-muted-foreground">{data.total} product{data.total === 1 ? "" : "s"} found</p>}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {data?.products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


function ProductCard({ product, index }: { product: Product; index: number }) {
  const images = Array.isArray(product.images) ? product.images : [];
  const pctOff =
    product.compareAtPrice && Number(product.compareAtPrice) > 0
      ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
      : 0;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4]">
        {images.length > 0 && (
          <img
            src={images[0]!}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {pctOff > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-md bg-destructive px-2 py-0.5 text-[11px] font-medium text-destructive-foreground">
            {pctOff}% OFF
          </span>
        )}
        {product.isFlashSale && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-primary/80 backdrop-blur px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            Flash
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="mt-1 text-sm font-medium leading-snug">{product.name}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
