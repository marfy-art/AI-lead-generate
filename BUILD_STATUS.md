# Build Status

Updated: 2026-09-15

## Completed

- Milestone 0 repository, environment template, architecture notes, strict TypeScript, database schema, provider contracts, mock providers, fixtures, scoring and waterfall tests.
- Milestone 1 product shell: dashboard, functional project setup wizard, project context, lead table, filters, lead detail drawer, evidence/provenance, outreach drafts, usage view, and provider settings in mock mode.
- Initial API boundaries for project creation and project leads with Zod validation.
- Milestone 2 foundation: project creation now calls internal APIs, mock business analysis is schema-validated, and users can edit/approve the structured analysis before mock discovery.
- Supabase-ready auth foundation: browser/server clients, session-refresh proxy, PKCE callback, passwordless login UI, Drizzle connection factory, and configuration-status endpoint. All fall back safely to mock mode when credentials are absent.
- Milestone 3 mock discovery pipeline: buyer/seller candidate discovery, normalization, deterministic deduplication with matched-key audit output, and a dashboard action connected to the API.
- Milestone 4 intent and qualification: explicit/commercial/inferred labels, Bangla and English signal matching, service aliases, negative-job filters, recency decay, and enrichment/watchlist gating.
- Safe public-URL extraction boundary: protocol/host/port checks, DNS private-address protection, redirect revalidation, robots handling, content-type/size/time limits, and an explicit disabled-by-default switch.
- Milestone 5 role-recommendation foundation: configurable service/company-size decision-maker matrix with role reasoning and avoid-role guidance.
- Milestone 8 deterministic outreach foundation: channel recommendation, suppression checks, evidence-linked drafts, inferred-claim guard, and mandatory human review response.
- API endpoints for discovery, extraction, intent analysis, decision-maker recommendation, and outreach generation.
- Mock/live-aware enrichment endpoint with budget enforcement, provider attempt output, confidence stop condition, and a working bulk-enrichment dashboard action.
- Working selected/visible lead CSV download with spreadsheet-formula injection protection.
- All primary navigation destinations are route-backed: Overview, Lead workspace, Projects, Lists, Sources, Providers, AI models, Usage & cost, Job monitoring, Suppression, and Admin. A mobile tab bar keeps them accessible when the desktop sidebar is hidden.
- AI Models tab and API: add OpenAI/OpenAI-compatible Responses API endpoints, exact model IDs, server-only API keys, masked configuration listings, active-model selection, deletion, audit events, encrypted-persistence schema, and automatic live Business Analysis routing.
- Live Google Places Text Search, Hunter company/people/email-find/email-verify, and Apollo organization/people search and non-phone person-match adapters with secret-safe headers, bounded requests, and retry-aware errors.
- Card-free OpenStreetMap/Nominatim company lookup fallback with explicit opt-in, 24-hour bounded cache, serialized one-request-per-second limit, identifiable requests, and contributor attribution.
- One shared responsive sidebar and mobile navigation across every authenticated product page.
- Operations foundation: provider usage/cost aggregation, audit events, provider readiness screen, usage/audit screen, and hashed suppression-list screen.
- Retryable background-job runner, durable PostgreSQL job records, and Inngest scheduling with three-attempt retries plus a local mock-mode fallback.
- Workspace admin controls for quality/confidence thresholds, evidence retention, mock safety, and editable service taxonomy.
- Database-backed saved views, configurable provider enable/order controls, failed-job monitoring/retry UI, and mock-safe in-memory fallbacks.
- Stable lead scoring, field provenance, and bulk enrichment APIs wired into the lead workspace.
- Safe `.env.local` scaffold, production setup checklist, and a secret-safe `npm run setup:check` readiness command.
- Supabase project provisioned in South Asia, migrations `0000` through `0005` applied successfully, workspace settings RLS/member policy verified, email authentication enabled, localhost callback allow-listed, and the local app connected with its publishable configuration.
- Dedicated Google Cloud project created for SignalDesk; Places API remains optional because it requires card verification. OpenStreetMap is available as the card-free low-volume lookup fallback.
- Authenticated workspace resolution maps the UI's `demo` alias to the signed-in user's real workspace and checks explicit workspace/project membership.
- Durable repositories now cover projects, business analyses, discovered candidates and evidence, workspace/provider settings, saved views, suppression entries, AI model configurations, background jobs, provider usage, and audit events.
- AI provider keys use AES-256-GCM encryption at rest and are decrypted only immediately before a server-side provider call; public API output contains only a masked key.
- Database migrations `0004` and `0005` add workspace settings, masked suppression labels, and provider-attempt status tracking.
- GitHub Actions runs the locked install, lint, strict typecheck, all tests, and production build on pushes and pull requests; Dependabot checks npm and Actions dependencies weekly.
- Global response headers add clickjacking, MIME-sniffing, referrer, cross-origin opener, camera, microphone, and geolocation protections.
- Quality baseline: 62 unit tests across 20 files, lint and strict typecheck passing. Production build is re-verified after each integration batch.

## In progress / next

- Add the direct PostgreSQL connection and stable encryption secrets to the local and hosted environments.
- Exercise the durable repositories against the hosted database and verify workspace isolation/RLS with two authenticated test users.
- Validate Google Places and Hunter against the user's accounts and real quotas after credentials are configured.
- Validate Apollo people-result ranking and enrichment against the user's account after an Apollo key/plan is available.
- Validate the connected Inngest application and webhook signing after its event/signing keys are configured.
- Complete production deployment after hosted secrets, database access, and source-policy approvals are provided.

## Blockers

None for mock-mode development. Real provider validation requires credentials. Production public-source collection requires per-source terms and legal review.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Leave `MOCK_PROVIDERS=true` for the local demo.
4. Run `npm run dev`.
