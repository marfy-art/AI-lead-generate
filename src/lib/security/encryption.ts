import {createDecipheriv,createCipheriv,randomBytes} from "node:crypto";

const VERSION="v1";
const ephemeralKey=randomBytes(32);

function configuredKey(){
  const configured=process.env.APP_ENCRYPTION_KEY?.trim();
  if(!configured)return ephemeralKey;
  if(/^[a-f\d]{64}$/i.test(configured))return Buffer.from(configured,"hex");
  const base64=Buffer.from(configured,"base64");
  if(base64.length===32&&base64.toString("base64").replace(/=+$/," ").trim()===configured.replace(/=+$/," ").trim())return base64;
  const raw=Buffer.from(configured,"utf8");
  if(raw.length===32)return raw;
  throw new Error("APP_ENCRYPTION_KEY must be exactly 32 bytes encoded as raw text, hex, or base64.");
}

export function encryptSecret(value:string){
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",configuredKey(),iv);
  const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [VERSION,iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(":");
}

export function decryptSecret(value:string){
  const [version,iv,tag,encrypted,...extra]=value.split(":");
  if(version!==VERSION||!iv||!tag||!encrypted||extra.length)throw new Error("Encrypted secret has an unsupported format.");
  const decipher=createDecipheriv("aes-256-gcm",configuredKey(),Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted,"base64url")),decipher.final()]).toString("utf8");
}

export function encryptionPersistenceReady(){return Boolean(process.env.APP_ENCRYPTION_KEY?.trim());}
