create table if not exists public.official_social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('tiktok', 'facebook')),
  source_name text not null check (char_length(source_name) between 2 and 160),
  source_account_url text not null,
  post_url text not null unique,
  title text not null check (char_length(title) between 8 and 280),
  category text not null check (
    category in (
      'clima',
      'inundacion',
      'incendio',
      'movilidad',
      'rescate',
      'sismo',
      'huracan',
      'quimico',
      'agua',
      'infraestructura',
      'otro'
    )
  ),
  published_at timestamptz not null default now(),
  thumbnail_url text,
  is_verified boolean not null default true,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_social_posts_tiktok_url check (
    platform <> 'tiktok'
    or post_url ~* '^https://(www\.|vm\.|vt\.)?tiktok\.com/'
  )
);

create index if not exists official_social_posts_recent_idx
  on public.official_social_posts (published_at desc)
  where is_active = true and is_verified = true;

alter table public.official_social_posts enable row level security;

drop policy if exists "Public reads verified emergency social posts"
  on public.official_social_posts;
create policy "Public reads verified emergency social posts"
on public.official_social_posts for select
to anon, authenticated
using (
  is_verified = true
  and is_active = true
  and (expires_at is null or expires_at > now())
);

drop policy if exists "Operators insert official social posts"
  on public.official_social_posts;
create policy "Operators insert official social posts"
on public.official_social_posts for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('operator', 'admin')
  and created_by = (select auth.uid())
);

drop policy if exists "Operators update official social posts"
  on public.official_social_posts;
create policy "Operators update official social posts"
on public.official_social_posts for update
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('operator', 'admin'))
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('operator', 'admin'));

drop policy if exists "Operators delete official social posts"
  on public.official_social_posts;
create policy "Operators delete official social posts"
on public.official_social_posts for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('operator', 'admin'));

do $$
begin
  alter publication supabase_realtime add table public.official_social_posts;
exception
  when duplicate_object then null;
end $$;
