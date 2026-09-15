import { createHmac } from "node:crypto";
import { normalizeDomain, normalizePhone } from "../../lib/normalization";

export type SuppressionType="email"|"phone"|"domain";
export type SuppressionEntry={id:string;workspaceId:string;type:SuppressionType;hash:string;label:string;reason:string|null;createdAt:string};
const entries=new Map<string,SuppressionEntry>();

function normalize(type:SuppressionType,value:string){return type==="email"?value.trim().toLowerCase():type==="phone"?normalizePhone(value):normalizeDomain(value);}
export function hashSuppression(type:SuppressionType,value:string){return createHmac("sha256",process.env.APP_ENCRYPTION_KEY||"signaldesk-mock-only").update(`${type}:${normalize(type,value)}`).digest("hex");}
export function maskSuppression(type:SuppressionType,value:string){const normalized=normalize(type,value);if(type==="email"){const [name,domain]=normalized.split("@");return `${name?.slice(0,2)||"**"}***@${domain||"unknown"}`;}if(type==="phone")return `${normalized.slice(0,4)}••••${normalized.slice(-3)}`;return normalized;}

export function addSuppression(input:{workspaceId:string;type:SuppressionType;value:string;reason?:string|null}){
  const normalizedHash=hashSuppression(input.type,input.value);const storageKey=`${input.workspaceId}:${normalizedHash}`;
  const existing=entries.get(storageKey);if(existing)return existing;
  const entry:SuppressionEntry={id:crypto.randomUUID(),workspaceId:input.workspaceId,type:input.type,hash:normalizedHash,label:maskSuppression(input.type,input.value),reason:input.reason??null,createdAt:new Date().toISOString()};entries.set(storageKey,entry);return entry;
}
export function isSuppressed(input:{workspaceId:string;type:SuppressionType;value:string}){return entries.has(`${input.workspaceId}:${hashSuppression(input.type,input.value)}`);}
export function listSuppressions(workspaceId:string){return [...entries.values()].filter(entry=>entry.workspaceId===workspaceId).map(entry=>({id:entry.id,workspaceId:entry.workspaceId,type:entry.type,label:entry.label,reason:entry.reason,createdAt:entry.createdAt}));}
export function removeSuppression(workspaceId:string,id:string){const match=[...entries.entries()].find(([,entry])=>entry.workspaceId===workspaceId&&entry.id===id);return Boolean(match&&entries.delete(match[0]));}
