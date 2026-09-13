/** Formatting helpers shared by server and client components. All accept
 * a BCP-47 locale (e.g. "fr", "de", "en", "it") so output matches the
 * page's current language; formatters are cached per locale to avoid
 * re-creating `Intl` instances on every call. */

const currencyFormatters = new Map<string, Intl.NumberFormat>();
function getCurrencyFormatter(locale: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
    currencyFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Format a number or Prisma Decimal-like value as a localized price, e.g. "12,90 €" (fr) or "€12.90" (en). */
export function formatPrice(value: number | string, locale = "fr"): string {
  const n = typeof value === "string" ? Number(value) : value;
  return getCurrencyFormatter(locale).format(Number.isFinite(n) ? n : 0);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)} %`;
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function getDateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" });
    dateFormatters.set(locale, formatter);
  }
  return formatter;
}

export function formatDate(value: Date | string, locale = "fr"): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return getDateFormatter(locale).format(d);
}

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
function getDateTimeFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    dateTimeFormatters.set(locale, formatter);
  }
  return formatter;
}

export function formatDateTime(value: Date | string, locale = "fr"): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return getDateTimeFormatter(locale).format(d);
}

/** Compute the discount percentage between a compare-at price and the current price. */
export function discountPercent(price: number, compareAtPrice?: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
