/**
 * Size grouping for the supplier catalogue: rows that share a name and only
 * differ by size (e.g. "Diamanttrennscheibe, gesintert, segmentiert Ø115mm"
 * / "… Ø125mm") are presented as ONE product with a size selector.
 *
 * Pure functions, no I/O — shared by the seed, the backfill script and the
 * storefront query layer. Grouping is a presentation concern only: every
 * size stays its own Product row (own SKU, stock, price), so carts, orders,
 * inventory and existing URLs keep working untouched.
 */

export type GroupableItem = {
  sku: string;
  name: string;
  specs?: string[];
  specLabels?: string[] | null;
};

export type GroupInfo = {
  groupKey: string;
  sizeLabel: string;
  sizeOrder: number;
  sizeSpecs: string | null;
};

const SIZE_SUFFIX = /\s*Ø\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*$/i;
const NUMERIC = /^\d+(?:[.,]\d+)?$/;

/** "Diamanttrennscheibe … Ø115mm" → "Diamanttrennscheibe …". Works on any locale's name. */
export function stripSizeSuffix(name: string): string {
  return name.replace(SIZE_SUFFIX, "").trim();
}

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

/**
 * The supplier catalogue's extraction is uneven: most rows carry the
 * diameter as their first spec (the reliable source), while some rows only
 * have a "Ø…mm" name suffix — and on those the suffix is sometimes another
 * column altogether (segment count, bore). So the leading numeric spec wins,
 * a bare name suffix is only trusted when the row has no other specs to
 * contradict it, and anything doubtful stays a standalone product.
 */
function deriveSize(item: GroupableItem): { label: string; order: number; consumedSpecIndex: number | null } | null {
  const specs = item.specs ?? [];
  const first = specs[0]?.trim();
  const leading =
    first && NUMERIC.test(first) && (!item.specLabels || item.specLabels[0] === "mm") && (specs.length >= 3 || item.specLabels?.[0] === "mm");
  if (leading) return { label: `Ø${first} mm`, order: toNumber(first), consumedSpecIndex: 0 };

  const fromName = item.name.match(SIZE_SUFFIX);
  if (fromName && specs.length === 0) {
    return { label: `Ø${fromName[1]} mm`, order: toNumber(fromName[1]), consumedSpecIndex: null };
  }
  return null;
}

function formatSpecs(item: GroupableItem, consumed: number | null): string | null {
  const specs = item.specs ?? [];
  const labels = item.specLabels && item.specLabels.length === specs.length ? item.specLabels : null;
  const parts: string[] = [];
  specs.forEach((raw, i) => {
    if (i === consumed) return;
    const value = raw.trim();
    if (!value) return;
    const label = labels?.[i]?.trim();
    if (!label) parts.push(value);
    else if (label === "mm") parts.push(/mm$/i.test(value) ? value : `${value} mm`);
    else if (/^seg\.? ?pcs$/i.test(label)) parts.push(`${value} seg.`);
    else parts.push(`${label}: ${value}`);
  });
  return parts.length > 0 ? parts.join(" · ") : null;
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function makeGroupKey(baseName: string): string {
  const slug = baseName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug}:${hash(baseName)}`;
}

/**
 * Returns group info keyed by SKU. Only items whose size can be read
 * reliably (a "Ø…mm" name suffix, or a leading numeric mm spec) are grouped,
 * and only when at least two of them share the same base name —
 * everything else stays a standalone product.
 */
export function computeProductGroups(items: GroupableItem[]): Map<string, GroupInfo> {
  const buckets = new Map<string, { item: GroupableItem; size: NonNullable<ReturnType<typeof deriveSize>> }[]>();

  for (const item of items) {
    const size = deriveSize(item);
    if (!size) continue;
    // Category is deliberately not part of the key: a product family can span
    // several categories (e.g. small and large diameters of one blade).
    const key = makeGroupKey(stripSizeSuffix(item.name));
    const bucket = buckets.get(key);
    if (bucket) bucket.push({ item, size });
    else buckets.set(key, [{ item, size }]);
  }

  const result = new Map<string, GroupInfo>();
  for (const [groupKey, members] of buckets) {
    if (members.length < 2) continue;

    // The same diameter can be listed several times (different bore,
    // segment layout…). The size table tells those rows apart through the
    // specs and supplier-reference columns, so the label stays just "Ø350 mm".
    for (const { item, size } of members) {
      result.set(item.sku, {
        groupKey,
        sizeLabel: size.label,
        sizeOrder: size.order,
        sizeSpecs: formatSpecs(item, size.consumedSpecIndex),
      });
    }
  }
  return result;
}
