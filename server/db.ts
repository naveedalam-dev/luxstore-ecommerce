import { and, asc, desc, eq, gte, inArray, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  Address,
  Banner,
  Brand,
  Category,
  Coupon,
  InsertUser,
  OrderItem,
  Product,
  ProductStockBySize,
  Review,
  User,
  activityLogs,
  banners,
  brands,
  carts,
  categories,
  coupons,
  newsletterSubscribers,
  orders,
  products,
  reviews,
  users,
  wishlists,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---------------------------------------------------------------------------
// Categories & brands
// ---------------------------------------------------------------------------
export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function listBrands() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function upsertCategory(c: Omit<Category, "id" | "createdAt"> & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (c.id) {
    await db.update(categories).set(c).where(eq(categories.id, c.id));
    return c.id;
  }
  const result = await db.insert(categories).values(c);
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(categories).where(eq(categories.id, id));
}

export async function upsertBrand(b: Omit<Brand, "id" | "createdAt"> & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (b.id) {
    await db.update(brands).set(b).where(eq(brands.id, b.id));
    return b.id;
  }
  const result = await db.insert(brands).values(b);
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function deleteBrand(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(brands).where(eq(brands.id, id));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export type ProductFilter = {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  minRating?: number;
  inStock?: boolean;
  sortBy?: "featured" | "price_asc" | "price_desc" | "newest" | "rating" | "name";
  page?: number;
  pageSize?: number;
};

const NUM = (v: unknown) => (v === undefined ? undefined : Number(v));
const STR_ARR = (v: unknown) =>
  Array.isArray(v) && v.length > 0 ? (v as string[]).map(String) : undefined;

export async function listProducts(filter: ProductFilter = {}) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 12));

  const conditions = [];
  if (filter.search) {
    conditions.push(
      or(
        like(products.name, `%${filter.search}%`),
        like(products.tags, `%${filter.search}%`),
        like(products.description, `%${filter.search}%`),
      ),
    );
  }
  if (filter.categoryId) conditions.push(eq(products.categoryId, filter.categoryId));
  if (filter.brandId) conditions.push(eq(products.brandId, filter.brandId));
  if (filter.minPrice !== undefined) conditions.push(sqlGte(products.price, String(filter.minPrice)));
  if (filter.maxPrice !== undefined) conditions.push(sqlLte(products.price, String(filter.maxPrice)));
  if (filter.minRating) conditions.push(sqlGte(products.rating, String(filter.minRating)));

  let orderBy = desc(products.sortOrder);
  switch (filter.sortBy) {
    case "price_asc":
      orderBy = asc(products.price);
      break;
    case "price_desc":
      orderBy = desc(products.price);
      break;
    case "newest":
      orderBy = desc(products.createdAt);
      break;
    case "rating":
      orderBy = desc(products.rating);
      break;
    case "name":
      orderBy = asc(products.name);
      break;
    default:
      orderBy = desc(products.sortOrder);
      break;
  }

  // Color / size / stock filters need JSON inspection — apply in post-filter via SQL expressions
  let query = db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  let rows: Product[] = await query.orderBy(orderBy);

  if (filter.colors?.length) {
    const cNames = filter.colors;
    rows = rows.filter(p => {
      const colors = p.colors as unknown[];
      return (Array.isArray(colors) ? colors : []).some((c: unknown) =>
        cNames.some(n => String((c as { name?: string }).name).toLowerCase().includes(n.toLowerCase())),
      );
    });
  }
  if (filter.sizes?.length) {
    rows = rows.filter(p => {
      const sizes = p.sizes as unknown[];
      return (Array.isArray(sizes) ? sizes : []).some(s => filter.sizes!.includes(String(s)));
    });
  }
  if (filter.inStock) {
    rows = rows.filter(p => {
      const stock = p.stockBySize as Record<string, number>;
      return Object.values(stock ?? {}).some(v => typeof v === "number" && v > 0);
    });
  }

  const total = rows.length;
  const offset = (page - 1) * pageSize;
  rows = rows.slice(offset, offset + pageSize);

  return { products: rows, total };
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0];
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

export async function upsertProduct(
  p: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: number },
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { id, ...rest } = p;
  if (id) {
    await db.update(products).set(rest).where(eq(products.id, id));
    return id;
  }
  const result = await db.insert(products).values(rest);
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(products).where(eq(products.id, id));
}

export async function getFlashSaleProducts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isFlashSale, true), sqlGt(products.flashSaleEndsAt, new Date())));
}

function sqlGt(col: typeof products.flashSaleEndsAt, value: Date) {
  return sql`${col} > ${value.toISOString()}`;
}
function sqlLte(col: typeof products.price, value: string) {
  return sql`${col} <= ${Number(value)}`;
}
function sqlGte(col: typeof products.price | typeof products.rating, value: string) {
  return sql`${col} >= ${Number(value)}`;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export async function listReviewsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(r: {
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title?: string;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reviews).values(r);
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export async function listCart(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(carts).where(eq(carts.userId, userId));
}

export async function addToCart(item: {
  userId: number;
  productId: number;
  quantity: number;
  size?: string;
  color?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select()
    .from(carts)
    .where(
      and(
        eq(carts.userId, item.userId),
        eq(carts.productId, item.productId),
        eq(carts.size, item.size ?? ""),
        eq(carts.color, item.color ?? ""),
      ),
    );
  if (existing.length > 0) {
    const row = existing[0];
    await db
      .update(carts)
      .set({ quantity: row.quantity + item.quantity })
      .where(eq(carts.id, row.id));
    return row.id;
  }
  const result = await db.insert(carts).values(item);
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function updateCartItem(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (quantity <= 0) {
    await db.delete(carts).where(eq(carts.id, id));
    return;
  }
  await db.update(carts).set({ quantity }).where(eq(carts.id, id));
}

export async function removeCartItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(carts).where(eq(carts.id, id));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(carts).where(eq(carts.userId, userId));
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export async function listWishlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wishlists).where(eq(wishlists.userId, userId));
}

export async function toggleWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
  if (existing.length > 0) {
    await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
    return false;
  }
  await db.insert(wishlists).values({ userId, productId });
  return true;
}

export async function isWishlisted(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export async function findCoupon(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  return rows[0];
}

export async function listCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function upsertCoupon(c: Omit<Coupon, "id" | "createdAt"> & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const code = c.code.toUpperCase();
  if (c.id) {
    await db.update(coupons).set({ ...c, code }).where(eq(coupons.id, c.id));
    return c.id;
  }
  const result = await db
    .insert(coupons)
    .values({ ...c, code, value: String(c.value), minOrder: c.minOrder ? String(c.minOrder) : null });
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(coupons).where(eq(coupons.id, id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function createOrder(o: {
  userId: number;
  customerName: string;
  customerEmail?: string;
  shippingAddress: Address;
  status: "pending";
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  items: OrderItem[];
  notes?: string;
  orderNumber: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(orders).values({
    ...o,
    subtotal: String(o.subtotal),
    discount: String(o.discount),
    shippingCost: String(o.shippingCost),
    tax: String(o.tax),
    total: String(o.total),
    items: JSON.stringify(o.items),
    shippingAddress: JSON.stringify(o.shippingAddress),
    customerEmail: o.customerEmail ?? null,
    couponCode: o.couponCode ?? null,
    notes: o.notes ?? null,
  });
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return rows[0];
}

export async function listOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function listOrders(page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const offset = (page - 1) * pageSize;
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset);
  const total = await db.select({ count: sql<number>`count(*)` }).from(orders);
  return { orders: rows, total: Number(total[0]?.count ?? 0) };
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
export async function listBanners() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder));
}

export async function listAllBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(asc(banners.sortOrder));
}

export async function upsertBanner(b: Omit<Banner, "id" | "createdAt"> & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (b.id) {
    await db.update(banners).set(b).where(eq(banners.id, b.id));
    return b.id;
  }
  const result = await db.insert(banners).values(b);
  return Number((result as unknown as [{ insertId: number }])[0].insertId);
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(banners).where(eq(banners.id, id));
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(newsletterSubscribers)
    .values({ email: email.toLowerCase() })
    .onDuplicateKeyUpdate({ set: { email: email.toLowerCase() } });
}

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------
export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function setUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
export async function logActivity(userId: number, action: string, detail?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values({ userId, action, detail });
}

// ---------------------------------------------------------------------------
// Analytics (admin)
// ---------------------------------------------------------------------------
export type AnalyticsSummary = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  pendingOrders: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number }[];
};

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database unavailable");
  }

  const revenueRows = await db
    .select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(sql`${orders.status} NOT IN ('cancelled','refunded')`);
  const totalRevenue = Number(revenueRows[0]?.total ?? 0);

  const orderCountRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.status} NOT IN ('cancelled','refunded')`);
  const totalOrders = Number(orderCountRows[0]?.count ?? 0);

  const customerRows = await db.select({ count: sql<number>`count(*)` }).from(users);
  const totalCustomers = Number(customerRows[0]?.count ?? 0);

  const pendingRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "pending"));
  const pendingOrders = Number(pendingRows[0]?.count ?? 0);

  const last30 = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`)
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(asc(sql`DATE(${orders.createdAt})`));

  const statusRows = await db
    .select({ status: orders.status, count: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status);

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
    pendingOrders,
    revenueByDay: last30.map(r => ({
      date: String(r.date),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
    statusBreakdown: statusRows.map(r => ({ status: r.status, count: Number(r.count) })),
  };
}

// ---------------------------------------------------------------------------
// Shared helpers (used by routers)
// ---------------------------------------------------------------------------
export function calcDiscount(
  coupon: { type: string; value: number | string } | undefined | null,
  subtotal: number,
): number {
  if (!coupon) return 0;
  const v = Number(coupon.value);
  if (Number.isNaN(v)) return 0;
  if (coupon.type === "percent") return Math.round((subtotal * v) / 100 * 100) / 100;
  return Math.min(v, subtotal);
}

export function calcOrder(subtotal: number, coupon?: { type: string; value: number | string } | null) {
  const discount = calcDiscount(coupon ?? null, subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingCost = afterDiscount >= 200 ? 0 : 15;
  const tax = Math.round(afterDiscount * 0.08 * 100) / 100;
  const total = Math.round((afterDiscount + shippingCost + tax) * 100) / 100;
  return { subtotal, discount, shippingCost, tax, total };
}

export function stockBySizeFor(size: string | undefined, stockBySize: Record<string, number> | undefined): number {
  if (!size || !stockBySize) return 0;
  return typeof stockBySize[size] === "number" ? (stockBySize[size] as number) : 0;
}

export function totalStock(stockBySize: Record<string, number>): number {
  return Object.values(stockBySize ?? {}).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
}

export function generateOrderNumber(): string {
  return `LX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export type { User, OrderItem, ProductStockBySize, Address };
