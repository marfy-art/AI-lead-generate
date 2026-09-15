"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export function createClient() {
  const { url, publishableKey, configured } = getSupabasePublicConfig();
  if (!configured || !url || !publishableKey) return null;
  return createBrowserClient(url, publishableKey);
}
