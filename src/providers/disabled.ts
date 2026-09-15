import type { Capability, EnrichmentInput, EnrichmentProvider, ProviderResult } from "./types";

export class CredentialProvider implements EnrichmentProvider {
  constructor(public readonly name: string, public readonly capabilities: Capability[], private readonly envKey: string) {}
  async estimateCost() { return 1; }
  async canRun() { return Boolean(process.env[this.envKey]); }
  async enrich<T>(input: EnrichmentInput): Promise<ProviderResult<T>> {
    void input;
    if (!process.env[this.envKey]) return { success: false, error: { code: "MISSING_CREDENTIAL", message: `${this.name} is disabled until ${this.envKey} is configured.`, retryable: false } };
    return { success: false, error: { code: "NOT_IMPLEMENTED", message: `${this.name} transport is not implemented yet.`, retryable: false } };
  }
}

export const apolloProvider = new CredentialProvider("apollo", ["company_search","company_enrichment","people_search","person_enrichment","email_find","phone_find"], "APOLLO_API_KEY");
export const hunterProvider = new CredentialProvider("hunter", ["company_enrichment","people_search","email_find","email_verify"], "HUNTER_API_KEY");
export const placesProvider = new CredentialProvider("google_places", ["company_search","company_enrichment"], "GOOGLE_MAPS_API_KEY");
