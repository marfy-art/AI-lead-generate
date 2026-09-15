import { NextResponse } from "next/server";
import { leads } from "@/lib/mock-data";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ projectId: id, mode: "mock", leads }); }
