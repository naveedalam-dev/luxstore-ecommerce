import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

export type CartItemView = {
  id: number;
  productId: number;
  quantity: number;
  size: string;
  color: string;
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    compareAtPrice: string | null;
    images: string[];
    stockBySize: Record<string, number>;
    sizes: string[];
    colors: { name: string; swatch: string }[];
  };
};

type CartContextType = {
  items: CartItemView[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (productId: number, quantity: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: cartRows, isLoading } = trpc.cart.list.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Enriched cart items: fetch products for each row
  const productIds = useMemo(
    () => Array.from(new Set((cartRows ?? []).map(r => r.productId))),
    [cartRows],
  );
  const productQueries = trpc.store.products.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: productIds.length > 0 },
  );
  const productsById = useMemo(() => {
    const map = new Map<number, NonNullable<typeof productQueries.data>["products"][number]>();
    for (const p of productQueries.data?.products ?? []) map.set(p.id, p);
    return map;
  }, [productQueries.data]);

  const toProduct = (p: { id: number; name: string; slug: string; price: string; compareAtPrice: string | null; images: unknown; stockBySize: unknown; sizes: unknown; colors: unknown } | undefined) => ({
    id: p?.id ?? 0,
    name: p?.name ?? "…",
    slug: p?.slug ?? "",
    price: p?.price ?? "0",
    compareAtPrice: p?.compareAtPrice ?? null,
    images: Array.isArray(p?.images) ? (p.images as string[]) : [],
    stockBySize: typeof p?.stockBySize === "object" && p?.stockBySize ? (p.stockBySize as Record<string, number>) : {},
    sizes: Array.isArray(p?.sizes) ? (p.sizes as string[]) : [],
    colors: Array.isArray(p?.colors) ? (p.colors as { name: string; swatch: string }[]) : [],
  });

  const items: CartItemView[] = useMemo(
    () =>
      (cartRows ?? []).map(row => ({
        id: row.id,
        productId: row.productId,
        quantity: row.quantity,
        size: row.size ?? "",
        color: row.color ?? "",
        product: toProduct(productsById.get(row.productId) ?? (undefined as never)),
      })),
    [cartRows, productsById],
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.product.price ?? 0) * i.quantity,
    0,
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(v => !v), []);

  const invalidate = useCallback(() => utils.cart.list.invalidate(), [utils]);

  const addMutation = trpc.cart.add.useMutation({ onSuccess: invalidate });
  const updateMutation = trpc.cart.update.useMutation({ onSuccess: invalidate });
  const removeMutation = trpc.cart.remove.useMutation({ onSuccess: invalidate });

  const addToCart = useCallback(
    async (productId: number, quantity: number, size?: string, color?: string) => {
      await addMutation.mutateAsync({ productId, quantity, size, color });
      setIsOpen(true);
    },
    [addMutation],
  );

  const updateQuantity = useCallback(
    async (id: number, quantity: number) => {
      if (quantity <= 0) {
        await removeMutation.mutateAsync({ id });
        return;
      }
      await updateMutation.mutateAsync({ id, quantity: Math.min(10, quantity) });
    },
    [updateMutation, removeMutation],
  );

  const removeItem = useCallback(
    async (id: number) => {
      await removeMutation.mutateAsync({ id });
    },
    [removeMutation],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading: isLoading,
        itemCount,
        subtotal,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
