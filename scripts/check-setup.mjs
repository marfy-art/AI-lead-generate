const checks = [
  ["Supabase Auth", ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"], false],
  ["PostgreSQL", ["DATABASE_URL"], false],
  ["Encryption", ["APP_ENCRYPTION_KEY"], false],
  ["OpenAI environment fallback", ["OPENAI_API_KEY"], true],
  ["Google Places", ["GOOGLE_MAPS_API_KEY"], true],
  ["OpenStreetMap lookup opt-in", ["ENABLE_NOMINATIM"], true],
  ["Apollo", ["APOLLO_API_KEY"], true],
  ["Hunter", ["HUNTER_API_KEY"], true],
  ["Inngest", ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"], true],
];
let missingRequired = false;
for (const [label, keys, optional] of checks) {
  const ready = keys.every((key) => key === "ENABLE_NOMINATIM" ? process.env[key] === "true" : Boolean(process.env[key]?.trim()));
  if (!ready && !optional) missingRequired = true;
  process.stdout.write(`${ready ? "READY" : optional ? "OPTIONAL" : "MISSING"}  ${label}\n`);
}
process.stdout.write(`MODE   ${process.env.MOCK_PROVIDERS === "false" ? "live providers requested" : "safe mock providers"}\n`);
if (missingRequired) process.exitCode = 1;
