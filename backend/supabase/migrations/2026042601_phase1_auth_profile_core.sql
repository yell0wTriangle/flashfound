-- Phase 1: Data model and auth/profile core

-- Shared trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  display_avatar_url text,
  verification_selfie_url text,
  face_verification_completed boolean not null default false,
  role text not null default 'attendee' check (role in ('attendee', 'organiser', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Organiser requests
create table if not exists public.organiser_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create index if not exists organiser_requests_user_id_idx on public.organiser_requests (user_id);
create index if not exists organiser_requests_status_idx on public.organiser_requests (status);
create unique index if not exists organiser_requests_one_pending_per_user_idx
on public.organiser_requests (user_id)
where status = 'pending';

alter table public.organiser_requests enable row level security;

drop policy if exists organiser_requests_select_own on public.organiser_requests;
create policy organiser_requests_select_own
on public.organiser_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists organiser_requests_insert_own on public.organiser_requests;
create policy organiser_requests_insert_own
on public.organiser_requests
for insert
to authenticated
with check (auth.uid() = user_id);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('added_to_event', 'private_access_request')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create index if not exists notifications_recipient_user_id_idx on public.notifications (recipient_user_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (auth.uid() = recipient_user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (auth.uid() = recipient_user_id)
with check (auth.uid() = recipient_user_id);

