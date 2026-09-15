"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) { router.push("/"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
    setLoading(false);
  }
  return <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1.05fr_.95fr]">
    <section className="hidden overflow-hidden bg-[#173d30] p-12 text-white lg:flex lg:flex-col"><div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d7ef91] text-[#173d30]"><Sparkles size={17}/></div><div className="font-display text-lg font-extrabold">SignalDesk</div></div><div className="my-auto max-w-lg"><div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b7d0c2]">Kriyakarak pilot</div><h1 className="font-display mt-4 text-5xl font-extrabold leading-[1.08] tracking-[-.045em]">Every lead should come with a reason.</h1><p className="mt-5 text-base leading-7 text-[#c2d3ca]">Find buyers and service providers, inspect the evidence, resolve the right decision-maker, and prepare outreach without losing provenance.</p><div className="mt-8 space-y-3">{["Observed facts stay separate from AI inference","Paid enrichment runs only after qualification","No outreach is sent without human review"].map(item=><div key={item} className="flex items-center gap-3 text-sm text-[#dce7e1]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/10"><Check size={12}/></span>{item}</div>)}</div></div><p className="text-xs text-[#87a397]">Evidence-first lead intelligence</p></section>
    <section className="grid place-items-center p-6"><div className="w-full max-w-sm"><div className="lg:hidden flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#244f3e] text-white"><Sparkles size={17}/></div><div className="font-display text-lg font-extrabold">SignalDesk</div></div><div className="mt-10 lg:mt-0"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf4ef] text-[#285d47]"><LockKeyhole size={18}/></div><h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight">Sign in to your workspace</h2><p className="mt-2 text-sm leading-6 text-[#717b74]">Use a secure email link. Passwords are not stored by SignalDesk.</p></div><form onSubmit={submit} className="mt-7"><label className="text-[10px] font-bold uppercase tracking-wider text-[#727c74]">Work email</label><div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-[#d9dfda] px-3 focus-within:border-[#4e7b67] focus-within:ring-1 focus-within:ring-[#4e7b67]"><Mail size={15} className="text-[#88918a]"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div><button disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#244f3e] text-sm font-bold text-white disabled:opacity-50">{supabase?(loading?"Sending link…":"Continue with email"):"Continue in mock mode"}<ArrowRight size={15}/></button></form>{message&&<div className="mt-4 rounded-lg bg-[#eef6f1] p-3 text-xs leading-5 text-[#38604d]">{message}</div>}<div className="mt-6 rounded-lg border border-[#e0e5e1] bg-[#fafbfa] p-3 text-[10px] leading-4 text-[#6e7870]">{supabase?"Live Supabase authentication is configured.":"Mock mode is active. Add Supabase environment values to enable secure email authentication."}</div></div></section>
  </main>;
}
