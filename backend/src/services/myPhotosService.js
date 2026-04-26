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
      const accessiblePhotoIds = photos
        .filter((photo) => accessibleEventIds.includes(photo.event_id))
        .map((photo) => photo.id);

      const insertedRows = await myPhotosRepository.upsertMyPhotos(user.id, accessiblePhotoIds);
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
      const byPhotoId = indexBy(photos, "id");
      const existingPhotoIds = photos.map((photo) => photo.id);
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

      return {
        photos: filteredRows
          .map((row) => {
            const photo = byPhotoId.get(row.photo_id);
            if (!photo) return null;
            return toPhotoResponse(photo, {
              people: peopleByPhoto.get(photo.id) || [],
              added_at: row.added_at,
            });
          })
          .filter(Boolean),
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
