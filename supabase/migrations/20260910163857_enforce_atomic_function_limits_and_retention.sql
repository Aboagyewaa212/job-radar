create or replace function public.enforce_function_usage_limits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  hourly_limit integer;
  daily_limit integer;
  hourly_count integer;
  daily_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.user_id::text || ':' || new.action));

  hourly_limit := case new.action
    when 'career_assistant' then 20
    when 'match_jobs' then 30
    when 'parse_resume' then 10
    else 1
  end;
  daily_limit := case new.action
    when 'career_assistant' then 100
    when 'match_jobs' then 120
    when 'parse_resume' then 30
    else 1
  end;

  select count(*) into hourly_count
  from public.function_usage
  where user_id = new.user_id
    and action = new.action
    and created_at >= now() - interval '1 hour';

  if hourly_count >= hourly_limit then
    raise exception 'function usage limit reached';
  end if;

  select count(*) into daily_count
  from public.function_usage
  where user_id = new.user_id
    and action = new.action
    and created_at >= now() - interval '24 hours';

  if daily_count >= daily_limit then
    raise exception 'function daily usage limit reached';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_function_usage_limits() from public, anon, authenticated;
grant execute on function public.enforce_function_usage_limits() to service_role;

drop trigger if exists enforce_function_usage_limits_trigger on public.function_usage;
create trigger enforce_function_usage_limits_trigger
before insert on public.function_usage
for each row execute function public.enforce_function_usage_limits();

select cron.schedule(
  'job-radar-function-usage-retention',
  '40 4 * * *',
  $$delete from public.function_usage where created_at < now() - interval '30 days'$$
);
