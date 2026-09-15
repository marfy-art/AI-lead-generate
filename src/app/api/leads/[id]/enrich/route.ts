import { NextResponse } from "next/server";
import { z } from "zod";
import { runWaterfall } from "@/services/enrichment/waterfall";
import {providersForWorkspace} from "@/services/enrichment/providers";
import {recordAuditPersistent,recordUsagePersistent} from "@/services/persistence/operations";
import {resolveWorkspace,WorkspaceAccessError} from "@/lib/workspace/context";

const capabilitySchema = z.enum(["company_search","company_enrichment","people_search","person_enrichment","email_find","email_verify","phone_find","intent_discovery"]);
const requestSchema = z.object({ capability:capabilitySchema, projectId:z.string().min(1).max(200), companyName:z.string().max(200).optional(), domain:z.string().max(253).optional(), personName:z.string().max(200).optional(), email:z.email().optional(), targetRoles:z.array(z.string().max(100)).max(20).optional(), budget:z.number().min(0).max(10_000).default(0), confidenceThreshold:z.number().min(0).max(1).default(.85) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid enrichment request",issues:parsed.error.issues},{status:400});
  try{
    const {budget,confidenceThreshold,...input} = parsed.data;
    const {workspaceId}=await resolveWorkspace("demo");
    const providers=await providersForWorkspace(workspaceId,input.capability);
    const result = await runWaterfall(providers,{...input,leadId:id},{budget,confidenceThreshold});
    await Promise.all(result.attempts.map(attempt=>recordUsagePersistent({workspaceId,projectId:input.projectId,provider:attempt.provider,capability:attempt.capability,units:attempt.costUnits,estimatedCost:attempt.costUnits,status:attempt.status})));
    await recordAuditPersistent({workspaceId,action:"lead.enriched",entityType:"lead",entityId:id,metadata:{capability:input.capability,spent:result.spent,stoppedBecause:result.stoppedBecause}});
    return NextResponse.json({leadId:id,mode:providers[0]?.name==="mock"?"mock":"live",...result});
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
