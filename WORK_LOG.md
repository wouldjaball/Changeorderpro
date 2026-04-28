# Build Work Log — Admin Monitoring Backend

## Phase 0 — Setup & schema audit
**Started:** 2026-04-28

### Schema audit results

Compared actual Supabase schema (from migration files) against PRD §7.1. Significant deltas found — the PRD was written against an idealized schema. Actual schema is different in several ways:

#### `companies` table
- PRD says `industry` → actual is `trade_type` ✗
- PRD says `address_line1, address_line2, city, state, postal_code, country` → actual is `address_street, address_city, address_state, address_zip` (no `country`) ✗
- PRD says no `plan_tier` → actual has `plan_tier` with CHECK constraint (`starter`, `growth`, `pro`, `enterprise`) ✓ (different from PRD plan names)
- PRD says no `stripe_customer_id` on companies → actual HAS `stripe_customer_id` on companies ✓
- Has `trial_ends_at` on companies ✓
- Has `settings` JSONB, `phone`, `trade_type` — not in PRD

#### `users` table
- PRD says `role` is text `owner|admin|member` → actual uses enum `user_role` (`admin`, `pm`, `contractor`) ✗
- PRD says `is_owner boolean generated` → actual has no `is_owner` column ✗
- PRD says `last_login_at` → actual has NO `last_login_at` column ✗
- All users reference `auth.users(id)` ✓

#### `change_orders` table
- PRD says `amount numeric(12,2)` → actual has `fixed_amount` and `total_amount` DECIMAL(12,2) ✗
- PRD says `customer_name, customer_email, customer_phone` on CO → actual has these on `projects` table ✗
- PRD says `status` is text `draft|sent|viewed|approved|rejected|expired` → actual uses enum `co_status` (`draft`, `sent`, `approved`, `declined`, `void`, `invoiced`) ✗
- PRD says `sent_via text` → actual has `approval_method` (different purpose) ✗
- Has `project_id` FK to `projects` — not in PRD schema
- No `responded_at` — has `approved_at` and `declined_at` instead

#### `subscriptions` table
- **DOES NOT EXIST** ✗
- Subscription data lives on `companies` directly (`plan_tier`, `stripe_customer_id`, `trial_ends_at`)
- No `monthly_amount`, `status`, `plan_name` etc.
- MRR calculation will need a different approach

#### `messages` table
- **DOES NOT EXIST** ✗
- Equivalent is `notifications_log` with different columns:
  - `channel` exists ✓ (values: `sms`, `email`)
  - `recipient` instead of `to_address`
  - `status` has values: `sent`, `delivered`, `failed`, `bounced`, `opened`, `clicked`
  - No `provider_id` — has `external_id` instead
  - No `delivered_at` — track via status

#### Additional tables in actual schema not in PRD
- `projects` — job/project records linked to companies
- `co_line_items` — line items on change orders
- `co_photos` — photos attached to COs
- `approval_events` — approval/decline/view events
- `audit_log` — existing audit log (different from PRD's `admin_audit_log`)

### Decisions

- D-build-01: Will adapt all queries to use actual column names, not PRD idealized names. PRD is the functional spec; schema differences are implementation details.
- D-build-02: Since no `subscriptions` table exists, the "Plan" and "Status" columns in the companies list will read from `companies.plan_tier` and derive status from `trial_ends_at`. No MRR calculation possible in v1 without `monthly_amount`. Will show plan_tier instead and note MRR as N/A until Stripe webhook sync adds subscription data.
- D-build-03: `notifications_log` will be used in place of `messages` everywhere the PRD references messages.
- D-build-04: `users.role = 'admin'` will be treated as the "owner" equivalent since there's no `owner` role. The first user (by `created_at`) with role `admin` on a company will be treated as the owner.
- D-build-05: `change_orders.total_amount` will be used for `amount` calculations. `customer_name` will be sourced from `projects.client_name` via the `project_id` FK.
- D-build-06: Since there's no `last_login_at` on users, "days since last login" will show as "—" until we add that column. Not adding it in v1 to avoid modifying customer-facing tables.
- D-build-07: Using `nuqs` for URL state management per PRD recommendation.
- D-build-08: Env var `NEXT_PUBLIC_SUPABASE_URL` already exists (PRD says `SUPABASE_URL`). Will use existing names. Adding `SUPABASE_URL` as alias pointing to same value for the admin service-role client.

### Env var audit
- `NEXT_PUBLIC_SUPABASE_URL` ✓ (PRD calls it `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓ (PRD calls it `SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `ADMIN_ALLOWLIST` ✓ (set to `aaron@salesmonsters.com`)
- `NEXT_PUBLIC_SITE_URL` ✗ MISSING — will use `NEXT_PUBLIC_APP_URL` which exists
- `SENTRY_DSN` ✗ MISSING — will stub Sentry init, works without DSN
- `STRIPE_DASHBOARD_BASE_URL` ✗ MISSING — will hardcode `https://dashboard.stripe.com`

### Project config audit
- Next.js 16.1.6 with App Router ✓
- TypeScript strict mode ✓
- shadcn/ui already installed ✓
- Existing middleware.ts at project root ✓ (will extend for admin routes)

### Commits
- (pending)
