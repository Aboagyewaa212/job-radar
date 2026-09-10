alter table public.tailored_resumes add column if not exists generation_mode text not null default 'structured';

create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  content text not null,
  generation_mode text not null default 'structured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

alter table public.cover_letters enable row level security;
create policy cover_letters_select_own on public.cover_letters for select to authenticated using ((select auth.uid()) = user_id);
create policy cover_letters_insert_own on public.cover_letters for insert to authenticated with check ((select auth.uid()) = user_id);
create policy cover_letters_update_own on public.cover_letters for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cover_letters_delete_own on public.cover_letters for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists cover_letters_user_idx on public.cover_letters(user_id);
create index if not exists cover_letters_job_idx on public.cover_letters(job_id);
