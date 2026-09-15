import {NextResponse} from "next/server";
import {z} from "zod";
import {UnsafeUrlError,validateExternalUrl} from "@/lib/security/url";
import {WorkspaceAccessError,resolveWorkspace} from "@/lib/workspace/context";
import {activateAiConfigPersistent,addAiConfigPersistent,listAiConfigsPersistent,removeAiConfigPersistent} from "@/services/persistence/ai-models";
import {recordAuditPersistent} from "@/services/persistence/operations";

const createSchema=z.object({name:z.string().trim().min(2).max(80),provider:z.enum(["openai","openai_compatible"]),baseUrl:z.url().max(500),model:z.string().trim().min(2).max(150),apiKey:z.string().trim().min(8).max(500),active:z.boolean().default(true)});

function accessError(error:unknown){return error instanceof WorkspaceAccessError?NextResponse.json({error:error.message},{status:error.status}):null;}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const context=await resolveWorkspace(id);return NextResponse.json({workspaceId:context.workspaceId,mode:context.mode,configs:await listAiConfigsPersistent(context.workspaceId)});}catch(error){const response=accessError(error);if(response)return response;throw error;}}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid AI model configuration",issues:parsed.error.issues},{status:400});
  try{
    const context=await resolveWorkspace(id);
    const url=validateExternalUrl(parsed.data.baseUrl);
    if(url.protocol!=="https:")throw new UnsafeUrlError("AI API base URL must use HTTPS.");
    const config=await addAiConfigPersistent({workspaceId:context.workspaceId,...parsed.data,baseUrl:url.toString().replace(/\/$/,"")});
    await recordAuditPersistent({workspaceId:context.workspaceId,action:"ai_model.added",entityType:"ai_model",entityId:config.id,metadata:{provider:config.provider,model:config.model,active:config.active}});
    return NextResponse.json({config,mode:context.mode},{status:201});
  }catch(error){const response=accessError(error);if(response)return response;return NextResponse.json({error:error instanceof Error?error.message:"Invalid API URL."},{status:400});}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const parsed=z.object({configId:z.string().uuid(),active:z.literal(true)}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid activation request"},{status:400});
  try{const context=await resolveWorkspace(id);const config=await activateAiConfigPersistent(context.workspaceId,parsed.data.configId);if(!config)return NextResponse.json({error:"Configuration not found"},{status:404});await recordAuditPersistent({workspaceId:context.workspaceId,action:"ai_model.activated",entityType:"ai_model",entityId:config.id,metadata:{model:config.model}});return NextResponse.json({config,mode:context.mode});}catch(error){const response=accessError(error);if(response)return response;throw error;}
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const configId=new URL(request.url).searchParams.get("configId");
  if(!configId)return NextResponse.json({error:"configId is required"},{status:400});
  try{const context=await resolveWorkspace(id);const removed=await removeAiConfigPersistent(context.workspaceId,configId);if(removed)await recordAuditPersistent({workspaceId:context.workspaceId,action:"ai_model.removed",entityType:"ai_model",entityId:configId,metadata:{}});return NextResponse.json({removed,mode:context.mode},{status:removed?200:404});}catch(error){const response=accessError(error);if(response)return response;throw error;}
}
