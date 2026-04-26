import { ApiError } from "../utils/apiError.js";
import { createOrganiserEventsRepository } from "../repositories/organiserEventsRepository.js";
import { toPhotoResponse } from "../utils/storage.js";
import { createPhotoMatchingService } from "./photoMatchingService.js";
import { createNotificationsRepository } from "../repositories/notificationsRepository.js";
import { logger } from "../utils/logger.js";

function normalizeEvent(event) {
  return {
    id: event.id,
    organiser_user_id: event.organiser_user_id,
    organiser_name: event.organiser_name,
    name: event.name,
    date: event.event_date,
    location: event.location,
    organizing_company: event.organising_company,
    image_url: event.cover_image_url,
    type: event.privacy_type,
    status: event.status,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

function ensurePublishFields({ name, date, location }) {
  if (!name || !String(name).trim() || !date || !location || !String(location).trim()) {
    throw new ApiError(
      400,
      "PUBLISH_FIELDS_REQUIRED",
      "name, date, and location are required for non-draft status",
    );
  }
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

export function createOrganiserEventsService(
  repository = createOrganiserEventsRepository(),
  photoMatchingService = createPhotoMatchingService(),
  notificationsRepository = createNotificationsRepository(),
) {
  return {
    async createEvent({ user, profile, payload }) {
      const status = payload.status || "draft";
      const type = payload.type || "private";

      if (status !== "draft") {
        ensurePublishFields({
          name: payload.name,
          date: payload.date,
          location: payload.location,
        });
      }

      const event = await repository.createEvent({
        organiser_user_id: user.id,
        organiser_name: profile.display_name || user.email || "Unknown organiser",
        name: payload.name ?? null,
        event_date: payload.date ?? null,
        location: payload.location ?? null,
        organising_company: payload.organizing_company ?? null,
        cover_image_url: payload.image_url ?? null,
        privacy_type: type,
        status,
      });

      return { event: normalizeEvent(event) };
    },

    async updateEvent({ user, eventId, payload }) {
      const existing = await repository.getEventById(eventId);
      if (!existing || existing.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const status = payload.status ?? existing.status;
      const merged = {
        name: payload.name ?? existing.name,
        date: payload.date ?? existing.event_date,
        location: payload.location ?? existing.location,
      };

      if (status !== "draft") {
        ensurePublishFields(merged);
      }

      const updates = {};
      if ("name" in payload) updates.name = payload.name;
      if ("date" in payload) updates.event_date = payload.date;
      if ("location" in payload) updates.location = payload.location;
      if ("organizing_company" in payload) updates.organising_company = payload.organizing_company;
      if ("image_url" in payload) updates.cover_image_url = payload.image_url;
      if ("type" in payload) updates.privacy_type = payload.type;
      if ("status" in payload) updates.status = payload.status;

      const event = await repository.updateEvent(eventId, updates);
      return { event: normalizeEvent(event) };
    },

    async listEvents({ user }) {
      const events = await repository.listEventsByOrganiser(user.id);
      return {
        events: events.map(normalizeEvent),
      };
    },

    async getEventById({ user, eventId }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const [attendees, photos] = await Promise.all([
        repository.getAttendeesByEventId(eventId),
        repository.getPhotosByEventId(eventId),
      ]);

      const normalizedPhotos = await Promise.all(
        photos.map(async (photo) =>
          toPhotoResponse(photo, {
            created_at: photo.created_at,
            image_url: await resolvePhotoUrl(repository, photo),
          }),
        ),
      );

      return {
        event: normalizeEvent(event),
        attendees,
        photos: normalizedPhotos,
      };
    },

    async addAttendees({ user, eventId, emails }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const existingRows = await repository.getAttendeesByEventId(eventId);
      const existingByEmail = new Map(
        existingRows.map((row) => [String(row.email || "").toLowerCase(), row]),
      );

      const normalizedEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()))];
      const profileRows = await repository.getProfilesByEmails(normalizedEmails);
      const profileByEmail = new Map(profileRows.map((profile) => [profile.email.toLowerCase(), profile.id]));

      const rows = normalizedEmails.map((email) => ({
        event_id: eventId,
        email,
        user_id: profileByEmail.get(email) || null,
      }));

      const attendees = await repository.upsertAttendees(rows);

      const recipientUserIds = [...new Set(
        attendees
          .filter((attendee) => attendee.user_id)
          .filter((attendee) => {
            const previous = existingByEmail.get(String(attendee.email || "").toLowerCase());
            return !previous || previous.user_id !== attendee.user_id;
          })
          .map((attendee) => attendee.user_id),
      )];

      if (recipientUserIds.length) {
        const eventName = event.name || "an event";
        await Promise.all(
          recipientUserIds.map((recipientUserId) =>
            notificationsRepository.createNotification({
              recipient_user_id: recipientUserId,
              type: "added_to_event",
              title: "Added to Event",
              message: `You were added to ${eventName}`,
              event_id: eventId,
            }),
          ),
        );
      }

      try {
        await photoMatchingService.reprocessEventPhotos({
          eventId,
          photoIds: [],
        });
      } catch (error) {
        logger.warn(
          {
            eventId,
            err: error instanceof Error ? error.message : String(error),
          },
          "Attendee add succeeded but photo reprocess failed",
        );
      }

      return { attendees };
    },

    async removeAttendee({ user, eventId, attendeeId }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const attendee = await repository.getAttendeeById(attendeeId);
      if (!attendee || attendee.event_id !== eventId) {
        throw new ApiError(404, "ATTENDEE_NOT_FOUND", "Attendee not found");
      }

      const removed = await repository.deleteAttendeeById(attendeeId);
      return { attendee: removed };
    },

    async addPhotos({ user, eventId, photos }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const rows = photos.map((photo) => ({
        event_id: eventId,
        storage_path: photo.storage_path,
        image_url: photo.image_url ?? null,
        uploaded_by_user_id: user.id,
      }));

      const inserted = await repository.insertPhotos(rows);
      const processing = await photoMatchingService.processPhotosByIds(
        inserted.map((photo) => photo.id),
      );
      const processingByPhotoId = new Map(
        processing.map((result) => [result.photo_id, result]),
      );

      const normalizedPhotos = await Promise.all(
        inserted.map(async (photo) =>
          toPhotoResponse(photo, {
            created_at: photo.created_at,
            image_url: await resolvePhotoUrl(repository, photo),
            face_processing_status:
              processingByPhotoId.get(photo.id)?.status || photo.face_processing_status || "pending",
          }),
        ),
      );

      return {
        photos: normalizedPhotos,
        face_processing: processing,
      };
    },

    async removePhotos({ user, eventId, photoIds }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const photos = await repository.getPhotosByEventId(eventId);
      const eventPhotoIds = new Set(photos.map((photo) => photo.id));
      const validPhotoIds = photoIds.filter((id) => eventPhotoIds.has(id));

      const removed = await repository.deletePhotosByIds(validPhotoIds);
      const normalizedPhotos = await Promise.all(
        removed.map(async (photo) =>
          toPhotoResponse(photo, {
            created_at: photo.created_at,
            image_url: await resolvePhotoUrl(repository, photo),
          }),
        ),
      );

      return {
        deleted_count: removed.length,
        photos: normalizedPhotos,
      };
    },

    async dashboard({ user }) {
      const events = await repository.listEventsByOrganiser(user.id);
      const photosByEventId = new Map();
      let photoCount = 0;
      for (const event of events) {
        const rows = await repository.getPhotosByEventId(event.id);
        photosByEventId.set(event.id, rows);
        photoCount += rows.length;
      }

      return {
        totals: {
          events: events.length,
          photos: photoCount,
        },
        events: events.map((event) => ({
          ...normalizeEvent(event),
          photos_count: photosByEventId.get(event.id)?.length || 0,
        })),
      };
    },

    async reprocessPhotos({ user, eventId, photoIds }) {
      const event = await repository.getEventById(eventId);
      if (!event || event.organiser_user_id !== user.id) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const results = await photoMatchingService.reprocessEventPhotos({
        eventId,
        photoIds,
      });

      return {
        results,
        total: results.length,
        processed: results.filter((result) => result.status === "processed").length,
        failed: results.filter((result) => result.status === "failed").length,
      };
    },
  };
}
