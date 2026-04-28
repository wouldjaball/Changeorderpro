create materialized view if not exists mv_company_stats as
select
  c.id as company_id,
  c.name as company_name,
  c.created_at as signup_at,
  (select id        from users u where u.company_id = c.id and u.role = 'admin' order by u.created_at asc limit 1) as owner_user_id,
  (select email     from users u where u.company_id = c.id and u.role = 'admin' order by u.created_at asc limit 1) as owner_email,
  (select full_name from users u where u.company_id = c.id and u.role = 'admin' order by u.created_at asc limit 1) as owner_name,
  c.plan_tier as plan_name,
  case
    when c.trial_ends_at > now() then 'trialing'
    when c.plan_tier is not null then 'active'
    else 'active'
  end as subscription_status,
  0::numeric(10,2) as monthly_amount,
  (select count(*) from change_orders co where co.company_id = c.id) as total_change_orders,
  (select count(*) from change_orders co where co.company_id = c.id and co.created_at >= date_trunc('month', now())) as change_orders_this_month,
  (select avg(total_amount) from change_orders co where co.company_id = c.id and co.total_amount is not null) as avg_change_order_value,
  (select sum(total_amount) from change_orders co where co.company_id = c.id) as total_change_order_value,
  (select max(created_at) from change_orders co where co.company_id = c.id) as last_change_order_at,
  greatest(
    coalesce((select max(created_at) from change_orders co where co.company_id = c.id), '1970-01-01'::timestamptz),
    c.created_at
  ) as last_activity_at,
  (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') as emails_sent_90d,
  (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') as sms_sent_90d,
  (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'email') as emails_sent_total,
  (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'sms')   as sms_sent_total,
  case
    when (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') > 0
     and (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') > 0
      then 'both'
    when (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') > 0
      then 'email'
    when (select count(*) from notifications_log m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') > 0
      then 'sms'
    else 'none'
  end as channel_preference,
  (select count(*) from users u where u.company_id = c.id) as team_size
from companies c;

create unique index if not exists mv_company_stats_pk on mv_company_stats (company_id);
create index if not exists mv_company_stats_last_activity_idx on mv_company_stats (last_activity_at desc);
create index if not exists mv_company_stats_signup_idx on mv_company_stats (signup_at desc);
create index if not exists mv_company_stats_plan_status_idx on mv_company_stats (plan_name, subscription_status);
