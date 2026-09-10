# Job Radar

A multi-user career intelligence app that matches verified jobs to each user's CV, experience, skills and target fields. The codebase is intentionally portable: React/TypeScript frontend, Supabase backend, SQL migrations, Edge Functions, tests, Docker and GitHub Actions all live in one repository.

## Current implementation

Implemented: Supabase Auth integration, per-user profiles/preferences, private resume storage, shared jobs/sources, personalized match records, saved jobs, application stages, server-enforced daily application cap (maximum 5), closed-job history visibility, Resume Studio shell, responsive dashboard, light-first design language, source-controlled migrations, matching Edge Function, deterministic truthful resume-tailoring fallback, business-rule tests and CI configuration.

Not yet enabled in production: automated external job-source adapters, rich PDF/DOCX text extraction, outbound notifications and LLM-powered rewriting. Their boundaries already exist under `supabase/functions/`; they require source/provider configuration and should not be faked or exposed insecurely.

## Repository structure

- `frontend/` React + TypeScript application
- `backend/` framework-independent business rules, schemas, tests and service boundaries
- `supabase/` project config, migrations and Edge Functions
- `database/` schema documentation/seeds
- `docker/` local container notes
- `.github/workflows/` CI

## Hosted Supabase project

Project ref: `jtrzwipsgiiaqcfqeqmh`

The frontend reads these environment variables:

```bash
VITE_SUPABASE_URL=https://jtrzwipsgiiaqcfqeqmh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Never put a Supabase secret key/service-role key in frontend code or Git.

## Local development

Requirements: Node 22+, npm, Docker Desktop (or another Docker-compatible runtime), Supabase CLI.

```bash
cp .env.example .env.local
npm install
npm run dev
```

To run the Supabase stack locally:

```bash
supabase start
supabase db reset
```

To link this repository to the already-created hosted project:

```bash
supabase link --project-ref jtrzwipsgiiaqcfqeqmh
```

## Quality checks

```bash
npm run check
node --test backend/tests/business-rules.test.mjs
```

CI runs typecheck, unit tests and production build on pushes/PRs to `main` and `develop`.

## Versioning

Use `main` for stable releases, `develop` for integrated work, and `feature/*` branches for isolated features. The initial local tag is `v0.1.0`.

## Product principles

The interface is a compact "precision radar": crisp hierarchy, restrained ink-and-paper surfaces, modest radii, compact metadata, DM Serif Display for editorial emphasis, IBM Plex Sans for UI, IBM Plex Mono for scores/labels, and electric blue as the primary signal color. Figma remains the visual source of truth; this repository remains the implementation source of truth.
