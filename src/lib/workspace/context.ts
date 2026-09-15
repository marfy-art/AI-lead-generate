import {and,eq} from "drizzle-orm";
import {db} from "../db/client";
import {users,workspaceMembers,workspaces,projects} from "../db/schema";
import {createClient} from "../supabase/server";

export class WorkspaceAccessError extends Error{
  constructor(message:string,readonly status:401|403|404=401){super(message);this.name="WorkspaceAccessError";}
}
export function isUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}

export async function resolveWorkspace(requestedId="demo"){
  if(!db)return {workspaceId:requestedId,mode:"memory_mock" as const,userId:null};
  const supabase=await createClient();
  const {data,error}=supabase?await supabase.auth.getUser():{data:{user:null},error:new Error("Auth unavailable")};
  if(error||!data.user?.email)throw new WorkspaceAccessError("Sign in is required before using database-backed workspaces.");
  const authUser=data.user;
  const email=authUser.email as string;
  let [appUser]=await db.select().from(users).where(eq(users.id,authUser.id)).limit(1);
  if(!appUser){
    const [emailUser]=await db.select().from(users).where(eq(users.email,email)).limit(1);
    if(emailUser)appUser=emailUser;
    else [appUser]=await db.insert(users).values({id:authUser.id,email,name:typeof authUser.user_metadata?.name==="string"?authUser.user_metadata.name:null}).returning();
  }
  if(requestedId!=="demo"){
    const [membership]=await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId,requestedId),eq(workspaceMembers.userId,appUser.id))).limit(1);
    if(!membership)throw new WorkspaceAccessError("Workspace not found or access is not allowed.",404);
    return {workspaceId:requestedId,mode:"postgres" as const,userId:appUser.id};
  }
  const [membership]=await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId,appUser.id)).limit(1);
  if(membership)return {workspaceId:membership.workspaceId,mode:"postgres" as const,userId:appUser.id};
  const workspaceId=crypto.randomUUID();
  await db.transaction(async tx=>{
    await tx.insert(workspaces).values({id:workspaceId,name:"Kriyakarak",ownerId:appUser.id});
    await tx.insert(workspaceMembers).values({workspaceId,userId:appUser.id,role:"owner"});
  });
  return {workspaceId,mode:"postgres" as const,userId:appUser.id};
}

export async function requireProjectAccess(projectId:string){
  const context=await resolveWorkspace("demo");
  if(!db||!isUuid(projectId))return context;
  const [project]=await db.select({id:projects.id}).from(projects).where(and(eq(projects.id,projectId),eq(projects.workspaceId,context.workspaceId))).limit(1);
  if(!project)throw new WorkspaceAccessError("Project not found or access is not allowed.",404);
  return context;
}
