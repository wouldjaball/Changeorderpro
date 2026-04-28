create table if not exists admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_email  text not null,
  action       text not null,
  resource_type text,
  resource_id   uuid,
  ip_address   inet,
  user_agent   text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

create index if not exists admin_audit_log_admin_email_idx on admin_audit_log (admin_email, created_at desc);
create index if not exists admin_audit_log_resource_idx on admin_audit_log (resource_type, resource_id);
