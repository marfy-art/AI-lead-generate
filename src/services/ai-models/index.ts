export type AiProvider="openai"|"openai_compatible";
import {decryptSecret,encryptSecret} from "../../lib/security/encryption";
type StoredConfig={id:string;workspaceId:string;name:string;provider:AiProvider;baseUrl:string;model:string;apiKeyEncrypted:string;maskedKey:string;active:boolean;createdAt:string};
export type PublicAiConfig=Omit<StoredConfig,"apiKeyEncrypted">;
const configs=new Map<string,StoredConfig>();
function publicConfig(config:StoredConfig):PublicAiConfig{const {apiKeyEncrypted,...safe}=config;void apiKeyEncrypted;return safe;}
export function listAiConfigs(workspaceId:string){return [...configs.values()].filter(item=>item.workspaceId===workspaceId).map(publicConfig);}
export function addAiConfig(input:{workspaceId:string;name:string;provider:AiProvider;baseUrl:string;model:string;apiKey:string;active?:boolean}){if(input.active)for(const config of configs.values())if(config.workspaceId===input.workspaceId)config.active=false;const suffix=input.apiKey.slice(-4);const {apiKey,...metadata}=input;const config:StoredConfig={...metadata,id:crypto.randomUUID(),apiKeyEncrypted:encryptSecret(apiKey),maskedKey:`••••••••${suffix}`,active:input.active??false,createdAt:new Date().toISOString()};configs.set(config.id,config);return publicConfig(config);}
export function activateAiConfig(workspaceId:string,id:string){const target=configs.get(id);if(!target||target.workspaceId!==workspaceId)return null;for(const config of configs.values())if(config.workspaceId===workspaceId)config.active=config.id===id;return publicConfig(target);}
export function removeAiConfig(workspaceId:string,id:string){const target=configs.get(id);return Boolean(target&&target.workspaceId===workspaceId&&configs.delete(id));}
export function resolveActiveAiConfig(workspaceId:string){const stored=[...configs.values()].find(item=>item.workspaceId===workspaceId&&item.active);return stored?{...publicConfig(stored),apiKey:decryptSecret(stored.apiKeyEncrypted)}:null;}
export function clearAiConfigsForTests(){configs.clear();}
