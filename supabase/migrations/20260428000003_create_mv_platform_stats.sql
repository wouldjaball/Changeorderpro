create materialized view if not exists mv_platform_stats as
select
  (select count(*) from companies) as total_companies,
  (select count(distinct c2.id) from companies c2
    where greatest(
      coalesce((select max(co.created_at) from change_orders co where co.company_id = c2.id), '1970-01-01'::timestamptz),
      c2.created_at
    ) >= now() - interval '30 days'
  ) as active_companies_30d,
  (select count(*) from change_orders) as total_change_orders,
  (select count(*) from change_orders where created_at >= date_trunc('month', now())) as change_orders_this_month,
  0::numeric(10,2) as mrr,
  (select count(*) from companies where created_at >= now() - interval '30 days') as signups_last_30d,
  (select count(*) from companies where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days') as signups_prior_30d,
  (select count(*) from change_orders where created_at >= now() - interval '30 days') as cos_last_30d,
  (select count(*) from change_orders where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days') as cos_prior_30d,
  now() as refreshed_at;
