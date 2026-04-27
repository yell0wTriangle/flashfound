import { env } from "../config/env.js";
import { createPhotoMatchingRepository } from "../repositories/photoMatchingRepository.js";
import { analyzeFacesFromUrl, euclideanDistance } from "./faceAnalysis.js";
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
  let candidateCount = 0;
  for (const candidate of candidates) {
    const distance = euclideanDistance(embedding, candidate.embedding);
    if (!Number.isFinite(distance)) continue;
    candidateCount += 1;
    const confidence = Number(Math.max(0, 1 - distance).toFixed(6));
    if (!best || distance < best.distance) {
      secondBest = best;
      best = { userId: candidate.user_id, distance, confidence };
    } else if (!secondBest || distance < secondBest.distance) {
      secondBest = { userId: candidate.user_id, distance, confidence };
    }
  }
  if (!best) {
    return null;
  }
  return {
    ...best,
    margin: (secondBest?.distance ?? 1) - best.distance,
    candidateCount,
  };
}

function passesMatchGate(best) {
  if (!best) return false;
  const maxDistance =
    best.candidateCount <= 1
      ? Math.min(env.FACE_MATCH_MAX_DISTANCE, env.FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE)
      : env.FACE_MATCH_MAX_DISTANCE;
  return best.distance <= maxDistance && best.margin >= env.FACE_MATCH_MIN_DISTANCE_MARGIN;
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

async function getCandidatesForEvent(repository, eventId) {
  const attendeeRows = await repository.getAttendeesByEventId(eventId);
  const attendeeUserIds = unique(attendeeRows.map((row) => row.user_id).filter(Boolean));
  const attendeeEmails = unique(attendeeRows.map((row) => normalizeEmail(row.email)).filter(Boolean));
  const [profilesById, profilesByEmail] = await Promise.all([
    repository.getProfilesByIds(attendeeUserIds),
    repository.getProfilesByEmails(attendeeEmails),
  ]);
  return mapCandidates(mergeProfilesById(profilesById, profilesByEmail));
}

function matchFacesToCandidates({ photoId, faces, candidates }) {
  const matchedRows = [];
  let matchedFacesCount = 0;

  for (const face of faces) {
    if (!candidates.length) break;
    const embedding = normalizeEmbedding(face.embedding);
    if (!embedding) continue;

    const best = findBestMatch({ embedding, candidates });
    if (!passesMatchGate(best)) continue;
    matchedFacesCount += 1;

    const existing = matchedRows.find((row) => row.person_user_id === best.userId);
    if (!existing || Number(existing.confidence) < best.confidence) {
      if (existing) {
        existing.confidence = best.confidence;
      } else {
        matchedRows.push({
          photo_id: photoId,
          person_user_id: best.userId,
          confidence: best.confidence,
        });
      }
    }
  }

  return { matchedRows, matchedFacesCount };
}

function matchFacesToTargetUser({ photoId, faces, candidates, userId }) {
  const matchedRows = [];
  let targetMatchedFacesCount = 0;
  let allCandidatesMatchedFacesCount = 0;

  for (const face of faces) {
    if (!candidates.length) break;
    const embedding = normalizeEmbedding(face.embedding);
    if (!embedding) continue;

    const best = findBestMatch({ embedding, candidates });
    if (!passesMatchGate(best)) continue;
    allCandidatesMatchedFacesCount += 1;
    if (best.userId !== userId) continue;
    targetMatchedFacesCount += 1;

    const existing = matchedRows.find((row) => row.person_user_id === best.userId);
    if (!existing || Number(existing.confidence) < best.confidence) {
      if (existing) {
        existing.confidence = best.confidence;
      } else {
        matchedRows.push({
          photo_id: photoId,
          person_user_id: best.userId,
          confidence: best.confidence,
        });
      }
    }
  }

  return { matchedRows, targetMatchedFacesCount, allCandidatesMatchedFacesCount };
}

async function persistPhotoMatches({ repository, photo, faces }) {
  await repository.deletePhotoPeopleByPhotoId(photo.id);

  const candidates = await getCandidatesForEvent(repository, photo.event_id);
  const { matchedRows, matchedFacesCount } = matchFacesToCandidates({
    photoId: photo.id,
    faces,
    candidates,
  });

  if (matchedRows.length) {
    await repository.upsertPhotoPeople(matchedRows);
  }

  const hasUnmatchedFaces = faces.length > matchedFacesCount;

  await repository.updatePhotoProcessing(photo.id, {
    face_processing_status: "processed",
    face_processing_error: hasUnmatchedFaces ? UNMATCHED_FACES_ERROR_CODE : null,
    face_processed_at: new Date().toISOString(),
  });

  return {
    photo_id: photo.id,
    status: "processed",
    faces_indexed: faces.length,
    matches: matchedRows.length,
    blocked_for_privacy: hasUnmatchedFaces,
    unmatched_faces: Math.max(0, faces.length - matchedFacesCount),
  };
}

async function rematchPhotoForUserFromStoredIndex({ repository, photo, userId }) {
  const storedFaces = await repository.getPhotoFacesByPhotoIds([photo.id]);
  if (!storedFaces.length) {
    return null;
  }

  const faces = storedFaces
    .map((face) => ({
      face_index: face.face_index,
      embedding: normalizeEmbedding(face.embedding),
    }))
    .filter((face) => Array.isArray(face.embedding));

  if (!faces.length) {
    return null;
  }

  const candidates = await getCandidatesForEvent(repository, photo.event_id);
  const { matchedRows, targetMatchedFacesCount, allCandidatesMatchedFacesCount } =
    matchFacesToTargetUser({
      photoId: photo.id,
      faces,
      candidates,
      userId,
    });

  await repository.deletePhotoPeopleForUserByPhotoIds({
    userId,
    photoIds: [photo.id],
  });
  if (matchedRows.length) {
    await repository.upsertPhotoPeople(matchedRows);
  }

  const hasUnmatchedFaces = faces.length > allCandidatesMatchedFacesCount;
  await repository.updatePhotoProcessing(photo.id, {
    face_processing_status: "processed",
    face_processing_error: hasUnmatchedFaces ? UNMATCHED_FACES_ERROR_CODE : null,
    face_processed_at: new Date().toISOString(),
  });

  return {
    photo_id: photo.id,
    status: "processed",
    faces_indexed: faces.length,
    matches: matchedRows.length,
    blocked_for_privacy: hasUnmatchedFaces,
    unmatched_faces: Math.max(0, faces.length - allCandidatesMatchedFacesCount),
    target_matched_faces: targetMatchedFacesCount,
  };
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

        return persistPhotoMatches({ repository, photo, faces: filteredFaces });
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

      const results = [];
      for (const photo of photos) {
        const indexedResult = await rematchPhotoForUserFromStoredIndex({
          repository,
          photo,
          userId,
        });
        results.push(indexedResult || (await this.processPhotoById(photo.id)));
      }
      const matchedPhotos = results.filter((result) => Number(result.matches || 0) > 0).length;

      return {
        rematched_photos: results.length,
        matched_photos: matchedPhotos,
      };
    },
  };
}
