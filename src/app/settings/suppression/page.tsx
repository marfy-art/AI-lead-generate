"use client";

import {FormEvent,useEffect,useState} from "react";
import {Trash2} from "lucide-react";
import {SectionShell} from "@/components/section-shell";

type Entry={id:string;type:"email"|"phone"|"domain";label:string;reason:string|null;createdAt:string};

export default function SuppressionPage(){
  const [entries,setEntries]=useState<Entry[]>([]);
  const [type,setType]=useState<Entry["type"]>("email");
  const [value,setValue]=useState("");
  const [reason,setReason]=useState("");
  const [notice,setNotice]=useState("");
  async function load(){const response=await fetch("/api/workspaces/demo/suppressions");const body=await response.json() as {entries:Entry[]};setEntries(body.entries);}
  useEffect(()=>{let cancelled=false;fetch("/api/workspaces/demo/suppressions").then(response=>response.json() as Promise<{entries:Entry[]}>).then(body=>{if(!cancelled)setEntries(body.entries);});return()=>{cancelled=true;};},[]);
  async function submit(event:FormEvent){event.preventDefault();const response=await fetch("/api/workspaces/demo/suppressions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,value,reason:reason||null})});if(response.ok){setValue("");setReason("");setNotice("Suppression added. Matching leads will be blocked from outreach.");await load();}else setNotice("Please enter a valid value.");}
  async function remove(id:string){await fetch(`/api/workspaces/demo/suppressions?entryId=${encodeURIComponent(id)}`,{method:"DELETE"});await load();}
  return <SectionShell title="Suppression list" description="Prevent outreach to specific emails, phone numbers, or domains.">
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[#dde4de] bg-white p-5 shadow-sm md:grid-cols-[150px_1fr_1fr_auto]"><label className="text-sm font-semibold">Type<select value={type} onChange={event=>setType(event.target.value as Entry["type"])} className="mt-2 h-10 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"><option value="email">Email</option><option value="phone">Phone</option><option value="domain">Domain</option></select></label><label className="text-sm font-semibold">Value<input required value={value} onChange={event=>setValue(event.target.value)} placeholder={type==="email"?"person@company.com":type==="phone"?"+880…":"company.com"} className="mt-2 h-10 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"/></label><label className="text-sm font-semibold">Reason<input value={reason} onChange={event=>setReason(event.target.value)} placeholder="Opted out" className="mt-2 h-10 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"/></label><button className="self-end rounded-lg bg-[#244f3e] px-4 py-2.5 text-sm font-bold text-white">Add</button></form>
    {notice&&<p className="mt-3 text-sm text-[#426653]">{notice}</p>}
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#dde4de] bg-white"><div className="border-b border-[#e5e9e6] px-5 py-4 text-sm font-bold">Blocked contacts and domains · {entries.length}</div>{entries.length?entries.map(entry=><div key={entry.id} className="flex items-center gap-4 border-b border-[#edf0ed] px-5 py-4 last:border-0"><span className="w-16 rounded-md bg-[#eef2ef] px-2 py-1 text-center text-xs font-bold uppercase text-[#657068]">{entry.type}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{entry.label}</div><div className="mt-1 text-xs text-[#7b857e]">{entry.reason||"No reason provided"}</div></div><button onClick={()=>void remove(entry.id)} aria-label={`Remove ${entry.label}`} className="rounded-lg p-2 text-[#8b5048] hover:bg-red-50"><Trash2 size={16}/></button></div>):<div className="p-10 text-center text-sm text-[#7b857e]">No suppression entries yet.</div>}</section>
    <p className="mt-4 text-xs text-[#77827a]">Mock mode stores hashed entries only for the current server session. Database persistence activates after PostgreSQL is connected.</p>
  </SectionShell>;
}
