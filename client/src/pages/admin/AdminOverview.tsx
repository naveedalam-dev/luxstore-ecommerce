import { useEffect } from "react";
import { DollarSign, ShoppingBag, Users, AlertCircle, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9A227",
  confirmed: "#3B82F6",
  processing: "#8B5CF6",
  shipped: "#F59E0B",
  delivered: "#10B981",
  cancelled: "#94A3B8",
  refunded: "#EF4444",
};

const KPI_COLORS = ["#C9A227", "#8B5CF6", "#3B82F6", "#10B981"];

export default function AdminOverview() {
  const { data: analytics, isLoading } = trpc.admin.analytics.useQuery();

  useEffect(() => {
    document.title = "Overview — Luxe Admin";
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Store performance at a glance</p>
      </div>

      {isLoading || !analytics ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard icon={DollarSign} label="Total Revenue" value={formatPrice(analytics.totalRevenue)} color={KPI_COLORS[0]} />
            <KpiCard icon={ShoppingBag} label="Orders" value={String(analytics.totalOrders)} color={KPI_COLORS[1]} />
            <KpiCard icon={Users} label="Customers" value={String(analytics.totalCustomers)} color={KPI_COLORS[2]} />
            <KpiCard icon={AlertCircle} label="Pending Orders" value={String(analytics.pendingOrders)} color={KPI_COLORS[3]} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-5 xl:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={15} className="text-gold" /> Revenue (Last 30 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueByDay} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: unknown) => formatPrice(Number(v))} />
                    <Area type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-semibold">Orders by Status</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.statusBreakdown} dataKey="count" nameKey="status" innerRadius={50} outerRadius={75} paddingAngle={2}>
                      {analytics.statusBreakdown.map(row => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status] ?? "#94A3B8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                {analytics.statusBreakdown.map(row => (
                  <div key={row.status} className="flex items-center gap-1.5 capitalize">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[row.status] ?? "#94A3B8" }} />
                    <span className="text-muted-foreground">{row.status}</span>
                    <span className="ml-auto font-medium">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-semibold">Daily Orders</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.revenueByDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#C9A227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-semibold">Quick Insights</h3>
              <div className="space-y-4 text-sm">
                <InsightRow label="Average order value" value={formatPrice(analytics.avgOrderValue)} />
                <InsightRow label="Total customers" value={String(analytics.totalCustomers)} />
                <InsightRow label="Fulfilled orders" value={String(analytics.statusBreakdown.filter(s => s.status === "delivered").reduce((a, b) => a + b.count, 0))} />
                <InsightRow label="Needs attention (pending)" value={String(analytics.pendingOrders)} />
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
