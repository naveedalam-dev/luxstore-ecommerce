import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/storefront";

export default function SearchDropdown({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const debounced = useDebounce(query, 200);

  const { data, isLoading } = trpc.store.products.useQuery(
    { search: debounced, page: 1, pageSize: 5 },
    { enabled: debounced.trim().length >= 2 },
  );

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = data?.products ?? [];

  return (
    <div className="container animate-fade-in">
      <div className="relative pb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products, collections, tags…"
          className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-gold transition-colors"
        />
        {debounced.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            {isLoading && (
              <div className="p-6 text-center text-sm text-muted-foreground">Searching…</div>
            )}
            {!isLoading && results.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results for “{debounced}”
              </div>
            )}
            {!isLoading && results.length > 0 && (
              <ul>
                {results.map(p => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
                    >
                      {Array.isArray(p.images) && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-12 w-12 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPrice(p.price)}
                          {p.compareAtPrice ? (
                            <span className="ml-1.5 line-through opacity-60">{formatPrice(p.compareAtPrice)}</span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="border-t border-border">
                  <Link
                    href={`/catalog?q=${encodeURIComponent(debounced)}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gold hover:bg-accent transition-colors"
                  >
                    View all results
                    <ArrowRight size={15} />
                  </Link>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
