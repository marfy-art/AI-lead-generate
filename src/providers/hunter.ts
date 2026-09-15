import type { Capability, EnrichmentInput, EnrichmentProvider, ProviderResult } from "./types";
import { providerJson } from "./http";

type HunterResponse = {data?:Record<string,unknown>;meta?:Record<string,unknown>};

export class HunterProvider implements EnrichmentProvider {
  readonly name="hunter";
  readonly capabilities: Capability[]=["company_enrichment","people_search","email_find","email_verify"];
  async estimateCost(input:EnrichmentInput){return input.capability==="email_verify"?.5:input.capability==="company_enrichment"?.2:1;}
  async canRun(input:EnrichmentInput){return Boolean(process.env.HUNTER_API_KEY)&&this.capabilities.some(capability=>capability===input.capability);}
  async enrich<T>(input:EnrichmentInput):Promise<ProviderResult<T>>{
    const key=process.env.HUNTER_API_KEY;
    if(!key)return {success:false,error:{code:"MISSING_CREDENTIAL",message:"Hunter is not configured.",retryable:false}};
    const url=new URL("https://api.hunter.io/v2/");
    if(input.capability==="company_enrichment") { url.pathname+="companies/find"; if(input.domain)url.searchParams.set("domain",input.domain); }
    else if(input.capability==="people_search") { url.pathname+="domain-search"; if(input.domain)url.searchParams.set("domain",input.domain); else if(input.companyName)url.searchParams.set("company",input.companyName); url.searchParams.set("limit","10"); }
    else if(input.capability==="email_find") { url.pathname+="email-finder"; if(input.domain)url.searchParams.set("domain",input.domain); else if(input.companyName)url.searchParams.set("company",input.companyName); if(input.personName)url.searchParams.set("full_name",input.personName); }
    else if(input.capability==="email_verify") { url.pathname+="email-verifier"; if(input.email)url.searchParams.set("email",input.email); }
    else return {success:false,error:{code:"UNSUPPORTED",message:"Capability is not supported.",retryable:false}};
    const required=input.capability==="email_verify"?input.email:input.capability==="email_find"?input.personName&&(input.domain||input.companyName):input.domain||input.companyName;
    if(!required)return {success:false,error:{code:"MISSING_INPUT",message:"Required provider input is missing.",retryable:false}};
    const result=await providerJson<HunterResponse>(url.toString(),{headers:{"X-API-KEY":key,"accept":"application/json"}});
    if(!result.success)return result as ProviderResult<T>;
    const cost=await this.estimateCost(input);
    return {success:true,data:result.data?.data as T,confidence:.88,costUnits:cost};
  }
}
