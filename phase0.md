# Phase 0 - Product Lock, Architecture, and Repo Baseline
Status: `completed`

## Objective
Lock final product behavior and establish a production-shaped monorepo baseline so every later phase ships real functionality, not demo placeholders.

## Scope
1. Freeze `FLASHFOUND_SPEC.md` as source of truth for functional behavior.
2. Set monorepo structure with `frontend/` and `backend/`.
3. Standardize API response/error envelopes and route versioning.
4. Set development standards (lint, tests, env validation, scripts).
5. Prepare Supabase project configuration checklist.

## Implementation
1. Backend baseline:
   - Express JS ESM app.
   - `GET /health`, `GET /ready`, `GET /api/v1/health`.
   - structured request ids + logging + global error handling.
2. Frontend baseline:
   - Vite React + Tailwind v4.
   - Router skeleton matching final app paths.
   - no business logic yet, but route map fixed.
3. Environment contracts:
   - backend `.env.example` with all required variables.
   - frontend `.env.example` with API/Supabase public vars.
4. Database setup checklist:
   - Supabase project creation.
   - Data API enabled.
   - RLS strategy documented (enabled for all app tables).

## Deliverables
1. Running frontend and backend apps.
2. Boot-time env validation.
3. Finalized route map and API base path.
4. Updated phase plan docs (`phase0.md` to `phase11.md`).

## Exit Criteria
1. `npm run dev` works in both `frontend/` and `backend/`.
2. Backend health endpoints pass.
3. Spec and route map are locked and shared across FE/BE.
4. No unresolved architecture decisions block Phase 1.
