import { ApiError } from "../utils/apiError.js";
import { parseCsvIds, unique } from "../utils/filters.js";
import { createMyPhotosRepository } from "../repositories/myPhotosRepository.js";
import { createEventsRepository } from "../repositories/eventsRepository.js";
import { toPhotoResponse } from "../utils/storage.js";

function indexBy(items, key) {
  const map = new Map();
  items.forEach((item) => map.set(item[key], item));
  return map;
}

function isPhotoVisibleToAttendees(photo) {
  if (!photo) return false;
  if (!Object.prototype.hasOwnProperty.call(photo, "face_processing_status")) {
    return true;
  }
  if (photo.face_processing_status == null) {
    return true;
  }
  return photo.face_processing_status === "processed" && !photo.face_processing_error;
}

async function resolvePhotoUrl(repository, photo) {
  if (photo.image_url) {
    return photo.image_url;
  }
  if (!repository?.createSignedPhotoUrl) {
    return null;
  }
  try {
    return await repository.createSignedPhotoUrl(photo.storage_path, 60 * 30);
  } catch {
    return null;
  }
}

export function createMyPhotosService({
  myPhotosRepository = createMyPhotosRepository(),
  eventsRepository = createEventsRepository(),
} = {}) {
  return {
    async addToMyPhotos({ user, photoIds }) {
      if (!photoIds.length) {
        throw new ApiError(400, "VALIDATION_ERROR", "photo_ids is required");
      }

      const photos = await eventsRepository.getPhotosByIds(photoIds);
      if (!photos.length) {
        return { added_count: 0, photo_ids: [] };
      }

      const attendeeRows = await eventsRepository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });
      const accessibleEventIds = unique(attendeeRows.map((row) => row.event_id).filter(Boolean));
      const accessiblePhotos = photos.filter((photo) => accessibleEventIds.includes(photo.event_id));
      const visibleAccessiblePhotos = accessiblePhotos.filter((photo) => isPhotoVisibleToAttendees(photo));
      const accessiblePhotoIds = visibleAccessiblePhotos.map((photo) => photo.id);

      if (!accessiblePhotoIds.length) {
        return { added_count: 0, photo_ids: [] };
      }

      const eventIds = unique(visibleAccessiblePhotos.map((photo) => photo.event_id).filter(Boolean));
      const [eventRows, photoPeopleRows] = await Promise.all([
        eventsRepository.getEventsByIds(eventIds, { privacyType: "all", search: "" }),
        eventsRepository.getPhotoPeopleByPhotoIds(accessiblePhotoIds),
      ]);

      const eventById = new Map(eventRows.map((event) => [event.id, event]));
      const peopleByPhotoId = new Map();
      photoPeopleRows.forEach((entry) => {
        if (!peopleByPhotoId.has(entry.photo_id)) {
          peopleByPhotoId.set(entry.photo_id, []);
        }
        peopleByPhotoId.get(entry.photo_id).push(entry.person_user_id);
      });

      const privateAllowedByEvent = new Map();
      const ensurePrivateAllowed = async (eventId) => {
        if (privateAllowedByEvent.has(eventId)) {
          return privateAllowedByEvent.get(eventId);
        }
        const granted = await eventsRepository.getPrivateAccessGrantedTargets({
          eventId,
          requesterUserId: user.id,
        });
        const allowed = new Set([user.id, ...granted]);
        privateAllowedByEvent.set(eventId, allowed);
        return allowed;
      };

      const visiblePhotoIds = [];
      for (const photo of visibleAccessiblePhotos) {
        const event = eventById.get(photo.event_id);
        if (!event || event.privacy_type !== "private") {
          visiblePhotoIds.push(photo.id);
          continue;
        }

        const allowed = await ensurePrivateAllowed(photo.event_id);
        const peopleInPhoto = peopleByPhotoId.get(photo.id) || [];
        if (peopleInPhoto.some((personId) => allowed.has(personId))) {
          visiblePhotoIds.push(photo.id);
        }
      }

      const insertedRows = await myPhotosRepository.upsertMyPhotos(user.id, visiblePhotoIds);
      return {
        added_count: insertedRows.length,
        photo_ids: unique(insertedRows.map((row) => row.photo_id)),
      };
    },

    async listMyPhotos({ user, eventIdsCsv, personIdsCsv }) {
      const myRows = await myPhotosRepository.getMyPhotoRows(user.id);
      const photoIds = myRows.map((row) => row.photo_id);

      if (!photoIds.length) {
        return { photos: [], events: [], people: [] };
      }

      const selectedEventIds = parseCsvIds(eventIdsCsv);
      const selectedPersonIds = parseCsvIds(personIdsCsv);

      const photos = await eventsRepository.getPhotosByIds(photoIds);
      const visiblePhotos = photos.filter((photo) => isPhotoVisibleToAttendees(photo));
      const byPhotoId = indexBy(visiblePhotos, "id");
      const existingPhotoIds = visiblePhotos.map((photo) => photo.id);
      const photoPeopleRows = await eventsRepository.getPhotoPeopleByPhotoIds(existingPhotoIds);

      const peopleByPhoto = new Map();
      photoPeopleRows.forEach((row) => {
        if (!peopleByPhoto.has(row.photo_id)) {
          peopleByPhoto.set(row.photo_id, []);
        }
        peopleByPhoto.get(row.photo_id).push(row.person_user_id);
      });

      const filteredRows = myRows.filter((row) => {
        const photo = byPhotoId.get(row.photo_id);
        if (!photo) return false;

        const eventFilterPass =
          selectedEventIds.length === 0 || selectedEventIds.includes(photo.event_id);

        if (!eventFilterPass) return false;

        const peopleInPhoto = peopleByPhoto.get(photo.id) || [];
        const personFilterPass =
          selectedPersonIds.length === 0 ||
          selectedPersonIds.some((personId) => peopleInPhoto.includes(personId));

        return personFilterPass;
      });

      const filteredPhotoIds = filteredRows.map((row) => row.photo_id);
      const filteredPhotos = filteredPhotoIds.map((photoId) => byPhotoId.get(photoId)).filter(Boolean);
      const eventIds = unique(filteredPhotos.map((photo) => photo.event_id));
      const personIds = unique(
        filteredPhotos.flatMap((photo) => peopleByPhoto.get(photo.id) || []).filter(Boolean),
      );

      const events = eventIds.length
        ? await eventsRepository.getEventsByIds(eventIds, { privacyType: "all", search: "" })
        : [];
      const profiles = personIds.length ? await eventsRepository.getProfilesByIds(personIds) : [];
      const profilesById = indexBy(profiles, "id");

      const photosWithUrls = await Promise.all(
        filteredRows.map(async (row) => {
          const photo = byPhotoId.get(row.photo_id);
          if (!photo) return null;
          return toPhotoResponse(photo, {
            people: peopleByPhoto.get(photo.id) || [],
            added_at: row.added_at,
            image_url: await resolvePhotoUrl(eventsRepository, photo),
          });
        }),
      );

      return {
        photos: photosWithUrls.filter(Boolean),
        events: events.map((event) => ({
          id: event.id,
          name: event.name,
          date: event.event_date,
          location: event.location,
          type: event.privacy_type,
        })),
        people: personIds.map((personId) => ({
          id: personId,
          name: profilesById.get(personId)?.display_name || "Unknown user",
          avatar_url: profilesById.get(personId)?.display_avatar_url || null,
        })),
      };
    },
  };
}
