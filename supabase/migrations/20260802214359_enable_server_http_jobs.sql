create extension if not exists pg_net with schema extensions;

revoke all on schema net from public, anon, authenticated;
revoke execute on all functions in schema net from public, anon, authenticated;
grant usage on schema net to service_role;
grant execute on all functions in schema net to service_role;
