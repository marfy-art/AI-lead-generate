# Architecture Decisions

## ADR-001: Modular monolith first

Use Next.js server routes/actions with clean service and provider boundaries. This keeps the MVP simple while allowing discovery and enrichment jobs to move into workers later.

## ADR-002: Drizzle + PostgreSQL

Use Drizzle for explicit SQL-shaped schemas and PostgreSQL/Supabase compatibility. Contact values are modeled as encrypted payloads plus normalized hashes; raw values must not be logged.

## ADR-003: Mock mode is a first-class runtime

Every required provider capability has deterministic mock fixtures. A missing credential disables the real adapter instead of pretending a third-party call succeeded.

## ADR-004: Evidence precedes paid enrichment

Discovery and intent qualification run before decision-maker/contact enrichment. Waterfalls stop once field quality reaches the configured threshold or budget is exhausted.

## ADR-005: Scores and confidence remain separate

Lead score represents opportunity quality. Confidence represents the reliability of available data. A strong fit may still need review.

## ADR-006: Human-reviewed outreach

V1 generates editable drafts only. It does not autonomously send high-volume outreach.

## ADR-007: Pilot defaults

Kriyakarak, Dhaka, buyer + seller acquisition, English/Bangla-ready messaging, and the blueprint's service-to-role matrix are the seeded defaults. Geography and taxonomy remain configurable.

## ADR-008: Webpack for production builds

Use Next.js's supported `--webpack` production-build mode because Turbopack's CSS worker requires an internal port that is unavailable in restricted CI/sandbox environments. Development remains on the Next.js default compiler.

## ADR-009: Supabase SSR with mock-safe fallback

Use cookie-based Supabase SSR clients and Next.js 16 `proxy.ts` for token refresh. When public Supabase configuration is absent, clients return `null` and the product remains usable in explicitly labelled mock mode. Supabase packages are pinned to Node.js 20-compatible releases until the project runtime is upgraded to Node.js 22.

## ADR-010: Public extraction is opt-in and SSRF hardened

Public-web fetches remain disabled by default. When explicitly enabled after source-policy review, each initial URL and redirect is restricted to HTTP(S), standard ports, public DNS targets, HTML responses, bounded size/time, and robots-permitted paths. This boundary does not authorize collection from a source whose terms disallow it.

## ADR-011: Deterministic safeguards around AI workflows

Deduplication, recency decay, qualification thresholds, decision-maker role selection, channel selection, suppression handling, and final claim checks are deterministic domain logic. AI/provider output must pass these boundaries before persistence or display.

## ADR-012: Session-backed operations before database activation

Usage, audit, suppression, and job APIs use explicitly labelled in-memory mock repositories until Supabase migrations are applied. The same service boundaries map to the existing PostgreSQL tables; the UI never implies that session-backed data is durable.

## ADR-013: Provider secrets stay server-side

Google Places and Hunter adapters run only in server routes, send credentials in provider-supported headers, return sanitized errors, and never expose or log keys. Google Places is used for company discovery rather than decision-maker truth.

## ADR-014: Workspace-selectable AI models

Allow an administrator to register OpenAI and public HTTPS OpenAI-compatible endpoints with an exact model ID. Keys are write-only: list responses expose only a suffix, browser storage is prohibited, and production persistence uses the encrypted key column. Only one configuration is active per workspace. Local mock mode stores secrets in server memory and labels that state as non-durable. Business Analysis automatically uses the active configuration through the Responses API with strict structured output; without an active model it remains in mock mode, while provider failures are surfaced instead of silently fabricating results.

## ADR-015: Complete the credential-free operations surface in session mode

Admin configuration, provider ordering, saved views, and job monitoring use workspace-scoped server memory for the local pilot and are labelled non-durable. Stable APIs and database tables are defined now so the UI remains functional without credentials and can move to Supabase without changing user workflows. Bulk enrichment stays budget-gated, retries are restricted to failed jobs, and production provider activation still requires credentials and policy checks.
