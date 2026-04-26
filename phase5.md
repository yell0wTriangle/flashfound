# Phase 5 - Private Access Requests and Notifications
Status: `completed`

## Objective
Implement full private-event access request lifecycle and notification handling for both requester and target users.

## Scope
1. Create private access requests per event/requester/target.
2. Approve/deny flows.
3. Notification feed and read actions.
4. Grant-aware private results filtering.
5. Added-to-event notifications from attendee additions.

## Implementation
1. DB:
   - `private_access_requests`, `private_access_grants`.
   - `notifications` extended metadata.
2. Backend:
   - `POST /api/v1/private-access/requests`
   - `POST /api/v1/private-access/requests/:id/approve`
   - `POST /api/v1/private-access/requests/:id/deny`
   - `GET /api/v1/notifications`
   - `POST /api/v1/notifications/:id/read`
   - `POST /api/v1/notifications/read-all`
   - attendee-add flow emits `added_to_event` notification.
3. Frontend:
   - Notifications page (approve/deny/view/mark-all-read).
   - PrivateResults locks/greys out inaccessible people and updates after approvals.

## Deliverables
1. Real request/grant state machine.
2. Notification-driven private access workflow.
3. Event privacy behavior visible in UI without manual DB edits.

## Exit Criteria
1. Requests appear in target user notifications.
2. Approvals unlock target user photos for requester.
3. Denials keep access blocked.
4. Notification read actions work independently of approve/deny.
