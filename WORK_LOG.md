# Build Work Log — Admin Monitoring Backend

## Phase 0 — Setup & schema audit
**Started:** 2026-04-28
**Commit:** `91a409b` — chore: phase 0 setup and schema audit

### Schema audit results

Compared actual Supabase schema (from migration files) against PRD §7.1. Significant deltas found — the PRD was written against an idealized schema.

**Key deltas:**
- `companies.trade_type` (not `industry`), address columns differ, has `plan_tier` enum
- `users.role` is enum `admin|pm|contractor` (not `owner|admin|member`), no `last_login_at`
- `change_orders` has `total_amount`/`fixed_amount` (not `amount`), customer info on `projects`
- No `subscriptions` table — plan data lives on `companies` directly
- No `messages` table — equivalent is `notifications_log`

### Decisions
- D-build-01: Adapted all queries to actual column names
- D-build-02: MRR shows as $0.00 until Stripe webhook adds subscription amounts
- D-build-03: `notifications_log` used wherever PRD says `messages`
- D-build-04: First admin user by `created_at` treated as owner
- D-build-05: `total_amount` used for CO value, `client_name` from projects table
- D-build-06: No `last_login_at` — shows "—" (not adding column to avoid modifying customer tables)

---

## Phase 1 — MVP
**Commit:** `8ff5947` — feat: phase 1 — admin monitoring MVP

### Deliverables
- 7 migrations (events, indexes, 2 mat views, admin_audit_log, pg_cron, trend RPCs)
- 7 rollback scripts
- Auth: middleware guard, magic link login, callback, signout
- Admin shell: sidebar, topbar, layout (conditional for login page)
- Dashboard: 5 KPI cards with delta indicators
- Companies list: sortable table with search, plan/status/channel badges
- Company profile stub
- Health endpoint: /admin/health
- Backfill script: scripts/backfill-events.ts
- 19 unit tests (auth + helpers)

---

## Phase 2 — Company Profile
**Commit:** `273db67` — feat: phase 2 — full company profile page

### Deliverables
- OverviewPanel: 13 key metrics in a 4-column grid
- TeamPanel: members table with name, email, role, join date
- ChangeOrdersPanel: CO history table with status badges and amounts
- ActivityTimeline: event feed with color-coded event type dots
- All panels load in parallel via Promise.all

---

## Phase 3 — Polish
**Commit:** `b5c4eff` — feat: phase 3 — charts, filters, CSV export, activity feed

### Deliverables
- TrendChart: 12-week area charts for signups and change orders (recharts)
- ActivityFeed: recent platform-wide events on dashboard
- CompanyFilters: plan, status, channel, activity level, date range
- CsvExportButton: downloadable CSV of current company list
- New migration: get_signups_trend, get_cos_trend, refresh_admin_views RPCs

---

## Phase 4 — Final Review
**Date:** 2026-04-28

### Verification gate results
- `tsc --noEmit`: PASS (0 errors from admin code)
- `npm run lint`: 0 new issues from admin code (9 pre-existing warnings/errors unchanged)
- `npm run test`: 19/19 PASS
- `npm run build`: SUCCESS

### File count
- 57 files changed across all phases
- 7 migrations + 7 rollbacks
- 16 new components
- 6 new lib modules
- 5 new pages/routes
- 2 test files (19 tests)
- 1 backfill script
