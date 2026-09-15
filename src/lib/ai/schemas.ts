import { z } from "zod";

export const serviceAnalysisSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  keywords: z.array(z.string()),
  buyerPainPoints: z.array(z.string()),
  buyerPersonas: z.array(z.string()),
  sellerPersonas: z.array(z.string()),
  intentPhrases: z.array(z.string()),
  negativeKeywords: z.array(z.string()),
});

export const businessAnalysisSchema = z.object({
  businessSummary: z.string().min(1),
  businessModel: z.string().min(1),
  marketplaceSides: z.array(z.enum(["buyer", "seller"])).min(1),
  services: z.array(serviceAnalysisSchema).min(1),
  geographies: z.array(z.string()),
  recommendedSources: z.array(z.string()),
  assumptions: z.array(z.string()),
  mode: z.enum(["mock", "live"]),
});

export const intentClassificationSchema = z.object({
  serviceMatch: z.boolean(),
  serviceCategory: z.string(),
  intentType: z.enum(["explicit", "commercial_signal", "inferred", "none"]),
  intentScore: z.number().min(0).max(100),
  evidenceIds: z.array(z.string()),
  reasoningSummary: z.string(),
  claims: z.array(z.object({ claim: z.string(), type: z.enum(["observed", "provider_data", "inference"]), evidenceId: z.string().nullable() })),
});

export type BusinessAnalysis = z.infer<typeof businessAnalysisSchema>;
