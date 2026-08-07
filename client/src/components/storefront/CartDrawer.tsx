import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/storefront";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={closeCart} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-semibold">
            Your Bag <span className="text-sm font-sans text-muted-foreground">({itemCount})</span>
          </h2>
          <button className="press p-2 text-muted-foreground hover:text-foreground" onClick={closeCart} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag className="text-muted-foreground/50" size={44} strokeWidth={1.25} />
              <p className="text-sm text-muted-foreground">Your bag is empty.</p>
              <Link
                href="/catalog"
                onClick={closeCart}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground press"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map(item => (
                <li key={item.id} className="flex gap-4 animate-fade-in">
                  <Link href={`/product/${item.product.slug}`} onClick={closeCart}>
                    <img
                      src={item.product.images?.[0] ?? ""}
                      alt={item.product.name}
                      className="h-24 w-20 rounded-md object-cover shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="line-clamp-1 text-sm font-medium hover:text-gold transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {item.size && item.size !== "One Size" && <span>Size {item.size}</span>}
                          {item.color && <span>· {item.color}</span>}
                        </div>
                      </div>
                      <button
                        className="press text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border rounded-md">
                        <button
                          className="press p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          className="press p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="text-sm font-medium">{formatPrice(Number(item.product.price) * item.quantity)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {subtotal >= 200
                ? "Complimentary shipping applied."
                : `Add ${formatPrice(200 - subtotal)} more for complimentary shipping.`}
            </p>
            {isAuthenticated ? (
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full rounded-md bg-primary py-3.5 text-center text-sm font-medium text-primary-foreground press hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <button
                onClick={() => {
                  startLogin();
                }}
                className="w-full rounded-md bg-primary py-3.5 text-sm font-medium text-primary-foreground press hover:opacity-90 transition-opacity"
              >
                Sign in to Checkout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
