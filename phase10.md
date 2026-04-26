# Phase 10 - Full Frontend Integration (No Design Drift)
Status: `pending`

## Objective
Connect every frontend page to real backend behavior while preserving `/dump` designs exactly.

## Scope
1. Replace all dummy states/actions with API calls.
2. Global session handling and route guards.
3. Real data wiring for attendee, organiser, and notifications flows.
4. Preserve UI visual behavior 1:1 with design components from `/dump`.

## Implementation
1. Frontend data layer:
   - auth/session provider.
   - API client with bearer injection and envelope parsing.
2. Page wiring:
   - Landing/Auth/Setup flows.
   - MyPhotos, EventDiscovery, PublicResults, PrivateResults.
   - Notifications.
   - RequestOrganiserAccess, OrganiserDashboard, CreateEvent manage/create modes.
   - ProfileAndSettings edits and signout.
3. Navigation correctness:
   - origin-aware back behavior for results pages.
   - admin route not linked in UI.

## Deliverables
1. Fully functional frontend using backend APIs only.
2. Design-faithful pages (no visual redesigns).
3. Real user journey from signup to organiser/admin workflows.

## Exit Criteria
1. No dummy/mock data powers user-facing pages.
2. All core buttons execute real backend actions.
3. UI matches `/dump` layouts and interaction patterns.
