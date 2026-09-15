import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyIntent } from "@/services/intent";

const requestSchema = z.object({
  text: z.string().trim().min(3).max(20_000),
  serviceKeywords: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  publishedAt: z.iso.datetime().nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid intent analysis request", issues: parsed.error.issues }, { status: 400 });
  return NextResponse.json({ leadId: id, intent: classifyIntent(parsed.data) });
}
