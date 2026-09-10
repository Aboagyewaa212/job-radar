# Migrations

These SQL files mirror the hosted Job Radar Supabase migration history. Apply them in timestamp order. The daily-ingestion migration expects two Vault entries named `job_radar_project_url` and `job_radar_publishable_key`; the values are environment-specific and are intentionally not stored in SQL migrations.
