"use client";

import {useEffect,useState} from "react";
import {ArrowDown,ArrowUp,CheckCircle2,Database,Save,Zap} from "lucide-react";
import {SectionShell} from "@/components/section-shell";

type Status={mode:string;services:Record<string,{configured:boolean}>};
type Provider={id:string;name:string;enabled:boolean;priority:number;capabilities:string[];estimatedCost:string;termsReviewStatus:"approved"|"pending"|"not_required"};

export default function ProvidersPage(){
  const [status,setStatus]=useState<Status|null>(null);
  const [providers,setProviders]=useState<Provider[]>([]);
  const [notice,setNotice]=useState("");
  useEffect(()=>{let active=true;Promise.all([fetch("/api/system/status").then(r=>r.json() as Promise<Status>),fetch("/api/workspaces/demo/config").then(r=>r.json() as Promise<{config:{providers:Provider[]}}>)]).then(([runtime,settings])=>{if(active){setStatus(runtime);setProviders(settings.config.providers);}});return()=>{active=false};},[]);
  function move(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=providers.length)return;const next=[...providers];[next[index],next[target]]=[next[target],next[index]];setProviders(next);}
  async function save(){const response=await fetch("/api/workspaces/demo/config",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({providers})});setNotice(response.ok?"Provider order and controls saved.":"Provider controls could not be saved.");}
  return <SectionShell title="Provider waterfall" description="Enable providers, review source terms, and set the order used for discovery and enrichment." action={<button onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#244f3e] px-4 py-2.5 text-sm font-bold text-white"><Save size={15}/>Save controls</button>}>
    <div className="space-y-3">{providers.map((provider,index)=>{
      const configured=provider.id==="mock"||(status?.services[provider.id]?.configured??false);
      const readinessLabel=configured?"Ready":provider.id==="openStreetMap"?"Needs opt-in":"Needs key";
      return <article key={provider.id} className="grid items-center gap-4 rounded-2xl border border-[#dde4de] bg-white p-5 shadow-sm md:grid-cols-[auto_1fr_auto_auto_auto]">
        <div className="flex flex-col gap-1"><button onClick={()=>move(index,-1)} disabled={index===0} aria-label={`Move ${provider.name} up`} className="rounded p-1 disabled:opacity-20"><ArrowUp size={15}/></button><button onClick={()=>move(index,1)} disabled={index===providers.length-1} aria-label={`Move ${provider.name} down`} className="rounded p-1 disabled:opacity-20"><ArrowDown size={15}/></button></div>
        <div><div className="flex flex-wrap items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf4ef] text-[#35634f]"><Database size={17}/></span><h2 className="text-base font-bold">{index+1}. {provider.name}</h2><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${configured?"bg-emerald-100 text-emerald-800":"bg-slate-100 text-slate-600"}`}>{configured?<CheckCircle2 size={12}/>:<Zap size={12}/>} {readinessLabel}</span></div><p className="mt-2 text-sm text-[#6d7870]">{provider.capabilities.join(" · ")}</p><p className="mt-1 text-xs text-[#859087]">Cost: {provider.estimatedCost}</p></div>
        <label className="text-xs font-bold text-[#667169]">Terms review<select value={provider.termsReviewStatus} onChange={event=>setProviders(providers.map(item=>item.id===provider.id?{...item,termsReviewStatus:event.target.value as Provider["termsReviewStatus"]}:item))} className="mt-1 block h-9 rounded-lg border border-[#d8dfda] bg-white px-2 text-sm font-normal"><option value="pending">Pending</option><option value="approved">Approved</option><option value="not_required">Not required</option></select></label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={provider.enabled} onChange={event=>setProviders(providers.map(item=>item.id===provider.id?{...item,enabled:event.target.checked}:item))}/>Enabled</label>
        <span className="text-sm font-bold text-[#667169]">Priority {index+1}</span>
      </article>;
    })}</div>
    {notice&&<p className="mt-4 text-sm font-semibold text-[#35634f]">{notice}</p>}
    <div className="mt-5 rounded-xl border border-[#d6e4da] bg-[#eef6f1] p-4 text-sm leading-6 text-[#466554]">Current runtime: <strong className="capitalize">{status?.mode??"checking"}</strong>. Enabling a provider does not bypass credential, budget, or terms checks.</div>
  </SectionShell>;
}
