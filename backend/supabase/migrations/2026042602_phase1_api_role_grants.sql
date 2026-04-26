-- Phase 1 follow-up: explicit API role grants
-- Needed when "Automatically expose new tables and functions" is disabled.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on table public.profiles to service_role;
grant select, insert, update on table public.profiles to authenticated;

grant all privileges on table public.organiser_requests to service_role;
grant select, insert on table public.organiser_requests to authenticated;

grant all privileges on table public.notifications to service_role;
grant select, update on table public.notifications to authenticated;

