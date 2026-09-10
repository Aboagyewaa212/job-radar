create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_source_external_unique'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_source_external_unique unique (source_id, external_id);
  end if;
end $$;

select cron.schedule(
  'job-radar-daily-ingestion',
  '15 5 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'job_radar_project_url') || '/functions/v1/ingest-job-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'job_radar_publishable_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) as request_id;
  $$
);
