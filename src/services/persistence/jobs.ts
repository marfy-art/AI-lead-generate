import {and,desc,eq} from "drizzle-orm";
import {db} from "../../lib/db/client";
import {backgroundJobs,projects} from "../../lib/db/schema";
import {isUuid} from "../../lib/workspace/context";
import {createJob,getJob,listJobs,resetJobForRetry,runJob,type JobRecord} from "../jobs";

function fromRow(row:typeof backgroundJobs.$inferSelect):JobRecord{return {id:row.id,projectId:row.projectId,type:row.type,status:row.status as JobRecord["status"],attempts:row.attempts,error:row.errorMessage,createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),result:row.resultJson??undefined,payload:row.payloadJson};}

export async function createJobPersistent(projectId:string,type:string,payload?:unknown){
  if(!db||!isUuid(projectId))return createJob(projectId,type,payload);
  const [row]=await db.insert(backgroundJobs).values({projectId,type,payloadJson:payload??{},maxAttempts:3}).returning();
  return fromRow(row);
}

export async function getJobPersistent(id:string){
  const memory=getJob(id);
  if(memory||!db)return memory;
  const [row]=await db.select().from(backgroundJobs).where(eq(backgroundJobs.id,id)).limit(1);
  return row?fromRow(row):null;
}

export async function listJobsPersistent(workspaceId:string){
  if(!db)return listJobs();
  const rows=await db.select({job:backgroundJobs}).from(backgroundJobs).innerJoin(projects,and(eq(backgroundJobs.projectId,projects.id),eq(projects.workspaceId,workspaceId))).orderBy(desc(backgroundJobs.updatedAt));
  return [...listJobs(),...rows.map(row=>fromRow(row.job))].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}

export async function resetJobForRetryPersistent(id:string){
  if(getJob(id))return resetJobForRetry(id);
  if(!db)return null;
  const [row]=await db.update(backgroundJobs).set({status:"queued",attempts:0,errorCode:null,errorMessage:null,updatedAt:new Date()}).where(and(eq(backgroundJobs.id,id),eq(backgroundJobs.status,"failed"))).returning();
  return row?fromRow(row):null;
}

export async function runJobPersistent<T>(id:string,action:()=>Promise<T>,maxAttempts=3){
  if(getJob(id)||!db)return runJob(id,action,{maxAttempts});
  let job=await getJobPersistent(id);
  if(!job)throw new Error("Job not found.");
  await db.update(backgroundJobs).set({status:"running",updatedAt:new Date()}).where(eq(backgroundJobs.id,id));
  while(job.attempts<maxAttempts){
    job.attempts++;
    try{
      const result=await action();
      const [row]=await db.update(backgroundJobs).set({status:"completed",attempts:job.attempts,resultJson:result,errorCode:null,errorMessage:null,updatedAt:new Date()}).where(eq(backgroundJobs.id,id)).returning();
      return fromRow(row);
    }catch(error){
      const message=error instanceof Error?error.message:"Job failed.";
      const failed=job.attempts>=maxAttempts;
      const [row]=await db.update(backgroundJobs).set({status:failed?"failed":"running",attempts:job.attempts,errorCode:error instanceof Error?error.name:"JOB_FAILED",errorMessage:message,updatedAt:new Date()}).where(eq(backgroundJobs.id,id)).returning();
      job=fromRow(row);
      if(failed)return job;
    }
  }
  return job;
}
