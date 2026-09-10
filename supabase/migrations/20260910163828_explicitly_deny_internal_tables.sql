create policy job_ingestion_guard_no_client_access
on public.job_ingestion_guard for select
to authenticated
using (false);

create policy function_usage_no_client_access
on public.function_usage for select
to authenticated
using (false);
