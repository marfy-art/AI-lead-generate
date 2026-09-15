import type { EnrichmentInput, EnrichmentProvider, ProviderAttempt, WaterfallResult } from "../../providers/types";

export async function runWaterfall<T>(providers: EnrichmentProvider[], input: EnrichmentInput, options: { budget: number; confidenceThreshold: number }): Promise<WaterfallResult<T>> {
  const attempts: ProviderAttempt[] = [];
  let spent = 0;
  let blockedByBudget = false;
  for (const provider of providers) {
    if (!(await provider.canRun(input))) { attempts.push({ provider: provider.name, capability: input.capability, status: "skipped", costUnits: 0, reason: "disabled_or_unsupported" }); continue; }
    const cost = await provider.estimateCost(input);
    if (spent + cost > options.budget) { blockedByBudget=true; attempts.push({provider:provider.name,capability:input.capability,status:"skipped",costUnits:0,reason:"budget_insufficient"}); continue; }
    const result = await provider.enrich<T>(input);
    spent += result.costUnits ?? cost;
    attempts.push({ provider: provider.name, capability: input.capability, status: result.success ? "success" : "failed", costUnits: result.costUnits ?? cost, reason: result.error?.code });
    if (result.success && (result.confidence ?? 0) >= options.confidenceThreshold) return { result, attempts, spent, stoppedBecause: "quality_met" };
  }
  return { attempts, spent, stoppedBecause: blockedByBudget ? "budget_exhausted" : "providers_exhausted" };
}
