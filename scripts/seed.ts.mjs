// Seed script for Luxe Store — run with: npx tsx scripts/seed.ts
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.query("SELECT COUNT(*) AS c FROM products");
if (rows[0].c > 0) {
  console.log("Products already seeded, skipping.");
  await conn.end();
  process.exit(0);
}

await conn.query(`
INSERT INTO categories (name, slug, description, image, sortOrder) VALUES
('Apparel', 'apparel', 'Tailored essentials crafted for the modern wardrobe.', '/manus-storage/cat-apparel_96c187e8.png', 1),
('Watches & Jewelry', 'watches', 'Precision timepieces and fine jewelry.', '/manus-storage/cat-watches_0a18651d.png', 2),
('Fragrance', 'fragrance', 'Signature scents with remarkable depth.', '/manus-storage/cat-fragrance_c97e2f9b.png', 3),
('Leather Goods', 'leather', 'Handcrafted leather goods built to last.', '/manus-storage/cat-accessories_54b37299.png', 4);
`);

await conn.query(`
INSERT INTO brands (name, slug, description) VALUES
('Maison Noir', 'maison-noir', 'Parisian-inspired tailoring for modern silhouettes.'),
('Atelier Veaux', 'atelier-veaux', 'Heritage leather craftsmanship since 1952.'),
('Helios Horology', 'helios-horology', 'Swiss-inspired timepieces with minimalist dials.'),
('Fleur de Lune', 'fleur-de-lune', 'Bespoke fragrances from Grasse.'),
('Nova Essentials', 'nova-essentials', 'Everyday luxury designed to endure.');
`);

const nowIso = new Date().toISOString().slice(0, 19).replace("T", " ");

// flash sale ends ~30 hours from now
const flashIso = new Date(Date.now() + 30 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");

const products = [
  // Apparel
  {
    name: "Merino Wool Overcoat", slug: "merino-wool-overcoat",
    description: "A timeless silhouette cut from premium Italian merino wool. Double-faced construction, horn buttons and a fully canvassed interior deliver a drape that improves with every wear. Finished by hand in our atelier with a signature tonal lining.",
    categoryId: 1, brandId: 1,
    images: ["/manus-storage/prod-coat_a5718720.png"],
    price: 489.00, compareAtPrice: 620.00,
    stockBySize: { XS: 4, S: 8, M: 12, L: 6, XL: 3 },
    colors: [{ name: "Charcoal", swatch: "#3a3a3c" }, { name: "Camel", swatch: "#b98d62" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.8, reviewCount: 124, isFeatured: true, isFlashSale: false,
    tags: ["wool", "outerwear", "coat", "winter"], sortOrder: 10,
  },
  {
    name: "Cashmere Overcoat", slug: "cashmere-overcoat",
    description: "Spun from 100% Mongolian cashmere, this overcoat offers exceptional warmth without weight. Notch lapels, a relaxed shoulder and an interior pocket finished in supple calfskin make it the investment piece of the season.",
    categoryId: 1, brandId: 1,
    images: ["/manus-storage/prod-coat2_84669b1e.png"],
    price: 795.00, compareAtPrice: null,
    stockBySize: { XS: 2, S: 5, M: 9, L: 4, XL: 1 },
    colors: [{ name: "Camel", swatch: "#b98d62" }, { name: "Graphite", swatch: "#4c4c4e" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.9, reviewCount: 87, isFeatured: true, isFlashSale: false,
    tags: ["cashmere", "outerwear", "coat", "luxury"], sortOrder: 9,
  },
  {
    name: "Tailored Navy Suit", slug: "tailored-navy-suit",
    description: "A three-piece suit in superfine 120s wool with a soft shoulder and a gentle drape. Half-canvas construction and functional buttonholes ensure it moves as well as it photographs.",
    categoryId: 1, brandId: 1,
    images: ["/manus-storage/prod-suit_64af860b.png"],
    price: 890.00, compareAtPrice: 1100.00,
    stockBySize: { S: 3, M: 7, L: 5, XL: 2 },
    colors: [{ name: "Midnight Navy", swatch: "#1b2438" }, { name: "Charcoal", swatch: "#2f2f31" }],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7, reviewCount: 62, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashIso,
    tags: ["suit", "tailoring", "formal"], sortOrder: 8,
  },
  {
    name: "White Poplin Shirt", slug: "white-poplin-shirt",
    description: "The perfect white shirt, engineered in double-twisted Egyptian cotton poplin. Mother-of-pearl buttons, a generous French placket and a precise spread collar make this the foundation of any wardrobe.",
    categoryId: 1, brandId: 5,
    images: ["/manus-storage/prod-shirt_0d6e9ca2.png"],
    price: 145.00, compareAtPrice: null,
    stockBySize: { XS: 6, S: 14, M: 18, L: 10, XL: 5, XXL: 2 },
    colors: [{ name: "White", swatch: "#f7f5f0" }, { name: "Pale Blue", swatch: "#c9d9e8" }],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    rating: 4.6, reviewCount: 201, isFeatured: false, isFlashSale: true, flashSaleEndsAt: flashIso,
    tags: ["shirt", "cotton", "basics"], sortOrder: 7,
  },
  {
    name: "Cashmere Crewneck Sweater", slug: "cashmere-crewneck-sweater",
    description: "Knitted in two-ply cashmere from Inner Mongolia, this crewneck is brushed for softness and finished with ribbed hems that hold their shape. A quiet essential that layers beautifully under anything.",
    categoryId: 1, brandId: 5,
    images: ["/manus-storage/prod-knit_539f5dc9.png"],
    price: 225.00, compareAtPrice: 280.00,
    stockBySize: { XS: 5, S: 10, M: 15, L: 8, XL: 4 },
    colors: [{ name: "Oatmeal", swatch: "#e3d9c8" }, { name: "Black", swatch: "#1a1a1a" }, { name: "Sage", swatch: "#9aab96" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.8, reviewCount: 156, isFeatured: true, isFlashSale: false,
    tags: ["knitwear", "cashmere", "winter"], sortOrder: 6,
  },
  {
    name: "Silk Evening Dress", slug: "silk-evening-dress",
    description: "A bias-cut evening dress in pure silk satin with a draped cowl neckline. The fabric falls fluidly, catching light at every angle — the definition of understated glamour.",
    categoryId: 1, brandId: 1,
    images: ["/manus-storage/prod-dress_8bb02cee.png"],
    price: 620.00, compareAtPrice: null,
    stockBySize: { XS: 3, S: 6, M: 8, L: 4 },
    colors: [{ name: "Black", swatch: "#111111" }, { name: "Champagne", swatch: "#e8dcc8" }],
    sizes: ["XS", "S", "M", "L"],
    rating: 4.9, reviewCount: 74, isFeatured: true, isFlashSale: false,
    tags: ["dress", "silk", "evening"], sortOrder: 5,
  },
  // Watches & Jewelry
  {
    name: "Midnight Chronograph", slug: "midnight-chronograph",
    description: "A precision automatic chronograph with a midnight-blue sunburst dial and brushed steel case. Sapphire crystal, 100m water resistance and a 72-hour power reserve. Swiss-made movement.",
    categoryId: 2, brandId: 3,
    images: ["/manus-storage/prod-watch_c9c0042d.png"],
    price: 1450.00, compareAtPrice: 1800.00,
    stockBySize: { "One Size": 14 },
    colors: [{ name: "Steel", swatch: "#c7ccd0" }],
    sizes: ["One Size"],
    rating: 4.9, reviewCount: 48, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashIso,
    tags: ["watch", "chronograph", "automatic"], sortOrder: 12,
  },
  {
    name: "Heritage Gold Chronograph", slug: "heritage-gold-chronograph",
    description: "A classic chronograph in warm gold-tone steel with a cream dial and genuine brown leather strap. A heritage design reinterpreted with modern precision.",
    categoryId: 2, brandId: 3,
    images: ["/manus-storage/prod-watch2_8c34fb90.png"],
    price: 1180.00, compareAtPrice: null,
    stockBySize: { "One Size": 9 },
    colors: [{ name: "Gold", swatch: "#d4af6a" }, { name: "Silver", swatch: "#c7ccd0" }],
    sizes: ["One Size"],
    rating: 4.7, reviewCount: 33, isFeatured: false, isFlashSale: false,
    tags: ["watch", "chronograph", "leather strap"], sortOrder: 11,
  },
  {
    name: "18k Gold Band Ring", slug: "18k-gold-band-ring",
    description: "A minimalist band in solid 18-karat gold with a brushed satin finish. Light, comfortable and endlessly wearable — a modern heirloom.",
    categoryId: 2, brandId: 3,
    images: ["/manus-storage/prod-ring_af223997.png"],
    price: 340.00, compareAtPrice: null,
    stockBySize: { "5": 3, "6": 5, "7": 8, "8": 6, "9": 4 },
    colors: [{ name: "Gold", swatch: "#d4af6a" }, { name: "White Gold", swatch: "#d9d9db" }],
    sizes: ["5", "6", "7", "8", "9"],
    rating: 4.8, reviewCount: 29, isFeatured: false, isFlashSale: false,
    tags: ["ring", "gold", "jewelry"], sortOrder: 4,
  },
  // Fragrance
  {
    name: "Oud Noir Eau de Parfum", slug: "oud-noir-eau-de-parfum",
    description: "A deeply evocative fragrance opening with smoked oud, settling into dark amber and resinous vanilla. Long-lasting, animalic and unforgettable. 100ml.",
    categoryId: 3, brandId: 4,
    images: ["/manus-storage/prod-perfume_bc1200cd.png"],
    price: 265.00, compareAtPrice: 320.00,
    stockBySize: { "50ml": 6, "100ml": 11 },
    colors: [{ name: "Amber", swatch: "#a45d2f" }],
    sizes: ["50ml", "100ml"],
    rating: 4.6, reviewCount: 57, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashIso,
    tags: ["fragrance", "oud", "unisex"], sortOrder: 13,
  },
  {
    name: "Rose Blanche Eau de Toilette", slug: "rose-blanche-eau-de-toilette",
    description: "A luminous floral built around Damascena rose, white musk and a whisper of pear. Fresh, feminine and radiant. 75ml.",
    categoryId: 3, brandId: 4,
    images: ["/manus-storage/prod-perfume2_485d0ddb.png"],
    price: 175.00, compareAtPrice: null,
    stockBySize: { "50ml": 8, "75ml": 14, "100ml": 5 },
    colors: [{ name: "Rose", swatch: "#e8b4bc" }],
    sizes: ["50ml", "75ml", "100ml"],
    rating: 4.5, reviewCount: 41, isFeatured: false, isFlashSale: false,
    tags: ["fragrance", "floral", "women"], sortOrder: 3,
  },
  // Leather Goods & Accessories
  {
    name: "Cognac Leather Briefcase", slug: "cognac-leather-briefcase",
    description: "Full-grain vegetable-tanned leather briefcase with solid brass hardware, a padded laptop compartment and cotton twill lining. Develops a beautiful patina over years of use.",
    categoryId: 4, brandId: 2,
    images: ["/manus-storage/prod-briefcase_25cad114.png"],
    price: 420.00, compareAtPrice: 520.00,
    stockBySize: { "One Size": 7 },
    colors: [{ name: "Cognac", swatch: "#9a5a2e" }, { name: "Espresso", swatch: "#3d2b20" }],
    sizes: ["One Size"],
    rating: 4.7, reviewCount: 38, isFeatured: true, isFlashSale: false,
    tags: ["leather", "briefcase", "work"], sortOrder: 14,
  },
  {
    name: "Black Calfskin Handbag", slug: "black-calfskin-handbag",
    description: "A structured handbag in supple calfskin with polished gold hardware and an interior suede lining. A refined silhouette that transitions effortlessly from day to evening.",
    categoryId: 4, brandId: 2,
    images: ["/manus-storage/prod-handbag_56205280.png"],
    price: 580.00, compareAtPrice: null,
    stockBySize: { "One Size": 10 },
    colors: [{ name: "Black", swatch: "#151515" }, { name: "Bordeaux", swatch: "#5c1f2a" }],
    sizes: ["One Size"],
    rating: 4.8, reviewCount: 52, isFeatured: true, isFlashSale: false,
    tags: ["leather", "handbag", "accessories"], sortOrder: 15,
  },
  {
    name: "Minimal Leather Sneakers", slug: "minimal-leather-sneakers",
    description: "Handcrafted in Italy from full-grain buttery leather with a champagne-accented heel tab. Cupsole construction on a memory-foam insole for all-day comfort.",
    categoryId: 4, brandId: 2,
    images: ["/manus-storage/prod-sneaker_0a684d16.png"],
    price: 295.00, compareAtPrice: 360.00,
    stockBySize: { "40": 4, "41": 6, "42": 9, "43": 7, "44": 5, "45": 2 },
    colors: [{ name: "White", swatch: "#f5f4f0" }, { name: "Black", swatch: "#171717" }],
    sizes: ["40", "41", "42", "43", "44", "45"],
    rating: 4.6, reviewCount: 132, isFeatured: true, isFlashSale: true, flashSaleEndsAt: flashIso,
    tags: ["sneakers", "leather", "minimal"], sortOrder: 16,
  },
  {
    name: "Tortoiseshell Acetate Sunglasses", slug: "tortoiseshell-acetate-sunglasses",
    description: "Hand-polished acetate frames in a classic tortoiseshell pattern with Carl Zeiss lenses offering 100% UV protection. Seven-barrel hinges for a precise fit.",
    categoryId: 4, brandId: 5,
    images: ["/manus-storage/prod-sunglasses_90414d65.png"],
    price: 185.00, compareAtPrice: null,
    stockBySize: { "One Size": 15 },
    colors: [{ name: "Tortoiseshell", swatch: "#6b4226" }, { name: "Black", swatch: "#111111" }],
    sizes: ["One Size"],
    rating: 4.5, reviewCount: 67, isFeatured: false, isFlashSale: false,
    tags: ["sunglasses", "eyewear", "acetate"], sortOrder: 2,
  },
];

for (const p of products) {
  await conn.query(
    `INSERT INTO products (name, slug, description, categoryId, brandId, images, price, compareAtPrice, stockBySize, colors, sizes, rating, reviewCount, isFeatured, isFlashSale, flashSaleEndsAt, tags, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.name, p.slug, p.description, p.categoryId, p.brandId,
      JSON.stringify(p.images), p.price, p.compareAtPrice,
      JSON.stringify(p.stockBySize), JSON.stringify(p.colors), JSON.stringify(p.sizes),
      p.rating, p.reviewCount, p.isFeatured, p.isFlashSale, p.flashSaleEndsAt ?? null,
      JSON.stringify(p.tags), p.sortOrder,
    ],
  );
}

// Banner rows
await conn.query(`
INSERT INTO banners (title, subtitle, image, ctaText, ctaHref, kind, isActive, sortOrder) VALUES
('Winter Collection 2026', 'Refined silhouettes, timeless materials — discover the season's essential pieces.', '/manus-storage/hero-1_e278ac60.png', 'Shop Collection', '/catalog?categoryId=1', 'hero', true, 1),
('Midnight Chronographs', 'Precision engineering beneath a midnight-blue dial. Limited winter edition.', '/manus-storage/hero-2_05b16e58.png', 'Explore Timepieces', '/catalog?categoryId=2', 'hero', true, 2),
('Signature Fragrances', 'Bespoke scents distilled in Grasse. Free shipping on every order.', '/manus-storage/hero-3_74999e27.png', 'Discover Scents', '/catalog?categoryId=3', 'hero', true, 3),
('The Home Edit', 'Curated objects for considered living.', '/manus-storage/promo-1_74d232cf.png', 'View Collection', '/catalog', 'promo', true, 4),
('New Season Footwear', 'Italian leather. Effortless comfort.', '/manus-storage/promo-2_a3c8a961.png', 'Shop Sneakers', '/catalog?q=sneakers', 'promo', true, 5);
`);

// Coupons
await conn.query(`
INSERT INTO coupons (code, description, type, value, minOrder, isActive) VALUES
('WELCOME10', '10% off your first order', 'percent', 10.00, 100.00, true),
('LUXE50', '$50 off orders over $300', 'fixed', 50.00, 300.00, true),
('FLASH20', 'Flash sale: 20% off', 'percent', 20.00, null, true);
`);

// Sample reviews (real-feeling, unique customers — seeded system content, not UGC)
await conn.query(`
INSERT INTO reviews (productId, userId, userName, rating, title, body, verifiedPurchase)
SELECT id, 0, 'Verified Customer', 5, 'Exceptional quality', 'The craftsmanship is immediately apparent. Fabric, stitching, and fit all exceed expectations.', true FROM products WHERE slug = 'merino-wool-overcoat'
`);

await conn.query(`
INSERT INTO reviews (productId, userId, userName, rating, title, body, verifiedPurchase)
SELECT id, 0, 'Verified Customer', 5, 'Worth every penny', 'This watch has become my daily wear. The dial is stunning in person and it keeps perfect time.', true FROM products WHERE slug = 'midnight-chronograph'
`);

await conn.query(`
INSERT INTO reviews (productId, userId, userName, rating, title, body, verifiedPurchase)
SELECT id, 0, 'Verified Customer', 5, 'My new signature scent', 'Remarkable depth and longevity. I receive compliments every time I wear it.', true FROM products WHERE slug = 'oud-noir-eau-de-parfum'
`);

await conn.query(`
INSERT INTO reviews (productId, userId, userName, rating, title, body, verifiedPurchase)
SELECT id, 0, 'Verified Customer', 4, 'Beautiful patina already', 'The leather is superb quality and the brass hardware feels substantial. Arrived beautifully packaged.', true FROM products WHERE slug = 'cognac-leather-briefcase'
`);

console.log("Seed complete.");
await conn.end();
