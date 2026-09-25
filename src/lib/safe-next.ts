import { routing } from "@/i18n/routing";

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

/**
 * Validates the `?next=` target used after login/registration.
 *
 * Only same-site paths are accepted (no "//host", no backslashes), and a
 * leading locale segment is stripped: the locale-aware router adds the
 * current locale itself, so "/fr/admin" would otherwise become "/fr/fr/admin".
 */
export function sanitizeNextPath(next: string | undefined): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return undefined;
  const match = next.match(LOCALE_PREFIX);
  return match ? next.slice(match[0].length) || "/" : next;
}
