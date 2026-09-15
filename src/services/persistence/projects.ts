import {db} from "../../lib/db/client";
import {businessProfiles,companies,intentSignals,leadCandidates,projects} from "../../lib/db/schema";
import {normalizeDomain} from "../../lib/normalization";
import type {BusinessAnalysis} from "../../lib/ai/schemas";
import type {DiscoveredCandidate} from "../discovery";

export type CreateProjectInput={workspaceId:string;name:string;goal:"buyers"|"sellers"|"both";targetGeographies:string[];desiredLeadCount:number;enrichmentBudget:number};

export async function persistProject(input:CreateProjectInput){
  if(!db)return null;
  const [project]=await db.insert(projects).values({...input,enrichmentBudget:String(input.enrichmentBudget)}).returning();
  return project;
}

export async function persistBusinessAnalysis(projectId:string,input:{input:string;goal:string;selectedServices?:string[];geography?:string},analysis:BusinessAnalysis){
  if(!db)return;
  await db.insert(businessProfiles).values({projectId,inputType:/^https?:\/\//i.test(input.input)?"url":"text",inputValue:input.input,businessName:null,domain:/^https?:\/\//i.test(input.input)?normalizeDomain(input.input):null,summary:analysis.businessSummary,businessModel:analysis.businessModel,analysisJson:{...analysis,request:{goal:input.goal,selectedServices:input.selectedServices,geography:input.geography}}});
}

export async function persistDiscoveredCandidates(projectId:string,candidates:Array<DiscoveredCandidate&{intent:{intentType:string;intentScore:number;reasoningSummary:string};qualification:string}>){
  if(!db)return;
  await db.transaction(async tx=>{
    for(const candidate of candidates){
      const domain=candidate.domain?normalizeDomain(candidate.domain):null;
      let companyId:string;
      if(domain){
        const [company]=await tx.insert(companies).values({normalizedDomain:domain,name:candidate.companyName,website:candidate.domain,locationJson:{display:candidate.location}}).onConflictDoUpdate({target:companies.normalizedDomain,set:{name:candidate.companyName,website:candidate.domain,locationJson:{display:candidate.location},updatedAt:new Date()}}).returning({id:companies.id});
        companyId=company.id;
      }else{
        const [company]=await tx.insert(companies).values({name:candidate.companyName,locationJson:{display:candidate.location}}).returning({id:companies.id});
        companyId=company.id;
      }
      const [lead]=await tx.insert(leadCandidates).values({projectId,side:candidate.side,companyId,discoverySource:candidate.sourceName,discoverySourceUrl:candidate.sourceUrl,status:candidate.qualification}).returning({id:leadCandidates.id});
      await tx.insert(intentSignals).values({leadCandidateId:lead.id,signalType:candidate.intent.intentType,explicitOrInferred:candidate.isInferred?"inferred":"observed",sourceName:candidate.sourceName,sourceUrl:candidate.sourceUrl,evidenceExcerpt:candidate.evidenceExcerpt,publishedAt:candidate.publishedAt?new Date(candidate.publishedAt):null,capturedAt:new Date(candidate.capturedAt),confidence:candidate.confidence,rawJson:{serviceCategory:candidate.serviceCategory,intentScore:candidate.intent.intentScore,reasoningSummary:candidate.intent.reasoningSummary,providerCompanyId:candidate.providerCompanyId}});
    }
  });
}
