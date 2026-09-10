create table if not exists public.job_ingestion_guard (
  id smallint primary key check (id = 1),
  token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_ingestion_guard enable row level security;
revoke all on table public.job_ingestion_guard from anon, authenticated;
grant select on table public.job_ingestion_guard to service_role;

create table if not exists public.function_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('career_assistant','match_jobs','parse_resume')),
  created_at timestamptz not null default now()
);
alter table public.function_usage enable row level security;
revoke all on table public.function_usage from anon, authenticated;
grant select, insert, delete on table public.function_usage to service_role;
create index if not exists function_usage_user_action_created_idx on public.function_usage(user_id, action, created_at desc);

revoke execute on function public.enforce_daily_application_goal() from public, anon;

DO $$
DECLARE
  token text := encode(gen_random_bytes(32), 'hex');
BEGIN
  insert into public.job_ingestion_guard(id, token_hash, updated_at)
  values (1, encode(digest(token, 'sha256'), 'hex'), now())
  on conflict (id) do update set token_hash = excluded.token_hash, updated_at = now();

  perform vault.create_secret(token, 'job_radar_ingestion_token', 'Dedicated secret for Job Radar scheduled ingestion', null);
END $$;

DO $$
DECLARE existing_job bigint;
BEGIN
  select jobid into existing_job from cron.job where jobname = 'job-radar-daily-ingestion' limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
END $$;

select cron.schedule(
  'job-radar-daily-ingestion',
  '15 5 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'job_radar_project_url' order by created_at desc limit 1) || '/functions/v1/ingest-job-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'job_radar_publishable_key' order by created_at desc limit 1),
        'x-job-radar-cron-token', (select decrypted_secret from vault.decrypted_secrets where name = 'job_radar_ingestion_token' order by created_at desc limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) as request_id;
  $$
);
