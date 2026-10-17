import { describe, expect, it } from "vitest";
import { localizePriceTable, parsePriceTableText, priceTableText, readPriceTables, type PriceTable } from "@/lib/price-tables";

describe("price tables pasted from Excel", () => {
  it("reads tab-separated cells, first line as headers, and pads short rows", () => {
    const pasted = "Diamètre\tLongueur 500\tBague\n20\t146,50\n40\t155,60\t106,50\n\n";
    expect(parsePriceTableText(pasted)).toEqual({
      headers: ["Diamètre", "Longueur 500", "Bague"],
      rows: [
        ["20", "146,50", ""],
        ["40", "155,60", "106,50"],
      ],
    });
  });

  it("accepts semicolons when there is no tab", () => {
    expect(parsePriceTableText("Ø;Neuve\n25;24,00 €").rows).toEqual([["25", "24,00 €"]]);
  });

  const table: PriceTable = {
    title: { fr: "Couronnes à eau", de: "", en: "Wet core bits", it: "" },
    headers: { fr: ["Diamètre", "Neuve"], de: [], en: ["Diameter", "New"], it: ["Solo uno"] },
    rows: [["25", "24,00 €"]],
  };

  it("round-trips through the admin text", () => {
    expect(parsePriceTableText(priceTableText(table))).toEqual({ headers: table.headers.fr, rows: table.rows });
  });

  it("shows French when a translation is missing or incomplete", () => {
    expect(localizePriceTable(table, "en")).toMatchObject({ title: "Wet core bits", headers: ["Diameter", "New"] });
    expect(localizePriceTable(table, "de")).toMatchObject({ title: "Couronnes à eau", headers: ["Diamètre", "Neuve"] });
    expect(localizePriceTable(table, "it").headers).toEqual(["Diamètre", "Neuve"]);
  });

  it("drops malformed stored tables", () => {
    expect(readPriceTables([table, { title: "x" }, null])).toEqual([table]);
    expect(readPriceTables("nope")).toEqual([]);
  });
});
