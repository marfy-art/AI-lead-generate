import type { ProviderResult } from "./types";

export async function providerJson<T>(url: string, init: RequestInit): Promise<ProviderResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),12_000);
  try {
    const response = await fetch(url,{...init,signal:controller.signal});
    const body = await response.json().catch(()=>null) as T | {errors?:unknown} | null;
    if (!response.ok) return {success:false,error:{code:`HTTP_${response.status}`,message:"Provider request failed.",retryable:response.status===429||response.status>=500}};
    return {success:true,data:body as T};
  } catch (error) {
    return {success:false,error:{code:error instanceof Error&&error.name==="AbortError"?"TIMEOUT":"NETWORK_ERROR",message:"Provider request could not be completed.",retryable:true}};
  } finally { clearTimeout(timeout); }
}
