drop policy if exists jobs_read_authenticated on public.jobs;
create policy jobs_read_authenticated on public.jobs for select to authenticated using (
  status='active' or exists(select 1 from public.application_progress ap where ap.job_id=jobs.id and ap.user_id=(select auth.uid())) or exists(select 1 from public.user_job_matches m where m.job_id=jobs.id and m.user_id=(select auth.uid()))
);
create or replace function public.enforce_daily_application_goal() returns trigger language plpgsql set search_path='public' as $$
declare goal integer;today_count integer;previous_applied_at timestamptz;
begin
  if new.user_id is distinct from (select auth.uid()) then raise exception 'Cannot modify application progress for another user'; end if;
  previous_applied_at:=case when TG_OP='UPDATE' then old.applied_at else null end;
  if new.applied_at is not null and (previous_applied_at is null or previous_applied_at::date<>new.applied_at::date) then
    select daily_application_goal into goal from public.preferences where user_id=new.user_id;goal:=least(coalesce(goal,5),5);
    select count(*) into today_count from public.application_progress where user_id=new.user_id and applied_at>=date_trunc('day',new.applied_at) and applied_at<date_trunc('day',new.applied_at)+interval '1 day' and job_id<>new.job_id;
    if today_count>=goal then raise exception 'Daily application goal reached (% applications)',goal;end if;
  end if;return new;
end;$$;
drop trigger if exists enforce_daily_application_goal_trigger on public.application_progress;
create trigger enforce_daily_application_goal_trigger before insert or update on public.application_progress for each row execute function public.enforce_daily_application_goal();
