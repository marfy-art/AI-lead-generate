import { describe, expect, it } from "vitest";
import { deduplicateCandidates } from ".";

describe("candidate deduplication", () => {
  it("deduplicates normalized domains and retains an audit key", () => {
    const result = deduplicateCandidates([{ id:"one", domain:"https://www.example.com/about" }, { id:"two", domain:"example.com" }]);
    expect(result.unique.map(item => item.id)).toEqual(["one"]);
    expect(result.duplicates).toEqual([{ candidate:{ id:"two", domain:"example.com" }, matchedKey:"domain:example.com" }]);
  });
  it("matches company and location when a domain is absent", () => expect(deduplicateCandidates([{id:"one",companyName:"Dhaka Makers",location:"Dhaka"},{id:"two",companyName:"dhaka-makers",location:"DHAKA"}]).unique).toHaveLength(1));
});
