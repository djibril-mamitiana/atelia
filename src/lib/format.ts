/** Formatting helpers shared by server and client components. */

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** Format a number or Prisma Decimal-like value as "12,90 €". */
export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(Number.isFinite(n) ? n : 0);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)} %`;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(d);
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(d);
}

/** Compute the discount percentage between a compare-at price and the current price. */
export function discountPercent(price: number, compareAtPrice?: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
