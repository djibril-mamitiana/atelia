/**
 * The category tree was reorganised (see scripts/recategorize-catalog.ts).
 * The old categories are hidden, not deleted — this maps each retired slug to
 * the category that replaces it so old links, bookmarks and search-engine
 * results land on a real page instead of an empty one.
 */
export const RETIRED_CATEGORY_REDIRECTS: Record<string, string> = {
  "disques-diamant-115-230": "disques-meuleuse-tronconneuse",
  "disques-diamant-250-1000": "disques-scie-sol",
  "disques-diamant-asphalte": "disques-scie-sol",
  "forets-diamant": "couronnes-carottage-eau",
  "meules-diamant": "disques-poncage",
  "disques-diamant-pierre-naturelle": "disques-scie-table",
  "autres-disques-diamant": "disques-meuleuse-tronconneuse",
  interflex: "disques-meuleuse-tronconneuse",
};
