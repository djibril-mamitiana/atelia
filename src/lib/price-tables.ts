// Price grids of a category ("Couronnes à eau : neuve / rebrasage",
// "Tubes miniers"…): one row per diameter, one column per price. Typed in
// Excel by the client and pasted into the admin (tab-separated; ";" works
// too). Stored in Category.priceTables; the first column is the diameter,
// every other cell a price — hidden from signed-out visitors.

export type PriceTableLocale = "fr" | "de" | "en" | "it";
const LOCALES: PriceTableLocale[] = ["fr", "de", "en", "it"];

export type PriceTable = {
  /** Title per language; French is required, the others fall back to it. */
  title: Record<PriceTableLocale, string>;
  /** Column headers per language (French required, same count as each row). */
  headers: Record<PriceTableLocale, string[]>;
  rows: string[][];
};

const splitCells = (line: string) => (line.includes("\t") ? line.split("\t") : line.split(";")).map((c) => c.trim());

/** One header line ("Diamètre⇥Neuve⇥Rebrasage") → its cells; blank → []. */
export function parseHeaderLine(line: string): string[] {
  return line.trim() ? splitCells(line) : [];
}

/** Pasted text: first line = headers, then one line per row; blank lines dropped. */
export function parsePriceTableText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const [head, ...body] = lines.map(splitCells);
  const width = head?.length ?? 0;
  return {
    headers: head ?? [],
    // Short rows (empty cells at the end in Excel) padded to the header width.
    rows: body.map((r) => Array.from({ length: Math.max(width, r.length) }, (_, i) => r[i] ?? "")),
  };
}

/** Back to the pasteable text, for editing in the admin. */
export function priceTableText(table: Pick<PriceTable, "headers" | "rows">): string {
  return [table.headers.fr, ...table.rows].map((r) => r.join("\t")).join("\n");
}

/** Category.priceTables (JSON) checked; anything malformed is dropped. */
export function readPriceTables(json: unknown): PriceTable[] {
  if (!Array.isArray(json)) return [];
  const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((c) => typeof c === "string");
  return json.filter(
    (t): t is PriceTable =>
      t != null &&
      typeof t === "object" &&
      typeof t.title?.fr === "string" &&
      isStrings(t.headers?.fr) &&
      Array.isArray(t.rows) &&
      t.rows.every(isStrings)
  );
}

/** Title and headers in the visitor's language (French when not translated). */
export function localizePriceTable(table: PriceTable, locale: string) {
  const l = (LOCALES as string[]).includes(locale) ? (locale as PriceTableLocale) : "fr";
  const headers = table.headers[l]?.length === table.headers.fr.length ? table.headers[l] : table.headers.fr;
  return { title: table.title[l]?.trim() || table.title.fr, headers, rows: table.rows };
}
