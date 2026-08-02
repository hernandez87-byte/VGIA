-- Supabase/PostGIS puede volver a conceder estos permisos mediante mecanismos
-- administrados por la extensión. El asesor debe revisarse después de upgrades.
revoke execute on function public.st_estimatedextent(text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean)
  from public, anon, authenticated;
