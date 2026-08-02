create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.hazard_type as enum (
  'flood',
  'fire',
  'earthquake',
  'hurricane',
  'chemical',
  'drought',
  'cosmic_impact',
  'infrastructure',
  'public_safety'
);

create type public.verification_level as enum (
  'official',
  'verified',
  'corroborated',
  'unverified',
  'rejected'
);

create type public.resource_category as enum (
  'shelter',
  'water',
  'medical',
  'food',
  'energy',
  'hardware',
  'communications'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  emergency_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  hazard public.hazard_type not null,
  title text not null,
  summary text not null,
  severity smallint not null check (severity between 0 and 100),
  verification public.verification_level not null default 'unverified',
  source_name text not null,
  source_url text,
  affected_area geometry(multipolygon, 4326),
  starts_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emergency_events_area_gix on public.emergency_events using gist (affected_area);
create index emergency_events_active_idx on public.emergency_events (starts_at, expires_at);

create table public.hazard_zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.emergency_events(id) on delete cascade,
  risk_score smallint not null check (risk_score between 0 and 100),
  expected_depth_m numeric,
  expected_arrival_at timestamptz,
  geometry geometry(multipolygon, 4326) not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hazard_zones_geometry_gix on public.hazard_zones using gist (geometry);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  category public.resource_category not null,
  name text not null,
  description text,
  location geography(point, 4326) not null,
  address text,
  status text not null default 'unknown' check (status in ('available', 'limited', 'closed', 'unknown')),
  verification public.verification_level not null default 'unverified',
  capacity numeric,
  capacity_unit text,
  is_public boolean not null default true,
  owner_user_id uuid references auth.users(id) on delete set null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_location_gix on public.resources using gist (location);
create index resources_category_status_idx on public.resources (category, status);

create table public.road_closures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.emergency_events(id) on delete set null,
  reason text not null,
  verification public.verification_level not null default 'unverified',
  geometry geometry(multilinestring, 4326) not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index road_closures_geometry_gix on public.road_closures using gist (geometry);

create table public.citizen_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_id uuid references public.emergency_events(id) on delete set null,
  category text not null,
  description text not null,
  location geography(point, 4326) not null,
  evidence_paths text[] not null default '{}',
  verification public.verification_level not null default 'unverified',
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index citizen_reports_location_gix on public.citizen_reports using gist (location);

create table public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  group_id uuid not null references public.family_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  primary key (group_id, user_id)
);

create table public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.emergency_events(id) on delete set null,
  status text not null check (status in ('safe', 'moving', 'needs_help', 'unknown')),
  location geography(point, 4326),
  location_label text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index safety_checkins_location_gix on public.safety_checkins using gist (location);

alter table public.profiles enable row level security;
alter table public.emergency_events enable row level security;
alter table public.hazard_zones enable row level security;
alter table public.resources enable row level security;
alter table public.road_closures enable row level security;
alter table public.citizen_reports enable row level security;
alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;
alter table public.safety_checkins enable row level security;

create policy "Public can read verified active events"
on public.emergency_events for select
to anon, authenticated
using (
  verification in ('official', 'verified', 'corroborated')
  and (expires_at is null or expires_at > now())
);

create policy "Public can read public resources"
on public.resources for select
to anon, authenticated
using (is_public = true);

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can create reports"
on public.citizen_reports for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read own reports"
on public.citizen_reports for select
to authenticated
using (auth.uid() = user_id);

create policy "Owners can manage family groups"
on public.family_groups for all
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Members can read family membership"
on public.family_members for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = auth.uid()
  )
);

create policy "Users can create own checkins"
on public.safety_checkins for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Family members can read active checkins"
on public.safety_checkins for select
to authenticated
using (
  expires_at > now()
  and exists (
    select 1
    from public.family_members members
    where members.group_id = safety_checkins.group_id
      and members.user_id = auth.uid()
  )
);
