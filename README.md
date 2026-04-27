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
