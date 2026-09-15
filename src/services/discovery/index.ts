import { deduplicateCandidates } from "../../lib/deduplication";

export type DiscoveredCandidate = { id: string; side: "buyer"|"seller"; companyName: string; domain?: string; providerCompanyId?: string; location: string; sourceName: string; sourceUrl: string | null; serviceCategory: string; evidenceExcerpt: string; publishedAt: string | null; capturedAt: string; isInferred: boolean; confidence: number };

export async function discoverMockCandidates(input: { projectId: string; side?: "buyer"|"seller"|"both"; services?: string[]; geography?: string }) {
  const now = new Date().toISOString();
  const services = input.services?.length ? input.services : ["Photography","Graphic Design"];
  const fixtures: DiscoveredCandidate[] = [
    { id:`${input.projectId}-b1`, side:"buyer", companyName:"Shonar Bangla Kitchen", domain:"shonarbangla.example", providerCompanyId:"places-demo-1", location:input.geography??"Dhaka", sourceName:"mock_public_web", sourceUrl:null, serviceCategory:services[0], evidenceExcerpt:"Announcing a new Dhanmondi branch opening this month.", publishedAt:now, capturedAt:now, isInferred:true, confidence:.82 },
    { id:`${input.projectId}-b2`, side:"buyer", companyName:"Dhaka Makers", domain:"dhakamakers.example", providerCompanyId:"places-demo-2", location:input.geography??"Dhaka", sourceName:"mock_public_web", sourceUrl:null, serviceCategory:services[1]??services[0], evidenceExcerpt:"Looking for a local designer for an upcoming product catalog.", publishedAt:now, capturedAt:now, isInferred:false, confidence:.96 },
    { id:`${input.projectId}-s1`, side:"seller", companyName:"Lensfolk Studio", domain:"lensfolk.example", providerCompanyId:"hunter-demo-1", location:input.geography??"Dhaka", sourceName:"mock_hunter_discover", sourceUrl:null, serviceCategory:services[0], evidenceExcerpt:"Commercial photography portfolio with recent food and product work.", publishedAt:null, capturedAt:now, isInferred:false, confidence:.9 },
    { id:`${input.projectId}-dup`, side:"seller", companyName:"Lensfolk Studio", domain:"https://www.lensfolk.example/about", location:input.geography??"Dhaka", sourceName:"mock_public_web", sourceUrl:null, serviceCategory:services[0], evidenceExcerpt:"Duplicate source record retained in dedupe log.", publishedAt:null, capturedAt:now, isInferred:false, confidence:.75 },
  ];
  const filtered = fixtures.filter(candidate=>input.side === "both" || !input.side || candidate.side===input.side);
  const { unique, duplicates } = deduplicateCandidates(filtered.map(candidate=>({...candidate,companyName:candidate.companyName})));
  return { candidates:unique, duplicates:duplicates.map(item=>({id:item.candidate.id,matchedKey:item.matchedKey})), mode:"mock" as const };
}
