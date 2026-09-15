import type { Capability, EnrichmentInput, EnrichmentProvider, ProviderResult } from "../types";

const fixtures: Partial<Record<Capability, unknown>> = {
  company_search: [{ name: "North End Coffee", domain: "northend.example", location: "Dhaka" }],
  company_enrichment: { industry: "Hospitality", employeeCount: 58, companyPhone: "+880 2••••••••" },
  people_search: [{ fullName: "Tanvir Islam", title: "Marketing Lead", roleFitScore: 91 }],
  person_enrichment: { fullName: "Tanvir Islam", title: "Marketing Lead", currentEmploymentVerified: true },
  email_find: { value: "tanvir@northend.example", verificationStatus: "valid" },
  email_verify: { status: "verified_safe", value: "tanvir@northend.example" },
  phone_find: { value: "+880 17•• ••• 1842", phoneType: "direct_work" },
  intent_discovery: [{ type: "commercial_signal", excerpt: "New Gulshan location opening this month." }],
};

export class MockProvider implements EnrichmentProvider {
  readonly name: string;
  readonly capabilities: Capability[];
  constructor(name = "mock", capabilities: Capability[] = Object.keys(fixtures) as Capability[], private readonly confidence = 0.92, private readonly cost = 0) { this.name = name; this.capabilities = capabilities; }
  async estimateCost() { return this.cost; }
  async canRun(input: EnrichmentInput) { return this.capabilities.includes(input.capability); }
  async enrich<T>(input: EnrichmentInput): Promise<ProviderResult<T>> {
    const data = fixtures[input.capability];
    if (!data) return { success: false, error: { code: "MOCK_EMPTY", message: "No fixture for capability", retryable: false }, costUnits: 0 };
    return { success: true, data: data as T, confidence: this.confidence, providerRecordId: `mock-${input.leadId}`, costUnits: this.cost };
  }
}
