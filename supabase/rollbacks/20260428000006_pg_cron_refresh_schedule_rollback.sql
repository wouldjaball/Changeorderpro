do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('refresh_admin_views');
  end if;
end $$;
