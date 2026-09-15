export type Capability = "company_search" | "company_enrichment" | "people_search" | "person_enrichment" | "email_find" | "email_verify" | "phone_find" | "intent_discovery";

export type EnrichmentInput = { capability: Capability; projectId: string; leadId: string; companyName?: string; domain?: string; personName?: string; email?: string; targetRoles?: string[] };
export type ProviderError = { code: string; message: string; retryable: boolean };
export type ProviderResult<T = unknown> = { success: boolean; data?: T; confidence?: number; providerRecordId?: string; sourceUrl?: string; costUnits?: number; error?: ProviderError };

export interface EnrichmentProvider {
  readonly name: string;
  readonly capabilities: Capability[];
  estimateCost(input: EnrichmentInput): Promise<number>;
  canRun(input: EnrichmentInput): Promise<boolean>;
  enrich<T = unknown>(input: EnrichmentInput): Promise<ProviderResult<T>>;
}

export type ProviderAttempt = { provider: string; capability: Capability; status: "success" | "failed" | "skipped"; costUnits: number; reason?: string };
export type WaterfallResult<T> = { result?: ProviderResult<T>; attempts: ProviderAttempt[]; spent: number; stoppedBecause: "quality_met" | "budget_exhausted" | "providers_exhausted" };
