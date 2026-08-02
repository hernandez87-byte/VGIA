create schema if not exists private;
revoke all on schema private from public;

alter table public.emergency_events
  add column if not exists is_simulation boolean not null default false,
  add column if not exists instructions jsonb not null default '[]'::jsonb;

alter table public.resources
  add column if not exists is_simulation boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.road_closures
  add column if not exists is_simulation boolean not null default false;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger emergency_events_set_updated_at
before update on public.emergency_events
for each row execute function private.set_updated_at();

create trigger resources_set_updated_at
before update on public.resources
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop policy if exists "Public can read public resources" on public.resources;
create policy "Public can read verified public resources"
on public.resources for select
to anon, authenticated
using (
  is_public = true
  and verification in ('official', 'verified', 'corroborated')
);

create policy "Public can read active hazard zones"
on public.hazard_zones for select
to anon, authenticated
using (
  exists (
    select 1
    from public.emergency_events e
    where e.id = hazard_zones.event_id
      and e.verification in ('official', 'verified', 'corroborated')
      and (e.expires_at is null or e.expires_at > now())
  )
);

create policy "Public can read active road closures"
on public.road_closures for select
to anon, authenticated
using (
  verification in ('official', 'verified', 'corroborated')
  and (expires_at is null or expires_at > now())
);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own reports"
on public.citizen_reports for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own reports"
on public.citizen_reports for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can manage family members"
on public.family_members for all
to authenticated
using (
  exists (
    select 1
    from public.family_groups g
    where g.id = family_members.group_id
      and g.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.family_groups g
    where g.id = family_members.group_id
      and g.owner_user_id = (select auth.uid())
  )
);

create policy "Users can update own checkins"
on public.safety_checkins for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own checkins"
on public.safety_checkins for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.emergency_events, public.hazard_zones, public.resources, public.road_closures to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.citizen_reports to authenticated;
grant select, insert, update, delete on public.family_groups, public.family_members, public.safety_checkins to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace view public.active_events_public
with (security_invoker = true)
as
select
  id,
  hazard,
  title,
  summary,
  severity,
  verification,
  source_name,
  source_url,
  starts_at,
  expires_at,
  is_simulation,
  instructions,
  case
    when affected_area is null then null
    else public.st_asgeojson(affected_area)::jsonb
  end as affected_area
from public.emergency_events
where expires_at is null or expires_at > now();

create or replace view public.active_hazard_zones_public
with (security_invoker = true)
as
select
  id,
  event_id,
  risk_score,
  expected_depth_m,
  expected_arrival_at,
  public.st_asgeojson(geometry)::jsonb as geometry,
  properties,
  created_at
from public.hazard_zones;

create or replace view public.public_resources_public
with (security_invoker = true)
as
select
  id,
  category,
  name,
  description,
  address,
  status,
  verification,
  capacity,
  capacity_unit,
  is_simulation,
  metadata,
  last_verified_at,
  public.st_y(location::public.geometry) as latitude,
  public.st_x(location::public.geometry) as longitude
from public.resources;

create or replace view public.active_road_closures_public
with (security_invoker = true)
as
select
  id,
  event_id,
  reason,
  verification,
  is_simulation,
  starts_at,
  expires_at,
  public.st_asgeojson(geometry)::jsonb as geometry
from public.road_closures
where expires_at is null or expires_at > now();

grant select on public.active_events_public,
  public.active_hazard_zones_public,
  public.public_resources_public,
  public.active_road_closures_public
to anon, authenticated;

create or replace function public.nearby_resources(
  user_latitude double precision,
  user_longitude double precision,
  radius_meters integer default 15000,
  result_limit integer default 20
)
returns table (
  id uuid,
  category public.resource_category,
  name text,
  description text,
  address text,
  status text,
  verification public.verification_level,
  distance_meters double precision,
  latitude double precision,
  longitude double precision,
  last_verified_at timestamptz,
  is_simulation boolean,
  metadata jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.id,
    r.category,
    r.name,
    r.description,
    r.address,
    r.status,
    r.verification,
    public.st_distance(
      r.location,
      public.st_setsrid(
        public.st_makepoint(user_longitude, user_latitude),
        4326
      )::public.geography
    ) as distance_meters,
    public.st_y(r.location::public.geometry) as latitude,
    public.st_x(r.location::public.geometry) as longitude,
    r.last_verified_at,
    r.is_simulation,
    r.metadata
  from public.resources r
  where public.st_dwithin(
    r.location,
    public.st_setsrid(
      public.st_makepoint(user_longitude, user_latitude),
      4326
    )::public.geography,
    greatest(radius_meters, 0)
  )
  order by distance_meters asc
  limit least(greatest(result_limit, 1), 100);
$$;

grant execute on function public.nearby_resources(
  double precision,
  double precision,
  integer,
  integer
) to anon, authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'report-evidence',
  'report-evidence',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/mp4'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload own report evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users read own report evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users update own report evidence"
on storage.objects for update
to authenticated
using (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete own report evidence"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'emergency_events'
    ) then
      alter publication supabase_realtime add table public.emergency_events;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'resources'
    ) then
      alter publication supabase_realtime add table public.resources;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'road_closures'
    ) then
      alter publication supabase_realtime add table public.road_closures;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'hazard_zones'
    ) then
      alter publication supabase_realtime add table public.hazard_zones;
    end if;
  end if;
end $$;
