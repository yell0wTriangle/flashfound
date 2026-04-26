-- Phase 5: private access requests and notification workflow

create table if not exists public.private_access_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  unique (event_id, requester_user_id, target_user_id, status)
);

create index if not exists private_access_requests_event_id_idx
  on public.private_access_requests (event_id);
create index if not exists private_access_requests_requester_idx
  on public.private_access_requests (requester_user_id);
create index if not exists private_access_requests_target_idx
  on public.private_access_requests (target_user_id);

create table if not exists public.private_access_grants (
  event_id uuid not null references public.events (id) on delete cascade,
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  granted_at timestamptz not null default timezone('utc', now()),
  primary key (event_id, requester_user_id, target_user_id)
);

create index if not exists private_access_grants_requester_idx
  on public.private_access_grants (requester_user_id);
create index if not exists private_access_grants_target_idx
  on public.private_access_grants (target_user_id);

alter table public.notifications
  add column if not exists event_id uuid references public.events (id) on delete set null,
  add column if not exists requester_user_id uuid references auth.users (id) on delete set null,
  add column if not exists target_user_id uuid references auth.users (id) on delete set null,
  add column if not exists private_access_request_id uuid references public.private_access_requests (id) on delete set null;

create index if not exists notifications_private_access_request_id_idx
  on public.notifications (private_access_request_id);
create index if not exists notifications_created_at_idx
  on public.notifications (created_at);

alter table public.private_access_requests enable row level security;
alter table public.private_access_grants enable row level security;

drop policy if exists private_access_requests_select_own on public.private_access_requests;
create policy private_access_requests_select_own
on public.private_access_requests
for select
to authenticated
using (auth.uid() = requester_user_id or auth.uid() = target_user_id);

drop policy if exists private_access_requests_insert_requester on public.private_access_requests;
create policy private_access_requests_insert_requester
on public.private_access_requests
for insert
to authenticated
with check (auth.uid() = requester_user_id);

drop policy if exists private_access_requests_update_target on public.private_access_requests;
create policy private_access_requests_update_target
on public.private_access_requests
for update
to authenticated
using (auth.uid() = target_user_id)
with check (auth.uid() = target_user_id);

drop policy if exists private_access_grants_select_own on public.private_access_grants;
create policy private_access_grants_select_own
on public.private_access_grants
for select
to authenticated
using (auth.uid() = requester_user_id or auth.uid() = target_user_id);

grant all privileges on table public.private_access_requests to service_role;
grant all privileges on table public.private_access_grants to service_role;

grant select, insert, update on table public.private_access_requests to authenticated;
grant select on table public.private_access_grants to authenticated;

