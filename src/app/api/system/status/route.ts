import { NextResponse } from "next/server";
import { getSupabasePublicConfig, isDatabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  const supabase = getSupabasePublicConfig();
  return NextResponse.json({
    mode: supabase.configured && isDatabaseConfigured() ? "live" : "mock",
    services: {
      supabaseAuth: { configured: supabase.configured },
      postgres: { configured: isDatabaseConfigured() },
      openai: { configured: Boolean(process.env.OPENAI_API_KEY) },
      googlePlaces: { configured: Boolean(process.env.GOOGLE_MAPS_API_KEY) },
      openStreetMap: { configured: process.env.ENABLE_NOMINATIM === "true" },
      apollo: { configured: Boolean(process.env.APOLLO_API_KEY) },
      hunter: { configured: Boolean(process.env.HUNTER_API_KEY) },
      inngest: { configured: Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY) },
      publicWeb: { configured: process.env.ENABLE_PUBLIC_WEB_FETCH === "true" },
    },
  });
}
