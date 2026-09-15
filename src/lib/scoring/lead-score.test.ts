import { describe, expect, it } from "vitest";
import { calculateLeadScore, isOutreachReady, qualifiesForEnrichment } from "./lead-score";
describe("lead scoring", () => {
  it("uses the blueprint weights", () => expect(calculateLeadScore({ intent:90, icp:80, serviceMatch:100, decisionMaker:70, contactability:80, recency:100, confidence:80 })).toBe(87));
  it("qualifies explicit intent", () => expect(qualifiesForEnrichment({ explicitIntentScore:72, icpScore:10, commercialSignalScore:10, sellerFitScore:0 })).toBe(true));
  it("does not make a company main number outreach-ready", () => expect(isOutreachReady({ serviceMatch:true, leadScore:90, confidenceScore:90, threshold:70, confidenceThreshold:65, verifiedWorkEmail:false, directBusinessPhone:false, professionalSocial:false, suppressed:false })).toBe(false));
});
