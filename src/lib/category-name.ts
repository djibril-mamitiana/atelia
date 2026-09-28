type NameFields = {
  name: string;
  nameDe?: string | null;
  nameEn?: string | null;
  nameIt?: string | null;
};

/**
 * Category.name is the French source-catalogue name; nameDe/nameEn/nameIt
 * are the translations (see the schema). Mirrors localizedProductName —
 * used wherever a full category row (or a {id,name,nameDe,nameEn,nameIt}
 * projection of one) is at hand outside the storefront query layer, e.g.
 * admin dashboards and read-only labels. Brand uses the exact same
 * name/nameDe/nameEn/nameIt shape (French source), so this is reused for it too.
 */
export function localizedCategoryName(c: NameFields, locale: string): string {
  if (locale === "de") return c.nameDe ?? c.name;
  if (locale === "en") return c.nameEn ?? c.name;
  if (locale === "it") return c.nameIt ?? c.name;
  return c.name;
}
