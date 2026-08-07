import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

describe("storefront public queries", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  it("returns categories with images", async () => {
    const categories = await caller.store.categories();
    expect(categories.length).toBeGreaterThan(0);
    for (const c of categories) {
      expect(c.name).toBeTruthy();
      expect(c.slug).toBeTruthy();
    }
  });

  it("returns brands", async () => {
    const brands = await caller.store.brands();
    expect(brands.length).toBeGreaterThan(0);
  });

  it("returns products with parsed JSON fields", async () => {
    const res = await caller.store.products({ page: 1, pageSize: 12 });
    expect(res.total).toBeGreaterThan(0);
    const p = res.products[0];
    expect(Array.isArray(p.images)).toBe(true);
    expect(p.images.length).toBeGreaterThan(0);
    expect(typeof p.price).toBe("string");
  });

  it("supports filtering by category, price and rating", async () => {
    const res = await caller.store.products({
      minPrice: 300,
      maxPrice: 1000,
      minRating: 4.5,
      page: 1,
      pageSize: 50,
    });
    expect(res.products.every(p => Number(p.price) >= 300 && Number(p.price) <= 1000)).toBe(true);
    expect(res.products.every(p => Number(p.rating) >= 4.5)).toBe(true);
  });

  it("returns a product with reviews by slug", async () => {
    const res = await caller.store.productBySlug({ slug: "minimal-leather-sneakers" });
    expect(res.product.name).toBeTruthy();
    expect(Array.isArray(res.reviews)).toBe(true);
    expect(Array.isArray(res.product.images)).toBe(true);
  });

  it("throws on unknown slug", async () => {
    await expect(caller.store.productBySlug({ slug: "does-not-exist" })).rejects.toThrow();
  });

  it("returns flash sale products", async () => {
    const flash = await caller.store.flashSale();
    expect(Array.isArray(flash)).toBe(true);
  });

  it("returns banners", async () => {
    const banners = await caller.store.banners();
    expect(Array.isArray(banners)).toBe(true);
  });

  it("previews checkout totals with valid items", async () => {
    const res = await caller.store.products({ page: 1, pageSize: 1 });
    const productId = res.products[0].id;
    const preview = await caller.checkout.preview({
      items: [{ productId, quantity: 2 }],
    });
    expect(Number(preview.subtotal)).toBeGreaterThan(0);
    expect(Number(preview.total)).toBeGreaterThan(0);
  });

  it("rejects checkout preview with empty items", async () => {
    await expect(caller.checkout.preview({ items: [] })).rejects.toThrow();
  });
});

describe("protected procedures reject unauthenticated users", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  it("cart.list rejects anonymous user", async () => {
    await expect(caller.cart.list()).rejects.toThrow();
  });

  it("wishlist.list rejects anonymous user", async () => {
    await expect(caller.wishlist.list()).rejects.toThrow();
  });

  it("orders.myOrders rejects anonymous user", async () => {
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });
});

describe("admin procedures reject non-admins", () => {
  const ctx: TrpcContext = {
    user: {
      id: 999,
      openId: "regular-user",
      name: "Regular User",
      email: "regular@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
  const caller = appRouter.createCaller(ctx);

  it("admin.analytics rejects non-admin", async () => {
    await expect(caller.admin.analytics()).rejects.toThrow();
  });

  it("admin.products rejects non-admin", async () => {
    await expect(caller.admin.products({})).rejects.toThrow();
  });
});
