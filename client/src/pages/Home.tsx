import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronLeft, ChevronRight, Clock, Star, ArrowRight, Heart } from "lucide-react";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import CartDrawer from "@/components/storefront/CartDrawer";
import { trpc } from "@/lib/trpc";
import { formatPrice, useCountdown } from "@/lib/storefront";
import type { Product } from "../../../drizzle/schema";

export default function Home() {
  const { data: banners } = trpc.store.banners.useQuery();
  const { data: flashSale } = trpc.store.flashSale.useQuery();
  const { data: categories } = trpc.store.categories.useQuery();
  const { data: featured } = trpc.store.products.useQuery({
    page: 1,
    pageSize: 8,
    sortBy: "featured",
  });

  const heroBanners = (banners ?? []).filter(b => b.kind === "hero");
  const promoBanners = (banners ?? []).filter(b => b.kind === "promo");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <CartDrawer />
      <main className="flex-1">
        <HeroCarousel banners={heroBanners} />
        <CategoryStrip categories={categories ?? []} />
        {flashSale && flashSale.length > 0 && <FlashSaleSection products={flashSale} />}
        {promoBanners.length > 0 && <PromoBanners banners={promoBanners} />}
        <FeaturedSection products={featured?.products ?? []} />
        <ValueStrip />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroCarousel({ banners }: { banners: { id: number; title: string; subtitle: string | null; image: string; ctaText: string | null; ctaHref: string | null }[] }) {
  const [index, setIndex] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % total), 7000);
    return () => clearInterval(id);
  }, [total]);

  if (total === 0) return null;
  const b = banners[index];

  return (
    <section className="relative overflow-hidden" aria-label="Featured collections">
      <div className="relative h-[420px] sm:h-[520px] lg:h-[640px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <div key={b.id} className="max-w-lg text-white animate-fade-up">
              <p className="text-xs md:text-sm tracking-luxe uppercase text-gold mb-3">New Season</p>
              <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight mb-4">{b.title}</h1>
              {b.subtitle && <p className="text-sm md:text-base text-white/80 leading-relaxed mb-8">{b.subtitle}</p>}
              {b.ctaHref && (
                <Link
                  href={b.ctaHref}
                  className="inline-flex items-center gap-2 rounded-md bg-popover px-7 py-3.5 text-sm font-medium text-popover-foreground press hover:bg-gold hover:text-gold-foreground transition-colors"
                >
                  {b.ctaText ?? "Explore"}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        {total > 1 && (
          <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-white" : "w-3 bg-white/40"}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIndex(i => (i - 1 + total) % total)}
              className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 press transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setIndex(i => (i + 1) % total)}
              className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 press transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function CategoryStrip({ categories }: { categories: { id: number; name: string; slug: string; image: string | null; description: string | null }[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container py-14">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-luxe uppercase text-gold mb-2">The Collections</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Shop by Category</h2>
        </div>
        <Link href="/catalog" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/catalog?categoryId=${c.id}`}
            className="group relative overflow-hidden rounded-xl aspect-[4/5] reveal-on-scroll"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <img
              src={c.image ?? ""}
              alt={c.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="font-display text-xl md:text-2xl text-white font-medium">{c.name}</h3>
              <span className="mt-1 inline-block text-xs text-white/70 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FlashSaleSection({ products }: { products: Product[] }) {
  const first = products[0];
  const endAt = useMemo(() => (first?.flashSaleEndsAt ? new Date(first.flashSaleEndsAt as unknown as string) : undefined), [first]);
  const { days, hours, minutes, seconds } = useCountdown(endAt);

  return (
    <section className="bg-secondary py-16">
      <div className="container">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs tracking-luxe uppercase text-gold mb-2">
              <Clock size={13} /> Limited Offer
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Flash Sale</h2>
            <p className="mt-2 text-sm text-muted-foreground">Exceptional pieces at exceptional prices — while they last.</p>
          </div>
          <div className="flex items-center gap-2" aria-label="Countdown timer">
            {[
              { label: "Days", value: days },
              { label: "Hours", value: hours },
              { label: "Min", value: minutes },
              { label: "Sec", value: seconds },
            ].map(u => (
              <div key={u.label} className="flex flex-col items-center rounded-lg bg-primary px-3.5 py-2.5 min-w-16 text-primary-foreground">
                <span className="font-display text-2xl font-semibold tabular-nums">{String(u.value).padStart(2, "0")}</span>
                <span className="text-[10px] tracking-luxe uppercase opacity-70">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/catalog?isFlashSale=1"
            className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 text-sm font-medium press hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Shop Flash Sale <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PromoBanners({ banners }: { banners: { id: number; title: string; image: string; ctaText: string | null; ctaHref: string | null }[] }) {
  return (
    <section className="container py-16">
      <div className="grid md:grid-cols-2 gap-4">
        {banners.map((b, i) => (
          <Link
            key={b.id}
            href={b.ctaHref ?? "/catalog"}
            className="group relative overflow-hidden rounded-xl aspect-[16/9] reveal-on-scroll"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <img src={b.image} alt={b.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="font-display text-2xl md:text-3xl text-white font-medium">{b.title}</h3>
              {b.ctaText && <span className="mt-2 inline-block text-sm text-white/80 group-hover:text-gold transition-colors">{b.ctaText} →</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-luxe uppercase text-gold mb-2">Curated for you</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Featured Pieces</h2>
        </div>
        <Link href="/catalog" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [wishlisted, setWishlisted] = useState(false);
  const { isAuthenticated } = useAuth();
  const toggleWishlist = trpc.wishlist.toggle.useMutation();
  const images = useMemo(() => (Array.isArray(product.images) ? product.images : []), [product.images]);

  return (
    <div className="group reveal-on-scroll" style={{ animationDelay: `${(index % 4) * 70}ms` }}>
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
          {product.isFlashSale && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-gold backdrop-blur">
              <Clock size={11} /> Flash
            </span>
          )}
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              if (!isAuthenticated) return;
              toggleWishlist.mutate(
                { productId: product.id },
                { onSuccess: res => setWishlisted(res) },
              );
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

function ValueStrip() {
  const values = [
    { title: "Complimentary Shipping", desc: "On all orders over $200" },
    { title: "30-Day Returns", desc: "Effortless and free" },
    { title: "Authenticity Guaranteed", desc: "Every piece, verified" },
    { title: "Concierge Support", desc: "Expert assistance, always" },
  ];
  return (
    <section className="container py-16 border-t border-border mt-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {values.map((v, i) => (
          <div key={v.title} className="text-center reveal-on-scroll" style={{ animationDelay: `${i * 80}ms` }}>
            <h3 className="font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


