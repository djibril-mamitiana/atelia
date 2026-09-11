import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from "@/lib/constants";

export type ShippingMethod = "STANDARD" | "EXPRESS" | "PICKUP";

/** Pure, client-safe shipping estimate — used both for the authoritative
 *  server-side price computation (src/server/services/pricing.ts) and for
 *  instant client-side previews in the checkout UI. */
export function computeShippingCost(method: ShippingMethod, subtotal: number): number {
  if (method === "PICKUP") return 0;
  if (method === "EXPRESS") return 9.9;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
}
