# Phase 9 - Face Matching, Auto-Tagging, and Reindexing
Status: `pending`

## Objective
Build the core “FlashFound” intelligence: match user source selfie embeddings against indexed photo faces and populate people tags automatically.

## Scope
1. Matching engine with configurable threshold.
2. Populate and maintain `photo_people` from match results.
3. Reindex when user updates verification selfie.
4. Recompute visibility in My Photos / Event Results after rematch.

## Implementation
1. Matching workflow:
   - compare user selfie embedding with `photo_faces` embeddings.
   - accept matches above threshold.
   - write/update `photo_people` with confidence.
2. Reindex operations:
   - user selfie changed -> purge old matches for that user -> rematch all accessible event photos.
   - photo deleted -> cascade cleanup of face/match rows.
3. APIs:
   - internal/admin reindex triggers.
   - optional user-visible match status endpoint.

## Deliverables
1. Automatic people tagging from real face matching.
2. Confidence-backed `photo_people` data usable by all filtering APIs.
3. Selfie update rematch behavior.

## Exit Criteria
1. Newly uploaded photos auto-tag recognized users.
2. My Photos and results filters work from auto tags only.
3. Updating verification selfie updates match outcomes.
