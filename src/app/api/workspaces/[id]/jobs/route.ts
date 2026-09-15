import {NextResponse} from "next/server";
import {z} from "zod";
import {inngest,inngestConfigured} from "@/inngest/client";
import {isUuid,resolveWorkspace,WorkspaceAccessError} from "@/lib/workspace/context";
import {discoverMockCandidates} from "@/services/discovery";
import {recordAuditPersistent} from "@/services/persistence/operations";
import {getJobPersistent,listJobsPersistent,resetJobForRetryPersistent,runJobPersistent} from "@/services/persistence/jobs";

const payload=z.object({type:z.literal("discovery"),side:z.enum(["buyer","seller","both"]),services:z.array(z.string()).min(1),geography:z.string()});
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const context=await resolveWorkspace(id);return NextResponse.json({workspaceId:context.workspaceId,jobs:await listJobsPersistent(context.workspaceId),mode:context.mode});}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const body=z.object({jobId:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!body.success)return NextResponse.json({error:"Invalid retry request"},{status:400});
  try{
    const context=await resolveWorkspace(id);
    const allowedJobs=await listJobsPersistent(context.workspaceId);
    const existing=allowedJobs.find(job=>job.id===body.data.jobId)??await getJobPersistent(body.data.jobId);
    const parsed=payload.safeParse(existing?.payload);
    if(!existing||!allowedJobs.some(job=>job.id===existing.id)||!parsed.success)return NextResponse.json({error:"Retryable job not found"},{status:404});
    const job=await resetJobForRetryPersistent(existing.id);
    if(!job)return NextResponse.json({error:"Only failed jobs can be retried"},{status:409});
    if(inngestConfigured()&&isUuid(job.projectId)){
      const event=await inngest.send({name:"signaldesk/discovery.requested",data:{jobId:job.id,projectId:job.projectId,side:parsed.data.side,services:parsed.data.services,geography:parsed.data.geography}});
      await recordAuditPersistent({workspaceId:context.workspaceId,action:"job.retry_queued",entityType:"job",entityId:job.id,metadata:{scheduler:"inngest",eventIds:event.ids}});
      return NextResponse.json({job,eventIds:event.ids,mode:"inngest"},{status:202});
    }
    const completed=await runJobPersistent(job.id,()=>discoverMockCandidates({projectId:job.projectId,...parsed.data}),3);
    await recordAuditPersistent({workspaceId:context.workspaceId,action:`job.retry_${completed.status}`,entityType:"job",entityId:completed.id,metadata:{attempts:completed.attempts,scheduler:"local"}});
    return NextResponse.json({job:completed,mode:context.mode},{status:completed.status==="completed"?200:500});
  }catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}
}
