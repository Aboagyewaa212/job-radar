create index if not exists application_progress_job_idx on public.application_progress(job_id);
create index if not exists jobs_source_idx on public.jobs(source_id);
create index if not exists tailored_resumes_job_idx on public.tailored_resumes(job_id);
create index if not exists user_job_matches_job_idx on public.user_job_matches(job_id);
