# Job Radar

A multi-user career intelligence app that matches verified jobs to each user's CV, experience, skills and target fields. React/TypeScript, Supabase, SQL migrations, Edge Functions, tests, Docker and GitHub Actions are versioned together.

## Current implementation

Implemented now:
- Supabase email/password authentication and per-user onboarding
- profiles, career preferences and private resume storage with RLS
- PDF, DOCX and plain-text resume extraction with file-size and parser safeguards
- personalized job matching, “why you match” evidence and skill gaps
- saved jobs and application-stage tracking
- configurable daily application goal with a hard server-side maximum of 5
- truthful Resume Studio generation/fallback that does not invent credentials
- browser-safe CORS/auth handling for user Edge Functions
- verified ingestion from Remote OK and Arbeitnow with source attribution
- duplicate prevention by `(source_id, external_id)`
- Supabase Cron daily ingestion at 05:15 UTC with a dedicated Vault-backed cron token and a 6-hour server cooldown
- server-side function usage limits and automatic usage-log retention cleanup
- safe HTTP/HTTPS application URL constraints
- authenticated account deletion with private resume-file cleanup
- responsive dashboard, loading/empty/error states
- source-controlled Supabase migrations and functions
- backend business-rule tests, UI regression tests and GitHub Actions verification

The first live ingestion smoke test completed successfully on 2026-09-10 and imported 699 feed records, resulting in 698 active deduplicated jobs.

Still intentionally pending: outbound push/email notification delivery and additional provider-specific source adapters. AI-assisted resume/cover-letter generation is optional and only runs when a server-side AI provider key is configured; otherwise Job Radar uses the truthful structured fallback.

## Repository structure

- `frontend/` React + TypeScript application
- `backend/` framework-independent business rules, schemas, tests and service boundaries
- `supabase/` project config, migrations and Edge Functions
- `database/` schema documentation/seeds
- `docker/` local container notes
- `.github/workflows/` CI

## Localhost

Requirements: Node 22.12+ and npm. The included `.env.example` contains the hosted project's public URL and **publishable** browser key (not a secret key).

```bash
git clone https://github.com/Aboagyewaa212/job-radar.git
cd job-radar
git checkout develop
cp .env.example .env.local
npm ci
npm run dev
```

Then open `http://localhost:5173`.

To run all available checks:

```bash
npm run check
```

To run the Supabase stack itself locally instead of using the hosted backend, install Docker and Supabase CLI, then use `supabase start` / `supabase db reset`. The normal frontend localhost workflow above intentionally uses the already-created hosted Job Radar backend.

## Hosted Supabase project

Project ref: `jtrzwipsgiiaqcfqeqmh`

Never put a Supabase secret/service-role key in frontend code or Git. The `sb_publishable_...` key used by the Vite frontend is designed to be public and all user data access remains enforced by RLS.

## CI and versioning

CI supports push, pull request and manual `workflow_dispatch` triggers. It uses a pinned Node/npm toolchain, installs the committed lockfile with `npm ci`, runs a full npm vulnerability audit, TypeScript checking, backend tests, UI tests and a production Vite build. CI has read-only repository contents permission.

Use `main` for stable releases, `develop` for integrated work, and `feature/*` branches for isolated features.

## Product principles

The interface is a compact “precision radar”: crisp hierarchy, restrained ink-and-paper surfaces, compact metadata, DM Serif Display for editorial emphasis, IBM Plex Sans for UI, IBM Plex Mono for scores/labels, and electric blue as the primary signal color. Figma remains the visual source of truth; this repository remains the implementation source of truth.
