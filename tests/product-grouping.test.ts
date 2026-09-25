import { describe, expect, it } from "vitest";
import {
  computeProductGroups,
  nameWithSize,
  parseSizeOrder,
  stripSizeSuffix,
  stripSpecLines,
} from "../src/lib/product-grouping";

describe("stripSizeSuffix / nameWithSize", () => {
  it("removes the catalogue-style diameter suffix in any language", () => {
    expect(stripSizeSuffix("Diamanttrennscheibe, segmentiert Ø115mm")).toBe("Diamanttrennscheibe, segmentiert");
    expect(stripSizeSuffix("Disque diamant Ø 230 mm")).toBe("Disque diamant");
    expect(stripSizeSuffix("Ø Aufnahme")).toBe("Ø Aufnahme");
  });

  it("removes a free-form size label when it is passed", () => {
    expect(stripSizeSuffix("Casque Rouge", "Rouge")).toBe("Casque");
    expect(stripSizeSuffix("Casque Rouge")).toBe("Casque Rouge");
  });

  it("round-trips through nameWithSize", () => {
    expect(nameWithSize("Foo", "Ø135 mm")).toBe("Foo Ø135mm");
    expect(nameWithSize("Foo", "Rouge")).toBe("Foo Rouge");
    expect(nameWithSize("Foo", "")).toBe("Foo");
    expect(stripSizeSuffix(nameWithSize("Foo", "Ø135 mm"))).toBe("Foo");
    expect(stripSizeSuffix(nameWithSize("Foo", "Rouge"), "Rouge")).toBe("Foo");
  });
});

describe("parseSizeOrder", () => {
  it("reads the first number, comma or dot decimals", () => {
    expect(parseSizeOrder("Ø125 mm")).toBe(125);
    expect(parseSizeOrder("6,5 x 120")).toBe(6.5);
    expect(parseSizeOrder("Rouge")).toBeNull();
  });
});

describe("stripSpecLines", () => {
  it("drops the per-size specs line in every language", () => {
    expect(stripSpecLines("Disque\nCaractéristiques : 38x2\nType : X")).toBe("Disque\nType : X");
    expect(stripSpecLines("Blade\nFeatures : 38x2")).toBe("Blade");
  });
});

describe("computeProductGroups", () => {
  const row = (sku: string, name: string, specs: string[], labels: string[] | null = null) => ({ sku, name, specs, specLabels: labels });

  it("groups rows sharing a base name and reads the size from the first spec", () => {
    const groups = computeProductGroups([
      row("A-115", "Blade Ø115mm", ["115", "38x2", "22,2"]),
      row("A-125", "Blade Ø125mm", ["125", "37x2", "22,2"]),
      row("B-1", "Other", ["9"]),
    ]);
    expect(groups.get("A-115")?.groupKey).toBe(groups.get("A-125")?.groupKey);
    expect(groups.get("A-115")?.sizeLabel).toBe("Ø115 mm");
    expect(groups.get("A-125")?.sizeOrder).toBe(125);
    expect(groups.has("B-1")).toBe(false);
  });

  it("keeps a lone row standalone and ignores a suffix that contradicts the specs", () => {
    const groups = computeProductGroups([
      row("X-1", "Blade Ø12mm", ["36x2,2x7", "22,2", "12"]),
      row("X-2", "Blade Ø14mm", ["34x2,4x7", "22,2", "14"]),
    ]);
    expect(groups.size).toBe(0);
  });
});
