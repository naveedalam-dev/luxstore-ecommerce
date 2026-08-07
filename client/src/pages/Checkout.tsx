import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Tag, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/storefront/SiteHeader";
import CartDrawer from "@/components/storefront/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

type AddressState = {
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

const EMPTY_ADDRESS: AddressState = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  phone: "",
};

export default function Checkout() {
  const { isAuthenticated, user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { items, subtotal } = useCart();
  const [address, setAddress] = useState<AddressState>({ ...EMPTY_ADDRESS });
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");

  const checkoutItems = useMemo(
    () => items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    [items],
  );

  const preview = trpc.checkout.preview.useQuery(
    { items: checkoutItems, couponCode: couponCode.trim() || undefined },
    { enabled: items.length > 0, refetchOnWindowFocus: false },
  );
  const createOrder = trpc.checkout.create.useMutation();

  const calc = preview.data;

  if (loading) return <div className="min-h-screen" />;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container py-24 text-center">
          <p className="font-display text-2xl font-semibold">Please sign in to checkout</p>
          <p className="mt-2 text-sm text-muted-foreground">Your cart is preserved once you sign in.</p>
        </main>
      </div>
    );
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calc) return;
    const required: (keyof AddressState)[] = ["firstName", "lastName", "address", "city", "state", "zip", "country"];
    const missing = required.filter(k => !address[k].trim());
    if (missing.length > 0) {
      toast.error("Please complete all required shipping fields.");
      return;
    }
    createOrder.mutate(
      {
        items: checkoutItems,
        customerName: `${address.firstName.trim()} ${address.lastName.trim()}`.trim(),
        customerEmail: user?.email ?? undefined,
        shippingAddress: {
          firstName: address.firstName.trim(),
          lastName: address.lastName.trim(),
          address: address.address.trim(),
          apartment: address.apartment.trim() || undefined,
          city: address.city.trim(),
          state: address.state.trim(),
          zip: address.zip.trim(),
          country: address.country.trim(),
          phone: address.phone.trim() || undefined,
        },
        couponCode: couponCode.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: res => {
          toast.success("Order placed successfully!");
          navigate(`/order-confirmation/${res.orderNumber}`);
        },
        onError: err => toast.error(err.message),
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <CartDrawer />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/catalog" className="hover:text-gold transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-foreground">Checkout</span>
          </nav>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <p className="font-display text-2xl font-semibold">Your bag is empty</p>
              <Link href="/catalog" className="press rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder}>
              <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
                <div className="space-y-8">
                  {/* Shipping */}
                  <section>
                    <h2 className="font-display text-2xl font-semibold mb-5">Shipping Address</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input label="First name" value={address.firstName} onChange={v => setAddress(a => ({ ...a, firstName: v }))} required />
                      <Input label="Last name" value={address.lastName} onChange={v => setAddress(a => ({ ...a, lastName: v }))} required />
                      <Input label="Street address" className="md:col-span-2" value={address.address} onChange={v => setAddress(a => ({ ...a, address: v }))} required />
                      <Input label="Apartment, suite (optional)" className="md:col-span-2" value={address.apartment} onChange={v => setAddress(a => ({ ...a, apartment: v }))} />
                      <Input label="City" value={address.city} onChange={v => setAddress(a => ({ ...a, city: v }))} required />
                      <Input label="State / Region" value={address.state} onChange={v => setAddress(a => ({ ...a, state: v }))} required />
                      <Input label="ZIP / Postal code" value={address.zip} onChange={v => setAddress(a => ({ ...a, zip: v }))} required />
                      <Input label="Country" value={address.country} onChange={v => setAddress(a => ({ ...a, country: v }))} required />
                      <Input label="Phone (optional)" className="md:col-span-2" value={address.phone} onChange={v => setAddress(a => ({ ...a, phone: v }))} />
                    </div>
                  </section>

                  {/* Payment */}
                  <section>
                    <h2 className="font-display text-2xl font-semibold mb-5">Payment Method</h2>
                    <div className="space-y-3">
                      {[
                        { value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives" },
                        { value: "card", label: "Credit / Debit Card", desc: "Secure card payment (demo)" },
                        { value: "transfer", label: "Bank Transfer", desc: "Direct transfer (demo)" },
                      ].map(opt => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3.5 transition-colors ${paymentMethod === opt.value ? "border-gold bg-gold/5" : "border-border hover:border-foreground/30"}`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={opt.value}
                            checked={paymentMethod === opt.value}
                            onChange={() => setPaymentMethod(opt.value)}
                            className="h-4 w-4 accent-gold"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock size={12} />
                        This is a demonstration store — no real payment is processed.
                      </p>
                    </div>
                  </section>

                  {/* Notes */}
                  <section>
                    <h2 className="font-display text-2xl font-semibold mb-5">Order Notes</h2>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Gift message or delivery instructions (optional)"
                      rows={3}
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold transition-colors resize-none"
                    />
                  </section>
                </div>

                {/* Summary */}
                <aside className="lg:sticky lg:top-28 self-start rounded-xl border border-border bg-secondary/50 p-6">
                  <h3 className="font-display text-xl font-semibold mb-5">Order Summary</h3>
                  <ul className="space-y-4 max-h-72 overflow-y-auto">
                    {items.map(item => (
                      <li key={item.id} className="flex gap-3">
                        <img src={item.product.images?.[0] ?? ""} alt={item.product.name} className="h-16 w-14 rounded-md object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.size && item.size !== "One Size" && `Size ${item.size}`}
                            {item.color && ` · ${item.color}`}
                            {` · Qty ${item.quantity}`}
                          </p>
                          <p className="mt-1 text-sm font-medium">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 border-t border-border pt-4">
                    <label className="block text-xs font-semibold tracking-luxe uppercase mb-2">Coupon code</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="w-full rounded-md border border-border bg-background py-2.5 pl-8 pr-3 text-sm uppercase outline-none focus:border-gold transition-colors"
                        />
                      </div>
                    </div>
                    {calc?.coupon ? (
                      <p className="mt-2 flex items-center gap-2 text-xs text-gold">
                        <span>Coupon “{calc.coupon.code}” applied — {calc.coupon.type === "percent" ? `${calc.coupon.value}% off` : `${formatPrice(calc.coupon.value)} off`}</span>
                        <button
                          type="button"
                          onClick={() => setCouponCode("")}
                          className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
                        >
                          Remove
                        </button>
                      </p>
                    ) : couponCode.trim().length >= 3 && preview.dataUpdatedAt > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">No valid coupon found.</p>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
                    <Row label="Subtotal" value={formatPrice(calc?.subtotal ?? subtotal)} />
                    {calc && calc.discount > 0 && <Row label="Discount" value={`−${formatPrice(calc.discount)}`} className="text-gold" />}
                    <Row label="Shipping" value={calc?.shippingCost ? formatPrice(calc.shippingCost) : "Free"} />
                    <Row label="Tax" value={formatPrice(calc?.tax ?? 0)} />
                    <div className="border-t border-border pt-3 flex items-baseline justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-2xl font-semibold">
                        {preview.isFetching ? "…" : formatPrice(calc?.total ?? 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrder.isPending}
                    className="press mt-5 w-full rounded-md bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {createOrder.isPending ? "Placing Order…" : "Place Order"}
                  </button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck size={13} className="text-gold" /> Secure checkout — 30-day returns guaranteed
                  </p>
                </aside>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
      />
    </label>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}
