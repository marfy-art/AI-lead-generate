"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine, ArrowUpRight, Bell, Building2, Check, Columns3, FileSearch, Filter, HelpCircle, Inbox,
  Mail, MapPin, MoreHorizontal, Phone, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Target, Users, X,
} from "lucide-react";
import { leads, stats } from "@/lib/mock-data";
import type { IntentType, Lead, LeadSide } from "@/lib/types";
import type { BusinessAnalysis } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { BusinessAnalysisReview } from "@/components/business-analysis-review";
import { createCsv } from "@/lib/export/csv";
import {AppSidebar,MobileNavigation} from "@/components/app-navigation";

type NewProjectInput = { name: string; goal: "buyers" | "sellers" | "both"; source: string; services: string[] };
type DiscoverySummary = { discovered: number; unique: number; duplicatesRemoved: number; qualified: number };

const intentLabels: Record<IntentType, string> = {
  explicit: "Explicit intent", commercial: "Commercial signal", inferred: "Inferred need", fit: "ICP fit",
};

function IntentBadge({ type }: { type: IntentType }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
    type === "explicit" && "bg-emerald-100 text-emerald-800",
    type === "commercial" && "bg-blue-100 text-blue-800",
    type === "inferred" && "bg-amber-100 text-amber-800",
    type === "fit" && "bg-slate-100 text-slate-700",
  )}><span className="h-1.5 w-1.5 rounded-full bg-current" />{intentLabels[type]}</span>;
}

function ScoreRing({ value, small = false }: { value: number; small?: boolean }) {
  const color = value >= 85 ? "#2f7658" : value >= 70 ? "#4f6f9f" : "#8a6b2f";
  const size = small ? 38 : 58;
  return <div className="relative grid place-items-center" style={{ width: size, height: size }}>
    <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="17" fill="none" stroke="#e8ece9" strokeWidth="3" />
      <circle cx="21" cy="21" r="17" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${value} 100`} pathLength="100" />
    </svg>
    <span className={cn("font-display font-bold", small ? "text-xs" : "text-lg")}>{value}</span>
  </div>;
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [tab, setTab] = useState<"Overview" | "Evidence" | "Outreach">("Overview");
  return <div className="fixed inset-0 z-40 flex justify-end bg-[#132018]/20 backdrop-blur-[1px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="drawer-shadow animate-in flex h-full w-full max-w-[590px] flex-col bg-white">
      <header className="border-b border-[#e5e9e5] px-6 pt-5">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold", lead.avatarTone)}>{lead.initials}</div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-display text-xl font-extrabold tracking-tight">{lead.company}</h2><IntentBadge type={lead.intent}/></div><p className="mt-1 text-xs text-[#717a73]">{lead.person} · {lead.role}</p></div>
          <button aria-label="Close detail" onClick={onClose} className="rounded-lg p-2 text-[#6f7871] hover:bg-[#f1f3f1]"><X size={18}/></button>
        </div>
        <div className="mt-5 flex gap-6">
          {(["Overview","Evidence","Outreach"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={cn("border-b-2 pb-3 text-xs font-semibold", tab === item ? "border-[#285d47] text-[#285d47]" : "border-transparent text-[#7d857f]")}>{item}{item === "Evidence" && ` (${lead.evidence.length})`}</button>)}
        </div>
      </header>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
        {tab === "Overview" && <div className="space-y-5">
          <div className="grid grid-cols-[78px_1fr] gap-4 rounded-2xl border border-[#dfe5df] bg-[#fafbfa] p-4"><ScoreRing value={lead.score}/><div><div className="flex items-center gap-2"><span className="font-display text-base font-bold">Strong {lead.side} match</span><span className="rounded bg-[#e8f2ed] px-2 py-0.5 text-[10px] font-bold text-[#2c664e]">{lead.confidence}% confidence</span></div><p className="mt-1.5 text-xs leading-5 text-[#626c65]">{lead.why}</p></div></div>
          <section><Label>Why this lead</Label><p className="mt-2 text-sm leading-6 text-[#3d4841]">{lead.summary}</p><div className="mt-3 flex flex-wrap gap-2"><Pill icon={Target}>{lead.service}</Pill><Pill icon={MapPin}>{lead.location}</Pill><Pill icon={FileSearch}>{lead.sourceCount} sources</Pill></div></section>
          <section className="border-t border-[#edf0ed] pt-5"><Label>Decision-maker</Label><div className="mt-3 flex gap-3"><div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold", lead.avatarTone)}>{lead.initials}</div><div><div className="text-sm font-bold">{lead.person}</div><div className="text-xs text-[#737c75]">{lead.role}</div><p className="mt-2 text-xs leading-5 text-[#606a63]">{lead.decisionReason}</p></div></div></section>
          <section className="border-t border-[#edf0ed] pt-5"><Label>Contact quality</Label><div className="mt-3 grid grid-cols-2 gap-3"><ContactCard icon={Mail} label={lead.emailStatus === "Verified" ? "Verified work email" : lead.emailStatus === "Unverified" ? "Unverified work email" : "Email not found"} value={lead.email ?? "Not found"} good={lead.emailStatus === "Verified"}/><ContactCard icon={Phone} label={lead.phoneType} value={lead.phone ?? "Not found"} good={lead.phoneType === "Direct work"}/></div></section>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Risk to review</div><p className="mt-1 text-xs leading-5 text-amber-900/80">{lead.risk}</p></div>
        </div>}
        {tab === "Evidence" && <div><div className="flex items-center justify-between"><div><h3 className="font-display text-base font-bold">Source timeline</h3><p className="mt-1 text-xs text-[#758078]">Facts, provider data, and inference stay visibly separate.</p></div><span className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-[10px] font-bold text-[#31634e]">100% sourced</span></div><div className="mt-6 space-y-0">{lead.evidence.map((item, i) => <div key={item.id} className="grid grid-cols-[18px_1fr] gap-3"><div className="flex flex-col items-center"><span className={cn("mt-1 h-2.5 w-2.5 rounded-full ring-4", item.kind === "Observed fact" ? "bg-emerald-600 ring-emerald-100" : item.kind === "Provider data" ? "bg-blue-600 ring-blue-100" : "bg-amber-500 ring-amber-100")}/>{i < lead.evidence.length - 1 && <span className="h-full w-px bg-[#e2e7e3]"/>}</div><article className="pb-6"><div className="flex items-center gap-2"><span className="text-sm font-bold">{item.title}</span><span className="rounded-md bg-[#f0f2f0] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#6f7771]">{item.kind}</span></div><p className="mt-1.5 rounded-lg border border-[#e5e9e5] bg-[#fafbfa] p-3 text-xs leading-5 text-[#4f5952]">“{item.excerpt}”</p><div className="mt-1.5 flex justify-between text-[10px] text-[#8a928c]"><span>{item.source}</span><span>{item.date}</span></div></article></div>)}</div></div>}
        {tab === "Outreach" && <div><div className="flex items-start justify-between"><div><h3 className="font-display text-base font-bold">Recommended: {lead.preferredChannel}</h3><p className="mt-1 text-xs text-[#758078]">Drafted from stored evidence. Review before sending.</p></div><button className="flex items-center gap-1.5 rounded-lg border border-[#dce2dd] px-2.5 py-2 text-[11px] font-semibold"><RefreshCw size={13}/>Regenerate</button></div><div className="mt-5 rounded-xl border border-[#dfe4df]"><div className="border-b border-[#e8ece8] px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-[#8a928c]">Subject</div><div className="mt-1 text-sm font-semibold">{lead.outreach.subject}</div></div><div className="p-4 text-sm leading-6 text-[#424d46]">{lead.outreach.body}</div></div><div className="mt-4 flex gap-2"><button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#244f3e] px-4 py-2.5 text-xs font-bold text-white"><Mail size={14}/>Copy email</button><button className="rounded-lg border border-[#dbe1dc] px-4 py-2.5 text-xs font-semibold">Change tone</button></div><div className="mt-5 rounded-xl bg-[#f3f6f3] p-3 text-xs leading-5 text-[#657068]"><span className="font-bold text-[#354239]">Claim check passed.</span> No unsupported claim was detected. Inferred needs are phrased conditionally.</div></div>}
      </div>
      <footer className="flex items-center justify-between border-t border-[#e5e9e5] bg-[#fbfcfb] px-6 py-3"><button className="text-xs font-semibold text-[#8a5048]">Reject lead</button><div className="flex gap-2"><button className="rounded-lg border border-[#dce2dd] px-3 py-2 text-xs font-semibold">Add to list</button><button className="rounded-lg bg-[#244f3e] px-3 py-2 text-xs font-bold text-white">Mark contacted</button></div></footer>
    </section>
  </div>;
}

function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#89918b]">{children}</div>; }
function Pill({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e6e2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#58625b]"><Icon size={12}/>{children}</span>; }
function ContactCard({ icon: Icon, label, value, good }: { icon: typeof Mail; label: string; value: string; good: boolean }) { return <div className="rounded-xl border border-[#e1e6e2] p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#858d87]"><Icon size={12}/>{label}</div><div className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold">{good && <Check size={12} className="text-emerald-600"/>}{value}</div></div>; }

function ProjectWizard({ onClose, onComplete }: { onClose: () => void; onComplete: (input: NewProjectInput) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Dhaka Creative Growth");
  const [goal, setGoal] = useState<"buyers"|"sellers"|"both">("both");
  const [source, setSource] = useState("https://kriyakarak.com");
  const [services, setServices] = useState(["Photography", "Videography", "Graphic Design"]);
  const [saving, setSaving] = useState(false);
  const steps = ["Goal", "Business", "Services", "Review"];
  const choices = [
    { id:"buyers" as const, title:"Find buyers", copy:"Organizations and people likely to purchase services.", icon:Building2 },
    { id:"sellers" as const, title:"Find sellers", copy:"Qualified professionals who can offer services.", icon:Users },
    { id:"both" as const, title:"Find both", copy:"Build both sides of the Kriyakarak marketplace.", icon:Target },
  ];
  function toggleService(value: string) { setServices(services.includes(value) ? services.filter(s=>s!==value) : [...services,value]); }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#142119]/35 p-4 backdrop-blur-[2px]" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}><section className="animate-in w-full max-w-[650px] overflow-hidden rounded-2xl bg-white shadow-2xl">
    <header className="flex items-start justify-between border-b border-[#e4e9e5] px-6 py-5"><div><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#718078]">New lead project</div><h2 className="font-display mt-1 text-xl font-extrabold">Set up your discovery workspace</h2></div><button onClick={onClose} aria-label="Close wizard" className="rounded-lg p-2 hover:bg-[#f1f3f1]"><X size={18}/></button></header>
    <div className="border-b border-[#e8ece8] bg-[#fafbfa] px-6 py-3"><div className="flex items-center">{steps.map((label,i)=><div key={label} className="flex flex-1 items-center last:flex-none"><div className={cn("flex items-center gap-1.5 text-[10px] font-bold",i<=step?"text-[#285d47]":"text-[#a0a7a1]")}><span className={cn("grid h-5 w-5 place-items-center rounded-full border",i<step?"border-[#285d47] bg-[#285d47] text-white":i===step?"border-[#285d47] bg-white":"border-[#ccd3ce]")}>{i<step?<Check size={11}/>:i+1}</span><span className="desktop-only">{label}</span></div>{i<steps.length-1&&<span className={cn("mx-2 h-px flex-1",i<step?"bg-[#6e9c87]":"bg-[#dce2dd]")}/>}</div>)}</div></div>
    <div className="min-h-[330px] p-6">
      {step===0&&<div><h3 className="font-display text-base font-bold">What would you like to find?</h3><p className="mt-1 text-xs text-[#768078]">The project can discover demand, supply, or both.</p><div className="mt-5 grid grid-cols-3 gap-3">{choices.map(({id,title,copy,icon:Icon})=><button key={id} onClick={()=>setGoal(id)} className={cn("rounded-xl border p-4 text-left transition",goal===id?"border-[#39735a] bg-[#f0f6f2] ring-1 ring-[#39735a]":"border-[#dfe5e0] hover:border-[#9eafa5]")}><Icon size={18} className={goal===id?"text-[#2d674e]":"text-[#7c867f]"}/><div className="mt-4 text-xs font-bold">{title}</div><p className="mt-1.5 text-[10px] leading-4 text-[#737d75]">{copy}</p></button>)}</div></div>}
      {step===1&&<div><h3 className="font-display text-base font-bold">Tell us about the business</h3><p className="mt-1 text-xs text-[#768078]">We’ll analyze this in mock mode and make every assumption editable.</p><label className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-[#7d867f]">Project name</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#dbe1dc] px-3 text-sm outline-none focus:border-[#4a7b65]"/><label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-[#7d867f]">Website or business description</label><textarea value={source} onChange={e=>setSource(e.target.value)} className="mt-2 h-24 w-full resize-none rounded-lg border border-[#dbe1dc] p-3 text-sm outline-none focus:border-[#4a7b65]"/><div className="mt-3 rounded-lg bg-[#f3f6f3] p-3 text-[10px] leading-4 text-[#69736c]">Public pages are treated as untrusted input. Mock mode will not fetch this URL or spend credits.</div></div>}
      {step===2&&<div><h3 className="font-display text-base font-bold">Choose initial services</h3><p className="mt-1 text-xs text-[#768078]">You can edit the AI-generated taxonomy later.</p><div className="mt-5 grid grid-cols-2 gap-2">{["Photography","Videography","Graphic Design","Digital Marketing","Web Development","Event Planning","Tutoring","Home Services"].map(service=><button key={service} onClick={()=>toggleService(service)} className={cn("flex items-center justify-between rounded-lg border px-3 py-3 text-left text-xs font-semibold",services.includes(service)?"border-[#7fa58f] bg-[#edf6f0] text-[#2c5f49]":"border-[#e0e5e1]")}><span>{service}</span><span className={cn("grid h-4 w-4 place-items-center rounded border",services.includes(service)?"border-[#387158] bg-[#387158] text-white":"border-[#cbd3cd]")}>{services.includes(service)&&<Check size={10}/>}</span></button>)}</div></div>}
      {step===3&&<div><h3 className="font-display text-base font-bold">Ready to start in mock mode</h3><p className="mt-1 text-xs text-[#768078]">Review the project before creating it.</p><div className="mt-5 divide-y divide-[#e6eae7] rounded-xl border border-[#dfe5e0]">{[["Project",name],["Goal",goal==="both"?"Buyers and sellers":goal],["Geography","Dhaka, Bangladesh"],["Services",services.join(", ")||"None selected"],["Budget","৳0 · mock providers only"]].map(([label,value])=><div key={label} className="grid grid-cols-[110px_1fr] gap-4 px-4 py-3 text-xs"><span className="font-semibold text-[#7a847c]">{label}</span><span className="font-medium capitalize">{value}</span></div>)}</div><div className="mt-4 flex items-start gap-2 rounded-lg border border-[#d7e6dc] bg-[#f0f7f2] p-3 text-[10px] leading-4 text-[#52705f]"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>No paid provider, private source, or automated outreach will run in this project.</div></div>}
    </div>
    <footer className="flex items-center justify-between border-t border-[#e5e9e5] bg-[#fbfcfb] px-6 py-4"><button onClick={()=>step===0?onClose():setStep(step-1)} className="rounded-lg border border-[#dce2dd] px-4 py-2 text-xs font-semibold">{step===0?"Cancel":"Back"}</button><button disabled={saving||(step===1&&(!name.trim()||!source.trim()))||(step===2&&services.length===0)} onClick={async()=>{if(step<3){setStep(step+1);return;}setSaving(true);await onComplete({name,goal,source,services});setSaving(false);}} className="flex items-center gap-2 rounded-lg bg-[#244f3e] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{step===3?<><Sparkles size={13}/>{saving?"Analyzing…":"Create & analyze"}</>:<>Continue<ArrowUpRight size={13}/></>}</button></footer>
  </section></div>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<LeadSide | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [analysisReview, setAnalysisReview] = useState<{ projectId: string; projectName: string; analysis: BusinessAnalysis } | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const filtered = useMemo(() => leads.filter((lead) => (side === "all" || lead.side === side) && `${lead.company} ${lead.person} ${lead.service}`.toLowerCase().includes(query.toLowerCase())), [query, side]);
  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 2200); }
  async function createAndAnalyzeProject(input: NewProjectInput) {
    try {
      const projectResponse = await fetch("/api/projects", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ name:input.name, goal:input.goal, targetGeographies:["Dhaka, Bangladesh"], desiredLeadCount:50, enrichmentBudget:0 }) });
      if (!projectResponse.ok) throw new Error("Project creation failed");
      const project = await projectResponse.json() as { id: string };
      const analysisResponse = await fetch(`/api/projects/${project.id}/analyze`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ input:input.source, goal:input.goal, selectedServices:input.services, geography:"Dhaka, Bangladesh" }) });
      if (!analysisResponse.ok) throw new Error("Analysis failed");
      const result = await analysisResponse.json() as { analysis: BusinessAnalysis };
      setWizardOpen(false);
      setAnalysisReview({ projectId:project.id, projectName:input.name, analysis:result.analysis });
    } catch {
      flash("Could not create the project. Please try again.");
    }
  }
  async function runDiscovery(projectId = "demo", services = ["Photography", "Graphic Design"]) {
    setDiscovering(true);
    try {
      const jobResponse=await fetch(`/api/projects/${projectId}/jobs`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"discovery",side:"both",services,geography:"Dhaka, Bangladesh"})});
      if(!jobResponse.ok)throw new Error("Discovery job failed");
      const response = await fetch(`/api/projects/${projectId}/discover`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ side:"both", services, geography:"Dhaka, Bangladesh" }) });
      if (!response.ok) throw new Error("Discovery failed");
      const result = await response.json() as { summary: DiscoverySummary };
      flash(`${result.summary.unique} unique leads found · ${result.summary.duplicatesRemoved} duplicate removed · ${result.summary.qualified} qualified`);
    } catch {
      flash("Discovery could not start. Please try again.");
      throw new Error("Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }
  async function enrichSelected() {
    if (!selected.length) return;
    setEnriching(true);
    try {
      const response = await fetch("/api/leads/bulk/enrich",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({leadIds:selected,capability:"email_find",projectId:"demo",budget:0,confidenceThreshold:.85})});
      if (!response.ok) throw new Error("Enrichment failed");
      const body=await response.json() as {results:{stoppedBecause:string}[]};
      flash(`${body.results.filter(result=>result.stoppedBecause==="quality_met").length} of ${body.results.length} selected leads enriched in mock mode`);
    } catch {
      flash("Selected leads could not be enriched.");
    } finally {
      setEnriching(false);
    }
  }
  async function addSelectionToList(){if(!selected.length)return;const response=await fetch("/api/workspaces/demo/lists",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:`Selected leads ${new Date().toLocaleDateString()}`,rule:`Manual selection · ${selected.length} leads`})});flash(response.ok?`${selected.length} selected leads added to a saved list`:"List could not be created.");}
  function exportVisibleLeads() {
    const exportSet = selected.length ? filtered.filter(lead=>selected.includes(lead.id)) : filtered;
    const csv = createCsv(["Company","Person","Role","Side","Intent","Service","Location","Score","Confidence","Email status","Phone type","Status","Why this lead"],exportSet.map(lead=>[lead.company,lead.person,lead.role,lead.side,lead.intent,lead.service,lead.location,lead.score,lead.confidence,lead.emailStatus,lead.phoneType,lead.status,lead.why]));
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href=url;
    link.download=`signaldesk-leads-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash(`${exportSet.length} lead${exportSet.length===1?"":"s"} exported safely`);
  }

  return <div className="min-h-screen"><AppSidebar/><main className="app-main ml-[232px] min-h-screen transition-all">
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#dfe4e0] bg-[#f4f6f3]/90 px-7 backdrop-blur-lg">
      <div className="flex items-center gap-2 text-xs text-[#7b847e]"><span>Projects</span><span>/</span><span className="font-semibold text-[#263229]">Dhaka Growth Pilot</span><span className="ml-2 rounded-full border border-[#cfdcd4] bg-[#edf5f0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#35634f]">Running</span></div>
      <div className="flex items-center gap-2"><button className="rounded-lg p-2 text-[#687169] hover:bg-white"><HelpCircle size={17}/></button><button className="relative rounded-lg p-2 text-[#687169] hover:bg-white"><Bell size={17}/><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d5674f]"/></button><button onClick={() => setWizardOpen(true)} className="ml-2 flex items-center gap-2 rounded-lg bg-[#244f3e] px-3.5 py-2 text-xs font-bold text-white shadow-sm"><Plus size={15}/>New project</button></div>
    </header>
    <MobileNavigation/>
    <div className="page-pad mx-auto max-w-[1540px] px-7 py-7">
      <div className="flex items-end justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#718078]"><span className="h-px w-5 bg-[#84a092]"/>Lead intelligence</div><h1 className="font-display mt-2 text-[28px] font-extrabold tracking-[-.035em]">Your best opportunities, explained.</h1><p className="mt-1.5 text-xs text-[#6f7871]">Evidence-led buyer and seller leads for Kriyakarak · Updated 12 minutes ago</p></div><button disabled={discovering} onClick={() => void runDiscovery()} className="desktop-only flex items-center gap-2 rounded-lg border border-[#d8ded9] bg-white px-3.5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-60"><Sparkles size={14} className="text-[#55772e]"/>{discovering?"Finding leads…":"Find more leads"}</button></div>
      <div className="metric-grid mt-6 grid grid-cols-4 gap-3">{stats.map((stat, i) => <article key={stat.label} className="surface-shadow rounded-xl border border-[#e0e5e1] bg-white p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#7d867f]">{stat.label}</span><span className={cn("grid h-7 w-7 place-items-center rounded-lg", i===0?"bg-slate-100":i===1?"bg-emerald-100 text-emerald-700":i===2?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700")}>{i===0?<Users size={14}/>:i===1?<Target size={14}/>:i===2?<Check size={14}/>:<Inbox size={14}/>}</span></div><div className="font-display mt-3 text-2xl font-extrabold tracking-tight">{stat.value}</div><div className="mt-1 text-[10px] text-[#879088]">{stat.change}</div></article>)}</div>
      <section className="surface-shadow mt-5 overflow-hidden rounded-xl border border-[#dfe4e0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e9e6] px-4 py-3"><div className="flex items-center gap-1 rounded-lg bg-[#f1f3f1] p-1">{(["all","buyer","seller"] as const).map((item) => <button key={item} onClick={() => setSide(item)} className={cn("rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize", side === item ? "bg-white text-[#26352c] shadow-sm" : "text-[#7a837c]")}>{item === "all" ? "All leads" : `${item}s`}</button>)}</div><div className="flex items-center gap-2"><div className="flex h-8 items-center gap-2 rounded-lg border border-[#dce2dd] px-2.5"><Search size={14} className="text-[#8a928c]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search leads" className="w-40 bg-transparent text-xs outline-none"/></div><button onClick={()=>setSide(side==="all"?"buyer":side==="buyer"?"seller":"all")} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#dce2dd] px-2.5 text-[11px] font-semibold"><Filter size={13}/>Filter</button><button onClick={()=>flash("Core evidence and contact columns are always visible in the pilot.")} aria-label="Columns" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce2dd]"><Columns3 size={14}/></button><button onClick={exportVisibleLeads} aria-label="Export" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce2dd]"><ArrowDownToLine size={14}/></button></div></div>
        {selected.length > 0 && <div className="flex items-center gap-3 border-b border-[#dfe7e1] bg-[#f1f7f3] px-4 py-2 text-[11px]"><span className="font-bold text-[#285d47]">{selected.length} selected</span><button disabled={enriching} onClick={()=>void enrichSelected()} className="rounded-md bg-white px-2.5 py-1 font-semibold shadow-sm disabled:opacity-60">{enriching?"Enriching…":"Enrich contacts"}</button><button onClick={()=>void addSelectionToList()} className="rounded-md bg-white px-2.5 py-1 font-semibold shadow-sm">Add to list</button><button onClick={()=>setSelected([])} className="ml-auto text-[#657068]">Clear</button></div>}
        <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[1180px] border-collapse text-left"><thead><tr className="h-10 border-b border-[#e9ece9] bg-[#fafbfa] text-[9px] font-bold uppercase tracking-[.08em] text-[#88908a]"><th className="w-12 px-4"><input aria-label="Select all" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={(e)=>setSelected(e.target.checked?filtered.map(l=>l.id):[])} /></th><th className="w-16">Score</th><th>Lead</th><th>Intent</th><th>Service match</th><th>Contact</th><th>Why this lead</th><th>Status</th><th className="w-12"/></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id} onClick={()=>setSelectedLead(lead)} className="group h-[72px] cursor-pointer border-b border-[#edf0ed] last:border-0 hover:bg-[#f8faf8]"><td className="px-4" onClick={(e)=>e.stopPropagation()}><input aria-label={`Select ${lead.company}`} type="checkbox" checked={selected.includes(lead.id)} onChange={(e)=>setSelected(e.target.checked?[...selected,lead.id]:selected.filter(id=>id!==lead.id))}/></td><td><ScoreRing value={lead.score} small/></td><td><div className="flex items-center gap-2.5"><div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold",lead.avatarTone)}>{lead.initials}</div><div><div className="flex items-center gap-1.5 text-xs font-bold">{lead.company}<ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100"/></div><div className="mt-1 text-[10px] text-[#7e8780]">{lead.person} · {lead.role}</div></div></div></td><td><IntentBadge type={lead.intent}/><div className="mt-1 text-[9px] text-[#929a94]">{lead.lastSignal}</div></td><td><div className="text-xs font-semibold">{lead.service}</div><div className="mt-1 flex items-center gap-1 text-[10px] text-[#818a83]"><MapPin size={10}/>{lead.location}</div></td><td><div className="flex items-center gap-1.5 text-[11px] font-medium">{lead.emailStatus === "Verified" ? <><Check size={12} className="text-emerald-600"/>Verified email</> : lead.emailStatus === "Unverified" ? <><Mail size={12} className="text-amber-600"/>Unverified</> : <span className="text-[#9aa19b]">Not found</span>}</div><div className="mt-1 text-[9px] text-[#8b938d]">{lead.phoneType}</div></td><td className="max-w-[260px]"><p className="line-clamp-2 text-[11px] leading-[17px] text-[#5e6861]">{lead.why}</p></td><td><span className={cn("whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold",lead.status==="Outreach ready"?"bg-[#e6f2eb] text-[#2e674e]":lead.status==="Needs review"?"bg-amber-100 text-amber-800":"bg-slate-100 text-slate-600")}>{lead.status}</span></td><td><button aria-label="More" className="rounded p-1.5 hover:bg-[#edf1ed]"><MoreHorizontal size={15}/></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="grid h-44 place-items-center text-xs text-[#7d867f]">No leads match your search.</div>}</div>
        <div className="flex items-center justify-between border-t border-[#e6eae6] bg-[#fbfcfb] px-4 py-3 text-[10px] text-[#7d867f]"><span>Showing {filtered.length} of 248 leads</span><div className="flex items-center gap-3"><span>1–{filtered.length}</span><button className="rounded border border-[#dde2de] px-2 py-1">Previous</button><button className="rounded border border-[#dde2de] bg-white px-2 py-1 font-semibold text-[#3c4840]">Next</button></div></div>
      </section>
      <div className="mt-4 flex items-center justify-between text-[10px] text-[#89918b]"><span className="flex items-center gap-1.5"><ShieldCheck size={12}/>Mock provider data · no credits used</span><span>Qualification threshold: 70 · Confidence threshold: 65</span></div>
    </div>
  </main>{selectedLead && <LeadDrawer lead={selectedLead} onClose={()=>setSelectedLead(null)}/>} {wizardOpen&&<ProjectWizard onClose={()=>setWizardOpen(false)} onComplete={createAndAnalyzeProject}/>} {analysisReview&&<BusinessAnalysisReview analysis={analysisReview.analysis} projectName={analysisReview.projectName} onClose={()=>setAnalysisReview(null)} onApprove={(services)=>runDiscovery(analysisReview.projectId,services)}/>} {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1f3128] px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{notice}</div>}</div>;
}
