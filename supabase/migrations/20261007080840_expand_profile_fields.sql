alter table public.profiles
  add column if not exists professional_summary text,
  add column if not exists phone text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text;

alter table public.profiles
  drop constraint if exists profiles_professional_summary_length,
  add constraint profiles_professional_summary_length
    check (professional_summary is null or char_length(professional_summary) <= 1200);

alter table public.profiles
  drop constraint if exists profiles_linkedin_url_http,
  add constraint profiles_linkedin_url_http
    check (linkedin_url is null or linkedin_url = '' or linkedin_url ~* '^https?://');

alter table public.profiles
  drop constraint if exists profiles_portfolio_url_http,
  add constraint profiles_portfolio_url_http
    check (portfolio_url is null or portfolio_url = '' or portfolio_url ~* '^https?://');
