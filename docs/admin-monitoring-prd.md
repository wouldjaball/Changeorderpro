# ChangeOrder Pro — Admin Monitoring Backend

## Product Requirements Document

**Version**1.0**Status**Approved for build**Owner**Boss (Sales Monsters)**Author**Sunny**Last updated**April 28, 2026**Audience**Engineering, Product, Internal ops**Repo path**`/admin` route group within main ChangeOrder Pro repo

### Change Log

VersionDateAuthorNotes0.1Apr 28, 2026SunnyInitial draft1.0Apr 28, 2026SunnyOpen questions resolved, full schema, API spec, test plan, security review added

---

## 1. Executive Summary

ChangeOrder Pro is a SaaS product for contractors that streamlines the creation, delivery, and approval of change orders. As paying customers come online, the Sales Monsters team needs a **purpose-built internal admin console** to monitor adoption, usage health, and customer-level activity in one place.

This PRD defines a read-only, internally-authenticated admin web app — built on the existing Next.js + Supabase + Vercel stack — that surfaces:

- Platform-wide KPIs (companies signed up, change orders processed, MRR proxy)
- A searchable, filterable table of every company on the platform
- A drill-down profile for any company showing owner info, usage stats, channel preferences (email/SMS), team members, and an activity timeline

The console lives at `admin.changeorderpro.com`, gated by Supabase Auth + an email allowlist. v1 is read-only; edit, impersonation, and alerting capabilities are scheduled for v2+.

**Build estimate:** 3 calendar weeks across 4 phases. Phase 1 ships a usable MVP in week 1.

---

## 2. Background & Context

### 2.1 The product

ChangeOrder Pro is a multi-tenant Next.js + Supabase app. Each contractor business is a `company` (tenant); each company has one or more `users`; each company creates `change_orders` and sends them to their own customers via email and/or SMS. Twilio handles SMS, transactional email goes through whatever provider the customer-facing app uses (assume Postmark or Resend; not load-bearing for this PRD).

Stripe handles subscriptions; Stripe webhooks already sync subscription state into Supabase.

### 2.2 The problem

Right now, answering the question "how many companies do we have, and how active are they?" requires running ad-hoc SQL against Supabase. This:

- Doesn't scale beyond one technical operator
- Makes it hard for non-technical team members (Evan, Ariel) to self-serve
- Provides no historical view, no trend lines, no per-company narrative
- Creates risk if anyone slips a destructive query into the wrong session

### 2.3 The solution

A dedicated, audit-friendly, read-only admin console that puts the most-asked questions one click away. Internal-only. Bookmark-able. Loads in under a second.

---

## 3. Goals & Success Metrics

### 3.1 Goals

#GoalHow we measure itG1Reduce time-to-answer for "how many companies do we have / how active are they?"&lt;5 seconds from login to KPI visibleG2Make customer profiles self-serve for the whole Sales Monsters teamEvan, Ariel, Raj can pull a company profile without engineering helpG3Surface churn-risk signals before they become churnDormant-company filter + last-activity column on the list viewG4Eliminate ad-hoc production SQL for routine reportingZero SQL queries run against prod for the standard weekly report

### 3.2 Success Metrics (v1, 30 days post-launch)

- **Adoption:** ≥80% of weekly admin lookups happen through the console (vs. ad-hoc SQL)
- **Performance:** p95 dashboard load ≤1s; p95 company-list load ≤2s; p95 profile load ≤1.5s
- **Reliability:** ≥99.5% uptime measured at `admin.changeorderpro.com/health`
- **Usage:** at least 3 distinct admin users authenticate per week

### 3.3 Non-Goals (v1)

- ❌ Editing customer data from the admin UI
- ❌ Performing billing actions (refunds, plan changes, cancellations)
- ❌ Customer-facing features of any kind
- ❌ Customer support ticketing — this is monitoring, not a help desk
- ❌ Multi-role permission system (single `admin` role only)
- ❌ Mobile-first responsive design — desktop optimized, mobile usable but not pretty
- ❌ Customer impersonation / login-as-user (deferred to v2)
- ❌ Custom report builder / saved views (v3+)

---

## 4. Users & Use Cases

### 4.1 Personas

**Boss (Super Admin)**

- Uses the console daily
- Wants the fastest possible scan of platform health
- Drills into specific companies when running a sales review or churn check

**Evan (Manager)**

- Uses the console weekly for status reviews with Boss
- Wants the trend charts and aggregate KPIs

**Ariel / Raj / Graham / Moriah / Brian (Team)**

- Use the console occasionally when they need context on a specific customer
- Want fast lookup by company name or owner email

### 4.2 Use Cases

IDAs a...I want to...So that...UC1Super AdminSee total signups + COs at a glanceI know if growth is on trackUC2Super AdminFilter companies by "no activity in 14 days"I can flag churn riskUC3ManagerPull up a company by nameI can answer a question in a meetingUC4Team memberSee a customer's email/SMS volumeI can advise them on channel mixUC5Super AdminExport the full company list to CSVI can run analysis in ExcelUC6Super AdminSee change order volume week-over-weekI can spot platform-wide trendsUC7ManagerSee which customers are heaviest SMS usersI can forecast Twilio costs

---

## 5. Functional Requirements

Every feature below has acceptance criteria. A feature is "done" when all its criteria are satisfied and pass review.

### 5.1 Authentication

**FR-AUTH-1: Magic-link login**

- The console MUST require authentication on every route except `/admin/login` and `/admin/health`.
- Login uses Supabase Auth magic link (email-only, no passwords).
- Acceptance:
  - \[ \] Unauthenticated requests to any `/admin/*` route redirect to `/admin/login`
  - \[ \] Magic link is sent only if email is in `ADMIN_ALLOWLIST` env var
  - \[ \] Magic link expires after 60 minutes
  - \[ \] Successful auth sets a session cookie scoped to `admin.changeorderpro.com`

**FR-AUTH-2: Session management**

- Sessions persist for 7 days, then require re-auth.
- Sign out invalidates the session immediately.
- Acceptance:
  - \[ \] Sign-out button visible in top-right of every page
  - \[ \] Clicking sign-out clears the cookie and redirects to `/admin/login`
  - \[ \] After 7 days of inactivity, user is forced to re-authenticate

**FR-AUTH-3: Allowlist enforcement (defense in depth)**

- The middleware checks the email on EVERY request, not just at login.
- If an email is removed from the allowlist mid-session, their next request is rejected.
- Acceptance:
  - \[ \] Removing an email from `ADMIN_ALLOWLIST` and redeploying invalidates that user's session within 60 seconds (Vercel cold start window)

### 5.2 Top-Level Dashboard (`/admin`)

The first screen after login. The single most important page.

**FR-DASH-1: KPI cards**

- Display 5 cards in a single row at the top of the page:
  1. **Total companies** — count of all rows in `companies`
  2. **Active companies** — count where `last_activity_at >= now() - interval '30 days'`
  3. **Total change orders** — count of all rows in `change_orders`
  4. **Change orders this month** — count where `created_at >= date_trunc('month', now())`
  5. **MRR (proxy)** — sum of `subscriptions.monthly_amount` where status = 'active'
- Each card shows the metric value, a label, and a small delta vs. the same window prior period (↑12% vs last month, etc.).
- Acceptance:
  - \[ \] All 5 cards render with real data from Supabase
  - \[ \] Each card has a colored delta indicator (green up, red down, gray flat)
  - \[ \] Cards are read from `mv_platform_stats` (not live aggregation) — see §7.5
  - \[ \] If `mv_platform_stats` is stale (&gt;24h), a small warning icon appears on each card

**FR-DASH-2: Trend charts**

- Two line charts side-by-side below the KPI cards:
  1. **Signups per week** (last 12 weeks)
  2. **Change orders per week** (last 12 weeks)
- X-axis: week start dates. Y-axis: count.
- Hovering a point shows a tooltip with exact count and date range.
- Acceptance:
  - \[ \] Both charts render with 12 weeks of data even if some weeks are zero
  - \[ \] Tooltip on hover shows the week's bucket and value
  - \[ \] Charts are responsive (resize cleanly between 1024px and 1920px)

**FR-DASH-3: Recent activity feed**

- Scrollable list of the last 20 platform events sourced from the `events` table.
- Each item shows: icon (event type), human-readable description, company name (linked), relative timestamp ("2 hours ago").
- Acceptance:
  - \[ \] Feed renders the most recent 20 events ordered DESC by `created_at`
  - \[ \] Each event item is clickable and navigates to the related company profile
  - \[ \] Empty state ("No recent activity") renders when 0 events exist

### 5.3 Companies List (`/admin/companies`)

The workhorse page. A database-style table.

**FR-LIST-1: Table columns**The table MUST display the following columns, all sortable:

ColumnSourceDefault sortCompany name`companies.name`A→ZOwner name`users.full_name` (where `is_owner = true`)—Owner email`users.email` (where `is_owner = true`)—Plan`subscriptions.plan_name`—Status`subscriptions.status` (active/trialing/past_due/canceled)—# COscount from `change_orders`DESCLast activity`mv_company_stats.last_activity_at`—Channelderived (Email / SMS / Both / None)—Signup date`companies.created_at`DESC

Default sort: `created_at DESC` (newest signups on top).

Acceptance:

- \[ \] All 9 columns render
- \[ \] Clicking any column header toggles sort ASC/DESC
- \[ \] Sort indicator (▲/▼) appears on the active sort column
- \[ \] Each row's company name is a link to `/admin/companies/[id]`

**FR-LIST-2: Search**

- Single text input at the top of the page.
- Searches across: company name, owner name, owner email.
- Debounced 300ms.
- Server-side query using PostgreSQL `ILIKE` with index.
- Acceptance:
  - \[ \] Typing in the search box filters the table within 500ms of last keystroke
  - \[ \] Empty search returns all rows
  - \[ \] Search is case-insensitive
  - \[ \] Search supports partial matches ("acm" matches "Acme Plumbing")

**FR-LIST-3: Filters**

- Filter chips above the table for:
  - **Plan** (multi-select: Free Trial, Starter, Pro, Enterprise)
  - **Status** (multi-select: Trialing, Active, Past Due, Canceled)
  - **Channel** (multi-select: Email, SMS, Both, None)
  - **Activity** (single-select: Any, Active 30d, Dormant 14d+, Dormant 30d+)
  - **Signup date** (date range picker)
- Active filters show as chips with an X to remove.
- "Clear all filters" button appears when any filter is active.
- Filter state persists in URL query params (so filtered views are bookmarkable / shareable).
- Acceptance:
  - \[ \] Each filter applies server-side and updates the table
  - \[ \] Filter combinations work (Plan = Pro AND Status = Active)
  - \[ \] URL reflects current filter state, e.g. `/admin/companies?plan=pro&activity=dormant_14`
  - \[ \] Reloading a filtered URL restores the same view

**FR-LIST-4: Pagination**

- Server-side pagination, 50 rows per page.
- Pagination controls: First, Prev, page numbers (with ellipsis for large counts), Next, Last.
- Total count shown ("Showing 1–50 of 142").
- Acceptance:
  - \[ \] Pagination controls render correctly for any count
  - \[ \] Page state persists in URL (`?page=3`)
  - \[ \] Page resets to 1 when filters or search change

**FR-LIST-5: CSV export**

- "Export CSV" button top-right of the table.
- Exports the **currently filtered/searched result set** (not just the visible page).
- Filename: `companies_YYYY-MM-DD.csv`.
- Acceptance:
  - \[ \] Clicking export downloads a CSV with all visible columns
  - \[ \] Export respects active filters and search
  - \[ \] Export caps at 10,000 rows (with a warning toast if truncated)

### 5.4 Company Profile (`/admin/companies/[id]`)

The drill-down view. Single source of truth for one company.

**FR-PROFILE-1: Header**

- Company name (large), logo (if `companies.logo_url` is set), plan badge, status badge.
- Quick metadata: signup date (relative + absolute on hover), days as customer.
- "Back to companies" breadcrumb top-left.
- Acceptance:
  - \[ \] Header renders all fields
  - \[ \] Plan and status badges use color coding (Trialing = amber, Active = green, Past Due = orange, Canceled = gray)
- Acceptance:
  - \[ \] All fields render; missing fields show "—" (not "null" or empty)
  - \[ \] Stripe link opens in a new tab

**FR-PROFILE-3: Usage stats panel**

- Card with these metrics:
  - Total change orders (all time)
  - Change orders this month
  - Average change order value (USD, if `change_orders.amount` is populated)
  - Total dollar value of all change orders
  - Last change order date (relative)
  - Days since last login (any user on the account)
- Acceptance:
  - \[ \] All fields render with proper currency/date formatting
  - \[ \] Missing data fields show "—"

**FR-PROFILE-4: Communication channels panel**

- Card showing:
  - Email enabled (yes/no, based on whether the company has any email-enabled change orders) + total emails sent (count from `messages` where `channel = 'email'`)
  - SMS enabled (yes/no) + total SMS sent (count from `messages` where `channel = 'sms'`)
  - Pie chart: % email vs % SMS sent (last 90 days)
  - Twilio number assigned (if applicable)
- Acceptance:
  - \[ \] Pie chart renders only if total messages &gt; 0; otherwise shows "No messages sent yet"
  - \[ \] Counts are accurate as of last `mv_company_stats` refresh

**FR-PROFILE-5: Team members**

- Table of all users on the account:
  - Name, email, role (Owner/Admin/Member), last login, created date
- Acceptance:
  - \[ \] Owner is always listed first
  - \[ \] Last login shows relative time, with absolute date on hover
  - \[ \] If a user has never logged in, "Never" is shown

**FR-PROFILE-6: Activity timeline**

- Vertical timeline of the last 50 events for this company from the `events` table.
- Events grouped by day with date headers.
- Each event shows: icon, description, time.
- Acceptance:
  - \[ \] Timeline renders 50 most recent events DESC by date
  - \[ \] Events of the same day grouped under one date header
  - \[ \] "Load more" button at bottom loads the next 50

**FR-PROFILE-7: Change order log**

- Paginated table of every change order this company has processed:
  - Date, change order # (their numbering), customer (their customer's name), amount, status (sent/viewed/approved/rejected/expired), channel (email/SMS)
- 25 rows per page.
- Sortable by date, amount, status.
- Acceptance:
  - \[ \] All columns render
  - \[ \] Pagination works
  - \[ \] Status uses color coding

### 5.5 Health endpoint (`/admin/health`)

**FR-HEALTH-1**

- Public endpoint (no auth) returning JSON: `{ "status": "ok", "version": "1.0.0", "db": "ok", "timestamp": "..." }`.
- Used for uptime monitoring (UptimeRobot, BetterStack, etc.).
- Acceptance:
  - \[ \] Returns 200 + JSON body when DB is reachable
  - \[ \] Returns 503 + JSON body if DB ping fails

---

## 6. Information Architecture

```
admin.changeorderpro.com
│
├── /admin/login                         (public)
├── /admin/health                        (public)
│
├── /admin                               (dashboard)
│
├── /admin/companies                     (list)
│   └── /admin/companies/[companyId]     (profile)
│
└── /admin/signout                       (POST only)
```

Navigation: a persistent left sidebar with two items — **Dashboard**, **Companies**. Top bar shows the signed-in admin's email and a sign-out button.

---

## 7. Data Model

### 7.1 Existing tables (reference only — not modified by this project)

These tables are owned by the customer-facing app. The admin console reads from them but does not write to them.

```sql
-- companies (existing)
companies (
  id            uuid primary key,
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  industry      text,             -- e.g. 'general_contractor', 'plumbing'
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  postal_code   text,
  country       text default 'US',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- users (existing)
users (
  id          uuid primary key,
  company_id  uuid references companies(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  phone       text,
  role        text not null default 'member',  -- 'owner' | 'admin' | 'member'
  is_owner    boolean generated always as (role = 'owner') stored,
  last_login_at timestamptz,
  created_at  timestamptz default now()
);

-- change_orders (existing)
change_orders (
  id              uuid primary key,
  company_id      uuid references companies(id) on delete cascade,
  customer_name   text not null,            -- their customer
  customer_email  text,
  customer_phone  text,
  co_number       text not null,            -- their internal numbering
  amount          numeric(12,2),
  status          text not null,            -- 'draft'|'sent'|'viewed'|'approved'|'rejected'|'expired'
  sent_via        text,                     -- 'email'|'sms'|'both'|null
  created_at      timestamptz default now(),
  sent_at         timestamptz,
  responded_at    timestamptz
);

-- subscriptions (existing, populated by Stripe webhook)
subscriptions (
  id                    uuid primary key,
  company_id            uuid references companies(id) on delete cascade,
  stripe_customer_id    text,
  stripe_subscription_id text,
  plan_name             text not null,      -- 'free_trial'|'starter'|'pro'|'enterprise'
  status                text not null,      -- 'trialing'|'active'|'past_due'|'canceled'
  monthly_amount        numeric(10,2),
  trial_ends_at         timestamptz,
  current_period_end    timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- messages (existing — outbound email + SMS log)
messages (
  id              uuid primary key,
  company_id      uuid references companies(id) on delete cascade,
  change_order_id uuid references change_orders(id) on delete set null,
  channel         text not null,            -- 'email'|'sms'
  to_address      text not null,            -- email or phone
  status          text not null,            -- 'queued'|'sent'|'delivered'|'failed'|'bounced'
  provider_id     text,                     -- twilio sid or postmark message id
  created_at      timestamptz default now(),
  delivered_at    timestamptz
);
```

### 7.2 New table: `events`

A general-purpose append-only event log. Used by the activity feed on the dashboard and the timeline on each profile.

```sql
create table events (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  event_type  text not null,
  -- Allowed event_types:
  --   signup                    -- new company created
  --   user_invited              -- a teammate was invited
  --   user_joined               -- invitee accepted
  --   first_change_order        -- their first ever CO
  --   change_order_created
  --   change_order_sent
  --   change_order_approved
  --   change_order_rejected
  --   plan_upgraded
  --   plan_downgraded
  --   subscription_canceled
  --   payment_failed
  --   login                     -- any user logged in
  description text not null,    -- denormalized human-readable string for the feed
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index events_company_id_created_at_idx on events (company_id, created_at desc);
create index events_event_type_idx on events (event_type);
create index events_created_at_idx on events (created_at desc);
```

**Event population strategy:**

- Customer-facing app emits events on every relevant action (signup, CO sent, plan changed, etc.). Add an `emitEvent(...)` helper there.
- Stripe webhooks already exist; extend them to write `plan_upgraded`, `payment_failed`, etc.
- Backfill: a one-time script that inspects `companies`, `change_orders`, and `subscriptions` to synthesize historical events. Script is in `/scripts/backfill-events.ts`.

### 7.3 New materialized view: `mv_company_stats`

Per-company aggregates, refreshed nightly + on-demand.

```sql
create materialized view mv_company_stats as
select
  c.id as company_id,
  c.name as company_name,
  c.created_at as signup_at,
  -- Owner
  (select id        from users u where u.company_id = c.id and u.role = 'owner' limit 1) as owner_user_id,
  (select email     from users u where u.company_id = c.id and u.role = 'owner' limit 1) as owner_email,
  (select full_name from users u where u.company_id = c.id and u.role = 'owner' limit 1) as owner_name,
  -- Subscription
  s.plan_name,
  s.status as subscription_status,
  s.monthly_amount,
  -- Change order stats
  (select count(*) from change_orders co where co.company_id = c.id) as total_change_orders,
  (select count(*) from change_orders co where co.company_id = c.id and co.created_at >= date_trunc('month', now())) as change_orders_this_month,
  (select avg(amount) from change_orders co where co.company_id = c.id and co.amount is not null) as avg_change_order_value,
  (select sum(amount) from change_orders co where co.company_id = c.id) as total_change_order_value,
  (select max(created_at) from change_orders co where co.company_id = c.id) as last_change_order_at,
  -- Activity
  greatest(
    coalesce((select max(last_login_at) from users u where u.company_id = c.id), '1970-01-01'::timestamptz),
    coalesce((select max(created_at) from change_orders co where co.company_id = c.id), '1970-01-01'::timestamptz)
  ) as last_activity_at,
  -- Channel mix (last 90 days)
  (select count(*) from messages m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') as emails_sent_90d,
  (select count(*) from messages m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') as sms_sent_90d,
  (select count(*) from messages m where m.company_id = c.id and m.channel = 'email') as emails_sent_total,
  (select count(*) from messages m where m.company_id = c.id and m.channel = 'sms')   as sms_sent_total,
  -- Derived channel preference
  case
    when (select count(*) from messages m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') > 0
     and (select count(*) from messages m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') > 0
      then 'both'
    when (select count(*) from messages m where m.company_id = c.id and m.channel = 'email' and m.created_at >= now() - interval '90 days') > 0
      then 'email'
    when (select count(*) from messages m where m.company_id = c.id and m.channel = 'sms'   and m.created_at >= now() - interval '90 days') > 0
      then 'sms'
    else 'none'
  end as channel_preference,
  -- Team
  (select count(*) from users u where u.company_id = c.id) as team_size
from companies c
left join lateral (
  select * from subscriptions s
  where s.company_id = c.id
  order by s.created_at desc
  limit 1
) s on true;

create unique index mv_company_stats_pk on mv_company_stats (company_id);
create index mv_company_stats_last_activity_idx on mv_company_stats (last_activity_at desc);
create index mv_company_stats_signup_idx on mv_company_stats (signup_at desc);
create index mv_company_stats_plan_status_idx on mv_company_stats (plan_name, subscription_status);
```

### 7.4 New materialized view: `mv_platform_stats`

Single-row view powering the dashboard KPIs.

```sql
create materialized view mv_platform_stats as
select
  (select count(*) from companies) as total_companies,
  (select count(*) from mv_company_stats where last_activity_at >= now() - interval '30 days') as active_companies_30d,
  (select count(*) from change_orders) as total_change_orders,
  (select count(*) from change_orders where created_at >= date_trunc('month', now())) as change_orders_this_month,
  (select coalesce(sum(monthly_amount),0) from subscriptions where status = 'active') as mrr,
  -- Deltas vs prior period
  (select count(*) from companies where created_at >= now() - interval '30 days') as signups_last_30d,
  (select count(*) from companies where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days') as signups_prior_30d,
  (select count(*) from change_orders where created_at >= now() - interval '30 days') as cos_last_30d,
  (select count(*) from change_orders where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days') as cos_prior_30d,
  now() as refreshed_at;
```

### 7.5 Refresh strategy

Two refresh triggers:

1. **Scheduled refresh (Supabase pg_cron):** every night at 3 AM Pacific

   ```sql
   select cron.schedule('refresh_admin_views', '0 10 * * *', $$
     refresh materialized view concurrently mv_company_stats;
     refresh materialized view mv_platform_stats;
   $$);
   ```

2. **On-demand refresh:** the admin dashboard exposes a "Refresh stats" button (small icon next to KPI cards) that calls a server action which executes `refresh materialized view concurrently mv_company_stats; refresh materialized view mv_platform_stats;`. Rate-limited to once per 5 minutes per user. A `refreshed_at` timestamp from `mv_platform_stats` is shown in the page footer ("Stats last refreshed 4h ago").

### 7.6 Indexes on existing tables (add if missing)

```sql
-- For search / sort on the companies list
create index if not exists companies_name_lower_idx on companies (lower(name));
create index if not exists users_email_lower_idx on users (lower(email));
create index if not exists users_company_role_idx on users (company_id, role);

-- For the trend charts and CO counts
create index if not exists change_orders_created_at_idx on change_orders (created_at desc);
create index if not exists change_orders_company_id_created_at_idx on change_orders (company_id, created_at desc);

-- For messages aggregations
create index if not exists messages_company_channel_created_at_idx on messages (company_id, channel, created_at desc);
```

### 7.7 RLS policies

The admin console uses the **Supabase service-role key** server-side, which bypasses RLS by design. RLS on the customer tables is **not relaxed** — it stays as configured for the customer-facing app. The admin uses a separate, never-client-side service-role client.

A new RLS policy IS added on the `events` table to allow customer-facing app inserts:

```sql
alter table events enable row level security;

-- App backend (service role) can insert
create policy "service_role_insert_events" on events
  for insert
  to service_role
  with check (true);

-- Authenticated users can read events for their own company (in case the customer app exposes its own activity log later)
create policy "users_read_own_company_events" on events
  for select
  to authenticated
  using (company_id in (select company_id from users where id = auth.uid()));
```

### 7.8 Audit log (separate from events)

Every action taken in the admin console — even reads — is logged.

```sql
create table admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_email  text not null,
  action       text not null,            -- 'view_dashboard'|'view_company'|'export_csv'|'login'|'signout'|'refresh_stats'
  resource_type text,                    -- 'company'|null
  resource_id   uuid,                    -- the company id, if applicable
  ip_address   inet,
  user_agent   text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

create index admin_audit_log_admin_email_idx on admin_audit_log (admin_email, created_at desc);
create index admin_audit_log_resource_idx on admin_audit_log (resource_type, resource_id);
```

This is internal-only and accessed via direct SQL when needed. v2 may add a UI for it.

---

## 8. API Specification

The admin console uses **Next.js Server Components and Server Actions** as the primary data access pattern — direct Supabase queries from the server, no separate REST layer. A small number of routes exist for CSV export and the health check.

### 8.1 Server-side data access pattern

All Supabase queries originate in Server Components or Server Actions, using a singleton service-role client:

```typescript
// /src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const adminDb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // never expose to client
  { auth: { persistSession: false } }
)
```

This client is only ever imported in files inside `/src/app/admin/` and `/src/lib/admin/`. ESLint rule enforces this.

### 8.2 Routes

RouteMethodAuthPurpose`/admin/login`GETpublicLogin page`/admin/login/send`POSTpublicSend magic link (with allowlist check)`/admin/auth/callback`GETpublicMagic link callback, sets session`/admin/health`GETpublicHealth check`/admin`GETrequiredDashboard`/admin/companies`GETrequiredList view`/admin/companies/[id]`GETrequiredProfile view`/admin/companies/export`GETrequiredCSV export (streamed)`/admin/api/refresh-stats`POSTrequiredTrigger materialized view refresh`/admin/api/signout`POSTrequiredClear session

### 8.3 Endpoint contracts

`GET /admin/health`

```json
// 200 OK
{ "status": "ok", "version": "1.0.0", "db": "ok", "timestamp": "2026-04-28T..." }

// 503
{ "status": "error", "version": "1.0.0", "db": "fail", "error": "...", "timestamp": "..." }
```

`POST /admin/login/send`

```json
// Request
{ "email": "boss@salesmonsters.com" }

// 200 OK (always — don't leak whether email is allowlisted)
{ "ok": true, "message": "If that email is authorized, a link has been sent." }
```

Internally, this checks the allowlist and only actually triggers the magic link if the email matches.

`GET /admin/companies/export`

- Query params mirror the list page's filter params (e.g. `?plan=pro&activity=dormant_14`)
- Response: `Content-Type: text/csv` streamed
- Header: `Content-Disposition: attachment; filename="companies_2026-04-28.csv"`

`POST /admin/api/refresh-stats`

```json
// 200 OK
{ "ok": true, "refreshed_at": "2026-04-28T..." }

// 429 Too Many Requests (if called within 5 min of last refresh)
{ "ok": false, "error": "rate_limited", "retry_after_seconds": 240 }
```

### 8.4 Error handling

- Every server action and route handler is wrapped in a try/catch that logs to Vercel logs + Sentry (see §13).
- User-facing errors render an error boundary with a "Something went wrong — try again or contact engineering" message and a unique error reference ID.
- Database errors never expose raw SQL or stack traces to the client.

---

## 9. Component Architecture

### 9.1 Folder structure

```
/src
├── app
│   └── admin
│       ├── layout.tsx                  ← shell (sidebar + topbar + auth gate)
│       ├── page.tsx                    ← /admin dashboard
│       ├── login
│       │   └── page.tsx
│       ├── auth
│       │   └── callback
│       │       └── route.ts
│       ├── health
│       │   └── route.ts
│       ├── companies
│       │   ├── page.tsx                ← /admin/companies list
│       │   ├── [companyId]
│       │   │   └── page.tsx            ← /admin/companies/[id] profile
│       │   └── export
│       │       └── route.ts            ← CSV export
│       └── api
│           ├── refresh-stats
│           │   └── route.ts
│           └── signout
│               └── route.ts
│
├── components
│   └── admin
│       ├── shell
│       │   ├── Sidebar.tsx
│       │   ├── TopBar.tsx
│       │   └── SignOutButton.tsx
│       ├── dashboard
│       │   ├── KpiCard.tsx
│       │   ├── KpiCardRow.tsx
│       │   ├── TrendChart.tsx
│       │   └── ActivityFeed.tsx
│       ├── companies
│       │   ├── CompanyTable.tsx
│       │   ├── CompanyTableFilters.tsx
│       │   ├── CompanyTableSearch.tsx
│       │   └── CompanyTablePagination.tsx
│       ├── profile
│       │   ├── ProfileHeader.tsx
│       │   ├── ProfileCard.tsx
│       │   ├── UsageStatsPanel.tsx
│       │   ├── ChannelsPanel.tsx
│       │   ├── TeamMembersTable.tsx
│       │   ├── ActivityTimeline.tsx
│       │   └── ChangeOrderLog.tsx
│       └── shared
│           ├── StatusBadge.tsx
│           ├── PlanBadge.tsx
│           ├── ChannelBadge.tsx
│           ├── EmptyState.tsx
│           └── DeltaIndicator.tsx
│
└── lib
    └── admin
        ├── auth.ts                     ← allowlist check, session helpers
        ├── queries.ts                  ← all Supabase reads
        ├── audit.ts                    ← audit log helpers
        ├── csv.ts                      ← CSV streaming helper
        └── types.ts                    ← TypeScript types
```

### 9.2 shadcn/ui components used

- `Card`, `Badge`, `Button`, `Input`, `Select`, `Popover`, `Calendar` (date range), `Table`, `DropdownMenu`, `Avatar`, `Separator`, `Tooltip`, `Toast`, `Skeleton`, `Tabs`

### 9.3 State management

- **Server-side:** all data fetching in Server Components. No client-side data fetching for read paths.
- **URL state:** filters, search, page, sort all live in URL query params (using `nuqs` or hand-rolled).
- **Client state:** kept to the absolute minimum — only for things like a date-range popover's open/closed state and form inputs.
- **No global state library.** No Redux, Zustand, etc. URL + Server Components are sufficient.

### 9.4 Charting

- Recharts for the two trend lines and the channel pie chart.
- All charts wrapped in a `ChartContainer` component that handles loading, empty, and error states uniformly.

---

## 10. UI/UX Specification

### 10.1 Design system

- **Typography:** Inter (system fallback to system-ui)
- **Color palette:** neutral grays + a single accent color matched to ChangeOrder Pro brand (placeholder: `#0F766E` teal-700, confirm with brand guide)
- **Spacing scale:** Tailwind defaults
- **Border radius:** `rounded-lg` (8px) on cards, `rounded-md` (6px) on inputs
- **Dark mode:** v1 is light-mode only. Dark mode in v2 if requested.

### 10.2 Layout

- Sidebar: fixed 240px wide, collapsible to 64px (icons only) via toggle.
- Topbar: fixed 56px tall.
- Main content: max-width 1440px, centered with `px-6` gutter.

### 10.3 Empty states

Every list/feed/chart MUST handle the empty case explicitly:

SurfaceEmpty stateDashboard KPIsShow 0 with no deltaTrend chart"Not enough data yet — check back after a few weeks of activity"Activity feed"No recent activity" with a passive iconCompany list"No companies match your filters. \[Clear all filters\]"Activity timeline"No activity recorded for this company yet"Change order log"This company hasn't created any change orders yet"

### 10.4 Loading states

- Server Components stream, so layout renders instantly with shadcn `Skeleton` placeholders for data-dependent regions.
- KPI cards: shimmering skeleton until value resolves.
- Tables: 5 skeleton rows until data is ready.

### 10.5 Error states

- Each major surface (dashboard, list, profile) is wrapped in a Next.js error boundary (`error.tsx`).
- Error UI: a `Card` with an icon, "Something went wrong loading this data," a "Try again" button, and a small reference ID for support.
- Network errors trigger a retry with exponential backoff (max 3 attempts) before showing the error state.

### 10.6 Accessibility

- All interactive elements keyboard-navigable, focus rings visible.
- All icons paired with text labels OR `aria-label`.
- Color is never the sole carrier of meaning — status badges include text.
- Charts have a textual summary in `aria-describedby` for screen readers.
- Color contrast meets WCAG AA (4.5:1 for body text, 3:1 for large/UI).
- Tab order follows visual order on every page.

### 10.7 Responsive behavior

- **Desktop (≥1280px):** primary target, full layout
- **Laptop (1024–1279px):** full layout, narrower content max-width
- **Tablet (768–1023px):** sidebar collapses to icons, KPI cards wrap to 2 rows
- **Mobile (&lt;768px):** functional but not optimized — table becomes horizontally scrollable; all features remain accessible. (Mobile-first redesign is post-v1.)

### 10.8 Detailed wireframes

#### Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ ChangeOrder Pro Admin                              boss@salesmonsters ▾    │
├────┬─────────────────────────────────────────────────────────────────────────┤
│ 🏠 │  Dashboard                          Stats refreshed 4h ago [⟳ Refresh]  │
│ 🏢 │                                                                         │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│    │  │  142     │ │   89     │ │  4,217   │ │   312    │ │  $14,250 │       │
│    │  │ Companies│ │  Active  │ │ Total CO │ │  CO MTD  │ │   MRR    │       │
│    │  │ ↑12% MoM │ │ ↑5%      │ │ ↑22%     │ │ ↑8%      │ │ ↑15%     │       │
│    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│    │                                                                         │
│    │  ┌────────────────────────────┐  ┌────────────────────────────┐         │
│    │  │ Signups (12 weeks)         │  │ Change Orders (12 weeks)   │         │
│    │  │                            │  │                            │         │
│    │  │   📈 line chart            │  │   📈 line chart            │         │
│    │  │                            │  │                            │         │
│    │  └────────────────────────────┘  └────────────────────────────┘         │
│    │                                                                         │
│    │  Recent Activity                                                        │
│    │  ┌────────────────────────────────────────────────────────────────┐     │
│    │  │ ✨ Acme Plumbing signed up                          2h ago    │     │
│    │  │ ⬆️ BuildRight upgraded to Pro                       5h ago    │     │
│    │  │ 📤 Cooper HVAC sent 3 change orders                 6h ago    │     │
│    │  │ ❌ TopTier Roofing canceled subscription            yesterday │     │
│    │  │ ... 16 more ...                                                │     │
│    │  └────────────────────────────────────────────────────────────────┘     │
└────┴─────────────────────────────────────────────────────────────────────────┘
```

#### Companies list

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ ChangeOrder Pro Admin                              boss@salesmonsters ▾    │
├────┬─────────────────────────────────────────────────────────────────────────┤
│ 🏠 │  Companies                                                              │
│ 🏢 │                                                                         │
│    │  [🔍 Search company, owner, email...]                  [⬇ Export CSV]   │
│    │                                                                         │
│    │  Plan: [All ▾]  Status: [All ▾]  Channel: [All ▾]                       │
│    │  Activity: [Any ▾]  Signup: [Any date ▾]   [Clear all]                  │
│    │                                                                         │
│    │  Showing 1–50 of 142                                                    │
│    │  ┌────────────────────────────────────────────────────────────────────┐ │
│    │  │ Company ▼   │ Owner    │ Plan   │ COs│ Last Active │ Chan │ Status │ │
│    │  ├─────────────┼──────────┼────────┼────┼─────────────┼──────┼────────┤ │
│    │  │ Acme Plmb.  │ John Doe │ Pro    │ 47 │ 2h ago      │ Both │ Active │ │
│    │  │ BuildRight  │ Jane S.  │ Start  │ 12 │ 1d ago      │ SMS  │ Active │ │
│    │  │ Cooper HVAC │ Bob R.   │ Pro    │ 89 │ 6h ago      │ Email│ Active │ │
│    │  │ ...                                                                │ │
│    │  └────────────────────────────────────────────────────────────────────┘ │
│    │                                                                         │
│    │  ◀ Prev    1  2  3 … 5    Next ▶                                        │
└────┴─────────────────────────────────────────────────────────────────────────┘
```

#### Company profile

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ ChangeOrder Pro Admin                              boss@salesmonsters ▾    │
├────┬─────────────────────────────────────────────────────────────────────────┤
│ 🏠 │  ← Back to companies                                                    │
│ 🏢 │                                                                         │
│    │  🏢 Acme Plumbing                              [Pro] [Active]           │
│    │     Customer since Jan 15, 2026 (103 days)                              │
│    │  ─────────────────────────────────────────────────────────              │
│    │                                                                         │
│    │  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│    │  │ Profile                     │  │ Usage                       │       │
│    │  │ Owner: John Doe             │  │ 47 change orders (all time) │       │
│    │  │ Email: john@acme.com        │  │ 12 this month               │       │
│    │  │ Phone: (555) 123-4567       │  │ Avg value: $4,250           │       │
│    │  │ Industry: Plumbing          │  │ Total value: $199,750       │       │
│    │  │ 1234 Main St, LA, CA        │  │ Last CO: 2h ago             │       │
│    │  │ Stripe: cus_xxx ↗           │  │ Last login: 4h ago          │       │
│    │  └─────────────────────────────┘  └─────────────────────────────┘       │
│    │                                                                         │
│    │  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│    │  │ Channels                    │  │ Team (3 members)            │       │
│    │  │ 📧 Email: ✓ (124 sent)      │  │ John Doe (Owner)  2h ago    │       │
│    │  │ 💬 SMS:   ✓ (89 sent)       │  │ Mike Jones (Admin)1d ago    │       │
│    │  │                             │  │ Sara Lee (Member) 4d ago    │       │
│    │  │   🥧 58% Email / 42% SMS    │  │                             │       │
│    │  └─────────────────────────────┘  └─────────────────────────────┘       │
│    │                                                                         │
│    │  Activity Timeline                                                      │
│    │  ┌────────────────────────────────────────────────────────────────┐     │
│    │  │ Today                                                          │     │
│    │  │ • 📤 Sent CO-0047 to Bob's Office              2h ago          │     │
│    │  │ • ✅ CO-0046 approved                          4h ago          │     │
│    │  │ Yesterday                                                      │     │
│    │  │ • 📤 Sent CO-0046 to Smith Renovation                          │     │
│    │  │ Jan 29                                                         │     │
│    │  │ • ⬆️ Plan upgraded Free → Pro                                   │     │
│    │  │ ... [Load more]                                                │     │
│    │  └────────────────────────────────────────────────────────────────┘     │
│    │                                                                         │
│    │  Change Order Log                                                       │
│    │  ┌────────────────────────────────────────────────────────────────┐     │
│    │  │ Date     │ # ▼  │ Customer       │ Amount   │ Status  │ Chan  │     │
│    │  ├──────────┼──────┼────────────────┼──────────┼─────────┼───────┤     │
│    │  │ 2h ago   │ 0047 │ Bob's Office   │  $5,200  │ Sent    │ Both  │     │
│    │  │ Yesterday│ 0046 │ Smith Reno     │  $3,750  │ Approved│ Email │     │
│    │  │ ...                                                            │     │
│    │  └────────────────────────────────────────────────────────────────┘     │
│    │  ◀ Prev    1  2  Next ▶                                                 │
└────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Authentication & Authorization

### 11.1 Auth flow

```
1. User visits admin.changeorderpro.com (or any /admin/* path)
2. Middleware checks for a valid Supabase session cookie
   ├─ No session → redirect to /admin/login
   └─ Has session →
       ├─ Decode JWT, extract email
       ├─ Check email ∈ ADMIN_ALLOWLIST
       │    ├─ Yes → proceed
       │    └─ No → 403 Forbidden, force sign-out
       └─ Continue to route

Login flow:
1. User enters email at /admin/login
2. Server checks email ∈ ADMIN_ALLOWLIST (NEVER tells user the result)
3. If allowlisted: trigger Supabase magic link via supabase.auth.signInWithOtp
4. User clicks link → /admin/auth/callback?code=...
5. Server exchanges code for session, sets cookie, redirects to /admin
```

### 11.2 Allowlist mechanism

```typescript
// /src/lib/admin/auth.ts
const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email.toLowerCase())
}
```

`ADMIN_ALLOWLIST` env var lives in Vercel project settings (Production env scope only — not Preview, not Development). Initial value:

```
ADMIN_ALLOWLIST=boss@salesmonsters.com,evan@salesmonsters.com
```

Adding/removing admins requires a Vercel redeploy. v2 may move this to a Supabase table for hot updates.

### 11.3 Middleware

```typescript
// /src/middleware.ts (relevant excerpt)
```
```
```
```
```
```
```
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()
```
  if (req.nextUrl.pathname === '/admin/login' ||
      req.nextUrl.pathname === '/admin/health' ||
      req.nextUrl.pathname.startsWith('/admin/auth/')) {
    return NextResponse.next()
  }

  const session = await getSession(req)
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  if (!isAdminEmail(session.user.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/admin/login?error=unauthorized', req.url))
  }
  return NextResponse.next()
}
```

### 11.4 Cookie scoping

- Session cookie is set with:
  - `Domain=admin.changeorderpro.com`
  - `Secure`
  - `HttpOnly`
  - `SameSite=Lax`
  - `Max-Age=604800` (7 days)
- The customer-facing app at `app.changeorderpro.com` (or root domain) uses a separate cookie scope, so admin sessions never leak into customer-facing requests and vice versa.

---

## 12. Security

### 12.1 Threat model

| Threat | Vector | Mitigation |
|--------|--------|-----------|
| Unauthorized access | Stolen session cookie | HttpOnly + Secure + 7-day expiry; allowlist re-checked every request |
| Unauthorized access | Phishing → magic link to attacker | Magic links only sent to allowlisted emails; admins trained to verify |
| Privilege escalation | Customer-facing user discovers admin URL | Subdomain isolation + middleware allowlist + RLS in service-role-only context |
| Data exfiltration | CSV export abused | Audit log records every export; cap at 10K rows |
| SQL injection | Malicious filter/search input | All queries parameterized via Supabase client; no string concatenation |
| Service-role key leak | Key committed or exposed to client | Key is server-only; ESLint rule blocks import in client components; secret scanning enabled in repo |
| Replay attack | Magic link reuse | Supabase magic links are single-use and 60-min TTL |
| CSRF | Form posts from external site | SameSite=Lax cookie + Next.js Server Actions with CSRF tokens |
| Brute-force allowlist enumeration | Spam `/admin/login/send` | Same response regardless of allowlist match; rate limit per IP (5/min) |
| Insider misuse | Admin abuses access | Full audit log of every action including views; monthly review |

### 12.2 Required security controls

- [ ] HTTPS enforced (Vercel default)
- [ ] Service-role Supabase key only used server-side, never exposed to bundle
- [ ] All env vars containing secrets prefixed without `NEXT_PUBLIC_`
- [ ] ESLint rule preventing client-side import of `adminDb`
- [ ] Rate limiting on `/admin/login/send` (5 requests / IP / minute)
- [ ] Rate limiting on `/admin/api/refresh-stats` (1 request / user / 5 minutes)
- [ ] Audit log entries for every page view, export, and refresh
- [ ] Vercel Web Application Firewall enabled (basic tier sufficient)
- [ ] Sentry error reporting configured (server-only DSN)
- [ ] Dependabot enabled on the repo
- [ ] GitHub secret scanning enabled

### 12.3 Privacy

- The admin console handles customer PII (names, emails, phones, addresses, change-order amounts and customer names). Treat as confidential.
- No PII is logged in plaintext to Vercel logs — only IDs.
- The audit log captures admin email + the company ID accessed, but not the customer's PII.
- Export CSVs contain PII; exports are logged. Files are downloaded to admin's local machine only — never staged on the server.

### 12.4 Compliance notes

- Not subject to HIPAA (contractor industry)
- Subject to GDPR/CCPA insofar as ChangeOrder Pro customers may be EU/CA residents — admin console respects existing customer-facing data deletion requests (a deleted customer simply disappears from the admin views via cascade).

---

## 13. Performance Requirements

### 13.1 Targets

| Page | Metric | Target |
|------|--------|--------|
| Dashboard | TTFB | <200ms |
| Dashboard | LCP | <1s p95 |
| Companies list (50 rows) | LCP | <1.5s p95 |
| Companies list (filtered, 50 rows) | LCP | <2s p95 |
| Company profile | LCP | <1.5s p95 |
| Company profile (with full activity history) | LCP | <2.5s p95 |
| CSV export (10K rows) | TTFB | <2s; complete <30s |

### 13.2 Strategies

- **Materialized views** for KPI aggregations (`mv_platform_stats`, `mv_company_stats`) — refresh nightly + on demand
- **Server Components** by default — no client-side waterfalls
- **Indexed search** — `lower(name)` index on `companies` for case-insensitive ILIKE
- **Streaming CSV export** — write rows to the response as they're fetched, never load the full set into memory
- **Edge caching** for the dashboard with a 60-second `stale-while-revalidate` (acceptable since `mv_platform_stats` is the source of truth)
- **Suspense + streaming** — KPI cards stream independently from the trend charts so the page is interactive ASAP
- **DB connection pooling** via Supabase's pgBouncer (default for serverless)

### 13.3 Capacity assumptions

Sized for 5 years of growth without re-architecting:
- 10,000 companies
- 500,000 change orders
- 5,000,000 messages
- 50,000,000 events

Materialized view refresh time at this scale: estimated <60s, which is acceptable for nightly cron + on-demand. If it grows beyond that, switch `mv_company_stats` to incremental refresh (Postgres triggers writing to a denormalized table).

---

## 14. Observability

### 14.1 Logging

- **Vercel logs** capture all server-side console output. Structured JSON logging via Pino:
  ```typescript
  log.info({ admin: email, action: 'view_company', companyId }, 'admin viewed company')
  ```
- **No PII** in log lines — only IDs.
- **Audit log** in Postgres for compliance / review (see §7.8).

### 14.2 Error tracking

- **Sentry** configured for server-side errors only. Client-side errors are negligible since most rendering is server-side.
- Sentry environment: `admin-production`.
- Releases tagged with git commit SHA on each deploy.

### 14.3 Uptime monitoring

- External uptime check (BetterStack or UptimeRobot) hits `/admin/health` every 60 seconds.
- Alert: page Boss + email Evan if 2 consecutive checks fail.
- SLO: 99.5% monthly uptime.

### 14.4 Metrics

Vercel Analytics enabled for the admin route group — captures Core Web Vitals (LCP, FID, CLS, TTFB) per page.

A small **internal metrics dashboard** (post-v1) will show:
- Daily active admins
- Total page views per day
- p95 page load times
- Materialized view refresh duration

---

## 15. Testing Strategy

### 15.1 Test levels

**Unit tests (Vitest)**
- All utility functions in `/src/lib/admin/`
- Allowlist matching
- CSV row formatting
- Date/time helpers (relative time, week bucketing)
- Filter param parsers
- Coverage target: ≥80% on `/src/lib/admin/`

**Integration tests (Vitest + test Supabase)**
- Each query in `/src/lib/admin/queries.ts` against a seeded test database
- Auth middleware behavior (allowed email, disallowed email, no session, expired session)
- Audit log writes happen for each protected action

**End-to-end tests (Playwright)**
- Login flow (with allowlisted email + magic link mock)
- Login flow rejection (with non-allowlisted email)
- Dashboard renders KPIs
- Companies list: search, filter, sort, paginate
- Company profile: all panels render with seeded data
- CSV export downloads a file with expected columns
- Sign-out clears session and redirects to login

**Smoke tests (production)**
- Post-deploy script hits `/admin/health` and a known company profile (with a service-role test session) to verify deploy succeeded

### 15.2 Test data

- **Seed script:** `/scripts/seed-admin-test.ts` creates 25 fake companies with realistic data:
  - 10 active (recent activity)
  - 5 dormant (no activity 30+ days)
  - 3 trialing
  - 5 mixed plans
  - 2 canceled
- Seed includes change orders, messages, users, events to exercise every panel.
- Seed targets a separate Supabase project (`changeorderpro-test`) — never run against production.

### 15.3 CI

- GitHub Actions runs unit + integration tests on every PR
- Playwright runs on PR and nightly against a Vercel preview deployment
- Type check (`tsc --noEmit`) and lint must pass for merge

---

## 16. Environment Variables

```bash
# /admin app — required env vars

# Supabase
SUPABASE_URL=https://xxx.supabase.co                  # public
SUPABASE_ANON_KEY=eyJ...                              # public, used for auth
SUPABASE_SERVICE_ROLE_KEY=eyJ...                      # SECRET — server only

# Admin allowlist (comma-separated, lowercase)
ADMIN_ALLOWLIST=boss@salesmonsters.com,evan@salesmonsters.com

# Auth
NEXT_PUBLIC_SITE_URL=https://admin.changeorderpro.com  # for magic link redirect

# Stripe (read-only — for the "Open in Stripe" link)
STRIPE_DASHBOARD_BASE_URL=https://dashboard.stripe.com

# Observability
SENTRY_DSN=https://...                                # SECRET
SENTRY_ENVIRONMENT=admin-production
LOG_LEVEL=info

# Optional
ADMIN_REFRESH_RATE_LIMIT_SECONDS=300                  # default 300 (5 min)
ADMIN_LOGIN_RATE_LIMIT_PER_MIN=5
```

All secrets are stored in Vercel project settings under the **Production** environment scope. Preview deployments get a separate set scoped to a staging Supabase project.

---

## 17. Deployment & Rollback

### 17.1 Hosting

- **Vercel project:** `changeorderpro-admin` (separate Vercel project from the customer-facing app, OR same project with subdomain routing — see §22 decision D-001)
- **Domain:** `admin.changeorderpro.com` with Vercel-managed TLS
- **Environment:** Production environment with `main` branch as source

### 17.2 Deploy workflow

1. PR opened → Vercel preview deploy automatically created at `*.vercel.app`
2. Preview deploy uses staging Supabase (`changeorderpro-test`)
3. PR merged to `main` → production deploy
4. Post-deploy smoke test runs (`/admin/health` + seeded test profile)
5. If smoke fails, automated rollback to previous deployment via Vercel's instant rollback

### 17.3 Database migrations

- All schema changes (events table, materialized views, indexes, audit log) ship as Supabase migrations in `/supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.sql`
- Migrations run via `supabase db push` from a CI step before the Vercel deploy completes
- Rollback: each migration has a corresponding `_rollback.sql` file kept in `/supabase/rollbacks/` for manual emergency rollback

### 17.4 Rollback plan

| Failure type | Response |
|--------------|----------|
| Bad UI deploy | Vercel instant rollback (one click, ~30 seconds) |
| Bad migration | Run rollback SQL manually; restore from latest Supabase snapshot if needed |
| Service-role key leak | Rotate key in Supabase dashboard, redeploy with new key, audit log review |
| Allowlist misconfigured | Update env var in Vercel, redeploy (~2 min) |

### 17.5 Backups

- Supabase daily automated backups (default, 7-day retention) — sufficient.
- No additional backup needed for the admin app itself; it's stateless code.

---

## 18. Implementation Phases

### Phase 1 — MVP (Week 1, ~30 hours)

Goal: a usable internal tool with the most-asked answers.

**Deliverables:**
- [ ] Supabase migration: `events` table + indexes + RLS policy
- [ ] Supabase migration: indexes on `companies`, `users`, `change_orders`, `messages`
- [ ] Supabase migration: `mv_platform_stats` materialized view + cron schedule
- [ ] Supabase migration: `admin_audit_log` table
- [ ] Auth middleware + allowlist
- [ ] `/admin/login` page + magic link send
- [ ] `/admin/auth/callback` route
- [ ] `/admin` dashboard with 5 KPI cards (no charts yet)
- [ ] `/admin/companies` table with all 9 columns, search, basic pagination (no advanced filters)
- [ ] `/admin/health` route
- [ ] Sidebar + topbar shell
- [ ] Backfill script to seed `events` from existing data
- [ ] Sentry + Vercel Analytics wired up

**Definition of done:** Boss can log in, see KPIs, search and click into any company name (even though the profile is just a stub).

### Phase 2 — Profile drill-down (Week 2, ~25 hours)

**Deliverables:**
- [ ] Supabase migration: `mv_company_stats` materialized view
- [ ] `/admin/companies/[id]` profile page
- [ ] Profile header + Profile card
- [ ] Usage stats panel
- [ ] Channels panel (with pie chart)
- [ ] Team members table
- [ ] Activity timeline (50 events, "load more")
- [ ] Change order log (paginated)
- [ ] Empty/error/loading states for each panel

**Definition of done:** Boss can pull up any company and see everything they want to know in one screen.

### Phase 3 — Polish (Week 3, ~20 hours)

**Deliverables:**
- [ ] Trend charts (signups + COs, 12 weeks)
- [ ] Recent activity feed on dashboard
- [ ] Advanced filters on companies list (plan, status, channel, activity, date range)
- [ ] CSV export with streaming
- [ ] On-demand refresh button + rate limiting
- [ ] Audit logging on every action
- [ ] Playwright E2E test suite
- [ ] Documentation: README + runbook

**Definition of done:** All FRs from §5 are implemented, tests pass, production-ready.

### Phase 4 — Future (post-v1, not committed)

Backlog of nice-to-haves, prioritized for later:
- Cohort analysis (retention curves, signup-month cohorts)
- Slack alerts on churn-risk events
- Admin notes per company (free-text annotations)
- Saved filter views
- Customer impersonation / login-as-user
- Edit-in-place for select fields
- Multi-role permissions (super admin / read-only)
- Mobile-first responsive redesign
- Dark mode
- Audit log UI

---

## 19. Risks & Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|-----------|
| R1 | Allowlist env var misconfigured, locking everyone out | Low | High | Smoke test post-deploy logs in as Boss; rollback if fail |
| R2 | Materialized view refresh becomes slow at scale | Medium | Medium | Designed for 10K companies / 500K COs; switch to incremental refresh if exceeded |
| R3 | Service-role key accidentally exposed to client bundle | Low | Critical | ESLint rule + import path conventions + secret scanning |
| R4 | Stripe webhook lag causing stale subscription data in admin | Medium | Low | Display "as of" timestamp; manual refresh button |
| R5 | Customer PII in CSV exports leaks via personal device | Medium | Medium | Audit log every export; quarterly review of export volume |
| R6 | Existing app's data model differs from assumptions in §7.1 | Medium | Medium | Phase 1 starts with a 2-hour schema audit before any code is written |
| R7 | Backfill script creates duplicate events | Low | Low | Script is idempotent — checks for existing events before inserting |
| R8 | Subdomain DNS / TLS misconfig blocks launch | Low | Medium | Provision DNS + TLS in Phase 1 day 1, verify with curl before building anything else |

---

## 20. Decisions Log

Open questions from the v0.1 draft, now resolved.

| ID | Decision | Rationale |
|----|----------|-----------|
| D-001 | Subdomain `admin.changeorderpro.com`, separate Vercel project | Cleaner cookie scoping, smaller deploy blast radius, easier to add network restrictions later (e.g., IP allowlist via Vercel WAF) |
| D-002 | Channel preference is **derived** from the `messages` table and cached in `mv_company_stats` | Avoids schema changes to `companies`; refreshed nightly is fine for this metric |
| D-003 | `change_orders.amount` IS assumed to exist and be populated; profile gracefully degrades if null | Matches existing customer app data model; null-safe rendering covers the edge case |
| D-004 | Stripe data is read from Supabase (synced via existing webhook), not live API calls | Performance + reliability; webhook pipeline already exists |
| D-005 | Read-only in v1; no edit, no impersonation, no billing actions | Smaller surface area, faster ship, lower security risk |
| D-006 | Single `admin` role; no read-only / super-admin distinction in v1 | Internal team is small (5 people); over-engineered to introduce roles now |
| D-007 | Allowlist via env var, not a Supabase table | Faster to ship; redeploy cost is acceptable when adding/removing admins is rare |
| D-008 | Materialized views, not views | Performance is non-negotiable for the dashboard |
| D-009 | Recharts, not D3 or Chart.js | Already used elsewhere in the org; React-friendly; sufficient for the 2 charts |
| D-010 | URL state for filters, not localStorage / global state | Bookmarkable, shareable, no client state library needed |

---

## 21. Glossary

| Term | Definition |
|------|------------|
| **Company** | A tenant (contractor business) using ChangeOrder Pro |
| **Owner** | The user with `role = 'owner'` on a company; usually the original signup |
| **Change order (CO)** | A document the contractor sends to their customer requesting approval for additional work / cost |
| **Customer (theirs)** | The end-user receiving a change order — distinct from a ChangeOrder Pro customer |
| **Customer (ours)** | A company paying for ChangeOrder Pro |
| **Channel** | The medium a change order is sent through: email, SMS, or both |
| **Active** | A company with any user activity or change-order activity in the last 30 days |
| **Dormant** | A company with no activity in the last 14+ days |
| **MRR** | Monthly recurring revenue — sum of `monthly_amount` for active subscriptions |
| **MV** | Materialized view |
| **Allowlist** | The set of email addresses authorized to access the admin console |
| **RLS** | Row-Level Security (Postgres feature used by Supabase) |
| **Service role** | Supabase API key that bypasses RLS; server-only |

---

## 22. Appendices

### Appendix A — Sample SQL queries the admin uses

```sql
-- Dashboard KPIs (single row from mv)
select * from mv_platform_stats;

-- Company list with search + filters + pagination
select * from mv_company_stats
where (lower(company_name) like '%' || lower($1) || '%'
       or lower(owner_email) like '%' || lower($1) || '%'
       or lower(owner_name) like '%' || lower($1) || '%')
  and ($2::text[] is null or plan_name = any($2))
  and ($3::text[] is null or subscription_status = any($3))
  and ($4::text is null or
       case
         when $4 = 'active_30'   then last_activity_at >= now() - interval '30 days'
         when $4 = 'dormant_14'  then last_activity_at < now() - interval '14 days'
         when $4 = 'dormant_30'  then last_activity_at < now() - interval '30 days'
       end)
order by signup_at desc
limit $5 offset $6;

-- Trend chart: signups per week (12 weeks)
select date_trunc('week', created_at) as week_start,
       count(*) as signups
from companies
where created_at >= now() - interval '12 weeks'
group by 1
order by 1;

-- Trend chart: COs per week (12 weeks)
select date_trunc('week', created_at) as week_start,
       count(*) as change_orders
from change_orders
where created_at >= now() - interval '12 weeks'
group by 1
order by 1;

-- Recent activity feed
select e.*, c.name as company_name
from events e
join companies c on c.id = e.company_id
order by e.created_at desc
limit 20;

-- Profile: stats panel
select * from mv_company_stats where company_id = $1;

-- Profile: team members
select id, email, full_name, role, last_login_at, created_at
from users
where company_id = $1
order by case when role = 'owner' then 0 else 1 end, created_at;

-- Profile: activity timeline
select * from events
where company_id = $1
order by created_at desc
limit $2 offset $3;

-- Profile: change order log
select id, co_number, customer_name, amount, status, sent_via, created_at
from change_orders
where company_id = $1
order by created_at desc
limit $2 offset $3;
```

### Appendix B — Backfill script outline

```typescript
// /scripts/backfill-events.ts
// Idempotent — safe to re-run.
// Synthesizes historical events from existing tables.

async function backfill() {
  // 1. signup events for every existing company
  for (const company of await db.from('companies').select('*')) {
    await upsertEvent({
      company_id: company.id,
      event_type: 'signup',
      description: `${company.name} signed up`,
      created_at: company.created_at,
    })
  }

  // 2. first_change_order event per company
  for (const company of await db.from('companies').select('id')) {
    const firstCO = await db.from('change_orders')
      .select('*').eq('company_id', company.id)
      .order('created_at', { ascending: true })
      .limit(1).single()
    if (firstCO) {
      await upsertEvent({
        company_id: company.id,
        event_type: 'first_change_order',
        description: `First change order created`,
        created_at: firstCO.created_at,
      })
    }
  }

  // 3. plan_upgraded events from subscription history (if available)
  // 4. subscription_canceled events
  // 5. payment_failed events
  // ... see /scripts/backfill-events.ts for full implementation
}

// Idempotency: events have a (company_id, event_type, created_at) unique-ish key
// upsertEvent checks for an existing matching event before inserting.
```

### Appendix C — Open items for the build kickoff meeting

These are NOT blockers — they'll be sorted in the first 30 min of build:

1. Confirm exact `companies` schema matches §7.1; adjust queries if not
2. Confirm Stripe webhook is writing the columns shown in §7.1 `subscriptions`
3. Confirm `messages.channel` is the column name (vs. `messages.type` or similar)
4. Decide on the brand accent color for badges (placeholder is teal-700)
5. Confirm `admin.changeorderpro.com` DNS is available to provision

### Appendix D — File checklist for engineering

```
✅ Migrations
   /supabase/migrations/20260428000001_create_events_table.sql
   /supabase/migrations/20260428000002_add_admin_indexes.sql
   /supabase/migrations/20260428000003_create_mv_company_stats.sql
   /supabase/migrations/20260428000004_create_mv_platform_stats.sql
   /supabase/migrations/20260428000005_create_admin_audit_log.sql
   /supabase/migrations/20260428000006_pg_cron_refresh_schedule.sql

✅ App routes
   /src/app/admin/layout.tsx
   /src/app/admin/page.tsx
   /src/app/admin/login/page.tsx
   /src/app/admin/auth/callback/route.ts
   /src/app/admin/health/route.ts
   /src/app/admin/companies/page.tsx
   /src/app/admin/companies/[companyId]/page.tsx
   /src/app/admin/companies/export/route.ts
   /src/app/admin/api/refresh-stats/route.ts
   /src/app/admin/api/signout/route.ts
   /src/middleware.ts

✅ Components (see §9.1 for the full tree)
✅ Lib (auth, queries, audit, csv, types)
✅ Tests (unit, integration, E2E)
✅ Scripts (backfill-events.ts, seed-admin-test.ts)
✅ Docs (/docs/admin/README.md, /docs/admin/runbook.md)
```

---

*End of PRD.*
