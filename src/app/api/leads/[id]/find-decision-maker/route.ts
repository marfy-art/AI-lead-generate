import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendDecisionMakers } from "@/services/decision-maker";

const requestSchema = z.object({ service:z.string().trim().min(2).max(100), companySize:z.enum(["small","mid_large"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid decision-maker request",issues:parsed.error.issues},{status:400});
  return NextResponse.json({leadId:id,recommendation:recommendDecisionMakers(parsed.data),mode:"role_recommendation"});
}
