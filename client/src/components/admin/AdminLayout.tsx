import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, Tag, Image, Users, Menu, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import NotFound from "@/pages/NotFound";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  { href: "/admin/banners", icon: Image, label: "Banners" },
  { href: "/admin/users", icon: Users, label: "Users" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = "Admin — Luxe Store";
  }, []);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated || user?.role !== "admin") return <NotFound />;

  const isActive = (href: string) => (href === "/admin" ? location === "/admin" : location.startsWith(href));

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <button
            className="press lg:hidden p-2 -ml-2 text-muted-foreground"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link href="/" className="flex items-center gap-2.5 text-sm">
            <ArrowLeft size={14} className="text-muted-foreground" />
            <span className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">Back to store</span>
          </Link>
          <div className="flex-1" />
          <span className="font-display font-semibold text-sm">Luxe Admin</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 font-display text-sm font-semibold text-gold">
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 border-r border-border p-3 min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${isActive(n.href) ? "bg-gold/10 text-gold font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <n.icon size={15} />
              {n.label}
            </Link>
          ))}
        </aside>

        {/* Sidebar (mobile overlay) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
            <nav className="absolute left-0 top-14 h-[calc(100vh-3.5rem)] w-64 space-y-1 overflow-y-auto bg-background p-3 shadow-xl animate-slide-in-right">
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${isActive(n.href) ? "bg-gold/10 text-gold font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <n.icon size={15} />
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
