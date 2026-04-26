# Phase 2 - Roles, Admin Access, and Organiser Approval Lifecycle
Status: `completed`

## Objective
Ship complete attendee->organiser promotion flow with secure admin approval and auditable role transitions.

## Scope
1. Organiser request endpoint for attendees.
2. Admin key auth endpoint (server-side secret only).
3. Admin request list/search/approve/deny.
4. Role mutation and audit logging.
5. Frontend organiser access gating logic.

## Implementation
1. DB:
   - `organiser_requests` (pending/approved/denied).
   - `admin_audit_logs`.
2. Backend:
   - `POST /api/v1/organiser-access/request`
   - `POST /api/v1/admin/auth`
   - `GET /api/v1/admin/organiser-requests`
   - `POST /api/v1/admin/organiser-requests/:id/approve`
   - `POST /api/v1/admin/organiser-requests/:id/deny`
   - admin token verification middleware.
3. Frontend:
   - navbar organiser click:
     - attendee -> request organiser access page.
     - organiser -> organiser dashboard.
   - `/admin` hidden from UI; manual URL only.

## Deliverables
1. Fully working organiser request and admin approval flow.
2. Role reflected immediately in backend and frontend routing.
3. Audit entries for every approve/deny.

## Exit Criteria
1. Duplicate pending requests blocked.
2. Already-organiser users cannot request again.
3. Admin endpoints reject non-admin requests.
4. Approved user can access organiser routes instantly.
