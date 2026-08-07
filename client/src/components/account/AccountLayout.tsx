import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { User, ShoppingBag, Heart, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/storefront/SiteHeader";
import SiteFooter from "@/components/storefront/SiteFooter";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const nav = [
    { href: "/account", icon: User, label: "Profile" },
    { href: "/account/orders", icon: ShoppingBag, label: "My Orders" },
    { href: "/account/wishlist", icon: Heart, label: "Wishlist" },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const isActive = (href: string) =>
    href === "/account" ? location === "/account" : location.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-semibold">My Account</h1>
            <button
              className="press lg:hidden inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
            <nav
              className={`space-y-1 transition-all duration-300 lg:block ${mobileNavOpen ? "block animate-fade-in" : "hidden"}`}
            >
              {nav.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm transition-colors ${isActive(n.href) ? "bg-gold/10 text-gold font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <n.icon size={15} />
                  {n.label}
                </Link>
              ))}
              <button
                onClick={() => logout().then(() => navigate("/"))}
                className="press mt-3 flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </nav>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
