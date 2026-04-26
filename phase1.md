# Phase 1 - Auth, Profiles, and Onboarding Truth
Status: `completed`

## Objective
Implement real Supabase-auth-backed identity and onboarding state so login/signup and first-time/returning routing are fully functional.

## Scope
1. Supabase Auth integration (email/password; Google optional if configured).
2. `profiles` source-of-truth table and RLS.
3. Profile bootstrap endpoint.
4. Onboarding state endpoint used by frontend route guards.
5. Profile update endpoints (display name/avatar/selfie metadata).

## Implementation
1. DB:
   - `profiles` table with role, selfie URL, verification completion fields.
   - RLS: user can read/update only own row.
2. Backend:
   - Auth middleware resolves Supabase bearer user.
   - `POST /api/v1/profile/bootstrap`
   - `GET /api/v1/profile/me`
   - `PATCH /api/v1/profile/me`
   - `PATCH /api/v1/profile/verification-selfie`
   - `GET /api/v1/profile/onboarding-status`
3. Frontend:
   - Landing -> Auth page.
   - Auth sign-in and sign-up both working (no dummy auth).
   - Route logic:
     - new user -> selfie setup.
     - returning ready user -> my photos.
     - interrupted user -> selfie setup.

## Deliverables
1. Real sign-up and sign-in flow.
2. Real onboarding status routing.
3. Profile management API and UI wiring.

## Exit Criteria
1. New user profile row auto-created on bootstrap.
2. Returning user never duplicates profile row.
3. On refresh, route guard restores correct onboarding destination.
4. Unauthorized calls return `401`.
