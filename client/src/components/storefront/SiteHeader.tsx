import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Search, ShoppingBag, Heart, User, Moon, Sun } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import SearchDropdown from "./SearchDropdown";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { itemCount, toggleCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { data: categories } = trpc.store.categories.useQuery();
  const [location] = useLocation();

  const categoriesNav = categories ?? [];

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs tracking-luxe uppercase py-2 px-4">
        Complimentary shipping on orders over $200 — Free returns within 30 days
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-4">
          {/* Mobile menu */}
          <button
            className="lg:hidden press p-2 -ml-2"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl md:text-3xl font-semibold tracking-wide">
              Luxe<span className="text-gold">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/catalog"
              className={`text-sm tracking-wide hover:text-gold transition-colors ${location.startsWith("/catalog") ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              Shop All
            </Link>
            {categoriesNav.slice(0, 4).map(c => (
              <Link
                key={c.id}
                href={`/catalog?categoryId=${c.id}`}
                className={`text-sm tracking-wide hover:text-gold transition-colors ${location.startsWith("/catalog") ? "text-muted-foreground" : "text-muted-foreground"}`}
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-sm tracking-wide text-muted-foreground hover:text-gold transition-colors"
            >
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              className="press p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Search"
            >
              <Search size={19} />
            </button>
            <button
              className="press p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Link
              href={isAuthenticated ? "/account/wishlist" : "/account"}
              className="press p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={19} />
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/account"}
              className="press p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Account"
            >
              <User size={19} />
            </Link>
            <button
              className="press relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleCart}
              aria-label="Cart"
            >
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && <SearchDropdown onClose={() => setSearchOpen(false)} />}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-background animate-fade-in">
            <nav className="container flex flex-col py-4 gap-1">
              <Link
                href="/catalog"
                className="py-2.5 text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Shop All
              </Link>
              {categoriesNav.map(c => (
                <Link
                  key={c.id}
                  href={`/catalog?categoryId=${c.id}`}
                  className="py-2.5 text-sm text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              <Link
                href="/admin"
                className="py-2.5 text-sm text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Admin Dashboard
              </Link>
              {!isAuthenticated && (
                <button
                  className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground press"
                  onClick={() => {
                    setMobileOpen(false);
                    startLogin();
                  }}
                >
                  Sign in
                </button>
              )}
              {isAuthenticated && (
                <Link
                  href="/account"
                  className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  My Account
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
