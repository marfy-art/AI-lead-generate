import { normalizeDomain, normalizePhone } from "../normalization";

export type DedupCandidate = { id: string; domain?: string | null; providerCompanyId?: string | null; companyName?: string | null; location?: string | null; socialUrl?: string | null; email?: string | null; phone?: string | null };

function normalizeText(value?: string | null) { return value?.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g," ").trim() ?? ""; }
function keys(candidate: DedupCandidate) {
  const result: string[] = [];
  if (candidate.domain) result.push(`domain:${normalizeDomain(candidate.domain)}`);
  if (candidate.providerCompanyId) result.push(`provider:${candidate.providerCompanyId.toLowerCase()}`);
  if (candidate.companyName && candidate.location) result.push(`company-location:${normalizeText(candidate.companyName)}:${normalizeText(candidate.location)}`);
  if (candidate.socialUrl) result.push(`social:${candidate.socialUrl.toLowerCase().replace(/\/$/,"")}`);
  if (candidate.email) result.push(`email:${candidate.email.trim().toLowerCase()}`);
  if (candidate.phone) result.push(`phone:${normalizePhone(candidate.phone)}`);
  return result;
}

export function deduplicateCandidates<T extends DedupCandidate>(candidates: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];
  const duplicates: { candidate: T; matchedKey: string }[] = [];
  for (const candidate of candidates) {
    const candidateKeys = keys(candidate);
    const matchedKey = candidateKeys.find(key=>seen.has(key));
    if (matchedKey) { duplicates.push({candidate,matchedKey}); continue; }
    candidateKeys.forEach(key=>seen.add(key));
    unique.push(candidate);
  }
  return { unique, duplicates };
}
