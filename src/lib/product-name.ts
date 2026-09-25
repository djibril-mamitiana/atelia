type NameFields = {
  name: string;
  nameFr?: string | null;
  nameEn?: string | null;
  nameIt?: string | null;
};

/**
 * Product.name is the German source-catalogue name; nameFr/nameEn/nameIt are
 * the translations (see the schema). Used where a full product row is at hand
 * (cart, checkout, order lines) — falls back to German when a translation is
 * missing, exactly like the catalogue queries do.
 */
export function localizedProductName(p: NameFields, locale: string): string {
  if (locale === "fr") return p.nameFr ?? p.name;
  if (locale === "en") return p.nameEn ?? p.name;
  if (locale === "it") return p.nameIt ?? p.name;
  return p.name;
}
