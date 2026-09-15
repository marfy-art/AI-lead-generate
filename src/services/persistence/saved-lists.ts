import {and,desc,eq} from "drizzle-orm";
import {db} from "../../lib/db/client";
import {savedViews} from "../../lib/db/schema";
import {addSavedList,listSavedLists,removeSavedList,type SavedList} from "../saved-lists";

function fromRow(row:typeof savedViews.$inferSelect):SavedList{const rule=row.ruleJson as {rule?:unknown;count?:unknown};return {id:row.id,workspaceId:row.workspaceId,name:row.name,rule:typeof rule.rule==="string"?rule.rule:"All matching leads",count:typeof rule.count==="number"?rule.count:0,createdAt:row.createdAt.toISOString(),system:row.system};}
export async function listSavedListsPersistent(workspaceId:string){if(!db)return listSavedLists(workspaceId);let rows=await db.select().from(savedViews).where(eq(savedViews.workspaceId,workspaceId)).orderBy(desc(savedViews.createdAt));if(!rows.length){const seeds=listSavedLists("__system_seed__");rows=await db.insert(savedViews).values(seeds.map(item=>({workspaceId,name:item.name,ruleJson:{rule:item.rule,count:item.count},system:true}))).returning();}return rows.map(fromRow);}
export async function addSavedListPersistent(input:{workspaceId:string;name:string;rule:string}){if(!db)return addSavedList(input);const [row]=await db.insert(savedViews).values({workspaceId:input.workspaceId,name:input.name,ruleJson:{rule:input.rule,count:0},system:false}).returning();return fromRow(row);}
export async function removeSavedListPersistent(workspaceId:string,id:string){if(!db)return removeSavedList(workspaceId,id);const rows=await db.delete(savedViews).where(and(eq(savedViews.id,id),eq(savedViews.workspaceId,workspaceId),eq(savedViews.system,false))).returning({id:savedViews.id});return rows.length>0;}
