import { ApiError } from "../utils/apiError.js";
import { parseCsvIds, unique } from "../utils/filters.js";
import { createEventsRepository } from "../repositories/eventsRepository.js";
import { toPhotoResponse } from "../utils/storage.js";

function mapEventCard(event) {
  return {
    id: event.id,
    name: event.name,
    date: event.event_date,
    location: event.location,
    organizer: event.organiser_name,
    organizing_company: event.organising_company,
    type: event.privacy_type,
    status: event.status,
    image_url: event.cover_image_url,
    created_at: event.created_at,
  };
}

function indexBy(items, key) {
  const map = new Map();
  items.forEach((item) => map.set(item[key], item));
  return map;
}

function isEventAccessible(eventId, accessibleEventIds) {
  return accessibleEventIds.includes(eventId);
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

async function getAccessiblePeopleForPrivateEvent({ repository, eventId, userId }) {
  const grantedTargets = await repository.getPrivateAccessGrantedTargets({
    eventId,
    requesterUserId: userId,
  });
  return unique([userId, ...grantedTargets]);
}

export function createEventsService(repository = createEventsRepository()) {
  return {
    async discovery({ user, search, privacyType }) {
      const attendeeRows = await repository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });

      const eventIds = unique(attendeeRows.map((row) => row.event_id).filter(Boolean));
      if (!eventIds.length) {
        return { events: [] };
      }

      const events = await repository.getEventsByIds(eventIds, {
        privacyType: privacyType || "all",
        search: search || "",
      });

      return { events: events.map(mapEventCard) };
    },

    async eventPeople({ user, eventId }) {
      const attendeeRows = await repository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });
      const eventIds = unique(attendeeRows.map((row) => row.event_id).filter(Boolean));

      if (!isEventAccessible(eventId, eventIds)) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const event = await repository.getEventById(eventId);
      if (!event) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const photos = await repository.getPhotosByEventId(eventId);
      const visiblePhotos = photos.filter(isPhotoVisibleToAttendees);
      const photoIds = visiblePhotos.map((photo) => photo.id);
      const photoPeople = await repository.getPhotoPeopleByPhotoIds(photoIds);
      const personIds = unique(photoPeople.map((entry) => entry.person_user_id).filter(Boolean));
      const profiles = await repository.getProfilesByIds(personIds);
      const profilesById = indexBy(profiles, "id");
      const privateAccessiblePeople =
        event.privacy_type === "private"
          ? await getAccessiblePeopleForPrivateEvent({
              repository,
              eventId,
              userId: user.id,
            })
          : [];

      const people = personIds.map((personId) => {
        const profile = profilesById.get(personId);
        const accessible =
          event.privacy_type === "public" ? true : privateAccessiblePeople.includes(personId);
        return {
          id: personId,
          name: profile?.display_name || "Unknown user",
          avatar_url: profile?.display_avatar_url || null,
          accessible,
        };
      });

      return {
        event: mapEventCard(event),
        people,
      };
    },

    async eventResults({ user, eventId, personIdsCsv }) {
      const attendeeRows = await repository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });
      const eventIds = unique(attendeeRows.map((row) => row.event_id).filter(Boolean));

      if (!isEventAccessible(eventId, eventIds)) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const event = await repository.getEventById(eventId);
      if (!event) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const photos = await repository.getPhotosByEventId(eventId);
      const visiblePhotos = photos.filter(isPhotoVisibleToAttendees);
      const photoIds = visiblePhotos.map((photo) => photo.id);
      const photoPeople = await repository.getPhotoPeopleByPhotoIds(photoIds);
      const byPhotoId = new Map();
      photoPeople.forEach((entry) => {
        if (!byPhotoId.has(entry.photo_id)) {
          byPhotoId.set(entry.photo_id, []);
        }
        byPhotoId.get(entry.photo_id).push(entry.person_user_id);
      });

      const selectedPersonIds = parseCsvIds(personIdsCsv);
      const baseAllowedPeople =
        event.privacy_type === "public"
          ? unique(photoPeople.map((row) => row.person_user_id))
          : await getAccessiblePeopleForPrivateEvent({
              repository,
              eventId,
              userId: user.id,
            });

      const effectiveSelected =
        selectedPersonIds.length > 0 ? selectedPersonIds.filter((id) => baseAllowedPeople.includes(id)) : [];

      const filteredPhotos = visiblePhotos.filter((photo) => {
        const peopleInPhoto = byPhotoId.get(photo.id) || [];
        if (!effectiveSelected.length) {
          if (event.privacy_type === "public") return true;
          return peopleInPhoto.some((personId) => baseAllowedPeople.includes(personId));
        }
        return peopleInPhoto.some((personId) => effectiveSelected.includes(personId));
      });

      const personIds = unique(photoPeople.map((entry) => entry.person_user_id).filter(Boolean));
      const profiles = await repository.getProfilesByIds(personIds);
      const profilesById = indexBy(profiles, "id");

      const people = personIds.map((personId) => ({
        id: personId,
        name: profilesById.get(personId)?.display_name || "Unknown user",
        avatar_url: profilesById.get(personId)?.display_avatar_url || null,
        accessible: event.privacy_type === "public" ? true : baseAllowedPeople.includes(personId),
      }));

      const resolvedPhotos = await Promise.all(
        filteredPhotos.map(async (photo) =>
          toPhotoResponse(photo, {
            people: byPhotoId.get(photo.id) || [],
            created_at: photo.created_at,
            image_url: await resolvePhotoUrl(repository, photo),
          }),
        ),
      );

      return {
        event: mapEventCard(event),
        people,
        photos: resolvedPhotos,
      };
    },

    async ensurePhotosAccessible({ user, photoIds }) {
      const rows = await repository.getPhotosByIds(photoIds);
      const attendeeRows = await repository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });
      const eventIds = unique(attendeeRows.map((row) => row.event_id).filter(Boolean));

      const accessiblePhotoIds = rows
        .filter((row) => eventIds.includes(row.event_id))
        .filter((row) => isPhotoVisibleToAttendees(row))
        .map((row) => row.id);

      return {
        accessible_photo_ids: unique(accessiblePhotoIds),
      };
    },
  };
}
