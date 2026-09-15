import type {Capability,EnrichmentInput,EnrichmentProvider,ProviderResult} from "./types";
import {providerJson} from "./http";

type NominatimPlace={
  place_id:number;
  osm_type:"node"|"way"|"relation";
  osm_id:number;
  display_name:string;
  name?:string;
  category?:string;
  type?:string;
  importance?:number;
  lat:string;
  lon:string;
  extratags?:{website?:string;phone?:string;[key:string]:string|undefined};
};
export type OpenStreetMapCompany={
  id:string;
  name:string;
  formattedAddress:string;
  latitude:number;
  longitude:number;
  category:string|null;
  website:string|null;
  phone:string|null;
  sourceUrl:string;
  attribution:string;
};

const CACHE_TTL_MS=24*60*60*1000;
const MAX_CACHE_ENTRIES=250;
const cache=new Map<string,{expiresAt:number;value:ProviderResult<OpenStreetMapCompany[]>}>();
let lastRequestAt=0;
let requestQueue:Promise<void>=Promise.resolve();

async function rateLimited<T>(action:()=>Promise<T>):Promise<T>{
  const previous=requestQueue;
  let release!:()=>void;
  requestQueue=new Promise<void>(resolve=>{release=resolve;});
  await previous;
  try{
    const delay=Math.max(0,1000-(Date.now()-lastRequestAt));
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    lastRequestAt=Date.now();
    return await action();
  }finally{release();}
}

function remember(key:string,value:ProviderResult<OpenStreetMapCompany[]>){
  if(cache.size>=MAX_CACHE_ENTRIES)cache.delete(cache.keys().next().value as string);
  cache.set(key,{expiresAt:Date.now()+CACHE_TTL_MS,value});
}

export class OpenStreetMapProvider implements EnrichmentProvider{
  readonly name="openstreetmap";
  readonly capabilities:Capability[]=["company_search","company_enrichment"];
  async estimateCost(){return 0;}
  async canRun(input:EnrichmentInput){return process.env.ENABLE_NOMINATIM==="true"&&this.capabilities.includes(input.capability);}
  async enrich<T>(input:EnrichmentInput):Promise<ProviderResult<T>>{
    const query=[input.companyName,input.domain].filter(Boolean).join(", ").trim();
    if(!query)return {success:false,error:{code:"MISSING_INPUT",message:"Company name or domain is required.",retryable:false}};
    if(process.env.ENABLE_NOMINATIM!=="true")return {success:false,error:{code:"SOURCE_DISABLED",message:"OpenStreetMap lookup requires an explicit policy opt-in.",retryable:false}};
    const cacheKey=query.toLowerCase();
    const cached=cache.get(cacheKey);
    if(cached&&cached.expiresAt>Date.now())return cached.value as ProviderResult<T>;
    if(cached)cache.delete(cacheKey);

    const url=new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q",query);
    url.searchParams.set("format","jsonv2");
    url.searchParams.set("addressdetails","1");
    url.searchParams.set("extratags","1");
    url.searchParams.set("namedetails","1");
    url.searchParams.set("limit","10");
    const userAgent=process.env.NOMINATIM_USER_AGENT?.trim()||"SignalDesk/0.1 (+https://kriyakarak.com)";
    const response=await rateLimited(()=>providerJson<NominatimPlace[]>(url.toString(),{headers:{accept:"application/json","accept-language":"en","user-agent":userAgent,referer:process.env.NEXT_PUBLIC_APP_URL||"https://kriyakarak.com"}}));
    if(!response.success)return response as ProviderResult<T>;
    const places=(response.data??[]).map(place=>({
      id:`${place.osm_type}-${place.osm_id}`,
      name:place.name||place.display_name.split(",")[0],
      formattedAddress:place.display_name,
      latitude:Number(place.lat),
      longitude:Number(place.lon),
      category:place.category||place.type||null,
      website:place.extratags?.website||null,
      phone:place.extratags?.phone||null,
      sourceUrl:`https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
      attribution:"© OpenStreetMap contributors",
    }));
    const importance=response.data?.[0]?.importance??.65;
    const result:ProviderResult<OpenStreetMapCompany[]>={success:true,data:places,confidence:Math.min(.9,Math.max(.55,importance)),providerRecordId:places[0]?.id,sourceUrl:places[0]?.sourceUrl,costUnits:0};
    remember(cacheKey,result);
    return result as ProviderResult<T>;
  }
}

export function resetOpenStreetMapProviderForTests(){cache.clear();lastRequestAt=0;requestQueue=Promise.resolve();}
