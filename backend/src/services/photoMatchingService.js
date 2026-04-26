import { env } from "../config/env.js";
import { createPhotoMatchingRepository } from "../repositories/photoMatchingRepository.js";
import { analyzeFacesFromUrl, cosineSimilarity } from "./faceAnalysis.js";
import { logger } from "../utils/logger.js";

const UNMATCHED_FACES_ERROR_CODE = "UNMATCHED_EVENT_ATTENDEE_FACES";

function normalizeEmbedding(embedding) {
  if (!Array.isArray(embedding)) return null;
  const values = embedding.map((value) => Number(value));
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return values;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeEmail(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

function findBestMatch({ embedding, candidates }) {
  let best = null;
  let secondBest = null;
  for (const candidate of candidates) {
    const similarity = cosineSimilarity(embedding, candidate.embedding);
    if (!best || similarity > best.similarity) {
      secondBest = best;
      best = { userId: candidate.user_id, similarity };
    } else if (!secondBest || similarity > secondBest.similarity) {
      secondBest = { userId: candidate.user_id, similarity };
    }
  }
  if (!best) {
    return null;
  }
  return {
    ...best,
    margin: best.similarity - (secondBest?.similarity ?? 0),
  };
}

function mapFaceRows(photoId, faces) {
  const processedAt = new Date().toISOString();
  return faces.map((face) => ({
    photo_id: photoId,
    face_index: face.face_index,
    face_box: {
      x1: face.box.x1,
      y1: face.box.y1,
      x2: face.box.x2,
      y2: face.box.y2,
    },
    keypoints: face.keypoints || [],
    embedding: face.embedding,
    confidence: face.confidence,
    status: "processed",
    failure_code: null,
    processed_at: processedAt,
  }));
}

function mapCandidates(profiles) {
  return profiles
    .filter((profile) => profile.face_verification_completed)
    .map((profile) => ({
      user_id: profile.id,
      embedding: normalizeEmbedding(profile.verification_face_embedding),
    }))
    .filter((profile) => Array.isArray(profile.embedding));
}

function mergeProfilesById(...profileLists) {
  const byId = new Map();
  for (const profiles of profileLists) {
    for (const profile of profiles || []) {
      if (!profile?.id) continue;
      if (!byId.has(profile.id)) {
        byId.set(profile.id, profile);
      }
    }
  }
  return [...byId.values()];
}

export function createPhotoMatchingService(repository = createPhotoMatchingRepository()) {
  return {
    async processPhotoById(photoId) {
      const photo = await repository.getPhotoById(photoId);
      if (!photo) {
        return { photo_id: photoId, status: "missing" };
      }

      await repository.updatePhotoProcessing(photoId, {
        face_processing_status: "pending",
        face_processing_error: null,
      });

      try {
        let imageUrl = photo.image_url;
        if (!imageUrl) {
          imageUrl = await repository.createSignedPhotoUrl(photo.storage_path, 60 * 30);
        }

        if (!imageUrl) {
          throw Object.assign(new Error("Could not resolve photo URL"), {
            code: "PHOTO_URL_UNAVAILABLE",
          });
        }

        const analyzed = await analyzeFacesFromUrl({
          imageUrl,
          timeoutMs: env.FACE_INDEX_FETCH_TIMEOUT_MS,
          maxBytes: env.FACE_INDEX_MAX_IMAGE_BYTES,
          userAgent: "FlashFound-PhotoIndex/1.0",
        });

        const filteredFaces = analyzed.faces.filter((face) => {
          const width = Math.max(0, face.box.x2 - face.box.x1);
          const height = Math.max(0, face.box.y2 - face.box.y1);
          const ratio = (width * height) / (analyzed.width * analyzed.height);
          return ratio >= env.FACE_INDEX_MIN_FACE_RATIO;
        });

        await repository.deletePhotoFacesByPhotoId(photoId);
        await repository.deletePhotoPeopleByPhotoId(photoId);

        const faceRows = mapFaceRows(photoId, filteredFaces);
        if (faceRows.length) {
          await repository.insertPhotoFaces(faceRows);
        }

        const attendeeRows = await repository.getAttendeesByEventId(photo.event_id);
        const attendeeUserIds = unique(attendeeRows.map((row) => row.user_id).filter(Boolean));
        const attendeeEmails = unique(attendeeRows.map((row) => normalizeEmail(row.email)).filter(Boolean));
        const [profilesById, profilesByEmail] = await Promise.all([
          repository.getProfilesByIds(attendeeUserIds),
          repository.getProfilesByEmails(attendeeEmails),
        ]);
        const candidates = mapCandidates(mergeProfilesById(profilesById, profilesByEmail));

        const matchedRows = [];
        let matchedFacesCount = 0;
        for (const face of filteredFaces) {
          if (!candidates.length) break;
          const best = findBestMatch({ embedding: face.embedding, candidates });
          if (!best) continue;
          if (best.similarity < env.FACE_MATCH_THRESHOLD) continue;
          if (best.margin < env.FACE_MATCH_MIN_MARGIN) continue;
          matchedFacesCount += 1;

          const existing = matchedRows.find((row) => row.person_user_id === best.userId);
          if (!existing || Number(existing.confidence) < best.similarity) {
            if (existing) {
              existing.confidence = best.similarity;
            } else {
              matchedRows.push({
                photo_id: photoId,
                person_user_id: best.userId,
                confidence: best.similarity,
              });
            }
          }
        }

        if (matchedRows.length) {
          await repository.upsertPhotoPeople(matchedRows);
        }

        const hasUnmatchedFaces = filteredFaces.length > matchedFacesCount;

        await repository.updatePhotoProcessing(photoId, {
          face_processing_status: "processed",
          face_processing_error: hasUnmatchedFaces ? UNMATCHED_FACES_ERROR_CODE : null,
          face_processed_at: new Date().toISOString(),
        });

        return {
          photo_id: photoId,
          status: "processed",
          faces_indexed: filteredFaces.length,
          matches: matchedRows.length,
          blocked_for_privacy: hasUnmatchedFaces,
          unmatched_faces: Math.max(0, filteredFaces.length - matchedFacesCount),
        };
      } catch (error) {
        const failureCode = error?.code || "FACE_INDEX_FAILED";
        await repository.updatePhotoProcessing(photoId, {
          face_processing_status: "failed",
          face_processing_error: failureCode,
          face_processed_at: null,
        });
        logger.warn(
          {
            photoId,
            code: failureCode,
            err: error instanceof Error ? error.message : String(error),
          },
          "Photo face indexing failed",
        );
        return {
          photo_id: photoId,
          status: "failed",
          error_code: failureCode,
        };
      }
    },

    async processPhotosByIds(photoIds) {
      const results = [];
      for (const photoId of unique(photoIds)) {
        results.push(await this.processPhotoById(photoId));
      }
      return results;
    },

    async reprocessEventPhotos({ eventId, photoIds }) {
      const photos = photoIds?.length
        ? await repository.getPhotosByIds(photoIds)
        : await repository.getPhotosByEventIds([eventId]);
      const validPhotos = photos.filter((photo) => photo.event_id === eventId);
      return this.processPhotosByIds(validPhotos.map((photo) => photo.id));
    },

    async rematchUserAcrossAccessiblePhotos({ userId, email }) {
      const profile = await repository.getProfileById(userId);
      const eventIds = unique(
        await repository.getAccessibleEventIdsForUser({
          userId,
          email: email || profile?.email || "",
        }),
      );
      const photos = await repository.getPhotosByEventIds(eventIds);
      const photoIds = photos.map((photo) => photo.id);
      if (!photoIds.length) {
        return { rematched_photos: 0, matched_photos: 0 };
      }

      const results = await this.processPhotosByIds(photoIds);
      const matchedPhotos = results.filter((result) => Number(result.matches || 0) > 0).length;

      return {
        rematched_photos: results.length,
        matched_photos: matchedPhotos,
      };
    },
  };
}
