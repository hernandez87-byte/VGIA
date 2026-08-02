drop policy if exists "Owners can manage family groups" on public.family_groups;
create policy "Members and owners can read family groups"
on public.family_groups for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or exists (
    select 1
    from public.family_members members
    where members.group_id = family_groups.id
      and members.user_id = (select auth.uid())
  )
);
create policy "Owners can create family groups"
on public.family_groups for insert
to authenticated
with check (owner_user_id = (select auth.uid()));
create policy "Owners can update family groups"
on public.family_groups for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));
create policy "Owners can delete family groups"
on public.family_groups for delete
to authenticated
using (owner_user_id = (select auth.uid()));

create or replace function public.submit_citizen_report(
  report_category text,
  report_description text,
  report_latitude double precision,
  report_longitude double precision,
  report_event_id uuid default null,
  report_expires_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_report_id uuid;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if report_latitude < -90 or report_latitude > 90
     or report_longitude < -180 or report_longitude > 180 then
    raise exception 'invalid coordinates';
  end if;
  if length(trim(report_category)) < 2 or length(trim(report_category)) > 80 then
    raise exception 'invalid category';
  end if;
  if length(trim(report_description)) < 5 or length(trim(report_description)) > 2000 then
    raise exception 'invalid description';
  end if;

  insert into public.citizen_reports (
    user_id, event_id, category, description, location, observed_at, expires_at
  ) values (
    current_user_id,
    report_event_id,
    trim(report_category),
    trim(report_description),
    public.st_setsrid(
      public.st_makepoint(report_longitude, report_latitude),
      4326
    )::public.geography,
    now(),
    coalesce(report_expires_at, now() + interval '6 hours')
  )
  returning id into created_report_id;

  return created_report_id;
end;
$$;

grant execute on function public.submit_citizen_report(
  text, text, double precision, double precision, uuid, timestamptz
) to authenticated;

create or replace function public.create_family_group(group_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_group_id uuid;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if length(trim(group_name)) < 2 or length(trim(group_name)) > 120 then
    raise exception 'invalid group name';
  end if;

  insert into public.family_groups (name, owner_user_id)
  values (trim(group_name), current_user_id)
  returning id into created_group_id;

  insert into public.family_members (group_id, user_id, role)
  values (created_group_id, current_user_id, 'owner');

  return created_group_id;
end;
$$;

grant execute on function public.create_family_group(text) to authenticated;

create or replace function public.create_safety_checkin(
  checkin_group_id uuid,
  checkin_status text,
  checkin_location_label text default null,
  checkin_latitude double precision default null,
  checkin_longitude double precision default null,
  checkin_event_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_checkin_id uuid;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if checkin_status not in ('safe', 'moving', 'needs_help', 'unknown') then
    raise exception 'invalid status';
  end if;
  if not exists (
    select 1
    from public.family_members members
    where members.group_id = checkin_group_id
      and members.user_id = current_user_id
  ) then
    raise exception 'not a family member';
  end if;
  if (checkin_latitude is null) <> (checkin_longitude is null) then
    raise exception 'both coordinates are required';
  end if;
  if checkin_latitude is not null and (
    checkin_latitude < -90 or checkin_latitude > 90
    or checkin_longitude < -180 or checkin_longitude > 180
  ) then
    raise exception 'invalid coordinates';
  end if;

  insert into public.safety_checkins (
    group_id, user_id, event_id, status, location, location_label, expires_at
  ) values (
    checkin_group_id,
    current_user_id,
    checkin_event_id,
    checkin_status,
    case
      when checkin_latitude is null then null
      else public.st_setsrid(
        public.st_makepoint(checkin_longitude, checkin_latitude),
        4326
      )::public.geography
    end,
    nullif(trim(checkin_location_label), ''),
    now() + interval '24 hours'
  )
  returning id into created_checkin_id;

  return created_checkin_id;
end;
$$;

grant execute on function public.create_safety_checkin(
  uuid, text, text, double precision, double precision, uuid
) to authenticated;
