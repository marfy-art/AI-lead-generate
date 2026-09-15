export type LeadSide = "buyer" | "seller";
export type IntentType = "explicit" | "commercial" | "inferred" | "fit";
export type LeadStatus = "Outreach ready" | "Needs review" | "Watchlist";

export type Evidence = {
  id: string;
  kind: "Observed fact" | "Provider data" | "AI inference";
  title: string;
  excerpt: string;
  source: string;
  sourceUrl?: string;
  date: string;
};

export type Lead = {
  id: string;
  side: LeadSide;
  company: string;
  person: string;
  role: string;
  initials: string;
  avatarTone: string;
  service: string;
  location: string;
  score: number;
  confidence: number;
  intent: IntentType;
  lastSignal: string;
  sourceCount: number;
  email: string | null;
  emailStatus: "Verified" | "Unverified" | "Not found";
  phone: string | null;
  phoneType: "Direct work" | "Company main" | "Not found";
  preferredChannel: "Email" | "Call" | "LinkedIn" | "Instagram";
  status: LeadStatus;
  why: string;
  summary: string;
  decisionReason: string;
  risk: string;
  evidence: Evidence[];
  outreach: { subject: string; body: string };
};
