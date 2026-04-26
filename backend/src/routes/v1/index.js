import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { createProfileRoutes } from "./profile.routes.js";
import { createEventsRoutes } from "./events.routes.js";
import { createMyPhotosRoutes } from "./myPhotos.routes.js";
import { createOrganiserAccessRoutes } from "./organiserAccess.routes.js";
import { createOrganiserEventsRoutes } from "./organiserEvents.routes.js";
import { createPrivateAccessRoutes } from "./privateAccess.routes.js";
import { createNotificationsRoutes } from "./notifications.routes.js";
import { createVerificationRoutes } from "./verification.routes.js";

export const v1Routes = Router();

v1Routes.use(healthRoutes);
v1Routes.use(createProfileRoutes());
v1Routes.use(createEventsRoutes());
v1Routes.use(createMyPhotosRoutes());
v1Routes.use(createOrganiserAccessRoutes());
v1Routes.use(createOrganiserEventsRoutes());
v1Routes.use(createVerificationRoutes());
v1Routes.use(createPrivateAccessRoutes());
v1Routes.use(createNotificationsRoutes());
