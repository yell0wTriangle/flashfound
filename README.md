# FlashFound

FlashFound is a smart event gallery app where organisers create and manage events, upload photos, and invite attendees by email, while attendees discover event photos, request private access, and save pictures to **My Photos**.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth / DB / Storage: Supabase (Auth, Postgres, Storage)

## Project Structure

- `frontend/` - Vite React app
- `backend/` - Express API service
- `backend/supabase/migrations/` - SQL migrations
- `dump/` - original design exports (reference only)

## Local Setup

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://127.0.0.1:8080`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend runs on `http://127.0.0.1:5173`.

## Notes

- Configure Supabase project keys in `backend/.env` and `frontend/.env`.
- Ensure CORS origin matches frontend URL.
- Private event matching uses 128D face descriptors:
  - `FACE_MATCH_MAX_DISTANCE=0.55`
  - `FACE_MATCH_MIN_DISTANCE_MARGIN=0.05`
  - `FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE=0.5`

## Deployment

### Backend on Railway

Create a Railway service from this GitHub repo and set the service root directory to `backend`.
Railway will use `backend/railway.json`, run the Node/Nixpacks build, start with `npm start`,
and health-check `/api/v1/health`.

Set these Railway variables:

- `NODE_ENV=production`
- `FRONTEND_ORIGIN=https://your-frontend-domain`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_KEY`
- `EVENT_PHOTOS_BUCKET=event-photos`
- `FACE_MATCH_MAX_DISTANCE=0.55`
- `FACE_MATCH_MIN_DISTANCE_MARGIN=0.05`
- `FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE=0.5`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend.

### Frontend on Vercel

Set the project root directory to `frontend`, build command to `npm run build`, and output
directory to `dist`.

Set these Vercel variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL=https://your-railway-backend-domain/api/v1`

In Supabase Auth, set the site URL and redirect URLs to the deployed frontend domain.
