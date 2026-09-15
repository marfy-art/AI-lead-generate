import { describe, expect, it } from "vitest";
import { findUnsupportedClaims, generateOutreachDraft } from ".";

const base = { companyName:"Shonar Bangla", service:"Photography", intentStatus:"inferred" as const, evidence:[{id:"e1",text:"Opening a new branch this month",type:"observed" as const}], channels:{verifiedWorkEmail:true} };

describe("outreach recommendation", () => {
  it("uses verified email and cites stored evidence", () => expect(generateOutreachDraft(base)).toMatchObject({recommendedChannel:"email",evidenceIdsUsed:["e1"],unsupportedClaimsDetected:[]}));
  it("prefers a direct phone for explicit intent", () => expect(generateOutreachDraft({...base,intentStatus:"explicit",channels:{verifiedWorkEmail:true,directBusinessPhone:true}}).recommendedChannel).toBe("phone"));
  it("does not create outreach for suppressed leads", () => expect(generateOutreachDraft({...base,suppressed:true})).toMatchObject({recommendedChannel:"none",message:""}));
  it("detects an inferred need stated as fact", () => expect(findUnsupportedClaims("Your company needs photography",base)).toHaveLength(1));
});
