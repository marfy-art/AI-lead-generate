import { describe, expect, it } from "vitest";
import { discoverMockCandidates } from ".";

describe("mock discovery", () => {
  it("normalizes both sides and removes a duplicate", async () => {
    const result = await discoverMockCandidates({ projectId:"demo", side:"both", services:["Photography"], geography:"Dhaka" });
    expect(result.candidates).toHaveLength(3);
    expect(result.duplicates).toEqual([{ id:"demo-dup", matchedKey:"domain:lensfolk.example" }]);
    expect(new Set(result.candidates.map(item => item.side))).toEqual(new Set(["buyer","seller"]));
  });
});
