# FlashFound Backend Deployment Runbook (Railway)

## 1) Required Environment Variables
Set these in Railway service variables:

1. `NODE_ENV=production`
2. `PORT=8080` (Railway can override; app reads env `PORT`)
3. `FRONTEND_ORIGIN=https://<your-vercel-domain>`
4. `SUPABASE_URL=https://<project-ref>.supabase.co`
5. `SUPABASE_ANON_KEY=<supabase-anon-key>`
6. `SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>`
7. `ADMIN_ACCESS_KEY=<strong-random-secret>`
8. `RATE_LIMIT_ADMIN_AUTH_WINDOW_MS=60000`
9. `RATE_LIMIT_ADMIN_AUTH_MAX=10`
10. `RATE_LIMIT_PRIVATE_ACCESS_WINDOW_MS=60000`
11. `RATE_LIMIT_PRIVATE_ACCESS_MAX=20`

## 2) Build/Start Configuration
1. Root directory: `backend`
2. Install: `npm install`
3. Start command: `npm run start`

## 3) CORS and Supabase Settings
1. Railway backend `FRONTEND_ORIGIN` must match deployed Vercel app domain exactly.
2. In Supabase:
   - Add frontend origin to Auth redirect/allowed URLs as needed.
   - Keep service role key server-side only (never in frontend).

## 4) Database Migration Steps
Run phase SQL migrations in order against hosted Supabase project:

1. `2026042601_phase1_auth_profile_core.sql`
2. `2026042602_phase1_api_role_grants.sql`
3. `2026042603_phase2_attendee_core.sql`
4. `2026042604_phase3_admin_organiser_access.sql`
5. `2026042605_phase4_organiser_events.sql`
6. `2026042606_phase5_private_access_notifications.sql`

## 5) Smoke Tests After Deploy
Use deployed backend URL (`$API_BASE`):

```bash
curl -s "$API_BASE/health"
curl -s "$API_BASE/ready"
curl -s "$API_BASE/api/v1/health"
```

Expected: all return `ok: true` envelopes (`/ready` only if Supabase reachable).

## 6) Security Checklist
1. `ADMIN_ACCESS_KEY` is strong and not shared in frontend code.
2. Admin auth and private-access request routes are rate-limited.
3. Structured validation errors return `VALIDATION_ERROR` on bad input.
4. JWT bearer tokens are used for all authenticated routes.
5. Event photo URL contract:
   - `url_strategy: public` when `image_url` exists.
   - `url_strategy: signed_required` when only `storage_path` exists.
