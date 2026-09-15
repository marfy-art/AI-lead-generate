import {NextResponse} from "next/server";
import {z} from "zod";
import {inngest,inngestConfigured} from "@/inngest/client";
import {WorkspaceAccessError,isUuid,requireProjectAccess} from "@/lib/workspace/context";
import {discoverMockCandidates} from "@/services/discovery";
import {recordAuditPersistent} from "@/services/persistence/operations";
import {createJobPersistent,getJobPersistent,runJobPersistent} from "@/services/persistence/jobs";

const schema=z.object({type:z.literal("discovery"),side:z.enum(["buyer","seller","both"]).default("both"),services:z.array(z.string().min(1)).min(1).max(30),geography:z.string().min(2).max(120).default("Dhaka, Bangladesh")});
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const jobId=new URL(request.url).searchParams.get("jobId");if(!jobId)return NextResponse.json({error:"jobId is required"},{status:400});try{await requireProjectAccess(id);const job=await getJobPersistent(jobId);if(!job||job.projectId!==id)return NextResponse.json({error:"Job not found"},{status:404});return NextResponse.json({job,mode:process.env.DATABASE_URL?"postgres":"memory_mock"});}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid job request",issues:parsed.error.issues},{status:400});
  try{
    const context=await requireProjectAccess(id);
    const job=await createJobPersistent(id,parsed.data.type,parsed.data);
    if(inngestConfigured()&&isUuid(id)){
      const event=await inngest.send({name:"signaldesk/discovery.requested",data:{jobId:job.id,projectId:id,side:parsed.data.side,services:parsed.data.services,geography:parsed.data.geography}});
      await recordAuditPersistent({workspaceId:context.workspaceId,action:"job.queued",entityType:"job",entityId:job.id,metadata:{type:job.type,scheduler:"inngest",eventIds:event.ids}});
      return NextResponse.json({job,eventIds:event.ids,mode:"inngest"},{status:202});
    }
    const completed=await runJobPersistent(job.id,()=>discoverMockCandidates({projectId:id,...parsed.data}),3);
    await recordAuditPersistent({workspaceId:context.workspaceId,action:`job.${completed.status}`,entityType:"job",entityId:completed.id,metadata:{type:completed.type,attempts:completed.attempts,scheduler:"local"}});
    return NextResponse.json({job:completed,mode:context.mode},{status:completed.status==="completed"?201:500});
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
