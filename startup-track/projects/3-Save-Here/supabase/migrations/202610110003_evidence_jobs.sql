alter table public.jobs
  add column if not exists payload jsonb not null default '{}'::jsonb;

comment on column public.jobs.payload is
  'Non-secret worker input such as asset_id and evidence role. Never store file bytes, access tokens, or source cookies.';
