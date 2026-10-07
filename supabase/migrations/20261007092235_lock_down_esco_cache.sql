drop policy if exists "Deny client access to ESCO cache" on public.esco_term_cache;

create policy "Deny client access to ESCO cache"
on public.esco_term_cache
for all
to anon, authenticated
using (false)
with check (false);
