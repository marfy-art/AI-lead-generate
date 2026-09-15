# Production Setup Checklist

The application is complete and safe in mock mode. Real provider and durable production mode require account-owned credentials; never paste secret keys into chat or commit them to source control.

## 1. Supabase — project and migrations connected

Completed: the project is healthy in South Asia, migrations `0000` through `0005` are applied, all 27 public application tables have RLS enabled, the workspace settings member policy is verified, email authentication is enabled, and the localhost callback is allow-listed. Tables without an explicit policy remain deny-by-default through the Supabase Data API; the application uses authenticated server routes and workspace checks. The publishable project configuration is present locally. Durable workspace-scoped repositories are implemented in the application.

Remaining: add `DATABASE_URL`, then verify workspace isolation with two authenticated users before importing real contacts. The existing database password cannot be viewed; do not reset it without confirming that no existing connection depends on it.

## 2. AI model

Add an OpenAI or Responses-compatible API in **Admin → AI Models**. With PostgreSQL and `APP_ENCRYPTION_KEY` configured, the key is encrypted with AES-256-GCM before database storage and never returned by the API. Without them, local mock mode remains process-scoped. For a server environment fallback, set `OPENAI_API_KEY` through the hosting provider's secret manager.

## 3. Discovery and enrichment providers

Create or select account projects, review pricing/quotas and permitted use, then configure:

- Google Cloud: enable Places API and create a restricted server key.
- Card-free alternative: review the public Nominatim usage policy, set an identifying `NOMINATIM_USER_AGENT`, and opt in with `ENABLE_NOMINATIM=true`. Keep usage low-volume; this is not a bulk discovery endpoint.
- Apollo: create an API key with only the required organization/people/enrichment access.
- Hunter: create an API key for domain search, finder, and verifier.

Keep `MOCK_PROVIDERS=true` until credentials, quotas, and source terms have been validated. Approve each source in **Admin → Providers** before enabling it.

## 4. Background jobs

Create an Inngest application and store its event/signing keys in the deployment secret manager. The `/api/inngest` handler and three-attempt discovery function are implemented; until keys and PostgreSQL are connected, local process-scoped jobs and retry controls remain available.

## 5. Security and deployment

1. Generate a unique 32-byte `APP_ENCRYPTION_KEY` and store it only as a secret.
2. Choose a Next.js-capable host and add every required environment value through its encrypted settings.
3. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS origin.
4. Run lint, typecheck, tests, and the production build.
5. Verify login, row-level workspace authorization, deletion/export, provider budgets, suppression, and audit records before processing real contacts.

## Readiness command

Run `npm run setup:check`. It prints only readiness states and never prints secret values.
