alter table public.jobs
  add constraint jobs_application_url_http_only check (application_url ~* '^https?://') not valid;
alter table public.jobs validate constraint jobs_application_url_http_only;
alter table public.jobs
  add constraint jobs_canonical_url_http_only check (canonical_url is null or canonical_url ~* '^https?://') not valid;
alter table public.jobs validate constraint jobs_canonical_url_http_only;
