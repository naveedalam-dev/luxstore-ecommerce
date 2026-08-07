import { useState } from "react";
import { Package, X, Truck, CheckCircle2 } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

type OrderItem = {
  productId: number;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

type OrderRow = {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: Date;
  items: unknown;
  shippingAddress: unknown;
  customerName: string;
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function MyOrders() {
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const parseItems = (raw: unknown): OrderItem[] => {
    if (Array.isArray(raw)) return raw as OrderItem[];
    if (typeof raw === "string") try { return JSON.parse(raw); } catch { return []; }
    return [];
  };

  const parseAddress = (raw: unknown): Record<string, string> | null => {
    if (raw && typeof raw === "object") return raw as Record<string, string>;
    if (typeof raw === "string") try { return JSON.parse(raw); } catch { return null; }
    return null;
  };

  return (
    <AccountLayout>
      <h2 className="font-display text-2xl font-semibold mb-6">Order History</h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Package size={30} className="text-muted-foreground/50" />
          <p className="font-display text-lg font-semibold">No orders yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Once you place your first order, its progress will be tracked right here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const items = parseItems(o.items);
            return (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="press w-full rounded-xl border border-border bg-secondary/50 px-4 py-4 text-left transition-colors hover:border-gold"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold/10">
                    <Package size={16} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(o.status)}`}>
                    {o.status}
                  </span>
                  <span className="font-display font-semibold">{formatPrice(o.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Order detail dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setSelected(null)} />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background shadow-2xl animate-scale-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <h3 className="font-display text-lg font-semibold">{selected.orderNumber}</h3>
              <button className="press p-1.5 text-muted-foreground" onClick={() => setSelected(null)} aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-gold" />
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-5 flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const reached = STATUS_STEPS.indexOf(selected.status) >= i;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${reached ? "border-gold bg-gold text-background" : "border-border text-muted-foreground"}`}
                      >
                        {reached ? <CheckCircle2 size={14} /> : <span className="text-[10px]">{i + 1}</span>}
                      </div>
                      <span className="text-[10px] capitalize text-muted-foreground">{step}</span>
                    </div>
                  );
                })}
              </div>

              <ul className="mt-6 space-y-3 border-t border-border pt-5">
                {parseItems(selected.items).map(item => (
                  <li key={item.productId} className="flex items-center gap-3">
                    <img src={item.image} alt={item.productName} className="h-14 w-12 rounded-md object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">{item.productName}</p>
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

              {selected.customerName && (
                <div className="mt-5 rounded-md bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Shipping to {selected.customerName}</p>
                  {(() => {
                    const addr = parseAddress(selected.shippingAddress);
                    if (!addr) return null;
                    return (
                      <p className="mt-0.5">
                        {[addr.address, addr.apartment, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Total paid</span>
                <span className="font-display text-xl font-semibold">{formatPrice(selected.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
    case "confirmed":
      return "bg-gold/10 text-gold";
    case "processing":
    case "shipped":
      return "bg-primary/10 text-primary";
    case "delivered":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}
