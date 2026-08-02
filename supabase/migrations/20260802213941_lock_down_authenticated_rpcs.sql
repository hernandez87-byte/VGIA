revoke execute on function public.submit_citizen_report(
  text,
  text,
  double precision,
  double precision,
  uuid,
  timestamptz
) from public, anon;

revoke execute on function public.create_family_group(text)
  from public, anon;

revoke execute on function public.create_safety_checkin(
  uuid,
  text,
  text,
  double precision,
  double precision,
  uuid
) from public, anon;

grant execute on function public.submit_citizen_report(
  text,
  text,
  double precision,
  double precision,
  uuid,
  timestamptz
) to authenticated;

grant execute on function public.create_family_group(text)
  to authenticated;

grant execute on function public.create_safety_checkin(
  uuid,
  text,
  text,
  double precision,
  double precision,
  uuid
) to authenticated;
