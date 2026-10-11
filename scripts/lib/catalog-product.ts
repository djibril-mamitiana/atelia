// Product texts derived from a supplier catalogue row — same rules as
// prisma/seed.ts → seedProducts(), shared by the scripts that create or
// update products in an existing database.
import { readFileSync } from "node:fs";

export type CatalogItem = {
  sku: string;
  name: string;
  descriptionDe: string;
  descriptionEn: string;
  typeModel?: string;
  price: number;
  categorySlug: string;
  specs: string[];
  specLabels: string[] | null;
  /** Explicit per-language names, when not derivable from the dictionary. */
  names?: { fr: string; en: string; it: string };
};
type Lang = "fr" | "en" | "it";

export const readCatalog = (): CatalogItem[] => JSON.parse(readFileSync("prisma/data/diamond-pro-catalog.json", "utf8"));
export const readDictionary = (): Record<string, Record<Lang, string>> => JSON.parse(readFileSync("prisma/data/description-translations.json", "utf8"));

const FEATURES: Record<Lang, string> = { fr: "Caractéristiques", en: "Features", it: "Caratteristiche" };
const TYPE: Record<Lang, string> = { fr: "Type", en: "Type", it: "Tipo" };

export function productTexts(item: CatalogItem, dict: Record<string, Record<Lang, string>>, brandName: string) {
  const specLines =
    item.specLabels && item.specLabels.length === item.specs.length
      ? item.specLabels.map((label, i) => `${label}: ${item.specs[i]}`).join(", ")
      : item.specs.join(", ");
  const description =
    [item.descriptionDe, item.descriptionEn, specLines && `Caractéristiques : ${specLines}`, item.typeModel && `Type : ${item.typeModel}`].filter(Boolean).join("\n") ||
    item.name;
  const tr = dict[item.descriptionDe];
  const suffix = tr && item.name.startsWith(item.descriptionDe) ? item.name.slice(item.descriptionDe.length) : null;
  const name = (l: Lang) => item.names?.[l] ?? (tr && suffix !== null ? `${tr[l]}${suffix}` : undefined);
  const localized = (l: Lang) =>
    tr ? [tr[l], specLines && `${FEATURES[l]} : ${specLines}`, item.typeModel && `${TYPE[l]} : ${item.typeModel}`].filter(Boolean).join("\n") : undefined;

  return {
    name: item.name,
    nameFr: name("fr"),
    nameEn: name("en"),
    nameIt: name("it"),
    description,
    descriptionFr: localized("fr"),
    descriptionEn: localized("en"),
    descriptionIt: localized("it"),
    shortDescription: (item.descriptionDe || item.descriptionEn || item.name).slice(0, 200),
    shortDescriptionFr: tr?.fr.slice(0, 200),
    shortDescriptionEn: tr?.en.slice(0, 200),
    shortDescriptionIt: tr?.it.slice(0, 200),
    seoTitle: `${item.name} | ${brandName}`,
    seoDescription: description.slice(0, 150),
  };
}
