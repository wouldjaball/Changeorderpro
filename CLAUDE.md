# ChangeOrder Pro — Claude Code Instructions

## Stack
- Next.js 16 + TypeScript (strict) + Tailwind CSS + shadcn/ui
- Supabase (auth, postgres, storage)
- Vercel deployment
- pino logging, recharts, @tanstack/react-table, nuqs, papaparse

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run test:watch   # Vitest watch mode
```

## Admin Section
- Routes: `/admin/*` (protected by email allowlist in `ADMIN_ALLOWLIST` env var)
- Auth: Magic link OTP via Supabase Auth, middleware guard at root `middleware.ts`
- Materialized views: `mv_platform_stats`, `mv_company_stats` (refresh nightly via pg_cron or manually via `refresh_admin_views()` RPC)
- Backfill: `npx tsx scripts/backfill-events.ts` (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

## Key files
- `middleware.ts` — Auth + admin route protection
- `src/lib/admin/queries.ts` — All admin data queries
- `src/lib/admin/auth.ts` — Admin email allowlist check
- `src/lib/admin/types.ts` — Admin TypeScript types
- `src/lib/supabase/admin.ts` — Service role client (bypasses RLS)

## Conventions
- No comments in code
- Always run `npm run typecheck` and `npm run lint` before committing
- Supabase queries must always include explicit `.limit()` or pagination
- Admin pages use server components with parallel data loading via `Promise.all`
