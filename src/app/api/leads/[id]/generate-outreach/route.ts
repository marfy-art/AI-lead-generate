import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOutreachDraft } from "@/services/outreach";

const requestSchema = z.object({
  companyName:z.string().trim().min(1).max(200),
  personName:z.string().trim().max(200).nullable().optional(),
  service:z.string().trim().min(1).max(100),
  intentStatus:z.enum(["explicit","inferred","fit"]),
  evidence:z.array(z.object({id:z.string().min(1),text:z.string().trim().min(1).max(1000),type:z.enum(["observed","provider_data","inference"])})).max(20),
  channels:z.object({verifiedWorkEmail:z.boolean().optional(),directBusinessPhone:z.boolean().optional(),professionalSocial:z.boolean().optional(),businessMessaging:z.boolean().optional()}),
  suppressed:z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid outreach request",issues:parsed.error.issues},{status:400});
  const draft = generateOutreachDraft(parsed.data);
  return NextResponse.json({leadId:id,draft,requiresHumanReview:true},{status:draft.recommendedChannel === "none" ? 422 : 200});
}
