-- Phase 3: organiser requests and admin approval audit

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null check (action in ('organiser_request_approved', 'organiser_request_denied')),
  organiser_request_id uuid references public.organiser_requests (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs (action);
create index if not exists admin_audit_logs_target_user_id_idx on public.admin_audit_logs (target_user_id);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at);

grant all privileges on table public.admin_audit_logs to service_role;

