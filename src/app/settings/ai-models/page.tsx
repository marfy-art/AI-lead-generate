"use client";

import {FormEvent,useEffect,useState} from "react";
import {BrainCircuit,Check,KeyRound,Trash2} from "lucide-react";
import {SectionShell} from "@/components/section-shell";

type Config={id:string;name:string;provider:"openai"|"openai_compatible";baseUrl:string;model:string;maskedKey:string;active:boolean;createdAt:string};

export default function AiModelsPage(){
  const [configs,setConfigs]=useState<Config[]>([]);
  const [name,setName]=useState("OpenAI primary");
  const [provider,setProvider]=useState<Config["provider"]>("openai");
  const [baseUrl,setBaseUrl]=useState("https://api.openai.com/v1");
  const [model,setModel]=useState("");
  const [apiKey,setApiKey]=useState("");
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  async function load(){const response=await fetch("/api/workspaces/demo/ai-models");const body=await response.json() as {configs:Config[]};setConfigs(body.configs);}
  useEffect(()=>{let cancelled=false;fetch("/api/workspaces/demo/ai-models").then(response=>response.json() as Promise<{configs:Config[]}>).then(body=>{if(!cancelled)setConfigs(body.configs);});return()=>{cancelled=true;};},[]);
  async function submit(event:FormEvent){event.preventDefault();setSaving(true);setNotice("");const response=await fetch("/api/workspaces/demo/ai-models",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,provider,baseUrl,model,apiKey,active:true})});if(response.ok){setApiKey("");setModel("");setNotice("AI model added and activated.");await load();}else{const body=await response.json() as {error?:string};setNotice(body.error||"Could not add the model.");}setSaving(false);}
  async function activate(configId:string){await fetch("/api/workspaces/demo/ai-models",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({configId,active:true})});await load();}
  async function remove(configId:string){await fetch(`/api/workspaces/demo/ai-models?configId=${encodeURIComponent(configId)}`,{method:"DELETE"});await load();}
  return <SectionShell title="AI models" description="Add an OpenAI or OpenAI-compatible API and select the active model.">
    <form onSubmit={submit} className="rounded-2xl border border-[#dde4de] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Connection name<input required value={name} onChange={event=>setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"/></label>
        <label className="text-sm font-bold">Provider<select value={provider} onChange={event=>{const value=event.target.value as Config["provider"];setProvider(value);if(value==="openai")setBaseUrl("https://api.openai.com/v1");}} className="mt-2 h-11 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"><option value="openai">OpenAI</option><option value="openai_compatible">OpenAI-compatible</option></select></label>
        <label className="text-sm font-bold">API base URL<input required type="url" value={baseUrl} readOnly={provider==="openai"} onChange={event=>setBaseUrl(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#d8dfda] px-3 font-normal read-only:bg-[#f3f5f3]"/></label>
        <label className="text-sm font-bold">Model ID<input required value={model} onChange={event=>setModel(event.target.value)} placeholder="Enter the exact model ID" className="mt-2 h-11 w-full rounded-lg border border-[#d8dfda] px-3 font-normal"/></label>
        <label className="text-sm font-bold md:col-span-2">API key<div className="relative mt-2"><KeyRound className="absolute left-3 top-3 text-[#78837b]" size={17}/><input required type="password" autoComplete="off" value={apiKey} onChange={event=>setApiKey(event.target.value)} placeholder="Stored only on the server; never shown again" className="h-11 w-full rounded-lg border border-[#d8dfda] pl-10 pr-3 font-normal"/></div></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4"><button disabled={saving} className="rounded-lg bg-[#244f3e] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving?"Saving…":"Add & activate model"}</button><span className="text-sm text-[#5d6c63]">{notice}</span></div>
    </form>
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#dde4de] bg-white"><h2 className="border-b border-[#e5e9e6] px-5 py-4 text-base font-bold">Configured models · {configs.length}</h2>{configs.length?configs.map(config=><article key={config.id} className="flex flex-wrap items-center gap-4 border-b border-[#edf0ed] px-5 py-4 last:border-0"><span className={`grid h-9 w-9 place-items-center rounded-full ${config.active?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{config.active?<Check size={17}/>:<BrainCircuit size={17}/>}</span><div className="min-w-[220px] flex-1"><div className="flex items-center gap-2"><span className="text-sm font-bold">{config.name}</span>{config.active&&<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Active</span>}</div><div className="mt-1 text-xs text-[#77827a]">{config.model} · {config.maskedKey}</div><div className="mt-1 truncate text-xs text-[#8a938d]">{config.baseUrl}</div></div>{!config.active&&<button onClick={()=>void activate(config.id)} className="rounded-lg border border-[#ccd7d0] px-3 py-2 text-sm font-bold">Activate</button>}<button onClick={()=>void remove(config.id)} aria-label={`Remove ${config.name}`} className="rounded-lg p-2 text-[#8b5048] hover:bg-red-50"><Trash2 size={17}/></button></article>):<div className="p-10 text-center text-sm text-[#7b857e]">No AI model has been added yet. Mock analysis remains active.</div>}</section>
    <p className="mt-4 text-xs leading-5 text-[#77827a]">The active model is used automatically for Business Analysis through the Responses API. PostgreSQL mode encrypts API keys before storage; mock mode resets when the server restarts. Private/local API URLs and redirects are blocked.</p>
  </SectionShell>;
}
