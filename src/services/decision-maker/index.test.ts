import { describe, expect, it } from "vitest";
import { recommendDecisionMakers } from ".";

describe("decision-maker recommendation", () => {
  it("targets the owner for a small photography buyer", () => expect(recommendDecisionMakers({service:"Photography",companySize:"small"}).targetRoles[0].role).toBe("Owner"));
  it("does not default a large web project to the CEO", () => {
    const result = recommendDecisionMakers({service:"Web Development",companySize:"mid_large"});
    expect(result.targetRoles[0].role).toBe("Head of Digital");
    expect(result.targetRoles.map(item=>item.role)).not.toContain("CEO");
  });
});
