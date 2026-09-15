import {eq} from "drizzle-orm";
import {db} from "../../lib/db/client";
import {workspaceSettings} from "../../lib/db/schema";
import {getWorkspaceConfig,updateWorkspaceConfig,type WorkspaceConfig} from "../workspace-config";

function merge(current:WorkspaceConfig,input:Partial<WorkspaceConfig>):WorkspaceConfig{return {...current,...input,services:input.services?[...input.services]:current.services,providers:input.providers?input.providers.map((item,index)=>({...item,priority:index+1})):current.providers};}
export async function getWorkspaceConfigPersistent(workspaceId:string){if(!db)return getWorkspaceConfig(workspaceId);const [row]=await db.select().from(workspaceSettings).where(eq(workspaceSettings.workspaceId,workspaceId)).limit(1);return row?merge(getWorkspaceConfig("__defaults__"),row.configJson as Partial<WorkspaceConfig>):getWorkspaceConfig("__defaults__");}
export async function updateWorkspaceConfigPersistent(workspaceId:string,input:Partial<WorkspaceConfig>){if(!db)return updateWorkspaceConfig(workspaceId,input);const next=merge(await getWorkspaceConfigPersistent(workspaceId),input);await db.insert(workspaceSettings).values({workspaceId,configJson:next}).onConflictDoUpdate({target:workspaceSettings.workspaceId,set:{configJson:next,updatedAt:new Date()}});return next;}
