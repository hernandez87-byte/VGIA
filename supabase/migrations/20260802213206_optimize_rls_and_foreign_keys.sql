create index if not exists citizen_reports_event_id_idx
  on public.citizen_reports(event_id);
create index if not exists citizen_reports_user_id_idx
  on public.citizen_reports(user_id);
create index if not exists family_groups_owner_user_id_idx
  on public.family_groups(owner_user_id);
create index if not exists family_members_user_id_idx
  on public.family_members(user_id);
create index if not exists hazard_zones_event_id_idx
  on public.hazard_zones(event_id);
create index if not exists resources_owner_user_id_idx
  on public.resources(owner_user_id)
  where owner_user_id is not null;
create index if not exists road_closures_event_id_idx
  on public.road_closures(event_id)
  where event_id is not null;
create index if not exists safety_checkins_event_id_idx
  on public.safety_checkins(event_id)
  where event_id is not null;
create index if not exists safety_checkins_group_id_idx
  on public.safety_checkins(group_id);
create index if not exists safety_checkins_user_id_idx
  on public.safety_checkins(user_id);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can create reports" on public.citizen_reports;
create policy "Users can create reports"
on public.citizen_reports for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own reports" on public.citizen_reports;
create policy "Users can read own reports"
on public.citizen_reports for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners can manage family groups" on public.family_groups;
create policy "Owners can manage family groups"
on public.family_groups for all
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Members can read family membership" on public.family_members;
create policy "Members and owners can read family membership"
on public.family_members for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can manage family members" on public.family_members;
create policy "Owners can add family members"
on public.family_members for insert
to authenticated
with check (
  exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = (select auth.uid())
  )
);

create policy "Owners can update family members"
on public.family_members for update
to authenticated
using (
  exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = (select auth.uid())
  )
);

create policy "Owners can delete family members"
on public.family_members for delete
to authenticated
using (
  exists (
    select 1
    from public.family_groups groups
    where groups.id = family_members.group_id
      and groups.owner_user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create own checkins" on public.safety_checkins;
create policy "Users can create own checkins"
on public.safety_checkins for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Family members can read active checkins" on public.safety_checkins;
create policy "Family members can read active checkins"
on public.safety_checkins for select
to authenticated
using (
  expires_at > now()
  and exists (
    select 1
    from public.family_members members
    where members.group_id = safety_checkins.group_id
      and members.user_id = (select auth.uid())
  )
);
