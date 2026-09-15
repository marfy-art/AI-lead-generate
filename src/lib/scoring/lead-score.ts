export type ScoreInput = { intent: number; icp: number; serviceMatch: number; decisionMaker: number; contactability: number; recency: number; confidence: number };
export function calculateLeadScore(input: ScoreInput) {
  return Math.round(input.intent * .30 + input.icp * .20 + input.serviceMatch * .15 + input.decisionMaker * .15 + input.contactability * .10 + input.recency * .10);
}
export function qualifiesForEnrichment(input: { explicitIntentScore: number; icpScore: number; commercialSignalScore: number; sellerFitScore: number }) {
  return input.explicitIntentScore >= 70 || (input.icpScore >= 65 && input.commercialSignalScore >= 45) || input.sellerFitScore >= 70;
}
export function isOutreachReady(input: { serviceMatch: boolean; leadScore: number; confidenceScore: number; threshold: number; confidenceThreshold: number; verifiedWorkEmail: boolean; directBusinessPhone: boolean; professionalSocial: boolean; suppressed: boolean }) {
  return input.serviceMatch && input.leadScore >= input.threshold && input.confidenceScore >= input.confidenceThreshold && (input.verifiedWorkEmail || input.directBusinessPhone || input.professionalSocial) && !input.suppressed;
}
