import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverMockCandidates } from "@/services/discovery";
import { classifyIntent } from "@/services/intent";
import { qualifiesForEnrichment } from "@/lib/scoring/lead-score";
import {recordAuditPersistent} from "@/services/persistence/operations";
import {isUuid,requireProjectAccess,WorkspaceAccessError} from "@/lib/workspace/context";
import {persistDiscoveredCandidates} from "@/services/persistence/projects";

const requestSchema = z.object({
  side: z.enum(["buyer", "seller", "both"]).default("both"),
  services: z.array(z.string().trim().min(1).max(100)).min(1).max(30).default(["Photography", "Graphic Design"]),
  geography: z.string().trim().min(2).max(120).default("Dhaka, Bangladesh"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid discovery request", issues: parsed.error.issues }, { status: 400 });

  try{
  const context=await requireProjectAccess(id);
  const result = await discoverMockCandidates({ projectId: id, ...parsed.data });
  const candidates = result.candidates.map((candidate) => {
    const intent = classifyIntent({ text: candidate.evidenceExcerpt, serviceKeywords: parsed.data.services, publishedAt: candidate.publishedAt });
    const qualifies = candidate.side === "seller"
      ? qualifiesForEnrichment({ explicitIntentScore: 0, icpScore: 0, commercialSignalScore: 0, sellerFitScore: Math.round(candidate.confidence * 100) })
      : qualifiesForEnrichment({ explicitIntentScore: intent.intentType === "explicit" ? intent.intentScore : 0, icpScore: Math.round(candidate.confidence * 100), commercialSignalScore: intent.intentType === "commercial_signal" ? intent.intentScore : 0, sellerFitScore: 0 });
    return { ...candidate, intent, qualification: qualifies ? "qualified" as const : "watchlist" as const };
  });

  const summary={ discovered: candidates.length + result.duplicates.length, unique: candidates.length, duplicatesRemoved: result.duplicates.length, qualified: candidates.filter(candidate => candidate.qualification === "qualified").length };
  if(isUuid(id))await persistDiscoveredCandidates(id,candidates);
  await recordAuditPersistent({workspaceId:context.workspaceId,action:"project.discovery_completed",entityType:"project",entityId:id,metadata:summary});
  return NextResponse.json({ projectId: id, mode: result.mode, candidates, duplicates: result.duplicates, summary });
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
