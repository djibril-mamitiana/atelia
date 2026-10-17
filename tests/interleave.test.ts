import { describe, expect, it } from "vitest";
import { interleave } from "@/lib/interleave";

describe("interleave — the home band alternates between special families", () => {
  it("takes one item from each list in turn, then the rest of the longer ones", () => {
    expect(interleave([["a1", "a2", "a3"], ["b1"], ["c1", "c2"]])).toEqual(["a1", "b1", "c1", "a2", "c2", "a3"]);
  });

  it("handles empty lists", () => {
    expect(interleave([[], ["b1", "b2"], []])).toEqual(["b1", "b2"]);
    expect(interleave([])).toEqual([]);
  });
});
