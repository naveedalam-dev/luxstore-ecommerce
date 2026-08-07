import { useState } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { AccountLayout } from "@/components/account/AccountLayout";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

type WishlistRow = {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product: { id: number; name: string; slug: string; price: string; images: unknown } | null;
};

export default function MyWishlist() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, refetch } = trpc.wishlist.list.useQuery();
  const removeFromWishlist = trpc.wishlist.toggle.useMutation();
  const { addToCart } = useCart();

  const handleAdd = (row: WishlistRow) => {
    if (!row.product) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your bag.");
      return;
    }
    addToCart(row.product!.id, 1).then(() => toast.success(`${row.product!.name} added to your bag`));
  };

  const handleRemove = (productId: number) => {
    removeFromWishlist.mutate({ productId }, { onSuccess: () => refetch() });
  };

  const items = (data ?? []) as WishlistRow[];

  return (
    <AccountLayout>
      <h2 className="font-display text-2xl font-semibold mb-6">Wishlist</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] rounded-xl bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Heart size={30} className="text-muted-foreground/50" />
          <p className="font-display text-lg font-semibold">Your wishlist is empty</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Save your favorite pieces here so you can find them again easily.
          </p>
          <Link href="/catalog" className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(row => {
            const p = row.product;
            if (!p) return null;
            const images = Array.isArray(p.images) ? (p.images as string[]) : [];
            return (
              <div key={row.id} className="group">
                <Link href={`/product/${p.slug}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    <img src={images[0] ?? ""} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <Link href={`/product/${p.slug}`}>
                    <h3 className="text-sm font-medium hover:text-gold transition-colors">{p.name}</h3>
                    <p className="mt-1 text-sm font-medium">{formatPrice(p.price)}</p>
                  </Link>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAdd(row)}
                      className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-gold hover:text-gold"
                      aria-label="Add to bag"
                      title="Add to bag"
                    >
                      <ShoppingCart size={13} />
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="press flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Remove from wishlist"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
