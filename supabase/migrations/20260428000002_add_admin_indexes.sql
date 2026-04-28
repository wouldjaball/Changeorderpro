create index if not exists companies_name_lower_idx on companies (lower(name));
create index if not exists users_email_lower_idx on users (lower(email));
create index if not exists users_company_role_idx on users (company_id, role);
create index if not exists change_orders_created_at_idx on change_orders (created_at desc);
create index if not exists change_orders_company_id_created_at_idx on change_orders (company_id, created_at desc);
create index if not exists notifications_company_channel_created_at_idx on notifications_log (company_id, channel, created_at desc);
