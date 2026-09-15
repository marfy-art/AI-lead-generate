import { NextResponse } from "next/server";
import { z } from "zod";
import { UnsafeUrlError, validateExternalUrl } from "@/lib/security/url";
import { extractPublicPage } from "@/services/web-extraction";

const requestSchema = z.object({ url: z.string().trim().min(1).max(2048) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid extraction request", issues: parsed.error.issues }, { status: 400 });
  try {
    validateExternalUrl(parsed.data.url);
    if (process.env.ENABLE_PUBLIC_WEB_FETCH !== "true") return NextResponse.json({ projectId: id, mode: "disabled", error: "Public web extraction is disabled until source-policy review is complete." }, { status: 503 });
    const page = await extractPublicPage(parsed.data.url);
    return NextResponse.json({ projectId: id, page });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: error instanceof UnsafeUrlError ? 400 : 502 });
  }
}
