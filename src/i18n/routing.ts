import { defineRouting } from "next-intl/routing";

/**
 * Supported storefront languages. The back-office (/admin) is intentionally
 * excluded from localization — it's a French-only internal tool.
 */
export const routing = defineRouting({
  locales: ["fr", "de", "en", "it"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
