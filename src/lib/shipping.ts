// No free shipping and no store pickup: every order is delivered, at the
// rate set in /admin/settings (SiteSettings).
export type ShippingMethod = "STANDARD" | "EXPRESS";

export type ShippingRates = { standard: number; express: number };

/** Pure, client-safe shipping cost — used both for the authoritative
 *  server-side price computation (src/server/services/pricing.ts) and for
 *  instant client-side previews in the checkout UI. */
export function computeShippingCost(method: ShippingMethod, rates: ShippingRates): number {
  return method === "EXPRESS" ? rates.express : rates.standard;
}
