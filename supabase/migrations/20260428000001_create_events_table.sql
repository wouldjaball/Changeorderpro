create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  event_type  text not null,
  description text not null,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index if not exists events_company_id_created_at_idx on events (company_id, created_at desc);
create index if not exists events_event_type_idx on events (event_type);
create index if not exists events_created_at_idx on events (created_at desc);

alter table events enable row level security;

create policy "service_role_insert_events" on events
  for insert
  to service_role
  with check (true);

create policy "users_read_own_company_events" on events
  for select
  to authenticated
  using (company_id in (select company_id from users where id = auth.uid()));
