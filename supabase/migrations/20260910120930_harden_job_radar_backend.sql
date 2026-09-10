create extension if not exists vector with schema extensions;
alter table public.jobs add column if not exists embedding extensions.vector(384);
alter table public.user_resumes add column if not exists embedding extensions.vector(384);
create index if not exists jobs_embedding_hnsw on public.jobs using hnsw (embedding vector_cosine_ops);
create index if not exists resumes_user_idx on public.user_resumes(user_id);
create index if not exists tailored_resumes_user_idx on public.tailored_resumes(user_id);
create index if not exists notification_subscriptions_user_idx on public.notification_subscriptions(user_id);
create index if not exists application_progress_user_stage_idx on public.application_progress(user_id,stage);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('resumes','resumes',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy resumes_storage_insert_own on storage.objects for insert to authenticated with check (bucket_id='resumes' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy resumes_storage_select_own on storage.objects for select to authenticated using (bucket_id='resumes' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy resumes_storage_update_own on storage.objects for update to authenticated using (bucket_id='resumes' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='resumes' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy resumes_storage_delete_own on storage.objects for delete to authenticated using (bucket_id='resumes' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy scan_runs_no_client_access on public.scan_runs for select to authenticated using(false);
