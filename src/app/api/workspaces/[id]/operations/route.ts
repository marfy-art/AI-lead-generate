import {NextResponse} from "next/server";
import {resolveWorkspace,WorkspaceAccessError} from "@/lib/workspace/context";
import {getOperationsPersistent} from "@/services/persistence/operations";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const context=await resolveWorkspace(id);return NextResponse.json({workspaceId:context.workspaceId,mode:context.mode,...await getOperationsPersistent(context.workspaceId)});}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:error.message},{status:error.status});throw error;}}
