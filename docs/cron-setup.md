# Cron Jobs — Vercel Cron Setup

## Overview

ChangeOrder Pro uses Vercel Cron Jobs for automated reminders and escalation. No external services needed.

## How It Works

Vercel calls `GET /api/cron/reminders` every hour. The endpoint:

1. Fetches all COs with `status = "sent"`
2. For each CO, checks hours since `sent_at` against the company's `reminder_hours` setting (default: 24h)
3. **First reminder**: Sent after `reminder_hours` have passed
4. **Second reminder**: Sent `reminder_hours` after the first
5. **Escalation**: After 48h+ with 2 reminders sent, emails all admin/PM team members
6. All reminders are logged in `notifications_log` and `approval_events`

## Configuration

### vercel.json

Already configured in the project root:

```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 * * * *"
  }]
}
```

### Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `CRON_SECRET` | Vercel env vars | Vercel auto-sends this as `Authorization: Bearer <CRON_SECRET>` |
| `NEXT_PUBLIC_APP_URL` | Vercel env vars | Used to build approval links in reminders |

Set `CRON_SECRET` in Vercel Dashboard → Project → Settings → Environment Variables. Vercel automatically includes it in the auth header when calling cron endpoints.

## Response Format

```json
{
  "success": true,
  "processed": 5,
  "reminders": 2,
  "escalations": 1,
  "errors": []
}
```

## Monitoring

Check cron execution in Vercel Dashboard → Project → Cron Jobs. Each run shows status, duration, and response.

## Plan Limits

- **Hobby**: 1 cron job (we only need 1)
- **Pro**: Unlimited cron jobs

## Alternative: n8n Cloud

If you need complex multi-step workflows beyond reminders (e.g., Slack alerts, CRM sync, conditional routing), you can set up n8n Cloud to call the same endpoint:

1. Create an n8n Cloud account
2. Add a Schedule Trigger (every 1 hour)
3. Add an HTTP Request node: `GET https://your-app.vercel.app/api/cron/reminders` with `Authorization: Bearer YOUR_CRON_SECRET` header
