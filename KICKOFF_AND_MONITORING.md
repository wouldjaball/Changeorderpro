# Kickoff & Monitoring Runbook

A practical guide for kicking off the autonomous ChangeOrder Pro Admin build and keeping an eye on it without micromanaging.

---

## Pre-flight checklist (5 minutes, do this before kickoff)

Run these one-liners. Each should succeed without error.

```bash
# 1. Confirm Claude Code is recent
claude --version

# 2. Move into the project
cd "/Users/admin/Claude Code/ChangeOrderPro"
pwd  # confirm you're where you think you are

# 3. Confirm the three docs are in place
ls -la BUILD_PROMPT.md docs/admin-monitoring-prd.md KICKOFF_AND_MONITORING.md

# 4. Confirm git is clean (no uncommitted changes)
git status

# 5. Confirm env vars are present (don't print values, just check existence)
grep -c "SUPABASE_URL\|SUPABASE_ANON_KEY\|SUPABASE_SERVICE_ROLE_KEY\|ADMIN_ALLOWLIST" .env.local
# expect: 4

# 6. Confirm Node + npm are available
node --version  # 18+ ideally
npm --version

# 7. Confirm Supabase CLI is installed (for migrations)
supabase --version
```

If any of these fail, fix before kickoff. The agent can work around most things, but missing env vars or a wrong working directory wastes time.

---

## Kickoff (the 60-second version)

```bash
cd "/Users/admin/Claude Code/ChangeOrderPro"
claude
```

In the REPL:

```
Read BUILD_PROMPT.md and execute it end-to-end. Begin with Phase 0.
```

Then **Shift+Tab** to toggle auto-accept-edits mode. You'll see a small indicator at the bottom of the terminal switch to "auto-accept on" or similar.

Walk away. Come back periodically.

---

## Open a second terminal for monitoring

In a separate terminal window (don't touch the one running Claude):

```bash
cd "/Users/admin/Claude Code/ChangeOrderPro"

# Watch the work log update in real time
tail -f WORK_LOG.md
```

This is your single best monitoring view. The agent updates this as it works, so you see decisions, schema audit results, deviations, and phase completions live.

In a third terminal (optional, for git activity):

```bash
watch -n 30 'git log --oneline -20'
```

This refreshes the recent commit list every 30 seconds. You should see commits land at the end of each phase (\~4 commits total over the build).

---

## What "doing okay" looks like

### First 30 minutes — Phase 0

You should see:

- \[ \] Within 5 min: `WORK_LOG.md` created with a "Phase 0" section
- \[ \] Within 15 min: Schema audit results documented (whether or not actual schema matches PRD §7.1)
- \[ \] Within 30 min: A commit titled `chore: phase 0 setup and schema audit`
- \[ \] No new files in `/src/app/admin/` yet — Phase 0 is audit only, not coding

If after 30 minutes there's no commit and the work log shows the agent has been writing app code instead of auditing schema, **stop and steer** (see Intervention below).

### Phases 1–3 — The build

You should see:

- \[ \] One commit at the end of each phase (4 total, including Phase 0)
- \[ \] `WORK_LOG.md` growing with new phase sections
- \[ \] Migration files appearing in `/supabase/migrations/`
- \[ \] App routes appearing in `/src/app/admin/`
- \[ \] Test runs passing between phases (look for `npm run typecheck && npm run lint && npm run test` in the terminal output)
- \[ \] No commits with `--no-verify`, no `eslint-disable` without comments, no `// @ts-ignore`

### Phase 4 — Wrap-up

You should see:

- \[ \] `CLAUDE.md` appears at the project root
- \[ \] `/docs/admin/README.md` and `/docs/admin/runbook.md` appear
- \[ \] A final commit + a `v1.0.0-admin` git tag
- \[ \] A PR description block written to `WORK_LOG.md`

---

## Healthy progress signals

Glance at `WORK_LOG.md` every hour or so. Look for:

SignalWhat it meansPhase sections with timestampsAgent is following the structure"Decisions" subsections with brief rationalesAgent is documenting deviations as instructed"Schema audit results" with concrete deltasPhase 0 was real, not skippedCommit hashes recorded per phaseBuild is checkpointing properlyPerformance numbers measured in Phase 3Agent reached the polish phase

---
## Red flags — when to intervene

Stop the run (Ctrl+C in the Claude terminal) and steer if you see any of these:

| Red flag | What's wrong | What to do |
|----------|--------------|-----------|
| No `WORK_LOG.md` after 10 min | Agent skipped Phase 0 setup | Tell it: "Stop. Re-read §10 of BUILD_PROMPT.md and start over with Phase 0." |
| Coding before schema audit | Phase 0 violation | "Stop. Phase 0 is audit-only. Revert and complete the schema audit first." |
| `import { adminDb }` in a `'use client'` file | Hard rule violation | "Stop. Hard rule §9.1 violated. Move that import to a server component." |
| `any` types or `@ts-ignore` without comments | Strict mode violation | "Fix all uses of `any` and `@ts-ignore` before continuing." |
| Tests failing but agent moving to next phase | Verification gate skipped | "Stop. Phase gate requires green tests. Fix and re-run before continuing." |
| Loop: same error 3+ times | Agent is stuck | "Step out of this. What's the actual blocker? Document in WORK_LOG.md and surface to me." |
| New npm package not in stack list | Unauthorized dep | Ask the agent to justify in WORK_LOG.md or remove |
| Trying to write to customer tables | Read-only violation | "Stop. v1 is read-only on customer tables. Reverse this change." |

How to intervene cleanly:
1. **Ctrl+C** in the Claude terminal — interrupts the current action
2. Type your steering message at the prompt
3. Hit **Shift+Tab** again to re-enable auto-accept once the agent confirms it's back on track

---

## Phase gates — what to verify between phases

When you see a phase commit land in `git log`, take 2 minutes to spot-check before letting it continue.

### After Phase 0 commit
```bash
cat WORK_LOG.md  # schema audit section should be substantive
ls supabase/migrations/  # should still be empty or unchanged
git log --oneline -5  # should show "chore: phase 0..."
```

### After Phase 1 commit
```bash
ls supabase/migrations/  # 6 new migration files
ls src/app/admin/  # layout.tsx, page.tsx, login/, companies/, health/
npm run typecheck  # should pass
npm run lint       # should pass
npm run test       # should pass
```

Open a browser to `http://localhost:3000/admin/login` (after starting `npm run dev`) and confirm the login page renders.

### After Phase 2 commit
```bash
ls src/components/admin/profile/  # 7 components from PRD §9.1
npm run test  # integration tests for queries should be green
```

Visit `http://localhost:3000/admin/companies/[some-id]` and confirm the profile page renders with seeded data.

### After Phase 3 commit
```bash
ls e2e/  # Playwright test files
npx playwright test --reporter=list  # should pass
```

Visit `/admin` and confirm the trend charts and activity feed render.

### After final commit (Phase 4)
```bash
ls CLAUDE.md docs/admin/README.md docs/admin/runbook.md  # all three exist
git tag | grep v1.0.0-admin  # tag exists
cat WORK_LOG.md | head -100  # PR description block at top
```

---

## How to pause and resume

If you need to step away mid-build:

**Pause:**
- The agent will naturally pause between phases (after committing). That's the safest moment.
- Mid-phase: Ctrl+C in the Claude terminal.

**Resume:**
- Same project directory, run `claude` again
- In the REPL: `Read WORK_LOG.md and BUILD_PROMPT.md. Resume from where you left off.`
- Shift+Tab to re-enable auto-accept

The agent's memory between sessions is `WORK_LOG.md` plus the git history. As long as both are intact, resumption is clean.

---

## Estimated timeline

Based on PRD §18 estimates with a competent agent in auto-accept mode:

| Phase | Wall-clock | What happens |
|-------|-----------|--------------|
| Phase 0 | 30–60 min | Schema audit, env check, deps install |
| Phase 1 | 4–6 hours | Auth, dashboard, list, migrations |
| Phase 2 | 3–5 hours | Profile drill-down with all 7 panels |
| Phase 3 | 3–5 hours | Charts, filters, CSV, audit logging, E2E tests |
| Phase 4 | 30–60 min | CLAUDE.md, README, runbook, PR description |

**Total wall clock: ~12–18 hours of agent work.** This will likely span 2–3 calendar days when accounting for context limits, your sleep, and any intervention.

---

## What to do when it's done

When you see the `v1.0.0-admin` tag in `git log` and a PR description in `WORK_LOG.md`:

1. **Read `WORK_LOG.md` end to end.** Especially the deviations and known-issues sections.
2. **Run the test suite yourself.** `npm run typecheck && npm run lint && npm run test && npx playwright test`
3. **Spin up locally.** `npm run dev`, log in, click around. Verify each FR from PRD §5 in the browser.
4. **Provision the production subdomain.** Add `admin.changeorderpro.com` DNS record, configure on Vercel.
5. **Set production env vars** in Vercel project settings.
6. **Push the branch and open the PR** using the description from `WORK_LOG.md`.
7. **Deploy via Vercel.** Smoke test `https://admin.changeorderpro.com/admin/health`.

If something is broken or feels off, open a new Claude session in the same directory and say: "Read CLAUDE.md and WORK_LOG.md. Here's the issue: [...]." The CLAUDE.md the agent wrote in Phase 4 is now your onboarding doc for follow-up work.

---

## When in doubt

- Check `WORK_LOG.md` first
- Check `git log` second
- Don't intervene if it's making forward progress
- Do intervene if it's looping, violating hard rules, or skipping verification gates
- Boring is good — boring means it's working

*End of runbook.*
