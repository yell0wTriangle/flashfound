-- Phase 8 + 9: face indexing and auto matching

alter table public.profiles
  add column if not exists verification_face_embedding jsonb;

alter table public.face_verification_sessions
  add column if not exists face_embedding jsonb;

alter table public.event_photos
  add column if not exists face_processing_status text not null default 'pending'
    check (face_processing_status in ('pending', 'processed', 'failed')),
  add column if not exists face_processing_error text,
  add column if not exists face_processed_at timestamptz;

create index if not exists event_photos_face_processing_status_idx
  on public.event_photos (face_processing_status);

create table if not exists public.photo_faces (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.event_photos (id) on delete cascade,
  face_index int not null,
  face_box jsonb not null default '{}'::jsonb,
  keypoints jsonb not null default '[]'::jsonb,
  embedding jsonb not null,
  confidence numeric(6,5),
  status text not null default 'processed' check (status in ('processed', 'failed')),
  failure_code text,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz not null default timezone('utc', now()),
  unique (photo_id, face_index)
);

create index if not exists photo_faces_photo_id_idx on public.photo_faces (photo_id);
create index if not exists photo_faces_status_idx on public.photo_faces (status);

alter table public.photo_faces enable row level security;

drop policy if exists photo_faces_select_by_photo on public.photo_faces;
create policy photo_faces_select_by_photo
on public.photo_faces
for select
to authenticated
using (
  exists (
    select 1
    from public.event_photos ep
    join public.events e on e.id = ep.event_id
    join public.event_attendees ea on ea.event_id = e.id
    where ep.id = photo_faces.photo_id
      and (
        ea.user_id = auth.uid()
        or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

grant all privileges on table public.photo_faces to service_role;
grant select on table public.photo_faces to authenticated;
