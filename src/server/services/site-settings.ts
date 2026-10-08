import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_CONTACT_PHONE,
  DEFAULT_SHIPPING_EXPRESS,
  DEFAULT_SHIPPING_STANDARD,
} from "@/lib/constants";
import type { ShippingRates } from "@/lib/shipping";

export type SiteSettingsData = {
  contactEmail: string;
  contactPhone: string;
  shipping: ShippingRates;
};

export const SITE_SETTINGS_ID = "default";

/** Shop settings edited in /admin/settings, read once per request. Falls
 *  back to the constants until the row has been saved once. */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const row = await db.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });
  return {
    contactEmail: row?.contactEmail ?? DEFAULT_CONTACT_EMAIL,
    contactPhone: row?.contactPhone ?? DEFAULT_CONTACT_PHONE,
    shipping: {
      standard: row ? Number(row.shippingStandard) : DEFAULT_SHIPPING_STANDARD,
      express: row ? Number(row.shippingExpress) : DEFAULT_SHIPPING_EXPRESS,
    },
  };
});
