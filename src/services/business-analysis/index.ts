import { businessAnalysisSchema, type BusinessAnalysis } from "../../lib/ai/schemas";
import {resolveActiveAiConfigPersistent} from "../persistence/ai-models";

export type AnalyzeBusinessInput = {
  input: string;
  goal: "buyers" | "sellers" | "both";
  selectedServices?: string[];
  geography?: string;
};

const serviceDetails: Record<string, Omit<BusinessAnalysis["services"][number], "name">> = {
  Photography: { category: "Creative services", keywords: ["photographer", "product photography", "food photography"], buyerPainPoints: ["Launch assets are not ready", "Existing visuals do not represent product quality"], buyerPersonas: ["Owner", "Brand Manager", "Marketing Manager"], sellerPersonas: ["Commercial photographer", "Photography studio"], intentPhrases: ["looking for a photographer", "need product photos", "ফটোগ্রাফার দরকার"], negativeKeywords: ["photography course", "permanent job"] },
  Videography: { category: "Creative services", keywords: ["videographer", "short-form video", "brand film"], buyerPainPoints: ["Campaign lacks video assets"], buyerPersonas: ["Marketing Manager", "Content Lead"], sellerPersonas: ["Videographer", "Production studio"], intentPhrases: ["need a videographer", "video production partner"], negativeKeywords: ["tutorial", "full-time vacancy"] },
  "Graphic Design": { category: "Design", keywords: ["graphic designer", "brand design", "menu design"], buyerPainPoints: ["Inconsistent campaign or brand assets"], buyerPersonas: ["Owner", "Brand Manager"], sellerPersonas: ["Freelance designer", "Design agency"], intentPhrases: ["looking for a designer", "need a menu designed"], negativeKeywords: ["design course", "job seeker"] },
  "Digital Marketing": { category: "Marketing", keywords: ["digital marketer", "paid social", "campaign"], buyerPainPoints: ["Acquisition is underperforming"], buyerPersonas: ["Founder", "Head of Marketing"], sellerPersonas: ["Digital marketer", "Marketing agency"], intentPhrases: ["need marketing help", "looking for an agency"], negativeKeywords: ["marketing course", "internship"] },
  "Web Development": { category: "Technology", keywords: ["web developer", "landing page", "ecommerce"], buyerPainPoints: ["Website is missing or under-converting"], buyerPersonas: ["Founder", "Digital Lead", "Product Lead"], sellerPersonas: ["Web developer", "Web agency"], intentPhrases: ["need a website", "looking for web developer"], negativeKeywords: ["coding course", "developer job"] },
  "Event Planning": { category: "Events", keywords: ["event planner", "event production", "vendor"], buyerPainPoints: ["Event logistics need external capacity"], buyerPersonas: ["Event Manager", "Operations Manager", "HR Manager"], sellerPersonas: ["Event planner", "Event production company"], intentPhrases: ["need an event planner", "event vendor required"], negativeKeywords: ["event management course", "permanent role"] },
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["businessSummary", "businessModel", "marketplaceSides", "services", "geographies", "recommendedSources", "assumptions", "mode"],
  properties: {
    businessSummary: { type: "string" },
    businessModel: { type: "string" },
    marketplaceSides: { type: "array", minItems: 1, items: { type: "string", enum: ["buyer", "seller"] } },
    services: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "keywords", "buyerPainPoints", "buyerPersonas", "sellerPersonas", "intentPhrases", "negativeKeywords"],
        properties: {
          name: { type: "string" }, category: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          buyerPainPoints: { type: "array", items: { type: "string" } },
          buyerPersonas: { type: "array", items: { type: "string" } },
          sellerPersonas: { type: "array", items: { type: "string" } },
          intentPhrases: { type: "array", items: { type: "string" } },
          negativeKeywords: { type: "array", items: { type: "string" } },
        },
      },
    },
    geographies: { type: "array", items: { type: "string" } },
    recommendedSources: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    mode: { type: "string", enum: ["live"] },
  },
} as const;

type ResponsesApiBody = { output_text?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }> };

function extractOutputText(body: ResponsesApiBody) {
  if (typeof body.output_text === "string") return body.output_text;
  for (const item of body.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && typeof content.text === "string") return content.text;
  return null;
}

async function analyzeLive(input: AnalyzeBusinessInput, workspaceId: string): Promise<BusinessAnalysis | null> {
  const config = await resolveActiveAiConfigPersistent(workspaceId);
  if (!config) return null;
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/responses`;
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(45_000),
    headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      store: false,
      instructions: "Analyze the submitted business for ethical B2B lead discovery. Use only facts present in the input; put uncertainties in assumptions. Return concise structured data and set mode to live.",
      input: JSON.stringify(input),
      text: { format: { type: "json_schema", name: "business_analysis", strict: true, schema: responseSchema } },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Active AI model request failed (${response.status})${detail ? `: ${detail}` : "."}`);
  }
  const text = extractOutputText(await response.json() as ResponsesApiBody);
  if (!text) throw new Error("Active AI model returned no text output.");
  return businessAnalysisSchema.parse(JSON.parse(text));
}

export async function analyzeBusiness(input: AnalyzeBusinessInput, workspaceId = "demo"): Promise<BusinessAnalysis> {
  const live = await analyzeLive(input, workspaceId);
  if (live) return live;
  const services = (input.selectedServices?.length ? input.selectedServices : ["Photography", "Graphic Design", "Web Development"]).map((name) => ({
    name,
    ...(serviceDetails[name] ?? { category: "Local services", keywords: [name.toLowerCase()], buyerPainPoints: ["Qualified service capacity is difficult to find"], buyerPersonas: ["Owner", "Operations Manager"], sellerPersonas: [`${name} professional`], intentPhrases: [`need ${name.toLowerCase()}`], negativeKeywords: ["course", "permanent job"] }),
  }));
  const sides = input.goal === "both" ? ["buyer", "seller"] as const : [input.goal === "buyers" ? "buyer" : "seller"] as const;
  return businessAnalysisSchema.parse({
    businessSummary: "Kriyakarak is a two-sided services marketplace connecting buyers with qualified local experts and service providers.",
    businessModel: "Two-sided services marketplace",
    marketplaceSides: sides,
    services,
    geographies: [input.geography ?? "Dhaka, Bangladesh"],
    recommendedSources: ["user_provided", "google_places", "public_web", "apollo", "hunter"],
    assumptions: ["The submitted source represents Kriyakarak or its current service catalog.", "Dhaka is the initial pilot geography.", "Real provider calls remain disabled until credentials and source reviews are complete."],
    mode: "mock",
  });
}
