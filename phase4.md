# Phase 4 - Attendee Discovery, Results, and My Photos
Status: `completed`

## Objective
Ship complete attendee-side core usage: discover events, view results, filter by people, and save to My Photos.

## Scope
1. Discovery list with privacy and text filters.
2. Event results APIs for public/private events.
3. Event people list APIs with accessibility flags.
4. Save-to-My-Photos and filtered My Photos listing.
5. Frontend integration for these pages with real responses.

## Implementation
1. DB:
   - `photo_people`, `my_photos`.
2. Backend:
   - `GET /api/v1/events/discovery`
   - `GET /api/v1/events/:eventId/people`
   - `GET /api/v1/events/:eventId/results`
   - `POST /api/v1/my-photos`
   - `GET /api/v1/my-photos`
3. Frontend:
   - EventDiscovery search + all/public/private filters.
   - PublicResults and PrivateResults selection/add-to-my-photos behavior.
   - MyPhotos event/people filtering, select mode, select-all behavior.
   - Back button logic from results supports both `/events` and `/notifications` origins.

## Deliverables
1. Fully working attendee photo discovery and personal gallery flow.
2. Idempotent My Photos add behavior.
3. UX-consistent filters across discovery/results/my-photos.

## Exit Criteria
1. Discovery returns only accessible events.
2. Filtering by people/events behaves correctly.
3. My Photos reflects selected additions in real time.
4. No dummy data remains in attendee pages.
