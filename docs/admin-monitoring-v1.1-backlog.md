# Admin Monitoring v1.1 — Backlog

> Tickets for follow-up work after the v1 admin monitoring backend ships.
> Based on schema deltas surfaced during Phase 0 of the v1 build (see WORK_LOG.md, decisions D-build-02 through D-build-06).

---

## Ticket 1: Restore the MRR card on the dashboard

**Status:** Open
**Priority:** High (most-asked metric for a SaaS founder)
**Effort:** ~6 hours
**Depends on:** v1 shipped and stable

### Problem

The v1 dashboard ships with only 4 working KPI cards instead of 5. The "MRR" card is stubbed as "—" because the assumed `subscriptions` table with `monthly_amount` doesn't exist in the actual schema. Subscription state currently lives on `companies.plan_tier` (enum: `starter`, `growth`, `pro`, `enterprise`) but there's no dollar amount per company.

### Two paths forward — pick one

**Option A: Static plan-price lookup table (fast, ships in a day)**

Create a small `plans` reference table:
```sql
create table plans (
  tier             text primary key,    -- 'starter' | 'growth' | 'pro' | 'enterprise'
  display_name     text not null,
  monthly_amount   numeric(10,2) not null,
  active           boolean default true
);

insert into plans (tier, display_name, monthly_amount) values
  ('starter',    'Starter',    49.00),
  ('growth',     'Growth',     99.00),
  ('pro',        'Pro',        199.00),
  ('enterprise', 'Enterprise', 499.00);
```

Then MRR becomes:
```sql
select sum(p.monthly_amount) as mrr
from companies c
join plans p on p.tier = c.plan_tier
where c.trial_ends_at is null or c.trial_ends_at < now();  -- exclude trialing
```

Pros: ships fast, no Stripe coupling, accurate enough for internal monitoring.
Cons: doesn't capture custom pricing, discounts, or annual prepay.

**Option B: Sync Stripe subscriptions into Supabase (more accurate, ships in a few days)**

Build a `subscriptions` table (per PRD §7.1) and populate it via Stripe webhooks:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded` (for renewal/MRR confirmation)

```sql
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid references companies(id) on delete cascade,
  stripe_customer_id     text not null,
  stripe_subscription_id text unique not null,
  plan_name              text not null,
  status                 text not null,    -- 'trialing'|'active'|'past_due'|'canceled'
  monthly_amount         numeric(10,2),    -- normalized to monthly even for annual plans
  currency               text default 'USD',
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index subscriptions_company_id_idx on subscriptions (company_id);
create index subscriptions_status_idx on subscriptions (status);
```

Webhook handler at `/app/api/stripe/webhook/route.ts` writes/updates rows. MRR = `sum(monthly_amount) where status = 'active'`.

Pros: accurate, captures annual-to-monthly normalization, reflects real billing.
Cons: webhook plumbing, edge cases (proration, trial-to-paid transitions), more testing.

### Recommendation

Ship **Option A first** (1 day), then layer in **Option B** when there's bandwidth to do Stripe webhooks properly. The plans table doesn't conflict with subscriptions — they coexist, and the dashboard just prefers `subscriptions.monthly_amount` once it's populated, falling back to `plans.monthly_amount * count`.

### Acceptance criteria

- [ ] `plans` table created and seeded with current pricing
- [ ] `mv_platform_stats.mrr` calculates from real data (not hardcoded 0)
- [ ] Dashboard MRR card shows actual MRR value with delta vs. prior period
- [ ] MRR card removed from "stubbed" state in `KpiCardRow.tsx`
- [ ] Tests updated to seed plans and verify MRR calculation
- [ ] CLAUDE.md updated to document the MRR data source

---

## Ticket 2: Add `last_login_at` to users

**Status:** Open
**Priority:** Medium (improves churn-risk detection)
**Effort:** ~3 hours
**Depends on:** v1 shipped

### Problem

The v1 company profile shows "Days since last login: —" because `users.last_login_at` doesn't exist on the actual schema. This is a real churn signal we're losing.

### Solution

Add the column to `users` and update Supabase Auth hooks to write it on every successful sign-in.

```sql
alter table users add column last_login_at timestamptz;
create index users_last_login_at_idx on users (last_login_at desc);
```

Update auth flow in customer-facing app:
```typescript
// On successful sign-in
await db.from('users')
  .update({ last_login_at: new Date().toISOString() })
  .eq('id', user.id);
```

Then update the admin's profile query and `mv_company_stats.last_activity_at` to include it:
```sql
last_activity_at = greatest(
  coalesce(max(u.last_login_at), '1970-01-01'),
  coalesce(max(co.created_at), '1970-01-01'),
  coalesce(max(co.updated_at), '1970-01-01')
)
```

### Acceptance criteria

- [ ] `users.last_login_at` column added via migration
- [ ] Customer-facing auth flow writes the timestamp on every login
- [ ] `mv_company_stats` updated to include logins in `last_activity_at` calculation
- [ ] Profile page "Last login" field shows real value
- [ ] `mv_company_stats` refreshed after migration to backfill existing data (will show "—" for users who haven't logged in since the migration; that's fine)

---

## Ticket 3: Owner detection — use canonical signal instead of "first admin"

**Status:** Open
**Priority:** Low (cosmetic — affects display only)
**Effort:** ~2 hours
**Depends on:** v1 shipped

### Problem

Per D-build-04, v1 treats "first admin user by created_at" as the owner of a company. This works for most cases but fails when:
- The original signup user later left and was replaced by a new admin
- A company has multiple admins from day one (e.g., business partners signing up together)
- The first user gets deleted and the records cascade

### Solution

Add an explicit `companies.owner_user_id` column that's set during signup and rarely changed:

```sql
alter table companies
  add column owner_user_id uuid references users(id) on delete set null;

-- Backfill from existing data using current heuristic
update companies c
set owner_user_id = (
  select id from users
  where company_id = c.id and role = 'admin'
  order by created_at asc
  limit 1
);
```

Then update signup flow to set this column when the first user is created.

Update the admin profile query to:
```sql
select u.* from users u
join companies c on c.owner_user_id = u.id
where c.id = $1;
```

### Acceptance criteria

- [ ] `companies.owner_user_id` column added
- [ ] Backfill migration runs successfully against production
- [ ] Signup flow updated to set `owner_user_id` on company creation
- [ ] `mv_company_stats` and admin profile query updated to use the new column
- [ ] CLAUDE.md updated to document the canonical owner source

---

## Ticket 4: Customer-facing event emission for richer activity feed

**Status:** Open
**Priority:** Medium (makes the activity feed actually useful)
**Effort:** ~8 hours
**Depends on:** v1 shipped, events table populated

### Problem

The v1 build's `events` table is backfilled from existing data (signups, first change orders), but going forward the customer-facing app needs to emit events on every relevant action. Without ongoing emission, the activity feed will only show historical data and stale.

### Solution

Add an `emitEvent()` helper to the customer-facing app and call it in every relevant code path:

```typescript
// /src/lib/events.ts (customer app)
export async function emitEvent(input: {
  company_id: string;
  user_id?: string;
  event_type: EventType;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  await db.from('events').insert({
    ...input,
    created_at: new Date().toISOString(),
  });
}
```

Call sites to wire up:
- Company creation → `signup`
- User invitation → `user_invited`
- User accepts invite → `user_joined`
- Change order created → `change_order_created` (and `first_change_order` if it's the first)
- Change order sent → `change_order_sent`
- Change order approved (via approval link) → `change_order_approved`
- Change order declined → `change_order_rejected`
- Plan upgrade (Stripe webhook) → `plan_upgraded`
- Plan downgrade → `plan_downgraded`
- Subscription canceled → `subscription_canceled`
- Payment failed → `payment_failed`
- Login → `login`

### Acceptance criteria

- [ ] `emitEvent()` helper exists in customer app
- [ ] All 12 call sites wired up
- [ ] Events visible in admin activity feed in real time
- [ ] No PII leaked into `description` or `metadata` fields
- [ ] Performance: event insertion is async / fire-and-forget, never blocks user requests

---

## Ticket 5: Schema reconciliation — sync the PRD to reality

**Status:** Open
**Priority:** Low (housekeeping)
**Effort:** ~1 hour
**Depends on:** v1 shipped

### Problem

The v1 PRD (`docs/admin-monitoring-prd.md` §7.1) describes an idealized schema that differs from the real one. CLAUDE.md (post-build) documents the actual schema. Future agents reading the PRD will get confused.

### Solution

Update PRD §7.1 to reflect the real schema, with a note pointing to the WORK_LOG and CLAUDE.md for the discrepancy history. Mark the PRD version as v1.1.

### Acceptance criteria

- [ ] PRD §7.1 reflects actual schema
- [ ] Change log entry added: "v1.1 — schema reconciled to as-built"
- [ ] References to `subscriptions`, `messages` updated to `companies.plan_tier`, `notifications_log`
- [ ] Decisions D-build-02 through D-build-06 promoted from WORK_LOG into the Decisions Log (§20)

---

## Ticket 6: Trade type filter on companies list

**Status:** Open
**Priority:** Low (nice-to-have)
**Effort:** ~2 hours
**Depends on:** v1 shipped

### Problem

The actual schema has `companies.trade_type` (general contractor, plumbing, electrical, HVAC, etc.) but the v1 list view has no filter for it. This is a useful segmentation for sales conversations.

### Solution

Add a `Trade` filter chip on `/admin/companies` matching the existing filter pattern (multi-select, URL state). Populate options from a `select distinct trade_type from companies` query.

### Acceptance criteria

- [ ] `Trade` filter added to `CompanyTableFilters.tsx`
- [ ] URL state: `?trade=plumbing,electrical`
- [ ] Filter combines correctly with other filters
- [ ] Empty state: "No companies match these filters"

---

## Tickets summary

| # | Title | Priority | Effort |
|---|-------|----------|--------|
| 1 | Restore MRR card | High | 6h |
| 2 | Add `last_login_at` | Medium | 3h |
| 3 | Canonical owner detection | Low | 2h |
| 4 | Event emission in customer app | Medium | 8h |
| 5 | Schema reconciliation in PRD | Low | 1h |
| 6 | Trade type filter | Low | 2h |

**Total v1.1 scope:** ~22 hours / ~3 days of work.

Recommended sequence: **1 → 2 → 4 → 3 → 6 → 5**. Ship MRR first (highest user value), then activity-tracking improvements, then cosmetic improvements, then docs.

---

*End of v1.1 backlog.*
