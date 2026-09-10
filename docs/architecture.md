# Job Radar architecture

Figma is the visual design source of truth. GitHub is the implementation and version-history source of truth. Supabase provides Auth, PostgreSQL, Row Level Security, Storage, Cron and Edge Functions.

## Runtime flow

1. A user signs up through Supabase Auth.
2. The auth trigger creates that user's profile and default preferences.
3. Onboarding stores career direction and uploads the resume to a private user-owned Storage path.
4. `parse-resume` extracts plain text when possible; richer PDF/DOCX extraction is a separate future adapter.
5. `ingest-job-scan` imports normalized verified-source jobs to the shared jobs catalogue.
6. `match-user-jobs` evaluates the active catalogue against each user's evidence and preferences and writes private `user_job_matches` rows.
7. The React frontend reads only rows allowed by RLS and lets the user save/track applications.
8. PostgreSQL enforces the daily application maximum independently of the browser.
9. `tailor-resume` creates a truthful per-job resume record without inventing facts.

## Trust boundaries

The Vite client receives only the Supabase project URL and publishable key. Backend secret keys remain inside the Supabase Edge Function environment. All exposed user-owned tables have RLS. The scheduled ingestion endpoint does not rely on a user session; it validates the project publishable API key and performs privileged writes only inside the Edge Function.
