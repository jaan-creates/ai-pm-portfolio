begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;

create type public.item_status as enum ('pending', 'completed', 'reference', 'deleted');
create type public.input_type as enum ('url', 'text', 'image', 'pdf', 'video', 'file');
create type public.content_type as enum (
  'article', 'instagram_post', 'instagram_reel', 'x_post', 'video',
  'product', 'recipe', 'image', 'pdf', 'note', 'event', 'other'
);
create type public.item_intent as enum (
  'read', 'watch', 'buy', 'make', 'cook', 'learn',
  'reference', 'visit', 'try', 'unknown'
);
create type public.capture_quality as enum (
  'full_text', 'metadata', 'visual', 'audio_visual', 'link_only', 'failed'
);
create type public.processing_status as enum (
  'received', 'stored', 'queued', 'extracting', 'enriching',
  'indexing', 'ready', 'partial', 'failed'
);
create type public.event_type as enum (
  'captured', 'opened', 'searched_result', 'pinned', 'unpinned',
  'completed', 'referenced', 'resurfaced', 'snoozed', 'corrected',
  'reprocessed', 'exported', 'review_generated', 'soft_deleted',
  'restored', 'permanently_deleted'
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.item_status not null default 'pending',
  input_type public.input_type not null,
  content_type public.content_type not null default 'other',
  intent public.item_intent not null default 'unknown',
  capture_quality public.capture_quality not null default 'link_only',
  processing_status public.processing_status not null default 'received',
  original_url text,
  canonical_url text,
  source_domain text,
  source_native_id text,
  source_author text,
  source_published_at timestamptz,
  title text,
  user_note text,
  summary_original text,
  summary_english text,
  extracted_text text,
  transcript text,
  ocr_text text,
  search_document text,
  languages text[] not null default '{}',
  topics text[] not null default '{}',
  entities jsonb not null default '[]'::jsonb,
  ai_metadata jsonb not null default '{}'::jsonb,
  classification_confidence real check (
    classification_confidence is null or classification_confidence between 0 and 1
  ),
  saved_at timestamptz not null default now(),
  last_captured_at timestamptz not null default now(),
  last_opened_at timestamptz,
  completed_at timestamptz,
  resurface_at timestamptz,
  expiry_at timestamptz,
  pinned_position smallint,
  content_hash text,
  canonical_url_hash text,
  duplicate_of uuid references public.items(id),
  enrichment_version text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_delete_consistency check (
    (status = 'deleted' and deleted_at is not null) or
    (status <> 'deleted' and deleted_at is null)
  )
);

create index items_owner_saved_idx on public.items(owner_id, saved_at desc);
create index items_owner_status_saved_idx on public.items(owner_id, status, saved_at desc);
create index items_title_trgm_idx on public.items using gin(title extensions.gin_trgm_ops);
create index items_user_note_trgm_idx on public.items using gin(user_note extensions.gin_trgm_ops);
create index items_search_document_trgm_idx on public.items using gin(search_document extensions.gin_trgm_ops);
create unique index items_owner_canonical_url_idx
  on public.items(owner_id, canonical_url_hash)
  where canonical_url_hash is not null and deleted_at is null and duplicate_of is null;

create table public.captures (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  device_id uuid not null,
  shortcut_version text,
  shared_type text not null,
  raw_text text,
  shared_url text,
  clipboard_source_url text,
  user_note text,
  received_at timestamptz not null default now(),
  stored_at timestamptz,
  result text not null check (result in ('created', 'merged', 'failed')),
  error_code text
);

create index captures_owner_received_idx on public.captures(owner_id, received_at desc);
create index captures_item_idx on public.captures(item_id);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  capture_id uuid references public.captures(id) on delete set null,
  role text not null check (
    role in ('original', 'screenshot', 'pdf', 'video', 'preview', 'frame', 'audio_temp')
  ),
  storage_bucket text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  sha256 text not null,
  width integer,
  height integer,
  duration_ms bigint,
  derived_from uuid references public.assets(id),
  retention_class text not null check (retention_class in ('permanent', 'derivative', 'temporary')),
  purge_after timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(storage_bucket, storage_path),
  constraint asset_retention_consistency check (
    retention_class <> 'temporary' or purge_after is not null
  )
);

create index assets_item_idx on public.assets(item_id);
create index assets_purge_idx on public.assets(purge_after)
  where deleted_at is null and purge_after is not null;

create table public.item_chunks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  chunk_type text not null check (chunk_type in ('note', 'summary', 'body', 'transcript', 'ocr')),
  content text not null,
  token_count integer not null check (token_count >= 0),
  embedding extensions.vector,
  embedding_model text,
  created_at timestamptz not null default now(),
  unique(item_id, chunk_type, chunk_index)
);

create index item_chunks_item_idx on public.item_chunks(item_id);

create table public.item_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  event_type public.event_type not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index item_events_owner_time_idx on public.item_events(owner_id, occurred_at desc);
create index item_events_item_time_idx on public.item_events(item_id, occurred_at desc);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  device_name text not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  scopes text[] not null default '{capture}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, device_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  job_type text not null,
  status text not null check (status in ('queued', 'running', 'retry', 'succeeded', 'failed', 'dead_letter')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  not_before timestamptz not null default now(),
  locked_at timestamptz,
  finished_at timestamptz,
  last_error_code text,
  last_error_redacted text,
  provider_request_id text,
  cost_estimate_usd numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_ready_idx on public.jobs(status, not_before)
  where status in ('queued', 'retry');

create table public.enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  stage text not null,
  provider text not null,
  model text,
  prompt_version text,
  input_fingerprint text not null,
  status text not null,
  usage jsonb,
  estimated_cost_usd numeric,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_code text
);

create table public.search_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  query_text text not null,
  query_language text,
  result_item_ids uuid[] not null default '{}',
  opened_item_id uuid references public.items(id) on delete set null,
  latency_ms integer not null check (latency_ms >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.items enable row level security;
alter table public.captures enable row level security;
alter table public.assets enable row level security;
alter table public.item_chunks enable row level security;
alter table public.item_events enable row level security;
alter table public.device_tokens enable row level security;
alter table public.jobs enable row level security;
alter table public.enrichment_runs enable row level security;
alter table public.search_events enable row level security;

create policy items_owner_all on public.items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy captures_owner_select on public.captures
  for select using (owner_id = auth.uid());
create policy assets_owner_all on public.assets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy chunks_owner_select on public.item_chunks
  for select using (owner_id = auth.uid());
create policy events_owner_select on public.item_events
  for select using (owner_id = auth.uid());
create policy tokens_owner_select on public.device_tokens
  for select using (owner_id = auth.uid());
create policy jobs_owner_select on public.jobs
  for select using (owner_id = auth.uid());
create policy enrichments_owner_select on public.enrichment_runs
  for select using (owner_id = auth.uid());
create policy search_events_owner_all on public.search_events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.capture_url_or_text(
  p_owner_id uuid,
  p_capture_id uuid,
  p_device_id uuid,
  p_shortcut_version text,
  p_input_type public.input_type,
  p_shared_url text,
  p_canonical_url text,
  p_shared_text text,
  p_user_note text,
  p_content_type public.content_type
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_capture public.captures%rowtype;
  v_item_id uuid;
  v_result text;
  v_url_hash text;
  v_source_domain text;
begin
  if p_input_type not in ('url', 'text') then
    raise exception 'unsupported input type';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_capture_id::text, 0));

  select * into v_existing_capture
  from public.captures
  where id = p_capture_id and owner_id = p_owner_id;

  if found then
    return jsonb_build_object(
      'capture_id', v_existing_capture.id,
      'item_id', v_existing_capture.item_id,
      'result', v_existing_capture.result,
      'processing_status', 'queued'
    );
  end if;

  if p_canonical_url is not null then
    v_url_hash := encode(extensions.digest(p_canonical_url, 'sha256'), 'hex');
    v_source_domain := lower(substring(p_canonical_url from '://([^/]+)'));
    perform pg_advisory_xact_lock(
      hashtextextended(p_owner_id::text || ':' || p_canonical_url, 1)
    );

    select id into v_item_id
    from public.items
    where owner_id = p_owner_id
      and canonical_url_hash = v_url_hash
      and deleted_at is null
      and duplicate_of is null
    limit 1;
  end if;

  if v_item_id is null then
    insert into public.items (
      owner_id, input_type, content_type, capture_quality, processing_status,
      original_url, canonical_url, canonical_url_hash, source_domain,
      user_note, extracted_text, search_document
    )
    values (
      p_owner_id,
      p_input_type,
      p_content_type,
      case when p_input_type = 'text' then 'full_text'::public.capture_quality else 'link_only'::public.capture_quality end,
      'queued',
      p_shared_url,
      p_canonical_url,
      v_url_hash,
      v_source_domain,
      p_user_note,
      p_shared_text,
      concat_ws(E'\n', p_user_note, p_shared_text, p_canonical_url)
    )
    returning id into v_item_id;
    v_result := 'created';

    insert into public.jobs(owner_id, item_id, job_type, status)
    values (p_owner_id, v_item_id, 'extract', 'queued');
  else
    update public.items
    set
      last_captured_at = now(),
      user_note = coalesce(public.items.user_note, p_user_note),
      search_document = concat_ws(E'\n', public.items.search_document, p_user_note)
    where id = v_item_id;
    v_result := 'merged';
  end if;

  insert into public.captures (
    id, owner_id, item_id, device_id, shortcut_version, shared_type,
    raw_text, shared_url, user_note, stored_at, result
  )
  values (
    p_capture_id, p_owner_id, v_item_id, p_device_id, p_shortcut_version,
    p_input_type::text, p_shared_text, p_shared_url, p_user_note, now(), v_result
  );

  insert into public.item_events(owner_id, item_id, event_type, metadata)
  values (
    p_owner_id,
    v_item_id,
    'captured',
    jsonb_build_object('capture_id', p_capture_id, 'result', v_result, 'device_id', p_device_id)
  );

  return jsonb_build_object(
    'capture_id', p_capture_id,
    'item_id', v_item_id,
    'result', v_result,
    'processing_status', 'queued'
  );
end;
$$;

revoke all on function public.capture_url_or_text(
  uuid, uuid, uuid, text, public.input_type, text, text, text, text, public.content_type
) from public, anon, authenticated;
grant execute on function public.capture_url_or_text(
  uuid, uuid, uuid, text, public.input_type, text, text, text, text, public.content_type
) to service_role;

create or replace function public.assets_due_for_purge(p_limit integer default 100)
returns setof public.assets
language sql
security definer
set search_path = ''
as $$
  select *
  from public.assets
  where retention_class = 'temporary'
    and purge_after <= now()
    and deleted_at is null
  order by purge_after
  limit greatest(1, least(p_limit, 500))
  for update skip locked;
$$;

revoke all on function public.assets_due_for_purge(integer) from public, anon, authenticated;
grant execute on function public.assets_due_for_purge(integer) to service_role;

insert into storage.buckets(id, name, public, file_size_limit)
values ('private-assets', 'private-assets', false, 104857600)
on conflict (id) do nothing;

create policy owner_reads_own_storage_objects on storage.objects
for select to authenticated
using (
  bucket_id = 'private-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
