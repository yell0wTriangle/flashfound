# Phase 8 - Event Photo Face Detection and Embedding Indexing
Status: `pending`

## Objective
Automatically process uploaded event photos to detect faces and build searchable embeddings for matching.

## Scope
1. Face detection on uploaded event photos.
2. Embedding extraction for each detected face.
3. Persist per-face vectors and metadata.
4. Reprocessing hooks when photos are replaced/deleted.

## Implementation
1. DB:
   - `photo_faces` (photo_id, face_box, embedding, confidence, processed_at).
2. Backend:
   - async-safe processing flow (simple in-process queue acceptable for 2-user demo).
   - photo finalize triggers face extraction job.
   - reprocess endpoint for failed/unprocessed photos.
3. Reliability:
   - processing status fields (`pending`, `processed`, `failed`).
   - retry and error logging.

## Deliverables
1. Event photos are auto-processed after upload.
2. Embedding records exist for each detected face.
3. Operator/admin can re-trigger failed processing.

## Exit Criteria
1. No manual SQL tagging needed for new photos.
2. Processed/failed status visible via API.
3. Face index is ready for matching in Phase 9.
