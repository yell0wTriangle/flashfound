import { ApiError } from "../utils/apiError.js";
import { createProfileRepository } from "../repositories/profileRepository.js";
import { createNotificationsRepository } from "../repositories/notificationsRepository.js";
import { createEventsRepository } from "../repositories/eventsRepository.js";
import { logger } from "../utils/logger.js";

function normalizeDisplayName(user) {
  if (user.user_metadata?.display_name) return String(user.user_metadata.display_name).trim();
  if (user.user_metadata?.full_name) return String(user.user_metadata.full_name).trim();
  if (user.email) return String(user.email).split("@")[0];
  return "FlashFound User";
}

function onboardingStatus(profile) {
  if (!profile) return "new";
  if (!profile.face_verification_completed) return "needs_selfie";
  return "ready";
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function createProfileService(
  repository = createProfileRepository(),
  verificationRepository = {
    async findLatestNonFinalizedSessionByUserId() {
      return null;
    },
  },
  photoMatchingService = {
    async rematchUserAcrossAccessiblePhotos() {
      return { rematched_photos: 0, matched_photos: 0 };
    },
  },
  notificationsRepository = createNotificationsRepository(),
  eventsRepository = createEventsRepository(),
) {
  const bootstrapInFlight = new Map();
  const rematchInFlight = new Map();

  const linkAttendeeRows = async ({ userId, email }) => {
    if (typeof repository.linkAttendeeRowsToUserByEmail !== "function") {
      return [];
    }
    return repository.linkAttendeeRowsToUserByEmail({ userId, email });
  };

  return {
    async bootstrapProfile(authUser) {
      if (bootstrapInFlight.has(authUser.id)) {
        return bootstrapInFlight.get(authUser.id);
      }

      const runBootstrap = async () => {
      const ensureAddedToEventNotifications = async () => {
        const attendeeRows = await eventsRepository.getAccessibleEventIdsForUser({
          userId: authUser.id,
          email: authUser.email || "",
        });
        const eventIds = unique(attendeeRows.map((row) => row.event_id));
        if (!eventIds.length) return;

        const existing = await notificationsRepository.listAddedToEventByRecipientAndEventIds(
          authUser.id,
          eventIds,
        );
        const existingEventIds = new Set(existing.map((row) => row.event_id));
        const missingEventIds = eventIds.filter((eventId) => !existingEventIds.has(eventId));
        if (!missingEventIds.length) return;

        const events = await eventsRepository.getEventsByIds(missingEventIds, {
          privacyType: "all",
          search: "",
        });
        const eventById = new Map(events.map((event) => [event.id, event]));

        await Promise.all(
          missingEventIds.map((eventId) =>
            notificationsRepository.createNotification({
              recipient_user_id: authUser.id,
              type: "added_to_event",
              title: "Added to Event",
              message: `You were added to ${eventById.get(eventId)?.name || "an event"}`,
              event_id: eventId,
            }),
          ),
        );
      };

      const maybeNotifyLinkedAttendeeRows = async (linkedRows) => {
        if (!linkedRows?.length) return;

        const eventIds = [...new Set(linkedRows.map((row) => row.event_id).filter(Boolean))];
        if (!eventIds.length) return;

        let events = [];
        try {
          events = await eventsRepository.getEventsByIds(eventIds, {
            privacyType: "all",
            search: "",
          });
        } catch (error) {
          logger.warn(
            {
              userId: authUser.id,
              err: error instanceof Error ? error.message : String(error),
            },
            "Could not resolve event names for attendee-link notifications",
          );
        }
        const eventById = new Map(events.map((event) => [event.id, event]));

        await Promise.all(
          linkedRows.map((row) =>
            notificationsRepository.createNotification({
              recipient_user_id: authUser.id,
              type: "added_to_event",
              title: "Added to Event",
              message: `You were added to ${eventById.get(row.event_id)?.name || "an event"}`,
              event_id: row.event_id,
            }),
          ),
        );
      };

      const maybeRematch = async ({ profile }) => {
        if (!profile?.face_verification_completed) {
          return;
        }
        if (typeof photoMatchingService.rematchUserAcrossAccessiblePhotos !== "function") {
          return;
        }

        if (rematchInFlight.has(authUser.id)) {
          return rematchInFlight.get(authUser.id);
        }

        const rematchPromise = photoMatchingService
          .rematchUserAcrossAccessiblePhotos({
            userId: authUser.id,
            email: authUser.email || profile.email || "",
          })
          .catch((error) => {
            logger.warn(
              {
                userId: authUser.id,
                err: error instanceof Error ? error.message : String(error),
              },
              "Attendee row link rematch failed during bootstrap",
            );
          })
          .finally(() => {
            rematchInFlight.delete(authUser.id);
          });
        rematchInFlight.set(authUser.id, rematchPromise);
        return rematchPromise;
      };

      const existing = await repository.findById(authUser.id);
      if (existing) {
        const linkedRows = await linkAttendeeRows({
          userId: authUser.id,
          email: authUser.email || existing.email || "",
        });
        await maybeNotifyLinkedAttendeeRows(linkedRows);
        await ensureAddedToEventNotifications();
        await maybeRematch({ profile: existing });
        return {
          profile: existing,
          created: false,
          onboarding_status: onboardingStatus(existing),
        };
      }

      const profileInput = {
        id: authUser.id,
        email: authUser.email || "",
        display_name: normalizeDisplayName(authUser),
        role: "attendee",
        face_verification_completed: false,
      };

      const createdProfile = await repository.create(profileInput);
      const linkedRows = await linkAttendeeRows({
        userId: authUser.id,
        email: profileInput.email,
      });
      await maybeNotifyLinkedAttendeeRows(linkedRows);
      await ensureAddedToEventNotifications();
      await maybeRematch({ profile: createdProfile });
      return {
        profile: createdProfile,
        created: true,
        onboarding_status: "new",
      };
      };

      const promise = runBootstrap().finally(() => {
        bootstrapInFlight.delete(authUser.id);
      });
      bootstrapInFlight.set(authUser.id, promise);
      return promise;
    },

    async getProfile(userId) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }
      return profile;
    },

    async patchProfile(userId, updates) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }
      return repository.updateById(userId, updates);
    },

    async patchVerificationSelfie(userId, input) {
      const profile = await repository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }

      const updates = {
        verification_selfie_url: input.verification_selfie_url,
        face_verification_completed: false,
      };

      return repository.updateById(userId, updates);
    },

    async getOnboardingStatus(userId) {
      const profile = await repository.findById(userId);
      const activeSession = await verificationRepository.findLatestNonFinalizedSessionByUserId(userId);
      return {
        status: onboardingStatus(profile),
        role: profile?.role || "attendee",
        profile_exists: Boolean(profile),
        verification_session: activeSession
          ? {
              id: activeSession.id,
              status: activeSession.status,
              expires_at: activeSession.expires_at,
            }
          : null,
      };
    },
  };
}
