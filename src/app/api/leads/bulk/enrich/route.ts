import {NextResponse} from "next/server";
import {z} from "zod";
import {resolveWorkspace,WorkspaceAccessError} from "@/lib/workspace/context";
import {providersForWorkspace} from "@/services/enrichment/providers";
import {runWaterfall} from "@/services/enrichment/waterfall";
import {recordAuditPersistent,recordUsagePersistent} from "@/services/persistence/operations";

const schema=z.object({leadIds:z.array(z.string().min(1)).min(1).max(100),projectId:z.string().min(1),capability:z.enum(["company_search","company_enrichment","people_search","person_enrichment","email_find","email_verify","phone_find","intent_discovery"]).default("email_find"),budget:z.number().min(0).max(10000).default(0),confidenceThreshold:z.number().min(0).max(1).default(.85)});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid bulk enrichment request",issues:parsed.error.issues},{status:400});
  try{
    const {workspaceId}=await resolveWorkspace("demo");
    const providers=await providersForWorkspace(workspaceId,parsed.data.capability);
    let remaining=parsed.data.budget;
    const results=[];
    for(const leadId of parsed.data.leadIds){
      const result=await runWaterfall(providers,{leadId,projectId:parsed.data.projectId,capability:parsed.data.capability},{budget:remaining,confidenceThreshold:parsed.data.confidenceThreshold});
      remaining=Math.max(0,remaining-result.spent);
      await Promise.all(result.attempts.map(attempt=>recordUsagePersistent({workspaceId,projectId:parsed.data.projectId,provider:attempt.provider,capability:attempt.capability,units:attempt.costUnits,estimatedCost:attempt.costUnits,status:attempt.status})));
      results.push({leadId,...result});
    }
    await recordAuditPersistent({workspaceId,action:"lead.bulk_enriched",entityType:"project",entityId:parsed.data.projectId,metadata:{leadCount:results.length,spent:parsed.data.budget-remaining}});
    return NextResponse.json({mode:providers[0]?.name==="mock"?"mock":"live",results,spent:parsed.data.budget-remaining,remainingBudget:remaining});
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
