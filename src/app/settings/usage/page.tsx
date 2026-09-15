"use client";

import {useEffect,useState} from "react";
import {Clock3} from "lucide-react";
import {SectionShell} from "@/components/section-shell";

type Operations={
  summary:{calls:number;units:number;estimatedCost:number};
  providers:Array<{provider:string;calls:number;units:number;estimatedCost:number;successes:number}>;
  audit:Array<{action:string;entityType:string;entityId:string;createdAt:string}>;
};
const empty:Operations={summary:{calls:0,units:0,estimatedCost:0},providers:[],audit:[]};

export default function UsagePage(){
  const [data,setData]=useState(empty);
  useEffect(()=>{let cancelled=false;fetch("/api/workspaces/demo/operations").then(response=>response.json() as Promise<Operations>).then(body=>{if(!cancelled)setData(body);});return()=>{cancelled=true;};},[]);
  return <SectionShell title="Usage & cost" description="Provider attempts, credit units, estimated cost, and recent actions.">
    <div className="grid gap-4 sm:grid-cols-3">{[["API calls",data.summary.calls],["Credit units",data.summary.units],["Estimated cost",`$${data.summary.estimatedCost.toFixed(4)}`]].map(([label,value])=><article key={label} className="rounded-2xl border border-[#dde4de] bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-[#6d7870]">{label}</div><div className="font-display mt-3 text-3xl font-extrabold">{value}</div></article>)}</div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border border-[#dde4de] bg-white"><h2 className="border-b border-[#e5e9e6] px-5 py-4 text-base font-bold">Providers</h2>{data.providers.length?data.providers.map(provider=><div key={provider.provider} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#edf0ed] px-5 py-4 last:border-0"><div><div className="text-sm font-bold capitalize">{provider.provider.replaceAll("_"," ")}</div><div className="mt-1 text-xs text-[#77827a]">{provider.successes}/{provider.calls} successful · {provider.units} units</div></div><div className="text-sm font-semibold">${provider.estimatedCost.toFixed(4)}</div></div>):<div className="p-10 text-center text-sm text-[#7b857e]">Run enrichment to see provider usage.</div>}</section>
      <section className="overflow-hidden rounded-2xl border border-[#dde4de] bg-white"><h2 className="border-b border-[#e5e9e6] px-5 py-4 text-base font-bold">Recent audit activity</h2>{data.audit.length?data.audit.map((event,index)=><div key={`${event.entityId}-${index}`} className="flex gap-3 border-b border-[#edf0ed] px-5 py-4 last:border-0"><Clock3 size={16} className="mt-0.5 shrink-0 text-[#6d8a7a]"/><div><div className="text-sm font-semibold">{event.action.replaceAll("_"," ").replaceAll("."," · ")}</div><div className="mt-1 text-xs text-[#77827a]">{event.entityType} · {new Date(event.createdAt).toLocaleString()}</div></div></div>):<div className="p-10 text-center text-sm text-[#7b857e]">No activity recorded in this server session.</div>}</section>
    </div>
    <p className="mt-4 text-xs text-[#77827a]">Mock values reset when the local server restarts. Database-backed history activates after PostgreSQL is connected.</p>
  </SectionShell>;
}
