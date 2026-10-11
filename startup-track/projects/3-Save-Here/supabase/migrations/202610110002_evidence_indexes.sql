begin;

create index if not exists assets_capture_idx on public.assets(capture_id) where capture_id is not null;
create index if not exists assets_derived_from_idx on public.assets(derived_from) where derived_from is not null;
create index if not exists assets_owner_idx on public.assets(owner_id);
create index if not exists enrichment_runs_item_idx on public.enrichment_runs(item_id);
create index if not exists enrichment_runs_owner_idx on public.enrichment_runs(owner_id);
create index if not exists item_chunks_owner_idx on public.item_chunks(owner_id);
create index if not exists items_duplicate_idx on public.items(duplicate_of) where duplicate_of is not null;
create index if not exists jobs_item_idx on public.jobs(item_id);
create index if not exists jobs_owner_idx on public.jobs(owner_id);
create index if not exists search_events_opened_idx on public.search_events(opened_item_id) where opened_item_id is not null;
create index if not exists search_events_owner_idx on public.search_events(owner_id);

commit;
