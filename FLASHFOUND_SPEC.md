# FlashFound Product Specification

FlashFound is a smart gallery platform for events. It helps event organisers create event galleries, invite attendees by email, upload photos in bulk, and let attendees discover, filter, request access to, and save event photos into a personal gallery called **My Photos**.

This document formalizes the intended product behavior, user flows, page responsibilities, and implementation expectations for the FlashFound demo application. The existing `/dump` folder contains Gemini-generated demo pages and exported canvas-style React components that act as visual and interaction references. The `/dump` folder must not be edited directly while building the real app.

The implementation plan is to create a separate `frontend` folder and a separate `backend` folder in the repository root:

- `frontend`: React + Vite application using Tailwind CSS 4.
- `backend`: Node.js + Express API server.
- `dump`: preserved reference material only.

## Technology Stack

### Frontend

The frontend will be built with React and Vite. Styling will use Tailwind CSS 4, following the newer Tailwind 4 installation and configuration approach instead of older Tailwind 3 patterns.

The frontend will consume:

- Supabase Auth for user authentication.
- Supabase Storage URLs for uploaded event photos and profile/selfie images.
- The Express backend for privileged operations, organiser/admin workflows, and application-specific business logic.

### Backend

The backend will be built with Node.js and Express. It will serve as the application API layer and will perform trusted operations that should not happen directly from the browser.

The backend will not use Redis, queues, Docker, or other infrastructure-heavy components. This is intentionally a small demo app designed to run with a maximum of roughly two real users: the project owner as organiser/admin and one friend as attendee.

### Database, Auth, And Storage

FlashFound will use Supabase for:

- PostgreSQL database.
- Supabase Auth.
- Supabase Storage.

BetterAuth will not be used. Authentication will be implemented with Supabase Auth.

### Deployment

The intended deployment split is:

- Frontend: Vercel.
- Backend: Railway.
- Database/Auth/Storage: Supabase.

Expected environment configuration:

- Vercel needs `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Railway needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the PostgreSQL database connection string.
- Railway backend CORS must whitelist the deployed Vercel frontend URL.
- Supabase settings must allow the Vercel frontend URL where relevant, especially for auth redirects and browser access.

The Supabase service role key must never be exposed to the frontend.

## User Roles

FlashFound has three practical permission levels:

- Attendee.
- Organiser.
- Admin.

Every newly signed-up user starts as an attendee. Organiser access is granted only after an organiser access request is approved by the admin. Admin access is restricted to the project owner through a server-side key flow.

## Core Concepts

### Events

Events are created by organisers. Each event can include:

- Event name.
- Date.
- Location.
- Optional organising company.
- Optional cover image.
- Status: draft, upcoming, or completed.
- Privacy type: public or private.
- Attendee email list.
- Uploaded event photos.

Event name, date, and location are required before an event can be saved and published. Other fields are optional and should be omitted from UI cards when not provided. If no image is available, the UI should show a placeholder.

### Public Events

Public events let attendees access everyone’s photos in that event. The attendee can filter photos by person and add selected photos to My Photos.

Public events do not require requesting access to other people’s photos.

### Private Events

Private events restrict access to other people’s photos. An attendee can access their own matched photos by default, but must request access to see photos containing other people.

In private events:

- People the user can access are selectable.
- People the user cannot access are visible but greyed out.
- The user can request access from greyed-out people.
- The “everyone” filter only selects people the user currently has access to.
- Search should still show all matching people, regardless of access status.

### My Photos

My Photos is the attendee’s personal saved gallery. Photos appear here only after the user finds them through an event results page and adds them to My Photos.

My Photos is not meant to automatically contain every photo the user appears in. The user intentionally adds selected photos from public or private event result pages.

### Source-Of-Truth Selfie

Every user must provide a source-of-truth selfie during first-time account setup. This selfie is used to match and validate the user’s face for photo discovery.

The app should use faceapi or MediaPipe through Google AI Edge for basic face detection and validation. The goal is to confirm that a usable user face is visible before storing the selfie as the verification reference.

## Authentication And Account Setup Flow

### Landing Page

`LandingPage.jsx` is the unauthenticated entry point. It is the page users see when they open the deployed app or dev server link.

By design, this page only gives access to the auth page, `AccountSetupStep1.jsx`.

The landing page does not use the authenticated navbar.

### Account Setup Step 1

`AccountSetupStep1.jsx` is the combined sign-up and sign-in page. It allows users to create an account or log in to an existing account.

Expected behavior:

- New users authenticate through Supabase Auth.
- Returning users authenticate through Supabase Auth.
- After authentication, the app must check whether the user has completed face verification.

Routing rules:

- First-time user with no completed face verification: send to `AccountSetupStep2.jsx`.
- Returning user with completed face verification: send directly to `MyPhotos.jsx`.
- Returning user who previously closed the app before completing face verification: send back to `AccountSetupStep2.jsx`.

The database must store enough user profile state to reliably know whether face verification was completed.

### Account Setup Step 2

`AccountSetupStep2.jsx` captures and validates the source-of-truth selfie.

This page is a core app requirement. It should:

- Access the user camera or accept the designed selfie capture flow.
- Detect that a face is visible.
- Perform basic face validation through faceapi or MediaPipe / Google AI Edge.
- Save the selfie or its storage reference.
- Mark the user profile as face verification completed.
- Show a button that routes the user to `MyPhotos.jsx` after successful verification.

This page does not use the authenticated navbar.

## Authenticated Navigation

The universal authenticated navbar is represented by `NavBar.jsx` in the demo pages. The real app should extract and reuse one shared navbar component.

The navbar appears on:

- `MyPhotos.jsx`.
- `EventDiscovery.jsx`.
- `OrganiserDashboard.jsx`.
- `RequestOrganiserAccess.jsx`.
- `ProfileAndSettings.jsx`.
- `CreateEvent.jsx`.
- `Notifications.jsx`.

The navbar does not appear on:

- `LandingPage.jsx`.
- `AccountSetupStep1.jsx`.
- `AccountSetupStep2.jsx`.
- `PublicResults.jsx`.
- `PrivateResults.jsx`.
- `Admin.jsx`.

Navbar structure:

- Top-left camera icon: FlashFound logo. Clicking it does nothing for now.
- Image icon: routes to My Photos.
- Compass icon: routes to Event Discovery.
- Calendar plus icon: routes to Organiser Dashboard if the user has organiser access, otherwise routes to Request Organiser Access.
- Bottom notification bell: routes to Notifications.
- Bottom profile button: routes to Profile And Settings.

`PublicResults.jsx` and `PrivateResults.jsx` intentionally omit the navbar. The only way back from those pages is the page back button, returning the user to Event Discovery.

## My Photos

`MyPhotos.jsx` displays the user’s saved personal gallery.

### Photo Source

Photos appear in My Photos only when the user adds them from event result pages. The add action happens in `PublicResults.jsx` or `PrivateResults.jsx`.

### Default Filters

The My Photos view can be filtered by:

- Event.
- People.

Default filter state:

- Events: All Photos selected.
- People: Me selected.

### Event Filter Behavior

The event list behaves like a checklist.

When All Photos is selected, the view considers all events represented in the user’s saved gallery.

When the user selects one or more specific events:

- The check mark is removed from All Photos.
- The selected event or events receive check marks.
- The people filter list updates after each click.
- If an event is added, people from that event are added to the available people list.
- If an event is deselected, people unique to that event are removed from the available people list.
- If a person appears in multiple selected events, they should remain available as long as at least one selected event includes them.

The photo grid updates immediately whenever event filters change.

### People Filter Behavior

The people list depends on the currently selected events.

The people filter includes:

- Me.
- Everyone.
- Other people from the currently selected event set.
- Search input for filtering available people by text match.

The people search should be a simple text match search against the currently available people list.

When Everyone is selected, photos containing any available person from the selected event set should be shown.

When individual people are selected, the photo grid updates immediately to match the selected people and selected events.

### Photo Cards

Each photo tile should support hover UI.

On hover, the tile shows:

- A small list of people in that image using profile pictures.
- Maximum of three visible profile pictures.
- If more than three people are in the image, show a compact overflow indicator such as dots.
- A download button.

The download button is part of the UI but does not need to perform a real download yet.

### Select Mode

My Photos has a top-right `Select Photos` button.

When clicked, the page enters select mode based on the currently filtered view. For example, if the user has selected All Photos under events and Me under people, select mode starts from that filtered result set.

In select mode:

- Each visible photo can be selected or deselected.
- A Select All checkbox appears for the current filtered result set.
- Selected photos can be downloaded through a dummy Download button.
- The download button does not need real functionality yet.

## Event Discovery

`EventDiscovery.jsx` lists all events where the current user has been added as an attendee by event email.

An event appears for a user if:

- The organiser added the user’s email to the event attendee list.
- The user signs in with that same email.

### Search

Event Discovery includes a search bar that filters results as the user types.

Search is simple text match against:

- Location.
- Organiser.
- Event name.

### Privacy Filters

The page includes default filters:

- All.
- Public.
- Private.

The default filter should show all accessible events.

### Event Click Behavior

Clicking a public event routes to `PublicResults.jsx`.

Clicking a private event routes to `PrivateResults.jsx`.

Event Discovery uses the authenticated navbar.

## Public Results

`PublicResults.jsx` displays photos for a selected public event.

This is an authenticated page, but it does not use the universal navbar.

The page must include a back action that returns the user to Event Discovery.

### People Filter

The left side contains a people filter.

The people filter includes:

- Everyone.
- Individual people detected in the event.
- Search input for filtering people by simple text match.

Public events do not require access requests, so all people are available.

### Photo Grid

The main view shows photos from the event according to the selected people filter.

Photo tiles on this page do not need per-photo download buttons.

### Select Mode

The top-right select mode works similarly to My Photos:

- User can enter select mode.
- User can select or deselect individual photos.
- User can use a Select All checkbox for the currently filtered result set.
- The action button adds selected photos to My Photos.

The Add To My Photos action should update the user’s saved gallery.

## Private Results

`PrivateResults.jsx` displays photos for a selected private event.

This is an authenticated page, but it does not use the universal navbar.

The page must include a back action that returns the user to Event Discovery.

### Access Rules

The private event results page is similar to the public results page, but access to other people’s photos is restricted.

The user can see and select:

- Their own person entry.
- People who have already granted access.

People the user has not received access from:

- Still appear in the people list.
- Are greyed out.
- Cannot be selected for filtering.
- Show a Request button.

### Everyone Filter

The Everyone filter only includes people the current user has access to.

It must not include greyed-out people who have not granted access.

### Search

Search filters the people list by simple text match.

Search results should include all matching people, including greyed-out people without granted access.

### Request Access

Clicking Request on a person sends that person a notification.

The notification text must include:

- The person requesting access.
- The event where access is being requested.

When the recipient approves or denies the request, the requesting user’s private results access state should update accordingly.

Revoking previously granted access is out of scope for the current demo.

### Select Mode

Select mode behaves like Public Results, except it only works with photos the user currently has access to.

The user can:

- Select individual visible photos.
- Select all visible photos in the current filtered result set.
- Add selected photos to My Photos.

## Notifications

`Notifications.jsx` shows user notifications.

There are two notification types:

- Added to an event.
- Access request from another user for a private event.

### Added To Event Notification

When an organiser adds an attendee email to an event, the matching user should receive or see a notification after signing in with that email.

The notification should allow the user to view the event gallery.

Clicking View Event Gallery marks the notification as read and routes the user to the relevant event results page.

### Access Request Notification

When another attendee requests access to a person’s photos in a private event, the recipient sees an access request notification.

The notification includes:

- Requesting user.
- Event name.
- Approve button.
- Deny button.

Clicking Approve:

- Grants access to the requesting user for that person within that private event.
- Marks the notification as read.
- Greys out the notification.
- Updates the requesting user’s `PrivateResults.jsx` access state.

Clicking Deny:

- Does not grant access.
- Marks the notification as read.
- Greys out the notification.
- Updates the request state so it is no longer pending.

### Mark All As Read

Notifications includes a Mark All As Read button.

Clicking it:

- Marks all notifications as read.
- Greys out all notifications.
- Does not automatically approve or deny pending access requests unless an explicit approve/deny action was chosen.

## Request Organiser Access

`RequestOrganiserAccess.jsx` is shown when an authenticated user without organiser privileges clicks the organiser dashboard button in the navbar.

By default, every signed-up user is only an attendee. This page lets them request organiser access.

The request should be sent to the backend and become visible in the admin interface.

This page uses the authenticated navbar.

## Admin

`Admin.jsx` is the restricted admin page.

This page allows the project owner to:

- View organiser access requests.
- Approve organiser access.
- Deny organiser access.
- Search users through a convenience search bar.

### Admin Access Model

The admin page should use a simple but server-side protected access key flow.

The admin password/key must be stored in a server-side `.env` file and must never be hardcoded into React frontend code.

Expected flow:

1. Admin enters the access key in the admin UI.
2. Frontend sends the key to a backend API route.
3. Backend compares the submitted key against the server-side environment variable.
4. If valid, backend returns the protected admin data.
5. If invalid, backend denies access.

The frontend must never contain the list of organiser requests until after the backend verifies the admin key.

The backend may use the Supabase service role key for trusted admin operations.

## Organiser Dashboard

`OrganiserDashboard.jsx` is shown when an authenticated user with organiser access clicks the organiser dashboard button in the navbar.

This page lists all events created by the organiser.

It includes metrics such as:

- Total number of events.
- Total number of uploaded photos.

Each event card should show available event information. Optional fields should be omitted when missing. If no event image exists, a placeholder should be shown.

The page includes:

- Create Event button.
- Manage Event button on each event.

Clicking Create Event opens `CreateEvent.jsx` with an empty event form.

Clicking Manage Event opens `CreateEvent.jsx` with the selected event’s existing data preloaded.

Organisers can invite themselves to events. If an organiser views their own event from Event Discovery, they see the attendee view, not the organiser editing view. Editing is only reached from the Organiser Dashboard path.

## Create Event

`CreateEvent.jsx` is used for both creating and managing events.

The page uses the authenticated navbar.

The page has three tabs:

- Details.
- Attendees.
- Photos.

The top-right area contains Save and Publish controls.

When opened from Create Event, the form starts empty.

When opened from Manage Event, the form loads the existing event data.

### Details Tab

The details tab contains:

- Event name.
- Date.
- Location.
- Organising company.
- Event image or cover image.
- Event status selector.
- Privacy type selector.

Mandatory fields for saving and publishing:

- Event name.
- Date.
- Location.

Optional fields:

- Organising company.
- Cover image.

Selectors do not need mandatory symbols because they have defaults:

- Event status default: draft.
- Privacy type default: private.

Publishing options:

- Draft.
- Upcoming.
- Completed.

Drafts do not need every optional piece of data to be filled. The backend and frontend should handle missing optional data gracefully.

### Attendees Tab

The attendees tab lets the organiser add attendee emails.

Attendee emails may come from an external event management platform, WhatsApp, or any other informal collection process.

Important behavior:

- Access is email-based.
- A person who has not created an account yet can still be added by email.
- When that person later signs up with the same email, the event becomes accessible to them.
- If they sign up with a different email, they do not get access.
- Organisers can add themselves as attendees.

The organiser can revoke event access by deleting an email from the attendee list.

Removing an attendee should remove their access to discover that event from the attendee side.

### Photos Tab

The photos tab is the event gallery management area.

It allows:

- Single photo upload.
- Batch photo upload.
- Viewing uploaded photos.
- Removing uploaded photos.

Photo removal options:

- Hover over a photo and click Delete.
- Enter select mode, select multiple photos, and click Delete.

Save and Publish should persist all event updates and ensure changes reflect across:

- Organiser Dashboard.
- Event Discovery.
- Public Results.
- Private Results.
- My Photos where applicable.

## Profile And Settings

`ProfileAndSettings.jsx` is accessible from the authenticated navbar.

The page lets the user:

- Edit display name.
- Edit display picture.
- Edit verification selfie using the same face validation method as account setup.
- View registered email.
- Sign out.

The registered email is read-only and cannot be edited from this page.

Updating the verification selfie should reuse the same faceapi or MediaPipe / Google AI Edge validation approach used in `AccountSetupStep2.jsx`.

## Face Matching And Photo Metadata

The app needs to know which people appear in which photos so it can power:

- My Photos people hover previews.
- My Photos people filters.
- Public Results people filters.
- Private Results people filters.
- Private Results access control.

For the demo, the implementation can keep the face-matching pipeline simple, but the data model should support associating photos with detected or known people.

At minimum, each uploaded photo should be able to store:

- Owning event.
- Storage path or public/signed URL reference.
- Uploaded by organiser.
- People detected or associated with the photo.
- Whether the photo has been added to a user’s My Photos.

The exact face-recognition depth can be kept practical for the demo, but the source-of-truth selfie remains required and should be represented in user profile state.

## Suggested Data Model

The exact schema can evolve during implementation, but the app should support these core entities.

### Profiles

Stores user-facing profile data linked to Supabase Auth users.

Fields may include:

- User ID.
- Email.
- Display name.
- Display picture storage path.
- Verification selfie storage path.
- Face verification completed flag.
- Role or organiser access status.
- Created at.
- Updated at.

### Organiser Requests

Stores requests from attendees asking to become organisers.

Fields may include:

- Request ID.
- User ID.
- Status: pending, approved, denied.
- Created at.
- Reviewed at.
- Reviewed by admin marker.

### Events

Stores organiser-created event records.

Fields may include:

- Event ID.
- Organiser user ID.
- Name.
- Date.
- Location.
- Organising company.
- Cover image storage path.
- Status: draft, upcoming, completed.
- Privacy: public, private.
- Created at.
- Updated at.

### Event Attendees

Stores attendee access by email.

Fields may include:

- Event attendee ID.
- Event ID.
- Email.
- Matched user ID, if that email has signed up.
- Created at.

### Event Photos

Stores uploaded event photos.

Fields may include:

- Photo ID.
- Event ID.
- Storage path.
- Uploaded by user ID.
- Created at.

### Photo People

Stores which people appear in a photo.

Fields may include:

- Photo ID.
- Person user ID or person profile ID.
- Match confidence.
- Created at.

### My Photos

Stores photos a user intentionally saved to their personal gallery.

Fields may include:

- User ID.
- Photo ID.
- Added at.

### Private Access Requests

Stores access requests for private event people.

Fields may include:

- Request ID.
- Event ID.
- Requester user ID.
- Target user ID.
- Status: pending, approved, denied.
- Created at.
- Resolved at.

### Notifications

Stores user notifications.

Fields may include:

- Notification ID.
- Recipient user ID.
- Type: added_to_event, private_access_request.
- Related event ID.
- Related requester user ID.
- Related target user ID.
- Related request ID.
- Read flag.
- Created at.
- Read at.

## Backend Responsibilities

The Express backend should handle trusted operations such as:

- Admin key verification.
- Listing organiser access requests after admin verification.
- Approving or denying organiser requests.
- Creating organiser access request records.
- Creating and updating events.
- Managing attendee email lists.
- Managing event photo records.
- Creating notifications.
- Approving or denying private access requests.
- Using Supabase service role operations where browser-side permissions are not appropriate.

The backend should validate that the authenticated user is allowed to perform each action.

Examples:

- Only organisers can create events.
- Only the organiser who owns an event can manage that event.
- Only admin can approve organiser access.
- Only notification recipients can approve or deny private access requests targeted at them.

## Frontend Routing Overview

Expected high-level routes:

- `/`: Landing page.
- `/auth`: Account setup step 1.
- `/setup/selfie`: Account setup step 2.
- `/my-photos`: My Photos.
- `/events`: Event Discovery.
- `/events/:eventId/public`: Public Results.
- `/events/:eventId/private`: Private Results.
- `/notifications`: Notifications.
- `/organiser/request`: Request Organiser Access.
- `/organiser/dashboard`: Organiser Dashboard.
- `/organiser/events/new`: Create Event.
- `/organiser/events/:eventId/edit`: Manage Event through Create Event.
- `/profile`: Profile And Settings.
- `/admin`: Admin.

Route guards should enforce:

- Unauthenticated users cannot access authenticated pages.
- Authenticated users without completed face verification are redirected to selfie setup.
- Authenticated users with completed face verification should not be stuck in setup pages.
- Non-organisers go to Request Organiser Access when trying to open organiser dashboard.
- Organisers go to Organiser Dashboard.
- Admin data is not loaded until the server verifies the admin key.

## Demo Scope And Non-Goals

This app is a focused demo, not a production-scale event platform.

Explicitly out of scope for the current build:

- Real download implementation for My Photos.
- Real bulk download implementation.
- Revoking already granted private photo access.
- Redis.
- Job queues.
- Docker.
- Large-scale concurrent users.
- Complex enterprise admin roles.

UI elements for dummy download actions should still exist, because they are part of the intended user experience.

## Implementation Notes

- Do not modify the `/dump` folder.
- Treat `/dump` pages as visual and behavior references.
- Build the real app in separate root-level `frontend` and `backend` folders.
- Keep the navbar as one reusable authenticated component.
- Keep unauthenticated pages free of the authenticated navbar.
- Keep Public Results and Private Results free of the authenticated navbar.
- Use Supabase Auth as the identity source.
- Use email-based event attendee access.
- Store face verification completion state in persistent profile data.
- Keep optional event fields truly optional in both backend and frontend rendering.
- Ensure request and notification state changes are reflected for both involved users.

