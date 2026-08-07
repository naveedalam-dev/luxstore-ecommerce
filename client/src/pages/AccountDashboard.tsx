import { useMemo } from "react";
import { Link } from "wouter";
import { ShoppingBag, Heart, MapPin, ChevronRight, Package } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AccountLayout } from "@/components/account/AccountLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

export default function AccountDashboard() {
  const { user } = useAuth();
  const { data: orders } = trpc.orders.myOrders.useQuery();

  const recent = useMemo(() => (orders ?? []).slice(0, 3), [orders]);
  const orderCount = orders?.length ?? 0;

  return (
    <AccountLayout>
      <div className="space-y-8">
        {/* Profile card */}
        <section className="rounded-xl border border-border bg-secondary/50 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 font-display text-xl font-semibold text-gold">
              {(user?.name ?? user?.email ?? "G")[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{user?.name ?? "Guest"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>Manage your shipping details at checkout for each order.</span>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/account/orders" className="group rounded-xl border border-border bg-secondary/50 p-5 transition-colors hover:border-gold">
            <div className="flex items-center justify-between">
              <ShoppingBag size={18} className="text-gold" />
              <ChevronRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Orders placed</p>
          </Link>
          <Link href="/account/wishlist" className="group rounded-xl border border-border bg-secondary/50 p-5 transition-colors hover:border-gold">
            <div className="flex items-center justify-between">
              <Heart size={18} className="text-gold" />
              <ChevronRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <WishlistCount />
            <p className="text-xs text-muted-foreground">Wishlist items</p>
          </Link>
        </section>

        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent Orders</h3>
            <Link href="/account/orders" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
              <Package size={26} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No orders yet. Your purchases will appear here.</p>
              <Link href="/catalog" className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(o => (
                <Link
                  key={o.id}
                  href={`/account/orders`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 transition-colors hover:border-gold"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold/10">
                    <Package size={16} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusClass(o.status)}`}>
                    {o.status}
                  </span>
                  <span className="hidden sm:block text-sm font-medium">{formatPrice(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AccountLayout>
  );
}

function WishlistCount() {
  const { data } = trpc.wishlist.list.useQuery();
  const count = data?.length ?? 0;
  return (
    <>
      <p className="mt-4 font-display text-2xl font-semibold">{count}</p>
    </>
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
