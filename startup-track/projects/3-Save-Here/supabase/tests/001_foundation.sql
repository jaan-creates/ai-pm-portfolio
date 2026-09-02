begin;

select plan(8);

select has_table('public', 'items', 'items exists');
select has_table('public', 'captures', 'captures exists');
select has_table('public', 'device_tokens', 'device tokens exist');
select has_column('public', 'assets', 'purge_after', 'assets have purge date');
select row_security_active('public.items', 'items RLS is active');
select row_security_active('public.assets', 'assets RLS is active');
select has_function('public', 'capture_url_or_text', 'capture function exists');
select has_function('public', 'assets_due_for_purge', 'purge claim function exists');

select * from finish();
rollback;
