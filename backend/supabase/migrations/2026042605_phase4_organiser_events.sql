-- Phase 4: organiser event management constraints and grants

alter table public.events
  alter column name drop not null,
  alter column event_date drop not null,
  alter column location drop not null;

alter table public.events
  drop constraint if exists events_publish_required_fields_check;

alter table public.events
  add constraint events_publish_required_fields_check check (
    status = 'draft'
    or (
      name is not null and btrim(name) <> ''
      and event_date is not null
      and location is not null and btrim(location) <> ''
    )
  );

create index if not exists events_organiser_user_id_idx on public.events (organiser_user_id);

grant insert, update, delete on table public.events to authenticated;
grant insert, update, delete on table public.event_attendees to authenticated;
grant insert, update, delete on table public.event_photos to authenticated;

