"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronDown,
  Compass,
  Database,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const navigationLinks=[
  {label:"Overview",href:"/overview",icon:LayoutDashboard},
  {label:"Lead workspace",href:"/",icon:Target},
  {label:"Projects",href:"/projects",icon:BriefcaseBusiness},
  {label:"Lists",href:"/lists",icon:ListFilter},
  {label:"Sources",href:"/sources",icon:Compass},
  {label:"Providers",href:"/settings/providers",icon:Database},
  {label:"AI models",href:"/settings/ai-models",icon:BrainCircuit},
  {label:"Usage & cost",href:"/settings/usage",icon:BarChart3},
  {label:"Job monitoring",href:"/monitoring",icon:Activity},
  {label:"Suppression",href:"/settings/suppression",icon:ShieldCheck},
  {label:"Admin",href:"/settings",icon:Settings},
] as const;

function isActive(pathname:string,href:string){return href==="/"||href==="/settings"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);}

export function AppSidebar(){
  const pathname=usePathname();
  return <aside className="app-sidebar fixed inset-y-0 left-0 z-20 flex w-[232px] flex-col border-r border-[#dce2dc] bg-[#f9faf8] px-3 py-4 transition-all">
    <Link href="/" className="flex h-11 items-center gap-2.5 px-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#214f3c] text-white"><Sparkles size={16}/></span>
      <span className="brand-copy"><span className="block font-display text-[15px] font-extrabold tracking-tight">SignalDesk</span><span className="block text-[10px] font-medium text-[#778079]">Lead intelligence</span></span>
    </Link>
    <button type="button" className="mt-4 flex w-full items-center gap-2 rounded-lg border border-[#dce2dc] bg-white px-2.5 py-2 text-left shadow-sm">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#d8ef9c] text-[11px] font-bold">K</span>
      <span className="workspace-copy min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Kriyakarak</span><span className="block text-[10px] text-[#7a827c]">Pilot workspace</span></span>
      <ChevronDown className="workspace-copy" size={14}/>
    </button>
    <nav aria-label="Primary navigation" className="mt-5 space-y-1">
      {navigationLinks.map(({label,href,icon:Icon})=>{const active=isActive(pathname,href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={`flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-xs font-medium transition ${active?"bg-[#e5eee8] text-[#204f3b]":"text-[#616a63] hover:bg-[#eef1ee]"}`}><Icon size={16} strokeWidth={active?2.3:1.8}/><span className="sidebar-label">{label}</span></Link>;})}
    </nav>
    <div className="upgrade-card mt-auto rounded-xl border border-[#dbe3d5] bg-[#f0f6e7] p-3">
      <div className="flex items-center gap-2 text-xs font-bold"><Sparkles size={14} className="text-[#5e8027]"/>Mock-safe mode</div>
      <p className="mt-1.5 text-[10px] leading-4 text-[#6d766e]">Paid providers stay off until they are explicitly configured.</p>
    </div>
    <div className="mt-3 flex items-center gap-2 px-2 py-1.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#25382f] text-[10px] font-bold text-white">SH</span><span className="workspace-copy min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Workspace admin</span><span className="block truncate text-[10px] text-[#858d87]">Pilot account</span></span><MoreHorizontal className="workspace-copy" size={15}/></div>
  </aside>;
}

export function MobileNavigation(){
  const pathname=usePathname();
  return <nav aria-label="Mobile navigation" className="mobile-nav scrollbar-thin hidden overflow-x-auto border-b border-[#dfe4e0] bg-white px-4 py-2">
    {navigationLinks.map(({label,href})=>{const active=isActive(pathname,href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${active?"bg-[#244f3e] text-white":"bg-[#f1f3f1] text-[#5e6861]"}`}>{label}</Link>;})}
  </nav>;
}
