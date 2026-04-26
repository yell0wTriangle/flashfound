# Phase 3 - Organiser Event Management (Details, Attendees, Photos)
Status: `completed`

## Objective
Implement full organiser-side event creation and management with draft/publish rules and real persistence.

## Scope
1. Create/update/list organiser-owned events.
2. Draft vs publish validation behavior.
3. Add/remove attendee emails.
4. Add/delete photo metadata records.
5. Organiser dashboard aggregates.

## Implementation
1. DB:
   - `events`, `event_attendees`, `event_photos`.
   - ownership indexes and foreign keys.
2. Backend:
   - `POST /api/v1/organiser/events`
   - `PATCH /api/v1/organiser/events/:eventId`
   - `GET /api/v1/organiser/events`
   - `POST /api/v1/organiser/events/:eventId/attendees`
   - `DELETE /api/v1/organiser/events/:eventId/attendees/:attendeeId`
   - `POST /api/v1/organiser/events/:eventId/photos`
   - `DELETE /api/v1/organiser/events/:eventId/photos`
   - `GET /api/v1/organiser/dashboard`
3. Frontend:
   - CreateEvent tabs (Details, Attendees, Photos) wired to real API.
   - Manage event mode preloads data and title is “Manage Event”.
   - Back navigation behavior fixed.

## Deliverables
1. End-to-end organiser event management.
2. Ownership enforcement on every organiser action.
3. Dashboard metrics and event cards from live data.

## Exit Criteria
1. Non-organisers blocked from organiser endpoints.
2. Draft accepts partial data; publish requires mandatory fields.
3. Attendee add/remove changes event access.
4. Photo metadata add/delete works and reflects in dashboard counts.
