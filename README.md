# SignalDesk — AI Lead Intelligence

SignalDesk is the Kriyakarak pilot for evidence-first buyer and seller lead intelligence. It discovers candidates, separates observed intent from inference, resolves the most relevant decision-maker, enriches contact data through a cost-aware provider waterfall, and drafts evidence-grounded outreach.

## Current state

The product runs end to end in mock mode without paid API keys. When PostgreSQL is configured, projects, analysis, discovery evidence, workspace settings, saved views, suppressions, encrypted AI configuration, jobs, usage, and audits use durable workspace-scoped storage. No outreach is sent automatically.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Keep `MOCK_PROVIDERS=true` until provider credentials and compliance review are complete.

Visit `/login` to test the auth surface. Without Supabase environment values it offers a mock-mode continuation; with valid values it sends a Supabase passwordless sign-in link and completes the PKCE callback at `/auth/callback`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the complete local/CI gate with `npm run ci`.

## Architecture

- Next.js App Router and strict TypeScript
- Tailwind CSS for the UI system
- PostgreSQL schema via Drizzle ORM
- Cookie-based Supabase SSR authentication with a mock-safe fallback
- Replaceable provider adapters and field-specific waterfalls
- Zod at API and AI-output boundaries
- Mock providers and fixtures for local development
- Opt-in OpenStreetMap/Nominatim company lookup for card-free, low-volume fallback use
- AES-256-GCM encryption for database-stored AI provider keys
- Inngest discovery scheduling with retries and a local mock-mode fallback

Core API routes:

- `POST /api/projects/:id/discover`
- `POST /api/projects/:id/extract`
- `POST /api/projects/:id/jobs`
- `POST /api/leads/:id/analyze-intent`
- `POST /api/leads/:id/find-decision-maker`
- `POST /api/leads/:id/enrich`
- `POST /api/leads/bulk/enrich`
- `POST /api/leads/:id/score`
- `GET /api/leads/:id/provenance`
- `POST /api/leads/:id/generate-outreach`
- `GET|POST /api/workspaces/:id/jobs`
- `GET|PATCH /api/workspaces/:id/config`
- `GET|POST|DELETE /api/workspaces/:id/lists`
- `GET /api/workspaces/:id/operations`
- `GET|POST|DELETE /api/workspaces/:id/suppressions`
- `GET|POST|PATCH|DELETE /api/workspaces/:id/ai-models`
- `GET|POST|PUT /api/inngest`

The domain layer owns scoring, qualification, provenance, and contact classification. Provider-specific behavior stays behind adapters. Raw and normalized evidence retain source metadata. Paid enrichment only follows qualification.

## Safety and compliance

- Never label generated contact guesses as verified.
- Company main numbers are never presented as direct numbers.
- Inferred needs are visibly marked as inference.
- Secrets belong in environment variables and are excluded from source control.
- Public content is untrusted input; extraction is disabled by default and enforces URL validation, DNS/redirect SSRF defenses, basic sanitization, robots/source policy, and bounded responses when enabled.
- Public Nominatim lookup is disabled by default. When opted in it is cached, serialized to at most one request per second, identified with a custom user agent, and attributed to OpenStreetMap contributors; it is not a bulk discovery source.
- V1 drafts outreach for human review and does not perform mass sending.

See [BUILD_STATUS.md](./BUILD_STATUS.md) for progress and [DECISIONS.md](./DECISIONS.md) for implementation choices.
