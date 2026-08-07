import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addToCart,
  calcDiscount,
  calcOrder,
  clearCart,
  createOrder,
  createReview,
  deleteBrand,
  deleteCategory,
  deleteCoupon,
  deleteProduct,
  findCoupon,
  deleteBanner,
  generateOrderNumber,
  getAnalytics,
  getFlashSaleProducts,
  getOrderByNumber,
  getOrderById,
  listAllBanners,
  listBrands,
  listBanners,
  listCart,
  listCategories,
  listCoupons,
  listOrders,
  listOrdersByUser,
  listProducts,
  listReviewsByProduct,
  listUsers,
  listWishlist,
  logActivity,
  removeCartItem,
  setUserRole,
  stockBySizeFor,
  subscribeNewsletter,
  toggleWishlist,
  totalStock,
  updateCartItem,
  updateOrderStatus,
  upsertBanner,
  upsertBrand,
  upsertCategory,
  upsertCoupon,
  upsertProduct,
  upsertUser,
} from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next();
});

const productFilters = z.object({
  search: z.string().optional(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  minRating: z.number().optional(),
  inStock: z.boolean().optional(),
  sortBy: z
    .enum(["featured", "price_asc", "price_desc", "newest", "rating", "name"])
    .default("featured"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(12),
});

const createOrderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().int().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .min(1),
  customerName: z.string().min(1).max(128),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    address: z.string().min(1),
    apartment: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.string().default("card"),
  notes: z.string().optional(),
});

const addressShape = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  apartment: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
});

const stockBySizeSchema = z.record(z.string(), z.number().int().min(0));
const colorSchema = z.object({ name: z.string().min(1), swatch: z.string().min(1) });
const tagsSchema = z.array(z.string());

const productInputBaseSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().min(1),
  categoryId: z.number().int().min(1),
  brandId: z.number().int().min(1),
  images: z.array(z.string().min(1)).min(1),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable(),
  stockBySize: stockBySizeSchema,
  colors: z.array(colorSchema).min(1),
  sizes: z.array(z.string().min(1)).min(1),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSaleEndsAt: z.date().nullable(),
  tags: tagsSchema,
  sortOrder: z.number().int().default(0),
});

const productInputSchema = productInputBaseSchema.transform(input => ({
  ...input,
  rating: String(input.rating),
  price: String(input.price),
  compareAtPrice: input.compareAtPrice === null ? null : String(input.compareAtPrice),
  images: JSON.stringify(input.images),
  stockBySize: JSON.stringify(input.stockBySize),
  colors: JSON.stringify(input.colors),
  sizes: JSON.stringify(input.sizes),
  tags: JSON.stringify(input.tags),
  flashSaleEndsAt: input.flashSaleEndsAt,
}));

const productUpdateSchema = productInputBaseSchema
  .extend({ id: z.number() })
  .transform(input => {
    const { id, ...rest } = input;
    return {
      id,
      ...rest,
      rating: String(rest.rating),
      price: String(rest.price),
      compareAtPrice: rest.compareAtPrice === null ? null : String(rest.compareAtPrice),
      images: JSON.stringify(rest.images),
      stockBySize: JSON.stringify(rest.stockBySize),
      colors: JSON.stringify(rest.colors),
      sizes: JSON.stringify(rest.sizes),
      tags: JSON.stringify(rest.tags),
      flashSaleEndsAt: rest.flashSaleEndsAt,
    };
  });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  store: router({
    categories: publicProcedure.query(() => listCategories()),
    brands: publicProcedure.query(() => listBrands()),
    banners: publicProcedure.query(() => listBanners()),
    products: publicProcedure.input(productFilters).query(({ input }) => listProducts(input)),
    productBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await import("./db").then(m => m.getProductBySlug(input.slug));
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        const reviews = await listReviewsByProduct(product.id);
        return { product, reviews };
      }),
    flashSale: publicProcedure.query(() => getFlashSaleProducts()),
    relatedProducts: publicProcedure
      .input(z.object({ productId: z.number(), categoryId: z.number(), limit: z.number().default(4) }))
      .query(async ({ input }) => {
        const { products } = await listProducts({
          categoryId: input.categoryId,
          sortBy: "rating",
          pageSize: input.limit + 2,
        });
        return products.filter(p => p.id !== input.productId).slice(0, input.limit);
      }),
    reviews: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => listReviewsByProduct(input.productId)),
    addReview: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          rating: z.number().int().min(1).max(5),
          title: z.string().max(255).optional(),
          body: z.string().min(1).max(2000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await createReview({
          productId: input.productId,
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Member",
          rating: input.rating,
          title: input.title,
          body: input.body,
        });
        await logActivity(ctx.user.id, "review.created", `Product ${input.productId}`);
        return { success: true } as const;
      }),
    newsletter: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await subscribeNewsletter(input.email);
        return { success: true } as const;
      }),
  }),

  cart: router({
    list: protectedProcedure.query(({ ctx }) => listCart(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().int().min(1).max(10),
          size: z.string().optional(),
          color: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await addToCart({ ...input, userId: ctx.user.id });
        return { success: true } as const;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().int().min(0).max(10) }))
      .mutation(async ({ input }) => {
        await updateCartItem(input.id, input.quantity);
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeCartItem(input.id);
        return { success: true } as const;
      }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true } as const;
    }),
  }),

  checkout: router({
    preview: publicProcedure
      .input(
        z.object({
          items: z.array(
            z.object({ productId: z.number(), quantity: z.number() }),
          ).min(1),
          couponCode: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        let subtotal = 0;
        for (const item of input.items) {
          const product = await import("./db").then(m => m.getProductById(item.productId));
          if (!product) throw new TRPCError({ code: "NOT_FOUND" });
          subtotal += Number(product.price) * item.quantity;
        }
        let coupon = input.couponCode ? await findCoupon(input.couponCode) : undefined;
        if (coupon) {
          if (!coupon.isActive) coupon = undefined;
          else if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) coupon = undefined;
          else if (coupon.minOrder && subtotal < Number(coupon.minOrder)) coupon = undefined;
        }
        return { coupon, ...calcOrder(subtotal, coupon ?? null) };
      }),
    create: protectedProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
      // Build items with product data
      const items = [];
      let subtotal = 0;
      for (const item of input.items) {
        const product = await import("./db").then(m => m.getProductById(item.productId));
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
        const price = Number(product.price);
        const stock = stockBySizeFor(item.size, product.stockBySize as Record<string, number>);
        const totalStockN = totalStock(product.stockBySize as Record<string, number>);
        if (totalStockN <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} is out of stock` });
        }
        if (item.size && stock <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${product.name} in size ${item.size} is out of stock`,
          });
        }
        const images = product.images as string[];
        items.push({
          productId: product.id,
          productName: product.name,
          image: images[0] ?? "",
          price,
          quantity: item.quantity,
          size: item.size ?? "",
          color: item.color ?? "",
        });
        subtotal += price * item.quantity;
      }

      let coupon = input.couponCode ? await findCoupon(input.couponCode) : undefined;
      if (coupon) {
        if (!coupon.isActive) coupon = undefined;
        else if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) coupon = undefined;
        else if (coupon.minOrder && subtotal < Number(coupon.minOrder)) coupon = undefined;
      }

      const discount = calcDiscount(coupon ?? null, subtotal);
      const calc = { ...calcOrder(subtotal, coupon ?? null), subtotal };

      const orderNumber = generateOrderNumber();
      const orderId = await createOrder({
        userId: ctx.user.id,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail || undefined,
        shippingAddress: input.shippingAddress as import("../drizzle/schema").Address,
        status: "pending",
        subtotal: calc.subtotal,
        discount: calc.discount,
        shippingCost: calc.shippingCost,
        tax: calc.tax,
        total: calc.total,
        couponCode: coupon ? coupon.code : undefined,
        paymentMethod: input.paymentMethod,
        items,
        notes: input.notes,
      });

      // Reduce stock
      for (const item of input.items) {
        const product = await import("./db").then(m => m.getProductById(item.productId));
        if (!product || !item.size) continue;
        const stockBySize = product.stockBySize as Record<string, number>;
        if (stockBySize[item.size] !== undefined) {
          stockBySize[item.size] = Math.max(0, stockBySize[item.size] - item.quantity);
          await upsertProduct({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            brandId: product.brandId,
            images: product.images,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stockBySize,
            colors: product.colors,
            sizes: product.sizes,
            rating: product.rating,
            reviewCount: product.reviewCount,
            isFeatured: product.isFeatured,
            isFlashSale: product.isFlashSale,
            flashSaleEndsAt: product.flashSaleEndsAt,
            tags: product.tags,
            sortOrder: product.sortOrder,
          });
        }
      }

      // Clear cart
      await clearCart(ctx.user.id);

      await logActivity(ctx.user.id, "order.created", `Order ${orderNumber}`);

      return { orderId, orderNumber, total: calc.total } as const;
    }),
    myOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return order;
      }),
  }),

  orders: router({
    myOrders: protectedProcedure.query(({ ctx }) => listOrdersByUser(ctx.user.id)),
    byNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => getOrderByNumber(input.orderNumber)),
  }),

  wishlist: router({
    list: protectedProcedure.query(({ ctx }) => listWishlist(ctx.user.id)),
    toggle: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => toggleWishlist(ctx.user.id, input.productId)),
  }),

  admin: router({
    analytics: adminProcedure.query(() => getAnalytics()),
    products: adminProcedure
      .input(productFilters.omit({ page: true, pageSize: true }).partial())
      .query(({ input }) => listProducts({ ...input, page: 1, pageSize: 100 })),
    createProduct: adminProcedure.input(productInputSchema).mutation(async ({ ctx, input }) => {
      const id = await upsertProduct(input);
      await logActivity(ctx.user.id, "product.created", input.name);
      return { id } as const;
    }),
    updateProduct: adminProcedure
      .input(productUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...rest } = input;
        await upsertProduct({ ...rest, id });
        await logActivity(ctx.user.id, "product.updated", input.name);
        return { success: true } as const;
      }),
    deleteProduct: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProduct(input.id);
        await logActivity(ctx.user.id, "product.deleted", `Product ${input.id}`);
        return { success: true } as const;
      }),
    deleteBanner: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBanner(input.id);
        await logActivity(ctx.user.id, "banner.deleted", `Banner ${input.id}`);
        return { success: true } as const;
      }),
    categories: adminProcedure.query(() => listCategories()),
    upsertCategory: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          image: z.string().optional(),
          sortOrder: z.number().default(0),
        }),
      )
      .mutation(({ input }) =>
        upsertCategory({
          ...input,
          description: input.description ?? null,
          image: input.image ?? null,
        }),
      ),
    deleteCategory: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCategory(input.id)),
    brands: adminProcedure.query(() => listBrands()),
    upsertBrand: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          logo: z.string().optional(),
        }),
      )
      .mutation(({ input }) =>
        upsertBrand({
          ...input,
          description: input.description ?? null,
          logo: input.logo ?? null,
        }),
      ),
    deleteBrand: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteBrand(input.id)),
    orders: adminProcedure
      .input(z.object({ page: z.number().int().min(1).default(1) }).optional())
      .query(({ input }) => listOrders(input?.page ?? 1)),
    updateOrderStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await updateOrderStatus(input.id, input.status);
        await logActivity(ctx.user.id, "order.status.updated", `Order ${input.id} → ${input.status}`);
        return { success: true } as const;
      }),
    coupons: adminProcedure.query(() => listCoupons()),
    upsertCoupon: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          code: z.string().min(1).max(32),
          description: z.string().optional(),
          type: z.enum(["percent", "fixed"]),
          value: z.number().min(0),
          minOrder: z.number().min(0).optional(),
          isActive: z.boolean().default(true),
          expiresAt: z.date().optional(),
        }),
      )
      .mutation(({ input }) =>
        upsertCoupon({
          ...input,
          value: String(input.value),
          minOrder: input.minOrder !== undefined ? String(input.minOrder) : null,
          description: input.description ?? null,
          expiresAt: input.expiresAt ?? null,
        }),
      ),
    deleteCoupon: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCoupon(input.id)),
    banners: adminProcedure.query(() => listAllBanners()),
    upsertBanner: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          title: z.string().min(1),
          subtitle: z.string().optional(),
          image: z.string().min(1),
          ctaText: z.string().optional(),
          ctaHref: z.string().optional(),
          kind: z.enum(["hero", "promo"]),
          isActive: z.boolean().default(true),
          sortOrder: z.number().default(0),
        }),
      )
      .mutation(({ input }) =>
        upsertBanner({
          ...input,
          subtitle: input.subtitle ?? null,
          ctaText: input.ctaText ?? null,
          ctaHref: input.ctaHref ?? null,
        }),
      ),
    users: adminProcedure.query(() => listUsers()),
    setUserRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(({ input }) => setUserRole(input.id, input.role)),
  }),
});

function parseJsonField(v: unknown): unknown {
  if (v === undefined || v === null) return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

const _productInputSchemaOld = z
  .object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().min(1),
    categoryId: z.number().int().min(1),
    brandId: z.number().int().min(1),
    images: z.array(z.string().min(1)).min(1),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).nullable(),
    stockBySize: stockBySizeSchema,
    colors: z.array(colorSchema).min(1),
    sizes: z.array(z.string().min(1)).min(1),
    rating: z.number().min(0).max(5).default(0),
    reviewCount: z.number().int().min(0).default(0),
    isFeatured: z.boolean().default(false),
    isFlashSale: z.boolean().default(false),
    flashSaleEndsAt: z.date().nullable(),
    tags: tagsSchema,
    sortOrder: z.number().int().default(0),
  })
  .transform(input => ({
    ...input,
    price: String(input.price),
    compareAtPrice: input.compareAtPrice === null ? null : String(input.compareAtPrice),
    images: JSON.stringify(input.images),
    stockBySize: JSON.stringify(input.stockBySize),
    colors: JSON.stringify(input.colors),
    sizes: JSON.stringify(input.sizes),
    tags: JSON.stringify(input.tags),
    flashSaleEndsAt: input.flashSaleEndsAt,
  }));

export type AppRouter = typeof appRouter;
