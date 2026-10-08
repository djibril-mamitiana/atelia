export const SITE_NAME = "ConcreteToolsPro";
export const SITE_TAGLINE = "Outils diamant professionnels";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const DEFAULT_TAX_RATE = 20; // percent, used as a fallback only

// Defaults for the editable shop settings (/admin/settings, SiteSettings
// table) — used until an admin saves the form. No free-shipping threshold:
// the shop doesn't offer free delivery.
export const DEFAULT_CONTACT_EMAIL = "contact@concretetoolspro.com";
export const DEFAULT_CONTACT_PHONE = "01 23 45 67 89";
export const DEFAULT_SHIPPING_STANDARD = 5.9; // EUR
export const DEFAULT_SHIPPING_EXPRESS = 9.9; // EUR

export const PAGE_SIZE_CATALOG = 24;
export const PAGE_SIZE_ADMIN_TABLE = 20;

export const SESSION_COOKIE_NAME = "atelia_session";
export const CART_COOKIE_NAME = "atelia_cart";

export const ORDER_NUMBER_PREFIX = "CMD";
