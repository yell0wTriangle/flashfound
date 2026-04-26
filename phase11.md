# Phase 11 - Production Hardening, E2E Validation, and Deployment
Status: `pending`

## Objective
Ship FlashFound as a fully working deployed app (frontend + backend + Supabase) with verified end-to-end flows.

## Scope
1. Security hardening (validation, rate limits, RBAC/RLS verification).
2. API documentation and collections.
3. End-to-end tests against real Supabase project.
4. Railway backend deployment + Vercel frontend deployment.
5. Smoke tests and demo signoff checklist.

## Implementation
1. Security/docs:
   - finalize OpenAPI.
   - Postman/Bruno collections.
   - verify RLS and role access boundaries.
2. E2E matrix (real two-user scenario):
   - organiser + attendee journeys.
   - private access request/approve.
   - auto-tagged photos discoverable and addable to My Photos.
3. Deployment:
   - backend on Railway with env/CORS.
   - frontend on Vercel with Supabase public vars + API URL.
   - production health/readiness checks.

## Deliverables
1. Deployed, accessible FlashFound app.
2. End-to-end runbook with exact commands and expected outputs.
3. Final known-issues list (if any) and post-launch backlog.

## Exit Criteria
1. Full app works without manual DB edits.
2. Face verification and auto-tagging work in live flow.
3. All core routes/features pass production smoke tests.
4. Product is demo-ready for organiser + attendee usage.
