export type JobStatus="queued"|"running"|"completed"|"failed";
export type JobRecord={id:string;projectId:string;type:string;status:JobStatus;attempts:number;error:string|null;createdAt:string;updatedAt:string;result?:unknown;payload?:unknown};
const jobs=new Map<string,JobRecord>();
export function createJob(projectId:string,type:string,payload?:unknown){const now=new Date().toISOString();const job:JobRecord={id:crypto.randomUUID(),projectId,type,status:"queued",attempts:0,error:null,createdAt:now,updatedAt:now,payload};jobs.set(job.id,job);return job;}
export function getJob(id:string){return jobs.get(id)??null;}
export function listJobs(){return [...jobs.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export function resetJobForRetry(id:string){const job=jobs.get(id);if(!job||job.status!=="failed")return null;job.status="queued";job.attempts=0;job.error=null;job.updatedAt=new Date().toISOString();return job;}
export async function runJob<T>(id:string,action:()=>Promise<T>,options:{maxAttempts?:number;retryable?:(error:unknown)=>boolean}={}){const job=jobs.get(id);if(!job)throw new Error("Job not found.");const maxAttempts=options.maxAttempts??3;job.status="running";job.updatedAt=new Date().toISOString();while(job.attempts<maxAttempts){job.attempts++;try{const result=await action();job.status="completed";job.result=result;job.error=null;job.updatedAt=new Date().toISOString();return job;}catch(error){job.error=error instanceof Error?error.message:"Job failed.";job.updatedAt=new Date().toISOString();if(job.attempts>=maxAttempts||options.retryable?.(error)===false){job.status="failed";return job;}}}job.status="failed";return job;}
export function clearJobsForTests(){jobs.clear();}
