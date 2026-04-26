# Phase 7 - Real Selfie Verification Pipeline
Status: `in_progress`

## Objective
Implement actual source-of-truth selfie verification (not just status flags) so onboarding completion is backed by real face validation.

## Scope
1. Verification session lifecycle.
2. Selfie face detection and quality checks.
3. Liveness/basic anti-spoof checks suitable for demo-level trust.
4. Verification result persistence and audit trail.
5. Onboarding enforcement uses verification result, not client signal.

## Implementation
1. DB:
   - `face_verification_sessions`
   - `face_verification_attempts`
2. Backend:
   - `POST /api/v1/verification/session/start`
   - `POST /api/v1/verification/session/:id/submit`
   - `POST /api/v1/verification/session/:id/finalize`
   - update `profiles.face_verification_completed` only on successful finalize.
3. Face processing:
   - run detector/embedding extraction from submitted selfie.
   - reject invalid/low-quality/no-face/multi-face captures.
4. Frontend:
   - AccountSetupStep2 integrates camera flow + submit.
   - success routes to My Photos, failed states are actionable.

## Deliverables
1. Real verification endpoint chain with pass/fail reasons.
2. Verified source selfie embedding stored for matching phases.
3. Reliable interrupted-session resume support.

## Exit Criteria
1. User cannot reach protected app flows without successful verification.
2. Verification failures provide clear API error codes.
3. Refresh/resume does not lose verification progress incorrectly.
