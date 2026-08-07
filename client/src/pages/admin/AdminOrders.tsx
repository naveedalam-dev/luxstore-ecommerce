import { useEffect, useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

type OrderRow = {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string | null;
  status: string;
  total: string;
  paymentMethod: string;
  createdAt: Date;
  shippingAddress: unknown;
  couponCode: string | null;
};

export default function AdminOrders() {
  const { data, isLoading, refetch } = trpc.admin.orders.useQuery();
  const { data: categories } = trpc.admin.categories.useQuery();
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "Orders — Luxe Admin";
  }, []);

  const orders = (data?.orders ?? []) as OrderRow[];
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} orders total</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`press rounded-full px-3.5 py-1.5 text-xs capitalize transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-gold hover:text-foreground"}`}
          >
            {s}
            {s !== "all" && (
              <span className="ml-1.5 opacity-60">{orders.filter(o => o.status === s).length}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Package size={30} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No orders {filter === "all" ? "yet" : `with status "${filter}"`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <OrderCard key={o.id} order={o} onDone={() => refetch()} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function OrderCard({ order, onDone }: { order: OrderRow; onDone: () => void }) {
  const updateStatus = trpc.admin.updateOrderStatus.useMutation();
  const [expanded, setExpanded] = useState(false);
  const statusesLeft = STATUSES.filter(s => s !== order.status);

  const addr = (() => {
    const raw = order.shippingAddress;
    if (raw && typeof raw === "object") return raw as Record<string, string>;
    if (typeof raw === "string") try { return JSON.parse(raw); } catch { return null; }
    return null;
  })();

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gold/10 shrink-0">
          <Package size={15} className="text-gold" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {order.customerName} · {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(order.status)}`}>
          {order.status}
        </span>
        <span className="font-display font-semibold">{formatPrice(order.total)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="press inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:border-gold hover:text-gold transition-colors">
            Change status <ChevronDown size={12} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusesLeft.map(s => (
              <DropdownMenuItem
                key={s}
                onClick={() => updateStatus.mutate({ id: order.id, status: s as never }, { onSuccess: () => { toast.success(`Order marked as ${s}`); onDone(); }, onError: () => toast.error("Could not update") })}
                className="capitalize"
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && addr && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Shipping to {[addr.address, addr.apartment, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")} · {order.paymentMethod}
        </div>
      )}
      <button
        onClick={() => setExpanded(v => !v)}
        className="border-t border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? "Hide details" : "Show shipping details"}
      </button>
    </div>
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
    case "cancelled":
    case "refunded":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
