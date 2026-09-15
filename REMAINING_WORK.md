# SignalDesk — Remaining Work

Updated: 2026-09-15 (Asia/Dhaka)

## Current verified state

- The application works end to end in safe mock mode.
- Supabase authentication is connected.
- Hosted database migrations `0000` through `0005` are applied.
- All 27 public application tables have row-level security enabled.
- The workspace-settings member policy is active; tables without a policy remain deny-by-default through the Supabase Data API.
- Local lint, strict TypeScript checks, 62 tests, and the production build pass.
- GitHub `main` is synchronized and its latest CI run passes.

## P0 — required for durable production data

### 1. Connect PostgreSQL to the application

Status: blocked on local/hosting secret configuration.

- Put the transaction-pooler `DATABASE_URL` in `.env.local` and later in the hosting provider's secret manager.
- Never commit the URL or database password.
- Run `npm run setup:check`; PostgreSQL must report `READY`.
- Verify an authenticated user can create a workspace project, analyze it, discover candidates, and retrieve the stored rows after a server restart.

Completion evidence:

- The status endpoint reports PostgreSQL mode.
- Restarting the application does not lose projects, settings, saved views, suppressions, jobs, usage, or audit events.

### 2. Configure stable encryption

Status: not configured.

- Generate a unique 32-byte `APP_ENCRYPTION_KEY` and store it only in local/hosting secret storage.
- Run `npm run setup:check`; Encryption must report `READY`.
- Add a disposable AI configuration, confirm only ciphertext is stored in PostgreSQL, then delete it.
- Back up the key securely. Losing or rotating it without a migration makes stored provider keys unreadable.

Completion evidence:

- The API returns only a masked key.
- Database content contains AES-256-GCM ciphertext and no plaintext API key.

### 3. Complete database-backed lead workflows

Status: partially implemented.

- Project, analysis, discovered-candidate, intent evidence, settings, saved-view, suppression, job, usage, audit, and AI-configuration writes have durable repositories.
- Replace remaining fixture-only project-lead reads with database queries.
- Persist score history, decision-maker matches, contact points/provenance, enrichment attempts, and outreach drafts.
- Keep mock fixtures as an explicit demo mode, not as the production fallback for an authenticated database workspace.

Completion evidence:

- A database-backed lead can be opened, scored, enriched, reviewed, and drafted after an application restart.
- Every displayed contact field exposes its source, confidence, verification state, and retrieval time.

### 4. Verify workspace isolation

Status: pending two authenticated test users.

- Create two disposable users in separate workspaces.
- Confirm each user can access only their own projects, jobs, settings, lists, suppressions, usage, audits, and AI configurations.
- Test guessed workspace, project, lead, job, list, suppression, and AI-configuration UUIDs.
- Record `401`, `403`, or `404` responses without leaking whether another tenant's record exists.

Completion evidence:

- Cross-workspace reads and writes fail for every tested resource.

## P1 — live automation and providers

### 5. Connect Inngest

Status: handler and retryable function implemented; credentials missing.

- Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to the deployment secret manager.
- Register `/api/inngest` using the final HTTPS application origin.
- Trigger discovery, confirm queued/running/completed transitions, and test a forced retry/failure.
- Confirm replay does not create unintended duplicate candidates.

### 6. Validate live providers

Status: adapters implemented; account-owned credentials/quotas not configured.

- OpenAI or compatible model: structured Business Analysis and failure handling.
- Hunter: domain search, person lookup, email find, and email verification.
- Apollo: organization and people search plus ranking quality.
- Google Places: optional, after billing/quota approval.
- OpenStreetMap/Nominatim: optional low-volume fallback after setting an identifying user agent and accepting its usage constraints.
- Keep per-workspace provider enablement, priority, terms approval, budget, and capability checks active.

Completion evidence:

- Each enabled provider has one successful and one controlled-failure test recorded in usage/audit history.
- Paid calls stop at the configured budget and fall through only to affordable providers.

## P2 — deployment and operations

### 7. Production deployment

- Select a Next.js-compatible host and connect the GitHub repository.
- Configure application URL, Supabase values, PostgreSQL, encryption, and Inngest secrets in the host.
- Set the Supabase production site URL and callback URL to the final HTTPS domain.
- Run smoke tests for login, project creation, discovery, persistence, provider budgets, job retries, suppression, export, and logout.
- Verify the security response headers on the deployed origin.

### 8. Operational safeguards

- Configure error monitoring and alerts without logging secrets or raw sensitive contact data.
- Define backup, restore, retention, deletion, and encryption-key-rotation procedures.
- Review provider/source terms, privacy obligations, and lawful contact-processing rules before importing or enriching real people.
- Add a documented incident-response and credential-revocation procedure.

### 9. Dependency maintenance

- Review the open Dependabot pull requests individually.
- Do not merge failing TypeScript or ESLint major upgrades until compatibility changes are understood and CI passes.
- Prefer small, passing upgrades with regression verification.

## Recommended execution order

1. Configure `DATABASE_URL` and `APP_ENCRYPTION_KEY`.
2. Verify durable writes/reads and finish database-backed lead workflows.
3. Run the two-user workspace-isolation suite.
4. Deploy the mock-safe application to HTTPS.
5. Connect and validate Inngest.
6. Enable one live provider at a time after quota and terms review.
7. Complete operational, privacy, backup, and incident-response checks before real-contact use.

## Readiness command

Run:

```bash
npm run setup:check
```

Current result:

- Supabase Auth: `READY`
- PostgreSQL: `MISSING`
- Encryption: `MISSING`
- Live providers and Inngest: optional/not configured
- Runtime mode: safe mock providers
