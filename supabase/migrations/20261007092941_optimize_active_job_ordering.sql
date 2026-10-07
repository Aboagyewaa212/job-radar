drop index if exists public.jobs_active_posted_idx;

create index jobs_active_posted_idx
on public.jobs (status, posted_at desc nulls last);
