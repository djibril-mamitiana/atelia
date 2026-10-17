// Size tables in catalogue style (Ø | Segment | Alésage | Segments | Réf. |
// Prix): the supplier's spec columns, each value filed under a named column.
//
// The supplier catalogue gives every row its values (`specs`) and the
// table's column headers (`specLabels`), but the headers were extracted from
// the second header line only — "Ø / mm", "Segment / mm" and "Bohrung / mm"
// all became "mm" — and are missing for ~280 rows. So a column is recognised
// from its header when it says something ("Connection", "Grit", "Length mm",
// "Seg. pcs"…) and otherwise from the shape of the value and its place in
// the row (a disc row reads Ø, segment, bore, number of segments).

export const SPEC_KEYS = ["diameter", "bitDiameter", "segment", "width", "bore", "height", "segments", "connection", "grit", "length", "color", "type"] as const;
export type SpecKey = (typeof SPEC_KEYS)[number];
/** One cell: [column, value] (value as in the catalogue, unit dropped). */
export type SpecCell = [SpecKey, string];

type CatalogRow = { specs: string[]; specLabels: string[] | null; categorySlug: string };

const NUMBER = /^\d+(?:[.,]\d+)?$/;
const SEGMENT = /^\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?(?:\s*x\s*\d+(?:[.,]\d+)?)?$/i;
const GRIT = /^(?:#\s*\d+(?:\/\d+)?|D\s*\d+)$/i;
const CONNECTION = /^(?:M\s?\d+|R\s?\d\/\d"?|\d\s?\d\/\d"|1\/2"|SDS|6-Kant|Klett|Aufnahme|Rundschaft|Bajonett|HTC|.*\bUNC\b|.*X-Lock)/i;
const RANGE_OR_PAIR = /^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/; // "64/45" (lengths) or "60/25,4" (bores)
const DIAMETER_RANGE = /^\d+\s*(?:-\s*\d+|\+)$/; // "150-180" / "300+": core bit diameters a segment fits
const PACKAGING = /verpackung|packaging|screw wrap|^\d+\s*pcs$/i; // packaging notes, not a spec
const SEGMENT_TYPE = /segment/i; // "Turbosegment/turbosegment", "Blocksegment/block segment"…
const COMMON_BORES = new Set(["20", "22,2", "25,4", "30", "50", "60"]);

const isDisc = (slug: string) => slug.startsWith("disques-");
const isCoring = (slug: string) => slug === "couronnes-carottage-eau" || slug === "carottage-sec";

/** Column a header names explicitly, or null when it only says "mm". */
function keyFromLabel(label: string): SpecKey | null {
  const l = label.toLowerCase();
  if (/seg\.?\s*pcs|seg\.-st/.test(l)) return "segments";
  if (/segment/.test(l)) return "segment";
  if (/connection|anschluss|aufnahme/.test(l)) return "connection";
  if (/bohrung|arbor/.test(l)) return "bore";
  if (/grit|grid|körnung/.test(l)) return "grit";
  if (/length|länge/.test(l)) return "length";
  if (/height|höhe/.test(l)) return "height";
  if (/width/.test(l)) return "width";
  if (/farbe|color/.test(l)) return "color";
  if (/^type$/.test(l)) return "type";
  if (/^ø\s*mm$|^\(mm\)$/.test(l)) return "bitDiameter";
  return null;
}

const clean = (v: string) => v.replace(/\s*mm$/i, "").trim();

/**
 * The row's values filed under named columns, or null when a value can't be
 * placed with confidence (the size table then keeps the plain spec text).
 */
export function specCells(row: CatalogRow): SpecCell[] | null {
  const { specs, specLabels, categorySlug } = row;
  if (specs.length === 0) return null;
  const cells: SpecCell[] = [];
  const has = (k: SpecKey) => cells.some(([key]) => key === k);
  const put = (k: SpecKey, v: string) => {
    if (has(k)) return false;
    cells.push([k, clean(v)]);
    return true;
  };

  for (const [i, raw] of specs.entries()) {
    const v = raw.trim();
    if (PACKAGING.test(v)) continue;
    const label = specLabels?.[i] ?? "";
    const named = label ? keyFromLabel(label) : null;
    if (named && named !== "segments" && put(named, v)) continue;
    if (named === "segments" && (NUMBER.test(v) || /vollrand/i.test(v)) && put("segments", v)) continue;

    // The same value twice in a row (a grit printed in two columns): once is enough.
    if (cells.some(([, value]) => value === clean(v))) continue;

    // By shape and position.
    if (/vollrand/i.test(v)) {
      if (put("segments", v)) continue;
    } else if (SEGMENT.test(v)) {
      if (put("segment", v)) continue;
    } else if (GRIT.test(v)) {
      if (put("grit", v)) continue;
    } else if (SEGMENT_TYPE.test(v)) {
      if (put("type", v)) continue;
    } else if (CONNECTION.test(v)) {
      // On a disc, a thread (M14, X-Lock) is how it mounts: the "bore" column.
      if (isDisc(categorySlug) && (/^M\s?\d+$/i.test(v) || /X-Lock/i.test(v)) ? put("bore", v) : put("connection", v)) continue;
    } else if (DIAMETER_RANGE.test(v)) {
      if (put("bitDiameter", v)) continue;
    } else if (/\d\s*mm$/i.test(v)) {
      // "450 mm" on a core bit is its useful length; on a disc "22,2 mm" is
      // its bore and "16,0 mm" its segment / groove width.
      const key = isCoring(categorySlug) ? "length" : COMMON_BORES.has(clean(v)) ? "bore" : "segment";
      if (put(key, v)) continue;
    } else if (RANGE_OR_PAIR.test(v)) {
      if (isDisc(categorySlug) ? put("bore", v) : put("length", v)) continue;
    } else if (NUMBER.test(v)) {
      const n = Number(v.replace(",", "."));
      if (i === 0 && !has("diameter") && put("diameter", v)) continue;
      if (isDisc(categorySlug) || categorySlug === "disques-poncage") {
        // Ø, [segment / rim height], bore, number of segments.
        if (!has("segment") && !has("bore") && n <= 10 && put("segment", v)) continue;
        if (!has("bore") && put("bore", v)) continue;
        if (put("segments", v)) continue;
      } else if (isCoring(categorySlug)) {
        // Ø, number of segments (small), segment, useful length (long).
        if (!has("segments") && n <= 30 && put("segments", v)) continue;
        if (put("length", v)) continue;
      }
    }
    return null; // a value we can't place: keep the plain text instead
  }
  return cells.length > 0 ? cells : null;
}

/** Columns of a size table: those any row has, in the standard order. */
export function tableColumns(rows: (SpecCell[] | null)[]): SpecKey[] {
  const present = new Set(rows.flatMap((r) => (r ?? []).map(([k]) => k)));
  return SPEC_KEYS.filter((k) => present.has(k));
}

type Locale = "fr" | "de" | "en" | "it";

/** The catalogue's words, per language (de / en first and second half of "Klett/hook and loop"). */
const VALUE_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  vollrand: { fr: "Jante continue", de: "Vollrand", en: "Continuous rim", it: "Corona continua" },
  "klett/hook and loop": { fr: "Velcro", de: "Klett", en: "Hook and loop", it: "Velcro" },
  rundschaft: { fr: "Queue ronde", de: "Rundschaft", en: "Round shank", it: "Gambo tondo" },
  "6-kant/hex": { fr: "6 pans", de: "6-Kant", en: "Hex", it: "Esagonale" },
  bajonett: { fr: "Baïonnette", de: "Bajonett", en: "Bayonet", it: "Baionetta" },
  "turbosegment/turbosegment": { fr: "Segment turbo", de: "Turbosegment", en: "Turbo segment", it: "Segmento turbo" },
  "blocksegment/block segment": { fr: "Segment bloc", de: "Blocksegment", en: "Block segment", it: "Segmento a blocco" },
  "dachsegment/roof segment": { fr: "Segment toit", de: "Dachsegment", en: "Roof segment", it: "Segmento a tetto" },
  "grün/green": { fr: "Vert", de: "Grün", en: "Green", it: "Verde" },
  "schwarz/black": { fr: "Noir", de: "Schwarz", en: "Black", it: "Nero" },
  "rot/red": { fr: "Rouge", de: "Rot", en: "Red", it: "Rosso" },
  "blau/blue": { fr: "Bleu", de: "Blau", en: "Blue", it: "Blu" },
};

/** A cell as shown to a visitor: catalogue words translated, "Aufnahme M8" → "M8". */
export function localizeSpecValue(value: string, locale: Locale): string {
  const known = VALUE_TRANSLATIONS[value.trim().toLowerCase()];
  if (known) return known[locale];
  const mount = value.match(/^Aufnahme\s+(M\s?\d+)$/i) ?? value.match(/^Bosch\/(X-Lock)$/i);
  if (mount) return mount[1];
  // Other "Deutsch/English" pairs: German for de, English otherwise.
  const pair = value.match(/^([^/\d][^/]*)\/([^/\d][^/]*)$/);
  if (pair) return locale === "de" ? pair[1].trim() : pair[2].trim();
  return value;
}

/** Product.specs as stored (JSON), checked: null unless a list of [known column, text]. */
export function readSpecCells(json: unknown): SpecCell[] | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const ok = json.every(
    (c) => Array.isArray(c) && c.length === 2 && (SPEC_KEYS as readonly string[]).includes(c[0]) && typeof c[1] === "string"
  );
  return ok ? (json as SpecCell[]) : null;
}
