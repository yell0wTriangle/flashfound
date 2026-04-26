-- Phase 2: attendee-side event discovery, results, and my_photos core

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organiser_user_id uuid references auth.users (id) on delete set null,
  organiser_name text not null default 'Unknown organiser',
  name text not null,
  event_date date not null,
  location text not null,
  organising_company text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'upcoming', 'completed')),
  privacy_type text not null default 'private' check (privacy_type in ('public', 'private')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create index if not exists events_privacy_type_idx on public.events (privacy_type);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_event_date_idx on public.events (event_date);

-- Event attendees
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, email)
);

create index if not exists event_attendees_event_id_idx on public.event_attendees (event_id);
create index if not exists event_attendees_email_idx on public.event_attendees (email);
create index if not exists event_attendees_user_id_idx on public.event_attendees (user_id);

-- Event photos
create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null,
  image_url text,
  uploaded_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists event_photos_event_id_idx on public.event_photos (event_id);

-- Photo people
create table if not exists public.photo_people (
  photo_id uuid not null references public.event_photos (id) on delete cascade,
  person_user_id uuid not null references auth.users (id) on delete cascade,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (photo_id, person_user_id)
);

create index if not exists photo_people_photo_id_idx on public.photo_people (photo_id);
create index if not exists photo_people_person_user_id_idx on public.photo_people (person_user_id);

-- My photos
create table if not exists public.my_photos (
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_id uuid not null references public.event_photos (id) on delete cascade,
  added_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, photo_id)
);

create index if not exists my_photos_photo_id_idx on public.my_photos (photo_id);
create index if not exists my_photos_added_at_idx on public.my_photos (added_at);

-- RLS enablement
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_photos enable row level security;
alter table public.photo_people enable row level security;
alter table public.my_photos enable row level security;

-- Events: visible to authenticated users that are attendees by user_id or jwt email
drop policy if exists events_select_attendee on public.events;
create policy events_select_attendee
on public.events
for select
to authenticated
using (
  exists (
    select 1
    from public.event_attendees ea
    where ea.event_id = events.id
      and (
        ea.user_id = auth.uid()
        or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- Event attendees: can read own attendee mapping rows
drop policy if exists event_attendees_select_own on public.event_attendees;
create policy event_attendees_select_own
on public.event_attendees
for select
to authenticated
using (
  user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Event photos: visible through accessible event
drop policy if exists event_photos_select_by_event on public.event_photos;
create policy event_photos_select_by_event
on public.event_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    join public.event_attendees ea on ea.event_id = e.id
    where e.id = event_photos.event_id
      and (
        ea.user_id = auth.uid()
        or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- Photo people: visible through accessible photo/event
drop policy if exists photo_people_select_by_photo on public.photo_people;
create policy photo_people_select_by_photo
on public.photo_people
for select
to authenticated
using (
  exists (
    select 1
    from public.event_photos ep
    join public.events e on e.id = ep.event_id
    join public.event_attendees ea on ea.event_id = e.id
    where ep.id = photo_people.photo_id
      and (
        ea.user_id = auth.uid()
        or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- My photos: user owns own rows only
drop policy if exists my_photos_select_own on public.my_photos;
create policy my_photos_select_own
on public.my_photos
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists my_photos_insert_own on public.my_photos;
create policy my_photos_insert_own
on public.my_photos
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists my_photos_delete_own on public.my_photos;
create policy my_photos_delete_own
on public.my_photos
for delete
to authenticated
using (user_id = auth.uid());

-- Explicit grants for API roles
grant all privileges on table public.events to service_role;
grant all privileges on table public.event_attendees to service_role;
grant all privileges on table public.event_photos to service_role;
grant all privileges on table public.photo_people to service_role;
grant all privileges on table public.my_photos to service_role;

grant select on table public.events to authenticated;
grant select on table public.event_attendees to authenticated;
grant select on table public.event_photos to authenticated;
grant select on table public.photo_people to authenticated;
grant select, insert, delete on table public.my_photos to authenticated;

