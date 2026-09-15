import {and,desc,eq} from "drizzle-orm";
import {db} from "../../lib/db/client";
import {aiModelConfigs} from "../../lib/db/schema";
import {decryptSecret,encryptionPersistenceReady,encryptSecret} from "../../lib/security/encryption";
import {activateAiConfig,addAiConfig,listAiConfigs,removeAiConfig,resolveActiveAiConfig,type AiProvider,type PublicAiConfig} from "../ai-models";

function publicRow(row:typeof aiModelConfigs.$inferSelect):PublicAiConfig{return {id:row.id,workspaceId:row.workspaceId,name:row.name,provider:row.provider as AiProvider,baseUrl:row.baseUrl,model:row.model,maskedKey:row.maskedKey,active:row.active,createdAt:row.createdAt.toISOString()};}

export async function listAiConfigsPersistent(workspaceId:string){if(!db)return listAiConfigs(workspaceId);const rows=await db.select().from(aiModelConfigs).where(eq(aiModelConfigs.workspaceId,workspaceId)).orderBy(desc(aiModelConfigs.createdAt));return rows.map(publicRow);}

export async function addAiConfigPersistent(input:{workspaceId:string;name:string;provider:AiProvider;baseUrl:string;model:string;apiKey:string;active?:boolean}){
  if(!db)return addAiConfig(input);
  if(!encryptionPersistenceReady())throw new Error("APP_ENCRYPTION_KEY is required before AI keys can be stored in PostgreSQL.");
  return db.transaction(async tx=>{
    if(input.active)await tx.update(aiModelConfigs).set({active:false,updatedAt:new Date()}).where(eq(aiModelConfigs.workspaceId,input.workspaceId));
    const [row]=await tx.insert(aiModelConfigs).values({workspaceId:input.workspaceId,name:input.name,provider:input.provider,baseUrl:input.baseUrl,model:input.model,apiKeyEncrypted:encryptSecret(input.apiKey),maskedKey:`••••••••${input.apiKey.slice(-4)}`,active:input.active??false}).returning();
    return publicRow(row);
  });
}

export async function activateAiConfigPersistent(workspaceId:string,id:string){if(!db)return activateAiConfig(workspaceId,id);return db.transaction(async tx=>{const [target]=await tx.select().from(aiModelConfigs).where(and(eq(aiModelConfigs.id,id),eq(aiModelConfigs.workspaceId,workspaceId))).limit(1);if(!target)return null;await tx.update(aiModelConfigs).set({active:false,updatedAt:new Date()}).where(eq(aiModelConfigs.workspaceId,workspaceId));const [active]=await tx.update(aiModelConfigs).set({active:true,updatedAt:new Date()}).where(eq(aiModelConfigs.id,id)).returning();return publicRow(active);});}

export async function removeAiConfigPersistent(workspaceId:string,id:string){if(!db)return removeAiConfig(workspaceId,id);const removed=await db.delete(aiModelConfigs).where(and(eq(aiModelConfigs.id,id),eq(aiModelConfigs.workspaceId,workspaceId))).returning({id:aiModelConfigs.id});return removed.length>0;}

export async function resolveActiveAiConfigPersistent(workspaceId:string){if(!db)return resolveActiveAiConfig(workspaceId);const [row]=await db.select().from(aiModelConfigs).where(and(eq(aiModelConfigs.workspaceId,workspaceId),eq(aiModelConfigs.active,true))).limit(1);return row?{...publicRow(row),apiKey:decryptSecret(row.apiKeyEncrypted)}:null;}
