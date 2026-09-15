import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeBusiness } from "@/services/business-analysis";
import {recordAuditPersistent,recordUsagePersistent} from "@/services/persistence/operations";
import {isUuid,requireProjectAccess,WorkspaceAccessError} from "@/lib/workspace/context";
import {persistBusinessAnalysis} from "@/services/persistence/projects";

const requestSchema = z.object({
  input: z.string().trim().min(3).max(5000),
  goal: z.enum(["buyers", "sellers", "both"]),
  selectedServices: z.array(z.string().min(1)).max(30).optional(),
  geography: z.string().trim().min(2).max(120).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid analysis request", issues: parsed.error.issues }, { status: 400 });
  try {
    const context=await requireProjectAccess(id);
    const analysis = await analyzeBusiness(parsed.data, context.workspaceId);
    if(isUuid(id))await persistBusinessAnalysis(id,parsed.data,analysis);
    await recordUsagePersistent({workspaceId:context.workspaceId,projectId:id,provider:analysis.mode==="live"?"active_ai_model":"mock",capability:"business_analysis",units:1,estimatedCost:0,status:"success"});
    await recordAuditPersistent({workspaceId:context.workspaceId,action:"project.analysis_completed",entityType:"project",entityId:id,metadata:{mode:analysis.mode}});
    return NextResponse.json({ projectId: id, analysis });
  } catch (error) {
    if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});
    await recordUsagePersistent({workspaceId:"demo",projectId:id,provider:"active_ai_model",capability:"business_analysis",units:1,estimatedCost:0,status:"failed"});
    return NextResponse.json({error:error instanceof Error?error.message:"AI analysis failed."},{status:502});
  }
}
