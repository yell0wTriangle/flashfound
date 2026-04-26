# Phase 6 - Storage Uploads, Access URLs, and Organiser Photo Listing
Status: `completed`

## Objective
Replace metadata-only photo handling with real Supabase Storage upload/access flows and complete organiser photo retrieval APIs.

## Scope
1. Signed upload intent + finalize flow.
2. Access URL strategy for private/public events.
3. Organiser photo list endpoint.
4. Storage validation and ownership checks.

## Implementation
1. Backend:
   - `POST /api/v1/organiser/events/:eventId/photos/upload-intent`
   - `POST /api/v1/organiser/events/:eventId/photos/finalize`
   - `GET /api/v1/organiser/events/:eventId/photos`
   - `POST /api/v1/photos/:photoId/access-url`
2. Storage strategy:
   - persist `storage_path` always.
   - generate signed URLs for private access.
   - public URL policy only where explicitly allowed.
3. Frontend:
   - CreateEvent Photos tab does real uploads and deletion.
   - organiser/manage view lists existing photos from API.

## Deliverables
1. End-to-end upload->finalize->render flow.
2. Secure signed URL access path.
3. Organiser photo listing complete.

## Exit Criteria
1. Organiser can upload batch/single photos from UI.
2. Uploaded photos persist and show across organiser and attendee views.
3. Non-owners cannot upload/finalize/list other organiser event photos.
4. No SQL manual photo insertion needed anymore.
