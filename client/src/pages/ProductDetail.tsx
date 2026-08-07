import { useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { Star, Minus, Plus, Clock, Heart, Check, Truck, Shield, RefreshCcw, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import CartDrawer from "@/components/storefront/CartDrawer";
import { trpc } from "@/lib/trpc";
import { formatPrice, stockLabel, stockBySizeFor, useCountdown, getDeliveryEstimate, ratingBreakdown } from "@/lib/storefront";
import NotFound from "./NotFound";
import type { Product } from "../../../drizzle/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug ?? "";
  const { data, isLoading } = trpc.store.productBySlug.useQuery({ slug });
  const product = data?.product;
  const serverReviews = data?.reviews ?? [];

  if (!isLoading && !product) return <NotFound />;
  if (isLoading || !product) return <ProductSkeleton />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <CartDrawer />
      <main className="flex-1">
        <ProductView product={product} reviews={serverReviews} />
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductView({ product, reviews }: { product: Product; reviews: { id: number; userId: number; userName: string; rating: number; title: string | null; body: string; productId: number; createdAt: Date }[] }) {
  const { isAuthenticated } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const zoomRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const images = useMemo(() => (Array.isArray(product.images) ? product.images : []), [product.images]);
  const colors = useMemo(() => (Array.isArray(product.colors) ? product.colors : []), [product.colors]);
  const sizes = useMemo(() => (Array.isArray(product.sizes) ? product.sizes : []), [product.sizes]);
  const stockBySize = useMemo(
    () => (typeof product.stockBySize === "object" && product.stockBySize ? (product.stockBySize as Record<string, number>) : {}),
    [product.stockBySize],
  );

  const toggleWishlist = trpc.wishlist.toggle.useMutation();
  const addToCart = trpc.cart.add.useMutation();

  const flashEnd = useMemo(
    () => (product.isFlashSale && product.flashSaleEndsAt ? new Date(product.flashSaleEndsAt as unknown as string) : undefined),
    [product],
  );
  const countdown = useCountdown(flashEnd);

  const stockInfo = stockLabel(stockBySize, selectedSize ?? undefined);
  const stockQty = stockBySizeFor(selectedSize ?? undefined, stockBySize);
  const unselectedQty =
    !selectedSize && Object.keys(stockBySize).length > 0
      ? Math.max(0, ...Object.values(stockBySize).filter((v): v is number => typeof v === "number"))
      : 0;
  const maxQty = stockQty > 0 ? Math.min(10, stockQty) : unselectedQty;

  const handleAddToCart = () => {
    if (maxQty <= 0) {
      toast.error("This variant is out of stock.");
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your bag.");
      return;
    }
    addToCart.mutate(
      {
        productId: product.id,
        quantity,
        size: selectedSize ?? "One Size",
        color: selectedColor ?? colors[0]?.name ?? "",
      },
      {
        onSuccess: () => toast.success(`${product.name} added to your bag`),
        onError: () => toast.error("Could not add to bag. Please try again."),
      },
    );
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save to your wishlist.");
      return;
    }
    toggleWishlist.mutate({ productId: product.id }, { onSuccess: res => setWishlisted(res) });
  };

  const pctOff =
    product.compareAtPrice && Number(product.compareAtPrice) > 0
      ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
      : 0;

  return (
    <div className="container py-8 md:py-12">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-gold transition-colors">Home</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-gold transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div
            ref={zoomRef}
            className="group relative overflow-hidden rounded-2xl bg-muted aspect-[4/5]"
            onMouseMove={e => {
              const rect = zoomRef.current?.getBoundingClientRect();
              if (!rect) return;
              setZoom({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
                active: true,
              });
            }}
            onMouseLeave={() => setZoom(z => ({ ...z, active: false }))}
          >
            <img
              src={images[activeImage] ?? ""}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-200"
              style={{
                transform: zoom.active ? "scale(1.8)" : "scale(1)",
                transformOrigin: `${zoom.x}% ${zoom.y}%`,
              }}
            />
            {product.compareAtPrice && (
              <span className="absolute top-4 left-4 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
                {pctOff}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-lg aspect-square border-2 transition-colors ${i === activeImage ? "border-gold" : "border-transparent"}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:py-4">
          <p className="text-xs tracking-luxe uppercase text-gold mb-2">Luxe Collection</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={15}
                  className={i < Math.round(Number(product.rating)) ? "fill-gold text-gold" : "text-muted-foreground/30"}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>

          {product.isFlashSale && product.flashSaleEndsAt && !countdown.done && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground">
              <Clock size={14} className="text-gold" />
              <span className="text-sm font-medium">Flash sale ends in</span>
              <span className="font-display font-semibold tabular-nums">
                {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
              </span>
            </div>
          )}

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mt-7">
              <h3 className="text-sm font-semibold mb-3">
                Color: <span className="font-normal text-muted-foreground">{selectedColor ?? colors[0].name}</span>
              </h3>
              <div className="flex gap-2.5">
                {colors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${selectedColor === c.name || (!selectedColor && c === colors[0]) ? "border-gold scale-105" : "border-border hover:border-foreground/30"}`}
                    aria-label={`Color ${c.name}`}
                  >
                    <span className="h-7 w-7 rounded-full border border-black/10" style={{ backgroundColor: c.swatch }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Size</h3>
                <span className={`text-xs ${stockInfo.tone === "out" ? "text-destructive" : stockInfo.tone === "low" ? "text-gold" : "text-muted-foreground"}`}>
                  {selectedSize ? stockInfo.text : "Select a size"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map(s => {
                  const qty = stockBySize[s] ?? 0;
                  const out = qty <= 0;
                  const active = selectedSize === s;
                  return (
                    <button
                      key={s}
                      disabled={out}
                      onClick={() => setSelectedSize(s)}
                      className={`rounded-md border px-4 py-2.5 text-sm transition-all ${
                        out
                          ? "border-border text-muted-foreground/40 cursor-not-allowed line-through"
                          : active
                            ? "border-gold bg-gold/10 text-gold font-medium"
                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add to bag */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center border border-border rounded-md">
              <button
                className="press p-3 text-muted-foreground hover:text-foreground"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                className="press p-3 text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              disabled={addToCart.isPending}
              onClick={handleAddToCart}
              className="press flex-1 rounded-md bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {maxQty <= 0 ? "Out of Stock" : addToCart.isPending ? "Adding…" : "Add to Bag"}
            </button>
            <button
              onClick={handleWishlist}
              className={`press flex h-13 w-13 items-center justify-center rounded-md border transition-colors ${wishlisted ? "border-destructive text-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}
              aria-label="Add to wishlist"
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6">
            {[
              { icon: Truck, label: "Free Shipping", desc: "Orders over $200" },
              { icon: RefreshCcw, label: "30-Day Returns", desc: "Effortless & free" },
              { icon: Shield, label: "Authenticity", desc: "Guaranteed" },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center text-center gap-1.5">
                <b.icon size={17} className="text-gold" />
                <span className="text-xs font-medium">{b.label}</span>
                <span className="text-[11px] text-muted-foreground">{b.desc}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            <Truck size={12} className="inline mr-1.5 -mt-0.5" />
            Estimated delivery: {getDeliveryEstimate()}
          </p>
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection productId={product.id} rating={Number(product.rating)} reviewCount={product.reviewCount} reviews={reviews} />
    </div>
  );
}

function ReviewsSection({ productId, rating, reviewCount, reviews }: { productId: number; rating: number; reviewCount: number; reviews: { id: number; userId: number; userName: string; rating: number; title: string | null; body: string; productId: number; createdAt: Date }[] }) {
  const [ratingVal, setRatingVal] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const createReview = trpc.store.addReview.useMutation();

  const breakdown = ratingBreakdown(reviews, reviewCount);

  const utils = trpc.useUtils();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createReview.mutate(
      { productId, rating: ratingVal, title: title.trim() || undefined, body: body.trim() },
      {
        onSuccess: () => {
          toast.success("Thank you for your review.");
          setTitle("");
          setBody("");
          setRatingVal(5);
          utils.store.productBySlug.invalidate();
          utils.store.reviews.invalidate();
        },
        onError: () => toast.error("Could not post review."),
      },
    );
  };

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-display text-2xl md:text-3xl font-semibold">Customer Reviews</h2>

      {reviewCount > 0 && (
        <div className="mt-8 grid gap-10 md:grid-cols-[280px_1fr]">
          <div className="text-center md:text-left">
            <div className="font-display text-5xl font-semibold">{rating}</div>
            <div className="mt-2 flex items-center justify-center md:justify-start gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(rating) ? "fill-gold text-gold" : "text-muted-foreground/30"} />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{reviewCount} reviews</p>
            <div className="mt-4 space-y-1.5">
              {breakdown.map(b => (
                <div key={b.stars} className="flex items-center gap-2 text-xs">
                  <span className="w-9 text-right">{b.stars}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gold transition-all" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-7 text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {reviews.slice(0, 6).map(r => (
              <div key={r.id} className="border-b border-border pb-5">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < r.rating ? "fill-gold text-gold" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{r.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review */}
      <form onSubmit={submit} className="mt-10 rounded-xl border border-border bg-secondary/50 p-6 md:p-8">
        <h3 className="font-display text-xl font-semibold">Write a Review</h3>
        <div className="mt-5 flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRatingVal(5 - i)}
              className="press p-0.5"
              aria-label={`Rate ${5 - i} stars`}
            >
              <Star size={24} className={i < ratingVal ? "fill-gold text-gold" : "text-muted-foreground/40"} />
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
          />
          <div />
        </div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience with this piece…"
          rows={4}
          className="mt-4 w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={createReview.isPending || !body.trim()}
          className="press mt-4 rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {createReview.isPending ? "Posting…" : "Post Review"}
        </button>
      </form>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="container py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="flex gap-2.5 pt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
