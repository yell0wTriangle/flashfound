-- Phase 7: selfie verification sessions and attempts

create table if not exists public.face_verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'submitted', 'finalized', 'expired')),
  selfie_url text,
  face_count int,
  quality_score numeric(5,4),
  failure_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  finalized_at timestamptz
);

create index if not exists face_verification_sessions_user_id_idx
  on public.face_verification_sessions (user_id);
create index if not exists face_verification_sessions_status_idx
  on public.face_verification_sessions (status);
create index if not exists face_verification_sessions_expires_at_idx
  on public.face_verification_sessions (expires_at);

drop trigger if exists face_verification_sessions_set_updated_at on public.face_verification_sessions;
create trigger face_verification_sessions_set_updated_at
before update on public.face_verification_sessions
for each row execute function public.set_updated_at();

create table if not exists public.face_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.face_verification_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  submitted_selfie_url text not null,
  passed boolean not null,
  face_count int,
  quality_score numeric(5,4),
  failure_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists face_verification_attempts_session_id_idx
  on public.face_verification_attempts (session_id);
create index if not exists face_verification_attempts_user_id_idx
  on public.face_verification_attempts (user_id);

alter table public.face_verification_sessions enable row level security;
alter table public.face_verification_attempts enable row level security;

drop policy if exists face_verification_sessions_select_own on public.face_verification_sessions;
create policy face_verification_sessions_select_own
on public.face_verification_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists face_verification_attempts_select_own on public.face_verification_attempts;
create policy face_verification_attempts_select_own
on public.face_verification_attempts
for select
to authenticated
using (auth.uid() = user_id);

grant all privileges on table public.face_verification_sessions to service_role;
grant all privileges on table public.face_verification_attempts to service_role;

grant select on table public.face_verification_sessions to authenticated;
grant select on table public.face_verification_attempts to authenticated;
