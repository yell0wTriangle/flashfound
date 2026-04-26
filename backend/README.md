# FlashFound Backend

## Overview
This backend currently includes the implemented foundations and feature phases up to Phase 5. It provides:
1. Express server skeleton with versioned API base.
2. Strict environment validation.
3. Consistent API success/error contracts.
4. Supabase client scaffolding (admin + user-context).
5. Health and readiness endpoints.

Business schema, auth/profile, attendee discovery/results, organiser/admin flows, organiser event management, and private-access notifications are available.

## Requirements
1. Node.js 20+ recommended.
2. npm.

## Setup
1. Copy env template:
```bash
cp .env.example .env
```

2. Fill required values in `.env`:
```env
NODE_ENV=development
PORT=8080
FRONTEND_ORIGIN=http://127.0.0.1:5173
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ACCESS_KEY=
RATE_LIMIT_ADMIN_AUTH_WINDOW_MS=60000
RATE_LIMIT_ADMIN_AUTH_MAX=10
RATE_LIMIT_PRIVATE_ACCESS_WINDOW_MS=60000
RATE_LIMIT_PRIVATE_ACCESS_MAX=20
VERIFICATION_SESSION_TTL_MINUTES=15
VERIFICATION_FETCH_TIMEOUT_MS=10000
VERIFICATION_MAX_IMAGE_BYTES=5242880
VERIFICATION_MIN_FACE_RATIO=0.04
VERIFICATION_MIN_FACE_CONFIDENCE=0.8
```

3. Install dependencies:
```bash
npm install
```

## Run Commands
1. Development:
```bash
npm run dev
```

2. Production-style start:
```bash
npm run start
```

3. Lint:
```bash
npm run lint
```

4. Tests:
```bash
npm run test
```

## Endpoints
1. `GET /health`
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "service": "flashfound-backend"
  }
}
```

2. `GET /ready`
- On ready:
```json
{
  "ok": true,
  "data": {
    "status": "ready",
    "dependencies": {
      "supabase": "up"
    }
  }
}
```
- On not ready:
```json
{
  "ok": false,
  "error": {
    "code": "NOT_READY",
    "message": "Service dependencies are not ready",
    "requestId": "..."
  }
}
```

3. `GET /api/v1/health`
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "version": "v1"
  }
}
```

4. `POST /api/v1/profile/bootstrap` (auth required)
- Creates profile if missing, returns existing profile otherwise.

5. `GET /api/v1/profile/me` (auth required)
- Returns the authenticated user's profile.

6. `PATCH /api/v1/profile/me` (auth required)
- Updates `display_name` and/or `display_avatar_url`.

7. `PATCH /api/v1/profile/verification-selfie` (auth required)
- Updates selfie URL and completion state.

8. `GET /api/v1/profile/onboarding-status` (auth required)
- Returns one of: `new`, `needs_selfie`, `ready`.

9. `GET /api/v1/events/discovery` (auth required)
- Query params:
  - `q` (optional text search)
  - `privacy` (`all` | `public` | `private`)

10. `GET /api/v1/events/:eventId/people` (auth required)
- Returns people list with accessibility flags for the event.

11. `GET /api/v1/events/:eventId/results` (auth required)
- Query params:
  - `person_ids` (optional comma-separated user ids)

12. `POST /api/v1/my-photos` (auth required)
- Body:
```json
{
  "photo_ids": ["uuid-1", "uuid-2"]
}
```

13. `GET /api/v1/my-photos` (auth required)
- Query params:
  - `event_ids` (optional comma-separated event ids)
  - `person_ids` (optional comma-separated user ids)

14. `POST /api/v1/organiser-access/request` (auth required)
- Creates one pending organiser request for the authenticated user.

15. `POST /api/v1/admin/auth`
- Body:
```json
{
  "access_key": "your-admin-secret"
}
```
- Returns signed admin bearer token and expiry.

16. `GET /api/v1/admin/organiser-requests` (admin bearer required)
- Query params:
  - `q` (optional search by email/display_name)
  - `status` (`pending` | `approved` | `denied`)

17. `POST /api/v1/admin/organiser-requests/:id/approve` (admin bearer required)
- Marks request approved and updates profile role to `organiser`.

18. `POST /api/v1/admin/organiser-requests/:id/deny` (admin bearer required)
- Marks request denied, profile role unchanged.

19. `POST /api/v1/organiser/events` (organiser bearer required)
- Creates organiser-owned event. Draft can be partial.

20. `PATCH /api/v1/organiser/events/:eventId` (organiser bearer required)
- Updates organiser-owned event with publish validation.

21. `GET /api/v1/organiser/events` (organiser bearer required)
- Lists organiser-owned events.

22. `POST /api/v1/organiser/events/:eventId/attendees` (organiser bearer required)
- Body:
```json
{
  "emails": ["attendee1@example.com", "attendee2@example.com"]
}
```

23. `DELETE /api/v1/organiser/events/:eventId/attendees/:attendeeId` (organiser bearer required)
- Removes one attendee access row.

24. `POST /api/v1/organiser/events/:eventId/photos` (organiser bearer required)
- Body:
```json
{
  "photos": [
    {
      "storage_path": "events/e1/p1.jpg",
      "image_url": "https://..."
    }
  ]
}
```

25. `DELETE /api/v1/organiser/events/:eventId/photos` (organiser bearer required)
- Body:
```json
{
  "photo_ids": ["uuid-1", "uuid-2"]
}
```

26. `GET /api/v1/organiser/dashboard` (organiser bearer required)
- Returns totals and event cards with photo counts.

27. `POST /api/v1/private-access/requests` (auth required)
- Body:
```json
{
  "event_id": "uuid-event",
  "target_user_id": "uuid-target-user"
}
```
- Creates one pending private-access request for a private event target.

28. `POST /api/v1/private-access/requests/:id/approve` (auth required)
- Target user approves a pending request and creates a grant.

29. `POST /api/v1/private-access/requests/:id/deny` (auth required)
- Target user denies a pending request.

30. `GET /api/v1/notifications` (auth required)
- Returns notification feed including read state and private-access metadata.

31. `POST /api/v1/notifications/:id/read` (auth required)
- Marks one notification as read.

32. `POST /api/v1/notifications/read-all` (auth required)
- Marks all unread notifications for the user as read.

33. `POST /api/v1/verification/session/start` (auth required)
- Starts a selfie verification session and expires previous open sessions.

34. `GET /api/v1/verification/session/:id` (auth required)
- Returns current verification session state.

35. `POST /api/v1/verification/session/:id/submit` (auth required)
- Body:
```json
{
  "selfie_url": "https://..."
}
```
- Runs server-side face validation checks and stores attempt result.

36. `POST /api/v1/verification/session/:id/finalize` (auth required)
- Finalizes successful verification and marks profile as verified.

## API Docs and Collections (Phase 6)
1. OpenAPI spec:
- `openapi.yaml`
2. Postman:
- `postman/FlashFound.postman_collection.json`
- `postman/FlashFound.postman_environment.json`
3. Bruno:
- `bruno/`
4. Deployment checklist:
- `DEPLOYMENT_RUNBOOK.md`

## Supabase SQL Migration Workflow (Scaffold)
Migration files are kept under:
`supabase/migrations/`

Suggested command convention for future phases:
1. Create migration:
```bash
supabase migration new <name>
```
2. Apply local:
```bash
supabase db reset
```
3. Push to hosted project:
```bash
supabase db push
```

## Current Phase Note
Next implementation target is Phase 6.
