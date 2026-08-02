create or replace function private.is_family_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_groups groups
    where groups.id = target_group_id
      and groups.owner_user_id = (select auth.uid())
  );
$$;

create or replace function private.is_family_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members members
    where members.group_id = target_group_id
      and members.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_family_owner(uuid) from public, anon;
revoke all on function private.is_family_member(uuid) from public, anon;
grant execute on function private.is_family_owner(uuid) to authenticated;
grant execute on function private.is_family_member(uuid) to authenticated;

drop policy if exists "Members and owners can read family groups" on public.family_groups;
create policy "Members and owners can read family groups"
on public.family_groups for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or private.is_family_member(id)
);

drop policy if exists "Members and owners can read family membership" on public.family_members;
create policy "Members and owners can read family membership"
on public.family_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_family_owner(group_id)
);

drop policy if exists "Owners can add family members" on public.family_members;
create policy "Owners can add family members"
on public.family_members for insert
to authenticated
with check (private.is_family_owner(group_id));

drop policy if exists "Owners can update family members" on public.family_members;
create policy "Owners can update family members"
on public.family_members for update
to authenticated
using (private.is_family_owner(group_id))
with check (private.is_family_owner(group_id));

drop policy if exists "Owners can delete family members" on public.family_members;
create policy "Owners can delete family members"
on public.family_members for delete
to authenticated
using (private.is_family_owner(group_id));

drop policy if exists "Family members can read active checkins" on public.safety_checkins;
create policy "Family members can read active checkins"
on public.safety_checkins for select
to authenticated
using (
  expires_at > now()
  and private.is_family_member(group_id)
);
