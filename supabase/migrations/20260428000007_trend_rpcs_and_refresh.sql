create or replace function get_signups_trend(cutoff_date timestamptz)
returns table(week_start text, count bigint) as $$
  select
    to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week_start,
    count(*) as count
  from companies
  where created_at >= cutoff_date
  group by 1
  order by 1;
$$ language sql security definer;

create or replace function get_cos_trend(cutoff_date timestamptz)
returns table(week_start text, count bigint) as $$
  select
    to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week_start,
    count(*) as count
  from change_orders
  where created_at >= cutoff_date
  group by 1
  order by 1;
$$ language sql security definer;

create or replace function refresh_admin_views()
returns void as $$
begin
  refresh materialized view mv_platform_stats;
  refresh materialized view mv_company_stats;
end;
$$ language plpgsql security definer;
