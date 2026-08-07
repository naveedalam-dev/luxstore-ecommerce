import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const newsletter = trpc.store.newsletter.useMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    newsletter.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          toast.success("You're on the list. Welcome to the house of Luxe.");
          setEmail("");
        },
        onError: () => toast.error("Something went wrong. Please try again."),
      },
    );
  };

  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="container py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 max-w-md">
          <div className="font-display text-3xl font-semibold mb-3">
            Luxe<span className="text-gold">.</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A curated house of refined essentials — apparel, timepieces, fragrances and
            handcrafted leather goods. Made to be cherished, built to endure.
          </p>
          <form onSubmit={submit} className="mt-6 flex gap-2 max-w-sm">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              disabled={newsletter.isPending}
              className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-luxe uppercase mb-4">Shop</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/catalog" className="hover:text-gold transition-colors">Shop All</Link></li>
            <li><Link href="/catalog?categoryId=1" className="hover:text-gold transition-colors">Apparel</Link></li>
            <li><Link href="/catalog?categoryId=2" className="hover:text-gold transition-colors">Watches & Jewelry</Link></li>
            <li><Link href="/catalog?categoryId=3" className="hover:text-gold transition-colors">Fragrance</Link></li>
            <li><Link href="/catalog?categoryId=4" className="hover:text-gold transition-colors">Leather Goods</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-luxe uppercase mb-4">House</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/account" className="hover:text-gold transition-colors">My Account</Link></li>
            <li><Link href="/admin" className="hover:text-gold transition-colors">Admin Dashboard</Link></li>
            <li className="text-muted-foreground/70">Shipping & Returns</li>
            <li className="text-muted-foreground/70">Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Luxe Store. All rights reserved.</span>
          <span className="tracking-luxe uppercase">Designed with intention</span>
        </div>
      </div>
    </footer>
  );
}
