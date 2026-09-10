# ingest-job-scan

Scheduled production ingestion for Remote OK and Arbeitnow. The function is intentionally deployed with platform JWT verification disabled because Postgres Cron cannot mint a user JWT; the function performs its own `apikey` check against the project's publishable-key set, uses the backend-only secret key internally, and enforces a six-hour cooldown. Do not expose the backend secret key in this repository.
