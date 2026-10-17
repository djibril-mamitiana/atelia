import { describe, expect, it } from "vitest";
import { localizeSpecValue, readSpecCells, specCells, tableColumns } from "@/lib/spec-table";

const DISC_LABELS = ["mm", "mm", "mm", "Seg. pcs"];

describe("specCells — catalogue values filed under named columns", () => {
  it("reads a disc row as Ø, segment, bore, number of segments", () => {
    expect(specCells({ specs: ["115", "38x2,0x7", "22,2", "8"], specLabels: DISC_LABELS, categorySlug: "disques-meuleuse-tronconneuse" })).toEqual([
      ["diameter", "115"],
      ["segment", "38x2,0x7"],
      ["bore", "22,2"],
      ["segments", "8"],
    ]);
  });

  it("keeps a continuous rim and a combined bore", () => {
    expect(specCells({ specs: ["125", "2,5x10", "22,2", "Vollrand"], specLabels: null, categorySlug: "disques-meuleuse-tronconneuse" })).toEqual([
      ["diameter", "125"],
      ["segment", "2,5x10"],
      ["bore", "22,2"],
      ["segments", "Vollrand"],
    ]);
    expect(specCells({ specs: ["600", "40x4,4x10", "60/25,4", "42"], specLabels: null, categorySlug: "disques-scie-sol" })?.[2]).toEqual(["bore", "60/25,4"]);
  });

  it("reads a core bit row as Ø, segments, segment, useful length", () => {
    expect(specCells({ specs: ["25", "3", "16x3x9", "450 mm"], specLabels: ["mm", "Seg. pcs", "mm", "Length mm"], categorySlug: "couronnes-carottage-eau" })).toEqual([
      ["diameter", "25"],
      ["segments", "3"],
      ["segment", "16x3x9"],
      ["length", "450"],
    ]);
    // No headers: the small number after the connection is the segment count, not a length.
    expect(specCells({ specs: ["16x3,2x10", "M16", "4"], specLabels: null, categorySlug: "couronnes-carottage-eau" })).toEqual([
      ["segment", "16x3,2x10"],
      ["connection", "M16"],
      ["segments", "4"],
    ]);
  });

  it("uses explicit headers (connection, grit, length) and skips packaging notes", () => {
    expect(specCells({ specs: ["32", "M 14", "#30", "64/45", "Plastik Schraubverpackung"], specLabels: ["mm", "Connection", "Grit", "Length mm"], categorySlug: "carottage-sec" })).toEqual([
      ["diameter", "32"],
      ["connection", "M 14"],
      ["grit", "#30"],
      ["length", "64/45"],
    ]);
  });

  it("gives up on a value it can't place (the page then shows the plain text)", () => {
    expect(specCells({ specs: ["Messing", "M14"], specLabels: null, categorySlug: "accessoires-diamant" })).toBeNull();
  });
});

describe("tables", () => {
  it("lists the columns any row has, in the standard order", () => {
    expect(tableColumns([[["bore", "20"], ["diameter", "350"]], [["diameter", "400"], ["segments", "28"]]])).toEqual(["diameter", "bore", "segments"]);
  });

  it("translates catalogue words and reads stored JSON safely", () => {
    expect(localizeSpecValue("Vollrand", "fr")).toBe("Jante continue");
    expect(localizeSpecValue("6-Kant/hex", "it")).toBe("Esagonale");
    expect(localizeSpecValue("Aufnahme M8", "en")).toBe("M8");
    expect(localizeSpecValue("22,2", "de")).toBe("22,2");
    expect(readSpecCells([["diameter", "230"]])).toEqual([["diameter", "230"]]);
    expect(readSpecCells([["price", "12"]])).toBeNull();
    expect(readSpecCells(null)).toBeNull();
  });
});
