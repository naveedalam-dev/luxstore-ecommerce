import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

type OrderItem = {
  id?: number;
  productId: number;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:number");
  const orderNumber = params?.number ?? "";
  const { data: order, isLoading } = trpc.orders.byNumber.useQuery({ orderNumber });
  const orderItems = useMemo<OrderItem[]>(
    () => {
      const raw = (order?.items as unknown) ?? null;
      if (Array.isArray(raw)) return raw as OrderItem[];
      if (typeof raw === "string") try { return JSON.parse(raw) as OrderItem[]; } catch { return []; }
      return [];
    },
    [order?.items],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-2xl py-16 md:py-24 text-center">
          <div className="animate-scale-in mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
            <CheckCircle2 size={34} className="text-gold" />
          </div>
          <h1 className="mt-6 font-display text-3xl md:text-4xl font-semibold">Order Confirmed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Thank you for your purchase. We have received your order and will begin processing it shortly.
          </p>

          {isLoading || order ? (
            <div className="mt-10 rounded-xl border border-border bg-secondary/50 p-6 text-left">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs tracking-luxe uppercase text-muted-foreground">Order Number</p>
                  <p className="mt-1 font-display font-semibold">{order?.orderNumber ?? orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-luxe uppercase text-muted-foreground">Total</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {isLoading ? "…" : formatPrice(order?.total ?? 0)}
                  </p>
                </div>
              </div>

              {!isLoading && order && (
                <>
                  <ul className="mt-4 space-y-3">
                    {orderItems.map(item => (
                      <li key={item.id} className="flex items-center gap-3">
                        <img src={item.image} alt={item.productName} className="h-14 w-12 rounded-md object-cover shrink-0" />
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.size && `Size ${item.size}`}
                            {item.color ? ` · ${item.color}` : ""}
                            {" · "}Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-gold/10 px-4 py-3 text-sm text-gold">
                    <Package size={15} />
                    Estimated delivery: {formatDateRange(order.createdAt)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="mt-6 text-xs text-muted-foreground">No order found.</p>
          )}

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/account/orders" className="press inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
              View My Orders <ArrowRight size={14} />
            </Link>
            <Link href="/catalog" className="press rounded-md border border-border px-6 py-3 text-sm hover:border-gold hover:text-gold transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDateRange(start: Date) {
  const from = new Date(start);
  from.setDate(from.getDate() + 3);
  const to = new Date(start);
  to.setDate(to.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}
