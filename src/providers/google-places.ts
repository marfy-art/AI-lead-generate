import type { Capability, EnrichmentInput, EnrichmentProvider, ProviderResult } from "./types";
import { providerJson } from "./http";

type PlacesResponse = { places?: Array<{id:string;displayName?:{text:string};formattedAddress?:string;websiteUri?:string;nationalPhoneNumber?:string;primaryType?:string}> };

export class GooglePlacesProvider implements EnrichmentProvider {
  readonly name="google_places";
  readonly capabilities: Capability[]=["company_search","company_enrichment"];
  async estimateCost(){return 1;}
  async canRun(input:EnrichmentInput){return Boolean(process.env.GOOGLE_MAPS_API_KEY)&&this.capabilities.some(capability=>capability===input.capability);}
  async enrich<T>(input:EnrichmentInput):Promise<ProviderResult<T>>{
    const key=process.env.GOOGLE_MAPS_API_KEY;
    if(!key)return {success:false,error:{code:"MISSING_CREDENTIAL",message:"Google Places is not configured.",retryable:false}};
    const textQuery=[input.companyName,input.domain].filter(Boolean).join(" ");
    if(!textQuery)return {success:false,error:{code:"MISSING_INPUT",message:"Company name or domain is required.",retryable:false}};
    const result=await providerJson<PlacesResponse>("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"content-type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType"},body:JSON.stringify({textQuery,pageSize:10})});
    if(!result.success)return result as ProviderResult<T>;
    return {success:true,data:result.data?.places as T,confidence:.82,providerRecordId:result.data?.places?.[0]?.id,costUnits:1};
  }
}
