# Daily email reminder

Evening e-mail that opens today’s trip day in the app. No auto-publish.

## Behaviour

- **Today** = calendar date in `Europe/Amsterdam`.
- Finds an active trip (`starts_on ≤ today ≤ ends_on`, status not `idea` / `completed` / `archived`) and that day’s `trip_days` row.
- **Skips** when the day entry is already `published`, or the draft body is ≥ 200 characters.
- Recipients: **trip owners only** (`trip_members.role = 'owner'`), falling back to `trips.created_by` when no owner membership exists. Editors/other Auth users (e.g. Michel) do not get reminder mail. Opt-outs in `reminder_preferences` still apply. Optional allowlist: `REMINDER_EMAIL_ALLOWLIST` (comma-separated) further restricts.
- CTA links: `/app/today` and `/app/journal/[dayId]`.
- Idempotent via `reminder_sends` (one mail per user / trip day / date).
- Opt-out UI: **Meer → Herinneringen**.

## Cron

- Route: `GET|POST /api/cron/daily-reminder`
- Auth: `Authorization: Bearer $CRON_SECRET` (also `x-cron-secret` or `?secret=`).
- Schedule in `vercel.json`: `0 18 * * *` → **18:00 UTC** ≈ 19:00 CET / 20:00 CEST.
- Query flags: `dryRun=1` (no send), `force=1` (ignore solid/published + resend log).

## Secrets Henk must configure (Vercel Production + Preview if desired)

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRON_SECRET` | **yes** | Protects the cron route; Vercel Cron sends it as Bearer |
| `RESEND_API_KEY` | **yes** to actually send | [Resend](https://resend.com) API key |
| `EMAIL_FROM` | recommended | Verified sender, e.g. `Op reis <noreply@jouwdomein.nl>` |
| `APP_BASE_URL` | recommended | Canonical app URL for links (falls back to `https://opreis.blindenbach.nl`) |
| `REMINDER_EMAIL_ALLOWLIST` | optional | Extra filter on top of owner-only (e.g. testing) |

Already present: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` (cron uses the service role).

### Resend / DNS

1. Create a Resend account and API key → `RESEND_API_KEY`.
2. Add and verify the sending domain (SPF + DKIM in DNS).
3. Set `EMAIL_FROM` to an address on that domain (avoid long-term use of `onboarding@resend.dev` in production).

### Vercel Cron

After deploy with `vercel.json`, confirm the cron job appears under the project’s **Cron Jobs**. Hobby plans allow daily crons; `CRON_SECRET` must be set so Vercel can authorize the request.

Manual test (replace secret; do not commit):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://opreis.blindenbach.nl/api/cron/daily-reminder?dryRun=1"
```

## Out of scope

Web push, in-app-only toasts, Prodigi, Excel import, per-user time-zone picker (fixed Amsterdam).
