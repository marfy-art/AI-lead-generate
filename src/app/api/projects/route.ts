import { NextResponse } from "next/server";
import { z } from "zod";
import {persistProject} from "@/services/persistence/projects";
import {resolveWorkspace,WorkspaceAccessError} from "@/lib/workspace/context";

const createProjectSchema = z.object({ name: z.string().trim().min(2).max(120), goal: z.enum(["buyers","sellers","both"]), targetGeographies: z.array(z.string().min(2)).min(1), desiredLeadCount: z.number().int().min(1).max(1000), enrichmentBudget: z.number().min(0) });
export async function POST(request: Request) {
  const parsed = createProjectSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project", issues: parsed.error.issues }, { status: 400 });
  try{
    const context=await resolveWorkspace("demo");
    const project=await persistProject({workspaceId:context.workspaceId,...parsed.data});
    return NextResponse.json(project?{...project,mock:false}:{id:crypto.randomUUID(),status:"draft",mock:true,...parsed.data},{status:201});
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
