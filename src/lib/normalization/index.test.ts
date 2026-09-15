import { describe, expect, it } from "vitest";
import { classifyPhone, normalizeDomain, normalizePhone } from ".";
describe("normalization", () => {
  it("normalizes domains", () => expect(normalizeDomain("https://www.Example.com/about")).toBe("example.com"));
  it("normalizes Bangladeshi local phone numbers", () => expect(normalizePhone("01712-345678")).toBe("+8801712345678"));
  it("keeps company phones distinct", () => expect(classifyPhone({ companyLevel:true })).toBe("company_main"));
});
