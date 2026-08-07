import { useEffect, useState } from "react";

export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function calcDiscount(coupon: { type: string; value: number | string } | undefined | null, subtotal: number): number {
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

export function totalStock(stockBySize: Record<string, number>): number {
  return Object.values(stockBySize ?? {}).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
}

export function stockLabel(stockBySize: Record<string, number>, size?: string): { text: string; tone: "ok" | "low" | "out" } {
  if (size && stockBySize?.[size] !== undefined) {
    const n = stockBySize[size];
    if (n <= 0) return { text: "Out of stock", tone: "out" };
    if (n <= 3) return { text: `Only ${n} left`, tone: "low" };
    return { text: "In stock", tone: "ok" };
  }
  const t = totalStock(stockBySize);
  if (t <= 0) return { text: "Out of stock", tone: "out" };
  if (t <= 5) return { text: `Only ${t} left`, tone: "low" };
  return { text: "In stock", tone: "ok" };
}

export function stockBySizeFor(size: string | undefined, stockBySize: Record<string, number> | undefined): number {
  if (!size || !stockBySize) return 0;
  return typeof stockBySize[size] === "number" ? (stockBySize[size] as number) : 0;
}

export function getDeliveryEstimate(): string {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function ratingBreakdown(reviews: { rating: number }[], total: number) {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) counts[r.rating - 1] = (counts[r.rating - 1] ?? 0) + 1;
  return counts.map((c, i) => ({ stars: 5 - i, count: c, pct: total > 0 ? Math.round((c / total) * 100) : 0 }));
}

export function useCountdown(endAt: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [!!endAt]);
  if (!endAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const diff = Math.max(0, endAt.getTime() - now);
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 60000) % 60);
  const hours = Math.floor((diff / 3600000) % 24);
  const days = Math.floor(diff / 86400000);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function averageRating(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}
