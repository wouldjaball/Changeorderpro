-- Schedule nightly refresh of admin materialized views at 3 AM Pacific (10 AM UTC)
-- Note: pg_cron may not be available in all Supabase plans. If this fails,
-- the on-demand refresh button in the admin UI is the fallback.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'refresh_admin_views',
      '0 10 * * *',
      'refresh materialized view concurrently mv_company_stats; refresh materialized view mv_platform_stats;'
    );
  end if;
end $$;
